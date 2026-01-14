import { CARD_TYPES, LIFECYCLE_PHASES } from '../helpers/constants';

/**
 * Card Factory
 *
 * Generates test data for cards
 */
export class CardFactory {
  /**
   * Generate a basic card
   */
  static createCard(type: string, overrides: Partial<any> = {}) {
    return {
      id: this.generateId(),
      type,
      name: `Test ${type}`,
      description: `Test ${type} description`,
      lifecycle: {
        plan: LIFECYCLE_PHASES.PLAN,
        phase_in: LIFECYCLE_PHASES.PHASE_IN,
        active: LIFECYCLE_PHASES.ACTIVE,
        phase_out: LIFECYCLE_PHASES.PHASE_OUT,
        eol: LIFECYCLE_PHASES.EOL,
      },
      tags: ['test', 'automation'],
      quality_score: 100,
      ...overrides,
    };
  }

  /**
   * Generate Application card
   */
  static createApplication(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.APPLICATION, {
      attributes: {
        hosting_type: 'SaaS',
        technical_fit: 3,
        functional_fit: 3,
        business_criticality: 'Tier 2',
        pace_layer: 'System of Differentiation',
        data_classification: 'Internal',
      },
      ...overrides,
    });
  }

  /**
   * Generate BusinessCapability card
   */
  static createBusinessCapability(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.BUSINESS_CAPABILITY, {
      name: 'Test Business Capability',
      attributes: {
        maturity_level: 3,
        target_maturity_level: 5,
        strategic_importance: 'High',
        differentiation: 'Innovation',
        investment_category: 'Invest More',
        business_owner: 'Test Owner',
      },
      ...overrides,
    });
  }

  /**
   * Generate ITComponent card
   */
  static createITComponent(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.IT_COMPONENT, {
      name: 'Test IT Component',
      attributes: {
        category: 'Software',
        sub_category: 'Database',
        vendor: 'Test Vendor',
        version: '1.0.0',
        license_model: 'Subscription',
        technology_lifecycle_phase: 'Mature',
      },
      ...overrides,
    });
  }

  /**
   * Generate Interface card
   */
  static createInterface(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.INTERFACE, {
      name: 'Test Interface',
      attributes: {
        interface_type: 'REST API',
        frequency: 'Real-time',
        data_format: 'JSON',
        protocol: 'HTTPS',
        data_volume_daily: '1M records',
      },
      ...overrides,
    });
  }

  /**
   * Generate DataObject card
   */
  static createDataObject(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.DATA_OBJECT, {
      name: 'Test Data Object',
      attributes: {
        sensitivity: ['PII'],
        data_steward: 'Test Steward',
        retention_period: '7 years',
        encryption_required: true,
      },
      ...overrides,
    });
  }

  /**
   * Generate ArchitecturePrinciple card
   */
  static createArchitecturePrinciple(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.ARCHITECTURE_PRINCIPLE, {
      name: 'Test Architecture Principle',
      attributes: {
        statement: 'Test principle statement',
        rationale: 'Test rationale for principle',
        implications: ['Implication 1', 'Implication 2'],
        owner: 'CTO',
        category: 'Strategic',
        adherence_rate: 75,
      },
      ...overrides,
    });
  }

  /**
   * Generate TechnologyStandard card
   */
  static createTechnologyStandard(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.TECHNOLOGY_STANDARD, {
      name: 'Test Technology Standard',
      attributes: {
        category: 'Relational Databases',
        status: 'Adopt',
        sunset_date: null,
        rationale: 'Test rationale',
      },
      ...overrides,
    });
  }

  /**
   * Generate ArchitecturePolicy card
   */
  static createArchitecturePolicy(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.ARCHITECTURE_POLICY, {
      name: 'Test Architecture Policy',
      attributes: {
        rule_json: {
          field: 'business_criticality',
          operator: 'eq',
          value: 'Tier 1',
          requires: ['multi_region', 'disaster_recovery_plan'],
        },
        severity: 'Critical',
        enforcement_mode: 'Blocking',
      },
      ...overrides,
    });
  }

  /**
   * Generate Initiative card
   */
  static createInitiative(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.INITIATIVE, {
      name: 'Test Initiative',
      attributes: {
        type: 'Migration',
        strategic_theme: 'Cloud Transformation',
        budget_total: 1000000,
        budget_spent: 250000,
        start_date: '2026-01-01',
        target_end_date: '2027-12-31',
        owner: 'VP of Infrastructure',
        status: 'In Progress',
        health: 'On Track',
      },
      ...overrides,
    });
  }

  /**
   * Generate Risk card
   */
  static createRisk(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.RISK, {
      name: 'Test Risk',
      attributes: {
        description: 'Test risk description',
        type: 'Operational',
        likelihood: 4,
        impact: 5,
        risk_score: 20,
        mitigation_plan: 'Test mitigation plan',
        owner: 'Risk Owner',
        status: 'Open',
        target_closure_date: '2027-12-31',
      },
      ...overrides,
    });
  }

  /**
   * Generate ComplianceRequirement card
   */
  static createComplianceRequirement(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.COMPLIANCE_REQUIREMENT, {
      name: 'Test Compliance Requirement',
      attributes: {
        framework: 'GDPR',
        description: 'Test compliance description',
        applicable_card_types: ['Application', 'DataObject'],
        required_controls: ['Data encryption at rest', 'Data encryption in transit'],
        audit_frequency: 'Annual',
      },
      ...overrides,
    });
  }

  /**
   * Generate Exception card
   */
  static createException(overrides: Partial<any> = {}) {
    return this.createCard(CARD_TYPES.EXCEPTION, {
      name: 'Test Exception',
      attributes: {
        policy_id: 'policy-001',
        card_id: 'app-001',
        justification: 'Test justification',
        duration: '90_days',
        compensating_controls: ['Control 1', 'Control 2'],
        status: 'Approved',
        expires_at: '2027-12-31T23:59:59Z',
      },
      ...overrides,
    });
  }

  /**
   * Generate multiple cards
   */
  static createCards(type: string, count: number, overrides: Partial<any> = {}) {
    const cards = [];
    for (let i = 0; i < count; i++) {
      cards.push(this.createCard(type, {
        name: `Test ${type} ${i + 1}`,
        ...overrides,
      }));
    }
    return cards;
  }

  /**
   * Generate unique ID
   */
  private static generateId(): string {
    return `test-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}
