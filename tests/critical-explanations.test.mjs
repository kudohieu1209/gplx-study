import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const questionsUrl = new URL("../app/data/critical-questions.json", import.meta.url);
const explanationsUrl = new URL("../app/data/critical-explanations.json", import.meta.url);

test("provides a detailed explanation for every critical question", async () => {
  const [questionsSource, explanationsSource] = await Promise.all([
    readFile(questionsUrl, "utf8"),
    readFile(explanationsUrl, "utf8"),
  ]);
  const questions = JSON.parse(questionsSource);
  const explanations = JSON.parse(explanationsSource);
  const questionIds = questions.map(({ id }) => String(id));

  assert.equal(questions.length, 60);
  assert.deepEqual(Object.keys(explanations).sort(), questionIds.sort());

  for (const question of questions) {
    const explanation = explanations[question.id];
    assert.ok(explanation.reason.length >= 80, `Câu ${question.id} cần lời giải chi tiết hơn`);
    assert.ok(explanation.takeaway.length >= 20, `Câu ${question.id} cần mẹo ghi nhớ rõ hơn`);
  }
});
