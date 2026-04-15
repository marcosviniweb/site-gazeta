# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: config.spec.ts >> Configurações do Sistema >> deve renderizar as tabs principais
- Location: src\config.spec.ts:25:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('text=Redes Sociais')
Expected: visible
Error: strict mode violation: locator('text=Redes Sociais') resolved to 6 elements:
    1) <button type="button" class="tab-button active" _ngcontent-ng-c2530173532="">…</button> aka getByRole('button', { name: 'Redes Sociais' })
    2) <h3 _ngcontent-ng-c1087327574="">Redes Sociais</h3> aka getByRole('heading', { name: 'Redes Sociais' })
    3) <p _ngcontent-ng-c1087327574="">Configure os links das redes sociais exibidos no …</p> aka getByText('Configure os links das redes')
    4) <strong _ngcontent-ng-c2312086177="">📱⚠️ INSS vai monitorar redes sociais para preveni…</strong> aka getByText('📱⚠️ INSS vai monitorar redes')
    5) <strong _ngcontent-ng-c2312086177="">MARABÁ | Pastor que foi afastado da Igreja após c…</strong> aka getByText('MARABÁ | Pastor que foi')
    6) <strong _ngcontent-ng-c2312086177="">Vídeo de Matheus & Kauan nas redes sociais levant…</strong> aka getByText('Vídeo de Matheus & Kauan nas')

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('text=Redes Sociais')

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
    - generic [ref=e68]:
      - heading "Configurações do Sistema" [level=2] [ref=e69]
      - paragraph [ref=e70]: Gerencie as configurações gerais da aplicação
    - generic [ref=e71]:
      - button "Redes Sociais" [ref=e72] [cursor=pointer]:
        - img [ref=e73]: share
        - text: Redes Sociais
      - button "Configuração Home" [ref=e74] [cursor=pointer]:
        - img [ref=e75]: home
        - text: Configuração Home
      - button "Manutenção" [ref=e76] [cursor=pointer]:
        - img [ref=e77]: build
        - text: Manutenção
      - button "Limpeza de Mídias" [ref=e78] [cursor=pointer]:
        - img [ref=e79]: cleaning_services
        - text: Limpeza de Mídias
    - generic [ref=e83]:
      - generic [ref=e84]:
        - img [ref=e86]: share
        - generic [ref=e87]:
          - heading "Redes Sociais" [level=3] [ref=e88]
          - paragraph [ref=e89]: Configure os links das redes sociais exibidos no site
      - generic [ref=e90]:
        - generic [ref=e91]:
          - generic [ref=e92]:
            - generic [ref=e93]:
              - img [ref=e94]: photo_camera
              - text: Instagram
            - textbox "Instagram" [ref=e95]:
              - /placeholder: https://instagram.com/seu-usuario
          - generic [ref=e98]:
            - generic [ref=e99]:
              - img [ref=e100]: facebook
              - text: Facebook
            - textbox "Facebook" [ref=e101]:
              - /placeholder: https://facebook.com/sua-pagina
          - generic [ref=e104]:
            - generic [ref=e105]:
              - img [ref=e106]: play_circle
              - text: YouTube
            - textbox "YouTube" [ref=e107]:
              - /placeholder: https://youtube.com/c/seu-canal
          - generic [ref=e110]:
            - generic [ref=e111]:
              - img [ref=e112]: business
              - text: LinkedIn
            - textbox "LinkedIn" [ref=e113]:
              - /placeholder: https://linkedin.com/company/sua-empresa
          - generic [ref=e116]:
            - generic [ref=e117]:
              - img [ref=e118]: chat
              - text: Twitter / X
            - textbox "Twitter / X" [ref=e119]:
              - /placeholder: https://twitter.com/seu-usuario
          - generic [ref=e122]:
            - generic [ref=e123]:
              - img [ref=e124]: music_note
              - text: TikTok
            - textbox "TikTok" [ref=e125]:
              - /placeholder: https://tiktok.com/@seu-usuario
          - generic [ref=e128]:
            - generic [ref=e129]:
              - img [ref=e130]: phone
              - text: WhatsApp
            - textbox "WhatsApp" [ref=e131]:
              - /placeholder: 11 99999-9999
        - generic [ref=e134]:
          - button "Salvar Configurações" [ref=e135] [cursor=pointer]:
            - img [ref=e136]: save
            - text: Salvar Configurações
          - button "Limpar" [ref=e137] [cursor=pointer]:
            - img [ref=e138]: refresh
            - text: Limpar
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | import { loginAsAdmin } from './support/auth.helper';
  3   | 
  4   | test.describe('Configurações do Sistema', () => {
  5   |   test.beforeEach(async ({ page }) => {
  6   |     await loginAsAdmin(page);
  7   |     await page.goto('/config');
  8   |     await page.waitForURL('**/config');
  9   |     await page.waitForTimeout(500);
  10  |   });
  11  | 
  12  |   // ─── Estrutura da Página ──────────────────────────────────────────
  13  | 
  14  |   test('deve renderizar a página de configurações com header', async ({
  15  |     page,
  16  |   }) => {
  17  |     await expect(page.locator('h2')).toHaveText('Configurações do Sistema');
  18  |     await expect(
  19  |       page.locator('text=Gerencie as configurações gerais da aplicação'),
  20  |     ).toBeVisible();
  21  |   });
  22  | 
  23  |   // ─── Tabs ─────────────────────────────────────────────────────────
  24  | 
  25  |   test('deve renderizar as tabs principais', async ({ page }) => {
> 26  |     await expect(page.locator('text=Redes Sociais')).toBeVisible();
      |                                                      ^ Error: expect(locator).toBeVisible() failed
  27  |     await expect(page.locator('text=Configuração Home')).toBeVisible();
  28  |     await expect(page.locator('text=Manutenção')).toBeVisible();
  29  |   });
  30  | 
  31  |   test('deve ter Redes Sociais como tab ativa por padrão', async ({
  32  |     page,
  33  |   }) => {
  34  |     const socialTab = page.locator('button.tab-button:has-text("Redes Sociais")');
  35  |     await expect(socialTab).toHaveClass(/active/);
  36  |   });
  37  | 
  38  |   test('deve navegar entre tabs ao clicar', async ({ page }) => {
  39  |     // Clicar na tab "Configuração Home"
  40  |     await page.click('button.tab-button:has-text("Configuração Home")');
  41  |     await page.waitForTimeout(300);
  42  |     const homeTab = page.locator('button.tab-button:has-text("Configuração Home")');
  43  |     await expect(homeTab).toHaveClass(/active/);
  44  | 
  45  |     // Clicar na tab "Manutenção"
  46  |     await page.click('button.tab-button:has-text("Manutenção")');
  47  |     await page.waitForTimeout(300);
  48  |     const maintenanceTab = page.locator(
  49  |       'button.tab-button:has-text("Manutenção")',
  50  |     );
  51  |     await expect(maintenanceTab).toHaveClass(/active/);
  52  |   });
  53  | 
  54  |   // ─── Componentes de cada Tab ──────────────────────────────────────
  55  | 
  56  |   test('deve renderizar componente de Redes Sociais', async ({ page }) => {
  57  |     const socialMedia = page.locator('app-social-media');
  58  |     await expect(socialMedia).toBeVisible();
  59  |   });
  60  | 
  61  |   test('deve renderizar componente de Configuração Home ao clicar na tab', async ({
  62  |     page,
  63  |   }) => {
  64  |     await page.click('button.tab-button:has-text("Configuração Home")');
  65  |     await page.waitForTimeout(300);
  66  | 
  67  |     const homeConfig = page.locator('app-home-config');
  68  |     await expect(homeConfig).toBeVisible();
  69  |   });
  70  | 
  71  |   test('deve renderizar componente de Manutenção ao clicar na tab', async ({
  72  |     page,
  73  |   }) => {
  74  |     await page.click('button.tab-button:has-text("Manutenção")');
  75  |     await page.waitForTimeout(300);
  76  | 
  77  |     const maintenance = page.locator('app-maintenance');
  78  |     await expect(maintenance).toBeVisible();
  79  |   });
  80  | 
  81  |   // ─── Tab de Limpeza de Mídias (Admin) ─────────────────────────────
  82  | 
  83  |   test('deve exibir tab de Limpeza de Mídias para admin', async ({
  84  |     page,
  85  |   }) => {
  86  |     // O usuário admin@gazeta.com talvez não seja 'master@email.com',
  87  |     // então a tab pode não aparecer.
  88  |     // Verificar se a tab existe
  89  |     const cleanupTab = page.locator(
  90  |       'button.tab-button:has-text("Limpeza de Mídias")',
  91  |     );
  92  |     const isVisible = await cleanupTab.isVisible().catch(() => false);
  93  | 
  94  |     if (isVisible) {
  95  |       await cleanupTab.click();
  96  |       await page.waitForTimeout(300);
  97  |       const mediaCleanup = page.locator('app-media-cleanup');
  98  |       await expect(mediaCleanup).toBeVisible();
  99  |     }
  100 |   });
  101 | });
  102 | 
```