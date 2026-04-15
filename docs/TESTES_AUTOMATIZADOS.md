# Documentação de Testes Automatizados - Painel Gazeta

## Visão Geral

Este documento descreve a estratégia de testes automatizados para o painel administrativo do Gazeta, incluindo testes unitários (Jest) e testes E2E (Playwright).

---

## Fase 1: Testes Unitários (Jest)

### 1.1 Configuração do Ambiente

#### Dependências já disponíveis

O projeto já possui as seguintes dependências configuradas:

- `jest` (v29.7.0)
- `jest-preset-angular` (v14.6.0)
- `@nx/jest` (v21.2.0)
- `@types/jest` (v29.5.14)

#### Estrutura de arquivos

Os testes unitários seguem o padrão Angular:

```
apps/painel-gazeta/src/app/
├── pages/
│   ├── category/
│   │   ├── category.component.spec.ts      ← Já existe
│   │   ├── category-form/
│   │   │   └── category-form.component.spec.ts
│   │   └── category-list/
│   │       └── category-list.component.spec.ts
│   ├── menu/
│   │   ├── menu.component.spec.ts           ← Já existe
│   │   ├── menu-form/
│   │   │   └── menu-form.component.spec.ts
│   │   └── menu-list/
│   │       └── menu-list.component.spec.ts  ← Já existe
│   ├── news/
│   │   ├── news.component.spec.ts          ← Já existe
│   │   ├── news-list/
│   │   │   ├── news-list.component.spec.ts ← Já existe
│   │   │   └── news-list-filters/
│   │   │       └── news-list-filters.component.spec.ts
│   │   └── news-midia/
│   │       └── news-midia.component.spec.ts
│   ├── videos/
│   │   ├── videos.component.spec.ts
│   │   ├── video-list/
│   │   │   ├── video-list.component.spec.ts
│   │   │   └── video-list-filters/
│   │   │       └── video-list-filters.component.spec.ts
│   │   └── video-upload/
│   ├── ads/
│   │   ├── ads.component.spec.ts
│   │   ├── ads-list/
│   │   │   ├── ads-list.component.spec.ts
│   │   │   └── ads-list-filters/
│   │   │       └── ads-list-filters.component.spec.ts
│   │   └── ads-form/
│   ├── users/
│   │   ├── users.component.spec.ts
│   │   ├── userList/
│   │   │   └── userList.component.spec.ts
│   │   └── createUser/
│   │       └── createUser.component.spec.ts
│   ├── config/
│   └── login/
│       └── login.component.spec.ts
```

#### Scripts disponíveis

```bash
# Executar todos os testes unitários do painel
nx test painel-gazeta

# Executar testes em modo watch
nx test painel-gazeta --watch

# Executar testes com coverage
nx test painel-gazeta --coverage

# Executar testes de um componente específico
nx test painel-gazeta --testFile=category.component.spec

# Executar testes com verbose
nx test painel-gazeta --verbose
```

### 1.2 Padrões de Teste

#### Estrutura básica de um teste

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ComponentName } from './component-name.component';

describe('ComponentName', () => {
  let component: ComponentName;
  let fixture: ComponentFixture<ComponentName>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ComponentName],
      providers: [
        // Mock services se necessário
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ComponentName);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
```

#### Testando Signals (Angular 17+)

```typescript
it('should update signal on user action', () => {
  // Arrange
  const initialValue = component.itemToDelete();

  // Act
  component.confirmDelete(mockItem);

  // Assert
  expect(component.showDeleteConfirm()).toBe(true);
  expect(component.itemToDelete()).toEqual(mockItem);
});
```

#### Testando Outputs/Events

```typescript
it('should emit event on delete', () => {
  // Arrange
  jest.spyOn(component.deleteCategory, 'emit');

  // Act
  component.onDelete(mockCategory);

  // Assert
  expect(component.deleteCategory.emit).toHaveBeenCalledWith(mockCategory);
});
```

#### Testando Modais

```typescript
it('should open delete modal', () => {
  // Arrange
  const mockNews = { id: 1, title: 'Test News' } as News;

  // Act
  component.confirmDelete(mockNews);

  // Assert
  expect(component.showDeleteConfirm()).toBe(true);
  expect(component.itemToDelete()).toEqual(mockNews);
});

it('should close modal on cancel', () => {
  // Act
  component.cancelDelete();

  // Assert
  expect(component.showDeleteConfirm()).toBe(false);
  expect(component.itemToDelete()).toBeNull();
});

it('should delete item and close modal', () => {
  // Arrange
  jest.spyOn(newsService, 'delete').mockReturnValue(of({}));

  // Act
  component.deleteItem();

  // Assert
  expect(newsService.delete).toHaveBeenCalledWith(1);
  expect(component.showDeleteConfirm()).toBe(false);
});
```

#### Testando formulários reativos

```typescript
it('should validate required fields', () => {
  // Arrange
  component.form.get('name')?.setValue('');

  // Assert
  expect(component.form.get('name')?.valid).toBe(false);
  expect(component.form.get('name')?.errors?.['required']).toBeTruthy();
});

it('should submit valid form', () => {
  // Arrange
  component.form.setValue({
    name: 'Test Category',
    description: 'Test Description',
    color: '#FF0000',
    isActive: true,
  });

  // Act
  component.onSubmit();

  // Assert
  expect(component.isEditing()).toBe(true);
});
```

### 1.3 Boas Práticas

#### Mock de Serviços

```typescript
const mockCategoryService = {
  getAll: jest.fn().mockReturnValue(of([])),
  create: jest.fn().mockReturnValue(of(mockCategory)),
  update: jest.fn().mockReturnValue(of(mockCategory)),
  delete: jest.fn().mockReturnValue(of({})),
};
```

#### Mock de Outputs

```typescript
component.deleteCategory = jest.fn();
component.editCategory = jest.fn();
```

#### Testando异步操作

```typescript
it('should handle async delete', async () => {
  jest.spyOn(categoryService, 'delete').mockReturnValue(of({}));

  component.confirmDeleteCategory();

  await fixture.whenStable();

  expect(categoryService.delete).toHaveBeenCalled();
});
```

### 1.4 Priorização de Testes

#### Alta Prioridade (Primeiro)

1. **CategoryComponent** - CRUD completo + modal delete
2. **MenuComponent/MenuListComponent** - CRUD + submenus + modal delete
3. **NewsListComponent** - Bulk actions + delete modal

#### Média Prioridade

4. **VideoListComponent** - Delete modal + filtros
5. **AdsListComponent** - Delete modal
6. **CategoryFormComponent** - Validação de formulários

#### Baixa Prioridade

7. **MenuFormComponent** - Validação
8. **NewsListFiltersComponent** - Filtros
9. **UserListComponent** - Listagem

---

## Fase 2: Testes E2E (Playwright)

### 2.1 Configuração do Ambiente

#### Instalação

Playwright já está instalado como dependência de desenvolvimento:

```json
"playwright": "^1.57.0"
```

#### Estrutura de arquivos E2E

```
apps/painel-gazeta-e2e/
├── src/
│   ├── e2e/
│   │   ├── login.spec.ts
│   │   ├── category.spec.ts
│   │   ├── menu.spec.ts
│   │   ├── news.spec.ts
│   │   ├── video.spec.ts
│   │   └── ads.spec.ts
│   ├── pages/
│   │   ├── login.page.ts
│   │   ├── category.page.ts
│   │   └── ...
│   └── support/
│       ├── app.po.ts
│       └── utils.ts
├── playwright.config.ts
└── tsconfig.json
```

#### Configuração do Playwright

```typescript
// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './src/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:4201',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run start-painel',
    url: 'http://localhost:4201',
    reuseExistingServer: !process.env.CI,
  },
});
```

### 2.2 Padrões de Teste E2E

#### Page Object Model

```typescript
// pages/category.page.ts
export class CategoryPage {
  constructor(private page: Page) {}

  async navigateTo(): Promise<void> {
    await this.page.goto('/category');
  }

  async openForm(): Promise<void> {
    await this.page.click('button:has-text("Nova Categoria")');
  }

  async fillForm(name: string, description: string): Promise<void> {
    await this.page.fill('#name', name);
    await this.page.fill('#description', description);
  }

  async submit(): Promise<void> {
    await this.page.click('button[type="submit"]');
  }

  async deleteCategory(name: string): Promise<void> {
    await this.page.click(`text=${name}`);
    await this.page.click('button[title="Excluir"]');
    await this.page.click('button:has-text("Sim, Excluir")');
  }
}
```

#### Teste E2E básico

```typescript
// e2e/category.spec.ts
import { test, expect } from '@playwright/test';
import { CategoryPage } from '../pages/category.page';

test.describe('Category CRUD', () => {
  let categoryPage: CategoryPage;

  test.beforeEach(async ({ page }) => {
    categoryPage = new CategoryPage(page);
    await categoryPage.navigateTo();
  });

  test('should create category', async () => {
    await categoryPage.openForm();
    await categoryPage.fillForm('Esportes', 'Notícias esportivas');
    await categoryPage.submit();

    await expect(page.locator('text=Esportes')).toBeVisible();
  });

  test('should delete category with modal', async () => {
    await categoryPage.deleteCategory('Esportes');

    await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
    await expect(page.locator('text=Esportes')).toBeVisible();
    await expect(page.locator('text=Esta ação não pode ser desfeita')).toBeVisible();
  });
});
```

### 2.3 Casos de Teste

#### Login

- Login bem-sucedido
- Login com senha incorreta
- Logout

#### Categorias

- Criar categoria
- Editar categoria
- Excluir categoria (com modal)
- Ativar/Desativar categoria

#### Menu

- Criar menu interno
- Criar menu externo
- Criar submenu
- Abrir gerenciador de submenu
- Excluir menu (com modal)
- Reordenar menus

#### Notícias

- Listar notícias
- Filtrar por categoria
- Filtrar por status
- Busca por título
- Excluir notícia (com modal)
- Bulk action: ativar/desativar
- Bulk action: excluir

#### Vídeos

- Listar vídeos
- Filtrar por categoria
- Excluir vídeo (com modal)

#### Anúncios

- Listar anúncios
- Criar anúncio
- Excluir anúncio (com modal)

### 2.4 Scripts NPM

```json
{
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui",
  "test:e2e:headed": "playwright test --headed",
  "test:e2e:debug": "playwright test --debug",
  "test:e2e:report": "playwright show-report"
}
```

---

## 3. Execution Guide

### 3.1 Running Unit Tests

```bash
# All tests
nx test painel-gazeta

# Specific component
nx test painel-gazeta --testFile=category.component.spec

# With coverage
nx test painel-gazeta --coverage

# Watch mode
nx test painel-gazeta --watch
```

### 3.2 Running E2E Tests

```bash
# All E2E tests
npm run test:e2e

# With UI (visual)
npm run test:e2e:ui

# Specific file
npx playwright test src/e2e/category.spec.ts
```

---

## 4. Troubleshooting

### Testes Unitários

- **"Cannot find module"**: Verificar imports e caminhos relativos
- **"ExpressionChangedAfterItHasBeenCheckedError"**: Usar `fixture.detectChanges()` após mudança de estado
- **"NullInjectorError"**: Mockar serviços necessárias

### Testes E2E

- **Timeout errors**: Ajustar timeout no config ou nos testes
- **Element not found**: Usar waitForSelector ou waitForVisibility
- **Flaky tests**: Adicionar retry ou espera explícita

---

## 5. Contributing

### Ao adicionar novo componente:

1. Criar arquivo `.spec.ts` junto ao componente
2. Implementar testes básicos de criação
3. Testar métodos públicos críticos
4. Documentar casos de teste no componente

### Ao modificar funcionalidade:

1. Atualizar testes unitários existentes
2. Adicionar novos casos de teste se necessário
3. Executar testes antes de commit

---

**Documento criado para referência da equipe de desenvolvimento.**
**Última atualização: 2026**
