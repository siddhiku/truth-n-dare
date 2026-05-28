const STORAGE_KEY = "tnd:username";

const adjectives = [
  "Sneaky", "Chaotic", "Brave", "Wild", "Sly", "Spicy", "Loud", "Chill",
  "Bold", "Fuzzy", "Shady", "Nerdy", "Goofy", "Toxic", "Smooth", "Rogue",
];

const nouns = [
  "Panda", "Viper", "Ghost", "Ninja", "Shark", "Wolf", "Cobra", "Raven",
  "Phoenix", "Tiger", "Falcon", "Mango", "Pickle", "Waffle", "Gecko", "Squid",
];

function generateUsername(): string {
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 90) + 10;
  return `${adj}${noun}${num}`;
}

export function getOrCreateUsername(): string {
  if (typeof window === "undefined") return "Player";
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) return stored;
    const name = generateUsername();
    localStorage.setItem(STORAGE_KEY, name);
    return name;
  } catch {
    return generateUsername();
  }
}

export function saveUsername(name: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, name);
  } catch {}
}
