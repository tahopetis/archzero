import { APIRequestContext, expect } from '@playwright/test';
import { API_URL } from './constants';

/**
 * Test Data Cleanup Utilities
 *
 * Provides functions to clean up test data created during E2E tests.
 * This prevents test data from accumulating and causing conflicts.
 */

export interface CreatedResource {
  type: 'card' | 'principle' | 'standard' | 'policy' | 'exception' | 'initiative' | 'risk' | 'compliance';
  id: string;
  name?: string;
}

/**
 * Cleanup test data by ID for a specific resource type
 */
export async function cleanupResourceById(
  request: APIRequestContext,
  type: CreatedResource['type'],
  id: string
): Promise<boolean> {
  try {
    let endpoint = '';

    switch (type) {
      case 'card':
        endpoint = `/api/v1/cards/${id}`;
        break;
      case 'principle':
        endpoint = `/api/v1/principles/${id}`;
        break;
      case 'standard':
        endpoint = `/api/v1/standards/${id}`;
        break;
      case 'policy':
        endpoint = `/api/v1/policies/${id}`;
        break;
      case 'exception':
        endpoint = `/api/v1/exceptions/${id}`;
        break;
      case 'initiative':
        endpoint = `/api/v1/initiatives/${id}`;
        break;
      case 'risk':
        endpoint = `/api/v1/risks/${id}`;
        break;
      case 'compliance':
        endpoint = `/api/v1/compliance-requirements/${id}`;
        break;
      default:
        console.warn(`Unknown resource type: ${type}`);
        return false;
    }

    const response = await request.delete(endpoint);

    if (response.ok() || response.status() === 404) {
      console.log(`✅ Cleaned up ${type} with ID: ${id}`);
      return true;
    } else {
      console.warn(`⚠️  Failed to cleanup ${type} ${id}: ${response.status()}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error cleaning up ${type} ${id}:`, error);
    return false;
  }
}

/**
 * Cleanup multiple resources
 */
export async function cleanupResources(
  request: APIRequestContext,
  resources: CreatedResource[]
): Promise<void> {
  console.log(`🧹 Cleaning up ${resources.length} test resources...`);

  const cleanupPromises = resources.map(resource =>
    cleanupResourceById(request, resource.type, resource.id)
  );

  const results = await Promise.all(cleanupPromises);
  const successCount = results.filter(r => r).length;
  const failCount = results.length - successCount;

  console.log(`✅ Cleanup complete: ${successCount} succeeded, ${failCount} failed`);
}

/**
 * Cleanup all cards created during a test
 */
export async function cleanupCards(
  request: APIRequestContext,
  cardIds: string[]
): Promise<void> {
  console.log(`🧹 Cleaning up ${cardIds.length} cards...`);

  for (const id of cardIds) {
    try {
      const response = await request.delete(`${API_URL}/api/v1/cards/${id}`);
      if (response.ok()) {
        console.log(`✅ Deleted card ${id}`);
      } else if (response.status() === 404) {
        console.warn(`⚠️  Card ${id} not found (may have been deleted already)`);
      } else {
        console.error(`❌ Failed to delete card ${id}: ${response.status()}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting card ${id}:`, error);
    }
  }
}

/**
 * Cleanup all governance entities of a specific type
 */
export async function cleanupGovernanceEntities(
  request: APIRequestContext,
  entityType: 'principles' | 'standards' | 'policies' | 'exceptions' | 'initiatives' | 'risks' | 'compliance',
  entityIds: string[]
): Promise<void> {
  console.log(`🧹 Cleaning up ${entityIds.length} ${entityType}...`);

  for (const id of entityIds) {
    try {
      const endpoint = `/api/v1/${entityType}/${id}`;
      const response = await request.delete(endpoint);

      if (response.ok()) {
        console.log(`✅ Deleted ${entityType.slice(0, -1)} ${id}`);
      } else if (response.status() === 404) {
        console.warn(`⚠️  ${entityType.slice(0, -1)} ${id} not found`);
      } else {
        console.error(`❌ Failed to delete ${entityType.slice(0, -1)} ${id}: ${response.status()}`);
      }
    } catch (error) {
      console.error(`❌ Error deleting ${entityType.slice(0, -1)} ${id}:`, error);
    }
  }
}

/**
 * Test cleanup tracker - use in test.beforeEach and test.afterEach
 *
 * Example usage:
 *
 * test.beforeEach(async ({ request }) => {
 *   testContext.cleanupIds = [];
 * });
 *
 * test.afterEach(async ({ request }) => {
 *   await cleanupTestData(request, testContext.cleanupIds);
 * });
 */
export interface TestContext {
  cleanupIds: CreatedResource[];
}

/**
 * Cleanup test data created during a test
 * Call this in test.afterEach hooks
 */
export async function cleanupTestData(
  request: APIRequestContext,
  createdResources: CreatedResource[]
): Promise<void> {
  if (!createdResources || createdResources.length === 0) {
    console.log('✨ No test data to cleanup');
    return;
  }

  console.log(`🧹 Cleaning up ${createdResources.length} test resources...`);

  // Group by resource type for more efficient cleanup
  const grouped = createdResources.reduce((acc, resource) => {
    if (!acc[resource.type]) {
      acc[resource.type] = [];
    }
    acc[resource.type].push(resource);
    return acc;
  }, {} as Record<string, CreatedResource[]>);

  // Cleanup each type
  for (const [type, resources] of Object.entries(grouped)) {
    await cleanupResources(request, resources);
  }
}

/**
 * Verify cleanup was successful
 * Can be used in test.afterEach to ensure cleanup worked
 */
export async function verifyCleanup(
  request: APIRequestContext,
  resources: CreatedResource[]
): Promise<void> {
  for (const resource of resources) {
    let endpoint = '';

    switch (resource.type) {
      case 'card':
        endpoint = `/api/v1/cards/${resource.id}`;
        break;
      case 'principle':
        endpoint = `/api/v1/principles/${resource.id}`;
        break;
      case 'standard':
        endpoint = `/api/v1/standards/${resource.id}`;
        break;
      case 'policy':
        endpoint = `/api/v1/policies/${resource.id}`;
        break;
      case 'exception':
        endpoint = `/api/v1/exceptions/${resource.id}`;
        break;
      case 'initiative':
        endpoint = `/api/v1/initiatives/${resource.id}`;
        break;
      case 'risk':
        endpoint = `/api/v1/risks/${resource.id}`;
        break;
      case 'compliance':
        endpoint = `/api/v1/compliance-requirements/${resource.id}`;
        break;
    }

    const response = await request.get(endpoint);
    // Resource should either be deleted (404) or we should have access
    if (response.status() === 404) {
      console.log(`✅ Verified ${resource.type} ${resource.id} was deleted`);
    } else if (response.status() === 403 || response.status() === 401) {
      console.warn(`⚠️  Cannot verify ${resource.type} ${resource.id}: access denied`);
    }
  }
}
