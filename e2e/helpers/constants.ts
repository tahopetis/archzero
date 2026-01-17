/**
 * Arc Zero Test Constants
 */

export const API_URL = process.env.API_URL || 'http://localhost:3000';
export const BASE_URL = process.env.BASE_URL || 'http://localhost:5173';

// Default test user credentials
export const TEST_USERS = {
  ADMIN: {
    email: process.env.TEST_ADMIN_EMAIL || 'admin@archzero.local',
    password: process.env.TEST_ADMIN_PASSWORD || 'changeme123',
    role: 'admin',
  },
  ARCHITECT: {
    email: 'architect@archzero.local',
    password: 'test123456',
    role: 'architect',
  },
  EDITOR: {
    email: 'editor@archzero.local',
    password: 'test123456',
    role: 'editor',
  },
  VIEWER: {
    email: 'viewer@archzero.local',
    password: 'changeme123',
    role: 'viewer',
  },
} as const;

// Card types for testing
export const CARD_TYPES = {
  BUSINESS_CAPABILITY: 'BusinessCapability',
  APPLICATION: 'Application',
  IT_COMPONENT: 'ITComponent',
  INTERFACE: 'Interface',
  DATA_OBJECT: 'DataObject',
  OBJECTIVE: 'Objective',
  ORGANIZATION: 'Organization',
  PLATFORM: 'Platform',
  TECH_CATEGORY: 'TechCategory',
  ARCHITECTURE_PRINCIPLE: 'ArchitecturePrinciple',
  TECHNOLOGY_STANDARD: 'TechnologyStandard',
  ARCHITECTURE_POLICY: 'ArchitecturePolicy',
  EXCEPTION: 'Exception',
  INITIATIVE: 'Initiative',
  RISK: 'Risk',
  COMPLIANCE_REQUIREMENT: 'ComplianceRequirement',
} as const;

// Lifecycle phases
export const LIFECYCLE_PHASES = {
  PLAN: '2026-01-01',
  PHASE_IN: '2026-03-01',
  ACTIVE: '2026-06-01',
  PHASE_OUT: '2027-12-31',
  EOL: '2028-12-31',
} as const;

// Common timeouts
export const TIMEOUTS = {
  SHORT: 2000,
  MEDIUM: 5000,
  LONG: 10000,
  XLONG: 30000,
} as const;

// Data-testid selectors
export const SELECTORS = {
  // Layout
  SIDEBAR: '[data-testid="sidebar"]',
  HEADER: '[data-testid="header"]',
  MAIN_CONTENT: '[data-testid="main-content"]',

  // Navigation
  NAV_DASHBOARD: '[data-testid="nav-dashboard"]',
  NAV_INVENTORY: '[data-testid="nav-inventory"]',
  NAV_REPORTS: '[data-testid="nav-reports"]',
  NAV_GOVERNANCE: '[data-testid="nav-governance"]',
  NAV_STRATEGY: '[data-testid="nav-strategy"]',
  NAV_RISK: '[data-testid="nav-risk"]',
  NAV_ARB: '[data-testid="nav-arb"]',

  // Auth
  LOGIN_EMAIL: '[data-testid="login-email"]',
  LOGIN_PASSWORD: '[data-testid="login-password"]',
  LOGIN_BUTTON: '[data-testid="login-button"]',
  LOGOUT_BUTTON: '[data-testid="logout-button"]',

  // Cards
  CARD_LIST: '[data-testid="card-list"]',
  CARD_DETAIL: '[data-testid="card-detail"]',
  CARD_NAME: '[data-testid="card-name"]',
  CARD_TYPE: '[data-testid="card-type"]',
  NEW_CARD_BUTTON: '[data-testid="new-card-button"]',
  SAVE_CARD_BUTTON: '[data-testid="save-card-button"]',
  DELETE_CARD_BUTTON: '[data-testid="delete-card-button"]',

  // Filters
  FILTER_TYPE: '[data-testid="filter-type"]',
  FILTER_LIFECYCLE: '[data-testid="filter-lifecycle"]',
  FILTER_SEARCH: '[data-testid="filter-search"]',

  // Search
  GLOBAL_SEARCH: '[data-testid="global-search"]',
  SEARCH_INPUT: '[data-testid="search-input"]',

  // Common
  LOADING: '[data-testid="loading"]',
  MODAL: '[data-testid="modal"]',
  TOAST: '[data-testid="toast"]',
  NOTIFICATION: '[data-testid="notification"]',
  TABLE: '[data-testid="table"]',
  PAGINATION: '[data-testid="pagination"]',
} as const;

// API endpoints
export const API_ENDPOINTS = {
  AUTH_LOGIN: '/api/v1/auth/login',
  AUTH_REFRESH: '/api/v1/auth/refresh',
  CARDS: '/api/v1/cards',
  CARD_BY_ID: (id: string) => `/api/v1/cards/${id}`,
  RELATIONSHIPS: '/api/v1/relationships',
  GRAPH_TRAVERSE: '/api/v1/graph/traverse',
} as const;

// Sample data templates
export const SAMPLE_TEMPLATES = {
  APPLICATION: {
    name: 'Test Application',
    type: 'Application',
    description: 'Test application description',
    lifecycle: {
      plan: '2026-01-01',
      active: '2026-06-01',
    },
    attributes: {
      hosting_type: 'SaaS',
      technical_fit: 3,
      functional_fit: 3,
      business_criticality: 'Tier 2',
    },
  },
  BUSINESS_CAPABILITY: {
    name: 'Test Business Capability',
    type: 'BusinessCapability',
    description: 'Test business capability description',
    attributes: {
      maturity_level: 3,
      strategic_importance: 'High',
      investment_category: 'Invest More',
    },
  },
} as const;
