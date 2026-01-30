from flask import Flask, request, send_file, jsonify, render_template
import io
import uuid
import os
from werkzeug.utils import secure_filename
from PyPDF2 import PdfReader, PdfWriter, PdfMerger

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = 25 * 1024 * 1024  # 🔥 Reduce to 25MB (Render-safe)

# ---------------- HOME ---------------- #
@app.route("/")
def index():
    return render_template("index.html")

# ---------------- MERGE PDFs ---------------- #
@app.route("/merge", methods=["POST"])
def merge_pdfs():
    files = request.files.getlist("files[]")

    if len(files) < 2:
        return jsonify({"error": "Upload at least 2 PDFs"}), 400

    merger = PdfMerger()

    try:
        for file in files:
            if not file.filename.lower().endswith(".pdf"):
                return jsonify({"error": "Only PDF files allowed"}), 400

            merger.append(PdfReader(file))

        output = io.BytesIO()
        merger.write(output)
        merger.close()
        output.seek(0)

        return send_file(
            output,
            mimetype="application/pdf",
            as_attachment=True,
            download_name=f"merged_{uuid.uuid4().hex[:6]}.pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- SPLIT PDF ---------------- #
@app.route("/split", methods=["POST"])
def split_pdf():
    file = request.files.get("file")
    mode = request.form.get("mode", "all")

    if not file or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Invalid PDF"}), 400

    reader = PdfReader(file)
    total_pages = len(reader.pages)

    try:
        if mode == "all":
            import zipfile
            zip_buffer = io.BytesIO()

            with zipfile.ZipFile(zip_buffer, "w") as zipf:
                for i, page in enumerate(reader.pages):
                    writer = PdfWriter()
                    writer.add_page(page)

                    page_io = io.BytesIO()
                    writer.write(page_io)
                    zipf.writestr(f"page_{i+1}.pdf", page_io.getvalue())

            zip_buffer.seek(0)
            return send_file(
                zip_buffer,
                mimetype="application/zip",
                as_attachment=True,
                download_name="split_pages.zip"
            )

        writer = PdfWriter()

        if mode == "pages":
            pages = request.form.get("pages", "")
            for p in pages.split(","):
                p = int(p.strip())
                if 1 <= p <= total_pages:
                    writer.add_page(reader.pages[p - 1])

        elif mode == "ranges":
            ranges = request.form.get("ranges", "")
            for r in ranges.split(","):
                if "-" in r:
                    s, e = map(int, r.split("-"))
                    for i in range(s, e + 1):
                        if 1 <= i <= total_pages:
                            writer.add_page(reader.pages[i - 1])
                else:
                    i = int(r)
                    if 1 <= i <= total_pages:
                        writer.add_page(reader.pages[i - 1])
        else:
            return jsonify({"error": "Invalid mode"}), 400

        output = io.BytesIO()
        writer.write(output)
        output.seek(0)

        return send_file(
            output,
            mimetype="application/pdf",
            as_attachment=True,
            download_name="extracted.pdf"
        )

    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ---------------- IMAGES → PDF ---------------- #
@app.route("/images-to-pdf", methods=["POST"])
def images_to_pdf():
    from PIL import Image

    files = request.files.getlist("images[]")
    if not files:
        return jsonify({"error": "No images uploaded"}), 400

    images = []
    for file in files:
        img = Image.open(file).convert("RGB")
        images.append(img)

    output = io.BytesIO()
    images[0].save(output, save_all=True, append_images=images[1:], format="PDF")
    output.seek(0)

    return send_file(
        output,
        mimetype="application/pdf",
        as_attachment=True,
        download_name="images.pdf"
    )

# ---------------- IMAGE COMPRESS ---------------- #
@app.route("/image-compress/process", methods=["POST"])
def compress_image():
    from PIL import Image

    file = request.files.get("image")
    if not file:
        return jsonify({"error": "No image uploaded"}), 400

    quality = int(request.form.get("quality", 60))
    img = Image.open(file)

    name, ext = os.path.splitext(secure_filename(file.filename))
    output = io.BytesIO()

    if ext.lower() == ".png":
        img.save(output, "PNG", optimize=True)
        mime = "image/png"
        filename = f"{name}_compressed.png"
    else:
        img.save(output, "JPEG", quality=quality, optimize=True)
        mime = "image/jpeg"
        filename = f"{name}_compressed.jpg"

    output.seek(0)

    return send_file(output, mimetype=mime, as_attachment=True, download_name=filename)

# ---------------- ERRORS ---------------- #
@app.errorhandler(413)
def too_large(_):
    return jsonify({"error": "File too large (max 25MB)"}), 413


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
