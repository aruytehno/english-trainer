import pdfplumber
from pathlib import Path

pdf_files = [
    "Oxford-3000-Key-Words.pdf",
    "Oxford-5000-Key-Words.pdf"
]

for pdf_path in pdf_files:
    pdf_path = Path(pdf_path)
    output_txt = pdf_path.with_suffix(".txt")

    all_text = []

    with pdfplumber.open(pdf_path) as pdf:
        for page_number, page in enumerate(pdf.pages, start=1):
            text = page.extract_text()
            if text:
                all_text.append(text)
            else:
                print(f"⚠️ Нет текста на странице {page_number} в {pdf_path.name}")

    output_txt.write_text("\n\n".join(all_text), encoding="utf-8")
    print(f"✅ Текст сохранён в {output_txt}")
