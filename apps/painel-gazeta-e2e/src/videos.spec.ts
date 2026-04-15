import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Vídeos - Página de Upload', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/videos');
    await page.waitForURL('**/videos');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página de vídeos com header', async ({ page }) => {
    await expect(page.locator('h2')).toHaveText('Gerenciar Vídeos');
    await expect(
      page.locator('text=Faça upload e edite seus vídeos'),
    ).toBeVisible();
  });

  test('deve renderizar componente de upload de vídeo', async ({ page }) => {
    const videoUpload = page.locator('app-video-upload');
    await expect(videoUpload).toBeVisible();
  });
});

test.describe('Vídeos - Lista', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/videosList');
    await page.waitForURL('**/videosList');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página com header e botão de criação', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Lista de Vídeos');
    await expect(
      page.locator('text=Gerencie todos os vídeos cadastrados'),
    ).toBeVisible();
    await expect(page.locator('a:has-text("Criar Vídeo")')).toBeVisible();
  });

  // ─── Filtros ──────────────────────────────────────────────────────

  test('deve renderizar componente de filtros', async ({ page }) => {
    const filters = page.locator('app-video-list-filters');
    await expect(filters).toBeVisible({ timeout: 10000 });
  });

  // ─── Lista de Dados ───────────────────────────────────────────────

  test('deve carregar a lista de vídeos ou mensagem vazia', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const videoRows = page.locator('.video-row');
    const emptyState = page.locator('.video-empty');

    const hasRows = (await videoRows.count()) > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('deve exibir título e metadados em cada vídeo', async ({ page }) => {
    await page.waitForTimeout(3000);
    const videoRows = page.locator('.video-row');

    if ((await videoRows.count()) > 0) {
      const firstRow = videoRows.first();

      // Título
      await expect(firstRow.locator('.title')).toBeVisible();
      // Thumbnail ou placeholder
      await expect(firstRow.locator('.g-cell-image')).toBeVisible();
      // Ações
      await expect(firstRow.locator('.g-cell-actions')).toBeVisible();
    }
  });

  // ─── Seleção em Massa ─────────────────────────────────────────────

  test('deve exibir ações em massa ao selecionar vídeos', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const checkboxes = page.locator('.video-row input[type="checkbox"]');

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

  // ─── Informações Gerais ───────────────────────────────────────────

  test('deve exibir contagem total e destaques', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Total encontrado:')).toBeVisible();
    await expect(page.locator('text=Destaques ativos:')).toBeVisible();
  });

  // ─── Link de Criação ──────────────────────────────────────────────

  test('deve navegar para upload ao clicar em "Criar Vídeo"', async ({
    page,
  }) => {
    await page.click('a:has-text("Criar Vídeo")');
    await page.waitForURL('**/videos');
    await expect(page).toHaveURL(/\/videos$/);
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

  test('deve selecionar/desselecionar todos os vídeos', async ({ page }) => {
    await page.waitForTimeout(3000);
    const videoRows = page.locator('.video-row');

    if ((await videoRows.count()) > 0) {
      // Selecionar todos via checkbox do header
      const selectAllCheckbox = page.locator(
        '.video-list-header input[type="checkbox"]',
      );
      await selectAllCheckbox.check();
      await page.waitForTimeout(300);

      const bulkActions = page.locator('.g-bulk-actions');
      await expect(bulkActions).toHaveClass(/active/);

      // Desselecionar todos
      await selectAllCheckbox.uncheck();
      await page.waitForTimeout(300);
      await expect(bulkActions).not.toHaveClass(/active/);
    }
  });
});
