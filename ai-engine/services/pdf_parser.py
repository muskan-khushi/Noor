import pdfplumber
import re

def extract_text_from_pdf(file_path: str) -> str:
    full_text = []
    try:
        with pdfplumber.open(file_path) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    full_text.append(text)
    except Exception as e:
        raise ValueError(f'Could not parse PDF file: {e}')
    raw = '\n'.join(full_text)
    # First handle form feeds → newlines, THEN collapse whitespace
    cleaned = re.sub(r'\f', '\n', raw)
    cleaned = re.sub(r'[^\S\n]+', ' ', cleaned)
    if not cleaned.strip():
        raise ValueError('No text could be extracted from the PDF')
    return cleaned.strip()
