import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Anúncios - Página de Criação', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/ads');
    await page.waitForURL('**/ads');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página de anúncios com header', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Gerenciar Anúncios');
    await expect(
      page.locator('text=Crie e edite seus anúncios'),
    ).toBeVisible();
  });

  test('deve renderizar componente de formulário de anúncio', async ({
    page,
  }) => {
    const adsForm = page.locator('app-ads-form');
    await expect(adsForm).toBeVisible();
  });
});

test.describe('Anúncios - Lista', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/adsList');
    await page.waitForURL('**/adsList');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página com header e botão de criação', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Lista de Anúncios');
    await expect(
      page.locator('text=Gerencie todos os anúncios cadastrados'),
    ).toBeVisible();
    await expect(page.locator('a:has-text("Criar Anúncio")')).toBeVisible();
  });

  // ─── Filtros ──────────────────────────────────────────────────────

  test('deve renderizar componente de filtros', async ({ page }) => {
    const filters = page.locator('app-ads-list-filters');
    await expect(filters).toBeVisible({ timeout: 10000 });
  });

  // ─── Cabeçalho da Lista ───────────────────────────────────────────

  test('deve renderizar cabeçalhos da tabela de anúncios', async ({
    page,
  }) => {
    const header = page.locator('.ads-list-header');
    await expect(header).toBeVisible();
    await expect(header.locator('text=Status')).toBeVisible();
    await expect(header.locator('text=Banner')).toBeVisible();
    await expect(header.locator('text=Conteúdo')).toBeVisible();
    await expect(header.locator('text=Metadados')).toBeVisible();
    await expect(header.locator('text=Ações')).toBeVisible();
  });

  // ─── Lista de Dados ───────────────────────────────────────────────

  test('deve carregar lista de anúncios ou mensagem vazia', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const adsRows = page.locator('.ads-row');
    const emptyState = page.locator('.ads-empty');

    const hasRows = (await adsRows.count()) > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('deve exibir informações em cada anúncio', async ({ page }) => {
    await page.waitForTimeout(3000);
    const adsRows = page.locator('.ads-row');

    if ((await adsRows.count()) > 0) {
      const firstRow = adsRows.first();

      // Título
      await expect(firstRow.locator('.title')).toBeVisible();
      // Indicador de status
      await expect(firstRow.locator('.status-indicator')).toBeVisible();
      // Metadados (posição, página, prioridade)
      await expect(firstRow.locator('.ads-meta')).toBeVisible();
      // Ações (ativar/desativar, configurações, deletar)
      await expect(firstRow.locator('.g-cell-actions')).toBeVisible();
    }
  });

  test('deve exibir metadados detalhados (posição, página, prioridade)', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const adsRows = page.locator('.ads-row');

    if ((await adsRows.count()) > 0) {
      const meta = adsRows.first().locator('.ads-meta');
      await expect(meta.locator('text=Posição:')).toBeVisible();
      await expect(meta.locator('text=Página:')).toBeVisible();
      await expect(meta.locator('text=Prioridade:')).toBeVisible();
    }
  });

  // ─── Seleção em Massa ─────────────────────────────────────────────

  test('deve exibir ações em massa ao selecionar anúncios', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const checkboxes = page.locator('.ads-row input[type="checkbox"]');

    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(300);

      const bulkActions = page.locator('.g-bulk-actions');
      await expect(bulkActions).toHaveClass(/active/);
    }
  });

  // ─── Paginação ────────────────────────────────────────────────────

  test('deve renderizar controles de paginação', async ({ page }) => {
    const pagination = page.locator('.g-pagination');
    await expect(pagination).toBeVisible();
  });

  // ─── Link de Criação ──────────────────────────────────────────────

  test('deve navegar para criação ao clicar em "Criar Anúncio"', async ({
    page,
  }) => {
    await page.click('a:has-text("Criar Anúncio")');
    await page.waitForURL('**/ads');
    await expect(page).toHaveURL(/\/ads$/);
  });

  // ─── Modal de Exclusão ────────────────────────────────────────────

  test('deve abrir modal de exclusão ao clicar em delete', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const deleteButtons = page.locator('.btn-delete');

    if ((await deleteButtons.count()) > 0) {
      await deleteButtons.first().click();

      await expect(page.locator('.g-modal-overlay')).toBeVisible();
      await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
    }
  });

  test('deve fechar modal de exclusão ao cancelar', async ({ page }) => {
    await page.waitForTimeout(3000);
    const deleteButtons = page.locator('.btn-delete');

    if ((await deleteButtons.count()) > 0) {
      await deleteButtons.first().click();
      await expect(page.locator('.g-modal-overlay')).toBeVisible();
      await page.click('button.btn-cancel');
      await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
    }
  });

  // ─── Seleção Total ────────────────────────────────────────────────

  test('deve selecionar/desselecionar todos os anúncios', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const adsRows = page.locator('.ads-row');

    if ((await adsRows.count()) > 0) {
      const selectAllCheckbox = page.locator(
        '.ads-list-header input[type="checkbox"]',
      );
      await selectAllCheckbox.check();
      await page.waitForTimeout(300);

      const bulkActions = page.locator('.g-bulk-actions');
      await expect(bulkActions).toHaveClass(/active/);

      await selectAllCheckbox.uncheck();
      await page.waitForTimeout(300);
      await expect(bulkActions).not.toHaveClass(/active/);
    }
  });
});
