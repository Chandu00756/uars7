// Add shared TypeScript types/interfaces here
export interface Device {
  id: string;
  name: string;
  status: string;
  lastSeen: string;
  compliance: boolean;
}

export interface IntentToken {
  id: string;
  action: string;
  issuedAt: string;
  expiresAt: string;
  status: 'active' | 'expired' | 'revoked';
  usageCount: number;
  maxUsage?: number;
  lastUsed?: Date;
  deviceBinding?: string;
  scope: string[];
  description?: string;
}

export interface Capsule {
  id: string;
  name: string;
  policy: string;
  createdAt: string;
  revoked: boolean;
}
