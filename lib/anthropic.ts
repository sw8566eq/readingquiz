import Anthropic from "@anthropic-ai/sdk";

// Resolves ANTHROPIC_API_KEY from the environment automatically (.env.local
// in dev). Never hardcode a key here.
export const anthropic = new Anthropic();
