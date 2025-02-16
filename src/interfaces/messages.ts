export interface Message {
    role: "system" | "user";
    content: string;
  }

  export interface GeminiMessage {
    role: "system" | "user" | "model"; // Google uses "model" instead of "assistant"
    parts: { text: string }[];
  };
 