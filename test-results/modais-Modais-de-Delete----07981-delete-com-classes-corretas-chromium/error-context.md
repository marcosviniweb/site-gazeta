# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modais.spec.ts >> Modais de Delete - Painel Gazeta >> Modal de Categoria >> deve renderizar modal de delete com classes corretas
- Location: src\modais.spec.ts:13:9

# Error details

```
Test timeout of 30000ms exceeded while running "beforeEach" hook.
```

```
Error: page.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('input[type="text"]')

```

# Page snapshot

```yaml
- generic [ref=e5]:
  - generic [ref=e6]:
    - img "logo" [ref=e8]
    - heading "Painel de controle" [level=2] [ref=e10]
    - paragraph [ref=e11]: Faça login para continuar
  - generic [ref=e12]:
    - generic [ref=e13]:
      - generic [ref=e14]: E-mail
      - textbox "E-mail" [ref=e15]:
        - /placeholder: Seu e-mail
    - generic [ref=e18]:
      - generic [ref=e19]: Senha
      - generic [ref=e20]:
        - textbox "Senha" [ref=e21]:
          - /placeholder: Sua senha
        - button "visibility" [ref=e22] [cursor=pointer]
    - generic [ref=e27]:
      - generic [ref=e28]:
        - checkbox "Lembrar-me" [ref=e29]
        - generic [ref=e30]: Lembrar-me
      - link "Esqueceu a senha?" [ref=e31] [cursor=pointer]:
        - /url: "#"
    - button "Entrar" [disabled] [ref=e32] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Modais de Delete - Painel Gazeta', () => {
  4   |   test.beforeEach(async ({ page }) => {
  5   |     await page.goto('/login');
> 6   |     await page.fill('input[type="text"]', 'master@email.com');
      |                ^ Error: page.fill: Test timeout of 30000ms exceeded.
  7   |     await page.fill('input[type="password"]', '123456');
  8   |     await page.click('button[type="submit"]');
  9   |     await page.waitForTimeout(1000);
  10  |   });
  11  | 
  12  |   test.describe('Modal de Categoria', () => {
  13  |     test('deve renderizar modal de delete com classes corretas', async ({
  14  |       page,
  15  |     }) => {
  16  |       await page.click('a[href="/category"]');
  17  |       await page.waitForURL('**/category');
  18  | 
  19  |       const categoryList = page.locator('app-category-list');
  20  |       await expect(categoryList).toBeVisible({ timeout: 10000 });
  21  | 
  22  |       const deleteButtons = page.locator('button mat-icon:has-text("delete")');
  23  |       if ((await deleteButtons.count()) > 0) {
  24  |         await deleteButtons.first().click();
  25  | 
  26  |         await expect(page.locator('.g-modal-overlay')).toBeVisible();
  27  |         await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
  28  |         await expect(
  29  |           page.locator('.g-modal-confirm-header.danger'),
  30  |         ).toBeVisible();
  31  |         await expect(page.locator('.g-modal-confirm-body')).toBeVisible();
  32  |         await expect(page.locator('.g-modal-confirm-footer')).toBeVisible();
  33  |       }
  34  |     });
  35  | 
  36  |     test('deve fechar modal ao clicar em cancelar', async ({ page }) => {
  37  |       await page.click('a[href="/category"]');
  38  |       await page.waitForURL('**/category');
  39  |       await page.waitForSelector('app-category-list', { timeout: 10000 });
  40  | 
  41  |       const deleteButtons = page.locator('button mat-icon:has-text("delete")');
  42  |       if ((await deleteButtons.count()) > 0) {
  43  |         await deleteButtons.first().click();
  44  |         await expect(page.locator('.g-modal-overlay')).toBeVisible();
  45  | 
  46  |         await page.click('button.btn-cancel');
  47  |         await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
  48  |       }
  49  |     });
  50  | 
  51  |     test('deve fechar modal ao clicar no overlay', async ({ page }) => {
  52  |       await page.click('a[href="/category"]');
  53  |       await page.waitForURL('**/category');
  54  |       await page.waitForSelector('app-category-list', { timeout: 10000 });
  55  | 
  56  |       const deleteButtons = page.locator('button mat-icon:has-text("delete")');
  57  |       if ((await deleteButtons.count()) > 0) {
  58  |         await deleteButtons.first().click();
  59  |         await expect(page.locator('.g-modal-overlay')).toBeVisible();
  60  | 
  61  |         await page
  62  |           .locator('.g-modal-overlay')
  63  |           .click({ position: { x: 10, y: 10 } });
  64  |         await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
  65  |       }
  66  |     });
  67  |   });
  68  | 
  69  |   test.describe('Modal de Menu', () => {
  70  |     test('deve renderizar modal de delete com classes corretas', async ({
  71  |       page,
  72  |     }) => {
  73  |       await page.click('a[href="/menu"]');
  74  |       await page.waitForURL('**/menu');
  75  | 
  76  |       const menuList = page.locator('app-menu-list');
  77  |       await expect(menuList).toBeVisible({ timeout: 10000 });
  78  | 
  79  |       const deleteButtons = page.locator('button mat-icon:has-text("delete")');
  80  |       if ((await deleteButtons.count()) > 0) {
  81  |         await deleteButtons.first().click();
  82  | 
  83  |         await expect(page.locator('.g-modal-overlay')).toBeVisible();
  84  |         await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
  85  |       }
  86  |     });
  87  |   });
  88  | 
  89  |   test.describe('Modal de News', () => {
  90  |     test('deve renderizar modal de delete com classes corretas', async ({
  91  |       page,
  92  |     }) => {
  93  |       await page.click('a[href="/newsList"]');
  94  |       await page.waitForURL('**/newsList');
  95  | 
  96  |       await page.waitForSelector('app-news-list', { timeout: 10000 });
  97  | 
  98  |       const deleteButtons = page.locator('button mat-icon:has-text("delete")');
  99  |       if ((await deleteButtons.count()) > 0) {
  100 |         await deleteButtons.first().click();
  101 | 
  102 |         await expect(page.locator('.g-modal-overlay')).toBeVisible();
  103 |         await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
  104 |       }
  105 |     });
  106 |   });
```