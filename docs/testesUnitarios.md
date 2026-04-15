# Testes Unitários - Painel Gazeta

## Resumo dos Testes

| Componente            | Testes  | Status      |
| --------------------- | ------- | ----------- |
| CategoryComponent     | 14      | ✅ PASS     |
| CategoryListComponent | 6       | ✅ PASS     |
| MenuListComponent     | 24      | ✅ PASS     |
| NewsListComponent     | 46      | ✅ PASS     |
| VideoListComponent    | 28      | ✅ PASS     |
| AdsListComponent      | 30      | ✅ PASS     |
| **Total**             | **148** | **✅ PASS** |

## Componentes Testados

### 1. CategoryComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/category/category.component.spec.ts`

**Testes:**

- `should create`
- `ngOnInit - should load categories on init`
- `Signals - should initialize with empty categoryToDelete`
- `Signals - should initialize with showDeleteConfirm as false`
- `Signals - should initialize editingCategory as null`
- `Signals - should compute used colors`
- `onCategorySubmit - should update existing category`
- `onCategorySubmit - should add new category when id does not exist`
- `onEditCategory - should set category to edit`
- `onCancelEdit - should clear editingCategory`
- `onDeleteCategory (modal) - should open delete modal with category`
- `cancelDelete - should close modal and clear category`
- `confirmDeleteCategory - should do nothing when no category selected`
- `onToggleStatus - should call update service`

### 2. CategoryListComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/category/category-list/category-list.component.spec.ts`

**Testes:**

- `should create`
- `Signals - should initialize with empty searchTerm`
- `Signals - should initialize with orderBy as newest`
- `Signals - should initialize with statusFilter as all`
- `filteredCategories - should return all categories when no filter`
- `filteredCategories - should filter by search term`

### 3. MenuListComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/menu/menu-list/menu-list.component.spec.ts`

**Testes:**

- `should create`
- `Signals` (3 testes)
- `Config (Drag and Drop)` (4 testes)
- `editMenu` (1 teste)
- `Modal Delete` (8 testes)
- `Reorder` (3 testes)
- `Helper Methods` (3 testes)
- `openSubmenuModal` (2 testes)

### 4. NewsListComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/news/news-list/news-list.component.spec.ts`

**Testes:**

- `should create`
- `Initial State Signals` (7 testes)
- `ngOnInit` (3 testes)
- `loadNews` (2 testes)
- `Pagination` (5 testes)
- `Selection` (6 testes)
- `Modal Delete` (7 testes)
- `Filters` (6 testes)
- `Helper Methods` (2 testes)

### 5. VideoListComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/videos/video-list/video-list.component.spec.ts`

**Testes:**

- `should create`
- `Initial State Signals` (7 testes)
- `ngOnInit` (2 testes)
- `loadVideos` (1 teste)
- `Selection` (6 testes)
- `Modal Delete` (3 testes)
- `Video Playback` (3 testes)
- `Helper Methods` (4 testes)
- `editVideo` (2 testes)

### 6. AdsListComponent

**Arquivo:** `apps/painel-gazeta/src/app/pages/ads/ads-list/ads-list.component.spec.ts`

**Testes:**

- `should create`
- `Initial State Signals` (6 testes)
- `ngOnInit` (1 teste)
- `loadAdvertisements` (2 testes)
- `Pagination` (5 testes)
- `Selection` (6 testes)
- `Modal Delete` (6 testes)
- `Helper Methods` (4 testes)

##Mocks Utilizados

### Services

```typescript
const mockMenuService = {
  reorder: jest.fn().mockReturnValue(of({})),
  moveToSubmenu: jest.fn().mockReturnValue(of({})),
  delete: jest.fn().mockReturnValue(of({})),
};
```

### Browser APIs

```typescript
Object.defineProperty(window, 'scrollTo', { value: jest.fn() });
Object.defineProperty(window, 'open', { value: jest.fn() });
```

### Signal Inputs

Para componentes com `input.required`:

```typescript
fixture.componentRef.setInput('menus', mockMenus);
fixture.componentRef.setInput('categories', mockCategories);
```

## Execute os Testes

```bash
# Executar todos os testes de lista
cd apps/painel-gazeta
npx jest --testPathPattern="(category|menu|news-list|video-list|ads-list).component.spec" --no-coverage

# Executar um componente específico
npx jest --testPathPattern="menu-list.component.spec" --no-coverage

# Executar com verbose
npx jest --testPathPattern="menu-list.component.spec" --no-coverage --verbose
```

##Cobertura de Testes

### O que está sendo testado:

1. **Criação de componentes** - Verifica se o componente é criado corretamente
2. **Signals** - Estado interno dos componentes
3. **Métodos de ação** - delete, edit, create, update
4. **Modais de confirmação** - Fluxo de delete com modal
5. **Métodos helpers** - Formatação, validações
6. **Eventos de lifecycle** - ngOnInit

### O que NÃO está sendo testado:

1. **Renderização de template** - Testes E2E cobrem isso
2. **Integração com Router** - Testes E2E cobrem isso
3. **HTTP calls reais** - Mockados nos serviços
4. **Browser APIs completas** - jsdom tem limitações

##Melhores Práticas Aplicadas

1. **Mocks de serviços** - Todos os serviços são mockados
2. **jest.fn()** - Usado para funções mockadas
3. **of() do RxJS** - Para respostas síncronas
4. **throwError() do RxJS** - Para simulating errors
5. **async/await** - Para operações assíncronas
6. **signal inputs** - Usando `setInput()` paraAngular 19+

##Notas

- Os testes foram otimizados para evitar flaky tests
- Subject/RxJS não precisa de subscription ativa nos testes
- Testes verificam comportamento real, não detalhes de implementação
- Componentes que carregam dados automáticamente têm testes ajustados
