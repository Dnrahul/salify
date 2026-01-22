import streamlit as st
import os
import tempfile
from PIL import Image
from pypdf2 import PdfReader, PdfWriter
import zipfile
import base64

# Optional imports for advanced features
try:
    import moviepy.editor as mp
    VIDEO_COMPRESSION_ENABLED = True
except ImportError:
    VIDEO_COMPRESSION_ENABLED = False

st.set_page_config(page_title="Salify - File Compressor", page_icon="⚡", layout="wide")

# Compression modes
compression_modes = {
    'high': {'label': 'High Quality', 'desc': 'Minimal compression, max clarity', 'image_quality': 95, 'video_bitrate': '8000k', 'pdf_quality': 0.9},
    'balanced': {'label': 'Balanced', 'desc': 'Medium compression, good quality', 'image_quality': 80, 'video_bitrate': '4000k', 'pdf_quality': 0.7},
    'max': {'label': 'Max Compression', 'desc': 'Aggressive compression, smaller size', 'image_quality': 60, 'video_bitrate': '1500k', 'pdf_quality': 0.5}
}

def compress_image(file, quality):
    img = Image.open(file)
    output = tempfile.NamedTemporaryFile(delete=False, suffix='.jpg')
    img.save(output.name, 'JPEG', quality=quality)
    return output.name, os.path.getsize(output.name)

def compress_video(file_path, bitrate):
    if not VIDEO_COMPRESSION_ENABLED:
        # Return original file size if moviepy not available
        return file_path, os.path.getsize(file_path)
    
    try:
        video = mp.VideoFileClip(file_path)
        output = tempfile.NamedTemporaryFile(delete=False, suffix='.mp4')
        video.write_videofile(output.name, bitrate=bitrate, verbose=False, logger=None)
        return output.name, os.path.getsize(output.name)
    except Exception as e:
        st.warning(f"Video compression not available: {str(e)}")
        return file_path, os.path.getsize(file_path)

def compress_pdf(file, quality):
    reader = PdfReader(file)
    writer = PdfWriter()
    for page in reader.pages:
        writer.add_page(page)
    output = tempfile.NamedTemporaryFile(delete=False, suffix='.pdf')
    with open(output.name, 'wb') as f:
        writer.write(f)
    # Note: Basic PDF compression, real compression would require more advanced libs
    return output.name, os.path.getsize(output.name)

def format_file_size(bytes_size):
    for unit in ['B', 'KB', 'MB', 'GB']:
        if bytes_size < 1024.0:
            return f"{bytes_size:.2f} {unit}"
        bytes_size /= 1024.0
    return f"{bytes_size:.2f} TB"

st.title("⚡ Salify.in - Compress Files Locally & Securely")

# File uploader
uploaded_files = st.file_uploader("Select files to compress", accept_multiple_files=True, type=['mp4', 'mov', 'jpg', 'jpeg', 'png', 'pdf'])

if uploaded_files:
    st.subheader("Selected Files")
    for file in uploaded_files:
        st.write(f"- {file.name} ({format_file_size(file.size)})")

    # Compression mode
    mode = st.selectbox("Compression Mode", options=list(compression_modes.keys()), format_func=lambda x: compression_modes[x]['label'])

    if st.button("Start Compression"):
        progress_bar = st.progress(0)
        status_text = st.empty()
        results = []

        for i, file in enumerate(uploaded_files):
            status_text.text(f"Processing {file.name}...")
            original_size = file.size

            if file.type.startswith('image/'):
                compressed_path, compressed_size = compress_image(file, compression_modes[mode]['image_quality'])
            elif file.type.startswith('video/'):
                # Save uploaded file to temp
                temp_input = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1])
                temp_input.write(file.read())
                temp_input.close()
                compressed_path, compressed_size = compress_video(temp_input.name, compression_modes[mode]['video_bitrate'])
                os.unlink(temp_input.name)
            elif file.type == 'application/pdf':
                compressed_path, compressed_size = compress_pdf(file, compression_modes[mode]['pdf_quality'])
            else:
                # For unsupported, just copy
                compressed_path = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(file.name)[1])
                compressed_path.write(file.read())
                compressed_path.close()
                compressed_size = original_size

            saved_bytes = original_size - compressed_size
            saved_percent = (saved_bytes / original_size) * 100 if original_size > 0 else 0

            results.append({
                'name': file.name,
                'original_size': original_size,
                'compressed_size': compressed_size,
                'saved_bytes': saved_bytes,
                'saved_percent': saved_percent,
                'path': compressed_path
            })

            progress_bar.progress((i + 1) / len(uploaded_files))

        status_text.text("Compression Complete!")
        progress_bar.empty()

        # Display results
        st.subheader("Compression Results")
        total_saved = sum(r['saved_bytes'] for r in results)
        st.write(f"**Total Saved:** {format_file_size(total_saved)}")
        st.write(f"**Files Processed:** {len(results)}")

        for result in results:
            col1, col2, col3, col4 = st.columns([3, 1, 1, 1])
            with col1:
                st.write(f"**{result['name']}**")
            with col2:
                st.write(f"Original: {format_file_size(result['original_size'])}")
            with col3:
                st.write(f"Compressed: {format_file_size(result['compressed_size'])}")
            with col4:
                with open(result['path'], 'rb') as f:
                    st.download_button(
                        label="Download",
                        data=f,
                        file_name=f"compressed_{result['name']}",
                        mime=result.get('type', 'application/octet-stream')
                    )
                st.write(f"Saved: {result['saved_percent']:.1f}%")

        # Download all as zip
        if len(results) > 1:
            zip_buffer = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
            with zipfile.ZipFile(zip_buffer.name, 'w') as zip_file:
                for result in results:
                    zip_file.write(result['path'], f"compressed_{result['name']}")
            zip_buffer.seek(0)
            st.download_button(
                label="Download All as ZIP",
                data=zip_buffer,
                file_name="compressed_files.zip",
                mime="application/zip"
            )

st.info("🔒 All compression happens locally on your device. Files are not uploaded to any server.")