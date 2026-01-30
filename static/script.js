// ==================== SAFETY LIMITS (Render Free Tier) ====================
const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25MB
const MAX_PDF_MERGE_FILES = 10;
const MAX_IMAGES_TO_PDF = 15;
let isProcessing = false;


// Global variables
let selectedFiles = [];
let splitPdfFile = null;
let splitPdfInfo = null;
let selectedImageFiles = [];

// DOM elements - PDF Merger
const uploadArea = document.getElementById('uploadArea');
const fileInput = document.getElementById('fileInput');
const fileList = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');
const progress = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const status = document.getElementById('status');

// DOM elements - PDF Splitter
const splitUploadArea = document.getElementById('splitUploadArea');
const splitFileInput = document.getElementById('splitFileInput');
const pdfInfo = document.getElementById('pdfInfo');
const pdfFileName = document.getElementById('pdfFileName');
const pdfPageCount = document.getElementById('pdfPageCount');
const splitOptions = document.getElementById('splitOptions');
const splitBtn = document.getElementById('splitBtn');
const splitProgress = document.getElementById('splitProgress');
const splitProgressBar = document.getElementById('splitProgressBar');
const splitStatus = document.getElementById('splitStatus');

// DOM elements - Image Compressor
const imageUploadArea = document.getElementById('imageUploadArea');
const imageInput = document.getElementById('imageInput');
const imagePreview = document.getElementById('imagePreview');
const previewImg = document.getElementById('previewImg');
const imageName = document.getElementById('imageName');

// DOM elements - Images to PDF
const imagesToPdfUploadArea = document.getElementById('imagesToPdfUploadArea');
const imagesToPdfInput = document.getElementById('imagesToPdfInput');
const imagesToPdfList = document.getElementById('imagesToPdfList');
const imagesToPdfBtn = document.getElementById('imagesToPdfBtn');
const imagesToPdfProgress = document.getElementById('imagesToPdfProgress');
const imagesToPdfProgressBar = document.getElementById('imagesToPdfProgressBar');
const imagesToPdfStatus = document.getElementById('imagesToPdfStatus');

// Initialize
initializeDragAndDrop();
initializeSplitMode();

function validateFilesSize(files) {
    for (const file of files) {
        if (file.size > MAX_FILE_SIZE) {
            alert(`"${file.name}" is too large.\nMax allowed size is 25MB.`);
            return false;
        }
    }
    return true;
}

function validateFileCount(files, max, label) {
    if (files.length > max) {
        alert(`Too many ${label}.\nMax allowed: ${max}`);
        return false;
    }
    return true;
}


// ==================== PDF MERGER ====================

// File input change handler
fileInput.addEventListener('change', handleFileSelect);

// Initialize drag and drop functionality for PDF Merger
function initializeDragAndDrop() {
    uploadArea.addEventListener('dragover', handleDragOver);
    uploadArea.addEventListener('dragleave', handleDragLeave);
    uploadArea.addEventListener('drop', handleDrop);
    uploadArea.addEventListener('click', (e) => {
        if (e.target === uploadArea || e.target.classList.contains('upload-icon') || 
            e.target.classList.contains('upload-text') || e.target.classList.contains('upload-subtext')) {
            fileInput.click();
        }
    });

    // Initialize click for image upload
    if (imageUploadArea) {
        imageUploadArea.addEventListener('click', (e) => {
            if (e.target === imageUploadArea || e.target.classList.contains('upload-icon') || 
                e.target.classList.contains('upload-text') || e.target.classList.contains('upload-subtext')) {
                imageInput.click();
            }
        });
    }

    // Initialize click for split upload
    if (splitUploadArea) {
        splitUploadArea.addEventListener('click', (e) => {
            if (e.target === splitUploadArea || e.target.classList.contains('upload-icon') || 
                e.target.classList.contains('upload-text') || e.target.classList.contains('upload-subtext')) {
                splitFileInput.click();
            }
        });
    }

    // Initialize Images to PDF drag and drop
    if (imagesToPdfUploadArea) {
        imagesToPdfUploadArea.addEventListener('dragover', handleImagesToPdfDragOver);
        imagesToPdfUploadArea.addEventListener('dragleave', handleImagesToPdfDragLeave);
        imagesToPdfUploadArea.addEventListener('drop', handleImagesToPdfDrop);
        imagesToPdfUploadArea.addEventListener('click', (e) => {
            if (e.target === imagesToPdfUploadArea || e.target.classList.contains('upload-icon') || 
                e.target.classList.contains('upload-text') || e.target.classList.contains('upload-subtext')) {
                imagesToPdfInput.click();
            }
        });
    }

    if (imagesToPdfInput) {
        imagesToPdfInput.addEventListener('change', handleImagesToPdfSelect);
    }
}

// Handle drag over
function handleDragOver(e) {
    e.preventDefault();
    uploadArea.classList.add('dragover');
}

// Handle drag leave
function handleDragLeave(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
}

// Handle file drop
function handleDrop(e) {
    e.preventDefault();
    uploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addFiles(files);
}

// Handle file selection
function handleFileSelect(e) {
    const files = Array.from(e.target.files);
    addFiles(files);
}

// Add files to the list
function addFiles(files) {
    if (!validateFilesSize(files)) return;
    if (!validateFileCount(files, MAX_PDF_MERGE_FILES, "PDFs")) return;

    const pdfFiles = files.filter(file => file.type === 'application/pdf');

    if (pdfFiles.length !== files.length) {
        showStatus('PDFs only. We have standards (sort of).', 'error');
        return;
    }

    pdfFiles.forEach(file => {
        if (!selectedFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedFiles.push(file);
        }
    });

    updateFileList();
    updateMergeButton();
    fileInput.value = '';
}


// Update file list display
function updateFileList() {
    fileList.innerHTML = '';
    
    selectedFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-file-pdf file-icon"></i>
                <div>
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-btn" onclick="removeFile(${index})">
                <i class="fas fa-times"></i> Nope
            </button>
        `;
        
        fileList.appendChild(fileItem);
    });
}

// Remove file from list
function removeFile(index) {
    selectedFiles.splice(index, 1);
    updateFileList();
    updateMergeButton();
}

// Update merge button state
function updateMergeButton() {
    if (selectedFiles.length >= 2) {
        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Merge These Bad Boys';
    } else {
        mergeBtn.disabled = true;
        mergeBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Need at least 2 PDFs (duh)';
    }
}

// Merge PDFs
async function mergePDFs() {
    if (isProcessing) return;
    isProcessing = true;

    if (selectedFiles.length < 2) {
        showStatus('Two PDFs minimum. This isn\'t rocket science.', 'error');
        return;
    }
    
    showProgress();
    mergeBtn.disabled = true;
    mergeBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Merging... grab a coffee';
    mergeBtn.classList.add('processing');
    
    const formData = new FormData();
    selectedFiles.forEach(file => {
        formData.append('files[]', file);
    });
    
    try {
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 10;
            updateProgress(progressValue);
            if (progressValue >= 90) {
                clearInterval(progressInterval);
            }
        }, 200);
        
        const controller = new AbortController();
        setTimeout(() => controller.abort(), 110000); // 110s

        const response = await fetch('/merge', {
            method: 'POST',
            body: formData,
            signal: controller.signal
        });

        
        clearInterval(progressInterval);
        updateProgress(100);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `merged_pdf_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showStatus('Boom! Your PDFs are merged. You\'re basically a tech wizard now.', 'success');
            
            setTimeout(() => {
                resetTool();
            }, 3000);
        } else {
            const errorData = await response.json();
            showStatus(`Well, that didn't work: ${errorData.error || 'Unknown error'}`, 'error');
        }
    } catch (error) {
        if (error.name === 'AbortError') {
            showStatus('This took too long. Try smaller PDFs.', 'error');
        } else {
            console.error(error);
            showStatus('Something broke. Classic technology.', 'error');
        }
    } finally {
        hideProgress();
        mergeBtn.disabled = false;
        mergeBtn.innerHTML = '<i class="fas fa-compress-alt"></i> Merge These Bad Boys';
        mergeBtn.classList.remove('processing');
        updateMergeButton();
        isProcessing = false;
    }
}

// ==================== PDF SPLITTER ====================

// Initialize split mode selector
function initializeSplitMode() {
    const splitModeRadios = document.querySelectorAll('input[name="splitMode"]');
    const pagesInput = document.getElementById('pagesInput');
    const rangesInput = document.getElementById('rangesInput');
    
    if (splitModeRadios.length > 0) {
        splitModeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                pagesInput.style.display = 'none';
                rangesInput.style.display = 'none';
                
                if (this.value === 'pages') {
                    pagesInput.style.display = 'block';
                } else if (this.value === 'ranges') {
                    rangesInput.style.display = 'block';
                }
            });
        });
    }
}

// Handle split file selection
if (splitFileInput) {
    splitFileInput.addEventListener('change', async function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.type !== 'application/pdf') {
            showSplitStatus('PDFs only. We\'re not miracle workers.', 'error');
            return;
        }
        
        splitPdfFile = file;
        
        // Show file info
        pdfFileName.textContent = file.name;
        
        // Get page count using PDF.js if available
        try {
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
            const pdf = await loadingTask.promise;
            const pageCount = pdf.numPages;
            
            pdfPageCount.textContent = pageCount;
            splitPdfInfo = { pageCount: pageCount };
            
            pdfInfo.style.display = 'block';
            splitOptions.style.display = 'block';
        } catch (error) {
            // Fallback if PDF.js is not available
            pdfPageCount.textContent = 'Unknown';
            splitPdfInfo = { pageCount: null };
            pdfInfo.style.display = 'block';
            splitOptions.style.display = 'block';
        }
    });
}

// Reset splitter
function resetSplitter() {
    splitPdfFile = null;
    splitPdfInfo = null;
    splitFileInput.value = '';
    pdfInfo.style.display = 'none';
    splitOptions.style.display = 'none';
    splitStatus.style.display = 'none';
    splitProgress.style.display = 'none';
    
    // Reset radio buttons
    const allRadio = document.querySelector('input[name="splitMode"][value="all"]');
    if (allRadio) allRadio.checked = true;
    
    // Hide input fields
    document.getElementById('pagesInput').style.display = 'none';
    document.getElementById('rangesInput').style.display = 'none';
}

// Split PDF
async function splitPDF() {
    if (!splitPdfFile) {
        showSplitStatus('Upload a PDF first. We need something to work with here.', 'error');
        return;
    }
    
    const selectedMode = document.querySelector('input[name="splitMode"]:checked').value;
    
    showSplitProgress();
    splitBtn.disabled = true;
    splitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Splitting... almost there';
    splitBtn.classList.add('processing');
    
    const formData = new FormData();
    formData.append('file', splitPdfFile);
    formData.append('mode', selectedMode);
    
    if (selectedMode === 'pages') {
        const pageNumbers = document.getElementById('pageNumbers').value;
        if (!pageNumbers.trim()) {
            showSplitStatus('Page numbers, please! We\'re not psychic.', 'error');
            hideSplitProgress();
            splitBtn.disabled = false;
            splitBtn.innerHTML = '<i class="fas fa-cut"></i> Split This Thing';
            splitBtn.classList.remove('processing');
            return;
        }
        formData.append('pages', pageNumbers);
    } else if (selectedMode === 'ranges') {
        const pageRanges = document.getElementById('pageRanges').value;
        if (!pageRanges.trim()) {
            showSplitStatus('Enter some ranges. Any ranges. Please.', 'error');
            hideSplitProgress();
            splitBtn.disabled = false;
            splitBtn.innerHTML = '<i class="fas fa-cut"></i> Split This Thing';
            splitBtn.classList.remove('processing');
            return;
        }
        formData.append('ranges', pageRanges);
    }
    
    try {
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 10;
            updateSplitProgress(progressValue);
            if (progressValue >= 90) {
                clearInterval(progressInterval);
            }
        }, 200);
        
        const response = await fetch('/split', {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        updateSplitProgress(100);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            
            // Determine file extension based on mode
            const extension = selectedMode === 'all' ? 'zip' : 'pdf';
            a.download = `split_pdf_${new Date().getTime()}.${extension}`;
            
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showSplitStatus('Mission accomplished! Your PDF is now in pieces. Enjoy.', 'success');
            
            setTimeout(() => {
                resetSplitter();
            }, 3000);
        } else {
            const errorData = await response.json();
            showSplitStatus(`Error: ${errorData.error || 'The universe is conspiring against us'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showSplitStatus('Well, that\'s embarrassing. Something broke. Try again?', 'error');
    } finally {
        hideSplitProgress();
        splitBtn.disabled = false;
        splitBtn.innerHTML = '<i class="fas fa-cut"></i> Split This Thing';
        splitBtn.classList.remove('processing');
    }
}

function showSplitProgress() {
    splitProgress.style.display = 'block';
    splitProgressBar.style.width = '0%';
}

function updateSplitProgress(percent) {
    splitProgressBar.style.width = percent + '%';
}

function hideSplitProgress() {
    setTimeout(() => {
        splitProgress.style.display = 'none';
    }, 1000);
}

function showSplitStatus(message, type) {
    splitStatus.textContent = message;
    splitStatus.className = `status ${type}`;
    splitStatus.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            splitStatus.style.display = 'none';
        }, 5000);
    }
}

// ==================== IMAGES TO PDF ====================

function handleImagesToPdfDragOver(e) {
    e.preventDefault();
    imagesToPdfUploadArea.classList.add('dragover');
}

function handleImagesToPdfDragLeave(e) {
    e.preventDefault();
    imagesToPdfUploadArea.classList.remove('dragover');
}

function handleImagesToPdfDrop(e) {
    e.preventDefault();
    imagesToPdfUploadArea.classList.remove('dragover');
    
    const files = Array.from(e.dataTransfer.files);
    addImagesToPdf(files);
}

function handleImagesToPdfSelect(e) {
    const files = Array.from(e.target.files);
    addImagesToPdf(files);
}

function addImagesToPdf(files) {
    if (!validateFilesSize(files)) return;
    if (!validateFileCount(files, MAX_IMAGES_TO_PDF, "images")) return;

    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length !== files.length) {
        showImagesToPdfStatus('Images only! No sneaky PDFs allowed.', 'error');
        return;
    }

    imageFiles.forEach(file => {
        if (!selectedImageFiles.some(f => f.name === file.name && f.size === file.size)) {
            selectedImageFiles.push(file);
        }
    });

    updateImagesToPdfList();
    updateImagesToPdfButton();
    imagesToPdfInput.value = '';
}


function updateImagesToPdfList() {
    imagesToPdfList.innerHTML = '';
    
    selectedImageFiles.forEach((file, index) => {
        const fileItem = document.createElement('div');
        fileItem.className = 'file-item';
        
        fileItem.innerHTML = `
            <div class="file-info">
                <i class="fas fa-image file-icon"></i>
                <div>
                    <div class="file-name">${escapeHtml(file.name)}</div>
                    <div class="file-size">${formatFileSize(file.size)}</div>
                </div>
            </div>
            <button class="remove-btn" onclick="removeImageToPdfFile(${index})">
                <i class="fas fa-times"></i> Remove
            </button>
        `;
        
        imagesToPdfList.appendChild(fileItem);
    });
}

function removeImageToPdfFile(index) {
    selectedImageFiles.splice(index, 1);
    updateImagesToPdfList();
    updateImagesToPdfButton();
}

function updateImagesToPdfButton() {
    if (selectedImageFiles.length >= 1) {
        imagesToPdfBtn.disabled = false;
        imagesToPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDFify These Images';
    } else {
        imagesToPdfBtn.disabled = true;
        imagesToPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> Need at least 1 image';
    }
}

async function convertImagesToPDF() {
    if (selectedImageFiles.length < 1) {
        showImagesToPdfStatus('Upload some images first. We can\'t PDFify thin air.', 'error');
        return;
    }
    
    showImagesToPdfProgress();
    imagesToPdfBtn.disabled = true;
    imagesToPdfBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Converting... hold your horses';
    imagesToPdfBtn.classList.add('processing');
    
    const formData = new FormData();
    selectedImageFiles.forEach(file => {
        formData.append('images[]', file);
    });
    
    try {
        let progressValue = 0;
        const progressInterval = setInterval(() => {
            progressValue += 10;
            updateImagesToPdfProgress(progressValue);
            if (progressValue >= 90) {
                clearInterval(progressInterval);
            }
        }, 200);
        
        const response = await fetch('/images-to-pdf', {
            method: 'POST',
            body: formData
        });
        
        clearInterval(progressInterval);
        updateImagesToPdfProgress(100);
        
        if (response.ok) {
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `images_to_pdf_${new Date().getTime()}.pdf`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            showImagesToPdfStatus('Success! Your images are now professional PDFs. You\'re welcome.', 'success');
            
            setTimeout(() => {
                resetImagesToPdf();
            }, 3000);
        } else {
            const errorData = await response.json();
            showImagesToPdfStatus(`Error: ${errorData.error || 'Technology strikes again'}`, 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showImagesToPdfStatus('Oops. Something went wrong. Because of course it did.', 'error');
    } finally {
        hideImagesToPdfProgress();
        imagesToPdfBtn.disabled = false;
        imagesToPdfBtn.innerHTML = '<i class="fas fa-file-pdf"></i> PDFify These Images';
        imagesToPdfBtn.classList.remove('processing');
        updateImagesToPdfButton();
    }
}

function showImagesToPdfProgress() {
    imagesToPdfProgress.style.display = 'block';
    imagesToPdfProgressBar.style.width = '0%';
}

function updateImagesToPdfProgress(percent) {
    imagesToPdfProgressBar.style.width = percent + '%';
}

function hideImagesToPdfProgress() {
    setTimeout(() => {
        imagesToPdfProgress.style.display = 'none';
    }, 1000);
}

function showImagesToPdfStatus(message, type) {
    imagesToPdfStatus.textContent = message;
    imagesToPdfStatus.className = `status ${type}`;
    imagesToPdfStatus.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            imagesToPdfStatus.style.display = 'none';
        }, 5000);
    }
}

function resetImagesToPdf() {
    selectedImageFiles = [];
    updateImagesToPdfList();
    updateImagesToPdfButton();
    imagesToPdfStatus.style.display = 'none';
    imagesToPdfProgress.style.display = 'none';
}

// ==================== IMAGE COMPRESSOR ====================

if (imageInput) {
    imageInput.addEventListener('change', handleImageSelect);
}

function handleImageSelect(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
        alert("Image too large. Max allowed size is 25MB.");
        imageInput.value = "";
        return;
    }

    const reader = new FileReader();
    reader.onload = function(e) {
        previewImg.src = e.target.result;
        imageName.textContent = file.name;
        imagePreview.style.display = 'block';
    };
    reader.readAsDataURL(file);
}


// ==================== UTILITY FUNCTIONS ====================

function formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showProgress() {
    progress.style.display = 'block';
    progressBar.style.width = '0%';
}

function updateProgress(percent) {
    progressBar.style.width = percent + '%';
}

function hideProgress() {
    setTimeout(() => {
        progress.style.display = 'none';
    }, 1000);
}

function showStatus(message, type) {
    status.textContent = message;
    status.className = `status ${type}`;
    status.style.display = 'block';
    
    if (type === 'success') {
        setTimeout(() => {
            status.style.display = 'none';
        }, 5000);
    }
}

function resetTool() {
    selectedFiles = [];
    updateFileList();
    updateMergeButton();
    status.style.display = 'none';
    progress.style.display = 'none';
}

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Mobile menu toggle
const mobileMenu = document.querySelector('.mobile-menu');
const navLinks = document.querySelector('.nav-links');

if (mobileMenu) {
    mobileMenu.addEventListener('click', () => {
        navLinks.classList.toggle('active');
        mobileMenu.classList.toggle('active');
    });
    
    // Close menu when clicking on a link
    document.querySelectorAll('.nav-links a').forEach(link => {
        link.addEventListener('click', () => {
            navLinks.classList.remove('active');
            mobileMenu.classList.remove('active');
        });
    });
    
    // Handle dropdown in mobile
    const dropdown = document.querySelector('.dropdown');
    if (dropdown) {
        dropdown.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
            }
        });
    }
}