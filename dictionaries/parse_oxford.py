#!/usr/bin/env python3
"""
Парсер Oxford 3000 / 5000 из текстовых файлов → words.json

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


# --------------------------------------------------

def parse_level_file(filepath: Path, level: str):
    """
    Парсит файл одного уровня и возвращает список слов

    Формат строки: "word part_of_speech" или "word part_of_speech, part_of_speech"
    Пример: "even adv.", "match (contest/correspond) n., v."
    """
    words = []

    if not filepath.exists():
        print(f"❌ Файл не найден: {filepath}")
        return words

    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

        # Разбиваем на строки и обрабатываем каждую
        for line in content.splitlines():
            line = line.strip()

            # Пропускаем пустые строки и заголовки
            if not line or "Oxford University Press" in line:
                continue

            # Разделяем первое слово и остальное
            # Пример: "even adv." -> word="even adv.", level="A1"
            # Мы сохраняем ВСЮ строку как есть
            if line:
                # Убираем номер страницы если есть
                if line.startswith("©"):
                    continue

                # Сохраняем строку полностью как английское слово
                english_word = line.strip()

                words.append({
                    "en": english_word,
                    "ru": "",
                    "level": level
                })

    return words


def deduplicate_preserve_levels(words):
    """
    Убирает дубликаты по чистому слову (без части речи)
    Если слово есть в нескольких уровнях, сохраняем самый низкий уровень
    """

    # Извлекаем чистое слово из строки (первое слово до пробела)
    def extract_base_word(entry):
        en = entry["en"]
        # Берем первое слово до пробела, игнорируя скобки
        match = re.match(r'^([a-zA-Z\-]+)', en)
        if match:
            return match.group(1).lower()
        return en.split()[0].lower() if ' ' in en else en.lower()

    # Приоритет уровней (A1 самый высокий приоритет)
    level_priority = {level: i for i, level in enumerate(LEVEL_ORDER)}

    unique_words = {}

    for w in words:
        base_word = extract_base_word(w)
        level = w["level"]

        if base_word not in unique_words:
            unique_words[base_word] = w
        else:
            # Если слово уже есть, проверяем уровень
            existing_level = unique_words[base_word]["level"]
            if level_priority[level] < level_priority[existing_level]:
                # Сохраняем слово с более низким уровнем (A1 лучше чем B2)
                unique_words[base_word] = w

    return list(unique_words.values())


def sort_words_by_level(words):
    """
    Сортирует слова: сначала по уровню (A1→C1), потом по алфавиту
    """
    level_order = {level: i for i, level in enumerate(LEVEL_ORDER)}

    # Функция для сравнения: сначала по уровню, потом по английскому слову
    def sort_key(word):
        # Для сортировки по алфавиту берем первое слово строки
        base_word = re.match(r'^([a-zA-Z\-]+)', word["en"])
        sort_word = base_word.group(1).lower() if base_word else word["en"].lower()
        return (level_order[word["level"]], sort_word)

    return sorted(words, key=sort_key)


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
    print("\n🔤 Примеры слов по уровням (первые 3):")
    for level in LEVEL_ORDER:
        level_words = [w["en"] for w in words if w["level"] == level][:3]
        if level_words:
            print(f"  {level}: {', '.join(level_words)}")


def main():
    all_words = []

    print("📚 Парсинг Oxford словарей из текстовых файлов")
    print("=" * 50)

    # Парсим все файлы
    for level_name, filepath in INPUT_FILES.items():
        # Определяем уровень CEFR из имени файла
        if level_name in ["A1", "A2", "B1", "B2", "C1"]:
            level = level_name
        elif level_name == "B2_5000":
            level = "B2"  # Oxford 5000 B2 слова
        else:
            level = level_name

        print(f"📄 Читаю {filepath} ...")
        words = parse_level_file(Path(filepath), level)
        all_words.extend(words)
        print(f"  Извлечено: {len(words)} слов")

    print(f"\n🔁 Удаляю дубликаты (сохраняю более низкий уровень)...")
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
    print("-" * 50)
    for i, word in enumerate(all_words[:20], 1):
        print(f"{word['id']:4d}. {word['en']:30s} [{word['level']}]")

    # Пример последних 5 слов
    print(f"\n📝 Последние 5 слов:")
    print("-" * 50)
    for word in all_words[-5:]:
        print(f"{word['id']:4d}. {word['en']:30s} [{word['level']}]")


if __name__ == "__main__":
    main()