import { test, expect } from '@playwright/test';

test.describe('Modais de Delete - Painel Gazeta', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'master@email.com');
    await page.fill('input[type="password"]', '123456');
    await page.click('button[type="submit"]');
    await page.waitForTimeout(1000);
  });

  test.describe('Modal de Categoria', () => {
    test('deve renderizar modal de delete com classes corretas', async ({
      page,
    }) => {
      await page.click('a[href="/category"]');
      await page.waitForURL('**/category');

      const categoryList = page.locator('app-category-list');
      await expect(categoryList).toBeVisible({ timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();

        await expect(page.locator('.g-modal-overlay')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
        await expect(
          page.locator('.g-modal-confirm-header.danger'),
        ).toBeVisible();
        await expect(page.locator('.g-modal-confirm-body')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-footer')).toBeVisible();
      }
    });

    test('deve fechar modal ao clicar em cancelar', async ({ page }) => {
      await page.click('a[href="/category"]');
      await page.waitForURL('**/category');
      await page.waitForSelector('app-category-list', { timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();
        await expect(page.locator('.g-modal-overlay')).toBeVisible();

        await page.click('button.btn-cancel');
        await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
      }
    });

    test('deve fechar modal ao clicar no overlay', async ({ page }) => {
      await page.click('a[href="/category"]');
      await page.waitForURL('**/category');
      await page.waitForSelector('app-category-list', { timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();
        await expect(page.locator('.g-modal-overlay')).toBeVisible();

        await page
          .locator('.g-modal-overlay')
          .click({ position: { x: 10, y: 10 } });
        await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
      }
    });
  });

  test.describe('Modal de Menu', () => {
    test('deve renderizar modal de delete com classes corretas', async ({
      page,
    }) => {
      await page.click('a[href="/menu"]');
      await page.waitForURL('**/menu');

      const menuList = page.locator('app-menu-list');
      await expect(menuList).toBeVisible({ timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();

        await expect(page.locator('.g-modal-overlay')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
      }
    });
  });

  test.describe('Modal de News', () => {
    test('deve renderizar modal de delete com classes corretas', async ({
      page,
    }) => {
      await page.click('a[href="/newsList"]');
      await page.waitForURL('**/newsList');

      await page.waitForSelector('app-news-list', { timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();

        await expect(page.locator('.g-modal-overlay')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
      }
    });
  });

  test.describe('Modal de Videos', () => {
    test('deve renderizar modal de delete com classes corretas', async ({
      page,
    }) => {
      await page.click('a[href="/videosList"]');
      await page.waitForURL('**/videosList');

      await page.waitForSelector('app-video-list', { timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();

        await expect(page.locator('.g-modal-overlay')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
      }
    });
  });

  test.describe('Modal de Anúncios', () => {
    test('deve renderizar modal de delete com classes corretas', async ({
      page,
    }) => {
      await page.click('a[href="/adsList"]');
      await page.waitForURL('**/adsList');

      await page.waitForSelector('app-ads-list', { timeout: 10000 });

      const deleteButtons = page.locator('button mat-icon:has-text("delete")');
      if ((await deleteButtons.count()) > 0) {
        await deleteButtons.first().click();

        await expect(page.locator('.g-modal-overlay')).toBeVisible();
        await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
      }
    });
  });
});
