import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Gerenciamento de Menu', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/menu');
    await page.waitForURL('**/menu');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página de menu com header', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Gerenciamento de Menu');
    await expect(
      page.locator('text=Crie e organize os itens do menu de navegação do site'),
    ).toBeVisible();
  });

  test('deve renderizar layout com lista e formulário', async ({ page }) => {
    // Formulário lateral
    const formSidebar = page.locator('app-menu-form');
    await expect(formSidebar).toBeVisible({ timeout: 10000 });

    // Lista de menus ou loading
    const menuList = page.locator('app-menu-list');
    const loading = page.locator('.g-loading-overlay');
    await page.waitForTimeout(2000);

    const hasMenuList = await menuList.isVisible().catch(() => false);
    const hasLoading = await loading.isVisible().catch(() => false);
    expect(hasMenuList || hasLoading).toBeTruthy();
  });

  // ─── Lista de Menus ───────────────────────────────────────────────

  test('deve carregar lista de menus após loading', async ({ page }) => {
    // Aguardar loading desaparecer
    const loading = page.locator('.g-loading-overlay');
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 15000 });
    }

    const menuList = page.locator('app-menu-list');
    await expect(menuList).toBeVisible({ timeout: 10000 });
  });

  // ─── Formulário de Menu ───────────────────────────────────────────

  test('deve exibir formulário para criação de menu', async ({ page }) => {
    const menuForm = page.locator('app-menu-form');
    await expect(menuForm).toBeVisible();
  });

  // ─── Interação com Edição ─────────────────────────────────────────

  test('deve permitir clicar em submenu para abrir modal', async ({
    page,
  }) => {
    const loading = page.locator('.g-loading-overlay');
    if (await loading.isVisible().catch(() => false)) {
      await loading.waitFor({ state: 'hidden', timeout: 15000 });
    }
    await page.waitForTimeout(2000);

    // Verificar se existe algum botão de submenu
    const submenuButtons = page.locator('button:has-text("Submenu")');
    if ((await submenuButtons.count()) > 0) {
      await submenuButtons.first().click();
      await page.waitForTimeout(500);

      // Modal de submenu deve abrir
      const modal = page.locator('modal');
      await expect(modal).toBeVisible();
      await expect(page.locator('text=Gerenciar Submenu')).toBeVisible();
    }
  });
});
