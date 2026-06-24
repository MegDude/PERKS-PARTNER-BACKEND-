import type { LucideIcon } from 'lucide-react';

export type PlatformLayerId =
  | 'identity'
  | 'resident'
  | 'property'
  | 'partner'
  | 'events'
  | 'perks'
  | 'engagement'
  | 'survey'
  | 'reporting'
  | 'analytics'
  | 'automation';

export type PlatformCapability =
  | 'data_model'
  | 'workflow'
  | 'permissions'
  | 'automation'
  | 'analytics'
  | 'api'
  | 'agent';

export type PlatformPermission =
  | 'owner'
  | 'admin'
  | 'manager'
  | 'editor'
  | 'analyst'
  | 'viewer'
  | 'resident'
  | 'partner';

export type PlatformAutomation = {
  trigger: string;
  condition: string;
  action: string;
  notification: string;
  auditLog: string;
};

export type PlatformDomain = {
  id: PlatformLayerId;
  route: string;
  productName: string;
  label: string;
  positioning: string;
  purpose: string;
  icon?: LucideIcon;
  capabilities: PlatformCapability[];
  coreObjects: string[];
  states?: string[];
  lifecycle?: string[];
  workflows: string[];
  permissions: PlatformPermission[];
  automations: PlatformAutomation[];
  analytics: string[];
  apiSurface: string[];
  agent: {
    name: string;
    responsibilities: string[];
    examplePrompts: string[];
  };
};

export type EnterpriseComponent = {
  name: string;
  requirement: string;
  status: 'foundation' | 'partial' | 'required';
};
