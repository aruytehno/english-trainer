#!/usr/bin/env python3
"""
Парсер Oxford 3000 / 5000 из текстовых файлов → words.json
Компактный формат: одна строка = одна запись

Формат вывода:
[
  { "id": 1, "en": "the", "ru": "", "level": "A1" },
  { "id": 2, "en": "be", "ru": "", "level": "A1" },
  ...
]
"""

import json
import re
from pathlib import Path
import sys
from collections import defaultdict

# -------------------- НАСТРОЙКИ --------------------

INPUT_FILES = {
    "A1": "A1 (3000).txt",
    "A2": "A2 (3000).txt",
    "B1": "B1 (3000).txt",
    "B2": "B2 (3000).txt",
    "B2_5000": "B2 (5000).txt",
    "C1": "C1 (5000).txt",
}

OUTPUT_FILE = "../words.json"

# Порядок уровней для сортировки
LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"]


# --------------------------------------------------

def extract_clean_word(line):
    """
    Извлекает чистое слово из строки
    Примеры:
    - "a, an indefinite article" → "a"
    - "about prep., adv." → "about"
    - "match (contest/correspond) n., v." → "match"
    """
    # Убираем всё что не буква в начале строки
    match = re.match(r'^([a-zA-Z]+)', line)
    if match:
        return match.group(1).lower()

    # Запасной вариант
    first_part = line.split()[0] if ' ' in line else line
    clean = re.sub(r'[,\\.()]', '', first_part).lower()
    return clean


def parse_level_file(filepath: Path, level: str):
    """
    Парсит файл одного уровня
    """
    words = []
    seen = set()

    if not filepath.exists():
        print(f"❌ Файл не найден: {filepath}")
        return words

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()

            # Пропускаем мусор
            if not line or "Oxford University Press" in line or line.startswith("©"):
                continue

            # Извлекаем слово
            word = extract_clean_word(line)
            if not word or word.isdigit() or word in seen:
                continue

            seen.add(word)
            words.append({
                "en": word,
                "ru": "",
                "level": level
            })

    return words


def deduplicate(words):
    """
    Убирает дубликаты, сохраняя более низкий уровень
    """
    level_priority = {level: i for i, level in enumerate(LEVEL_ORDER)}
    unique = {}

    for w in words:
        word = w["en"]
        level = w["level"]

        if word not in unique:
            unique[word] = w
        elif level_priority[level] < level_priority[unique[word]["level"]]:
            unique[word] = w

    return list(unique.values())


def sort_words(words):
    """
    Сортировка: по уровню, затем по алфавиту
    """
    level_order = {level: i for i, level in enumerate(LEVEL_ORDER)}
    return sorted(words, key=lambda w: (level_order[w["level"]], w["en"]))


def print_stats(words):
    """
    Статистика
    """
    stats = defaultdict(int)
    for w in words:
        stats[w["level"]] += 1

    print("\n📊 Статистика:")
    print("-" * 25)
    total = 0
    for level in LEVEL_ORDER:
        count = stats.get(level, 0)
        total += count
        print(f"  {level}: {count:4d}")
    print("-" * 25)
    print(f"  Всего: {total:4d}")


def main():
    print("📚 Парсинг Oxford словарей")
    print("=" * 40)

    # Проверка файлов
    for filename in INPUT_FILES.values():
        if not Path(filename).exists():
            print(f"❌ Файл не найден: {filename}")
            print("   Запускайте скрипт из папки dictionaries/")
            sys.exit(1)

    # Парсинг
    all_words = []
    for level_name, filename in INPUT_FILES.items():
        level = "B2" if level_name == "B2_5000" else level_name

        print(f"📄 {filename:<20} ... ", end="")
        words = parse_level_file(Path(filename), level)
        all_words.extend(words)
        print(f"{len(words):4d} слов")

    # Обработка
    print(f"\n🔁 Удаление дубликатов ... ", end="")
    before = len(all_words)
    all_words = deduplicate(all_words)
    print(f"удалено {before - len(all_words)}")

    print(f"🔀 Сортировка ... ", end="")
    all_words = sort_words(all_words)
    print("готово")

    # Добавляем ID
    for i, word in enumerate(all_words, 1):
        word["id"] = i

    # Сохранение в компактном формате
    print(f"💾 Сохранение в {OUTPUT_FILE} ...")
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        f.write("[\n")
        for i, word in enumerate(all_words):
            # Компактная запись: одна строка = одна запись
            line = f'  {{ "id": {word["id"]}, "en": "{word["en"]}", "ru": "{word["ru"]}", "level": "{word["level"]}" }}'
            if i < len(all_words) - 1:
                line += ","
            f.write(line + "\n")
        f.write("]\n")

    print(f"✅ Готово! Создано {len(all_words)} записей")

    # Статистика
    print_stats(all_words)

    # Примеры
    print(f"\n📝 Примеры (первые 10):")
    for i, word in enumerate(all_words[:10], 1):
        print(f"  {word['id']:4d}. {word['en']:15} [{word['level']}]")

    print(f"\n📝 Примеры (последние 5):")
    for word in all_words[-5:]:
        print(f"  {word['id']:4d}. {word['en']:15} [{word['level']}]")


if __name__ == "__main__":
    main()