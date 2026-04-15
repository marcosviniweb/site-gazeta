import { test, expect } from '@playwright/test';

test.describe('Master Flow Interativo - Painel Gazeta', () => {
  // Timeout estendido para o fluxo completo com interações
  test.setTimeout(180000);

  test('Deve executar a jornada completa do usuário com interações reais', async ({
    page,
  }) => {
    
    // --- PASSO 1: AUTENTICAÇÃO ---
    await test.step('Passo 1: Autenticação', async () => {
      await page.goto('/login');
      await page.fill('#email', 'master@email.com');
      await page.fill('#password', '123456');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/');
      await expect(page.locator('h2').first()).toHaveText('Métricas e Performance');
      await page.waitForTimeout(1000);
    });

    // --- PASSO 2: DASHBOARD INTERATIVO ---
    await test.step('Passo 2: Interação no Dashboard', async () => {
      // Verifica se os cards de KPI carregaram
      const statCards = page.locator('.g-stat-card');
      await expect(statCards.first()).toBeVisible({ timeout: 10000 });
      
      // Simula interação com o botão de atualizar
      const refreshBtn = page.locator('button:has-text("Atualizar")');
      await expect(refreshBtn).toBeVisible();
      await refreshBtn.click();
      await page.waitForTimeout(1500);
    });

    // --- PASSO 3: GERENCIAMENTO DE CATEGORIAS ---
    await test.step('Passo 3: Criar e Filtrar Categorias', async () => {
      await page.click('a[href="/category"]');
      await page.waitForURL('**/category');
      
      // Preenche formulário de criação
      const timestamp = Date.now();
      const catName = `Cat Teste ${timestamp}`;
      await page.fill('#name', catName);
      await page.fill('#description', 'Descrição gerada pelo teste automatizado master');
      
      // Valida habilitação do botão
      const submitBtn = page.locator('app-category-form button[type="submit"]');
      await expect(submitBtn).toBeEnabled();
      await page.waitForTimeout(1000);

      // Simula busca na listagem
      const searchInput = page.locator('input[placeholder="Pesquisar categoria..."]');
      if (await searchInput.isVisible()) {
        await searchInput.fill('Geral');
        await page.waitForTimeout(1000);
        await searchInput.clear();
      }
      await page.waitForTimeout(1000);
    });

    // --- PASSO 4: NOTÍCIAS (FLUXO DE FORMULÁRIO) ---
    await test.step('Passo 4: Explorar Formulário de Notícias', async () => {
      await page.click('text="Notícias"');
      await page.click('a[href="/news"]');
      await page.waitForURL('**/news');

      // Testa a troca de abas (Informações -> Conteúdo -> Mídias)
      await page.click('.tab-item:has-text("Conteúdo")');
      await page.waitForTimeout(800);
      await page.click('.tab-item:has-text("Mídias")');
      await page.waitForTimeout(800);
      await page.click('.tab-item:has-text("Informações")');

      // Preenche título para ver o slug automático
      await page.fill('#title', 'Notícia Master de Teste');
      await page.press('#title', 'Tab'); // Dispara blur
      await page.waitForTimeout(500);
      
      const slug = await page.inputValue('#slug');
      expect(slug).toContain('noticia-master-de-teste');
      await page.waitForTimeout(1000);
    });

    // --- PASSO 5: NOTÍCIAS (LISTAGEM E FILTROS) ---
    await test.step('Passo 5: Filtragem e Seleção de Notícias', async () => {
      await page.click('a[href="/newsList"]');
      await page.waitForURL('**/newsList');
      await page.waitForTimeout(1500);

      // Testa seleção em massa
      const checkboxes = page.locator('.news-row input[type="checkbox"]');
      if (await checkboxes.count() > 0) {
        await checkboxes.first().check();
        await expect(page.locator('.g-bulk-actions')).toHaveClass(/active/);
        await page.waitForTimeout(1000);
        await page.click('.btn-clear');
      }
      await page.waitForTimeout(1000);
    });

    // --- PASSO 6: CONFIGURAÇÕES E NAVEGAÇÃO ---
    await test.step('Passo 6: Configurações do Sistema', async () => {
      await page.click('a[href="/config"]');
      await page.waitForURL('**/config');
      
      // Navega entre tabs de configuração
      await page.click('button.tab-button:has-text("SEO")');
      await page.waitForTimeout(800);
      await page.click('button.tab-button:has-text("Redes Sociais")');
      await page.waitForTimeout(800);
      await page.click('button.tab-button:has-text("Geral")');
      await page.waitForTimeout(1000);
    });

    // --- PASSO 7: LOGOUT FINAL ---
    await test.step('Passo 7: Logout Safira', async () => {
      const logoutBtn = page.locator('.auth_button');
      await logoutBtn.first().click();
      await page.waitForURL('**/login');
      await expect(page.locator('.login-card')).toBeVisible();
      await page.waitForTimeout(1000);
    });
  });
});
