import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const questionsUrl = new URL("../app/data/questions.json", import.meta.url);
const explanationsUrl = new URL("../app/data/question-explanations.json", import.meta.url);

test("keeps each additional explanation complete and linked to a question", async () => {
  const [questionsSource, explanationsSource] = await Promise.all([
    readFile(questionsUrl, "utf8"),
    readFile(explanationsUrl, "utf8"),
  ]);
  const questions = JSON.parse(questionsSource);
  const explanations = JSON.parse(explanationsSource);
  const knownIds = new Set(questions.map(({ id }) => String(id)));

  assert.equal(Object.keys(explanations).length, 30);
  for (let id = 16; id <= 45; id += 1) {
    assert.ok(explanations[id], `Thiếu lời giải câu ${id}`);
  }

  for (const [id, explanation] of Object.entries(explanations)) {
    assert.ok(knownIds.has(id), `Lời giải ${id} không có câu hỏi tương ứng`);
    assert.ok(explanation.reason.length >= 80, `Câu ${id} cần lời giải chi tiết hơn`);
    assert.ok(explanation.takeaway.length >= 20, `Câu ${id} cần phần ghi nhớ rõ hơn`);
  }
});
