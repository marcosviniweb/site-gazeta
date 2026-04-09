# Escopo do Projeto: Escalabilidade no Exclude IDs

## 1. O Problema Atual (Stateful Race Condition)
Os componentes do layout possuem chamadas independentes que disparam assim que entram em viewport (defer). Uma vez na tela (viewport simulado ou rápido scroll), requisições paralelas correm na rede, anulando a funcionalidade do interceptor que tenta barrar "repetições" baseadas num delay temporal de exclusões. 

## 2. Meta Arquitetural
Refatorar a busca e bloqueio de notícias repetidas na home page priorizando **Escalabilidade**. O desenvolvimento de "novos" componentes deve ser um processo isento de regras condicionais engessadas na home, com lógica centralizada.

## 3. Caminhos Analisados
*(Aguardando Resposta do Usuário no Socratic Gate Chat para definir a Rota Definitiva - Interceptor Priority Queue vs Global Store)*

### Opção Escolhida: Centralized Signals State (Store Orchestrator)
A migração da arquitetura atual para um modelo de estado centralizado via Signals e Services (Padrão Unidirectional Data Flow).

#### Por que é a mais robusta?
1. **Fim das Race Conditions:** Em vez da rede decidir na sorte qual request responde primeiro, o Orquestrador monta um fluxo exato. Nada é processado fora de ordem.
2. **Amigo do SSR (Server-Side Rendering):** O servidor monta o estado principal da página em uma fração do tempo por não ter "cascatas HTTP" (Waterfalls), entregando a home instantaneamente para o SEO e Client Hydration.
3. **Escalável de Verdade (Dumb Components):** Hoje o componente (ex: `NewsHighligthsComponent`) tem a responsabilidade de ir buscar o dado e gerenciar estado de erro ("Smart Component"). Com um State Management ele apenas recebe os dados já processados (Signal input/computed).
4. **Responsabilidade Segregada:** Retira a complexidade absurda do `excludeNewsInterceptor` (que mistura rede com regras de negócio) e coloca no Orquestrador.

## 4. Etapas de Refatoração

### Passo 1: O Orquestrador (HomeCentralStore)
- Criar `HomeNewsOrchestratorService`.
- Ele vai conter um `Signal` com o cache central de "IDs já exibidos".
- Método central que recebe um pedido (Ex: `getCategoryHighlights()`), bloqueia as duplicatas em RAM e atualiza o estado central dele de forma controlada.

### Passo 2: Limpa Interceptors
- Remover o parâmetro genérico `exclude` de todas as chamadas HTTP cruas nos controllers comuns, pois a exclusão passa a ser feita em memória no Store, antes de renderizar (ou via cache local controlado pelo Service).

### Passo 3: Limpeza nos Componentes (Dumb Components)
- Retirar a injeção do `ApiConfigService` dos componentes filhos da home (Carousel, Category-Grid, Highlights, MoreNews).
- Injetar o novo `HomeNewsOrchestratorService` e vincular os valores ao Signal correspondente.

### Passo 4: Implementação no `More News`
- O `More News` ganha a instrução de apenas "puxar a sobra" baseada no status das "prateleiras" principais. Como a lógica está num lugar só, o `More News` pode usar paginação ignorando tudo que os de cima já pegaram com 100% de garantia de integridade.
