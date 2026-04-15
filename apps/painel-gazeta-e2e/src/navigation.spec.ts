import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Navegação e Sidebar', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  // ─── Estrutura da Sidebar ─────────────────────────────────────────

  test('deve renderizar a sidebar com todos os itens de menu', async ({
    page,
  }) => {
    const sidebar = page.locator('lib-sidebar.desktop');
    await expect(sidebar).toBeVisible();

    // Verificar itens do menu principal
    await expect(sidebar.locator('text=Metricas')).toBeVisible();
    await expect(sidebar.locator('text=Menu')).toBeVisible();
    await expect(sidebar.locator('text=Categorias')).toBeVisible();
    await expect(sidebar.locator('text=Notícias')).toBeVisible();
    await expect(sidebar.locator('text=Vídeos')).toBeVisible();
    await expect(sidebar.locator('text=Anúncios')).toBeVisible();
    await expect(sidebar.locator('text=Configurações')).toBeVisible();
  });

  test('deve exibir botão de logout', async ({ page }) => {
    const logoutBtn = page.locator('button.auth_button');
    await expect(logoutBtn.first()).toBeVisible();
    await expect(logoutBtn.first()).toHaveText('sair');
  });

  // ─── Navegação entre Páginas ──────────────────────────────────────

  test('deve navegar para a página de Categorias', async ({ page }) => {
    await page.click('a[href="/category"]');
    await page.waitForURL('**/category');
    await expect(page.locator('h2')).toHaveText('Gerenciar Categorias');
  });

  test('deve navegar para a página de Menu', async ({ page }) => {
    await page.click('a[href="/menu"]');
    await page.waitForURL('**/menu');
    await expect(page.locator('h2')).toHaveText('Gerenciamento de Menu');
  });

  test('deve navegar para a página de Configurações', async ({ page }) => {
    await page.click('a[href="/config"]');
    await page.waitForURL('**/config');
    await expect(page.locator('h2')).toHaveText('Configurações do Sistema');
  });

  // ─── Dashboard (Métricas) ─────────────────────────────────────────

  test('deve carregar o dashboard como página inicial', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Métricas e Performance');
  });

  // ─── Submenus ─────────────────────────────────────────────────────

  test('deve navegar para criação de notícia', async ({ page }) => {
    await page.goto('/news');
    await page.waitForURL('**/news');
    await expect(page.locator('h2')).toContainText(/Criar Notícia|Nova Notícia/i);
  });

  test('deve navegar para lista de notícias', async ({ page }) => {
    await page.goto('/newsList');
    await page.waitForURL('**/newsList');
    await expect(page.locator('h2')).toHaveText('Lista de Notícias');
  });

  test('deve navegar para upload de vídeo', async ({ page }) => {
    await page.goto('/videos');
    await page.waitForURL('**/videos');
    await expect(page.locator('h2')).toHaveText('Gerenciar Vídeos');
  });

  test('deve navegar para lista de vídeos', async ({ page }) => {
    await page.goto('/videosList');
    await page.waitForURL('**/videosList');
    await expect(page.locator('h2')).toHaveText('Lista de Vídeos');
  });

  test('deve navegar para criação de anúncio', async ({ page }) => {
    await page.goto('/ads');
    await page.waitForURL('**/ads');
    await expect(page.locator('h2')).toHaveText('Gerenciar Anúncios');
  });

  test('deve navegar para lista de anúncios', async ({ page }) => {
    await page.goto('/adsList');
    await page.waitForURL('**/adsList');
    await expect(page.locator('h2')).toHaveText('Lista de Anúncios');
  });
});
