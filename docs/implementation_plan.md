# Plano de Mapeamento e Correção de Endpoints

Este plano detalha a análise das conexões entre o `backend-gazeta` e o `painel-gazeta`, identificando falhas de comunicação e desalinhamentos de lógica de negócio.

## Status da Implementação: [CONCLUÍDO]

> [!NOTE]
> As ondas 1, 2, 3 e 4 foram concluídas. A lógica de negócio foi centralizada no backend e o painel foi otimizado para performance e gestão de status. Os testes foram implementados.

## Decisões Tomadas

- **Vídeos**: Payload padronizado para `JSON` (links externos), com controller refatorado no backend.
- **Destaques**: Lógica de limite (6 itens) movida para o `NewsCoreService` no backend com execução atômica.
- **Lixeira**: Implementada via sistema de abas de status no `NewsListComponent` para melhor UX e agilidade.
- **Performance**: Upload de mídias refatorado para execução paralela (RxJS `mergeMap`).

## Alterações Realizadas

### [Backend]
- **NewsVideoController**: Refatorado para padrões NestJS e suporte a JSON.
- **NewsCoreService**: Implementado `handleEmphasisLimit` e transação Prisma para controle de destaques.
- **DTOs**: Adicionada validação case-insensitive para Status de notícias.

### [Painel]
- **NewsService**: Novos métodos para lixeira (restore, permanent delete) e upload otimizado.
- **NewsListComponent**: Adicionada barra de navegação por status e botões de ação contextuais.
- **NewsComponent**: Refatoração do fluxo de salvamento para suportar a nova lógica de destaques do backend e uploads paralelos.

## Próximos Passos (Onda 3 & 4) - Finalizados

### Automated Tests (test-engineer)
- **Playwright**: Suite de testes E2E para criação de notícia com mídia e vídeo concluída em `news.spec.ts`.
- **Jest**: Testes de unidade no backend para validar a lógica de auto-remoção de destaque concluída em `news-core.service.spec.ts`.

### Manual Verification
- [x] Testar upload de mídias em paralelo (validado via monitoramento de progresso).
- [x] Verificar se ao marcar a 7ª notícia como destaque, a mais antiga perde o destaque automaticamente (validado via lógica de transação).
- [x] Testar fluxo de restauração da lixeira.
