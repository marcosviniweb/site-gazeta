# 📋 Task List: Refatoração do Gerenciamento de Menu

Baseado no diagnóstico em `docs/menu-refactor.md`, a refatoração foi dividida nas seguintes sessões de execução. 

## Sessão 1: Correções Críticas (P0)
- [x] **O:** Sincronizar `internalRoutes` desatualizado (criar `menu-routes.config.ts`)
- [x] **M:** Adicionar `ChangeDetectionStrategy.OnPush` nos 4 componentes (`MenuComponent`, `MenuListComponent`, `MenuFormComponent`, `SubmenuFormComponent`)
- [x] **R:** Substituir `*ngIf` legado por `@if` e remover imports de `CommonModule`
- [x] **E:** Corrigir fechamento indevido do modal no `SubmenuFormComponent`

## Sessão 2: Correções Técnicas Base (P1)
- [x] **N:** Remover código morto (`moveToSubmenu`) e logs com emojis
- [x] **S:** Corrigir contrato de output `delete` no `MenuListComponent` para `EventEmitter<void>`
- [x] **T:** Remover header duplicado no modal de submenu (`g-section-header` interno)
- [x] **C:** Adicionar feedback de reordenação com alerta de sucesso/erro (Snackbar/AlertService) e estilo durante drag

## Sessão 3: Refatoração Estrutural (P1)
- [x] **P:** Eliminar duplicação entre `MenuForm` e `SubmenuForm` (Extrair `MenuFormLogicService` ou padronizar herança/composição)

## Sessão 4: UX e Comportamento (P1)
- [x] **A:** Tornar painel de formulário colapsável (condicional com botão flutuante para "Novo Menu")
- [x] **B:** Diferenciação visual clara entre modo "Criar" (fundo neutro, ícone add) e "Editar" (fundo azul suave, ícone edit)

## Sessão 5: Polimento Visual (P2)
- [x] **G:** Padronizar todos os ícones para `<mat-icon>` e remover material-icons font-based
- [x] **H:** Remover card com border/shadow aninhado no modal de submenu
- [x] **J:** Adicionar cores distintas aos badges de tipo de menu (página, link, categoria, submenu)
- [x] **F:** Criar empty state acionável quando não houver menus
- [x] **L:** Estilizar placeholder de drag and drop do CDK

## Sessão 6: Integrações Finais (P2)
- [x] **I:** Substituir `<select>` nativos por `p-select` PrimeNG (Aura theme)
- [x] **K:** Melhorar visualização do destino (mostrar chips de subitens em vez de "N item(ns)")
- [x] **Q:** Migrar `subscribe` manual de `loadMenus` para `toSignal()`
- [x] **D:** Adicionar preview dos subitens afetados no modal de exclusão
