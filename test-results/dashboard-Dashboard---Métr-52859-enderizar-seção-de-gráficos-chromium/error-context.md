# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: dashboard.spec.ts >> Dashboard - Métricas e Performance >> deve renderizar seção de gráficos
- Location: src\dashboard.spec.ts:60:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Páginas Vistas')
Expected: visible
Error: strict mode violation: locator('text=Páginas Vistas') resolved to 2 elements:
    1) <span class="stat-label" _ngcontent-ng-c1970167778="">Páginas Vistas</span> aka getByText('Páginas Vistas', { exact: true })
    2) <h3 _ngcontent-ng-c1970167778="">…</h3> aka getByRole('heading', { name: 'Páginas Vistas' })

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Páginas Vistas')

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
    - banner [ref=e67]:
      - generic [ref=e69]:
        - heading "Métricas e Performance" [level=2] [ref=e70]
        - paragraph [ref=e71]: Acompanhe o desempenho do site, acessos e atividades em tempo real
      - generic "Última atualização dos dados" [ref=e73]:
        - img [ref=e74]: history
        - generic [ref=e75]: "Última atualização: 15/04/2026 10:50:54"
    - generic [ref=e76]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]:
            - img [ref=e81]: calendar_today
            - text: Período de Análise
          - generic [ref=e82]:
            - combobox "Período de Análise" [ref=e83]: 09/04/2026 - 15/04/2026
            - button "Choose Date" [ref=e84] [cursor=pointer]:
              - img [ref=e85]
        - generic [ref=e87]:
          - generic [ref=e88]:
            - img [ref=e89]: visibility
            - text: Visualização
          - generic [ref=e90] [cursor=pointer]:
            - combobox "Diário" [ref=e91]
            - button "dropdown trigger" [ref=e92]:
              - img [ref=e93]
        - button "Atualizar" [ref=e96] [cursor=pointer]:
          - img [ref=e97]: refresh
          - text: Atualizar
      - generic [ref=e98]:
        - generic [ref=e99]:
          - generic [ref=e100]:
            - img [ref=e102]: people
            - generic [ref=e103]:
              - img [ref=e104]: trending_down
              - text: "-61%"
          - generic [ref=e105]:
            - generic [ref=e106]: "143"
            - generic [ref=e107]: Acessos
        - generic [ref=e108]:
          - generic [ref=e109]:
            - img [ref=e111]: description
            - generic [ref=e112]:
              - img [ref=e113]: trending_down
              - text: "-61%"
          - generic [ref=e114]:
            - generic [ref=e115]: "143"
            - generic [ref=e116]: Páginas Vistas
        - generic [ref=e117]:
          - generic [ref=e118]:
            - img [ref=e120]: visibility
            - generic [ref=e121]:
              - img [ref=e122]: trending_down
              - text: "-96%"
          - generic [ref=e123]:
            - generic [ref=e124]: "12"
            - generic [ref=e125]: Visitantes Únicos
        - generic [ref=e126]:
          - generic [ref=e127]:
            - img [ref=e129]: schedule
            - generic [ref=e130]:
              - img [ref=e131]: trending_up
              - text: 27%
          - generic [ref=e132]:
            - generic [ref=e133]: "1"
            - generic [ref=e134]: Tempo Médio (min)
      - generic [ref=e135]:
        - generic [ref=e136]:
          - generic [ref=e137]:
            - banner [ref=e138]:
              - heading "Acessos ao Site" [level=3] [ref=e140]:
                - img [ref=e141]: show_chart
                - text: Acessos ao Site
            - img [ref=e144]
          - generic [ref=e145]:
            - banner [ref=e146]:
              - heading "Páginas Vistas" [level=3] [ref=e148]:
                - img [ref=e149]: analytics
                - text: Páginas Vistas
            - img [ref=e152]
        - generic [ref=e153]:
          - generic [ref=e154]:
            - banner [ref=e155]:
              - heading "Conteúdos em Destaque" [level=3] [ref=e157]:
                - img [ref=e158]: star
                - text: Conteúdos em Destaque
            - generic [ref=e160]:
              - table [ref=e162]:
                - rowgroup [ref=e163]:
                  - row "Título da Notícia Visualizações Acesso" [ref=e164]:
                    - columnheader "Título da Notícia" [ref=e165]
                    - columnheader "Visualizações" [ref=e166]
                    - columnheader "Acesso" [ref=e167]
                - rowgroup [ref=e168]:
                  - 'row "1 🎓 Momento histórico: alunos da etnia Assurini concluem o Ensino Médio em Tucuruí 26 09/04 16:32" [ref=e169]':
                    - 'cell "1 🎓 Momento histórico: alunos da etnia Assurini concluem o Ensino Médio em Tucuruí" [ref=e170]':
                      - generic [ref=e171]:
                        - generic [ref=e172]: "1"
                        - generic [ref=e173]: "🎓 Momento histórico: alunos da etnia Assurini concluem o Ensino Médio em Tucuruí"
                    - cell "26" [ref=e174]
                    - cell "09/04 16:32" [ref=e175]
                  - 'row "2 🚨 VIOLÊNCIA CONTRA A MULHER: ENTRE AVANÇOS HISTÓRICOS E O DIREITO BÁSICO DE VIVER 22 15/04 03:56" [ref=e176]':
                    - 'cell "2 🚨 VIOLÊNCIA CONTRA A MULHER: ENTRE AVANÇOS HISTÓRICOS E O DIREITO BÁSICO DE VIVER" [ref=e177]':
                      - generic [ref=e178]:
                        - generic [ref=e179]: "2"
                        - generic [ref=e180]: "🚨 VIOLÊNCIA CONTRA A MULHER: ENTRE AVANÇOS HISTÓRICOS E O DIREITO BÁSICO DE VIVER"
                    - cell "22" [ref=e181]
                    - cell "15/04 03:56" [ref=e182]
                  - row "3 🚜🌾 MULHERES DO CAMPO PROTAGONIZAM O 1º GIRO DO AGRO EM GOIANÉSIA DO PARÁ 11 10/04 23:53" [ref=e183]:
                    - cell "3 🚜🌾 MULHERES DO CAMPO PROTAGONIZAM O 1º GIRO DO AGRO EM GOIANÉSIA DO PARÁ" [ref=e184]:
                      - generic [ref=e185]:
                        - generic [ref=e186]: "3"
                        - generic [ref=e187]: 🚜🌾 MULHERES DO CAMPO PROTAGONIZAM O 1º GIRO DO AGRO EM GOIANÉSIA DO PARÁ
                    - cell "11" [ref=e188]
                    - cell "10/04 23:53" [ref=e189]
                  - 'row "4 ITUPIRANGA | HIDROVIA DO TOCANTINS: Obras no Pedral do Lourenço seguem e incluem desocupação de áreas públicas 4 10/04 23:46" [ref=e190]':
                    - 'cell "4 ITUPIRANGA | HIDROVIA DO TOCANTINS: Obras no Pedral do Lourenço seguem e incluem desocupação de áreas públicas" [ref=e191]':
                      - generic [ref=e192]:
                        - generic [ref=e193]: "4"
                        - generic [ref=e194]: "ITUPIRANGA | HIDROVIA DO TOCANTINS: Obras no Pedral do Lourenço seguem e incluem desocupação de áreas públicas"
                    - cell "4" [ref=e195]
                    - cell "10/04 23:46" [ref=e196]
                  - row "5 TUCURUÍ | Professor Jefferson é nomeado como Diretor da DRE Tucuruí 3 10/04 22:34" [ref=e197]:
                    - cell "5 TUCURUÍ | Professor Jefferson é nomeado como Diretor da DRE Tucuruí" [ref=e198]:
                      - generic [ref=e199]:
                        - generic [ref=e200]: "5"
                        - generic [ref=e201]: TUCURUÍ | Professor Jefferson é nomeado como Diretor da DRE Tucuruí
                    - cell "3" [ref=e202]
                    - cell "10/04 22:34" [ref=e203]
              - generic [ref=e204]:
                - button "First Page":
                  - img
                - button "Previous Page" [disabled]:
                  - img
                - generic [ref=e205]:
                  - button "1" [ref=e206] [cursor=pointer]
                  - button "2" [ref=e207] [cursor=pointer]
                - button "Next Page" [ref=e208] [cursor=pointer]:
                  - img [ref=e209]
                - button "Last Page" [ref=e211] [cursor=pointer]:
                  - img [ref=e212]
          - generic [ref=e214]:
            - banner [ref=e215]:
              - heading "Atividades do Painel" [level=3] [ref=e217]:
                - img [ref=e218]: history
                - text: Atividades do Painel
            - paragraph [ref=e221]: Nenhuma atividade recente.
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | import { loginAsAdmin } from './support/auth.helper';
  3  | 
  4  | test.describe('Dashboard - Métricas e Performance', () => {
  5  |   test.beforeEach(async ({ page }) => {
  6  |     await loginAsAdmin(page);
  7  |     // Dashboard é a rota raiz após login
  8  |   });
  9  | 
  10 |   // ─── Estrutura da Página ──────────────────────────────────────────
  11 | 
  12 |   test('deve renderizar o cabeçalho de métricas', async ({ page }) => {
  13 |     await expect(page.locator('h2')).toHaveText('Métricas e Performance');
  14 |     await expect(
  15 |       page.locator('text=Acompanhe o desempenho do site'),
  16 |     ).toBeVisible();
  17 |   });
  18 | 
  19 |   // ─── Filtros de Dashboard ─────────────────────────────────────────
  20 | 
  21 |   test('deve exibir os filtros de período e granularidade', async ({
  22 |     page,
  23 |   }) => {
  24 |     await expect(page.locator('.dashboard-filters')).toBeVisible();
  25 |     await expect(page.locator('text=Período de Análise')).toBeVisible();
  26 |     await expect(page.locator('text=Visualização')).toBeVisible();
  27 |     await expect(page.locator('text=Atualizar')).toBeVisible();
  28 |   });
  29 | 
  30 |   test('deve ter o botão de atualizar visível', async ({ page }) => {
  31 |     const refreshBtn = page.locator('button:has-text("Atualizar")');
  32 |     await expect(refreshBtn).toBeVisible();
  33 |   });
  34 | 
  35 |   // ─── KPIs (Cards de Estatísticas) ─────────────────────────────────
  36 | 
  37 |   test('deve renderizar cards de KPI', async ({ page }) => {
  38 |     const statCards = page.locator('.g-stat-card');
  39 |     // Aguardar que os cards sejam renderizados
  40 |     await expect(statCards.first()).toBeVisible({ timeout: 10000 });
  41 |     const count = await statCards.count();
  42 |     expect(count).toBeGreaterThan(0);
  43 |   });
  44 | 
  45 |   test('deve exibir valores nos cards de KPI após carregamento', async ({
  46 |     page,
  47 |   }) => {
  48 |     // Aguardar carregamento completo (spinner sumir)
  49 |     await page.waitForTimeout(3000);
  50 | 
  51 |     const statValues = page.locator('.stat-value');
  52 |     if ((await statValues.count()) > 0) {
  53 |       const firstValue = await statValues.first().textContent();
  54 |       expect(firstValue).toBeTruthy();
  55 |     }
  56 |   });
  57 | 
  58 |   // ─── Gráficos ─────────────────────────────────────────────────────
  59 | 
  60 |   test('deve renderizar seção de gráficos', async ({ page }) => {
  61 |     await expect(page.locator('text=Acessos ao Site')).toBeVisible({
  62 |       timeout: 10000,
  63 |     });
> 64 |     await expect(page.locator('text=Páginas Vistas')).toBeVisible();
     |                                                       ^ Error: expect(locator).toBeVisible() failed
  65 |   });
  66 | 
  67 |   // ─── Tabela de Conteúdos em Destaque ──────────────────────────────
  68 | 
  69 |   test('deve renderizar seção de conteúdos em destaque', async ({ page }) => {
  70 |     await expect(page.locator('text=Conteúdos em Destaque')).toBeVisible({
  71 |       timeout: 10000,
  72 |     });
  73 |   });
  74 | 
  75 |   // ─── Timeline de Atividades ───────────────────────────────────────
  76 | 
  77 |   test('deve renderizar seção de atividades do painel', async ({ page }) => {
  78 |     await expect(page.locator('text=Atividades do Painel')).toBeVisible({
  79 |       timeout: 10000,
  80 |     });
  81 |   });
  82 | 
  83 |   // ─── Última Atualização ───────────────────────────────────────────
  84 | 
  85 |   test('deve exibir pill de última atualização após carregamento', async ({
  86 |     page,
  87 |   }) => {
  88 |     await page.waitForTimeout(3000);
  89 |     const updatePill = page.locator('.last-update-pill');
  90 |     if (await updatePill.isVisible()) {
  91 |       await expect(updatePill).toContainText('Última atualização:');
  92 |     }
  93 |   });
  94 | });
  95 | 
```