import { CARD_TYPES } from '../helpers/constants';

/**
 * Test Data Factory
 *
 * Generates deterministic, realistic test data for E2E tests.
 * Uses sequential IDs to ensure data is consistent across test runs.
 */
export class TestDataFactory {
  // Static counter for deterministic IDs
  private static cardIdCounter = 1;
  private static principleIdCounter = 1;
  private static standardIdCounter = 1;
  private static policyIdCounter = 1;
  private static relationshipIdCounter = 1;

  /**
   * Reset all counters (call this between test runs if needed)
   */
  static resetCounters() {
    this.cardIdCounter = 1;
    this.principleIdCounter = 1;
    this.standardIdCounter = 1;
    this.policyIdCounter = 1;
    this.relationshipIdCounter = 1;
  }

  /**
   * Generate deterministic card ID
   */
  static generateCardId(type: string, index?: number): string {
    if (index !== undefined) {
      return `test-${type.toLowerCase()}-${index}`;
    }
    return `test-${type.toLowerCase()}-${this.cardIdCounter++}`;
  }

  /**
   * Create "Test Application" card (the one tests explicitly search for)
   */
  static createTestApplication() {
    return {
      id: 'test-application-1',
      type: CARD_TYPES.APPLICATION,
      name: 'Test Application',
      description: 'A test application for E2E testing',
      lifecycle_phase: 'Active',
      tags: ['test', 'e2e', 'automation'],
      attributes: {
        hosting_type: 'SaaS',
        technical_fit: 3,
        functional_fit: 3,
        business_criticality: 'Tier 2',
        pace_layer: 'System of Differentiation',
        data_classification: 'Internal',
        vendor: 'Test Vendor',
        version: '1.0.0',
      },
    };
  }

  /**
   * Create diverse set of cards for comprehensive testing
   */
  static createDiverseCards() {
    const cards = [];

    // 1. Test Application (already created above, but including for completeness)
    cards.push(this.createTestApplication());

    // 2. More Applications with different attributes
    cards.push({
      id: this.generateCardId('application'),
      type: CARD_TYPES.APPLICATION,
      name: 'Customer Portal',
      description: 'External-facing customer self-service portal',
      lifecycle_phase: 'Active',
      tags: ['external', 'customer-facing', 'web'],
      attributes: {
        hosting_type: 'On-Premise',
        technical_fit: 4,
        functional_fit: 5,
        business_criticality: 'Tier 1',
        pace_layer: 'System of Differentiation',
        data_classification: 'Confidential',
        vendor: 'Internal',
        version: '2.5.0',
      },
    });

    cards.push({
      id: this.generateCardId('application'),
      type: CARD_TYPES.APPLICATION,
      name: 'Inventory Management System',
      description: 'Internal inventory tracking and management',
      lifecycle_phase: 'Active',
      tags: ['internal', 'operations', 'legacy'],
      attributes: {
        hosting_type: 'IaaS',
        technical_fit: 2,
        functional_fit: 3,
        business_criticality: 'Tier 2',
        pace_layer: 'System of Record',
        data_classification: 'Internal',
        vendor: 'LegacyCorp',
        version: '3.2.1',
      },
    });

    // 3. Business Capabilities
    cards.push({
      id: this.generateCardId('business-capability'),
      type: CARD_TYPES.BUSINESS_CAPABILITY,
      name: 'Order Management',
      description: 'Ability to manage customer orders from creation to fulfillment',
      lifecycle_phase: 'Active',
      tags: ['core', 'operations', 'customer'],
      attributes: {
        maturity_level: 4,
        target_maturity_level: 5,
        strategic_importance: 'High',
        differentiation: 'Competitive Advantage',
        investment_category: 'Invest More',
        business_owner: 'VP of Operations',
      },
    });

    cards.push({
      id: this.generateCardId('business-capability'),
      type: CARD_TYPES.BUSINESS_CAPABILITY,
      name: 'Customer Analytics',
      description: 'Ability to analyze customer behavior and patterns',
      lifecycle_phase: 'Planning',
      tags: ['analytics', 'growth', 'data'],
      attributes: {
        maturity_level: 2,
        target_maturity_level: 4,
        strategic_importance: 'High',
        differentiation: 'Innovation',
        investment_category: 'Invest More',
        business_owner: 'VP of Analytics',
      },
    });

    // 4. IT Components
    cards.push({
      id: this.generateCardId('it-component'),
      type: CARD_TYPES.IT_COMPONENT,
      name: 'PostgreSQL Database',
      description: 'Primary relational database for transactional data',
      lifecycle_phase: 'Active',
      tags: ['database', 'infrastructure', 'critical'],
      attributes: {
        category: 'Database',
        sub_category: 'Relational DBMS',
        vendor: 'PostgreSQL Global Development Group',
        version: '14.5',
        license_model: 'Open Source',
        technology_lifecycle_phase: 'Mature',
      },
    });

    cards.push({
      id: this.generateCardId('it-component'),
      type: CARD_TYPES.IT_COMPONENT,
      name: 'Redis Cache',
      description: 'In-memory data store for caching and session management',
      lifecycle_phase: 'Active',
      tags: ['cache', 'infrastructure', 'performance'],
      attributes: {
        category: 'Middleware',
        sub_category: 'Caching',
        vendor: 'Redis Inc.',
        version: '7.0',
        license_model: 'Open Source',
        technology_lifecycle_phase: 'Mature',
      },
    });

    // 5. Interfaces
    cards.push({
      id: this.generateCardId('interface'),
      type: CARD_TYPES.INTERFACE,
      name: 'Payment Gateway API',
      description: 'Integration with external payment processing service',
      lifecycle_phase: 'Active',
      tags: ['external', 'payment', 'critical'],
      attributes: {
        interface_type: 'REST API',
        frequency: 'Real-time',
        data_format: 'JSON',
        protocol: 'HTTPS',
        data_volume_daily: '10K transactions',
        external_party: 'Stripe',
      },
    });

    cards.push({
      id: this.generateCardId('interface'),
      type: CARD_TYPES.INTERFACE,
      name: 'Shipping Provider Integration',
      description: 'Integration with logistics and shipping providers',
      lifecycle_phase: 'Active',
      tags: ['external', 'logistics', 'batch'],
      attributes: {
        interface_type: 'REST API',
        frequency: 'Batch (Hourly)',
        data_format: 'JSON',
        protocol: 'HTTPS',
        data_volume_daily: '5K shipments',
        external_party: 'FedEx',
      },
    });

    // 6. Objectives
    cards.push({
      id: this.generateCardId('objective'),
      type: CARD_TYPES.OBJECTIVE,
      name: 'Improve System Performance',
      description: 'Achieve sub-200ms response time for all critical user paths',
      lifecycle_phase: 'Active',
      tags: ['performance', 'quality', 'metrics'],
      attributes: {
        category: 'Operational Excellence',
        target_metric: '< 200ms p95 latency',
        current_value: '350ms p95 latency',
        owner: 'VP of Engineering',
        due_date: '2026-12-31',
      },
    });

    // 7. Platforms
    cards.push({
      id: this.generateCardId('platform'),
      type: CARD_TYPES.PLATFORM,
      name: 'Cloud Platform',
      description: 'Enterprise cloud infrastructure platform',
      lifecycle_phase: 'Active',
      tags: ['infrastructure', 'cloud', 'platform'],
      attributes: {
        provider: 'AWS',
        services: ['EC2', 'S3', 'RDS', 'ElastiCache'],
        regions: ['us-east-1', 'us-west-2'],
        certification_level: 'SOC2 Type II',
      },
    });

    // 8. Architecture Principles
    cards.push({
      id: this.generateCardId('principle'),
      type: CARD_TYPES.ARCHITECTURE_PRINCIPLE,
      name: 'Cloud-First Principle',
      description: 'Prefer cloud-native solutions over on-premises deployments',
      lifecycle_phase: 'Active',
      tags: ['strategy', 'cloud', 'governance'],
      attributes: {
        statement: 'Cloud-first approach for all new initiatives',
        rationale: 'Scalability, agility, and reduced capital expenditure',
        implications: ['Exceptions require approval', 'Cost optimization required'],
        owner: 'CTO',
        category: 'Strategic',
        adherence_rate: 85,
      },
    });

    // 9. Technology Standards
    cards.push({
      id: this.generateCardId('standard'),
      type: CARD_TYPES.TECHNOLOGY_STANDARD,
      name: 'Database Standard',
      description: 'Standard relational database technologies approved for use',
      lifecycle_phase: 'Active',
      tags: ['database', 'standard', 'technology'],
      attributes: {
        category: 'Relational Databases',
        status: 'Adopt',
        sunset_date: null,
        rationale: 'Proven reliability and strong ecosystem support',
        approved_technologies: ['PostgreSQL', 'MySQL'],
      },
    });

    // 10. Architecture Policies
    cards.push({
      id: this.generateCardId('policy'),
      type: CARD_TYPES.ARCHITECTURE_POLICY,
      name: 'Tier 1 Application Requirements',
      description: 'Mandatory requirements for Tier 1 business-critical applications',
      lifecycle_phase: 'Active',
      tags: ['policy', 'governance', 'compliance'],
      attributes: {
        rule_json: {
          field: 'business_criticality',
          operator: 'eq',
          value: 'Tier 1',
          requires: ['multi_region', 'disaster_recovery_plan', '24_7_support'],
        },
        severity: 'Critical',
        enforcement_mode: 'Blocking',
      },
    });

    // 11. Initiative
    cards.push({
      id: this.generateCardId('initiative'),
      type: CARD_TYPES.INITIATIVE,
      name: 'Cloud Migration Initiative',
      description: 'Migrate legacy on-premises applications to cloud infrastructure',
      lifecycle_phase: 'Active',
      tags: ['migration', 'cloud', 'strategic'],
      attributes: {
        type: 'Migration',
        strategic_theme: 'Cloud Transformation',
        budget_total: 5000000,
        budget_spent: 1500000,
        start_date: '2026-01-01',
        target_end_date: '2027-12-31',
        owner: 'VP of Infrastructure',
        status: 'In Progress',
        health: 'On Track',
      },
    });

    // 12. Risk
    cards.push({
      id: this.generateCardId('risk'),
      type: CARD_TYPES.RISK,
      name: 'Single Point of Failure - Database',
      description: 'Primary database lacks automatic failover mechanism',
      lifecycle_phase: 'Active',
      tags: ['risk', 'infrastructure', 'high-priority'],
      attributes: {
        description: 'No automated failover for primary PostgreSQL database',
        type: 'Technical',
        likelihood: 3,
        impact: 5,
        risk_score: 15,
        mitigation_plan: 'Implement PostgreSQL HA with automatic failover',
        owner: 'Infrastructure Lead',
        status: 'Open',
        target_closure_date: '2026-06-30',
      },
    });

    // 13. Compliance Requirements
    cards.push({
      id: this.generateCardId('compliance'),
      type: CARD_TYPES.COMPLIANCE_REQUIREMENT,
      name: 'GDPR Data Protection',
      description: 'EU General Data Protection Regulation requirements',
      lifecycle_phase: 'Active',
      tags: ['compliance', 'gdpr', 'privacy'],
      attributes: {
        framework: 'GDPR',
        description: 'Requirements for handling EU citizen personal data',
        applicable_card_types: ['Application', 'DataObject', 'ITComponent'],
        required_controls: [
          'Data encryption at rest',
          'Data encryption in transit',
          'Right to erasure',
          'Data portability',
        ],
        audit_frequency: 'Annual',
        next_audit_date: '2026-12-31',
      },
    });

    // 14. Exception
    cards.push({
      id: this.generateCardId('exception'),
      type: CARD_TYPES.EXCEPTION,
      name: 'Legacy System Exception',
      description: 'Temporary exception for legacy system deployment',
      lifecycle_phase: 'Active',
      tags: ['exception', 'legacy', 'temporary'],
      attributes: {
        policy_id: 'test-policy-1',
        card_id: 'test-application-1',
        justification: 'Legacy system requires on-premises deployment due to regulatory requirements',
        duration: '180_days',
        compensating_controls: ['Enhanced monitoring', 'Quarterly reviews'],
        status: 'Approved',
        expires_at: '2026-12-31T23:59:59Z',
        approved_by: 'CTO',
      },
    });

    return cards;
  }

  /**
   * Create additional cards for pagination and filtering tests
   */
  static createPaginationCards() {
    const cards = [];
    const cardTypes = Object.values(CARD_TYPES);

    // Create 20 more cards to test pagination
    for (let i = 1; i <= 20; i++) {
      const type = cardTypes[i % cardTypes.length];
      cards.push({
        id: this.generateCardId('card'),
        type,
        name: `Pagination Test Card ${i}`,
        description: `Card for testing pagination - number ${i}`,
        lifecycle_phase: ['Planning', 'Active', 'Decommissioned'][i % 3],
        tags: ['pagination-test', `batch-${Math.floor(i / 5)}`],
        attributes: this.getAttributesForType(type, i),
      });
    }

    return cards;
  }

  /**
   * Create relationships between cards
   */
  static createTestRelationships(cards: any[]) {
    const relationships = [];
    const testApp = cards.find(c => c.name === 'Test Application');
    const customerPortal = cards.find(c => c.name === 'Customer Portal');
    const orderMgmt = cards.find(c => c.name === 'Order Management');
    const postgres = cards.find(c => c.name === 'PostgreSQL Database');
    const redis = cards.find(c => c.name === 'Redis Cache');

    if (testApp && customerPortal) {
      relationships.push({
        id: this.generateRelationshipId(),
        source_card_id: testApp.id,
        target_card_id: customerPortal.id,
        relationship_type: 'implements',
        description: 'Test Application implements Customer Portal capability',
      });
    }

    if (customerPortal && orderMgmt) {
      relationships.push({
        id: this.generateRelationshipId(),
        source_card_id: customerPortal.id,
        target_card_id: orderMgmt.id,
        relationship_type: 'enables',
        description: 'Customer Portal enables Order Management',
      });
    }

    if (testApp && postgres) {
      relationships.push({
        id: this.generateRelationshipId(),
        source_card_id: testApp.id,
        target_card_id: postgres.id,
        relationship_type: 'depends_on',
        description: 'Test Application depends on PostgreSQL Database',
      });
    }

    if (testApp && redis) {
      relationships.push({
        id: this.generateRelationshipId(),
        source_card_id: testApp.id,
        target_card_id: redis.id,
        relationship_type: 'uses',
        description: 'Test Application uses Redis Cache for session management',
      });
    }

    return relationships;
  }

  /**
   * Generate deterministic relationship ID
   */
  private static generateRelationshipId(): string {
    return `test-relationship-${this.relationshipIdCounter++}`;
  }

  /**
   * Get default attributes for a card type
   */
  private static getAttributesForType(type: string, index: number) {
    const commonAttrs = {
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    switch (type) {
      case CARD_TYPES.APPLICATION:
        return {
          ...commonAttrs,
          hosting_type: ['SaaS', 'On-Premise', 'IaaS'][index % 3],
          business_criticality: ['Tier 1', 'Tier 2', 'Tier 3'][index % 3],
        };

      case CARD_TYPES.IT_COMPONENT:
        return {
          ...commonAttrs,
          category: 'Software',
          vendor: `Vendor ${index}`,
        };

      case CARD_TYPES.INTERFACE:
        return {
          ...commonAttrs,
          interface_type: 'REST API',
          frequency: 'Real-time',
        };

      default:
        return commonAttrs;
    }
  }
}
