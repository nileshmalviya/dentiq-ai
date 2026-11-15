export interface ChatMessage { id: string; sender: "assistant" | "user"; text: string; }
export const initialMessages: ChatMessage[] = [
  { id: "intro", sender: "assistant", text: "Hi! I’m Dentiq AI 👋\nHow can I help you today?" },
  { id: "concern", sender: "user", text: "I have a toothache on my lower left." },
  { id: "followup", sender: "assistant", text: "I’m sorry to hear that. Let me first help you assess the issue with a few questions." },
];
export const symptomOptions = ["Chewing or biting", "Hot or cold sensitivity", "Night-time pain", "Swelling or tenderness"];
export const chatResponses = [
  "Thank you for sharing. You can select the symptoms above and explore the sample dentist recommendations below.",
  "I can help you explore dentists, view their profiles, and try booking a sample appointment. This demo uses predefined replies.",
  "You can review the available dental services on the home screen or continue to the sample recommendations.",
];
