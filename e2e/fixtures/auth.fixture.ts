import { test as base } from '@playwright/test';
import { LoginPage } from '../pages/login.page';
import { TEST_USERS } from '../helpers/constants';

/**
 * Auth Fixture Extension
 *
 * Provides authenticated test context with different user roles
 */
export const test = base.extend<{
  loginPage: LoginPage;
  authenticatedAsAdmin: { token: string; user: any };
  authenticatedAsArchitect: { token: string; user: any };
  authenticatedAsEditor: { token: string; user: any };
  authenticatedAsViewer: { token: string; user: any };
}>({
  loginPage: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    await use(loginPage);
  },

  authenticatedAsAdmin: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi(
      TEST_USERS.ADMIN.email,
      TEST_USERS.ADMIN.password
    );

    await use(authData);
  },

  authenticatedAsArchitect: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi(
      TEST_USERS.ARCHITECT.email,
      TEST_USERS.ARCHITECT.password
    );

    await use(authData);
  },

  authenticatedAsEditor: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi(
      TEST_USERS.EDITOR.email,
      TEST_USERS.EDITOR.password
    );

    await use(authData);
  },

  authenticatedAsViewer: async ({ page }, use) => {
    const loginPage = new LoginPage(page);
    const authData = await loginPage.loginViaApi(
      TEST_USERS.VIEWER.email,
      TEST_USERS.VIEWER.password
    );

    await use(authData);
  },
});

export const expect = test.expect;
