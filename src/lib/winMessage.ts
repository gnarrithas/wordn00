const FIXED_MESSAGES: Record<number, string> = {
  1: "Clairvoyant",
  2: "Lucky",
  3: "Amazing",
};

export const RANDOM_WIN_MESSAGES = [
  "Great",
  "Cool",
  "Nice",
  "Super",
  "Bravo",
  "Woohoo",
  "Ace",
  "Impressive",
];

// The cheer for a win on guess `guessCount` out of `maxGuesses`.
export const getWinMessage = (
  guessCount: number,
  maxGuesses: number,
  random: () => number = Math.random,
) => {
  if (FIXED_MESSAGES[guessCount]) {
    return FIXED_MESSAGES[guessCount];
  }
  if (guessCount >= maxGuesses) {
    return "Phew";
  }
  const index = Math.floor(random() * RANDOM_WIN_MESSAGES.length);
  return RANDOM_WIN_MESSAGES[Math.min(index, RANDOM_WIN_MESSAGES.length - 1)];
};
