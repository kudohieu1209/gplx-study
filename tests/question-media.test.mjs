import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const questions = JSON.parse(
  await readFile(new URL("../app/data/questions.json", import.meta.url), "utf8"),
);

test("all sign and traffic scenario questions retain their illustrations", () => {
  assert.equal(questions.length, 600);
  const missing = questions.filter(({ id, images }) => id >= 301 && !images.length);
  assert.deepEqual(missing.map(({ id }) => id), []);
  assert.deepEqual(questions.find(({ id }) => id === 312).images, [
    "/question-media/q312-1.jpg",
  ]);
});

test("every question image references a bundled local file", async () => {
  for (const question of questions) {
    for (const image of question.images) {
      assert.match(image, /^\/question-media\/q\d{3}-\d+\.(jpg|jpeg|png|webp|gif)$/);
      await access(new URL(`../public${image}`, import.meta.url));
    }
  }
});
