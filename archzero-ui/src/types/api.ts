// API Types matching the Rust backend

export interface Card {
  id: string;
  name: string;
  type: CardTypeValue;
  lifecyclePhase: LifecyclePhaseValue;
  qualityScore?: number;
  description?: string;
  ownerId?: string;
  createdAt: string;
  updatedAt: string;
  attributes: Record<string, any>;
  tags: string[];
  status: string;
}

export const CardType = {
  // Layer A: Strategic
  BusinessCapability: 'BusinessCapability',
  Objective: 'Objective',
  // Layer B: Application
  Application: 'Application',
  Interface: 'Interface',
  // Layer C: Technology
  ITComponent: 'ITComponent',
  Platform: 'Platform',
  // Layer D: Governance (added in Phase 3)
  ArchitecturePrinciple: 'ArchitecturePrinciple',
  TechnologyStandard: 'TechnologyStandard',
  ArchitecturePolicy: 'ArchitecturePolicy',
  Exception: 'Exception',
  Initiative: 'Initiative',
  Risk: 'Risk',
  ComplianceRequirement: 'ComplianceRequirement',
} as const;

export type CardTypeValue = typeof CardType[keyof typeof CardType];

export const LifecyclePhase = {
  Discovery: 'Discovery',
  Strategy: 'Strategy',
  Planning: 'Planning',
  Development: 'Development',
  Testing: 'Testing',
  Active: 'Active',
  Decommissioned: 'Decommissioned',
  Retired: 'Retired',
} as const;

export type LifecyclePhaseValue = typeof LifecyclePhase[keyof typeof LifecyclePhase];

export const UserRole = {
  Admin: 'admin',
  Architect: 'architect',
  Editor: 'editor',
  Viewer: 'viewer',
} as const;

export type UserRoleValue = typeof UserRole[keyof typeof UserRole];

export interface User {
  id: string;
  email: string;
  fullName?: string;
  role: UserRoleValue;
  createdAt: string;
  updatedAt: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface CreateCardRequest {
  name: string;
  type: CardTypeValue;
  lifecyclePhase: LifecyclePhaseValue;
  qualityScore?: number;
  description?: string;
  ownerId?: string;
  attributes?: Record<string, any>;
  tags?: string[];
}

export interface UpdateCardRequest {
  name?: string;
  lifecyclePhase?: LifecyclePhaseValue;
  qualityScore?: number;
  description?: string;
  attributes?: Record<string, any>;
  tags?: string[];
}
