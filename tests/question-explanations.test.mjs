import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const questionsUrl = new URL("../app/data/questions.json", import.meta.url);
const explanationsUrl = new URL("../app/data/question-explanations.json", import.meta.url);
const pageUrl = new URL("../app/page.tsx", import.meta.url);

test("provides a complete explanation for all 600 regular questions", async () => {
  const [questionsSource, explanationsSource, pageSource] = await Promise.all([
    readFile(questionsUrl, "utf8"),
    readFile(explanationsUrl, "utf8"),
    readFile(pageUrl, "utf8"),
  ]);
  const questions = JSON.parse(questionsSource);
  const explanations = JSON.parse(explanationsSource);
  const knownIds = new Set(questions.map(({ id }) => String(id)));
  const inlineBlock = pageSource.match(
    /const questionExplanations:[\s\S]*?= \{([\s\S]*?)\n\};\n\nfunction getQuestionExplanation/u,
  );

  assert.ok(inlineBlock, "Không tìm thấy khối lời giải có sẵn trong page.tsx");
  const inlineIds = new Set(
    [...inlineBlock[1].matchAll(/^\s{2}(\d+):\s*\{/gmu)].map((match) => match[1]),
  );

  assert.equal(questions.length, 600);
  assert.equal(Object.keys(explanations).length, 560);

  for (const [id, explanation] of Object.entries(explanations)) {
    assert.ok(knownIds.has(id), `Lời giải ${id} không có câu hỏi tương ứng`);
    assert.ok(explanation.reason.length >= 80, `Câu ${id} cần lời giải chi tiết hơn`);
    assert.ok(explanation.takeaway.length >= 20, `Câu ${id} cần phần ghi nhớ rõ hơn`);
  }

  const generatedExplanations = Object.entries(explanations)
    .filter(([id]) => Number(id) > 45)
    .map(([, explanation]) => explanation);
  const forbiddenBoilerplate = [
    "Theo quy định và quy tắc giao thông áp dụng cho tình huống này",
    "Đây là nội dung đầy đủ để chọn đáp án",
    "các phương án khác thiếu điều kiện cần thiết",
    "Điểm quyết định là phải áp dụng đủ điều kiện",
  ];

  for (const phrase of forbiddenBoilerplate) {
    assert.ok(
      generatedExplanations.every(({ reason }) => !reason.includes(phrase)),
      `Không được tái sử dụng lời giải mẫu: ${phrase}`,
    );
  }

  const distinctOpenings = new Set(
    generatedExplanations.map(({ reason }) => reason.slice(0, 80)),
  );
  assert.ok(
    distinctOpenings.size >= generatedExplanations.length * 0.9,
    "Lời giải phải mở đầu bằng nội dung riêng của từng câu, không dùng cùng một khuôn",
  );

  for (const question of questions) {
    const id = String(question.id);
    const sources = Number(inlineIds.has(id)) + Number(Boolean(explanations[id]));
    assert.equal(sources, 1, `Câu ${id} phải có đúng một nguồn lời giải`);
  }
});
