# Plano de Implementação - Fase 1: Lista de Notícias

Este plano foca na modernização da lista de notícias no painel administrativo, adicionando paginação, controle de massa e busca otimizada via backend.

## Propostas de Mudança

### Backend (apps/backend-gazeta)

#### [MODIFY] [news-query.dto.ts](file:///d:/Projetos/site-gazeta/apps/backend-gazeta/src/news/dto/news-query.dto.ts)
- Adicionar campos `page` e `limit` opcionais.

#### [MODIFY] [news-query.controller.ts](file:///d:/Projetos/site-gazeta/apps/backend-gazeta/src/news/query/news-query.controller.ts)
- Atualizar o método `findAll` para aceitar parâmetros de paginação.
- Mudar o tipo de retorno para incluir metadados.

#### [MODIFY] [news-query.service.ts](file:///d:/Projetos/site-gazeta/apps/backend-gazeta/src/news/query/news-query.service.ts)
- Implementar a lógica de `skip` e `take` do Prisma.
- Adicionar contagem total de registros para os metadados.

### Frontend (apps/painel-gazeta)

#### [MODIFY] [news.service.ts](file:///d:/Projetos/site-gazeta/apps/painel-gazeta/src/app/core/services/news.service.ts)
- Atualizar interfaces de retorno e métodos de busca/listagem para suportar a nova estrutura de dados paginada.

#### [MODIFY] [news-list.component.ts](file:///d:/Projetos/site-gazeta/apps/painel-gazeta/src/app/pages/news/news-list/news-list.component.ts)
- Implementar **Spinner** para estado de carregamento (`isLoading`).
- Adicionar sistema de **Seleção em Massa** (checkbox geral e individual) inspirado no `MediaCleanupComponent`.
- Implementar **Busca Debounced** (300ms-500ms) para evitar excesso de requisições ao digitar.
- Adicionar controles de **Paginação** (Anterior/Próximo) e exibição de progresso (ex: "Mostrando 1-25 de 100").
- Adicionar **Ações em Massa** (Mover para lixeira, Alterar status, Alterar destaque).

#### [MODIFY] [news-list.component.html](file:///d:/Projetos/site-gazeta/apps/painel-gazeta/src/app/pages/news/news-list/news-list.component.html)
- Atualizar o layout para incluir checkboxes, spinner e controles de paginação.

## Plano de Verificação

### Testes Manuais
- Verificar se a lista carrega exatamente 25 notícias por vez.
- Testar a busca e conferir no Network se a requisição é feita com debounce.
- Testar a seleção de múltiplas notícias e aplicar uma ação (ex: mudar status) em todas simultaneamente.
- Validar se o Spinner aparece e desaparece corretamente.
