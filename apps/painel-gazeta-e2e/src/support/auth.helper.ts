import { Page } from '@playwright/test';

/**
 * Helper de autenticação reutilizável para todos os testes E2E.
 * Realiza o login no painel e aguarda a navegação para o dashboard.
 */
export async function loginAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.waitForSelector('.login-card', { timeout: 10000 });

  await page.fill('#email', 'master@email.com');
  await page.fill('#password', '123456');
  await page.click('button[type="submit"]');

  // Aguarda o redirecionamento para o dashboard (rota raiz)
  await page.waitForURL('**/');
  await page.waitForTimeout(500);
}

/**
 * Navega para uma rota interna do painel via sidebar.
 */
export async function navigateToRoute(page: Page, route: string): Promise<void> {
  await page.goto(`/${route}`);
  await page.waitForURL(`**/${route}`);
  await page.waitForTimeout(500);
}

/**
 * Aguarda o carregamento completo de uma página (loading overlay desaparecer).
 */
export async function waitForPageLoad(page: Page): Promise<void> {
  // Aguarda spinner/loading sumir, se presente
  const loadingOverlay = page.locator('.g-loading-overlay');
  if (await loadingOverlay.isVisible().catch(() => false)) {
    await loadingOverlay.waitFor({ state: 'hidden', timeout: 15000 });
  }
}
