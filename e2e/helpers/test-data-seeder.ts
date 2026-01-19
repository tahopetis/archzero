import { request } from '@playwright/test';

/**
 * Test Data Seeder
 *
 * Seeds the database with test data for E2E tests.
 * Uses API calls to create realistic, deterministic test data.
 */
export class TestDataSeeder {
  private request: any;
  private baseURL: string;
  private authToken: string;

  constructor(requestContext: any, authToken: string) {
    this.request = requestContext;
    this.baseURL = process.env.API_URL || 'http://localhost:3000';
    this.authToken = authToken;
  }

  /**
   * Seed all test data
   */
  async seedAll() {
    console.log('🌱 Starting test data seeding...');

    try {
      // Seed in the correct order
      await this.seedCards();
      await this.seedRelationships();
      await this.seedInitiatives();
      const meetingIds = await this.seedARBMeetings();
      await this.seedARBSubmissions(meetingIds);
      await this.seedRisksAndCompliance();
      await this.seedAudits();

      console.log('✅ Test data seeding complete');
    } catch (error) {
      console.error('❌ Test data seeding failed:', error);
      throw error;
    }
  }

  /**
   * Seed cards
   */
  async seedCards() {
    console.log('📦 Seeding cards...');

    // Get diverse set of cards
    const diverseCards = TestDataFactory.createDiverseCards();

    // Get pagination test cards
    const paginationCards = TestDataFactory.createPaginationCards();

    // Combine all cards - pagination cards first so diverse cards appear first in list
    // (sorted by created_at DESC, so last created appears first)
    const allCards = [...paginationCards, ...diverseCards];

    // Create cards via API
    let createdCount = 0;
    let skippedCount = 0;

    for (const card of allCards) {
      try {
        // Transform card data to match backend expectations (camelCase for JSON serialization)
        const createRequest = {
          name: card.name,
          type: card.type,
          lifecyclePhase: card.lifecycle_phase,
          description: card.description,
          tags: card.tags,
          attributes: card.attributes || {},
        };

        const response = await this.request.post(`${this.baseURL}/api/v1/cards`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: createRequest,
        });

        if (response.ok()) {
          createdCount++;
          console.log(`  ✅ Created card: ${card.name}`);
        } else if (response.status() === 409) {
          // Card already exists (conflict), that's OK
          skippedCount++;
          console.log(`  ⏭️  Skipped existing card: ${card.name}`);
        } else {
          const errorText = await response.text();
          console.warn(`⚠️  Failed to create card ${card.name}: ${response.status()} - ${errorText}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error creating card ${card.name}:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} cards, ${skippedCount} already existed`);
  }

  /**
   * Seed relationships between cards
   */
  async seedRelationships() {
    console.log('🔗 Seeding relationships...');

    // Add a small delay to ensure cards are fully persisted
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fetch all cards across multiple pages to handle caching
    let allCards: any[] = [];
    let page = 1;
    const pageSize = 20;
    let hasMore = true;

    while (hasMore) {
      const cardsResponse = await this.request.get(`${this.baseURL}/api/v1/cards?page=${page}&page_size=${pageSize}`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (!cardsResponse.ok()) {
        console.warn('⚠️  Could not fetch cards, skipping relationship seeding');
        return;
      }

      const cardsData = await cardsResponse.json();
      const cards = cardsData.data || cardsData;

      if (!Array.isArray(cards)) {
        console.warn('⚠️  Invalid cards response, skipping relationship seeding');
        return;
      }

      allCards.push(...cards);

      if (cards.length < pageSize) {
        hasMore = false;
      } else {
        page++;
      }
    }

    if (allCards.length === 0) {
      console.warn('⚠️  No cards found, skipping relationship seeding');
      return;
    }

    console.log(`📋 Found ${allCards.length} cards for relationship mapping`);

    // Create a name to ID map
    const cardMap = new Map<string, string>();
    allCards.forEach((card: any) => {
      cardMap.set(card.name, card.id);
    });

    console.log('🗂️  Card map:', Array.from(cardMap.keys()));

    // Create relationships using TestDataFactory
    const relationships = TestDataFactory.createTestRelationships(Array.from(cardMap.keys()));

    let createdCount = 0;
    let skippedCount = 0;

    for (const relationship of relationships) {
      try {
        // Map card names to IDs
        const sourceId = cardMap.get(relationship.source_card_name);
        const targetId = cardMap.get(relationship.target_card_name);

        if (!sourceId || !targetId) {
          console.warn(`⚠️  Could not find cards for relationship: ${relationship.source_card_name} -> ${relationship.target_card_name}`);
          continue;
        }

        const createRequest = {
          fromCardId: sourceId,
          toCardId: targetId,
          relationshipType: relationship.relationship_type,
          description: relationship.description,
        };

        const response = await this.request.post(`${this.baseURL}/api/v1/relationships`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: createRequest,
        });

        if (response.ok()) {
          createdCount++;
        } else if (response.status() === 409) {
          // Relationship already exists
          skippedCount++;
        } else {
          console.warn(`⚠️  Failed to create relationship: ${response.status()}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error creating relationship:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} relationships, ${skippedCount} already existed`);
  }

  /**
   * Seed initiatives for strategic planning tests
   */
  async seedInitiatives() {
    console.log('🎯 Seeding initiatives...');

    // Get test initiatives from TestDataFactory
    const initiatives = TestDataFactory.createTestInitiatives();

    let createdCount = 0;
    let skippedCount = 0;

    for (const initiative of initiatives) {
      try {
        const response = await this.request.post(`${this.baseURL}/api/v1/initiatives`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: initiative,
        });

        if (response.ok()) {
          createdCount++;
          console.log(`  ✅ Created initiative: ${initiative.name}`);
        } else if (response.status() === 409) {
          skippedCount++;
          console.log(`  ⏭️  Skipped existing initiative: ${initiative.name}`);
        } else {
          const errorText = await response.text();
          console.warn(`⚠️  Failed to create initiative ${initiative.name}: ${response.status()} - ${errorText}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error creating initiative ${initiative.name}:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} initiatives, ${skippedCount} already existed`);
  }

  /**
   * Seed ARB meetings
   * Returns array of created meeting IDs for use in submissions
   */
  async seedARBMeetings(): Promise<string[]> {
    console.log('📅 Seeding ARB meetings...');

    // Get test meetings from TestDataFactory
    const meetings = TestDataFactory.createTestARBMeetings();
    const meetingIds: string[] = [];

    let createdCount = 0;
    let skippedCount = 0;

    for (const meeting of meetings) {
      try {
        const response = await this.request.post(`${this.baseURL}/api/v1/arb/meetings`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: meeting,
        });

        if (response.ok()) {
          const meetingData = await response.json();
          meetingIds.push(meetingData.id);
          createdCount++;
          console.log(`  ✅ Created ARB meeting: ${meeting.title}`);
        } else if (response.status() === 409) {
          skippedCount++;
          console.log(`  ⏭️  Skipped existing meeting: ${meeting.title}`);
        } else {
          const errorText = await response.text();
          console.warn(`⚠️  Failed to create meeting ${meeting.title}: ${response.status()} - ${errorText}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error creating meeting ${meeting.title}:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} ARB meetings, ${skippedCount} already existed`);
    return meetingIds;
  }

  /**
   * Seed ARB submissions
   */
  async seedARBSubmissions(meetingIds: string[] = []) {
    console.log('📝 Seeding ARB submissions...');

    // Get test submissions from TestDataFactory
    const submissions = TestDataFactory.createTestARBSubmissions();

    let createdCount = 0;
    let skippedCount = 0;

    for (const submission of submissions) {
      try {
        // Handle special meetingId markers
        let submissionData = { ...submission };
        if (submission.meetingId === 'ASSIGN_TO_FIRST_MEETING' && meetingIds.length > 0) {
          submissionData.meetingId = meetingIds[0];
        } else if (submission.meetingId === 'ASSIGN_TO_SECOND_MEETING' && meetingIds.length > 1) {
          submissionData.meetingId = meetingIds[1];
        } else if (submission.meetingId && !submission.meetingId.startsWith('ASSIGN_TO_')) {
          // Keep the meetingId as-is if it's a real UUID
        } else {
          // Remove meetingId if it's a marker or not assigned
          delete submissionData.meetingId;
        }

        const response = await this.request.post(`${this.baseURL}/api/v1/arb/submissions`, {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
          },
          data: submissionData,
        });

        if (response.ok()) {
          createdCount++;
          const status = submissionData.meetingId ? '[with meeting]' : '[pending]';
          console.log(`  ✅ Created ARB submission: ${submission.title} ${status}`);
        } else if (response.status() === 409) {
          skippedCount++;
          console.log(`  ⏭️  Skipped existing submission: ${submission.title}`);
        } else {
          const errorText = await response.text();
          console.warn(`⚠️  Failed to create submission: ${response.status()} - ${errorText}`);
        }
      } catch (error) {
        console.warn(`⚠️  Error creating submission:`, error);
      }
    }

    console.log(`✅ Created ${createdCount} ARB submissions, ${skippedCount} already existed`);
  }

  /**
   * Seed risk and compliance data
   */
  async seedRisksAndCompliance() {
    console.log('📊 Seeding risk and compliance data...');

    try {
      // Seed risks
      const risks = TestDataFactory.createSampleRisks();
      let createdRisks = 0;
      let skippedRisks = 0;

      for (const risk of risks) {
        try {
          const response = await this.request.post(`${this.baseURL}/api/v1/risks`, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
            data: risk,
          });

          if (response.ok()) {
            createdRisks++;
            console.log(`  ✅ Created risk: ${risk.name}`);
          } else if (response.status() === 409) {
            skippedRisks++;
            console.log(`  ⏭️  Skipped existing risk: ${risk.name}`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️  Failed to create risk ${risk.name}: ${response.status()} - ${errorText}`);
          }
        } catch (error) {
          console.warn(`⚠️  Error creating risk ${risk.name}:`, error);
        }
      }

      console.log(`✅ Created ${createdRisks} risks, ${skippedRisks} already existed`);

      // Seed compliance requirements
      const requirements = TestDataFactory.createComplianceRequirements();
      let createdRequirements = 0;
      let skippedRequirements = 0;

      for (const req of requirements) {
        try {
          const response = await this.request.post(`${this.baseURL}/api/v1/compliance-requirements`, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
            data: req,
          });

          if (response.ok()) {
            createdRequirements++;
            console.log(`  ✅ Created compliance requirement: ${req.name}`);
          } else if (response.status() === 409) {
            skippedRequirements++;
            console.log(`  ⏭️  Skipped existing requirement: ${req.name}`);
          } else {
            const errorText = await response.text();
            console.warn(`⚠️  Failed to create requirement ${req.name}: ${response.status()} - ${errorText}`);
          }
        } catch (error) {
          console.warn(`⚠️  Error creating requirement ${req.name}:`, error);
        }
      }

      console.log(`✅ Created ${createdRequirements} compliance requirements, ${skippedRequirements} already existed`);
    } catch (error) {
      console.error('❌ Failed to seed risk and compliance data:', error);
      throw error;
    }
  }

  /**
   * Seed audit records
   */
  async seedAudits() {
    console.log('📅 Seeding audit records...');

    try {
      const audits = TestDataFactory.createSampleAudits();
      let createdAudits = 0;
      let skippedAudits = 0;

      for (const audit of audits) {
        try {
          const response = await this.request.post(`${this.baseURL}/api/v1/compliance-audits`, {
            headers: {
              'Authorization': `Bearer ${this.authToken}`,
            },
            data: audit,
          });

          if (response.ok()) {
            createdAudits++;
            console.log(`  ✅ Created audit: ${audit.title}`);
          } else if (response.status() === 409) {
            skippedAudits++;
            console.log(`  ⏭️  Skipped existing audit: ${audit.title}`);
          } else {
            // Endpoint might not exist yet, log warning but don't fail
            const errorText = await response.text();
            console.warn(`⚠️  Could not create audit ${audit.title}: ${response.status()} - ${errorText}`);
            // Continue with next audit
          }
        } catch (error) {
          console.warn(`⚠️  Error creating audit ${audit.title}:`, error);
        }
      }

      console.log(`✅ Created ${createdAudits} audits, ${skippedAudits} already existed`);
    } catch (error) {
      console.error('❌ Failed to seed audit data:', error);
      throw error;
    }
  }

  /**
   * Clear all test data (use with caution!)
   */
  async clearAll() {
    console.log('🧹 Clearing test data...');

    try {
      // Delete ALL cards - use authenticated request
      const response = await this.request.get(`${this.baseURL}/api/v1/cards`, {
        headers: {
          'Authorization': `Bearer ${this.authToken}`,
        },
      });

      if (response.ok()) {
        const cardsData = await response.json();
        const cards = cardsData.data || cardsData;

        if (Array.isArray(cards)) {
          console.log(`Found ${cards.length} cards to delete`);

          // Delete ALL cards for clean test state
          for (const card of cards) {
            try {
              const deleteResponse = await this.request.delete(`${this.baseURL}/api/v1/cards/${card.id}`, {
                headers: {
                  'Authorization': `Bearer ${this.authToken}`,
                },
              });

              if (deleteResponse.ok()) {
                console.log(`  ✅ Deleted card: ${card.name}`);
              } else {
                console.warn(`  ⚠️  Failed to delete card ${card.name}: ${deleteResponse.status()}`);
              }
            } catch (error) {
              console.warn(`  ⚠️  Error deleting card ${card.name}:`, error);
            }
          }
        }
      } else {
        console.warn(`  ⚠️  Could not fetch cards to delete: ${response.status()}`);
      }

      console.log('✅ Test data cleared');
    } catch (error) {
      console.error('❌ Failed to clear test data:', error);
      throw error;
    }
  }

  /**
   * Check if test data already exists
   */
  async testDataExists(): Promise<boolean> {
    try {
      const response = await this.request.get(`${this.baseURL}/api/v1/cards`);

      if (!response.ok()) {
        return false;
      }

      const cardsData = await response.json();
      const cards = cardsData.data || cardsData;

      // Check if "Test-Application" exists
      return Array.isArray(cards) && cards.some((c: any) => c.name === 'Test-Application');
    } catch (error) {
      return false;
    }
  }
}

/**
 * Test Data Factory
 *
 * Generates deterministic, realistic test data for E2E tests.
 */
class TestDataFactory {
  /**
   * Create "Test Application" card (the one tests explicitly search for)
   */
  static createTestApplication() {
    return {
      name: 'Test-Application',
      type: 'Application',
      description: 'A test application for E2E testing',
      lifecycle_phase: 'Active',
      tags: ['test', 'e2e', 'automation'],
      quality_score: 100,
      attributes: {
        hosting_type: 'SaaS',
        technical_fit: 3,
        functional_fit: 3,
        business_criticality: 'Tier 2',
        pace_layer: 'System of Differentiation',
        data_classification: 'Internal',
      },
    };
  }

  /**
   * Create diverse set of cards for comprehensive testing
   */
  static createDiverseCards() {
    return [
      // 1. Test Application
      this.createTestApplication(),

      // 2. More Applications with different attributes
      {
        name: 'Customer-Portal',
        type: 'Application',
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
        },
      },

      {
        name: 'Inventory-Management-System',
        type: 'Application',
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
        },
      },

      // 3. Business Capabilities
      {
        name: 'Order-Management',
        type: 'BusinessCapability',
        description: 'Ability to manage customer orders from creation to fulfillment',
        lifecycle_phase: 'Active',
        tags: ['core', 'operations', 'customer'],
        attributes: {
          maturity_level: 4,
          target_maturity_level: 5,
          strategic_importance: 'High',
          differentiation: 'Competitive Advantage',
          investment_category: 'Invest More',
        },
      },

      {
        name: 'Customer-Analytics',
        type: 'BusinessCapability',
        description: 'Ability to analyze customer behavior and patterns',
        lifecycle_phase: 'Planning',
        tags: ['analytics', 'growth', 'data'],
        attributes: {
          maturity_level: 2,
          target_maturity_level: 4,
          strategic_importance: 'High',
          differentiation: 'Innovation',
          investment_category: 'Invest More',
        },
      },

      // 4. IT Components
      {
        name: 'PostgreSQL-Database',
        type: 'ITComponent',
        description: 'Primary relational database for transactional data',
        lifecycle_phase: 'Active',
        tags: ['database', 'infrastructure', 'critical'],
        attributes: {
          category: 'Database',
          sub_category: 'Relational DBMS',
          vendor: 'PostgreSQL Global Development Group',
          version: '14.5',
          license_model: 'Open Source',
        },
      },

      {
        name: 'Redis-Cache',
        type: 'ITComponent',
        description: 'In-memory data store for caching and session management',
        lifecycle_phase: 'Active',
        tags: ['cache', 'infrastructure', 'performance'],
        attributes: {
          category: 'Middleware',
          sub_category: 'Caching',
          vendor: 'Redis Inc.',
          version: '7.0',
          license_model: 'Open Source',
        },
      },

      // 5. Interfaces
      {
        name: 'Payment-Gateway-API',
        type: 'Interface',
        description: 'Integration with external payment processing service',
        lifecycle_phase: 'Active',
        tags: ['external', 'payment', 'critical'],
        attributes: {
          interface_type: 'REST API',
          frequency: 'Real-time',
          data_format: 'JSON',
          protocol: 'HTTPS',
          external_party: 'Stripe',
        },
      },

      {
        name: 'Shipping-Provider-Integration',
        type: 'Interface',
        description: 'Integration with logistics and shipping providers',
        lifecycle_phase: 'Active',
        tags: ['external', 'logistics', 'batch'],
        attributes: {
          interface_type: 'REST API',
          frequency: 'Batch (Hourly)',
          data_format: 'JSON',
          protocol: 'HTTPS',
          external_party: 'FedEx',
        },
      },

      // 6. Objective
      {
        name: 'Improve-System-Performance',
        type: 'Objective',
        description: 'Achieve sub-200ms response time for all critical user paths',
        lifecycle_phase: 'Active',
        tags: ['performance', 'quality', 'metrics'],
        attributes: {
          category: 'Operational Excellence',
          target_metric: '< 200ms p95 latency',
        },
      },

      // 7. Platform
      {
        name: 'Cloud-Platform',
        type: 'Platform',
        description: 'Enterprise cloud infrastructure platform',
        lifecycle_phase: 'Active',
        tags: ['infrastructure', 'cloud', 'platform'],
        attributes: {
          provider: 'AWS',
          services: ['EC2', 'S3', 'RDS', 'ElastiCache'],
          regions: ['us-east-1', 'us-west-2'],
        },
      },
    ];
  }

  /**
   * Create additional cards for pagination and filtering tests
   */
  static createPaginationCards() {
    const cards = [];
    const cardTypes = ['Application', 'BusinessCapability', 'ITComponent', 'Interface', 'Platform'];

    // Create 20 more cards to test pagination
    for (let i = 1; i <= 20; i++) {
      const type = cardTypes[i % cardTypes.length];
      cards.push({
        name: `Pagination Test Card ${i}`,
        type,
        description: `Card for testing pagination - number ${i}`,
        lifecycle_phase: ['Planning', 'Active', 'Decommissioned'][i % 3],
        tags: ['pagination-test', `batch-${Math.floor(i / 5)}`],
        attributes: {
          test_index: i,
        },
      });
    }

    return cards;
  }

  /**
   * Create relationships between cards (by name, will be mapped to IDs later)
   */
  static createTestRelationships(cardNames: string[]) {
    return [
      {
        source_card_name: 'Test-Application',
        target_card_name: 'Customer-Portal',
        relationship_type: 'reliesOn',
        description: 'Test Application implements Customer Portal capability',
      },
      {
        source_card_name: 'Customer-Portal',
        target_card_name: 'Order-Management',
        relationship_type: 'impacts',
        description: 'Customer Portal enables Order Management',
      },
      {
        source_card_name: 'Test-Application',
        target_card_name: 'PostgreSQL-Database',
        relationship_type: 'dependsOn',
        description: 'Test Application depends on PostgreSQL Database',
      },
      {
        source_card_name: 'Test-Application',
        target_card_name: 'Redis-Cache',
        relationship_type: 'reliesOn',
        description: 'Test Application uses Redis Cache for session management',
      },
    ];
  }

  /**
   * Create test ARB meetings
   */
  static createTestARBMeetings() {
    // Get future dates for meetings
    const now = new Date();
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);

    const weekAfter = new Date(now);
    weekAfter.setDate(now.getDate() + 14);

    const formatDateString = (date: Date) => {
      return date.toISOString().split('T')[0];
    };

    return [
      {
        title: 'ARB Review - January 2026',
        scheduledDate: formatDateString(nextWeek),
        status: 'Scheduled',
        agenda: [
          'Review Payment Processing System',
          'Architecture Decision: Database Migration',
          'New Technology Proposal: React Native for Mobile',
        ],
        attendees: [],
      },
      {
        title: 'ARB Review - February 2026',
        scheduledDate: formatDateString(weekAfter),
        status: 'Scheduled',
        agenda: [
          'Cloud Migration Strategy',
          'Microservices Architecture Review',
        ],
        attendees: [],
      },
    ];
  }

  /**
   * Create test ARB submissions with various statuses for comprehensive testing
   */
  static createTestARBSubmissions() {
    return [
      // Draft submissions - for testing conditional approval and template save
      // Multiple draft entries to support parallel test execution across 3 browsers
      {
        type: 'ArchitectureReview',
        title: 'Draft: Microservices Pattern Review',
        rationale: 'Review microservices patterns for system architecture',
        priority: 'High',
        isDraft: true,
      },
      {
        type: 'ArchitectureReview',
        title: 'Draft: API Design Patterns',
        rationale: 'Review API design patterns and best practices',
        priority: 'Medium',
        isDraft: true,
      },
      {
        type: 'ArchitectureReview',
        title: 'Draft: Database Sharding Strategy',
        rationale: 'Evaluate database sharding approach for scalability',
        priority: 'High',
        isDraft: true,
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Draft: Event Streaming Platform',
        rationale: 'Proposal to adopt Apache Kafka for event streaming',
        priority: 'Medium',
        isDraft: true,
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Draft: Container Registry',
        rationale: 'Proposal for private container registry implementation',
        priority: 'Low',
        isDraft: true,
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Draft: Service Mesh Adoption',
        rationale: 'Evaluate service mesh solutions for microservices',
        priority: 'Medium',
        isDraft: true,
      },
      {
        type: 'ExceptionRequest',
        title: 'Draft: TLS Protocol Exception',
        rationale: 'Request for TLS version exception for legacy system',
        priority: 'Critical',
        isDraft: true,
      },
      {
        type: 'ExceptionRequest',
        title: 'Draft: Password Policy Exception',
        rationale: 'Exception request for password policy requirements',
        priority: 'High',
        isDraft: true,
      },
      {
        type: 'ExceptionRequest',
        title: 'Draft: Backup Retention Policy',
        rationale: 'Request for exception to standard backup retention policy',
        priority: 'Medium',
        isDraft: true,
      },
      {
        type: 'PolicyViolation',
        title: 'Draft: Unauthorized API Access',
        rationale: 'Report of unauthorized API access attempt',
        priority: 'Critical',
        isDraft: true,
      },
      {
        type: 'PolicyViolation',
        title: 'Draft: Encryption Standards Violation',
        rationale: 'Report of non-compliant encryption implementation',
        priority: 'High',
        isDraft: true,
      },
      {
        type: 'PolicyViolation',
        title: 'Draft: Data Residency Issue',
        rationale: 'Report of data storage in non-compliant region',
        priority: 'High',
        isDraft: true,
      },
      // Pending submissions (no meeting, no decision)
      {
        type: 'ArchitectureReview',
        title: 'Payment Processing System Review',
        rationale: 'Review the new payment processing system architecture for compliance and security',
        priority: 'High',
      },
      {
        type: 'NewTechnologyProposal',
        title: 'React Native for Mobile Development',
        rationale: 'Proposal to use React Native for cross-platform mobile application development',
        priority: 'Medium',
      },
      {
        type: 'ExceptionRequest',
        title: 'Database Migration Exception',
        rationale: 'Request for exception to standard database migration process due to tight timeline',
        priority: 'Critical',
      },
      {
        type: 'PolicyViolation',
        title: 'Direct Database Access',
        rationale: 'Report of direct database access in production environment',
        priority: 'Critical',
      },
      {
        type: 'ArchitectureReview',
        title: 'API Gateway Architecture',
        rationale: 'Review proposed API Gateway implementation for microservices communication',
        priority: 'High',
      },
      {
        type: 'NewTechnologyProposal',
        title: 'GraphQL Implementation',
        rationale: 'Proposal to adopt GraphQL for frontend-backend communication',
        priority: 'Medium',
      },
      {
        type: 'ExceptionRequest',
        title: 'Emergency Deployment Exception',
        rationale: 'Request for emergency deployment bypassing standard review process',
        priority: 'Critical',
      },
      {
        type: 'ArchitectureReview',
        title: 'Event-Driven Architecture',
        rationale: 'Review proposal for event-driven architecture using message queues',
        priority: 'High',
      },
      {
        type: 'PolicyViolation',
        title: 'Shadow IT Discovery',
        rationale: 'Report of unauthorized software usage in department',
        priority: 'Medium',
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Kubernetes Adoption',
        rationale: 'Proposal to migrate container orchestration to Kubernetes',
        priority: 'High',
      },
      {
        type: 'ArchitectureReview',
        title: 'Overdue Security Review',
        rationale: 'Security review that is now overdue',
        priority: 'High',
        submittedAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(), // 10 days ago
      },
      {
        type: 'ExceptionRequest',
        title: 'Overdue Policy Exception',
        rationale: 'Policy exception request that is now overdue',
        priority: 'Critical',
        submittedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(), // 12 days ago
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Overdue Tech Proposal',
        rationale: 'Technology proposal that is now overdue',
        priority: 'Medium',
        submittedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
      },
      // Submissions with assigned meetings (pending_review status)
      // These will be assigned to meetings created by seedARBMeetings
      {
        type: 'ArchitectureReview',
        title: 'Cloud Migration Strategy',
        rationale: 'Review proposed cloud migration approach and architectural considerations',
        priority: 'High',
        meetingId: 'ASSIGN_TO_FIRST_MEETING', // Special marker to assign to first meeting
      },
      {
        type: 'NewTechnologyProposal',
        title: 'Microservices Architecture',
        rationale: 'Proposal to transition from monolithic to microservices architecture',
        priority: 'Medium',
        meetingId: 'ASSIGN_TO_FIRST_MEETING',
      },
      {
        type: 'ExceptionRequest',
        title: 'Security Protocol Exception',
        rationale: 'Temporary exception to security protocols for emergency fix deployment',
        priority: 'Critical',
        meetingId: 'ASSIGN_TO_SECOND_MEETING',
      },
    ];
  }

  /**
   * Create test initiatives for strategic planning E2E tests
   */
  static createTestInitiatives() {
    return [
      {
        name: 'Cloud Migration Initiative',
        description: 'Migrate all on-premise systems to cloud infrastructure',
        type: 'Migration',
        strategicTheme: 'Digital Transformation',
        budgetTotal: 1000000,
        budgetSpent: 450000,
        startDate: '2026-01-01',
        targetEndDate: '2026-12-31',
        owner: 'admin@archzero.local',
        status: 'InProgress',
        health: 'OnTrack',
      },
      {
        name: 'Digital Transformation Program',
        description: 'Comprehensive digital transformation across all business units',
        type: 'Modernization',
        strategicTheme: 'Enterprise Modernization',
        budgetTotal: 2500000,
        budgetSpent: 750000,
        startDate: '2025-06-01',
        targetEndDate: '2027-12-31',
        owner: 'admin@archzero.local',
        status: 'InProgress',
        health: 'AtRisk',
      },
      {
        name: 'Customer Experience Enhancement',
        description: 'Improve customer experience through better UX and personalization',
        type: 'NewBuild',
        strategicTheme: 'Customer Experience',
        budgetTotal: 500000,
        budgetSpent: 0,
        startDate: '2026-03-01',
        targetEndDate: '2026-09-30',
        owner: 'admin@archzero.local',
        status: 'Planning',
        health: 'OnTrack',
      },
      {
        name: 'Legacy System Modernization',
        description: 'Modernize legacy systems for better performance and maintainability',
        type: 'Modernization',
        strategicTheme: 'Technical Debt Reduction',
        budgetTotal: 1500000,
        budgetSpent: 225000,
        startDate: '2026-02-01',
        targetEndDate: '2027-06-30',
        owner: 'admin@archzero.local',
        status: 'InProgress',
        health: 'BehindSchedule',
      },
      {
        name: 'Data Analytics Platform',
        description: 'Build comprehensive data analytics and reporting platform',
        type: 'NewBuild',
        strategicTheme: 'Data-Driven Decision Making',
        budgetTotal: 800000,
        budgetSpent: 480000,
        startDate: '2025-09-01',
        targetEndDate: '2026-08-31',
        owner: 'admin@archzero.local',
        status: 'InProgress',
        health: 'OnTrack',
      },
      {
        name: 'Security Enhancement Program',
        description: 'Enhance security posture across all systems and processes',
        type: 'Integration',
        strategicTheme: 'Security & Compliance',
        budgetTotal: 600000,
        budgetSpent: 450000,
        startDate: '2026-01-01',
        targetEndDate: '2026-06-30',
        owner: 'admin@archzero.local',
        status: 'InProgress',
        health: 'OnTrack',
      },
      {
        name: 'API Gateway Implementation',
        description: 'Implement centralized API gateway for all services',
        type: 'Integration',
        strategicTheme: 'Platform Modernization',
        budgetTotal: 400000,
        budgetSpent: 80000,
        startDate: '2026-04-01',
        targetEndDate: '2026-10-31',
        owner: 'admin@archzero.local',
        status: 'OnHold',
        health: 'AtRisk',
      },
      {
        name: 'Mobile Application Development',
        description: 'Develop native mobile applications for iOS and Android',
        type: 'NewBuild',
        strategicTheme: 'Customer Experience',
        budgetTotal: 900000,
        budgetSpent: 0,
        startDate: '2026-05-01',
        targetEndDate: '2026-12-31',
        owner: 'admin@archzero.local',
        status: 'Planning',
        health: 'OnTrack',
      },
    ];
  }

  /**
   * Create sample risks for testing
   */
  static createSampleRisks() {
    return [
      {
        name: 'Data Breach Risk',
        description: 'Unauthorized access to customer PII data due to insufficient access controls',
        riskType: 'Security',
        likelihood: 4,
        impact: 5,
        status: 'Open',
        mitigationPlan: 'Implement multi-factor authentication and enhance access logging',
        owner: 'Security Team',
        targetClosureDate: '2026-03-31',
      },
      {
        name: 'System Outage Risk',
        description: 'Single point of failure in primary load balancer',
        riskType: 'Operational',
        likelihood: 3,
        impact: 4,
        status: 'Open',
        mitigationPlan: 'Add redundant load balancer configuration',
        owner: 'Infrastructure Team',
        targetClosureDate: '2026-02-28',
      },
      {
        name: 'GDPR Non-Compliance',
        description: 'Lack of documented DPIA processes for personal data processing',
        riskType: 'Compliance',
        likelihood: 4,
        impact: 5,
        status: 'Open',
        mitigationPlan: 'Implement Data Protection Impact Assessment (DPIA) workflow',
        owner: 'Compliance Officer',
        targetClosureDate: '2026-04-15',
      },
      {
        name: 'Legacy API Security',
        description: 'Legacy APIs lack proper authentication and rate limiting',
        riskType: 'Security',
        likelihood: 3,
        impact: 4,
        status: 'Mitigated',
        mitigationPlan: 'Implement OAuth2 and rate limiting on all legacy APIs',
        owner: 'Platform Team',
        targetClosureDate: '2026-03-15',
      },
      {
        name: 'Database Performance',
        description: 'Query performance degradation under high load',
        riskType: 'Strategic',
        likelihood: 4,
        impact: 3,
        status: 'Open',
        mitigationPlan: 'Optimize slow queries and add database indexing',
        owner: 'Database Team',
        targetClosureDate: '2026-02-15',
      },
      {
        name: 'Third-Party Dependency',
        description: 'Critical dependency on unmaintained open-source library',
        riskType: 'Operational',
        likelihood: 2,
        impact: 5,
        status: 'Closed',
        mitigationPlan: 'Replace with maintained alternative or fork and maintain internally',
        owner: 'Engineering Team',
        targetClosureDate: '2025-12-31',
      },
      {
        name: 'Cloud Cost Overrun',
        description: 'Unexpected cloud infrastructure cost escalation',
        riskType: 'Financial',
        likelihood: 3,
        impact: 3,
        status: 'Accepted',
        mitigationPlan: 'Implement cost monitoring and alerting',
        owner: 'FinOps Team',
        targetClosureDate: '2026-01-31',
      },
      {
        name: 'Insufficient Backup Testing',
        description: 'Backup recovery procedures not regularly tested',
        riskType: 'Operational',
        likelihood: 3,
        impact: 5,
        status: 'Open',
        mitigationPlan: 'Implement automated quarterly backup recovery drills',
        owner: 'Operations Team',
        targetClosureDate: '2026-03-31',
      },
      {
        name: 'API Documentation Gaps',
        description: 'Missing API documentation for external integrators',
        riskType: 'Operational',
        likelihood: 2,
        impact: 2,
        status: 'Open',
        mitigationPlan: 'Complete API documentation using OpenAPI spec',
        owner: 'Documentation Team',
        targetClosureDate: '2026-02-28',
      },
      {
        name: 'Skill Gap in Cloud Technologies',
        description: 'Team lacks expertise in Kubernetes and container orchestration',
        riskType: 'Reputational',
        likelihood: 3,
        impact: 3,
        status: 'Mitigated',
        mitigationPlan: 'Provide training and hire experienced cloud engineers',
        owner: 'HR Team',
        targetClosureDate: '2026-06-30',
      },
    ];
  }

  /**
   * Create compliance requirements for testing
   */
  static createComplianceRequirements() {
    return [
      {
        name: 'GDPR Article 32 - Data Security',
        framework: 'gDPR',
        description: 'Technical and organizational measures to ensure data security',
        applicableCardTypes: ['Application', 'Database', 'API'],
        requiredControls: [
          'Data encryption at rest',
          'Data encryption in transit',
          'Access control and authentication',
          'Regular security testing',
          'Incident response procedures'
        ],
        auditFrequency: 'Annual',
      },
      {
        name: 'GDPR Article 25 - Data Protection by Design',
        framework: 'gDPR',
        description: 'Data protection measures must be implemented into the development of business processes',
        applicableCardTypes: ['Application', 'Database'],
        requiredControls: [
          'Privacy impact assessments',
          'Pseudonymization and encryption',
          'Data minimization principles',
          'Privacy by design patterns'
        ],
        auditFrequency: 'Annual',
      },
      {
        name: 'SOX Section 404 - Internal Controls',
        framework: 'sOX',
        description: 'Internal control over financial reporting requirements',
        applicableCardTypes: ['Application', 'Database', 'Infrastructure'],
        requiredControls: [
          'Change management procedures',
          'Access controls and approvals',
          'Audit trail logging',
          'Segregation of duties',
          'Regular control testing'
        ],
        auditFrequency: 'Quarterly',
      },
      {
        name: 'HIPAA Security Rule',
        framework: 'hIPAA',
        description: 'Protected health information (PHI) security requirements',
        applicableCardTypes: ['Application', 'Database', 'API'],
        requiredControls: [
          'Administrative safeguards',
          'Physical safeguards',
          'Technical safeguards',
          'Business associate agreements',
          'Security risk assessments'
        ],
        auditFrequency: 'Annual',
      },
      {
        name: 'ISO 27001 A.9 Access Control',
        framework: 'ISO27001',
        description: 'Information access control policy and procedures',
        applicableCardTypes: ['Application', 'Database', 'API', 'Infrastructure'],
        requiredControls: [
          'User access management',
          'User registration and deregistration',
          'Privileged access management',
          'Password management',
          'Review of access rights'
        ],
        auditFrequency: 'Semi-Annual',
      },
      {
        name: 'ISO 27001 A.12 Operations Security',
        framework: 'ISO27001',
        description: 'Procedures and responsibilities to ensure correct and secure operations',
        applicableCardTypes: ['Application', 'Infrastructure', 'Database'],
        requiredControls: [
          'Operating procedures documentation',
          'Change management',
          'Capacity management',
          'Backup and recovery procedures',
          'Malware protection'
        ],
        auditFrequency: 'Semi-Annual',
      },
      {
        name: 'PCI DSS Requirement 8',
        framework: 'PCI-DSS',
        description: 'Identify and authenticate access to system components',
        applicableCardTypes: ['Application', 'Database', 'API'],
        requiredControls: [
          'Multi-factor authentication',
          'Unique user IDs',
          'Strong password policies',
          'Session timeout controls',
          'Account lockout mechanisms'
        ],
        auditFrequency: 'Quarterly',
      },
    ];
  }

  /**
   * Create sample audit records
   */
  static createSampleAudits() {
    // Get dates for upcoming audits
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setDate(now.getDate() + 30);

    const twoMonths = new Date(now);
    twoMonths.setDate(now.getDate() + 60);

    const threeMonths = new Date(now);
    threeMonths.setDate(now.getDate() + 90);

    return [
      {
        title: 'Q2 2026 GDPR Compliance Audit',
        date: nextMonth.toISOString().split('T')[0],
        framework: 'gDPR',
        auditor: 'External Audit Firm LLC',
        status: 'scheduled',
        notes: 'Annual GDPR compliance assessment',
      },
      {
        title: 'ISO 27001 Surveillance Audit',
        date: twoMonths.toISOString().split('T')[0],
        framework: 'ISO27001',
        auditor: 'Certification Body Inc',
        status: 'scheduled',
        notes: 'Surveillance audit for ISO 27001 certification',
      },
      {
        title: 'SOX Compliance Review Q1 2026',
        date: threeMonths.toISOString().split('T')[0],
        framework: 'sOX',
        auditor: 'Internal Audit Team',
        status: 'scheduled',
        notes: 'Quarterly SOX internal control review',
      },
      {
        title: 'HIPAA Security Assessment 2026',
        date: nextMonth.toISOString().split('T')[0],
        framework: 'hIPAA',
        auditor: 'Healthcare Compliance Solutions',
        status: 'scheduled',
        notes: 'Annual HIPAA security rule assessment',
      },
    ];
  }
}
