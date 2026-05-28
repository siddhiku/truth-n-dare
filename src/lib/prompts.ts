export type ChaosMode = "easy" | "crispy" | "ruthless";
export type PromptType = "truth" | "dare";

const modeDescriptions: Record<ChaosMode, string> = {
  easy: "funny, harmless, and lighthearted — suitable for all ages, keeps energy high and laughs flowing",
  crispy: "creates awkward social pressure and mild embarrassment — fun but slightly uncomfortable, makes people squirm",
  ruthless: "savage, brutally honest, hilariously uncomfortable — still safe and funny but no mercy",
};

export function buildSystemPrompt(): string {
  return `You are a charismatic party game host generating Truth or Dare prompts.
Rules you MUST follow:
- Never generate illegal, NSFW, sexual, violent, or bullying content
- Never target specific real people, races, religions, or identities
- Keep everything entertaining and group-friendly
- Be creative, surprising, and fun
- Keep responses SHORT — one sentence max for truth questions, 1-2 sentences for dares
- Never repeat generic prompts — be original and specific`;
}

export function buildPrompt(type: PromptType, mode: ChaosMode): string {
  const modeDesc = modeDescriptions[mode];

  if (type === "truth") {
    return `Generate ONE original truth question that is ${modeDesc}.
The question should make the person think and the group react.
Reply with ONLY the question, no labels, no quotes, no explanation.`;
  }

  return `Generate ONE original dare that is ${modeDesc}.
The dare should be doable right now in a group setting.
Reply with ONLY the dare instruction, no labels, no quotes, no explanation.`;
}

export const fallbackPrompts: Record<ChaosMode, Record<PromptType, string[]>> = {
  easy: {
    truth: [
      "What's the most embarrassing song you know all the words to?",
      "What's a weird food combination you secretly love?",
      "What's the last lie you told and got away with?",
      "What's your most useless hidden talent?",
    ],
    dare: [
      "Do your best impression of the person to your left.",
      "Text someone 'we need to talk' and wait 30 seconds before explaining.",
      "Speak in a dramatic movie villain voice for the next 2 minutes.",
      "Do 10 jumping jacks while narrating yourself like a sports commentator.",
    ],
  },
  crispy: {
    truth: [
      "Who in this room would you most awkwardly avoid if you saw them in public?",
      "What's the most childish thing you still do when no one's watching?",
      "What opinion do you have that you'd never say out loud at work?",
      "Who was your most embarrassing crush and why?",
    ],
    dare: [
      "Let the group write a dramatic tweet from your phone (doesn't have to be posted).",
      "Recreate your most embarrassing moment from high school in 30 seconds.",
      "Call a contact named with the letter 'M' and speak only in rhymes for 20 seconds.",
      "Do a dramatic slow-motion replay of how you woke up this morning.",
    ],
  },
  ruthless: {
    truth: [
      "What's the pettiest reason you've ever cut someone off?",
      "What's the most embarrassing thing you've googled in the past month?",
      "If everyone in this room saw your camera roll right now, who would be most shocked?",
      "What's a secret you've kept for years that would shock everyone here?",
    ],
    dare: [
      "Read your most recent 'sent' message in the most dramatic voice possible.",
      "Do your best impression of each person in the room, one by one.",
      "Let the group pick any contact in your phone — you have to send them a voice note saying 'I've been thinking about you.'",
      "Stand up and give a 30-second motivational speech about why you're the main character.",
    ],
  },
};
