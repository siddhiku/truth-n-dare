import { ChaosMode, PromptType } from "./types";

const fallbackPrompts: Record<ChaosMode, Record<PromptType, string[]>> = {
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

export function pickPrompt(type: PromptType, mode: ChaosMode): string {
  const pool = fallbackPrompts[mode]?.[type];
  if (!pool || pool.length === 0) return "Tell everyone your most embarrassing moment.";
  return pool[Math.floor(Math.random() * pool.length)];
}
