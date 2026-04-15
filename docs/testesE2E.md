# Testes E2E - Painel Gazeta (Playwright)

## Pré-requisitos

```bash
# Instalar Playwright (se não instalado)
npm install -D @playwright/test
npx playwright install chromium

# Executar o app primeiro
cd apps/painel-gazeta
npm start
# ou
nx serve painel-gazeta
```

## Configuração

Crie o arquivo `playwright.config.ts`:

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4200',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Estrutura de Testes

```
apps/painel-gazeta/
├── e2e/
│   ├── category.spec.ts
│   ├── menu.spec.ts
│   ├── news.spec.ts
│   ├── video.spec.ts
│   ├── ads.spec.ts
│   └── common/
│       ├── login.ts
│       └── navigation.ts
```

## Testes de Categoria

```typescript
// e2e/category.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gerenciar Categorias', () => {
  test.beforeEach(async ({ page }) => {
    // Fazer login antes de cada teste
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@gazeta.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/**');

    // Navegar para categorias
    await page.click('a[href="/category"]');
    await page.waitForURL('**/category');
  });

  test('deve carregar a página de categorias', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Gerenciar Categorias');
    await expect(page.locator('.category-layout')).toBeVisible();
  });

  test('deve abrir modal de delete ao clicar em excluir', async ({ page }) => {
    // Esperar lista carregar
    await page.waitForSelector('app-category-list');

    // Clicar no botão de excluir primeira categoria
    const deleteBtn = page.locator('button:has-text("delete")').first();
    await deleteBtn.click();

    // Verificar modal aberto
    await expect(page.locator('.g-modal-overlay')).toBeVisible();
    await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
    await expect(page.locator('h3')).toContainText('Confirmar Exclusão');
  });

  test('deve fechar modal ao clicar em cancelar', async ({ page }) => {
    // Abrir modal
    await page.locator('button:has-text("delete")').first();
    await page.locator('button:has-text("delete")').first().click();

    // Clicar em cancelar
    await page.click('button.btn-cancel');

    // Verificar modal fechado
    await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
  });

  test('deve fechar modal ao clicar no overlay', async ({ page }) => {
    await page.locator('button:has-text("delete")').first().click();
    await page.click('.g-modal-overlay', { position: { x: 10, y: 10 } });

    await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
  });
});
```

## Testes de Menu

```typescript
// e2e/menu.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Gerenciar Menu', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.fill('input[type="text"]', 'admin@gazeta.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');

    await page.click('a[href="/menu"]');
    await page.waitForURL('**/menu');
  });

  test('deve carregar a página de menu', async ({ page }) => {
    await expect(page.locator('h2')).toContainText('Gerenciar Menu');
    await expect(page.locator('app-menu-list')).toBeVisible();
  });

  test('deve abrir modal de delete', async ({ page }) => {
    await page.waitForSelector('app-menu-list');

    const deleteBtn = page.locator('button:has-text("delete")').first();
    await deleteBtn.click();

    await expect(page.locator('.g-modal-overlay')).toBeVisible();
    await expect(page.locator('.g-modal-confirm-header.danger')).toBeVisible();
  });
});
```

## Executar os Testes

```bash
# Executar todos os testes E2E
npx playwright test

# Executar teste específico
npx playwright test e2e/category.spec.ts

# Executar com UI
npx playwright test --ui

# Executar em modo headed (ver navegador)
npx playwright test --headed

# Gerar relatório
npx playwright show-report
```

## Page Objects (Opcional)

Para testes mais organizados:

```typescript
// e2e/pages/category.page.ts
import { Page, Locator } from '@playwright/test';

export class CategoryPage {
  readonly page: Page;
  readonly heading: Locator;
  readonly categoryList: Locator;
  readonly addButton: Locator;
  readonly modalOverlay: Locator;
  readonly modalContainer: Locator;
  readonly cancelButton: Locator;
  readonly confirmButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.heading = page.locator('h2:has-text("Gerenciar Categorias")');
    this.categoryList = page.locator('app-category-list');
    this.addButton = page.locator('button:has-text("Nova Categoria")');
    this.modalOverlay = page.locator('.g-modal-overlay');
    this.modalContainer = page.locator('.g-modal-confirm-container');
    this.cancelButton = page.locator('button.btn-cancel');
    this.confirmButton = page.locator('button.btn-confirm');
  }

  async goto() {
    await this.page.goto('/category');
  }

  async openDeleteModal() {
    await page.locator('button:has-text("delete")').first().click();
  }

  async cancelDelete() {
    await this.cancelButton.click();
  }

  async confirmDelete() {
    await this.confirmButton.click();
  }
}
```

## Seletores Usados nos Testes

| Elemento        | Seletor                               |
| --------------- | ------------------------------------- |
| Heading         | `h2:has-text("Gerenciar Categorias")` |
| Lista           | `app-category-list`                   |
| Botão excluir   | `button:has-text("delete")`           |
| Modal overlay   | `.g-modal-overlay`                    |
| Modal container | `.g-modal-confirm-container`          |
| Header danger   | `.g-modal-confirm-header.danger`      |
| Botão cancelar  | `.btn-cancel`                         |
| Botão confirmar | `.btn-confirm.danger`                 |

## Logs de Teste

Os testes E2E verificam:

1. ✅ Renderização da página
2. ✅ Abertura do modal de delete
3. ✅ Fechamento do modal (cancelar)
4. ✅ Fechamento do modal (overlay click)
5. ✅ Estilização do modal (classes corretas)
6. ✅ Navegação entre páginas
