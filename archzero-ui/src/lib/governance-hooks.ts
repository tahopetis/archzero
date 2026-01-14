import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { UseQueryResult, UseMutationResult } from '@tanstack/react-query';
import {
  principlesApi,
  standardsApi,
  policiesApi,
  exceptionsApi,
  initiativesApi,
  risksApi,
  complianceApi,
  arbApi,
} from './governance';
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

// Query keys factory
const governanceQueryKeys = {
  // Principles
  allPrinciples: () => ['principles'] as const,
  principles: (params?: PrincipleSearchParams) => [...governanceQueryKeys.allPrinciples(), params] as const,
  principle: (id: string) => [...governanceQueryKeys.allPrinciples(), id] as const,

  // Standards
  allStandards: () => ['standards'] as const,
  standards: (params?: StandardSearchParams) => [...governanceQueryKeys.allStandards(), params] as const,
  standard: (id: string) => [...governanceQueryKeys.allStandards(), id] as const,

  // Policies
  allPolicies: () => ['policies'] as const,
  policies: (params?: PolicySearchParams) => [...governanceQueryKeys.allPolicies(), params] as const,
  policy: (id: string) => [...governanceQueryKeys.allPolicies(), id] as const,

  // Exceptions
  allExceptions: () => ['exceptions'] as const,
  exceptions: (params?: ExceptionListParams) => [...governanceQueryKeys.allExceptions(), params] as const,
  exception: (id: string) => [...governanceQueryKeys.allExceptions(), id] as const,
  expiringExceptions: () => ['exceptions', 'expiring'] as const,

  // Initiatives
  allInitiatives: () => ['initiatives'] as const,
  initiatives: (params?: InitiativeSearchParams) => [...governanceQueryKeys.allInitiatives(), params] as const,
  initiative: (id: string) => [...governanceQueryKeys.allInitiatives(), id] as const,

  // Risks
  allRisks: () => ['risks'] as const,
  risks: (params?: RiskSearchParams) => [...governanceQueryKeys.allRisks(), params] as const,
  risk: (id: string) => [...governanceQueryKeys.allRisks(), id] as const,

  // Compliance
  allComplianceRequirements: () => ['compliance-requirements'] as const,
  complianceRequirements: (params?: ComplianceRequirementSearchParams) =>
    [...governanceQueryKeys.allComplianceRequirements(), params] as const,
  complianceRequirement: (id: string) => [...governanceQueryKeys.allComplianceRequirements(), id] as const,

  // ARB
  allARBMeetings: () => ['arb-meetings'] as const,
  arbMeetings: (params?: ARBMeetingSearchParams) => [...governanceQueryKeys.allARBMeetings(), params] as const,
  arbMeeting: (id: string) => [...governanceQueryKeys.allARBMeetings(), id] as const,
  allARBSubmissions: () => ['arb-submissions'] as const,
  arbSubmissions: (params?: ARBSubmissionSearchParams) =>
    [...governanceQueryKeys.allARBSubmissions(), params] as const,
  arbSubmission: (id: string) => [...governanceQueryKeys.allARBSubmissions(), id] as const,
};

// ============================================================================
// ARCHITECTURE PRINCIPLES HOOKS
// ============================================================================

export const usePrinciples = (params?: PrincipleSearchParams, options?: any):
  UseQueryResult<PrinciplesListResponse> => {
  return useQuery<PrinciplesListResponse>({
    queryKey: governanceQueryKeys.principles(params),
    queryFn: () => principlesApi.list(params),
    ...options,
  });
};

export const usePrinciple = (id: string, options?: any):
  UseQueryResult<ArchitecturePrinciple> => {
  return useQuery<ArchitecturePrinciple>({
    queryKey: governanceQueryKeys.principle(id),
    queryFn: () => principlesApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreatePrinciple = ():
  UseMutationResult<ArchitecturePrinciple, Error, CreatePrincipleRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: principlesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPrinciples() });
    },
  });
};

export const useUpdatePrinciple = ():
  UseMutationResult<ArchitecturePrinciple, Error, { id: string; data: UpdatePrincipleRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => principlesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPrinciples() });
    },
  });
};

export const useDeletePrinciple = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: principlesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPrinciples() });
    },
  });
};

export const usePrincipleCompliance = (id: string, options?: any):
  UseQueryResult<PrincipleComplianceReport> => {
  return useQuery<PrincipleComplianceReport>({
    queryKey: governanceQueryKeys.principle(id),
    queryFn: () => principlesApi.getCompliance(id),
    enabled: !!id,
    ...options,
  });
};

// ============================================================================
// TECHNOLOGY STANDARDS HOOKS
// ============================================================================

export const useStandards = (params?: StandardSearchParams, options?: any):
  UseQueryResult<StandardsListResponse> => {
  return useQuery<StandardsListResponse>({
    queryKey: governanceQueryKeys.standards(params),
    queryFn: () => standardsApi.list(params),
    ...options,
  });
};

export const useStandard = (id: string, options?: any):
  UseQueryResult<TechnologyStandard> => {
  return useQuery<TechnologyStandard>({
    queryKey: governanceQueryKeys.standard(id),
    queryFn: () => standardsApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateStandard = ():
  UseMutationResult<TechnologyStandard, Error, CreateStandardRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: standardsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allStandards() });
    },
  });
};

export const useUpdateStandard = ():
  UseMutationResult<TechnologyStandard, Error, { id: string; data: UpdateStandardRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => standardsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allStandards() });
    },
  });
};

export const useDeleteStandard = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: standardsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allStandards() });
    },
  });
};

export const useTechnologyRadar = (options?: any):
  UseQueryResult<TechnologyRadar> => {
  return useQuery<TechnologyRadar>({
    queryKey: ['technology-radar'],
    queryFn: standardsApi.getRadar,
    ...options,
  });
};

export const useDebtReport = (options?: any):
  UseQueryResult<TechnologyDebtReport> => {
  return useQuery<TechnologyDebtReport>({
    queryKey: ['technology-debt-report'],
    queryFn: standardsApi.getDebtReport,
    ...options,
  });
};

// ============================================================================
// ARCHITECTURE POLICIES HOOKS
// ============================================================================

export const usePolicies = (params?: PolicySearchParams, options?: any):
  UseQueryResult<PolicyListResponse> => {
  return useQuery<PolicyListResponse>({
    queryKey: governanceQueryKeys.policies(params),
    queryFn: () => policiesApi.list(params),
    ...options,
  });
};

export const usePolicy = (id: string, options?: any):
  UseQueryResult<ArchitecturePolicy> => {
  return useQuery<ArchitecturePolicy>({
    queryKey: governanceQueryKeys.policy(id),
    queryFn: () => policiesApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreatePolicy = ():
  UseMutationResult<ArchitecturePolicy, Error, CreatePolicyRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: policiesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPolicies() });
    },
  });
};

export const useUpdatePolicy = ():
  UseMutationResult<ArchitecturePolicy, Error, { id: string; data: UpdatePolicyRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => policiesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPolicies() });
    },
  });
};

export const useDeletePolicy = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: policiesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPolicies() });
    },
  });
};

export const usePolicyComplianceCheck = (id: string, cardIds: string[]):
  UseQueryResult<PolicyComplianceCheckResponse> => {
  return useQuery<PolicyComplianceCheckResponse>({
    queryKey: governanceQueryKeys.policy(id),
    queryFn: () => policiesApi.checkCompliance(id, cardIds),
    enabled: !!id && cardIds.length > 0,
  });
};

export const useValidatePolicy = (id: string, options?: any):
  UseMutationResult<ValidatePolicyResponse, Error, ValidatePolicyRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => policiesApi.validate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allPolicies() });
    },
  });
};

export const usePolicyViolations = (params?: any, options?: any):
  UseQueryResult<PolicyViolationListResponse> => {
  return useQuery<PolicyViolationListResponse>({
    queryKey: ['policy-violations', params],
    queryFn: () => policiesApi.listViolations(params),
    ...options,
  });
};

// ============================================================================
// EXCEPTIONS HOOKS
// ============================================================================

export const useExceptions = (params?: ExceptionListParams, options?: any):
  UseQueryResult<ExceptionListResponse> => {
  return useQuery<ExceptionListResponse>({
    queryKey: governanceQueryKeys.exceptions(params),
    queryFn: () => exceptionsApi.list(params),
    ...options,
  });
};

export const useException = (id: string, options?: any):
  UseQueryResult<Exception> => {
  return useQuery<Exception>({
    queryKey: governanceQueryKeys.exception(id),
    queryFn: () => exceptionsApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateException = ():
  UseMutationResult<Exception, Error, CreateExceptionRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exceptionsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allExceptions() });
    },
  });
};

export const useUpdateException = ():
  UseMutationResult<Exception, Error, { id: string; data: UpdateExceptionRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => exceptionsApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allExceptions() });
    },
  });
};

export const useApproveException = ():
  UseMutationResult<Exception, Error, { id: string; data?: ApproveExceptionRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => exceptionsApi.approve(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allExceptions() });
    },
  });
};

export const useRejectException = ():
  UseMutationResult<Exception, Error, { id: string; data: RejectExceptionRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => exceptionsApi.reject(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allExceptions() });
    },
  });
};

export const useExpiringExceptions = (options?: any):
  UseQueryResult<ExpiringException[]> => {
  return useQuery<ExpiringException[]>({
    queryKey: governanceQueryKeys.expiringExceptions(),
    queryFn: exceptionsApi.listExpiring,
    ...options,
  });
};

export const useDeleteException = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: exceptionsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allExceptions() });
    },
  });
};

// ============================================================================
// INITIATIVES HOOKS
// ============================================================================

export const useInitiatives = (params?: InitiativeSearchParams, options?: any):
  UseQueryResult<InitiativeListResponse> => {
  return useQuery<InitiativeListResponse>({
    queryKey: governanceQueryKeys.initiatives(params),
    queryFn: () => initiativesApi.list(params),
    ...options,
  });
};

export const useInitiative = (id: string, options?: any):
  UseQueryResult<Initiative> => {
  return useQuery<Initiative>({
    queryKey: governanceQueryKeys.initiative(id),
    queryFn: () => initiativesApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateInitiative = ():
  UseMutationResult<Initiative, Error, CreateInitiativeRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiativesApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allInitiatives() });
    },
  });
};

export const useUpdateInitiative = ():
  UseMutationResult<Initiative, Error, { id: string; data: UpdateInitiativeRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => initiativesApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allInitiatives() });
    },
  });
};

export const useDeleteInitiative = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: initiativesApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allInitiatives() });
    },
  });
};

export const useInitiativeImpactMap = (id: string, options?: any):
  UseQueryResult<InitiativeImpactMap> => {
  return useQuery<InitiativeImpactMap>({
    queryKey: governanceQueryKeys.initiative(id),
    queryFn: () => initiativesApi.getImpactMap(id),
    enabled: !!id,
    ...options,
  });
};

export const useLinkCards = (id: string, options?: any):
  UseMutationResult<CardLinkResponse, Error, CardLinkRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => initiativesApi.linkCards(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allInitiatives() });
    },
  });
};

// ============================================================================
// RISKS HOOKS
// ============================================================================

export const useRisks = (params?: RiskSearchParams, options?: any):
  UseQueryResult<RiskListResponse> => {
  return useQuery<RiskListResponse>({
    queryKey: governanceQueryKeys.risks(params),
    queryFn: () => risksApi.list(params),
    ...options,
  });
};

export const useRisk = (id: string, options?: any):
  UseQueryResult<Risk> => {
  return useQuery<Risk>({
    queryKey: governanceQueryKeys.risk(id),
    queryFn: () => risksApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateRisk = ():
  UseMutationResult<Risk, Error, CreateRiskRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: risksApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allRisks() });
    },
  });
};

export const useUpdateRisk = ():
  UseMutationResult<Risk, Error, { id: string; data: UpdateRiskRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => risksApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allRisks() });
    },
  });
};

export const useDeleteRisk = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: risksApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allRisks() });
    },
  });
};

export const useRiskHeatMap = (options?: any):
  UseQueryResult<RiskHeatMapData> => {
  return useQuery<RiskHeatMapData>({
    queryKey: ['risk-heat-map'],
    queryFn: risksApi.getHeatMap,
    ...options,
  });
};

export const useTopRisks = (options?: any):
  UseQueryResult<TopRisksResponse> => {
  return useQuery<TopRisksResponse>({
    queryKey: ['top-risks'],
    queryFn: risksApi.getTopRisks,
    ...options,
  });
};

// ============================================================================
// COMPLIANCE HOOKS
// ============================================================================

export const useComplianceRequirements = (params?: ComplianceRequirementSearchParams, options?: any):
  UseQueryResult<ComplianceRequirementsListResponse> => {
  return useQuery<ComplianceRequirementsListResponse>({
    queryKey: governanceQueryKeys.complianceRequirements(params),
    queryFn: () => complianceApi.list(params),
    ...options,
  });
};

export const useComplianceRequirement = (id: string, options?: any):
  UseQueryResult<ComplianceRequirement> => {
  return useQuery<ComplianceRequirement>({
    queryKey: governanceQueryKeys.complianceRequirement(id),
    queryFn: () => complianceApi.get(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateComplianceRequirement = ():
  UseMutationResult<ComplianceRequirement, Error, CreateComplianceRequirementRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: complianceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allComplianceRequirements() });
    },
  });
};

export const useUpdateComplianceRequirement = ():
  UseMutationResult<ComplianceRequirement, Error, { id: string; data: UpdateComplianceRequirementRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => complianceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allComplianceRequirements() });
    },
  });
};

export const useDeleteComplianceRequirement = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: complianceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allComplianceRequirements() });
    },
  });
};

export const useAssessCompliance = (id: string, options?: any):
  UseMutationResult<ComplianceAssessment, Error, AssessComplianceRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => complianceApi.assessCompliance(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: governanceQueryKeys.allComplianceRequirements(),
        exact: false,
      });
    },
  });
};

export const useComplianceDashboard = (id: string, options?: any):
  UseQueryResult<ComplianceDashboard> => {
  return useQuery<ComplianceDashboard>({
    queryKey: governanceQueryKeys.complianceRequirement(id),
    queryFn: () => complianceApi.getDashboard(id),
    enabled: !!id,
    ...options,
  });
};

// ============================================================================
// ARB HOOKS
// ============================================================================

export const useARBMeetings = (params?: ARBMeetingSearchParams, options?: any):
  UseQueryResult<ARBMeetingListResponse> => {
  return useQuery<ARBMeetingListResponse>({
    queryKey: governanceQueryKeys.arbMeetings(params),
    queryFn: () => arbApi.listMeetings(params),
    ...options,
  });
};

export const useARBMeeting = (id: string, options?: any):
  UseQueryResult<ARBMeeting> => {
  return useQuery<ARBMeeting>({
    queryKey: governanceQueryKeys.arbMeeting(id),
    queryFn: () => arbApi.getMeeting(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateARBMeeting = ():
  UseMutationResult<ARBMeeting, Error, CreateARBMeetingRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbApi.createMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBMeetings() });
    },
  });
};

export const useUpdateARBMeeting = ():
  UseMutationResult<ARBMeeting, Error, { id: string; data: UpdateARBMeetingRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => arbApi.updateMeeting(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBMeetings() });
    },
  });
};

export const useDeleteARBMeeting = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbApi.deleteMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBMeetings() });
    },
  });
};

export const useARBAgenda = (id: string, options?: any):
  UseQueryResult<ARBAgendaItem[]> => {
  return useQuery<ARBAgendaItem[]>({
    queryKey: ['arb-meetings', id, 'agenda'],
    queryFn: () => arbApi.getMeetingAgenda(id),
    enabled: !!id,
    ...options,
  });
};

export const useARBSubmissions = (params?: ARBSubmissionSearchParams, options?: any):
  UseQueryResult<ARBSubmissionListResponse> => {
  return useQuery<ARBSubmissionListResponse>({
    queryKey: governanceQueryKeys.arbSubmissions(params),
    queryFn: () => arbApi.listSubmissions(params),
    ...options,
  });
};

export const useARBSubmission = (id: string, options?: any):
  UseQueryResult<ARBSubmission> => {
  return useQuery<ARBSubmission>({
    queryKey: governanceQueryKeys.arbSubmission(id),
    queryFn: () => arbApi.getSubmission(id),
    enabled: !!id,
    ...options,
  });
};

export const useCreateARBSubmission = ():
  UseMutationResult<ARBSubmission, Error, CreateARBSubmissionRequest> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbApi.createSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBSubmissions() });
    },
  });
};

export const useUpdateARBSubmission = ():
  UseMutationResult<ARBSubmission, Error, { id: string; data: UpdateARBSubmissionRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => arbApi.updateSubmission(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBSubmissions() });
    },
  });
};

export const useDeleteARBSubmission = ():
  UseMutationResult<void, Error, string> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: arbApi.deleteSubmission,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: governanceQueryKeys.allARBSubmissions() });
    },
  });
};

export const useRecordARBDecision = ():
  UseMutationResult<ARBDecision, Error, { id: string; data: CreateARBDecisionRequest }> => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }) => arbApi.recordDecision(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: governanceQueryKeys.allARBSubmissions(),
        exact: false,
      });
    },
  });
};

export const useARBDashboard = (options?: any):
  UseQueryResult<ARBDashboard> => {
  return useQuery<ARBDashboard>({
    queryKey: ['arb-dashboard'],
    queryFn: arbApi.getDashboard,
    ...options,
  });
};

export const useARBStatistics = (options?: any):
  UseQueryResult<ARBStatistics> => {
  return useQuery<ARBStatistics>({
    queryKey: ['arb-statistics'],
    queryFn: arbApi.getStatistics,
    ...options,
  });
};

export {
  governanceQueryKeys,
};