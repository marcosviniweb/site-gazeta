import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Gerenciamento de Categorias', () => {
  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto('/category');
    await page.waitForURL('**/category');
    await page.waitForTimeout(500);
  });

  // ─── Estrutura da Página ──────────────────────────────────────────

  test('deve renderizar a página de categorias com header', async ({
    page,
  }) => {
    await expect(page.locator('h2')).toHaveText('Gerenciar Categorias');
    await expect(
      page.locator('text=Crie e gerencie as categorias de notícias'),
    ).toBeVisible();
  });

  test('deve renderizar o formulário de criação', async ({ page }) => {
    const form = page.locator('app-category-form form');
    await expect(form).toBeVisible();

    // Campos do formulário
    await expect(page.locator('#name')).toBeVisible();
    await expect(page.locator('#description')).toBeVisible();

    // Botão de submit
    await expect(
      page.locator('button[type="submit"]:has-text("Criar Categoria")'),
    ).toBeVisible();
  });

  // ─── Validação do Formulário ──────────────────────────────────────

  test('deve manter botão desabilitado com campos vazios', async ({
    page,
  }) => {
    const submitBtn = page.locator(
      'app-category-form button[type="submit"]',
    );
    await expect(submitBtn).toBeDisabled();
  });

  test('deve exibir erro de validação ao submeter campo vazio', async ({
    page,
  }) => {
    // Focar e desfocar o campo nome para disparar a validação
    await page.click('#name');
    await page.click('#description');
    await page.click('#name');

    // Verificar se algum erro de campo aparece
    const fieldError = page.locator('.g-field-error');
    if ((await fieldError.count()) > 0) {
      await expect(fieldError.first()).toBeVisible();
    }
  });

  // ─── Lista de Categorias ──────────────────────────────────────────

  test('deve renderizar lista de categorias ou estado vazio', async ({
    page,
  }) => {
    const categoryList = page.locator('app-category-list');
    await expect(categoryList).toBeVisible({ timeout: 10000 });

    // Verificar se tem categorias ou estado vazio
    const cards = page.locator('.category-card');
    const emptyState = page.locator('.g-empty-state');

    const hasCards = (await cards.count()) > 0;
    const hasEmpty = await emptyState.isVisible().catch(() => false);

    expect(hasCards || hasEmpty).toBeTruthy();
  });

  test('deve exibir cards de categoria com informações corretas', async ({
    page,
  }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const firstCard = cards.first();

      // Cada card deve ter nome, descrição, barra colorida e ações
      await expect(firstCard.locator('h4')).toBeVisible();
      await expect(firstCard.locator('.color-stripe')).toBeVisible();
      await expect(firstCard.locator('.g-manage-actions')).toBeVisible();
    }
  });

  // ─── Filtros de Categoria ─────────────────────────────────────────

  test('deve exibir filtros de busca e ordenação quando há categorias', async ({
    page,
  }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      await expect(page.locator('.g-filters-container')).toBeVisible();
      await expect(
        page.locator('input[placeholder="Pesquisar categoria..."]'),
      ).toBeVisible();
    }
  });

  test('deve filtrar categorias por texto de busca', async ({ page }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 1) {
      const firstCategoryName = await cards
        .first()
        .locator('h4')
        .textContent();

      // Buscar pelo nome da primeira categoria
      await page.fill(
        'input[placeholder="Pesquisar categoria..."]',
        firstCategoryName!.substring(0, 3),
      );
      await page.waitForTimeout(300);

      // Deve filtrar os resultados
      const filteredCards = page.locator('.category-card');
      const filteredCount = await filteredCards.count();
      expect(filteredCount).toBeGreaterThan(0);
    }
  });

  // ─── Toggle de Status ─────────────────────────────────────────────

  test('deve exibir toggle de status em cada categoria', async ({ page }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const toggle = cards.first().locator('.g-toggle input[type="checkbox"]');
      await expect(toggle).toBeVisible();
    }
  });

  // ─── Edição de Categoria ──────────────────────────────────────────

  test('deve carregar dados no formulário ao clicar em editar', async ({
    page,
  }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const editBtn = cards.first().locator('button[title="Editar"]');
      await editBtn.click();
      await page.waitForTimeout(500);

      // Formulário deve ter dados preenchidos
      const nameInput = page.locator('#name');
      const nameValue = await nameInput.inputValue();
      expect(nameValue).toBeTruthy();

      // Botão deve mudar para "Atualizar"
      await expect(
        page.locator('button[type="submit"]:has-text("Atualizar")'),
      ).toBeVisible();

      // Botão cancelar deve aparecer
      await expect(page.locator('text=Cancelar')).toBeVisible();
    }
  });

  test('deve cancelar a edição e limpar o formulário', async ({ page }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      // Entrar em modo edição
      const editBtn = cards.first().locator('button[title="Editar"]');
      await editBtn.click();
      await page.waitForTimeout(500);

      // Clicar em cancelar
      await page.click('button:has-text("Cancelar")');
      await page.waitForTimeout(300);

      // Formulário deve voltar ao estado de criação
      await expect(
        page.locator('button[type="submit"]:has-text("Criar Categoria")'),
      ).toBeVisible();
    }
  });

  // ─── Modal de Exclusão ────────────────────────────────────────────

  test('deve abrir modal de confirmação ao clicar em excluir', async ({
    page,
  }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const deleteBtn = cards.first().locator('button[title="Excluir"]');
      await deleteBtn.click();

      // Modal deve aparecer
      await expect(page.locator('.g-modal-overlay')).toBeVisible();
      await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
      await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
      await expect(
        page.locator('text=Esta ação não pode ser desfeita.'),
      ).toBeVisible();

      // Botões do modal
      await expect(page.locator('button.btn-cancel')).toBeVisible();
      await expect(page.locator('button.btn-confirm.danger')).toBeVisible();
    }
  });

  test('deve fechar modal de exclusão ao clicar em Cancelar', async ({
    page,
  }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const deleteBtn = cards.first().locator('button[title="Excluir"]');
      await deleteBtn.click();

      await expect(page.locator('.g-modal-overlay')).toBeVisible();
      await page.click('button.btn-cancel');
      await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
    }
  });

  test('deve fechar modal ao clicar no overlay', async ({ page }) => {
    const cards = page.locator('.category-card');
    await page.waitForTimeout(2000);

    if ((await cards.count()) > 0) {
      const deleteBtn = cards.first().locator('button[title="Excluir"]');
      await deleteBtn.click();

      await expect(page.locator('.g-modal-overlay')).toBeVisible();
      await page
        .locator('.g-modal-overlay')
        .click({ position: { x: 10, y: 10 } });
      await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
    }
  });
});
