import os
from pypdf import PdfReader
from rag_system import LegalRAG
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def extract_text_from_pdf(pdf_path):
    """Extract text from a PDF file."""
    try:
        reader = PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
    except Exception as e:
        logger.error(f"Error reading {pdf_path}: {e}")
        return None

def chunk_text(text, chunk_size=1000, overlap=200):
    """Split text into overlapping chunks."""
    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        chunks.append(text[start:end])
        start += chunk_size - overlap
    return chunks

def index_all_pdfs(pdf_dir="laws_pdf"):
    """Index all PDF files in the specified directory."""
    rag = LegalRAG()
    
    if not os.path.exists(pdf_dir):
        logger.error(f"Directory {pdf_dir} does not exist.")
        return

    pdf_files = [f for f in os.listdir(pdf_dir) if f.lower().endswith(".pdf")]
    
    if not pdf_files:
        logger.info("No PDF files found to index.")
        return

    for filename in pdf_files:
        path = os.path.join(pdf_dir, filename)
        logger.info(f"Processing {filename}...")
        
        text = extract_text_from_pdf(path)
        if not text:
            continue
            
        chunks = chunk_text(text)
        for i, chunk in enumerate(chunks):
            doc_id = f"{filename}_{i}"
            rag.add_law(
                text=chunk,
                metadata={"filename": filename, "source": "PDF Upload"},
                doc_id=doc_id
            )
            
    logger.info(f"Finished indexing {len(pdf_files)} PDF(s).")

if __name__ == "__main__":
    index_all_pdfs()
