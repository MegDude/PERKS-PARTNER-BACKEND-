export type AgentMode = "resident" | "partner" | "admin" | "campaign" | "reports" | "marketing" | "developer";

export type AgentQueryPayload = {
  sessionId?: string;
  userId?: string;
  organizationId?: string;
  mode?: AgentMode | string;
  intent?: string;
  message?: string;
  context?: Record<string, any>;
  location?: Record<string, any>;
  history?: Array<{ role: "user" | "assistant" | "system"; content: string }>;
};

export type AgentContext = {
  sessionId: string;
  userId: string;
  organizationId: string;
  mode: string;
  intent: string;
  message: string;
  location: Record<string, any>;
  map: Record<string, any>;
  filters: Record<string, any>;
  entities: Record<string, any>[];
  events: Record<string, any>[];
  perks: Record<string, any>[];
  campaigns: Record<string, any>[];
  reports: Record<string, any>[];
  organization: Record<string, any> | null;
  history: Array<{ role: "user" | "assistant" | "system"; content: string }>;
  memory: Record<string, any>;
  environment: Record<string, any>;
};

export type ToolCallPlan = {
  name: string;
  arguments: Record<string, any>;
  reason: string;
};

export type AgentPlan = {
  intent: string;
  summary: string;
  toolCalls: ToolCallPlan[];
};

export type ToolResult = {
  name: string;
  ok: boolean;
  data?: any;
  error?: string;
};

export type AgentResponse = {
  id: string;
  sessionId: string;
  mode: string;
  intent: string;
  answer: string;
  plan: AgentPlan;
  toolCalls: ToolResult[];
  citations: Array<Record<string, any>>;
  cards: Array<Record<string, any>>;
  actions: Array<Record<string, any>>;
  nextSuggestions: string[];
  stream: { supported: boolean; endpoint: string };
  provider: { name: string; model: string; configured: boolean };
};

export type AgentDataAccess = {
  entities: Record<string, any>;
};
