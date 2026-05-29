import pdfplumber
import re

def extract_text_from_pdf(file_path: str) -> str:
    full_text = []
    with pdfplumber.open(file_path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
    raw = '\n'.join(full_text)
    cleaned = re.sub(r'\s+', ' ', raw)
    cleaned = re.sub(r'\f', '\n', cleaned)
    return cleaned.strip()
