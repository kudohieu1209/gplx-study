from __future__ import annotations

import json
import re
import shutil
import sys
from collections import Counter
from pathlib import Path
from typing import Any

import pdfplumber
from pypdf import PdfReader


ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PDF = ROOT.parent / "docs" / "600 câu lý thuyết lái xe.pdf.pdf"
OUTPUT_JSON = ROOT / "app" / "data" / "questions.json"
MEDIA_DIR = ROOT / "public" / "question-media"

CHAPTERS = [
    (1, 1, 180, "Quy định chung và quy tắc giao thông đường bộ"),
    (
        2,
        181,
        205,
        "Văn hóa giao thông, đạo đức người lái xe, kỹ năng phòng cháy, chữa cháy và cứu hộ, cứu nạn",
    ),
    (3, 206, 263, "Kỹ thuật lái xe"),
    (4, 264, 300, "Cấu tạo và sửa chữa"),
    (5, 301, 485, "Báo hiệu đường bộ"),
    (6, 486, 600, "Giải thế sa hình và kỹ năng xử lý tình huống giao thông"),
]


def chapter_for(question_id: int) -> tuple[int, str]:
    for chapter, first, last, title in CHAPTERS:
        if first <= question_id <= last:
            return chapter, title
    raise ValueError(f"Question {question_id} is outside the 600-question set")


def normalize_text(value: str) -> str:
    value = value.replace("\u00a0", " ")
    value = re.sub(r"\s+", " ", value).strip()
    value = re.sub(r"\s+([,.;:?!])", r"\1", value)

    # A few justified bold lines in the source PDF contain visual spaces inside
    # Vietnamese words. These targeted repairs keep the exported text readable.
    repairs = {
        r"\b[Nn]gư\s+ời\b": lambda m: "Người" if m.group(0)[0].isupper() else "người",
        r"\bđư\s+ờng\b": "đường",
        r"\bĐư\s+ờng\b": "Đường",
        r"\bphương ti\s+ện\b": "phương tiện",
        r"\bPhương ti\s+ện\b": "Phương tiện",
        r"\bđi\s+ều\b": "điều",
        r"\bĐi\s+ều\b": "Điều",
        r"\bhi\s+ệu\b": "hiệu",
        r"\bHi\s+ệu\b": "Hiệu",
        r"\bđư\s+ợc\b": "được",
        r"\bĐư\s+ợc\b": "Được",
        r"\bth\s+ế\b": "thế",
        r"\bTh\s+ế\b": "Thế",
    }
    for pattern, replacement in repairs.items():
        value = re.sub(pattern, replacement, value)
    return value


def group_lines(page: pdfplumber.page.Page) -> list[dict[str, Any]]:
    words = page.extract_words(
        x_tolerance=1,
        y_tolerance=2,
        keep_blank_chars=False,
        use_text_flow=False,
    )
    lines: list[dict[str, Any]] = []
    for word in words:
        target = next(
            (line for line in lines if abs(line["top"] - word["top"]) < 2),
            None,
        )
        if target is None:
            target = {"top": word["top"], "words": []}
            lines.append(target)
        target["words"].append(word)

    result: list[dict[str, Any]] = []
    for line in sorted(lines, key=lambda item: item["top"]):
        line_words = sorted(line["words"], key=lambda item: item["x0"])
        result.append(
            {
                "type": "line",
                "top": min(word["top"] for word in line_words),
                "bottom": max(word["bottom"] for word in line_words),
                "x0": min(word["x0"] for word in line_words),
                "x1": max(word["x1"] for word in line_words),
                "text": " ".join(word["text"] for word in line_words),
                "words": line_words,
            }
        )
    return result


def split_inline_options(line: dict[str, Any]) -> list[dict[str, Any]]:
    words = line.get("words", [])
    markers: list[int] = []
    for index, word in enumerate(words):
        if not re.fullmatch(r"[1-4]\.", word["text"]):
            continue
        if index == 0:
            markers.append(index)
            continue
        previous_word = words[index - 1]
        gap = float(word["x0"]) - float(previous_word["x1"])
        if gap >= 12 and index + 1 < len(words):
            markers.append(index)
    if len(markers) < 2 or markers[0] != 0:
        return [line]

    parts: list[dict[str, Any]] = []
    for marker_index, word_index in enumerate(markers):
        end_index = (
            markers[marker_index + 1]
            if marker_index + 1 < len(markers)
            else len(words)
        )
        part_words = words[word_index:end_index]
        parts.append(
            {
                "type": "line",
                "top": min(word["top"] for word in part_words),
                "bottom": max(word["bottom"] for word in part_words),
                "x0": min(word["x0"] for word in part_words),
                "x1": max(word["x1"] for word in part_words),
                "text": " ".join(word["text"] for word in part_words),
                "words": part_words,
            }
        )
    return parts


def is_underlined(line: dict[str, Any], rects: list[dict[str, Any]]) -> bool:
    for rect in rects:
        if rect.get("height", 99) > 1.5:
            continue
        color = rect.get("non_stroking_color")
        if isinstance(color, (tuple, list)):
            color_is_dark = all(float(component) <= 0.2 for component in color)
        elif isinstance(color, (int, float)):
            color_is_dark = float(color) <= 0.2
        else:
            color_is_dark = color is None
        if not color_is_dark:
            continue
        vertical_distance = abs(float(rect["top"]) - float(line["bottom"]))
        horizontal_overlap = min(rect["x1"], line["x1"]) - max(
            rect["x0"], line["x0"]
        )
        if vertical_distance <= 3.5 and horizontal_overlap >= 2:
            return True
    return False


def new_question(question_id: int, page_number: int) -> dict[str, Any]:
    chapter, chapter_title = chapter_for(question_id)
    return {
        "id": question_id,
        "chapter": chapter,
        "chapterTitle": chapter_title,
        "questionParts": [],
        "optionParts": {1: [], 2: [], 3: [], 4: []},
        "answerHits": set(),
        "images": [],
        "sourcePage": page_number,
    }


def save_page_image(
    question: dict[str, Any], raw_image: Any, media_dir: Path
) -> None:
    image_number = len(question["images"]) + 1
    suffix = Path(raw_image.name).suffix.lower() or ".png"
    if suffix not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
        suffix = ".png"
    filename = f"q{question['id']:03d}-{image_number}{suffix}"
    destination = media_dir / filename
    destination.write_bytes(raw_image.data)
    question["images"].append(f"/question-media/{filename}")


def extract(pdf_path: Path) -> list[dict[str, Any]]:
    questions: dict[int, dict[str, Any]] = {}
    current: dict[str, Any] | None = None
    current_option: int | None = None
    skipping_chapter_title = False

    if MEDIA_DIR.exists():
        shutil.rmtree(MEDIA_DIR)
    MEDIA_DIR.mkdir(parents=True, exist_ok=True)

    reader = PdfReader(str(pdf_path))
    with pdfplumber.open(str(pdf_path)) as pdf:
        for page_index in range(3, len(pdf.pages)):
            page = pdf.pages[page_index]
            page_number = page_index + 1
            lines = [
                part
                for line in group_lines(page)
                for part in split_inline_options(line)
            ]
            image_meta = page.images
            raw_images = list(reader.pages[page_index].images)

            image_events = []
            for index, meta in enumerate(image_meta):
                if index >= len(raw_images):
                    continue
                image_events.append(
                    {
                        "type": "image",
                        "top": meta.get("top", 0),
                        "raw": raw_images[index],
                    }
                )

            events = sorted(
                [*lines, *image_events],
                key=lambda item: (
                    item["top"],
                    0 if item["type"] == "line" else 1,
                    item.get("x0", 0),
                ),
            )

            for event in events:
                if event["type"] == "image":
                    if current is not None:
                        save_page_image(current, event["raw"], MEDIA_DIR)
                    continue

                text = normalize_text(event["text"])
                if not text or re.fullmatch(r"\d+", text):
                    continue

                if text.upper().startswith("CHƯƠNG "):
                    skipping_chapter_title = True
                    continue

                question_match = re.match(r"^Câu\s+(\d+)[.:]\s*(.*)$", text)
                if question_match:
                    question_id = int(question_match.group(1))
                    current = questions.setdefault(
                        question_id, new_question(question_id, page_number)
                    )
                    current["questionParts"].append(question_match.group(2))
                    current_option = None
                    skipping_chapter_title = False
                    continue

                if skipping_chapter_title:
                    continue

                if current is None:
                    continue

                option_match = re.match(r"^([1-4])\.\s*(.*)$", text)
                if option_match:
                    current_option = int(option_match.group(1))
                    current["optionParts"][current_option].append(option_match.group(2))
                elif current_option is None:
                    current["questionParts"].append(text)
                else:
                    current["optionParts"][current_option].append(text)

                if current_option is not None and is_underlined(event, page.rects):
                    current["answerHits"].add(current_option)

    output: list[dict[str, Any]] = []
    for question_id in sorted(questions):
        raw = questions[question_id]
        options = [
            normalize_text(" ".join(raw["optionParts"][number]))
            for number in range(1, 5)
            if raw["optionParts"][number]
        ]
        answer_hits = sorted(raw["answerHits"])
        correct_answer = answer_hits[0] - 1 if len(answer_hits) == 1 else None
        output.append(
            {
                "id": question_id,
                "chapter": raw["chapter"],
                "chapterTitle": raw["chapterTitle"],
                "question": normalize_text(" ".join(raw["questionParts"])),
                "options": options,
                "correctAnswer": correct_answer,
                "images": raw["images"],
                "sourcePage": raw["sourcePage"],
            }
        )

    return output


def validate(questions: list[dict[str, Any]]) -> None:
    ids = [question["id"] for question in questions]
    expected = list(range(1, 601))
    if ids != expected:
        missing = sorted(set(expected) - set(ids))
        extras = sorted(set(ids) - set(expected))
        raise ValueError(f"Question IDs are invalid. Missing={missing}, extras={extras}")

    no_answer = [q["id"] for q in questions if q["correctAnswer"] is None]
    invalid_answer = [
        q["id"]
        for q in questions
        if q["correctAnswer"] is not None
        and q["correctAnswer"] >= len(q["options"])
    ]
    bad_options = [q["id"] for q in questions if len(q["options"]) < 2]
    empty_questions = [q["id"] for q in questions if not q["question"]]
    if no_answer or invalid_answer or bad_options or empty_questions:
        raise ValueError(
            "Extraction validation failed: "
            f"no_answer={no_answer}, invalid_answer={invalid_answer}, "
            f"bad_options={bad_options}, empty_questions={empty_questions}"
        )

    counts = Counter(question["chapter"] for question in questions)
    expected_counts = {1: 180, 2: 25, 3: 58, 4: 37, 5: 185, 6: 115}
    if dict(counts) != expected_counts:
        raise ValueError(f"Chapter counts do not match: {dict(counts)}")


def main() -> int:
    pdf_path = Path(sys.argv[1]) if len(sys.argv) > 1 else DEFAULT_PDF
    if not pdf_path.exists():
        print(f"PDF not found: {pdf_path}", file=sys.stderr)
        return 2

    questions = extract(pdf_path)
    validate(questions)
    OUTPUT_JSON.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_JSON.write_text(
        json.dumps(questions, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    image_count = sum(len(question["images"]) for question in questions)
    print(
        f"Exported {len(questions)} questions and {image_count} images to {OUTPUT_JSON}"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
