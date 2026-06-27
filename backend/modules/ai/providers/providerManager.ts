import { OpenAIProvider, getOpenAIConfig } from "./openai.js";

export function getProviderManager() {
  const openai = new OpenAIProvider(getOpenAIConfig());
  return {
    primary: openai,
    metadata: {
      name: openai.name,
      model: openai.chatModel,
      imageModel: openai.imageModel,
      configured: openai.configured,
    },
  };
}
