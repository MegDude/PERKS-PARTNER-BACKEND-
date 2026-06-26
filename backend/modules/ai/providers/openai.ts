export type OpenAIChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

export type OpenAIProviderConfig = {
  apiKey?: string;
  chatModel: string;
  imageModel: string;
};

export interface AIProvider {
  readonly name: string;
  readonly chatModel: string;
  readonly imageModel: string;
  readonly configured: boolean;
  chat(messages: OpenAIChatMessage[]): Promise<string>;
  image(prompt: string): Promise<any>;
  embeddings(input: string | string[]): Promise<any>;
  moderation(input: string): Promise<any>;
  stream(messages: OpenAIChatMessage[]): AsyncGenerator<string>;
}

export function getOpenAIConfig(env: NodeJS.ProcessEnv = process.env): OpenAIProviderConfig {
  return {
    apiKey: env.OPENAI_API_KEY,
    chatModel: env.AI_CHAT_MODEL || "gpt-4.1-mini",
    imageModel: env.AI_IMAGE_MODEL || "gpt-image-1",
  };
}

export function assertOpenAIConfigured(env: NodeJS.ProcessEnv = process.env) {
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }
}

export function logOpenAIStatusOnce(env: NodeJS.ProcessEnv = process.env) {
  const key = "__DOWNTOWN_PERKS_OPENAI_STATUS_LOGGED__";
  const globalStore = globalThis as any;
  if (globalStore[key]) return;
  globalStore[key] = true;
  if (env.OPENAI_API_KEY) {
    console.info("OpenAI configured");
  } else {
    console.info("OpenAI pending credentials");
  }
}

export class OpenAIProvider implements AIProvider {
  readonly name = "openai";
  readonly chatModel: string;
  readonly imageModel: string;
  private readonly apiKey?: string;

  constructor(config: OpenAIProviderConfig = getOpenAIConfig()) {
    this.apiKey = config.apiKey;
    this.chatModel = config.chatModel;
    this.imageModel = config.imageModel;
  }

  get configured() {
    return Boolean(this.apiKey);
  }

  async chat(messages: OpenAIChatMessage[]) {
    if (!this.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.chatModel,
        messages,
        temperature: 0.2,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI chat request failed");
    }
    return String(data?.choices?.[0]?.message?.content || "");
  }

  async image(prompt: string) {
    if (!this.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: this.imageModel,
        prompt,
        size: "1024x1024",
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI image request failed");
    }
    return data;
  }

  async embeddings(input: string | string[]) {
    if (!this.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    const response = await fetch("https://api.openai.com/v1/embeddings", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_EMBEDDING_MODEL || "text-embedding-3-small",
        input,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI embeddings request failed");
    }
    return data;
  }

  async moderation(input: string) {
    if (!this.apiKey) {
      throw new Error("Missing OPENAI_API_KEY");
    }
    const response = await fetch("https://api.openai.com/v1/moderations", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.AI_MODERATION_MODEL || "omni-moderation-latest",
        input,
      }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data?.error?.message || "OpenAI moderation request failed");
    }
    return data;
  }

  async *stream(messages: OpenAIChatMessage[]) {
    const answer = await this.chat(messages);
    yield answer;
  }
}
