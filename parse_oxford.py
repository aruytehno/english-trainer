import re
import json
from collections import defaultdict
import PyPDF2
import sys


class OxfordDictionaryParser:
    def __init__(self):
        self.words_by_level = defaultdict(list)
        self.all_words = set()

    def extract_text_from_pdf(self, pdf_path):
        """Извлекает текст из PDF файла"""
        text = ""
        try:
            with open(pdf_path, 'rb') as file:
                reader = PyPDF2.PdfReader(file)
                for page in reader.pages:
                    text += page.extract_text()
        except Exception as e:
            print(f"Ошибка чтения PDF {pdf_path}: {e}")
            sys.exit(1)
        return text

    def parse_oxford_3000(self, text):
        """Парсит Oxford 3000 (A1-B2)"""
        print("Парсинг Oxford 3000...")

        # Определяем уровни и их порядок
        levels_order = ["A1", "A2", "B1", "B2"]
        current_level = None

        lines = text.split('\n')
        for line in lines:
            line = line.strip()

            # Ищем заголовки уровней
            if re.match(r'^A[12]|B[12]$', line):
                current_level = line
                continue

            # Пропускаем пустые строки и заголовки
            if not line or 'Oxford' in line or '©' in line or line.isdigit():
                continue

            # Извлекаем слова из строк
            if current_level:
                self._process_line(line, current_level)

    def parse_oxford_5000(self, text):
        """Парсит Oxford 5000 (B2-C1)"""
        print("Парсинг Oxford 5000...")

        current_level = None
        lines = text.split('\n')
        in_b2_section = False

        for line in lines:
            line = line.strip()

            # Ищем секцию B2 или C1
            if line == "B2":
                current_level = "B2"
                in_b2_section = True
                continue
            elif line == "C1":
                current_level = "C1"
                in_b2_section = True
                continue
            elif "The Oxford 5000™ by CEFR level" in line:
                in_b2_section = False
                continue

            # Пропускаем строки вне секций B2/C1
            if not in_b2_section:
                continue

            # Пропускаем пустые строки и заголовки
            if not line or '©' in line or '/' in line:
                continue

            # Извлекаем слова
            if current_level:
                self._process_line(line, current_level)

    def _process_line(self, line, level):
        """Обрабатывает строку и извлекает слова"""
        # Разбиваем строку на слова (разделители: пробелы, запятые, точки)
        parts = re.split(r'[\s,\.]+', line)

        for part in parts:
            part = part.strip()

            # Пропускаем пустые части и части речи
            if not part or part in ['v', 'n', 'adj', 'adv', 'prep', 'pron', 'det', 'conj', 'exclam', 'modal', 'number']:
                continue

            # Убираем скобки и их содержимое
            if '(' in part:
                part = part.split('(')[0].strip()

            # Убираем цифры в конце (например, "rose2")
            part = re.sub(r'\d+$', '', part)

            # Проверяем, что это слово (только буквы, может быть апостроф или дефис)
            if part and re.match(r"^[a-zA-Z'\-]+$", part):
                word = part.lower()

                # Проверяем дубликаты
                if word not in self.all_words:
                    self.all_words.add(word)
                    self.words_by_level[level].append(word)

    def merge_and_sort_words(self):
        """Объединяет и сортирует слова по уровням"""
        print("Объединение и сортировка слов...")

        # Порядок уровней от простых к сложным
        level_order = ["A1", "A2", "B1", "B2", "C1"]
        sorted_words = []

        for level in level_order:
            if level in self.words_by_level:
                words = sorted(self.words_by_level[level])
                sorted_words.extend(words)
                print(f"  Уровень {level}: {len(words)} слов")

        return sorted_words

    def create_json_output(self, words):
        """Создает JSON в нужном формате"""
        print("Создание JSON...")

        output = []
        word_id = 1

        for word in words:
            # Определяем уровень слова
            level = None
            for lvl in ["A1", "A2", "B1", "B2", "C1"]:
                if word in self.words_by_level[lvl]:
                    level = lvl
                    break

            if level:
                entry = {
                    "id": word_id,
                    "en": word,
                    "ru": "",  # Пустой перевод
                    "level": level
                }
                output.append(entry)
                word_id += 1

        return output

    def save_to_json(self, data, output_path):
        """Сохраняет данные в JSON файл"""
        with open(output_path, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        print(f"Сохранено в {output_path}")
        print(f"Всего слов: {len(data)}")


def main():
    parser = OxfordDictionaryParser()

    # Парсинг Oxford 3000
    print("=" * 50)
    print("ОБРАБОТКА OXFORD 3000")
    print("=" * 50)
    text_3000 = parser.extract_text_from_pdf("Oxford-3000-Key-Words.pdf")
    parser.parse_oxford_3000(text_3000)

    # Парсинг Oxford 5000
    print("\n" + "=" * 50)
    print("ОБРАБОТКА OXFORD 5000")
    print("=" * 50)
    text_5000 = parser.extract_text_from_pdf("Oxford-5000-Key-Words.pdf")
    parser.parse_oxford_5000(text_5000)

    # Объединение и сортировка
    print("\n" + "=" * 50)
    print("ОБЪЕДИНЕНИЕ РЕЗУЛЬТАТОВ")
    print("=" * 50)
    sorted_words = parser.merge_and_sort_words()

    # Создание JSON
    json_data = parser.create_json_output(sorted_words)

    # Сохранение
    parser.save_to_json(json_data, "words.json")

    # Статистика
    print("\n" + "=" * 50)
    print("СТАТИСТИКА")
    print("=" * 50)
    total_words = len(json_data)
    print(f"Всего уникальных слов: {total_words}")

    # Пример первых 20 слов
    print("\nПример первых 20 слов:")
    for i, entry in enumerate(json_data[:20]):
        print(f"  {entry['id']:4d}. {entry['en']:20s} [{entry['level']}]")


if __name__ == "__main__":
    main()