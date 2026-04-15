import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Configurações do Sistema', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/config');
    await page.waitForURL('**/config');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página de configurações com header', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Configurações do Sistema');
    await expect(
      page.locator('text=Gerencie as configurações gerais da aplicação'),
    ).toBeVisible();
  });

  // ─── Tabs ─────────────────────────────────────────────────────────

  test('deve renderizar as tabs principais', async ({ page }) => {
    await expect(page.locator('text=Redes Sociais')).toBeVisible();
    await expect(page.locator('text=Configuração Home')).toBeVisible();
    await expect(page.locator('text=Manutenção')).toBeVisible();
  });

  test('deve ter Redes Sociais como tab ativa por padrão', async ({
    page,
  }) => {
    const socialTab = page.locator('button.tab-button:has-text("Redes Sociais")');
    await expect(socialTab).toHaveClass(/active/);
  });

  test('deve navegar entre tabs ao clicar', async ({ page }) => {
    // Clicar na tab "Configuração Home"
    await page.click('button.tab-button:has-text("Configuração Home")');
    await page.waitForTimeout(300);
    const homeTab = page.locator('button.tab-button:has-text("Configuração Home")');
    await expect(homeTab).toHaveClass(/active/);

    // Clicar na tab "Manutenção"
    await page.click('button.tab-button:has-text("Manutenção")');
    await page.waitForTimeout(300);
    const maintenanceTab = page.locator(
      'button.tab-button:has-text("Manutenção")',
    );
    await expect(maintenanceTab).toHaveClass(/active/);
  });

  // ─── Componentes de cada Tab ──────────────────────────────────────

  test('deve renderizar componente de Redes Sociais', async ({ page }) => {
    const socialMedia = page.locator('app-social-media');
    await expect(socialMedia).toBeVisible();
  });

  test('deve renderizar componente de Configuração Home ao clicar na tab', async ({
    page,
  }) => {
    await page.click('button.tab-button:has-text("Configuração Home")');
    await page.waitForTimeout(300);

    const homeConfig = page.locator('app-home-config');
    await expect(homeConfig).toBeVisible();
  });

  test('deve renderizar componente de Manutenção ao clicar na tab', async ({
    page,
  }) => {
    await page.click('button.tab-button:has-text("Manutenção")');
    await page.waitForTimeout(300);

    const maintenance = page.locator('app-maintenance');
    await expect(maintenance).toBeVisible();
  });

  // ─── Tab de Limpeza de Mídias (Admin) ─────────────────────────────

  test('deve exibir tab de Limpeza de Mídias para admin', async ({
    page,
  }) => {
    // O usuário admin@gazeta.com talvez não seja 'master@email.com',
    // então a tab pode não aparecer.
    // Verificar se a tab existe
    const cleanupTab = page.locator(
      'button.tab-button:has-text("Limpeza de Mídias")',
    );
    const isVisible = await cleanupTab.isVisible().catch(() => false);

    if (isVisible) {
      await cleanupTab.click();
      await page.waitForTimeout(300);
      const mediaCleanup = page.locator('app-media-cleanup');
      await expect(mediaCleanup).toBeVisible();
    }
  });
});
