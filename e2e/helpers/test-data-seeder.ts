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
        initiativeType: 'Modernization',
        status: 'InProgress',
        health: 'OnTrack',
        budget: 1000000,
        startDate: '2026-01-01',
        endDate: '2026-12-31',
        progress: 45,
      },
      {
        name: 'Digital Transformation Program',
        description: 'Comprehensive digital transformation across all business units',
        initiativeType: 'Strategic',
        status: 'InProgress',
        health: 'AtRisk',
        budget: 2500000,
        startDate: '2025-06-01',
        endDate: '2027-12-31',
        progress: 30,
      },
      {
        name: 'Customer Experience Enhancement',
        description: 'Improve customer experience through better UX and personalization',
        initiativeType: 'Customer',
        status: 'Proposed',
        health: 'OnTrack',
        budget: 500000,
        startDate: '2026-03-01',
        endDate: '2026-09-30',
        progress: 0,
      },
      {
        name: 'Legacy System Modernization',
        description: 'Modernize legacy systems for better performance and maintainability',
        initiativeType: 'Modernization',
        status: 'Approved',
        health: 'Critical',
        budget: 1500000,
        startDate: '2026-02-01',
        endDate: '2027-06-30',
        progress: 15,
      },
      {
        name: 'Data Analytics Platform',
        description: 'Build comprehensive data analytics and reporting platform',
        initiativeType: 'Strategic',
        status: 'InProgress',
        health: 'OnTrack',
        budget: 800000,
        startDate: '2025-09-01',
        endDate: '2026-08-31',
        progress: 60,
      },
      {
        name: 'Security Enhancement Program',
        description: 'Enhance security posture across all systems and processes',
        initiativeType: 'Compliance',
        status: 'InProgress',
        health: 'OnTrack',
        budget: 600000,
        startDate: '2026-01-01',
        endDate: '2026-06-30',
        progress: 75,
      },
      {
        name: 'API Gateway Implementation',
        description: 'Implement centralized API gateway for all services',
        initiativeType: 'Infrastructure',
        status: 'OnHold',
        health: 'AtRisk',
        budget: 400000,
        startDate: '2026-04-01',
        endDate: '2026-10-31',
        progress: 20,
      },
      {
        name: 'Mobile Application Development',
        description: 'Develop native mobile applications for iOS and Android',
        initiativeType: 'Customer',
        status: 'Proposed',
        health: 'OnTrack',
        budget: 900000,
        startDate: '2026-05-01',
        endDate: '2026-12-31',
        progress: 0,
      },
    ];
  }
}
