# 🔧 FixMyFiles

> **Your Files Are Chaos. We're the Therapy.** 

A sleek, dark-mode PDF and image manipulation tool that actually works. Merge PDFs, split them, convert images, compress files – all without the tears and frustration of traditional tools.


## ✨ Features

### 🎯 **Core Tools**
- **PDF Merger** - Combine multiple PDFs because emailing 47 attachments is how you become "that person"
- **PDF Splitter** - Extract pages with surgical precision (no medical degree required)
- **Images to PDF** - Convert 500 random screenshots into one organized file
- **Image Compressor** - Shrink images without turning them into abstract pixel art

### 🎨 **Design & UX**
- 🌙 **Dark Mode First** - Easy on the eyes, hard on file chaos
- 📱 **Fully Responsive** - Works perfectly on mobile, tablet, and desktop
- 🚀 **Blazing Fast** - Because waiting is for people who enjoy watching paint dry
- 🔒 **Fort Knox Security** - Files deleted faster than your browser history before a presentation

## 🚀 Live Demo

**[Try it live on Render →](https://fix-my-filess.onrender.com)**


## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, JavaScript (ES6+)
- Custom dark theme with gradient accents
- Drag-and-drop file uploads
- Responsive design (mobile-first)

**Backend:**
- Flask (Python web framework)
- PyPDF2 (PDF manipulation)
- Pillow (Image processing)
- Werkzeug (File handling)

**Deployment:**
- Vercel (Serverless deployment)
- GitHub (Version control)

## 📦 Installation

### Prerequisites
- Python 3.8 or higher
- pip (Python package manager)
- Git

### Local Development

1. **Clone the repository:**
```bash
git clone https://github.com/saloniilad/FixMyFiles.git
cd fixmyfiles
```

2. **Create a virtual environment:**
```bash
python -m venv venv

# On Windows
venv\Scripts\activate

# On macOS/Linux
source venv/bin/activate
```

3. **Install dependencies:**
```bash
pip install -r requirements.txt
```

4. **Set up the project structure:**
```bash
mkdir templates
cp index.html templates/
```

5. **Run the application:**
```bash
python app.py
```

6. **Open your browser:**
```
http://localhost:5000
```



## 📁 Project Structure
```
fixmyfiles/
│
├── app.py                 # Flask backend with all routes
├── vercel.json           # Vercel deployment configuration
├── requirements.txt      # Python dependencies
├── .gitignore           # Git ignore rules
├── README.md            # This file
│
├── static/              # Static files
│   ├── style.css        # Dark mode styles
│   └── script.js        # Frontend JavaScript
│
└── templates/           # Flask templates
    └── index.html       # Main HTML page
```

## 🎯 Usage

### PDF Merger
1. Click "Select PDFs" or drag & drop multiple PDF files
2. Files will appear in the list (minimum 2 required)
3. Click "Merge These Bad Boys"
4. Download your merged PDF

### PDF Splitter
1. Upload a PDF file
2. Choose split mode:
   - **All Pages** - Get every page as individual PDFs (ZIP file)
   - **Specific Pages** - Enter page numbers (e.g., 1, 3, 5, 7)
   - **Page Ranges** - Enter ranges (e.g., 1-5, 10-15, 20)
3. Click "Split This Thing"
4. Download your split files

### Images to PDF
1. Upload one or more images (JPG, PNG, GIF, BMP, TIFF, WebP)
2. Images will be combined in the order uploaded
3. Click "PDFify These Images"
4. Download your PDF

### Image Compressor
1. Upload an image
2. Set compression quality (10-90)
   - Higher = Better quality but bigger file
   - Lower = Smaller file but lower quality
3. Click "Compress This Bad Boy"
4. Download your compressed image

## 🔧 Configuration

### File Size Limits
The default maximum file size is **50MB**. To change this, edit `app.py`:
```python
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024 
```

### Vercel Limits
- **Serverless Function Size:** 50MB
- **Request Body Size:** 4.5MB (default)
- **Execution Time:** 10 seconds (Hobby), 60 seconds (Pro)

For larger files, consider upgrading your Vercel plan or implementing external storage.



## 🐛 Bug Reports

Found a bug? Please open an issue with:
- Description of the bug
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Browser/OS information



## 👏 Acknowledgments

- **Flask** - The lightweight Python web framework
- **PyPDF2** - PDF manipulation library
- **Pillow** - Python Imaging Library
- **Vercel** - Deployment platform
- **Font Awesome** - Icon library
- **Inter Font** - Typography


## 🎉 Fun Stats

- **Lines of Sarcasm:** Too many to count
- **Coffee Consumed:** Yes
- **Files Fixed:** Countless
- **User Tears Saved:** Immeasurable

---

<div align="center">

**Built with ☕, sarcasm, and mild frustration**

[⬆ Back to Top](#-fixmyfiles)

</div>
