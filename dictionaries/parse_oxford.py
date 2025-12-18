#!/usr/bin/env python3
"""
Парсер Oxford 3000 / 5000 из текстовых файлов → words.json
Извлекает только чистые слова без частей речи.

Использует готовые текстовые файлы:
    dictionaries/A1 (3000).txt
    dictionaries/A2 (3000).txt
    dictionaries/B1 (3000).txt
    dictionaries/B2 (3000).txt
    dictionaries/B2 (5000).txt
    dictionaries/C1 (5000).txt

Запуск:
    python parse_oxford.py
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
    "B2_5000": "B2 (5000).txt",  # Oxford 5000 B2 слова
    "C1": "C1 (5000).txt",
}

OUTPUT_FILE = "words.json"

# Порядок уровней для сортировки
LEVEL_ORDER = ["A1", "A2", "B1", "B2", "C1"]

# Регулярка для извлечения чистого слова
# Примеры:
#   "a, an indefinite article" → "a"
#   "about prep., adv." → "about"
#   "match (contest/correspond) n., v." → "match"
CLEAN_WORD_RE = re.compile(r'^([a-zA-Z]+)')


# --------------------------------------------------

def extract_clean_word(line):
    """
    Извлекает чистое слово из строки
    """
    # Убираем всё после первого не-буквенного символа
    match = CLEAN_WORD_RE.match(line)
    if match:
        return match.group(1).lower()

    # Если регулярка не сработала, пробуем другой способ
    # Разделяем по пробелам и берем первое слово
    first_part = line.split()[0] if ' ' in line else line

    # Убираем запятые, точки, скобки
    clean = re.sub(r'[,\\.()]', '', first_part)
    return clean.lower()


def parse_level_file(filepath: Path, level: str):
    """
    Парсит файл одного уровня и возвращает список чистых слов
    """
    words = []
    seen_words = set()  # Для проверки дубликатов внутри одного файла

    if not filepath.exists():
        print(f"❌ Файл не найден: {filepath}")
        return words

    with open(filepath, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()

            # Пропускаем пустые строки и заголовки
            if not line or "Oxford University Press" in line or line.startswith("©"):
                continue

            # Извлекаем чистое слово
            clean_word = extract_clean_word(line)

            # Пропускаем если не извлекли слово или это цифра
            if not clean_word or clean_word.isdigit():
                continue

            # Пропускаем дубликаты внутри файла
            if clean_word in seen_words:
                continue

            seen_words.add(clean_word)
            words.append({
                "en": clean_word,
                "ru": "",
                "level": level
            })

    return words


def deduplicate_preserve_levels(words):
    """
    Убирает дубликаты слов.
    Если слово есть в нескольких уровнях, сохраняем самый низкий уровень.
    """
    # Приоритет уровней (A1 самый высокий приоритет)
    level_priority = {level: i for i, level in enumerate(LEVEL_ORDER)}

    unique_words = {}

    for w in words:
        word = w["en"]
        level = w["level"]

        if word not in unique_words:
            unique_words[word] = w
        else:
            # Если слово уже есть, проверяем уровень
            existing_level = unique_words[word]["level"]
            if level_priority[level] < level_priority[existing_level]:
                # Сохраняем слово с более низким уровнем (A1 лучше чем B2)
                unique_words[word] = w

    return list(unique_words.values())


def sort_words_by_level(words):
    """
    Сортирует слова: сначала по уровню (A1→C1), потом по алфавиту
    """
    level_order = {level: i for i, level in enumerate(LEVEL_ORDER)}

    return sorted(words, key=lambda w: (level_order[w["level"]], w["en"]))


def print_statistics(words):
    """
    Выводит статистику по уровням
    """
    stats = defaultdict(int)
    for w in words:
        stats[w["level"]] += 1

    print("\n📊 Статистика по уровням:")
    print("-" * 30)
    total = 0
    for level in LEVEL_ORDER:
        count = stats.get(level, 0)
        total += count
        print(f"  {level}: {count:4d} слов")
    print("-" * 30)
    print(f"  Всего: {total:4d} слов")

    # Примеры слов каждого уровня
    print("\n🔤 Примеры слов по уровням (первые 5):")
    for level in LEVEL_ORDER:
        level_words = [w["en"] for w in words if w["level"] == level][:5]
        if level_words:
            print(f"  {level}: {', '.join(level_words)}")


def main():
    print("📚 Парсинг Oxford словарей из текстовых файлов")
    print("=" * 50)

    # Проверяем, что мы в правильной папке
    if not Path("A1 (3000).txt").exists():
        print("❌ Файлы не найдены в текущей папке.")
        print("   Убедитесь, что скрипт запускается из папки dictionaries/")
        sys.exit(1)

    all_words = []

    # Парсим все файлы
    for level_name, filename in INPUT_FILES.items():
        # Определяем уровень CEFR из имени файла
        if level_name in ["A1", "A2", "B1", "B2", "C1"]:
            level = level_name
        elif level_name == "B2_5000":
            level = "B2"  # Oxford 5000 B2 слова
        else:
            level = level_name

        print(f"📄 Читаю {filename} ...")
        words = parse_level_file(Path(filename), level)
        all_words.extend(words)
        print(f"  Извлечено: {len(words)} чистых слов")

    print(f"\n🔁 Удаляю дубликаты между уровнями...")
    before_count = len(all_words)
    all_words = deduplicate_preserve_levels(all_words)
    after_count = len(all_words)
    print(f"  Было: {before_count}, стало: {after_count} (удалено: {before_count - after_count})")

    print(f"\n🔀 Сортирую по уровням и алфавиту...")
    all_words = sort_words_by_level(all_words)

    # Добавляем ID
    for i, word in enumerate(all_words, 1):
        word["id"] = i

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
        print(f"{word['id']:4d}. {word['en']:15s} [{word['level']}]")

    # Пример последних 5 слов
    print(f"\n📝 Последние 5 слов:")
    print("-" * 40)
    for word in all_words[-5:]:
        print(f"{word['id']:4d}. {word['en']:15s} [{word['level']}]")


if __name__ == "__main__":
    main()