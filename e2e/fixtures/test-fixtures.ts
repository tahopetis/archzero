import { test as base } from '@playwright/test';

/**
 * Test setup to reset database state before each test
 */
export const test = base.extend({
  // Reset database state before each test
  beforeEach: async ({}, testInfo) => {
    // Reset failed login attempts for all users
    // This ensures tests don't interfere with each other
    await fetch('http://localhost:3000/api/v1/test/reset-auth-state', {
      method: 'POST',
    }).catch(() => {
      // Ignore if endpoint doesn't exist yet
      console.warn('Test reset endpoint not available - skipping database reset');
    });
  },
});
