import pdfplumber
import os

pdf_files = [f for f in os.listdir('input_pdfs') if f.endswith('.pdf')]
if not pdf_files:
    print("No PDFs")
    exit()

# Try with the second PDF which we know had some text
filepath = os.path.join('input_pdfs', pdf_files[1]) if len(pdf_files) > 1 else os.path.join('input_pdfs', pdf_files[0])

with pdfplumber.open(filepath) as pdf:
    text_normal = pdf.pages[0].extract_text() or ""
    text_layout = pdf.pages[0].extract_text(layout=True) or ""
    
with open('debug_normal.txt', 'w', encoding='utf-8') as f:
    f.write(text_normal)
    
with open('debug_layout.txt', 'w', encoding='utf-8') as f:
    f.write(text_layout)
    
print("Saved to debug_normal.txt and debug_layout.txt")
