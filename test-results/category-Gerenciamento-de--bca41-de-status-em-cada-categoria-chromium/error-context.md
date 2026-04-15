# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: category.spec.ts >> Gerenciamento de Categorias >> deve exibir toggle de status em cada categoria
- Location: src\category.spec.ts:139:7

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator:  locator('.category-card').first().locator('.g-toggle input[type="checkbox"]')
Expected: visible
Received: hidden
Timeout:  5000ms

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('.category-card').first().locator('.g-toggle input[type="checkbox"]')
    9 × locator resolved to <input id="toggle-39" type="checkbox" _ngcontent-ng-c213608612=""/>
      - unexpected value "hidden"

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
        - heading "Gerenciar Categorias" [level=2] [ref=e70]
        - paragraph [ref=e71]: Crie e gerencie as categorias de notícias
    - generic [ref=e73]:
      - generic [ref=e76]:
        - generic [ref=e77]:
          - generic [ref=e78]: Nome da Categoria *
          - textbox "Nome da Categoria *" [ref=e79]:
            - /placeholder: "Ex: Política, Esportes..."
        - generic [ref=e80]:
          - generic [ref=e81]: Descrição *
          - textbox "Descrição *" [ref=e82]:
            - /placeholder: Breve descrição da categoria
        - generic [ref=e83]:
          - generic [ref=e84]: Cor da Categoria *
          - generic [ref=e87] [cursor=pointer]:
            - generic [ref=e89]: "#ef4444"
            - img [ref=e90]
          - generic [ref=e92]: error Esta cor já está sendo utilizada por outra categoria
        - generic [ref=e93]:
          - generic [ref=e94]: Status
          - generic [ref=e97] [cursor=pointer]: Ativa
        - generic [ref=e99]:
          - button "Criar Categoria" [disabled]:
            - img: add_circle
            - text: Criar Categoria
      - generic [ref=e103]:
        - generic [ref=e104]:
          - generic [ref=e105]:
            - img: search
            - textbox "Pesquisar categoria..." [ref=e106]
          - combobox [ref=e108]:
            - option "Mais recente" [selected]
            - option "Mais antigo"
          - combobox [ref=e110]:
            - option "Todos os status" [selected]
            - option "Ativos"
            - option "Inativos"
        - generic [ref=e112]:
          - generic [ref=e115]:
            - generic [ref=e116]:
              - heading "AGRO" [level=4] [ref=e117]
              - paragraph
            - generic [ref=e118]:
              - generic [ref=e121] [cursor=pointer]: Ativa
              - generic [ref=e122]:
                - button "Editar" [ref=e123] [cursor=pointer]:
                  - img [ref=e124]: edit
                - button "Excluir" [ref=e125] [cursor=pointer]:
                  - img [ref=e126]: delete
          - generic [ref=e129]:
            - generic [ref=e130]:
              - heading "TEMPO / CLIMA" [level=4] [ref=e131]
              - paragraph
            - generic [ref=e132]:
              - generic [ref=e135] [cursor=pointer]: Ativa
              - generic [ref=e136]:
                - button "Editar" [ref=e137] [cursor=pointer]:
                  - img [ref=e138]: edit
                - button "Excluir" [ref=e139] [cursor=pointer]:
                  - img [ref=e140]: delete
          - generic [ref=e143]:
            - generic [ref=e144]:
              - heading "PESQUISA" [level=4] [ref=e145]
              - paragraph
            - generic [ref=e146]:
              - generic [ref=e149] [cursor=pointer]: Ativa
              - generic [ref=e150]:
                - button "Editar" [ref=e151] [cursor=pointer]:
                  - img [ref=e152]: edit
                - button "Excluir" [ref=e153] [cursor=pointer]:
                  - img [ref=e154]: delete
          - generic [ref=e157]:
            - generic [ref=e158]:
              - heading "FRAUDE" [level=4] [ref=e159]
              - paragraph
            - generic [ref=e160]:
              - generic [ref=e163] [cursor=pointer]: Ativa
              - generic [ref=e164]:
                - button "Editar" [ref=e165] [cursor=pointer]:
                  - img [ref=e166]: edit
                - button "Excluir" [ref=e167] [cursor=pointer]:
                  - img [ref=e168]: delete
          - generic [ref=e171]:
            - generic [ref=e172]:
              - heading "MUNDO" [level=4] [ref=e173]
              - paragraph
            - generic [ref=e174]:
              - generic [ref=e177] [cursor=pointer]: Ativa
              - generic [ref=e178]:
                - button "Editar" [ref=e179] [cursor=pointer]:
                  - img [ref=e180]: edit
                - button "Excluir" [ref=e181] [cursor=pointer]:
                  - img [ref=e182]: delete
          - generic [ref=e185]:
            - generic [ref=e186]:
              - heading "Concursos públicos" [level=4] [ref=e187]
              - paragraph
            - generic [ref=e188]:
              - generic [ref=e191] [cursor=pointer]: Ativa
              - generic [ref=e192]:
                - button "Editar" [ref=e193] [cursor=pointer]:
                  - img [ref=e194]: edit
                - button "Excluir" [ref=e195] [cursor=pointer]:
                  - img [ref=e196]: delete
          - generic [ref=e199]:
            - generic [ref=e200]:
              - heading "JUSTIÇA" [level=4] [ref=e201]
              - paragraph
            - generic [ref=e202]:
              - generic [ref=e205] [cursor=pointer]: Ativa
              - generic [ref=e206]:
                - button "Editar" [ref=e207] [cursor=pointer]:
                  - img [ref=e208]: edit
                - button "Excluir" [ref=e209] [cursor=pointer]:
                  - img [ref=e210]: delete
          - generic [ref=e213]:
            - generic [ref=e214]:
              - heading "Nota de Solidariedade" [level=4] [ref=e215]
              - paragraph [ref=e216]: Mensagens de apoio, empatia e ajuda para quem precisa.
            - generic [ref=e217]:
              - generic [ref=e220] [cursor=pointer]: Ativa
              - generic [ref=e221]:
                - button "Editar" [ref=e222] [cursor=pointer]:
                  - img [ref=e223]: edit
                - button "Excluir" [ref=e224] [cursor=pointer]:
                  - img [ref=e225]: delete
          - generic [ref=e228]:
            - generic [ref=e229]:
              - heading "MUSICA" [level=4] [ref=e230]
              - paragraph
            - generic [ref=e231]:
              - generic [ref=e234] [cursor=pointer]: Ativa
              - generic [ref=e235]:
                - button "Editar" [ref=e236] [cursor=pointer]:
                  - img [ref=e237]: edit
                - button "Excluir" [ref=e238] [cursor=pointer]:
                  - img [ref=e239]: delete
          - generic [ref=e242]:
            - generic [ref=e243]:
              - heading "TRÂNSITO" [level=4] [ref=e244]
              - paragraph
            - generic [ref=e245]:
              - generic [ref=e248] [cursor=pointer]: Ativa
              - generic [ref=e249]:
                - button "Editar" [ref=e250] [cursor=pointer]:
                  - img [ref=e251]: edit
                - button "Excluir" [ref=e252] [cursor=pointer]:
                  - img [ref=e253]: delete
          - generic [ref=e256]:
            - generic [ref=e257]:
              - heading "EMPREGO" [level=4] [ref=e258]
              - paragraph
            - generic [ref=e259]:
              - generic [ref=e262] [cursor=pointer]: Ativa
              - generic [ref=e263]:
                - button "Editar" [ref=e264] [cursor=pointer]:
                  - img [ref=e265]: edit
                - button "Excluir" [ref=e266] [cursor=pointer]:
                  - img [ref=e267]: delete
          - generic [ref=e270]:
            - generic [ref=e271]:
              - heading "Religião" [level=4] [ref=e272]
              - paragraph [ref=e273]: Espaço dedicado a conteúdos relacionados à fé, espiritualidade e manifestações religiosas presentes no Pará e no Brasil. Nesta categoria, o leitor encontra notícias sobre eventos religiosos, celebrações, festividades, mensagens de líderes espirituais, ações sociais promovidas por igrejas e temas que fortalecem valores e tradições religiosas.
            - generic [ref=e274]:
              - generic [ref=e277] [cursor=pointer]: Ativa
              - generic [ref=e278]:
                - button "Editar" [ref=e279] [cursor=pointer]:
                  - img [ref=e280]: edit
                - button "Excluir" [ref=e281] [cursor=pointer]:
                  - img [ref=e282]: delete
          - generic [ref=e285]:
            - generic [ref=e286]:
              - heading "Nota de Pesar" [level=4] [ref=e287]
              - paragraph [ref=e288]: Espaço destinado à publicação de notas oficiais de pesar, pronunciamentos de luto e manifestações de condolências emitidas pelo Gazeta do Pará, autoridades, instituições ou pela comunidade. Nesta categoria, registramos homenagens, reconhecimento e solidariedade às famílias enlutadas.
            - generic [ref=e289]:
              - generic [ref=e292] [cursor=pointer]: Ativa
              - generic [ref=e293]:
                - button "Editar" [ref=e294] [cursor=pointer]:
                  - img [ref=e295]: edit
                - button "Excluir" [ref=e296] [cursor=pointer]:
                  - img [ref=e297]: delete
          - generic [ref=e300]:
            - generic [ref=e301]:
              - heading "Utilidade Pública" [level=4] [ref=e302]
              - paragraph [ref=e303]: Publicações destinadas a informar a população sobre serviços, avisos, orientações e ações de interesse coletivo. Inclui atendimentos itinerantes, campanhas, atualizações de serviços essenciais e comunicados oficiais.
            - generic [ref=e304]:
              - generic [ref=e307] [cursor=pointer]: Ativa
              - generic [ref=e308]:
                - button "Editar" [ref=e309] [cursor=pointer]:
                  - img [ref=e310]: edit
                - button "Excluir" [ref=e311] [cursor=pointer]:
                  - img [ref=e312]: delete
          - generic [ref=e315]:
            - generic [ref=e316]:
              - heading "POLÊMICA" [level=4] [ref=e317]
              - paragraph
            - generic [ref=e318]:
              - generic [ref=e321] [cursor=pointer]: Ativa
              - generic [ref=e322]:
                - button "Editar" [ref=e323] [cursor=pointer]:
                  - img [ref=e324]: edit
                - button "Excluir" [ref=e325] [cursor=pointer]:
                  - img [ref=e326]: delete
          - generic [ref=e329]:
            - generic [ref=e330]:
              - heading "DESTAQUE" [level=4] [ref=e331]
              - paragraph
            - generic [ref=e332]:
              - generic [ref=e335] [cursor=pointer]: Ativa
              - generic [ref=e336]:
                - button "Editar" [ref=e337] [cursor=pointer]:
                  - img [ref=e338]: edit
                - button "Excluir" [ref=e339] [cursor=pointer]:
                  - img [ref=e340]: delete
          - generic [ref=e343]:
            - generic [ref=e344]:
              - heading "AGENDA CULTURAL" [level=4] [ref=e345]
              - paragraph [ref=e346]: Programação de shows, festas, apresentações, datas comemorativas e eventos que movimentam a cidade.
            - generic [ref=e347]:
              - generic [ref=e350] [cursor=pointer]: Ativa
              - generic [ref=e351]:
                - button "Editar" [ref=e352] [cursor=pointer]:
                  - img [ref=e353]: edit
                - button "Excluir" [ref=e354] [cursor=pointer]:
                  - img [ref=e355]: delete
          - generic [ref=e358]:
            - generic [ref=e359]:
              - heading "HOMENAGENS" [level=4] [ref=e360]
              - paragraph [ref=e361]: Mensagens de parabéns, homenagens, celebrações de datas especiais e reconhecimentos a personalidades da cidade e da região.
            - generic [ref=e362]:
              - generic [ref=e365] [cursor=pointer]: Ativa
              - generic [ref=e366]:
                - button "Editar" [ref=e367] [cursor=pointer]:
                  - img [ref=e368]: edit
                - button "Excluir" [ref=e369] [cursor=pointer]:
                  - img [ref=e370]: delete
          - generic [ref=e373]:
            - generic [ref=e374]:
              - heading "POLÍCIA" [level=4] [ref=e375]
              - paragraph [ref=e376]: Últimas notícias e ocorrências policiais, investigações, prisões, casos de violência, segurança pública e ações das forças policiais na região.
            - generic [ref=e377]:
              - generic [ref=e380] [cursor=pointer]: Ativa
              - generic [ref=e381]:
                - button "Editar" [ref=e382] [cursor=pointer]:
                  - img [ref=e383]: edit
                - button "Excluir" [ref=e384] [cursor=pointer]:
                  - img [ref=e385]: delete
          - generic [ref=e388]:
            - generic [ref=e389]:
              - heading "Meio Ambiente" [level=4] [ref=e390]
              - paragraph [ref=e391]: Últimas notícias e estudos sobre meio ambiente e ecologia, vídeos e fotos sobre bichos e animais, além da previsão do tempo.
            - generic [ref=e392]:
              - generic [ref=e395] [cursor=pointer]: Ativa
              - generic [ref=e396]:
                - button "Editar" [ref=e397] [cursor=pointer]:
                  - img [ref=e398]: edit
                - button "Excluir" [ref=e399] [cursor=pointer]:
                  - img [ref=e400]: delete
          - generic [ref=e403]:
            - generic [ref=e404]:
              - heading "Educação" [level=4] [ref=e405]
              - paragraph [ref=e406]: Notícias sobre educação, ensino e desenvolvimento acadêmico
            - generic [ref=e407]:
              - generic [ref=e410] [cursor=pointer]: Ativa
              - generic [ref=e411]:
                - button "Editar" [ref=e412] [cursor=pointer]:
                  - img [ref=e413]: edit
                - button "Excluir" [ref=e414] [cursor=pointer]:
                  - img [ref=e415]: delete
          - generic [ref=e418]:
            - generic [ref=e419]:
              - heading "Cultura" [level=4] [ref=e420]
              - paragraph [ref=e421]: Arte, música, cinema, literatura e eventos culturais
            - generic [ref=e422]:
              - generic [ref=e425] [cursor=pointer]: Ativa
              - generic [ref=e426]:
                - button "Editar" [ref=e427] [cursor=pointer]:
                  - img [ref=e428]: edit
                - button "Excluir" [ref=e429] [cursor=pointer]:
                  - img [ref=e430]: delete
          - generic [ref=e433]:
            - generic [ref=e434]:
              - heading "Saúde" [level=4] [ref=e435]
              - paragraph [ref=e436]: Informações sobre saúde, medicina e bem-estar
            - generic [ref=e437]:
              - generic [ref=e440] [cursor=pointer]: Ativa
              - generic [ref=e441]:
                - button "Editar" [ref=e442] [cursor=pointer]:
                  - img [ref=e443]: edit
                - button "Excluir" [ref=e444] [cursor=pointer]:
                  - img [ref=e445]: delete
          - generic [ref=e448]:
            - generic [ref=e449]:
              - heading "Política" [level=4] [ref=e450]
              - paragraph [ref=e451]: Notícias e análises sobre o cenário político local, estadual e nacional
            - generic [ref=e452]:
              - generic [ref=e455] [cursor=pointer]: Ativa
              - generic [ref=e456]:
                - button "Editar" [ref=e457] [cursor=pointer]:
                  - img [ref=e458]: edit
                - button "Excluir" [ref=e459] [cursor=pointer]:
                  - img [ref=e460]: delete
          - generic [ref=e463]:
            - generic [ref=e464]:
              - heading "Economia" [level=4] [ref=e465]
              - paragraph [ref=e466]: Notícias sobre economia, mercado financeiro e negócios
            - generic [ref=e467]:
              - generic [ref=e470] [cursor=pointer]: Ativa
              - generic [ref=e471]:
                - button "Editar" [ref=e472] [cursor=pointer]:
                  - img [ref=e473]: edit
                - button "Excluir" [ref=e474] [cursor=pointer]:
                  - img [ref=e475]: delete
          - generic [ref=e478]:
            - generic [ref=e479]:
              - heading "Entretenimento" [level=4] [ref=e480]
              - paragraph [ref=e481]: Fique por dentro de tudo
            - generic [ref=e482]:
              - generic [ref=e485] [cursor=pointer]: Ativa
              - generic [ref=e486]:
                - button "Editar" [ref=e487] [cursor=pointer]:
                  - img [ref=e488]: edit
                - button "Excluir" [ref=e489] [cursor=pointer]:
                  - img [ref=e490]: delete
          - generic [ref=e493]:
            - generic [ref=e494]:
              - heading "Tecnologia" [level=4] [ref=e495]
              - paragraph [ref=e496]: As maiores novidades da tecnologia
            - generic [ref=e497]:
              - generic [ref=e500] [cursor=pointer]: Ativa
              - generic [ref=e501]:
                - button "Editar" [ref=e502] [cursor=pointer]:
                  - img [ref=e503]: edit
                - button "Excluir" [ref=e504] [cursor=pointer]:
                  - img [ref=e505]: delete
          - generic [ref=e508]:
            - generic [ref=e509]:
              - heading "Esportes" [level=4] [ref=e510]
              - paragraph [ref=e511]: Tudo sobre os esportes
            - generic [ref=e512]:
              - generic [ref=e515] [cursor=pointer]: Ativa
              - generic [ref=e516]:
                - button "Editar" [ref=e517] [cursor=pointer]:
                  - img [ref=e518]: edit
                - button "Excluir" [ref=e519] [cursor=pointer]:
                  - img [ref=e520]: delete
          - generic [ref=e523]:
            - generic [ref=e524]:
              - heading "Tucuruí" [level=4] [ref=e525]
              - paragraph [ref=e526]: Todas as noticias sobre Tucuruí e região
            - generic [ref=e527]:
              - generic [ref=e530] [cursor=pointer]: Inativa
              - generic [ref=e531]:
                - button "Editar" [ref=e532] [cursor=pointer]:
                  - img [ref=e533]: edit
                - button "Excluir" [ref=e534] [cursor=pointer]:
                  - img [ref=e535]: delete
```

# Test source

```ts
  45  |     await expect(submitBtn).toBeDisabled();
  46  |   });
  47  | 
  48  |   test('deve exibir erro de validação ao submeter campo vazio', async ({
  49  |     page,
  50  |   }) => {
  51  |     // Focar e desfocar o campo nome para disparar a validação
  52  |     await page.click('#name');
  53  |     await page.click('#description');
  54  |     await page.click('#name');
  55  | 
  56  |     // Verificar se algum erro de campo aparece
  57  |     const fieldError = page.locator('.g-field-error');
  58  |     if ((await fieldError.count()) > 0) {
  59  |       await expect(fieldError.first()).toBeVisible();
  60  |     }
  61  |   });
  62  | 
  63  |   // ─── Lista de Categorias ──────────────────────────────────────────
  64  | 
  65  |   test('deve renderizar lista de categorias ou estado vazio', async ({
  66  |     page,
  67  |   }) => {
  68  |     const categoryList = page.locator('app-category-list');
  69  |     await expect(categoryList).toBeVisible({ timeout: 10000 });
  70  | 
  71  |     // Verificar se tem categorias ou estado vazio
  72  |     const cards = page.locator('.category-card');
  73  |     const emptyState = page.locator('.g-empty-state');
  74  | 
  75  |     const hasCards = (await cards.count()) > 0;
  76  |     const hasEmpty = await emptyState.isVisible().catch(() => false);
  77  | 
  78  |     expect(hasCards || hasEmpty).toBeTruthy();
  79  |   });
  80  | 
  81  |   test('deve exibir cards de categoria com informações corretas', async ({
  82  |     page,
  83  |   }) => {
  84  |     const cards = page.locator('.category-card');
  85  |     await page.waitForTimeout(2000);
  86  | 
  87  |     if ((await cards.count()) > 0) {
  88  |       const firstCard = cards.first();
  89  | 
  90  |       // Cada card deve ter nome, descrição, barra colorida e ações
  91  |       await expect(firstCard.locator('h4')).toBeVisible();
  92  |       await expect(firstCard.locator('.color-stripe')).toBeVisible();
  93  |       await expect(firstCard.locator('.g-manage-actions')).toBeVisible();
  94  |     }
  95  |   });
  96  | 
  97  |   // ─── Filtros de Categoria ─────────────────────────────────────────
  98  | 
  99  |   test('deve exibir filtros de busca e ordenação quando há categorias', async ({
  100 |     page,
  101 |   }) => {
  102 |     const cards = page.locator('.category-card');
  103 |     await page.waitForTimeout(2000);
  104 | 
  105 |     if ((await cards.count()) > 0) {
  106 |       await expect(page.locator('.g-filters-container')).toBeVisible();
  107 |       await expect(
  108 |         page.locator('input[placeholder="Pesquisar categoria..."]'),
  109 |       ).toBeVisible();
  110 |     }
  111 |   });
  112 | 
  113 |   test('deve filtrar categorias por texto de busca', async ({ page }) => {
  114 |     const cards = page.locator('.category-card');
  115 |     await page.waitForTimeout(2000);
  116 | 
  117 |     if ((await cards.count()) > 1) {
  118 |       const firstCategoryName = await cards
  119 |         .first()
  120 |         .locator('h4')
  121 |         .textContent();
  122 | 
  123 |       // Buscar pelo nome da primeira categoria
  124 |       await page.fill(
  125 |         'input[placeholder="Pesquisar categoria..."]',
  126 |         firstCategoryName!.substring(0, 3),
  127 |       );
  128 |       await page.waitForTimeout(300);
  129 | 
  130 |       // Deve filtrar os resultados
  131 |       const filteredCards = page.locator('.category-card');
  132 |       const filteredCount = await filteredCards.count();
  133 |       expect(filteredCount).toBeGreaterThan(0);
  134 |     }
  135 |   });
  136 | 
  137 |   // ─── Toggle de Status ─────────────────────────────────────────────
  138 | 
  139 |   test('deve exibir toggle de status em cada categoria', async ({ page }) => {
  140 |     const cards = page.locator('.category-card');
  141 |     await page.waitForTimeout(2000);
  142 | 
  143 |     if ((await cards.count()) > 0) {
  144 |       const toggle = cards.first().locator('.g-toggle input[type="checkbox"]');
> 145 |       await expect(toggle).toBeVisible();
      |                            ^ Error: expect(locator).toBeVisible() failed
  146 |     }
  147 |   });
  148 | 
  149 |   // ─── Edição de Categoria ──────────────────────────────────────────
  150 | 
  151 |   test('deve carregar dados no formulário ao clicar em editar', async ({
  152 |     page,
  153 |   }) => {
  154 |     const cards = page.locator('.category-card');
  155 |     await page.waitForTimeout(2000);
  156 | 
  157 |     if ((await cards.count()) > 0) {
  158 |       const editBtn = cards.first().locator('button[title="Editar"]');
  159 |       await editBtn.click();
  160 |       await page.waitForTimeout(500);
  161 | 
  162 |       // Formulário deve ter dados preenchidos
  163 |       const nameInput = page.locator('#name');
  164 |       const nameValue = await nameInput.inputValue();
  165 |       expect(nameValue).toBeTruthy();
  166 | 
  167 |       // Botão deve mudar para "Atualizar"
  168 |       await expect(
  169 |         page.locator('button[type="submit"]:has-text("Atualizar")'),
  170 |       ).toBeVisible();
  171 | 
  172 |       // Botão cancelar deve aparecer
  173 |       await expect(page.locator('text=Cancelar')).toBeVisible();
  174 |     }
  175 |   });
  176 | 
  177 |   test('deve cancelar a edição e limpar o formulário', async ({ page }) => {
  178 |     const cards = page.locator('.category-card');
  179 |     await page.waitForTimeout(2000);
  180 | 
  181 |     if ((await cards.count()) > 0) {
  182 |       // Entrar em modo edição
  183 |       const editBtn = cards.first().locator('button[title="Editar"]');
  184 |       await editBtn.click();
  185 |       await page.waitForTimeout(500);
  186 | 
  187 |       // Clicar em cancelar
  188 |       await page.click('button:has-text("Cancelar")');
  189 |       await page.waitForTimeout(300);
  190 | 
  191 |       // Formulário deve voltar ao estado de criação
  192 |       await expect(
  193 |         page.locator('button[type="submit"]:has-text("Criar Categoria")'),
  194 |       ).toBeVisible();
  195 |     }
  196 |   });
  197 | 
  198 |   // ─── Modal de Exclusão ────────────────────────────────────────────
  199 | 
  200 |   test('deve abrir modal de confirmação ao clicar em excluir', async ({
  201 |     page,
  202 |   }) => {
  203 |     const cards = page.locator('.category-card');
  204 |     await page.waitForTimeout(2000);
  205 | 
  206 |     if ((await cards.count()) > 0) {
  207 |       const deleteBtn = cards.first().locator('button[title="Excluir"]');
  208 |       await deleteBtn.click();
  209 | 
  210 |       // Modal deve aparecer
  211 |       await expect(page.locator('.g-modal-overlay')).toBeVisible();
  212 |       await expect(page.locator('.g-modal-confirm-container')).toBeVisible();
  213 |       await expect(page.locator('text=Confirmar Exclusão')).toBeVisible();
  214 |       await expect(
  215 |         page.locator('text=Esta ação não pode ser desfeita.'),
  216 |       ).toBeVisible();
  217 | 
  218 |       // Botões do modal
  219 |       await expect(page.locator('button.btn-cancel')).toBeVisible();
  220 |       await expect(page.locator('button.btn-confirm.danger')).toBeVisible();
  221 |     }
  222 |   });
  223 | 
  224 |   test('deve fechar modal de exclusão ao clicar em Cancelar', async ({
  225 |     page,
  226 |   }) => {
  227 |     const cards = page.locator('.category-card');
  228 |     await page.waitForTimeout(2000);
  229 | 
  230 |     if ((await cards.count()) > 0) {
  231 |       const deleteBtn = cards.first().locator('button[title="Excluir"]');
  232 |       await deleteBtn.click();
  233 | 
  234 |       await expect(page.locator('.g-modal-overlay')).toBeVisible();
  235 |       await page.click('button.btn-cancel');
  236 |       await expect(page.locator('.g-modal-overlay')).not.toBeVisible();
  237 |     }
  238 |   });
  239 | 
  240 |   test('deve fechar modal ao clicar no overlay', async ({ page }) => {
  241 |     const cards = page.locator('.category-card');
  242 |     await page.waitForTimeout(2000);
  243 | 
  244 |     if ((await cards.count()) > 0) {
  245 |       const deleteBtn = cards.first().locator('button[title="Excluir"]');
```