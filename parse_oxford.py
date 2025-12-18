#!/usr/bin/env python3
"""
Парсер Oxford 3000 / 5000 Key Words (PDF) → words.json

Требования:
    pip install pdfplumber

Запуск:
    python parse_oxford.py
"""

import pdfplumber
import json
import re
from pathlib import Path
import sys
from collections import defaultdict

# -------------------- НАСТРОЙКИ --------------------

PDF_FILES = [
    "Oxford-3000-Key-Words.pdf",
    "Oxford-5000-Key-Words.pdf",
]

OUTPUT_FILE = "words.json"

# Уровни в порядке сложности для сортировки
LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"]
LEVELS_SET = set(LEVEL_ORDER)

# Регулярка для извлечения чистого слова (игнорируем части речи, скобки)
WORD_RE = re.compile(r"^([a-zA-Z][a-zA-Z\-]*)")


# --------------------------------------------------


def parse_oxford_3000_pdf(path: Path, start_id: int):
    """
    Парсит Oxford 3000 PDF (A1-B2 уровни)
    """
    words = []
    current_level = None
    word_id = start_id

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.splitlines():
                line = line.strip()

                # В Oxford 3000 уровни обозначены как A1, A2, B1, B2
                if line in ["A1", "A2", "B1", "B2"]:
                    current_level = line
                    continue

                # Пропускаем заголовки и пустые строки
                if (not line or
                        "Oxford" in line or
                        "©" in line or
                        line.isdigit() or
                        "/" in line):
                    continue

                if not current_level:
                    continue

                # Извлекаем слово (игнорируем части речи)
                # Примеры строк: "absorb v", "abstract adj.", "match (contest/correspond) n., v."
                clean_line = line.split()[0]  # Берем первое слово

                # Убираем скобки и их содержимое
                if '(' in clean_line:
                    clean_line = clean_line.split('(')[0].strip()

                # Убираем цифры в конце (например, "rose2")
                clean_line = re.sub(r'\d+$', '', clean_line)

                if not clean_line or not clean_line.isalpha():
                    continue

                word = clean_line.lower()

                words.append({
                    "id": word_id,
                    "en": word,
                    "ru": "",
                    "level": current_level
                })
                word_id += 1

    return words, word_id


def parse_oxford_5000_pdf(path: Path, start_id: int):
    """
    Парсит Oxford 5000 PDF (B2-C1 уровни)
    """
    words = []
    current_level = None
    word_id = start_id
    in_b2_c1_section = False

    with pdfplumber.open(path) as pdf:
        for page in pdf.pages:
            text = page.extract_text()
            if not text:
                continue

            for line in text.splitlines():
                line = line.strip()

                # В Oxford 5000 есть секции B2 и C1
                if line == "B2" or line == "C1":
                    current_level = line
                    in_b2_c1_section = True
                    continue

                # Заголовок документа - выходим из секции
                if "The Oxford 5000™ by CEFR level" in line:
                    in_b2_c1_section = False
                    continue

                # Пропускаем строки вне секций B2/C1
                if not in_b2_c1_section or not current_level:
                    continue

                # Пропускаем заголовки и пустые строки
                if (not line or
                        "Oxford" in line or
                        "©" in line or
                        "/" in line):
                    continue

                # Извлекаем слово (аналогично 3000)
                clean_line = line.split()[0]

                if '(' in clean_line:
                    clean_line = clean_line.split('(')[0].strip()

                clean_line = re.sub(r'\d+$', '', clean_line)

                if not clean_line or not clean_line.isalpha():
                    continue

                word = clean_line.lower()

                words.append({
                    "id": word_id,
                    "en": word,
                    "ru": "",
                    "level": current_level
                })
                word_id += 1

    return words, word_id


def deduplicate(words):
    """
    Убирает дубликаты по полю 'en' (одно слово может быть только один раз)
    Сохраняет более низкий уровень для дубликатов (A1 приоритетнее C1)
    """
    level_priority = {level: i for i, level in enumerate(LEVEL_ORDER)}

    unique_words = {}

    for w in words:
        word = w["en"]
        level = w["level"]

        if word not in unique_words:
            unique_words[word] = w
        else:
            # Если слово уже есть, выбираем более низкий уровень
            existing_level = unique_words[word]["level"]
            if level_priority[level] < level_priority[existing_level]:
                unique_words[word] = w

    return list(unique_words.values())


def sort_by_level_and_alphabet(words):
    """
    Сортирует слова: сначала по уровню (A1→C1), потом по алфавиту
    """
    level_order = {level: i for i, level in enumerate(LEVEL_ORDER)}

    return sorted(words, key=lambda x: (level_order[x["level"]], x["en"]))


def renumber(words):
    """
    Перенумеровывает id подряд
    """
    for i, w in enumerate(words, start=1):
        w["id"] = i
    return words


def print_statistics(words):
    """
    Выводит статистику по уровням
    """
    stats = defaultdict(int)
    for w in words:
        stats[w["level"]] += 1

    print("\n📊 Статистика по уровням:")
    print("-" * 30)
    for level in LEVEL_ORDER:
        if level in stats:
            print(f"  {level}: {stats[level]:4d} слов")
    print("-" * 30)
    print(f"  Всего: {len(words):4d} слов")

    # Примеры слов каждого уровня
    print("\n🔤 Примеры слов по уровням:")
    for level in LEVEL_ORDER:
        level_words = [w["en"] for w in words if w["level"] == level][:5]
        if level_words:
            print(f"  {level}: {', '.join(level_words)}")


def main():
    all_words = []
    current_id = 1

    for pdf_name in PDF_FILES:
        pdf_path = Path(pdf_name)

        if not pdf_path.exists():
            print(f"❌ Файл не найден: {pdf_name}")
            sys.exit(1)

        print(f"📄 Обрабатываю {pdf_name} ...")

        if "3000" in pdf_name:
            parsed, current_id = parse_oxford_3000_pdf(pdf_path, current_id)
        elif "5000" in pdf_name:
            parsed, current_id = parse_oxford_5000_pdf(pdf_path, current_id)
        else:
            print(f"⚠️  Неизвестный файл: {pdf_name}, пропускаю")
            continue

        all_words.extend(parsed)
        print(f"  Извлечено: {len(parsed)} слов")

    print(f"\n🔁 Удаляю дубликаты...")
    all_words = deduplicate(all_words)
    print(f"  После удаления дубликатов: {len(all_words)} слов")

    print(f"\n🔀 Сортирую по уровням и алфавиту...")
    all_words = sort_by_level_and_alphabet(all_words)

    print(f"\n🔢 Перенумеровываю...")
    all_words = renumber(all_words)

    # Сохраняем результат
    with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
        json.dump(all_words, f, ensure_ascii=False, indent=2)

    print(f"\n✅ Готово!")
    print(f"💾 Файл: {OUTPUT_FILE}")

    # Выводим статистику
    print_statistics(all_words)

    # Пример первых 20 слов
    print(f"\n📝 Первые 20 слов:")
    print("-" * 40)
    for i, word in enumerate(all_words[:20], 1):
        print(f"{word['id']:4d}. {word['en']:20s} [{word['level']}]")


if __name__ == "__main__":
    main()