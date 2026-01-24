from flask import Flask, request, send_file, jsonify, render_template
import PyPDF2
import io
import os
from werkzeug.utils import secure_filename
import tempfile
import uuid

app = Flask(__name__)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/merge', methods=['POST'])
def merge_pdfs():
    try:
        if 'files[]' not in request.files:
            return jsonify({'error': 'No files uploaded'}), 400
        
        files = request.files.getlist('files[]')
        
        if len(files) < 2:
            return jsonify({'error': 'At least 2 PDF files are required for merging'}), 400
        
        # Validate that all files are PDFs
        for file in files:
            if not file.filename.lower().endswith('.pdf'):
                return jsonify({'error': f'{file.filename} is not a PDF file'}), 400
        
        # Create a PDF merger object
        merger = PyPDF2.PdfMerger()
        temp_files = []
        
        try:
            # Process each uploaded file
            for file in files:
                if file and file.filename:
                    # Create a temporary file
                    temp_file = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
                    temp_files.append(temp_file.name)
                    
                    # Save the uploaded file
                    file.save(temp_file.name)
                    
                    # Add to merger
                    merger.append(temp_file.name)
            
            # Create output buffer
            output_buffer = io.BytesIO()
            merger.write(output_buffer)
            merger.close()
            output_buffer.seek(0)
            
            # Generate unique filename
            output_filename = f"merged_pdf_{uuid.uuid4().hex[:8]}.pdf"
            
            # Clean up temporary files
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except:
                    pass
            
            return send_file(
                output_buffer,
                as_attachment=True,
                download_name=output_filename,
                mimetype='application/pdf'
            )
            
        except Exception as e:
            # Clean up temporary files in case of error
            for temp_file in temp_files:
                try:
                    os.unlink(temp_file)
                except:
                    pass
            raise e
            
    except Exception as e:
        return jsonify({'error': f'Error merging PDFs: {str(e)}'}), 500

@app.route('/split', methods=['POST'])
def split_pdf():
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file uploaded'}), 400
        
        file = request.files['file']
        mode = request.form.get('mode', 'all')
        
        if not file.filename.lower().endswith('.pdf'):
            return jsonify({'error': 'File must be a PDF'}), 400
        
        # Read the PDF
        pdf_reader = PyPDF2.PdfReader(file)
        total_pages = len(pdf_reader.pages)
        
        if mode == 'all':
            # Split into individual pages and return as ZIP
            import zipfile
            zip_buffer = io.BytesIO()
            
            with zipfile.ZipFile(zip_buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
                for i in range(total_pages):
                    pdf_writer = PyPDF2.PdfWriter()
                    pdf_writer.add_page(pdf_reader.pages[i])
                    
                    page_buffer = io.BytesIO()
                    pdf_writer.write(page_buffer)
                    page_buffer.seek(0)
                    
                    zip_file.writestr(f'page_{i+1}.pdf', page_buffer.getvalue())
            
            zip_buffer.seek(0)
            return send_file(
                zip_buffer,
                mimetype='application/zip',
                as_attachment=True,
                download_name=f'split_pages_{uuid.uuid4().hex[:8]}.zip'
            )
        
        elif mode == 'pages':
            # Extract specific pages
            pages = request.form.get('pages', '')
            page_numbers = [int(p.strip()) for p in pages.split(',') if p.strip().isdigit()]
            
            if not page_numbers:
                return jsonify({'error': 'Invalid page numbers'}), 400
            
            pdf_writer = PyPDF2.PdfWriter()
            for page_num in page_numbers:
                if 1 <= page_num <= total_pages:
                    pdf_writer.add_page(pdf_reader.pages[page_num - 1])
            
            output = io.BytesIO()
            pdf_writer.write(output)
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'extracted_pages_{uuid.uuid4().hex[:8]}.pdf'
            )
        
        elif mode == 'ranges':
            # Extract page ranges
            ranges = request.form.get('ranges', '')
            pdf_writer = PyPDF2.PdfWriter()
            
            for range_str in ranges.split(','):
                range_str = range_str.strip()
                if '-' in range_str:
                    start, end = range_str.split('-')
                    start, end = int(start.strip()), int(end.strip())
                    for page_num in range(start, end + 1):
                        if 1 <= page_num <= total_pages:
                            pdf_writer.add_page(pdf_reader.pages[page_num - 1])
                else:
                    page_num = int(range_str)
                    if 1 <= page_num <= total_pages:
                        pdf_writer.add_page(pdf_reader.pages[page_num - 1])
            
            output = io.BytesIO()
            pdf_writer.write(output)
            output.seek(0)
            
            return send_file(
                output,
                mimetype='application/pdf',
                as_attachment=True,
                download_name=f'extracted_ranges_{uuid.uuid4().hex[:8]}.pdf'
            )
        
        return jsonify({'error': 'Invalid mode'}), 400
    
    except Exception as e:
        return jsonify({'error': f'Error splitting PDF: {str(e)}'}), 500

@app.route('/images-to-pdf', methods=['POST'])
def images_to_pdf():
    try:
        from PIL import Image
        
        if 'images[]' not in request.files:
            return jsonify({'error': 'No images uploaded'}), 400
        
        files = request.files.getlist('images[]')
        
        if not files:
            return jsonify({'error': 'No images provided'}), 400
        
        # Convert images to PDF
        images = []
        for file in files:
            img = Image.open(file)
            # Convert to RGB if necessary
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            elif img.mode != 'RGB':
                img = img.convert('RGB')
            images.append(img)
        
        # Save to PDF
        output = io.BytesIO()
        if images:
            images[0].save(output, format='PDF', save_all=True, append_images=images[1:] if len(images) > 1 else [])
        output.seek(0)
        
        return send_file(
            output,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'images_to_pdf_{uuid.uuid4().hex[:8]}.pdf'
        )
    
    except Exception as e:
        return jsonify({'error': f'Error converting images to PDF: {str(e)}'}), 500

@app.route('/image-compress/process', methods=['POST'])
def compress_image():
    try:
        from PIL import Image
        
        if 'image' not in request.files:
            return jsonify({'error': 'No image uploaded'}), 400
        
        file = request.files['image']
        quality = int(request.form.get('quality', 60))
        
        # Compress image
        img = Image.open(file)
        
        # Get original filename and extension
        filename = secure_filename(file.filename)
        name, ext = os.path.splitext(filename)
        
        output = io.BytesIO()
        
        # Save with compression
        if ext.lower() in ['.jpg', '.jpeg']:
            img.save(output, format='JPEG', quality=quality, optimize=True)
            mimetype = 'image/jpeg'
            download_name = f'{name}_compressed.jpg'
        elif ext.lower() == '.png':
            img.save(output, format='PNG', optimize=True, compress_level=9)
            mimetype = 'image/png'
            download_name = f'{name}_compressed.png'
        else:
            img.save(output, format='JPEG', quality=quality, optimize=True)
            mimetype = 'image/jpeg'
            download_name = f'{name}_compressed.jpg'
        
        output.seek(0)
        
        return send_file(
            output,
            mimetype=mimetype,
            as_attachment=True,
            download_name=download_name
        )
    
    except Exception as e:
        return jsonify({'error': f'Error compressing image: {str(e)}'}), 500

@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': 'File too large. Maximum size is 50MB.'}), 413

# This is important for Vercel
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)