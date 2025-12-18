import pdfplumber
import json
import re
from pathlib import Path

PDF_FILES = [
    "Oxford-3000-Key-Words.pdf",
    "Oxford-5000-Key-Words.pdf",
]

OUTPUT_FILE = "words.json"

# CEFR уровни
LEVELS = {"A1", "A2", "B1", "B2", "C1", "C2"}

# регулярка для английского слова
WORD_RE = re.compile(r"^[a-z][a-z\-']*$")

def clean_token(token: str) -> str:
    token = token.lower()
    token = token.strip(".,;:()[]")
    return token

def extract_words_from_pdf(pdf_path, start_id):
    words = []
    current_level = None
    word_id = start_id

    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages:
            width = page.width
            height = page.height

            # делим страницу на 4 колонки
            columns = [
                (0, 0, width * 0.25, height),
                (width * 0.25, 0, width * 0.50, height),
                (width * 0.50, 0, width * 0.75, height),
                (width * 0.75, 0, width, height),
            ]

            for bbox in columns:
                text = page.crop(bbox).extract_text()
                if not text:
                    continue

                for raw_token in text.split():
                    token = clean_token(raw_token)

                    # уровень
                    if token.upper() in LEVELS:
                        current_level = token.upper()
                        continue

                    if not current_level:
                        continue

                    # фильтруем мусор
                    if (
                        not WORD_RE.match(token)
                        or token in {"the", "a", "an"}  # можно убрать, если не нужно
                        and raw_token.endswith("article")
                    ):
                        continue

                    words.append({
                        "id": word_id,
                        "en": token,
                        "ru": "",
                        "level": current_level
                    })
                    word_id += 1

    return words, word_id

def main():
    all_words = []
    current_id = 1

    for pdf in PDF_FILES:
        if not Path(pdf).exists():
            raise FileNotFoundError(pdf)

        words, current_id = extract_words_from_pdf(pdf, current_id)
        all_words.extend(words)

    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)

    print(f"Saved {len(all_words)} words to {OUTPUT_FILE}")

if __name__ == "__main__":
    main()
