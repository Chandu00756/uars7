#!/usr/bin/env python3
import PyPDF2
import sys
import os

def extract_text_from_pdf(pdf_path, output_path):
    try:
        with open(pdf_path, 'rb') as file:
            reader = PyPDF2.PdfReader(file)
            text = ""
            
            for page_num in range(len(reader.pages)):
                page = reader.pages[page_num]
                text += page.extract_text() + "\n\n"
            
            with open(output_path, 'w', encoding='utf-8') as output_file:
                output_file.write(text)
            
            print(f"Successfully extracted text from {pdf_path} to {output_path}")
            return True
    except Exception as e:
        print(f"Error extracting text from {pdf_path}: {str(e)}")
        return False

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python3 extract_pdf.py <input_pdf> <output_txt>")
        sys.exit(1)
    
    pdf_path = sys.argv[1]
    output_path = sys.argv[2]
    
    if not os.path.exists(pdf_path):
        print(f"PDF file not found: {pdf_path}")
        sys.exit(1)
    
    extract_text_from_pdf(pdf_path, output_path)
