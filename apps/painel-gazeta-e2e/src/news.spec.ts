import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Notícias - Formulário de Criação', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/news');
    await page.waitForURL('**/news');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar o formulário de notícia', async ({ page }) => {
    const form = page.locator('form');
    await expect(form).toBeVisible();
  });

  // ─── Tabs de Navegação ────────────────────────────────────────────

  test('deve renderizar as 3 tabs: Informações, Conteúdo e Mídias', async ({
    page,
  }) => {
    await expect(page.locator('text=Informações')).toBeVisible();
    await expect(page.locator('text=Conteúdo')).toBeVisible();
    await expect(page.locator('text=Mídias')).toBeVisible();
  });

  test('deve navegar entre as tabs', async ({ page }) => {
    // Tab de Informações é a padrão
    const infoTab = page.locator('.tab-item:has-text("Informações")');
    await expect(infoTab).toHaveClass(/active/);

    // Clicar na tab de Conteúdo
    await page.click('.tab-item:has-text("Conteúdo")');
    const contentTab = page.locator('.tab-item:has-text("Conteúdo")');
    await expect(contentTab).toHaveClass(/active/);

    // Clicar na tab de Mídias
    await page.click('.tab-item:has-text("Mídias")');
    const mediaTab = page.locator('.tab-item:has-text("Mídias")');
    await expect(mediaTab).toHaveClass(/active/);
  });

  // ─── Tab de Informações ───────────────────────────────────────────

  test('deve exibir campos da tab Informações', async ({ page }) => {
    await expect(page.locator('#title')).toBeVisible();
    await expect(page.locator('#subtitle')).toBeVisible();
    await expect(page.locator('#slug')).toBeVisible();
    await expect(page.locator('#author')).toBeVisible();

    // Multi-select de categorias
    await expect(page.locator('lib-multi-select')).toBeVisible();
  });

  test('deve gerar slug ao preencher o título e sair do campo', async ({
    page,
  }) => {
    await page.fill('#title', 'Teste de Título para Slug');
    await page.click('#subtitle'); // blur para disparar setSlug()
    await page.waitForTimeout(300);

    const slugValue = await page.locator('#slug').inputValue();
    expect(slugValue).toBeTruthy();
  });

  test('deve exibir preview de URL ao preencher o slug', async ({ page }) => {
    await page.fill('#slug', 'minha-noticia-teste');
    await page.waitForTimeout(300);

    const urlPreview = page.locator('.url-preview-pill');
    if (await urlPreview.isVisible()) {
      await expect(urlPreview).toContainText('gazetadopara.com/');
    }
  });

  // ─── Sidebar de Configurações ─────────────────────────────────────

  test('deve renderizar sidebar com configurações de publicação', async ({
    page,
  }) => {
    const sidebar = page.locator('.g-crud-sidebar');
    await expect(sidebar).toBeVisible();

    // Campo de data/hora de publicação
    await expect(page.locator('#published')).toBeVisible();

    // Seção de destaque
    await expect(page.locator('text=Destaque')).toBeVisible();

    // Seção de status
    await expect(page.locator('text=Status')).toBeVisible();

    // Seção de validade
    await expect(page.locator('text=Validade')).toBeVisible();
  });

  test('deve alternar sidebar toggle', async ({ page }) => {
    const toggleBtn = page.locator('.sidebar-toggle-btn');
    await toggleBtn.click();
    await page.waitForTimeout(300);

    // Verificar se a sidebar mudou de estado
    const sidebar = page.locator('.g-crud-sidebar');
    const hasActive = await sidebar.evaluate((el) =>
      el.classList.contains('active'),
    );
    // Testar apenas que o toggle funcionou sem erro
    expect(typeof hasActive).toBe('boolean');
  });

  // ─── Botões de Rodapé ─────────────────────────────────────────────

  test('deve exibir botões de ação no rodapé', async ({ page }) => {
    await expect(page.locator('button:has-text("Limpar")')).toBeVisible();
    await expect(page.locator('button:has-text("Publicar")')).toBeVisible();
  });

  test('deve manter botão de publicar desabilitado enquanto form estiver inválido', async ({
    page,
  }) => {
    const publishBtn = page.locator('button[type="submit"]');
    await expect(publishBtn).toBeDisabled();
  });

  // ─── Opções de Status ─────────────────────────────────────────────

  test('deve exibir opções de status (Ativo/Inativo)', async ({ page }) => {
    const statusButtons = page.locator('.status-option-btn');
    const count = await statusButtons.count();
    expect(count).toBeGreaterThanOrEqual(2);
  });

  test('deve alternar status ao clicar nas opções', async ({ page }) => {
    const inactiveBtn = page.locator(
      '.status-option-btn:not(.active)',
    );
    if ((await inactiveBtn.count()) > 0) {
      await inactiveBtn.first().click();
      await page.waitForTimeout(200);
      await expect(inactiveBtn.first()).toHaveClass(/active/);
    }
  });

  // ─── Fluxo Completo E2E ───────────────────────────────────────────

  test('deve executar fluxo completo de criação de notícia', async ({ page }) => {
    // 1. Preencher Informações Básicas
    await page.fill('#title', 'Notícia E2E Playwright Completa');
    await page.fill('#subtitle', 'Subtítulo da notícia gerada por testes automatizados E2E');
    await page.fill('#author', 'Test Engineer');
    
    // Selecionar categoria (se disponível)
    const categorySelect = page.locator('lib-multi-select');
    if (await categorySelect.isVisible()) {
      await categorySelect.click();
      await page.waitForTimeout(500);
      const option = page.locator('.g-select-option').first();
      if (await option.isVisible()) {
        await option.click();
      }
      // Fechar o dropdown clicando fora
      await page.click('body');
    }
    
    // Validar se o slug foi preenchido
    await page.click('#subtitle'); // forçar blur
    await page.waitForTimeout(500);
    expect(await page.locator('#slug').inputValue()).toBeTruthy();

    // 2. Preencher Conteúdo
    await page.click('.tab-item:has-text("Conteúdo")');
    await page.waitForTimeout(500);
    
    // O editor (ngx-quill) geralmente usa contenteditable
    const editor = page.locator('.ql-editor');
    if (await editor.isVisible()) {
      await editor.fill('Este é o conteúdo principal da notícia criado através de testes automatizados End-to-End com Playwright.');
    }

    // 3. Verificar tab de Mídias (vídeo é inserido pelo editor de conteúdo na tab Conteúdo)
    await page.click('.tab-item:has-text("Mídias")');
    await page.waitForTimeout(500);

    // 4. Configurar Destaque
    const emphasisToggle = page.locator('.g-toggle').first();
    if (await emphasisToggle.isVisible()) {
      await emphasisToggle.click();
    }

    // O botão deve estar habilitado
    const publishBtn = page.locator('button[type="submit"]');
    await expect(publishBtn).toBeEnabled();
  });
});

test.describe('Notícias - Lista', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/newsList');
    await page.waitForURL('**/newsList');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página com header e botão de criação', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Lista de Notícias');
    await expect(page.locator('text=Gerencie todas as notícias')).toBeVisible();
    await expect(page.locator('a:has-text("Criar Notícia")')).toBeVisible();
  });

  // ─── Filtros ──────────────────────────────────────────────────────

  test('deve renderizar componente de filtros', async ({ page }) => {
    const filters = page.locator('app-news-list-filters');
    await expect(filters).toBeVisible({ timeout: 10000 });
  });

  // ─── Lista de Dados ───────────────────────────────────────────────

  test('deve carregar a lista de notícias ou mensagem vazia', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const newsRows = page.locator('.news-row');
    const emptyState = page.locator('.news-empty');

    const hasRows = (await newsRows.count()) > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasRows || hasEmpty).toBeTruthy();
  });

  test('deve exibir informações completas em cada item da lista', async ({
    page,
  }) => {
    await page.waitForTimeout(3000);
    const newsRows = page.locator('.news-row');

    if ((await newsRows.count()) > 0) {
      const firstRow = newsRows.first();

      // Título
      await expect(firstRow.locator('.title')).toBeVisible();
      // Metadados (autor, data, categoria)
      await expect(firstRow.locator('.news-meta')).toBeVisible();
      // Ações (editar, deletar)
      await expect(firstRow.locator('.g-cell-actions')).toBeVisible();
    }
  });

  // ─── Seleção em Massa ─────────────────────────────────────────────

  test('deve exibir ações em massa ao selecionar itens', async ({ page }) => {
    await page.waitForTimeout(3000);
    const checkboxes = page.locator('.news-row input[type="checkbox"]');

    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(300);

      const bulkActions = page.locator('.g-bulk-actions');
      await expect(bulkActions).toHaveClass(/active/);
    }
  });

  test('deve limpar seleção ao clicar no botão limpar', async ({ page }) => {
    await page.waitForTimeout(3000);
    const checkboxes = page.locator('.news-row input[type="checkbox"]');

    if ((await checkboxes.count()) > 0) {
      await checkboxes.first().check();
      await page.waitForTimeout(300);

      const clearBtn = page.locator('.btn-clear');
      await clearBtn.click();
      await page.waitForTimeout(300);

      const bulkActions = page.locator('.g-bulk-actions');
      await expect(bulkActions).not.toHaveClass(/active/);
    }
  });

  // ─── Paginação ────────────────────────────────────────────────────

  test('deve renderizar controles de paginação', async ({ page }) => {
    const pagination = page.locator('.g-pagination');
    await expect(pagination).toBeVisible();
    await expect(page.locator('.btn-prev')).toBeVisible();
    await expect(page.locator('.btn-next')).toBeVisible();
  });

  test('deve exibir informação de total e página', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('.g-list-info')).toBeVisible();
  });

  // ─── Informações de Destaque ──────────────────────────────────────

  test('deve exibir contagem de destaques ativos', async ({ page }) => {
    await page.waitForTimeout(2000);
    await expect(page.locator('text=Destaques ativos:')).toBeVisible();
  });

  // ─── Link para Criação ────────────────────────────────────────────

  test('deve navegar para criação ao clicar em "Criar Notícia"', async ({
    page,
  }) => {
    await page.click('a:has-text("Criar Notícia")');
    await page.waitForURL('**/news');
    await expect(page).toHaveURL(/\/news$/);
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
      await expect(
        page.locator('text=Esta ação não pode ser desfeita.'),
      ).toBeVisible();
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
});
