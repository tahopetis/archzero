/**
 * Governance & Compliance API Client
 * Phase 3: Architecture Principles, Standards, Policies, Exceptions, Initiatives, Risks, Compliance, ARB
 */

import api from './api';
import type {
  // Principles
  ArchitecturePrinciple,
  CreatePrincipleRequest,
  UpdatePrincipleRequest,
  PrincipleSearchParams,
  PrinciplesListResponse,
  PrincipleComplianceReport,
  // Standards
  TechnologyStandard,
  CreateStandardRequest,
  UpdateStandardRequest,
  StandardSearchParams,
  StandardsListResponse,
  TechnologyRadar,
  TechnologyDebtReport,
  // Policies
  ArchitecturePolicy,
  CreatePolicyRequest,
  UpdatePolicyRequest,
  PolicySearchParams,
  PolicyListResponse,
  PolicyComplianceCheckResponse,
  ValidatePolicyRequest,
  ValidatePolicyResponse,
  PolicyViolationListResponse,
  // Exceptions
  Exception,
  CreateExceptionRequest,
  UpdateExceptionRequest,
  ExceptionListParams,
  ExceptionListResponse,
  ApproveExceptionRequest,
  RejectExceptionRequest,
  ExpiringException,
  // Initiatives
  Initiative,
  CreateInitiativeRequest,
  UpdateInitiativeRequest,
  InitiativeSearchParams,
  InitiativeListResponse,
  InitiativeImpactMap,
  CardLinkRequest,
  CardLinkResponse,
  // Risks
  Risk,
  CreateRiskRequest,
  UpdateRiskRequest,
  RiskSearchParams,
  RiskListResponse,
  RiskHeatMapData,
  TopRisksResponse,
  // Compliance
  ComplianceRequirement,
  CreateComplianceRequirementRequest,
  UpdateComplianceRequirementRequest,
  ComplianceRequirementSearchParams,
  ComplianceRequirementsListResponse,
  AssessComplianceRequest,
  ComplianceAssessment,
  ComplianceDashboard,
  // ARB
  ARBMeeting,
  CreateARBMeetingRequest,
  UpdateARBMeetingRequest,
  ARBMeetingSearchParams,
  ARBMeetingListResponse,
  ARBAgendaItem,
  AddSubmissionToMeetingRequest,
  ARBSubmission,
  CreateARBSubmissionRequest,
  UpdateARBSubmissionRequest,
  ARBSubmissionSearchParams,
  ARBSubmissionListResponse,
  CreateARBDecisionRequest,
  ARBDecision,
  ARBDashboard,
  ARBStatistics,
} from '../types/governance';

// ============================================================================
// ARCHITECTURE PRINCIPLES
// ============================================================================

export const principlesApi = {
  list: async (params?: PrincipleSearchParams) => {
    const response = await api.get<PrinciplesListResponse>('/principles', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<ArchitecturePrinciple>(`/principles/${id}`);
    return response.data;
  },

  create: async (data: CreatePrincipleRequest) => {
    const response = await api.post<ArchitecturePrinciple>('/principles', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePrincipleRequest) => {
    const response = await api.put<ArchitecturePrinciple>(`/principles/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/principles/${id}`);
  },

  getCompliance: async (id: string) => {
    const response = await api.get<PrincipleComplianceReport>(`/principles/${id}/compliance`);
    return response.data;
  },
};

// ============================================================================
// TECHNOLOGY STANDARDS
// ============================================================================

export const standardsApi = {
  list: async (params?: StandardSearchParams) => {
    const response = await api.get<StandardsListResponse>('/tech-standards', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<TechnologyStandard>(`/tech-standards/${id}`);
    return response.data;
  },

  create: async (data: CreateStandardRequest) => {
    const response = await api.post<TechnologyStandard>('/tech-standards', data);
    return response.data;
  },

  update: async (id: string, data: UpdateStandardRequest) => {
    const response = await api.put<TechnologyStandard>(`/tech-standards/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/tech-standards/${id}`);
  },

  getRadar: async () => {
    const response = await api.get<TechnologyRadar>('/tech-standards/radar');
    return response.data;
  },

  getDebtReport: async () => {
    const response = await api.get<TechnologyDebtReport>('/tech-standards/debt-report');
    return response.data;
  },
};

// ============================================================================
// ARCHITECTURE POLICIES
// ============================================================================

export const policiesApi = {
  list: async (params?: PolicySearchParams) => {
    const response = await api.get<PolicyListResponse>('/policies', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<ArchitecturePolicy>(`/policies/${id}`);
    return response.data;
  },

  create: async (data: CreatePolicyRequest) => {
    const response = await api.post<ArchitecturePolicy>('/policies', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePolicyRequest) => {
    const response = await api.put<ArchitecturePolicy>(`/policies/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/policies/${id}`);
  },

  checkCompliance: async (id: string, cardIds: string[]) => {
    const response = await api.post<PolicyComplianceCheckResponse>(`/policies/check`, { cardIds });
    return response.data;
  },

  validate: async (id: string, data: ValidatePolicyRequest) => {
    const response = await api.post<ValidatePolicyResponse>(`/policies/${id}/validate`, data);
    return response.data;
  },

  listViolations: async (params?: any) => {
    const response = await api.get<PolicyViolationListResponse>('/policies/violations', { params });
    return response.data;
  },
};

// ============================================================================
// EXCEPTIONS
// ============================================================================

export const exceptionsApi = {
  list: async (params?: ExceptionListParams) => {
    const response = await api.get<ExceptionListResponse>('/exceptions', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<Exception>(`/exceptions/${id}`);
    return response.data;
  },

  create: async (data: CreateExceptionRequest) => {
    const response = await api.post<Exception>('/exceptions', data);
    return response.data;
  },

  update: async (id: string, data: UpdateExceptionRequest) => {
    const response = await api.put<Exception>(`/exceptions/${id}`, data);
    return response.data;
  },

  approve: async (id: string, data?: ApproveExceptionRequest) => {
    const response = await api.post<Exception>(`/exceptions/${id}/approve`, data || {});
    return response.data;
  },

  reject: async (id: string, data: RejectExceptionRequest) => {
    const response = await api.post<Exception>(`/exceptions/${id}/reject`, data);
    return response.data;
  },

  listExpiring: async () => {
    const response = await api.get<ExpiringException[]>('/exceptions/expiring');
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/exceptions/${id}`);
  },
};

// ============================================================================
// INITIATIVES
// ============================================================================

export const initiativesApi = {
  list: async (params?: InitiativeSearchParams) => {
    const response = await api.get<InitiativeListResponse>('/initiatives', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<Initiative>(`/initiatives/${id}`);
    return response.data;
  },

  create: async (data: CreateInitiativeRequest) => {
    const response = await api.post<Initiative>('/initiatives', data);
    return response.data;
  },

  update: async (id: string, data: UpdateInitiativeRequest) => {
    const response = await api.put<Initiative>(`/initiatives/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/initiatives/${id}`);
  },

  getImpactMap: async (id: string) => {
    const response = await api.get<InitiativeImpactMap>(`/initiatives/${id}/impact-map`);
    return response.data;
  },

  linkCards: async (id: string, data: CardLinkRequest) => {
    const response = await api.post<CardLinkResponse>(`/initiatives/${id}/link-cards`, data);
    return response.data;
  },
};

// ============================================================================
// RISKS
// ============================================================================

export const risksApi = {
  list: async (params?: RiskSearchParams) => {
    const response = await api.get<RiskListResponse>('/risks', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<Risk>(`/risks/${id}`);
    return response.data;
  },

  create: async (data: CreateRiskRequest) => {
    const response = await api.post<Risk>('/risks', data);
    return response.data;
  },

  update: async (id: string, data: UpdateRiskRequest) => {
    const response = await api.put<Risk>(`/risks/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/risks/${id}`);
  },

  getHeatMap: async () => {
    const response = await api.get<RiskHeatMapData>('/risks/heat-map');
    return response.data;
  },

  getTopRisks: async () => {
    const response = await api.get<TopRisksResponse>('/risks/top-10');
    return response.data;
  },
};

// ============================================================================
// COMPLIANCE
// ============================================================================

export const complianceApi = {
  list: async (params?: ComplianceRequirementSearchParams) => {
    const response = await api.get<ComplianceRequirementsListResponse>('/compliance-requirements', { params });
    return response.data;
  },

  get: async (id: string) => {
    const response = await api.get<ComplianceRequirement>(`/compliance-requirements/${id}`);
    return response.data;
  },

  create: async (data: CreateComplianceRequirementRequest) => {
    const response = await api.post<ComplianceRequirement>('/compliance-requirements', data);
    return response.data;
  },

  update: async (id: string, data: UpdateComplianceRequirementRequest) => {
    const response = await api.put<ComplianceRequirement>(`/compliance-requirements/${id}`, data);
    return response.data;
  },

  delete: async (id: string) => {
    await api.delete(`/compliance-requirements/${id}`);
  },

  assessCompliance: async (id: string, data: AssessComplianceRequest) => {
    const response = await api.post<ComplianceAssessment>(`/compliance-requirements/${id}/assess`, data);
    return response.data;
  },

  getDashboard: async (id: string) => {
    const response = await api.get<ComplianceDashboard>(`/compliance-requirements/${id}/dashboard`);
    return response.data;
  },
};

// ============================================================================
// ARB (Architecture Review Board)
// ============================================================================

export const arbApi = {
  // Meetings
  listMeetings: async (params?: ARBMeetingSearchParams) => {
    const response = await api.get<ARBMeetingListResponse>('/arb/meetings', { params });
    return response.data;
  },

  getMeeting: async (id: string) => {
    const response = await api.get<ARBMeeting>(`/arb/meetings/${id}`);
    return response.data;
  },

  createMeeting: async (data: CreateARBMeetingRequest) => {
    const response = await api.post<ARBMeeting>('/arb/meetings', data);
    return response.data;
  },

  updateMeeting: async (id: string, data: UpdateARBMeetingRequest) => {
    const response = await api.put<ARBMeeting>(`/arb/meetings/${id}`, data);
    return response.data;
  },

  deleteMeeting: async (id: string) => {
    await api.delete(`/arb/meetings/${id}`);
  },

  getMeetingAgenda: async (id: string) => {
    const response = await api.get<ARBAgendaItem[]>(`/arb/meetings/${id}/agenda`);
    return response.data;
  },

  addSubmissionToAgenda: async (id: string, data: AddSubmissionToMeetingRequest) => {
    await api.post(`/arb/meetings/${id}/agenda`, data);
  },

  // Submissions
  listSubmissions: async (params?: ARBSubmissionSearchParams) => {
    const response = await api.get<ARBSubmissionListResponse>('/arb/submissions', { params });
    return response.data;
  },

  getSubmission: async (id: string) => {
    const response = await api.get<ARBSubmission>(`/arb/submissions/${id}`);
    return response.data;
  },

  createSubmission: async (data: CreateARBSubmissionRequest) => {
    const response = await api.post<ARBSubmission>('/arb/submissions', data);
    return response.data;
  },

  updateSubmission: async (id: string, data: UpdateARBSubmissionRequest) => {
    const response = await api.put<ARBSubmission>(`/arb/submissions/${id}`, data);
    return response.data;
  },

  deleteSubmission: async (id: string) => {
    await api.delete(`/arb/submissions/${id}`);
  },

  recordDecision: async (id: string, data: CreateARBDecisionRequest) => {
    const response = await api.post<ARBDecision>(`/arb/submissions/${id}/decision`, data);
    return response.data;
  },

  // Dashboard & Statistics
  getDashboard: async () => {
    const response = await api.get<ARBDashboard>('/arb/dashboard');
    return response.data;
  },

  getStatistics: async () => {
    const response = await api.get<ARBStatistics>('/arb/statistics');
    return response.data;
  },
};

// Combined export for convenience
export const governanceApi = {
  principles: principlesApi,
  standards: standardsApi,
  policies: policiesApi,
  exceptions: exceptionsApi,
  initiatives: initiativesApi,
  risks: risksApi,
  compliance: complianceApi,
  arb: arbApi,
};

export default governanceApi;
