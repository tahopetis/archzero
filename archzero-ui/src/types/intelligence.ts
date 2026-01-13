// Business Impact Analysis Types
export const CriticalityLevel = {
  Critical: 'Critical',
  High: 'High',
  Medium: 'Medium',
  Low: 'Low',
  Minimal: 'Minimal',
} as const;

export type CriticalityLevelValue = typeof CriticalityLevel[keyof typeof CriticalityLevel];

export interface BIAQuestion {
  id: string;
  text: string;
  weight: number;
  responseOptions: ResponseOption[];
  required: boolean;
}

export interface ResponseOption {
  value: string;
  label: string;
  score: number;
}

export interface BIADimension {
  id: string;
  name: string;
  weight: number;
  description: string;
  questions: BIAQuestion[];
}

export interface BIAProfile {
  name: string;
  industry: string;
  dimensions: BIADimension[];
  aggregationStrategy: AggregationStrategy;
}

export type AggregationStrategy = 'Max' | 'WeightedAvg' | 'Sum';

export interface BIAResponse {
  questionId: string;
  score: number;
}

export interface DimensionScore {
  dimensionId: string;
  dimensionName: string;
  score: number;
  weight: number;
  weightedScore: number;
}

export interface BIAAssessment {
  id: string;
  cardId: string;
  profileName: string;
  assessedBy: string;
  assessedAt: string;
  responses: BIAResponse[];
  dimensionScores: DimensionScore[];
  overallScore: number;
  criticalityLevel: CriticalityLevelValue;
}

// Topology Types
export interface TopologyMetrics {
  cardId: string;
  fanIn: number;
  fanOut: number;
  totalConnections: number;
  criticalityBoost?: CriticalityLevelValue;
}

export interface EnhancedCriticality {
  biaScore: number;
  biaLevel: CriticalityLevelValue;
  topologyMetrics: TopologyMetrics;
  finalLevel: CriticalityLevelValue;
  escalationReason?: string;
}

// Migration Types
export const RecommendationType = {
  Rehost: 'Rehost',
  Refactor: 'Refactor',
  Revise: 'Revise',
  Replatform: 'Replatform',
  Replace: 'Replace',
  Retire: 'Retire',
  Retain: 'Retain',
} as const;

export type RecommendationTypeValue = typeof RecommendationType[keyof typeof RecommendationType];

export const EffortLevel = {
  None: 'None',
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  VeryHigh: 'VeryHigh',
} as const;

export type EffortLevelValue = typeof EffortLevel[keyof typeof EffortLevel];

export const RiskLevel = {
  VeryLow: 'VeryLow',
  Low: 'Low',
  Medium: 'Medium',
  High: 'High',
  VeryHigh: 'VeryHigh',
} as const;

export type RiskLevelValue = typeof RiskLevel[keyof typeof RiskLevel];

export const CostImpact = {
  SignificantSavings: 'SignificantSavings',
  ModerateSavings: 'ModerateSavings',
  Neutral: 'Neutral',
  ModerateIncrease: 'ModerateIncrease',
  SignificantIncrease: 'SignificantIncrease',
} as const;

export type CostImpactValue = typeof CostImpact[keyof typeof CostImpact];

export interface MigrationRecommendation {
  id: string;
  cardId: string;
  cardName: string;
  recommendation: RecommendationTypeValue;
  reasoning: string;
  effortEstimate: EffortLevelValue;
  costImpact: CostImpactValue;
  riskAssessment: RiskLevelValue;
  confidenceScore: number;
  alternativeOptions: RecommendationTypeValue[];
  assessedAt: string;
  assessmentVersion: string;
}

// TCO Types
export interface CostComponents {
  hardware: number;
  software: number;
  personnel: number;
  facilities: number;
  support: number;
  training: number;
  licensing: number;
  cloudCosts: number;
  migrationCosts: number;
  retirementCosts: number;
  riskMitigation: number;
  contingency: number;
}

export const AllocationMethod = {
  EvenSplit: 'EvenSplit',
  UsageBased: 'UsageBased',
  UserBased: 'UserBased',
  DependencyBased: 'DependencyBased',
  ManualPercentage: 'ManualPercentage',
} as const;

export type AllocationMethodValue = typeof AllocationMethod[keyof typeof AllocationMethod];

export interface AllocationStrategy {
  method: AllocationMethodValue;
  manualAllocations?: ManualAllocation[];
}

export interface ManualAllocation {
  sourceCardId: string;
  percentage: number;
}

export interface DependencyInfo {
  cardId: string;
  cardName: string;
  annualTCO: number;
  consumerCount: number;
}

export interface ConsumerInfo {
  cardId: string;
  cardName: string;
  criticality: string;
  usageMetrics?: UsageMetrics;
}

export interface UsageMetrics {
  transactionCount?: number;
  userCount?: number;
  storageUsed?: number;
  bandwidthUsed?: number;
}

export interface AllocatedCost {
  id: string;
  sourceCardId: string;
  sourceCardName: string;
  category: string;
  amount: number;
  percentage: number;
  period: string;
}

export interface TCOCalculation {
  id: string;
  cardId: string;
  cardName: string;
  costBreakdown: CostComponents;
  allocationStrategy: AllocationStrategy;
  currency: string;
  calculationPeriodMonths: number;
  totalTCO: number;
  monthlyTCO: number;
  annualTCO: number;
  allocatedCosts: AllocatedCost[];
  dependencies: DependencyInfo[];
  consumers: ConsumerInfo[];
  calculatedAt: string;
}

export interface TCOPortfolio {
  totalApplications: number;
  totalAnnualTCO: number;
  averageTCOPerApp: number;
  categoryBreakdown: Record<string, number>;
  topCostDrivers: Array<{
    cardId: string;
    cardName: string;
    annualTCO: number;
  }>;
  calculatedAt: string;
}

export interface TCOComparison {
  cardId: string;
  scenarios: Array<{
    name: string;
    recommendation: RecommendationTypeValue;
    annualTCO: number;
    effort: EffortLevelValue;
    risk: RiskLevelValue;
  }>;
}

export interface CostTrendDataPoint {
  period: string;
  totalCost: number;
  categoryCosts: Record<string, number>;
}
