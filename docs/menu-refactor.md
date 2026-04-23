# Plano de Refatoração UI/UX — Gerenciamento de Menu (painel-gazeta)

**Data:** 2026-04-23
**Branch:** feature/video-in-editor
**Autor:** Análise via Claude Code Orchestrator

---

## 1. Diagnóstico do Estado Atual

### 1.1 Estrutura de componentes

O módulo de menu é composto por quatro componentes:

- `MenuComponent` — shell da página; gerencia estado global e orquestra os filhos
- `MenuListComponent` — lista drag-and-drop dos itens de menu (usa `lib-drag-and-drop` com templates projetados)
- `MenuFormComponent` — formulário lateral fixo para criar/editar itens
- `SubmenuFormComponent` — formulário dentro de modal para gerenciar subitens

### 1.2 Problemas encontrados por camada

#### Layout e estrutura

- A página usa layout de dois painéis (lista à esquerda + formulário fixo à direita, `flex: 0 0 420px`). O painel de formulário fica sempre visível mesmo quando não há edição em curso. Isso desperdiça ~35% da área útil na maioria dos acessos.
- O estado de "criar novo" e "editar existente" são representados pelo mesmo formulário sem diferenciação visual clara — o usuário não tem indicação visual imediata de qual modo está ativo.
- No mobile, o formulário vai para o topo (`order: -1`) via CSS, mas o comportamento UX não foi pensado: o usuário precisa rolar para cima sempre que selecionar um item da lista para editar.
- O `sidebar-sticky` com `position: sticky; top: 0` não funciona da forma esperada dentro de um `overflow-y: auto` com pais de altura fixa — o sticky nunca se ativa na prática.

#### Formulário (`MenuFormComponent`)

- Usa `*ngIf` com `CommonModule` (sintaxe legada) para controles de loading dentro de formulário, misturado com `@if` moderno do Angular 17+. O componente importa `CommonModule` sendo standalone.
- O campo "Ordem de Exibição" é um `<input type="number">` editável pelo usuário, mas a ordem já é calculada automaticamente por `calculateNextOrder()`. O campo não deveria ser editável na criação, apenas na edição onde faz sentido.
- As rotas internas disponíveis são um array hard-coded (`internalRoutes`) com apenas 5 opções que não bate com as rotas reais definidas em `app.routes.ts` (faltam: `videos`, `videosList`, `users`, `config`, `ads`, `adsList`). **Bug funcional.**
- O formulário não tem título/heading claro que indique se está em modo criar ou editar — apenas o texto do botão de submit muda.
- O botão "Cancelar" em modo de criação não tem ação semântica clara.
- Validação de formulário tem inconsistência: `*ngIf="isLoading()"` e `*ngIf="!isLoading()"` para os ícones do botão de submit usam a sintaxe legada `*ngIf` em vez do `@if` moderno.
- O `effect()` no constructor do `MenuFormComponent` que recalcula a ordem pode disparar em loop caso `existingMenus` mude junto com `menuToEdit`.

#### Formulário de Submenu (`SubmenuFormComponent`)

- Duplica ~70% do código do `MenuFormComponent`: mesma lógica de `initForm`, `updateValidators`, `loadCategories`, `calculateNextOrder`, `createMultipleCategoryMenus`, rotas internas. Viola DRY e cria dois lugares para manter a mesma lógica.
- A lista de `internalRoutes` do submenu é ainda mais incompleta que a do form principal (apenas `/` e `/videos`).
- Tem `console.warn` e `console.error` com emojis (`⚠️`, `❌`) no código de produção.
- O `cancelEvent` é emitido após `saveEvent` no `submitForm`, efetivamente fechando sempre o modal ao salvar, apesar do comentário `// Não fechar o modal automaticamente` no componente pai. **Contradição entre comportamento implementado e desejado.**
- O header interno do `SubmenuFormComponent` (`g-section-header`) duplica estrutura já resolvida pelo `g-modal-header` que o pai (`MenuComponent`) já renderiza no modal — duplo cabeçalho desnecessário.

#### Lista (`MenuListComponent`)

- O output `delete` emite `number` (id), mas o pai (`MenuComponent.handleDelete`) ignora o valor e apenas chama `loadMenus()`. O output poderia ser `void`.
- O erro de reordenação (`saveOrder`) não exibe feedback ao usuário via `alertService` — apenas `console.error`. O usuário não sabe se a reordenação falhou.
- `moveToSubmenu` existe no componente mas está desabilitado na config (`canDropInParent: () => false`) e nunca é chamado. **Código morto.**
- O estado `isReordering` é local ao `MenuListComponent` mas o spinner de "Sincronizando" fica dentro do header da lista, sem propagação de erro ao componente pai.

#### Acessibilidade

- O `drag-handle-container` é um `<div>` clicável sem `role`, `aria-label` ou `tabindex`.
- O botão de toggle de submenu (`.toggle-btn`) não tem `aria-expanded` vinculado ao estado real `isExpanded`.
- Os botões de ação (edit, delete, config) têm apenas `title` como rótulo acessível — screen readers precisam de `aria-label`.
- `<select>` nativo para tipo de menu e rota interna — visualmente inconsistente com o design system PrimeNG que usa `p-dropdown` em outras partes do painel.

#### Performance e reatividade

- `MenuComponent`, `MenuListComponent`, `MenuFormComponent` e `SubmenuFormComponent` **não usam `ChangeDetectionStrategy.OnPush`**, violando o padrão definido no `CLAUDE.md` para todo o painel.
- `MenuComponent` usa `subscribe()` diretamente em vez de `toSignal()` do `@angular/core/rxjs-interop`.
- Cada save/delete dispara um `loadMenus()` completo (GET `/menu`), sem atualização otimista.

#### Design — inconsistências

- `MenuListComponent` usa `<mat-icon>` (via `MatIconModule`) enquanto `SubmenuFormComponent` usa `<span class="material-icons">` (font-based). **Mistura de duas formas do mesmo sistema de ícones.**
- O `.menu-form-sidebar` tem background `#fcfcfc` e `border-left: 1px solid var(--border)` — não usa as classes do design system (`g-crud-sidebar` já define exatamente esse padrão em `_crud-layout.scss`). **Código duplicado.**
- O `form-card` dentro do `SubmenuFormComponent` adiciona outro card com `border/shadow` dentro do modal, criando excesso visual de profundidade.

---

## 2. Melhorias Propostas

### 2.1 UX — Navegação e Fluxo

**[A] Painel de formulário como drawer condicional**
Tornar o painel lateral colapsável: oculto por padrão, aparece com animação ao clicar em "Novo Menu" ou "Editar". No modo recolhido, botão flutuante "+ Novo Menu" no canto superior direito da lista. Benefício: lista ganha 100% da largura, melhorando visualização da hierarquia.

**[B] Modo criação vs. edição com diferenciação visual explícita**
Header do painel muda por modo: criação → fundo neutro com ícone `add`; edição → fundo azul suave (`rgba(var(--accent-blue-rgb), 0.06)`) com ícone `edit` e nome do item exibido claramente.

**[C] Feedback inline na reordenação**
Durante o drag, aplicar `opacity: 0.7` nos demais itens e mostrar toast/snackbar de "Ordem salva" ao completar. Exibir alerta de erro via `alertService` quando a operação falhar (atualmente silencioso).

**[D] Confirmação de exclusão com preview de subitens**
Adicionar lista compacta com ícones dos subitens afetados no modal de exclusão, em vez de apenas exibir a quantidade.

**[E] Submenu modal: preservar estado entre saves**
Manter o modal aberto após salvar subitem. Exibir a lista atualizada imediatamente com badge/chip identificando o item recém-adicionado.

**[F] Empty state acionável**
Substituir "Nenhum menu cadastrado ainda." por um empty state com botão "+ Criar Primeiro Menu" que abre o painel de formulário diretamente.

### 2.2 UI — Visual e Design

**[G] Consistência de ícones**
Padronizar 100% dos componentes do módulo para `<mat-icon>` com `MatIconModule`. Remover todos os `<span class="material-icons">` do `SubmenuFormComponent`.

**[H] Remoção do card aninhado no SubmenuForm**
Remover o `form-card` com `border` e `box-shadow` de dentro do modal. Deixar o formulário flat dentro do `g-modal-body`, que já provê o container necessário.

**[I] Substituir `<select>` por PrimeNG Dropdown**
Substituir os campos de tipo de menu e rota interna por `p-dropdown` do PrimeNG para alinhamento visual com o restante do painel. O campo de tipo se beneficia de opções com ícone.

**[J] Badge de estado colorido por tipo**
Atribuir cores distintas ao badge de tipo: azul → página interna; laranja → link externo; verde → categoria; roxo → submenu. Atualmente todos são `.light` (cinza).

**[K] Visualização do destino melhorada**
Para tipo `category`, mostrar slug formatado como path. Para tipo `submenu`, mostrar chips mini dos nomes dos subitens (até 3) em vez de apenas "N item(ns)".

**[L] Placeholder de drag personalizado**
Adicionar estilo ao placeholder do CDK Drag Drop: `border: 2px dashed var(--accent-blue)` com background translúcido.

### 2.3 Melhorias Técnicas

**[M] `ChangeDetectionStrategy.OnPush` em todos os componentes**
Todos os 4 componentes do módulo estão sem `OnPush`. Como já usam Signals e inputs tipados, a adição é segura.

**[N] Remover código morto e console.logs de produção**
Remover `private moveToSubmenu()` do `MenuListComponent` (nunca chamado). Remover `console.warn`/`console.error` com emojis dos formulários.

**[O] Corrigir `internalRoutes` desatualizado**
Sincronizar as rotas hardcoded com `app.routes.ts`. Criar um arquivo de configuração compartilhado `menu-routes.config.ts` em vez de duplicar o array em dois componentes.

**[P] Eliminar duplicação entre `MenuFormComponent` e `SubmenuFormComponent`**
Extrair um serviço `MenuFormLogicService` (ou mixin) com: `initForm()`, `updateValidators()`, `calculateNextOrder()`, `createMultipleCategoryMenus()`. Ou refatorar `SubmenuFormComponent` para usar `MenuFormComponent` internamente com input `parentId`.

**[Q] Substituir `subscribe()` por `toSignal()`**
No `MenuComponent`, converter `loadMenus()` com `subscribe` manual para `Signal<Menu[]>` derivado com `toSignal()` + `Subject<void>` de reload trigger.

**[R] Corrigir sintaxe legada nos templates**
Substituir todos os `*ngIf` por `@if`. Remover import de `CommonModule` onde não há mais diretivas estruturais sendo usadas.

**[S] Corrigir contrato de output `delete`**
Mudar `delete = output<number>()` para `delete = output<void>()` no `MenuListComponent`, pois o pai nunca usa o valor emitido.

**[T] Remover header duplicado no modal de submenu**
`SubmenuFormComponent` renderiza um `g-section-header` próprio dentro do `g-modal-body`, mas o modal pai já tem `g-modal-header` com título "Gerenciar Submenu". Remover o header interno ou torná-lo condicional via `showInternalHeader = input(true)`.

---

## 3. Priorização

### P0 — Crítico (bugs funcionais ou violação de padrão obrigatório)

| ID | Item | Esforço |
|----|------|---------|
| O | Corrigir `internalRoutes` desatualizado — bug funcional | 30 min |
| M | Adicionar `OnPush` nos 4 componentes | 15 min |
| R | Migrar `*ngIf` legado para `@if` em todos os templates | 20 min |
| E | Corrigir fechamento indevido do modal após save de subitem | 20 min |

**Subtotal P0: ~1h30**

### P1 — Importante (qualidade, manutenibilidade, UX significativo)

| ID | Item | Esforço |
|----|------|---------|
| P | Eliminar duplicação MenuForm/SubmenuForm | 2-3h |
| A | Formulário como painel condicional (toggle) | 2h |
| B | Diferenciação visual criar vs. editar | 1h |
| C | Feedback de reordenação com alerta de sucesso/erro | 40 min |
| N | Remover código morto e `console.log` com emojis | 20 min |
| S | Corrigir contrato de output `delete` | 10 min |
| T | Remover header duplicado no modal de submenu | 30 min |

**Subtotal P1: ~8h**

### P2 — Nice-to-have (polimento de UX/UI)

| ID | Item | Esforço |
|----|------|---------|
| Q | Migrar `subscribe` manual para `toSignal()` | 1h |
| G | Padronizar ícones — apenas `<mat-icon>` | 30 min |
| I | Substituir `<select>` nativo por `p-dropdown` PrimeNG | 1-2h |
| J | Badges coloridos por tipo de menu | 30 min |
| K | Visualização de destino melhorada (chips de subitens) | 1h |
| L | Placeholder de drag personalizado | 30 min |
| H | Remover card aninhado no modal (dupla profundidade visual) | 15 min |
| D | Preview de subitens no modal de exclusão | 1h |
| F | Empty state acionável com CTA | 20 min |

**Subtotal P2: ~7h**

---

## 4. Total Estimado

| Prioridade | Esforço |
|------------|---------|
| P0 | ~1h30 |
| P1 | ~8h |
| P2 | ~7h |
| **Total** | **~16-17h** |

---

## 5. Arquivos Afetados

| Arquivo | Itens relacionados |
|---------|-------------------|
| `apps/painel-gazeta/src/app/pages/menu/menu.component.ts` | M, A, B, Q |
| `apps/painel-gazeta/src/app/pages/menu/menu.component.html` | A, B |
| `apps/painel-gazeta/src/app/pages/menu/menu.component.scss` | A |
| `apps/painel-gazeta/src/app/pages/menu/menu-list/menu-list.component.ts` | M, C, N, S |
| `apps/painel-gazeta/src/app/pages/menu/menu-list/menu-list.component.html` | R, J, K, L, F |
| `apps/painel-gazeta/src/app/pages/menu/menu-list/menu-list.component.scss` | J, K, L |
| `apps/painel-gazeta/src/app/pages/menu/menu-form/menu-form.component.ts` | O, R, M, P, I |
| `apps/painel-gazeta/src/app/pages/menu/menu-form/menu-form.component.html` | R, B, T, I |
| `apps/painel-gazeta/src/app/pages/menu/submenu-form/submenu-form.component.ts` | E, O, M, P, N, T |
| `apps/painel-gazeta/src/app/pages/menu/submenu-form/submenu-form.component.html` | R, E, T |
| `apps/painel-gazeta/src/app/pages/menu/submenu-form/submenu-form.component.scss` | T, H |
| `apps/painel-gazeta/src/app/pages/menu/menu-routes.config.ts` *(novo)* | O |

---

## 6. Recomendação de Execução

1. **Sessão 1** — Implementar todos os P0 (~1h30). São independentes entre si e podem ser feitos em sequência simples.
2. **Sessão 2** — Implementar P1 técnicos (N, S, T, C) que não afetam a estrutura (~1h40). Preparar o terreno antes das mudanças arquiteturais.
3. **Sessão 3** — Extrair lógica compartilhada (P) — a mudança de maior risco, requer testes após. (~2-3h)
4. **Sessão 4** — Implementar painel condicional (A) e diferenciação visual (B). (~3h)
5. **Sessão 5** — P2 desejados, começando pelos de menor risco (G, H, J, F, L). (~2h)
6. **Sessão 6** — P2 com maior risco de regressão (I — PrimeNG Dropdown, Q — toSignal). (~3h)
