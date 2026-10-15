import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { restoreChapterAnswers } from "../app/study-progress.ts";

const questions = JSON.parse(
  await readFile(new URL("../app/data/questions.json", import.meta.url), "utf8"),
);
const chapter = questions.filter(({ chapter }) => chapter === 3);

function savedProgress(lastAnswer, streak = 0) {
  return {
    attempts: 1, correct: streak ? 1 : 0, streak, mastered: false,
    lastSeen: 1, nextReview: 2, lastAnswer,
  };
}

test("reopening a completed 58-question chapter retains every selected answer", () => {
  const progress = Object.fromEntries(chapter.map((question, index) => [
    question.id, savedProgress(index % question.options.length),
  ]));
  const snapshot = structuredClone(progress);

  const answers = restoreChapterAnswers(chapter, progress);

  assert.equal(Object.keys(answers).length, 58);
  for (const question of chapter) {
    assert.equal(answers[question.id], progress[question.id].lastAnswer);
  }
  assert.deepEqual(progress, snapshot);
});

test("partially completed chapters retain correct and wrong answers, including option zero", () => {
  const [first, second, unanswered] = chapter;
  const wrongAnswer = (second.correctAnswer + 1) % second.options.length;
  const progress = {
    [first.id]: savedProgress(0),
    [second.id]: savedProgress(wrongAnswer),
    181: savedProgress(1),
  };

  assert.deepEqual(restoreChapterAnswers(chapter, progress), {
    [first.id]: 0,
    [second.id]: wrongAnswer,
  });
  assert.equal(restoreChapterAnswers(chapter, progress)[unanswered.id], undefined);
});

test("legacy progress restores known correct answers without inventing a wrong selection", () => {
  const [correct, unknown] = chapter;
  const progress = {
    [correct.id]: savedProgress(undefined, 1),
    [unknown.id]: savedProgress(undefined),
  };

  assert.deepEqual(restoreChapterAnswers(chapter, progress), {
    [correct.id]: correct.correctAnswer,
  });
  assert.equal(progress[unknown.id].attempts, 1);
});

test("an explicitly reset chapter starts without saved answers", () => {
  assert.deepEqual(restoreChapterAnswers(chapter, {}), {});
});
