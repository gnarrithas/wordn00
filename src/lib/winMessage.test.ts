import { getWinMessage, RANDOM_WIN_MESSAGES } from "./winMessage";

test("early wins get fixed cheers", () => {
  expect(getWinMessage(1, 6)).toBe("Clairvoyant");
  expect(getWinMessage(2, 6)).toBe("Lucky");
  expect(getWinMessage(3, 6)).toBe("Amazing");
});

test("a win on the last guess is a close call", () => {
  expect(getWinMessage(6, 6)).toBe("Phew");
  expect(getWinMessage(8, 8)).toBe("Phew");
});

test("other wins pick a random cheer", () => {
  expect(getWinMessage(4, 6, () => 0)).toBe(RANDOM_WIN_MESSAGES[0]);
  expect(getWinMessage(5, 6, () => 0.999999)).toBe(
    RANDOM_WIN_MESSAGES[RANDOM_WIN_MESSAGES.length - 1],
  );
});
