import { test, expect } from '@playwright/test';
import { loginAsAdmin } from './support/auth.helper';

test.describe('Ciclo de Vida CRUD Completo (C.R.U.D)', () => {
  // Timeout estendido para o ciclo completo (Ação pesada)
  test.setTimeout(300000);

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  const timestamp = Date.now();
  const catInitialName = `Cat Inicial ${timestamp}`;
  const catEditedName = `Cat Editada ${timestamp}`;
  
  const menuInitialName = `Menu Inicial ${timestamp}`;
  const menuEditedName = `Menu Editado ${timestamp}`;
  
  const newsInitialTitle = `Notícia Inicial ${timestamp}`;
  const newsEditedTitle = `Notícia Editada ${timestamp}`;
  
  const adInitialTitle = `Ads Inicial ${timestamp}`;
  const adEditedTitle = `Ads Editado ${timestamp}`;

  test('Deve criar, editar e excluir Categorias, Menus, Notícias e Anúncios', async ({ page }) => {
    
    // --- 1. CATEGORIAS ---
    await test.step('CRUD Categorias', async () => {
      await page.goto('/category');
      
      // CREATE
      await page.fill('#name', catInitialName);
      await page.fill('#description', 'Descrição Inicial');
      await page.click('button[type="submit"]:has-text("Criar Categoria")');
      await expect(page.locator('.category-card h4', { hasText: catInitialName })).toBeVisible();

      // UPDATE
      const card = page.locator('.category-card', { hasText: catInitialName });
      await card.locator('button[title="Editar"]').click();
      await page.fill('#name', catEditedName);
      await page.click('button[type="submit"]:has-text("Atualizar")');
      await expect(page.locator('.category-card h4', { hasText: catEditedName })).toBeVisible();

      // DELETE
      const editedCard = page.locator('.category-card', { hasText: catEditedName });
      await editedCard.locator('button[title="Excluir"]').click();
      await page.click('.btn-confirm.danger');
      await expect(page.locator('.category-card h4', { hasText: catEditedName })).not.toBeVisible();
    });

    // --- 2. MENUS ---
    await test.step('CRUD Menus', async () => {
      await page.goto('/menu');
      await page.waitForTimeout(1000);
      
      // CREATE
      await page.selectOption('#type', 'external');
      await page.fill('#name', menuInitialName);
      await page.fill('#externalLink', 'https://inicial.com');
      await page.fill('#order', '1');
      await page.click('button[type="submit"]:has-text("Criar Menu")');
      await page.waitForTimeout(1000);
      await expect(page.locator('.menu-item-row .name', { hasText: menuInitialName })).toBeVisible();

      // UPDATE
      const menuRow = page.locator('.menu-item-row', { hasText: menuInitialName });
      await menuRow.locator('.edit').click();
      await page.fill('#name', menuEditedName);
      await page.fill('#externalLink', 'https://editado.com');
      await page.click('button[type="submit"]:has-text("Salvar Alterações")');
      await page.waitForTimeout(1000);
      await expect(page.locator('.menu-item-row .name', { hasText: menuEditedName })).toBeVisible();

      // DELETE
      const editedMenuRow = page.locator('.menu-item-row', { hasText: menuEditedName });
      await editedMenuRow.locator('.delete').click();
      await page.click('.btn-confirm.danger');
      await page.waitForTimeout(1000);
      await expect(page.locator('.menu-item-row .name', { hasText: menuEditedName })).not.toBeVisible();
    });

    // --- 3. NOTÍCIAS (COM UPLOAD) ---
    await test.step('CRUD Notícias', async () => {
      // CREATE
      await page.goto('/news');
      await page.fill('#title', newsInitialTitle);
      await page.fill('#author', 'Autor Inicial');
      
      // Upload na criação
      await page.click('.tab-item:has-text("Mídias")');
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('D:\\CDN linkedin\\page 1.png');
      await page.waitForTimeout(2000);
      await page.click('button:has-text("Publicar")');
      await page.waitForURL('**/newsList');

      // UPDATE
      const newsRow = page.locator('.news-row', { hasText: newsInitialTitle });
      await newsRow.locator('.btn-edit').click();
      await page.waitForURL('**/news/**');
      await page.fill('#title', newsEditedTitle);
      await page.click('button:has-text("Atualizar")'); // Assumindo que muda para atualizar no modo edit
      await page.waitForURL('**/newsList');
      await expect(page.locator('.news-row .title', { hasText: newsEditedTitle })).toBeVisible();

      // DELETE
      const editedNewsRow = page.locator('.news-row', { hasText: newsEditedTitle });
      await editedNewsRow.locator('.btn-delete').click();
      await page.click('.btn-confirm.danger');
      await expect(page.locator('.news-row .title', { hasText: newsEditedTitle })).not.toBeVisible();
    });

    // --- 4. ANÚNCIOS (COM UPLOAD) ---
    await test.step('CRUD Anúncios', async () => {
      // CREATE
      await page.goto('/ads');
      await page.fill('#title', adInitialTitle);
      await page.fill('#clickUrl', 'https://google.com');
      await page.selectOption('#placement', 'header');
      await page.waitForTimeout(300);
      await page.selectOption('#size', '728x90');
      
      const fileInput = page.locator('input[type="file"]');
      await fileInput.setInputFiles('C:\\Users\\gusta\\Downloads\\pacote de anuncios teste\\728x90.jpg');
      await page.waitForTimeout(2000);
      await page.click('button[type="submit"]:has-text("Salvar Anúncio")');
      await page.waitForURL('**/adsList');

      // UPDATE
      const adRow = page.locator('.ad-row', { hasText: adInitialTitle });
      await adRow.locator('.btn-edit').click();
      await page.fill('#title', adEditedTitle);
      await page.click('button[type="submit"]:has-text("Atualizar Anúncio")');
      await page.waitForURL('**/adsList');
      await expect(page.locator('.ad-row', { hasText: adEditedTitle })).toBeVisible();

      // DELETE
      const editedAdRow = page.locator('.ad-row', { hasText: adEditedTitle });
      await editedAdRow.locator('.btn-delete').click();
      await page.click('.btn-confirm.danger');
      await expect(page.locator('.ad-row', { hasText: adEditedTitle })).not.toBeVisible();
    });
  });
});
