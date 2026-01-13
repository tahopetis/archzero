/**
 * Governance & Compliance Type Definitions
 * Phase 3: Architecture Principles, Standards, Policies, Exceptions, Initiatives, Risks, Compliance, ARB
 */

// ============================================================================
// ARCHITECTURE PRINCIPLES
// ============================================================================

export enum PrincipleCategory {
  Strategic = 'Strategic',
  Business = 'Business',
  Technical = 'Technical',
  Data = 'Data',
  Security = 'Security',
}

export interface ArchitecturePrinciple {
  id: string;
  name: string;
  statement: string;
  rationale: string;
  implications: string[];
  owner: string;
  category: PrincipleCategory;
  adherenceRate: number;
  type: string; // Always "ArchitecturePrinciple"
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrincipleRequest {
  name: string;
  statement: string;
  rationale: string;
  implications: string[];
  owner: string;
  category: PrincipleCategory;
  adherenceRate?: number;
}

export interface UpdatePrincipleRequest {
  name?: string;
  statement?: string;
  rationale?: string;
  implications?: string[];
  owner?: string;
  category?: PrincipleCategory;
  adherenceRate?: number;
}

export interface PrincipleSearchParams {
  category?: PrincipleCategory;
  owner?: string;
  page?: number;
  pageSize?: number;
}

export interface PrinciplesListResponse {
  data: ArchitecturePrinciple[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ComplianceViolation {
  cardId: string;
  cardName: string;
  violation: string;
}

export interface PrincipleComplianceReport {
  principleId: string;
  principleName: string;
  adherenceRate: number;
  totalCards: number;
  compliantCards: number;
  violations: ComplianceViolation[];
}

// ============================================================================
// TECHNOLOGY STANDARDS
// ============================================================================

export enum TechnologyStatus {
  Adopt = 'Adopt',
  Trial = 'Trial',
  Assess = 'Assess',
  Hold = 'Hold',
  Sunset = 'Sunset',
  Banned = 'Banned',
}

export enum RadarQuadrant {
  Languages = 'Languages',
  Frameworks = 'Frameworks',
  Infrastructure = 'Infrastructure',
  DataStorage = 'Data/Storage',
  DevOps = 'DevOps',
}

export enum RadarRing {
  Adopt = 'Adopt',
  Trial = 'Trial',
  Assess = 'Assess',
  Hold = 'Hold',
}

export interface TechnologyStandard {
  id: string;
  name: string;
  category: string;
  status: TechnologyStatus;
  quadrant?: RadarQuadrant;
  ring?: RadarRing;
  sunsetDate?: string;
  replacementId?: string;
  rationale?: string;
  type: string; // Always "TechnologyStandard"
  createdAt: string;
  updatedAt: string;
}

export interface CreateStandardRequest {
  name: string;
  category: string;
  status: TechnologyStatus;
  quadrant?: RadarQuadrant;
  ring?: RadarRing;
  sunsetDate?: string;
  replacementId?: string;
  rationale?: string;
}

export interface UpdateStandardRequest {
  name?: string;
  category?: string;
  status?: TechnologyStatus;
  quadrant?: RadarQuadrant;
  ring?: RadarRing;
  sunsetDate?: string;
  replacementId?: string;
  rationale?: string;
}

export interface StandardSearchParams {
  category?: string;
  status?: TechnologyStatus;
  page?: number;
  pageSize?: number;
}

export interface StandardsListResponse {
  data: TechnologyStandard[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface TechnologyRadar {
  quadrants: {
    quadrant: RadarQuadrant;
    ring: RadarRing;
    technologies: TechnologyStandard[];
  }[];
}

export interface DebtItem {
  standardId: string;
  standardName: string;
  status: TechnologyStatus;
  debtScore: number;
  estimatedCost: number;
}

export interface TechnologyDebtReport {
  totalDebtScore: number;
  totalEstimatedCost: number;
  itemCount: number;
  items: DebtItem[];
}

// ============================================================================
// ARCHITECTURE POLICIES
// ============================================================================

export enum PolicySeverity {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum PolicyEnforcement {
  Blocking = 'Blocking',
  Warning = 'Warning',
}

export interface PolicyCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'contains' | 'exists' | 'not_exists' | 'greater_than' | 'less_than' | 'gte' | 'lte';
  value: any;
}

export interface PolicyRule {
  applicableTo: string[];
  requiredAttributes: string[];
  conditions: PolicyCondition[];
}

export interface ArchitecturePolicy {
  id: string;
  name: string;
  ruleJson: PolicyRule;
  severity: PolicySeverity;
  enforcement: PolicyEnforcement;
  description?: string;
  type: string; // Always "ArchitecturePolicy"
  createdAt: string;
  updatedAt: string;
}

export interface CreatePolicyRequest {
  name: string;
  ruleJson: PolicyRule;
  severity: PolicySeverity;
  enforcement: PolicyEnforcement;
  description?: string;
}

export interface UpdatePolicyRequest {
  name?: string;
  ruleJson?: PolicyRule;
  severity?: PolicySeverity;
  enforcement?: PolicyEnforcement;
  description?: string;
}

export interface PolicySearchParams {
  severity?: PolicySeverity;
  enforcement?: PolicyEnforcement;
  page?: number;
  pageSize?: number;
}

export interface PolicyListResponse {
  data: ArchitecturePolicy[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export enum CardComplianceStatus {
  Compliant = 'Compliant',
  Violation = 'Violation',
  Error = 'Error',
}

export interface PolicyCardComplianceResult {
  cardId: string;
  cardName: string;
  status: CardComplianceStatus;
  missingRequirements?: string[];
  violationDetails?: string[];
}

export interface PolicyComplianceCheckResponse {
  policyId: string;
  policyName: string;
  totalCards: number;
  compliant: number;
  violations: number;
  results: PolicyCardComplianceResult[];
}

export interface ValidatePolicyRequest {
  cardIds: string[];
}

export interface ValidatePolicyResponse {
  policyId: string;
  policyName: string;
  totalCards: number;
  compliant: number;
  violations: number;
  results: PolicyCardComplianceResult[];
}

export interface PolicyViolation {
  policyId: string;
  policyName: string;
  cardId: string;
  cardName: string;
  severity: PolicySeverity;
  enforcement: PolicyEnforcement;
  violationDetails: string[];
}

export interface PolicyViolationListResponse {
  data: PolicyViolation[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

// ============================================================================
// EXCEPTIONS
// ============================================================================

export enum ExceptionStatus {
  Pending = 'Pending',
  Approved = 'Approved',
  Rejected = 'Rejected',
  Expired = 'Expired',
}

export enum ExceptionDuration {
  Days30 = 'Days30',
  Days60 = 'Days60',
  Days90 = 'Days90',
  Permanent = 'Permanent',
}

export interface Exception {
  id: string;
  name: string;
  relatedPolicyId?: string;
  exceptionReason: string;
  duration: ExceptionDuration;
  compensatingControls?: string[];
  status: ExceptionStatus;
  approvedBy?: string;
  approvedAt?: string;
  expirationDate?: string;
  cardId?: string;
  type: string; // Always "Exception"
  createdAt: string;
  updatedAt: string;
}

export interface CreateExceptionRequest {
  name: string;
  relatedPolicyId?: string;
  exceptionReason: string;
  duration: ExceptionDuration;
  compensatingControls?: string[];
  cardId?: string;
}

export interface UpdateExceptionRequest {
  exceptionReason?: string;
  duration?: ExceptionDuration;
  compensatingControls?: string[];
}

export interface ExceptionListParams {
  status?: ExceptionStatus;
  policyId?: string;
  page?: number;
  pageSize?: number;
}

export interface ExceptionListResponse {
  data: Exception[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ApproveExceptionRequest {
  comments?: string;
}

export interface RejectExceptionRequest {
  reason: string;
}

export interface ExpiringException {
  id: string;
  name: string;
  expirationDate: string;
  daysUntilExpiry: number;
}

// ============================================================================
// INITIATIVES
// ============================================================================

export enum InitiativeStatus {
  Proposed = 'Proposed',
  Approved = 'Approved',
  InProgress = 'InProgress',
  OnHold = 'OnHold',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum InitiativeHealth {
  OnTrack = 'OnTrack',
  AtRisk = 'AtRisk',
  Critical = 'Critical',
}

export enum InitiativeType {
  Strategic = 'Strategic',
  Modernization = 'Modernization',
  Compliance = 'Compliance',
  Optimization = 'Optimization',
  Migration = 'Migration',
}

export interface Initiative {
  id: string;
  name: string;
  status: InitiativeStatus;
  health: InitiativeHealth;
  initiativeType: InitiativeType;
  budget?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  description?: string;
  ownerId?: string;
  type: string; // Always "Initiative"
  createdAt: string;
  updatedAt: string;
}

export interface CreateInitiativeRequest {
  name: string;
  status?: InitiativeStatus;
  health?: InitiativeHealth;
  initiativeType: InitiativeType;
  budget?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  description?: string;
  ownerId?: string;
}

export interface UpdateInitiativeRequest {
  name?: string;
  status?: InitiativeStatus;
  health?: InitiativeHealth;
  initiativeType?: InitiativeType;
  budget?: number;
  startDate?: string;
  endDate?: string;
  progress?: number;
  description?: string;
  ownerId?: string;
}

export interface InitiativeSearchParams {
  status?: InitiativeStatus;
  health?: InitiativeHealth;
  initiativeType?: InitiativeType;
  page?: number;
  pageSize?: number;
}

export interface InitiativeListResponse {
  data: Initiative[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ImpactedCard {
  cardId: string;
  cardName: string;
  cardType: string;
  impactType: string;
}

export interface InitiativeImpactMap {
  initiativeId: string;
  initiativeName: string;
  impactedCards: ImpactedCard[];
}

export interface CardLinkRequest {
  cardIds: string[];
}

export interface CardLinkResponse {
  linked: number;
  failed: number;
}

// ============================================================================
// RISKS
// ============================================================================

export enum RiskType {
  Security = 'Security',
  Compliance = 'Compliance',
  Operational = 'Operational',
  Financial = 'Financial',
  Strategic = 'Strategic',
  Reputational = 'Reputational',
}

export enum RiskStatus {
  Open = 'Open',
  Mitigated = 'Mitigated',
  Accepted = 'Accepted',
  Transferred = 'Transferred',
  Closed = 'Closed',
}

export interface Risk {
  id: string;
  name: string;
  riskType: RiskType;
  likelihood: number; // 1-5
  impact: number; // 1-5
  riskScore: number; // likelihood * impact
  status: RiskStatus;
  mitigationPlan?: string;
  owner?: string;
  targetClosureDate?: string;
  type: string; // Always "Risk"
  createdAt: string;
  updatedAt: string;
}

export interface CreateRiskRequest {
  name: string;
  riskType: RiskType;
  likelihood: number;
  impact: number;
  status?: RiskStatus;
  mitigationPlan?: string;
  owner?: string;
  targetClosureDate?: string;
}

export interface UpdateRiskRequest {
  name?: string;
  riskType?: RiskType;
  likelihood?: number;
  impact?: number;
  status?: RiskStatus;
  mitigationPlan?: string;
  owner?: string;
  targetClosureDate?: string;
}

export interface RiskSearchParams {
  riskType?: RiskType;
  status?: RiskStatus;
  minScore?: number;
  page?: number;
  pageSize?: number;
}

export interface RiskListResponse {
  data: Risk[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface HeatMapCell {
  likelihood: number;
  impact: number;
  count: number;
  risks: Risk[];
}

export interface RiskHeatMapData {
  cells: HeatMapCell[];
  totalRisks: number;
  avgRiskScore: number;
}

export interface TopRiskItem {
  id: string;
  name: string;
  riskScore: number;
  riskType: RiskType;
  status: RiskStatus;
}

export interface TopRisksResponse {
  risks: TopRiskItem[];
  total: number;
}

// ============================================================================
// COMPLIANCE
// ============================================================================

export enum ComplianceFramework {
  GDPR = 'GDPR',
  SOX = 'SOX',
  HIPAA = 'HIPAA',
  PCIDSS = 'PCI-DSS',
  ISO27001 = 'ISO27001',
  SOC2 = 'SOC2',
  NIST = 'NIST',
  CCPA = 'CCPA',
  Other = 'Other',
}

export enum RequirementComplianceStatus {
  Compliant = 'Compliant',
  NonCompliant = 'NonCompliant',
  Exempt = 'Exempt',
  Partial = 'Partial',
}

export interface ComplianceRequirement {
  id: string;
  name: string;
  framework: ComplianceFramework;
  description: string;
  applicableCardTypes: string[];
  requiredControls: string[];
  auditFrequency: string;
  type: string; // Always "ComplianceRequirement"
  createdAt: string;
  updatedAt: string;
}

export interface CreateComplianceRequirementRequest {
  name: string;
  framework: ComplianceFramework;
  description: string;
  applicableCardTypes: string[];
  requiredControls: string[];
  auditFrequency: string;
}

export interface UpdateComplianceRequirementRequest {
  name?: string;
  framework?: ComplianceFramework;
  description?: string;
  applicableCardTypes?: string[];
  requiredControls?: string[];
  auditFrequency?: string;
}

export interface ComplianceRequirementSearchParams {
  framework?: ComplianceFramework;
  page?: number;
  pageSize?: number;
}

export interface ComplianceRequirementsListResponse {
  data: ComplianceRequirement[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface CardComplianceAssessmentResult {
  cardId: string;
  cardName: string;
  status: RequirementComplianceStatus;
  controlsImplemented: string[];
  missingControls: string[];
}

export interface AssessComplianceRequest {
  cardIds: string[];
}

export interface ComplianceAssessment {
  complianceId: string;
  framework: ComplianceFramework;
  totalCards: number;
  compliant: number;
  nonCompliant: number;
  results: CardComplianceAssessmentResult[];
}

export interface ComplianceSummary {
  totalApplicableCards: number;
  compliant: number;
  nonCompliant: number;
  exempt: number;
  complianceRate: number;
}

export interface CardTypeBreakdown {
  total: number;
  compliant: number;
}

export interface ComplianceDashboard {
  complianceId: string;
  framework: ComplianceFramework;
  summary: ComplianceSummary;
  byCardType: Record<string, CardTypeBreakdown>;
  lastAssessed: string;
}

// ============================================================================
// ARB (Architecture Review Board)
// ============================================================================

export enum ARBMeetingStatus {
  Scheduled = 'Scheduled',
  InProgress = 'InProgress',
  Completed = 'Completed',
  Cancelled = 'Cancelled',
}

export enum ARBSubmissionType {
  ExceptionRequest = 'ExceptionRequest',
  PolicyViolation = 'PolicyViolation',
  StandardException = 'StandardException',
  NewTechnologyProposal = 'NewTechnologyProposal',
  ArchitectureReview = 'ArchitectureReview',
}

export enum ARBDecisionType {
  Approve = 'Approve',
  ApproveWithConditions = 'ApproveWithConditions',
  Reject = 'Reject',
  RequestMoreInfo = 'RequestMoreInfo',
  Defer = 'Defer',
}

export enum ARBPriority {
  Critical = 'Critical',
  High = 'High',
  Medium = 'Medium',
  Low = 'Low',
}

export enum ARBSubmissionStatus {
  Pending = 'Pending',
  UnderReview = 'UnderReview',
  DecisionMade = 'DecisionMade',
  Deferred = 'Deferred',
  Withdrawn = 'Withdrawn',
}

export interface ARBMeeting {
  id: string;
  title: string;
  meetingType: string; // Always "ARBMeeting"
  scheduledDate: string;
  status: ARBMeetingStatus;
  agenda: string[];
  attendees: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateARBMeetingRequest {
  title: string;
  scheduledDate: string;
  agenda: string[];
  attendees: string[];
}

export interface UpdateARBMeetingRequest {
  title?: string;
  scheduledDate?: string;
  status?: ARBMeetingStatus;
  agenda?: string[];
  attendees?: string[];
}

export interface ARBMeetingSearchParams {
  status?: ARBMeetingStatus;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

export interface ARBMeetingListResponse {
  data: ARBMeeting[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ARBSubmission {
  id: string;
  meetingId?: string;
  cardId: string;
  submissionType: ARBSubmissionType;
  rationale: string;
  submittedBy: string;
  submittedAt: string;
  decision?: ARBDecision;
  priority?: ARBPriority;
  relatedPolicyId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateARBSubmissionRequest {
  cardId: string;
  submissionType: ARBSubmissionType;
  rationale: string;
  priority: ARBPriority;
  relatedPolicyId?: string;
}

export interface UpdateARBSubmissionRequest {
  meetingId?: string;
  rationale?: string;
  priority?: ARBPriority;
}

export interface ARBSubmissionSearchParams {
  meetingId?: string;
  submissionType?: ARBSubmissionType;
  status?: ARBSubmissionStatus;
  page?: number;
  pageSize?: number;
}

export interface ARBSubmissionListResponse {
  data: ARBSubmission[];
  pagination: {
    page: number;
    limit: number;
    total: number;
  };
}

export interface ARBDecision {
  id: string;
  submissionId: string;
  decisionType: ARBDecisionType;
  decidedBy: string;
  decidedAt: string;
  conditions?: string;
  rationale: string;
  validUntil?: string;
}

export interface CreateARBDecisionRequest {
  submissionId: string;
  decisionType: ARBDecisionType;
  conditions?: string;
  rationale: string;
  validUntil?: string;
}

export interface ARBAgendaItem {
  submissionId: string;
  title: string;
  submissionType: ARBSubmissionType;
  priority: ARBPriority;
  estimatedDurationMinutes?: number;
}

export interface AddSubmissionToMeetingRequest {
  submissionId: string;
  estimatedDurationMinutes?: number;
}

export interface ARBDashboard {
  pendingSubmissions: number;
  upcomingMeetings: number;
  decisionsThisMonth: number;
  criticalSubmissions: number;
  avgDecisionTimeDays: number;
}

export interface SubmissionTypeCount {
  submissionType: ARBSubmissionType;
  count: number;
}

export interface DecisionTypeCount {
  decisionType: ARBDecisionType;
  count: number;
}

export interface ARBStatistics {
  totalSubmissions: number;
  totalMeetings: number;
  approvalRate: number;
  avgDecisionTimeHours: number;
  submissionsByType: SubmissionTypeCount[];
  decisionsByType: DecisionTypeCount[];
}
