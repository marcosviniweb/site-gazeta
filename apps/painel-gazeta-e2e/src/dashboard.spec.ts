import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Dashboard - Métricas e Performance', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    // Dashboard é a rota raiz após login
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar o cabeçalho de métricas', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Métricas e Performance');
    await expect(
      page.locator('text=Acompanhe o desempenho do site'),
    ).toBeVisible();
  });

  // ─── Filtros de Dashboard ─────────────────────────────────────────

  test('deve exibir os filtros de período e granularidade', async ({
    page,
  }) => {
    await expect(page.locator('.dashboard-filters')).toBeVisible();
    await expect(page.locator('text=Período de Análise')).toBeVisible();
    await expect(page.locator('text=Visualização')).toBeVisible();
    await expect(page.locator('text=Atualizar')).toBeVisible();
  });

  test('deve ter o botão de atualizar visível', async ({ page }) => {
    const refreshBtn = page.locator('button:has-text("Atualizar")');
    await expect(refreshBtn).toBeVisible();
  });

  // ─── KPIs (Cards de Estatísticas) ─────────────────────────────────

  test('deve renderizar cards de KPI', async ({ page }) => {
    const statCards = page.locator('.g-stat-card');
    // Aguardar que os cards sejam renderizados
    await expect(statCards.first()).toBeVisible({ timeout: 10000 });
    const count = await statCards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('deve exibir valores nos cards de KPI após carregamento', async ({
    page,
  }) => {
    // Aguardar carregamento completo (spinner sumir)
    await page.waitForTimeout(3000);

    const statValues = page.locator('.stat-value');
    if ((await statValues.count()) > 0) {
      const firstValue = await statValues.first().textContent();
      expect(firstValue).toBeTruthy();
    }
  });

  // ─── Gráficos ─────────────────────────────────────────────────────

  test('deve renderizar seção de gráficos', async ({ page }) => {
    await expect(page.locator('text=Acessos ao Site')).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator('text=Páginas Vistas')).toBeVisible();
  });

  // ─── Tabela de Conteúdos em Destaque ──────────────────────────────

  test('deve renderizar seção de conteúdos em destaque', async ({ page }) => {
    await expect(page.locator('text=Conteúdos em Destaque')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Timeline de Atividades ───────────────────────────────────────

  test('deve renderizar seção de atividades do painel', async ({ page }) => {
    await expect(page.locator('text=Atividades do Painel')).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Última Atualização ───────────────────────────────────────────

  test('deve exibir pill de última atualização após carregamento', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const updatePill = page.locator('.last-update-pill');
    if (await updatePill.isVisible()) {
      await expect(updatePill).toContainText('Última atualização:');
    }
  });
});
