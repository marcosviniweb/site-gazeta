# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ads.spec.ts >> Anúncios - Lista >> deve renderizar a página com header e botão de criação
- Location: src\ads.spec.ts:41:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('a:has-text("Criar Anúncio")')
Expected: visible
Error: strict mode violation: locator('a:has-text("Criar Anúncio")') resolved to 2 elements:
    1) <a href="/ads" routerlinkactive="active" _ngcontent-ng-c438088021="" class="submenu-item ng-star-inserted"> Criar Anúncio </a> aka getByText('Criar Anúncio', { exact: true })
    2) <a href="/ads" class="btn-primary" _ngcontent-ng-c1182154840="">…</a> aka getByText('add Criar Anúncio')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('a:has-text("Criar Anúncio")')

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - img "logo" [ref=e8]
    - generic [ref=e10]:
      - link "insights Metricas" [ref=e12] [cursor=pointer]:
        - /url: /
        - generic [ref=e13]:
          - generic [ref=e14]: insights
          - generic [ref=e15]: Metricas
      - link "menu_open Menu" [ref=e17] [cursor=pointer]:
        - /url: /menu
        - generic [ref=e18]:
          - generic [ref=e19]: menu_open
          - generic [ref=e20]: Menu
      - link "category Categorias" [ref=e22] [cursor=pointer]:
        - /url: /category
        - generic [ref=e23]:
          - generic [ref=e24]: category
          - generic [ref=e25]: Categorias
      - generic [ref=e26]:
        - button "newspaper Notícias expand_more" [ref=e27] [cursor=pointer]:
          - generic [ref=e28]:
            - generic [ref=e29]: newspaper
            - generic [ref=e30]: Notícias
          - generic [ref=e31]: expand_more
        - generic:
          - link "Criar Notícia" [ref=e32] [cursor=pointer]:
            - /url: /news
          - link "Lista de Notícias" [ref=e33] [cursor=pointer]:
            - /url: /newsList
      - generic [ref=e34]:
        - button "play_circle Vídeos expand_more" [ref=e35] [cursor=pointer]:
          - generic [ref=e36]:
            - generic [ref=e37]: play_circle
            - generic [ref=e38]: Vídeos
          - generic [ref=e39]: expand_more
        - generic:
          - link "Upload de Vídeo" [ref=e40] [cursor=pointer]:
            - /url: /videos
          - link "Lista de Vídeos" [ref=e41] [cursor=pointer]:
            - /url: /videosList
      - generic [ref=e42]:
        - button "ads_click Anúncios expand_more" [ref=e43] [cursor=pointer]:
          - generic [ref=e44]:
            - generic [ref=e45]: ads_click
            - generic [ref=e46]: Anúncios
          - generic [ref=e47]: expand_more
        - generic:
          - link "Criar Anúncio" [ref=e48] [cursor=pointer]:
            - /url: /ads
          - link "Lista de Anúncios" [ref=e49] [cursor=pointer]:
            - /url: /adsList
      - link "settings Configurações" [ref=e51] [cursor=pointer]:
        - /url: /config
        - generic [ref=e52]:
          - generic [ref=e53]: settings
          - generic [ref=e54]: Configurações
    - generic [ref=e55]:
      - button "sair" [ref=e57] [cursor=pointer]
      - paragraph [ref=e61]: © 2025 - Painel Administrativo
  - generic [ref=e66]:
    - generic [ref=e67]:
      - generic [ref=e69]:
        - heading "Lista de Anúncios" [level=2] [ref=e70]
        - paragraph [ref=e71]: Gerencie todos os anúncios cadastrados
      - link "Criar Anúncio" [ref=e73] [cursor=pointer]:
        - /url: /ads
        - img [ref=e74]: add
        - text: Criar Anúncio
    - generic [ref=e75]:
      - generic [ref=e77]:
        - generic [ref=e78]:
          - generic [ref=e79]: Data de início
          - textbox "Data de início" [ref=e80]
        - generic [ref=e81]:
          - generic [ref=e82]: Ordem
          - combobox "Ordem" [ref=e83]:
            - option "Todos" [selected]
            - option "Mais recente"
            - option "Mais antigo"
        - generic [ref=e84]:
          - generic [ref=e85]: Posição
          - combobox "Posição" [ref=e86]:
            - option "Todas as posições" [selected]
            - option "Topo"
            - option "Rodapé"
            - option "Barra Lateral"
            - option "Cabeçalho"
            - option "Rodapé da Página"
            - option "Conteúdo"
        - generic [ref=e87]:
          - generic [ref=e88]: Página
          - combobox "Página" [ref=e89]:
            - option "Todas as páginas" [selected]
            - option "Home"
            - option "Conteúdo"
            - option "Cabeçalho"
        - generic [ref=e90]:
          - generic [ref=e91]: Status
          - combobox "Status" [ref=e92]:
            - option "Todos os status" [selected]
            - option "Ativo"
            - option "Inativo"
        - generic [ref=e93]:
          - generic [ref=e94]: Pesquisar
          - textbox "Pesquisar" [ref=e95]:
            - /placeholder: Pesquisar anúncio...
      - generic:
        - generic: 0 selecionados
        - generic:
          - button "Alternar status (Ativo/Inativo)":
            - img: power_settings_new
          - button "Excluir selecionados":
            - img: delete_forever
          - button "Limpar seleção":
            - img: close
      - generic [ref=e96]:
        - generic [ref=e97]: Total encontrado:4
        - generic [ref=e98]: Página 1 de 1
      - generic [ref=e99]:
        - generic [ref=e100]:
          - checkbox [ref=e102]
          - generic [ref=e103]: Status
          - generic [ref=e104]: Banner
          - generic [ref=e105]: Conteúdo
          - generic [ref=e106]: Metadados
          - generic [ref=e107]: Ações
        - generic [ref=e108]:
          - checkbox [ref=e110] [cursor=pointer]
          - img [ref=e112]: check_circle
          - img "testando" [ref=e114]
          - generic [ref=e115]:
            - heading "testando" [level=4] [ref=e116]
            - paragraph [ref=e117]: teste
          - generic [ref=e119]:
            - generic [ref=e120]: "Posição: center"
            - generic [ref=e121]: "Página: Página Inicial"
            - generic [ref=e122]: "Prioridade: 1"
            - generic [ref=e123]: ATIVO
          - generic [ref=e124]:
            - button "Desativar" [ref=e125] [cursor=pointer]:
              - img [ref=e126]: pause
            - button "Configurações" [ref=e127] [cursor=pointer]:
              - img [ref=e128]: settings
            - button "Excluir" [ref=e129] [cursor=pointer]:
              - img [ref=e130]: delete
        - generic [ref=e131]:
          - checkbox [ref=e133] [cursor=pointer]
          - img [ref=e135]: check_circle
          - img "Teste" [ref=e137]
          - generic [ref=e138]:
            - heading "Teste" [level=4] [ref=e139]
            - paragraph [ref=e140]: teste
          - generic [ref=e142]:
            - generic [ref=e143]: "Posição: center"
            - generic [ref=e144]: "Página: Página Inicial"
            - generic [ref=e145]: "Prioridade: 1"
            - generic [ref=e146]: ATIVO
          - generic [ref=e147]:
            - button "Desativar" [ref=e148] [cursor=pointer]:
              - img [ref=e149]: pause
            - button "Configurações" [ref=e150] [cursor=pointer]:
              - img [ref=e151]: settings
            - button "Excluir" [ref=e152] [cursor=pointer]:
              - img [ref=e153]: delete
        - generic [ref=e154]:
          - checkbox [ref=e156] [cursor=pointer]
          - img [ref=e158]: check_circle
          - img "CABEÇALHO" [ref=e160]
          - heading "CABEÇALHO" [level=4] [ref=e162]
          - generic [ref=e164]:
            - generic [ref=e165]: "Posição: Topo Principal"
            - generic [ref=e166]: "Página: header"
            - generic [ref=e167]: "Prioridade: 1"
            - generic [ref=e168]: ATIVO
          - generic [ref=e169]:
            - button "Desativar" [ref=e170] [cursor=pointer]:
              - img [ref=e171]: pause
            - button "Configurações" [ref=e172] [cursor=pointer]:
              - img [ref=e173]: settings
            - button "Excluir" [ref=e174] [cursor=pointer]:
              - img [ref=e175]: delete
        - generic [ref=e176]:
          - checkbox [ref=e178] [cursor=pointer]
          - img [ref=e180]: check_circle
          - img "Anúncio Lateral" [ref=e182]
          - generic [ref=e183]:
            - heading "Anúncio Lateral" [level=4] [ref=e184]
            - paragraph [ref=e185]: Anúncio para exibição na coluna lateral da home
          - generic [ref=e187]:
            - generic [ref=e188]: "Posição: center"
            - generic [ref=e189]: "Página: Página Inicial"
            - generic [ref=e190]: "Prioridade: 1"
            - generic [ref=e191]: ATIVO
          - generic [ref=e192]:
            - button "Desativar" [ref=e193] [cursor=pointer]:
              - img [ref=e194]: pause
            - button "Configurações" [ref=e195] [cursor=pointer]:
              - img [ref=e196]: settings
            - button "Excluir" [ref=e197] [cursor=pointer]:
              - img [ref=e198]: delete
      - generic [ref=e199]:
        - button "Anterior" [disabled] [ref=e200]:
          - img [ref=e201]: chevron_left
          - text: Anterior
        - generic [ref=e202]:
          - text: Página
          - strong [ref=e203]: "1"
          - text: de 1
        - button "Próxima" [disabled] [ref=e204]:
          - text: Próxima
          - img [ref=e205]: chevron_right
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsAdmin } from './support/auth.helper';
  3   | 
  4   | test.describe('Anúncios - Página de Criação', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsAdmin(page);
  7   |     await page.goto('/ads');
  8   |     await page.waitForURL('**/ads');
  9   |     await page.waitForTimeout(500);
  10  |   });
  11  | 
  12  |   // ─── Estrutura da Página ──────────────────────────────────────────
  13  | 
  14  |   test('deve renderizar a página de anúncios com header', async ({
  15  |     page,
  16  |   }) => {
  17  |     await expect(page.locator('h2')).toHaveText('Gerenciar Anúncios');
  18  |     await expect(
  19  |       page.locator('text=Crie e edite seus anúncios'),
  20  |     ).toBeVisible();
  21  |   });
  22  | 
  23  |   test('deve renderizar componente de formulário de anúncio', async ({
  24  |     page,
  25  |   }) => {
  26  |     const adsForm = page.locator('app-ads-form');
  27  |     await expect(adsForm).toBeVisible();
  28  |   });
  29  | });
  30  | 
  31  | test.describe('Anúncios - Lista', () => {
  32  |   test.beforeEach(async ({ page }) => {
  33  |     await loginAsAdmin(page);
  34  |     await page.goto('/adsList');
  35  |     await page.waitForURL('**/adsList');
  36  |     await page.waitForTimeout(500);
  37  |   });
  38  | 
  39  |   // ─── Estrutura da Página ──────────────────────────────────────────
  40  | 
  41  |   test('deve renderizar a página com header e botão de criação', async ({
  42  |     page,
  43  |   }) => {
  44  |     await expect(page.locator('h2')).toHaveText('Lista de Anúncios');
  45  |     await expect(
  46  |       page.locator('text=Gerencie todos os anúncios cadastrados'),
  47  |     ).toBeVisible();
> 48  |     await expect(page.locator('a:has-text("Criar Anúncio")')).toBeVisible();
      |                                                               ^ Error: expect(locator).toBeVisible() failed
  49  |   });
  50  | 
  51  |   // ─── Filtros ──────────────────────────────────────────────────────
  52  | 
  53  |   test('deve renderizar componente de filtros', async ({ page }) => {
  54  |     const filters = page.locator('app-ads-list-filters');
  55  |     await expect(filters).toBeVisible({ timeout: 10000 });
  56  |   });
  57  | 
  58  |   // ─── Cabeçalho da Lista ───────────────────────────────────────────
  59  | 
  60  |   test('deve renderizar cabeçalhos da tabela de anúncios', async ({
  61  |     page,
  62  |   }) => {
  63  |     const header = page.locator('.ads-list-header');
  64  |     await expect(header).toBeVisible();
  65  |     await expect(header.locator('text=Status')).toBeVisible();
  66  |     await expect(header.locator('text=Banner')).toBeVisible();
  67  |     await expect(header.locator('text=Conteúdo')).toBeVisible();
  68  |     await expect(header.locator('text=Metadados')).toBeVisible();
  69  |     await expect(header.locator('text=Ações')).toBeVisible();
  70  |   });
  71  | 
  72  |   // ─── Lista de Dados ───────────────────────────────────────────────
  73  | 
  74  |   test('deve carregar lista de anúncios ou mensagem vazia', async ({
  75  |     page,
  76  |   }) => {
  77  |     await page.waitForTimeout(3000);
  78  |     const adsRows = page.locator('.ads-row');
  79  |     const emptyState = page.locator('.ads-empty');
  80  | 
  81  |     const hasRows = (await adsRows.count()) > 0;
  82  |     const hasEmpty = await emptyState.isVisible().catch(() => false);
  83  | 
  84  |     expect(hasRows || hasEmpty).toBeTruthy();
  85  |   });
  86  | 
  87  |   test('deve exibir informações em cada anúncio', async ({ page }) => {
  88  |     await page.waitForTimeout(3000);
  89  |     const adsRows = page.locator('.ads-row');
  90  | 
  91  |     if ((await adsRows.count()) > 0) {
  92  |       const firstRow = adsRows.first();
  93  | 
  94  |       // Título
  95  |       await expect(firstRow.locator('.title')).toBeVisible();
  96  |       // Indicador de status
  97  |       await expect(firstRow.locator('.status-indicator')).toBeVisible();
  98  |       // Metadados (posição, página, prioridade)
  99  |       await expect(firstRow.locator('.ads-meta')).toBeVisible();
  100 |       // Ações (ativar/desativar, configurações, deletar)
  101 |       await expect(firstRow.locator('.g-cell-actions')).toBeVisible();
  102 |     }
  103 |   });
  104 | 
  105 |   test('deve exibir metadados detalhados (posição, página, prioridade)', async ({
  106 |     page,
  107 |   }) => {
  108 |     await page.waitForTimeout(3000);
  109 |     const adsRows = page.locator('.ads-row');
  110 | 
  111 |     if ((await adsRows.count()) > 0) {
  112 |       const meta = adsRows.first().locator('.ads-meta');
  113 |       await expect(meta.locator('text=Posição:')).toBeVisible();
  114 |       await expect(meta.locator('text=Página:')).toBeVisible();
  115 |       await expect(meta.locator('text=Prioridade:')).toBeVisible();
  116 |     }
  117 |   });
  118 | 
  119 |   // ─── Seleção em Massa ─────────────────────────────────────────────
  120 | 
  121 |   test('deve exibir ações em massa ao selecionar anúncios', async ({
  122 |     page,
  123 |   }) => {
  124 |     await page.waitForTimeout(3000);
  125 |     const checkboxes = page.locator('.ads-row input[type="checkbox"]');
  126 | 
  127 |     if ((await checkboxes.count()) > 0) {
  128 |       await checkboxes.first().check();
  129 |       await page.waitForTimeout(300);
  130 | 
  131 |       const bulkActions = page.locator('.g-bulk-actions');
  132 |       await expect(bulkActions).toHaveClass(/active/);
  133 |     }
  134 |   });
  135 | 
  136 |   // ─── Paginação ────────────────────────────────────────────────────
  137 | 
  138 |   test('deve renderizar controles de paginação', async ({ page }) => {
  139 |     const pagination = page.locator('.g-pagination');
  140 |     await expect(pagination).toBeVisible();
  141 |   });
  142 | 
  143 |   // ─── Link de Criação ──────────────────────────────────────────────
  144 | 
  145 |   test('deve navegar para criação ao clicar em "Criar Anúncio"', async ({
  146 |     page,
  147 |   }) => {
  148 |     await page.click('a:has-text("Criar Anúncio")');
```