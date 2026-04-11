# 🗺️ Roadmap de Modernização - site-gazeta

Este documento rastreia as fases de melhoria do projeto Gazeta.

## Progresso das Fases

### ✅ Fase 1: Modernização da Lista de Notícias
- [x] Paginação server-side (25 por página)
- [x] Busca otimizada via endpoint `/api/news/search`
- [x] Ações em massa (Status, Destaque, Excluir)
- [x] Melhorias de UX: Spinner de carregamento e scroll ao topo automático
- [x] Refatoração de componentes afetados (Media Cleanup, Video Related News)

### ✅ Fase 2: Performance e Otimização do Backend
- [x] Implementação de Middleware de Compressão (Gzip)
- [x] Adição de Headers de Segurança (Helmet)
- [x] Otimização de consultas Prisma (Select vs Include para remover payload de conteúdo)
- [x] Criação de Índices no Banco de Dados (Status, Destaque, Slug, Data)

### ✅ Fase 3: UX e Multi-select no Formulário
- [x] Busca dinâmica de categorias com multi-select
- [x] Melhorias de fluxo e design no formulário de notícias
- [x] Auditoria de usabilidade

### 📅 Fase 4: Debug de Produção e Upload
- [ ] Investigação de lentidão em ambiente de produção
- [ ] Resolução do Bug 404 em upload de vídeos no editor
- [ ] Ajustes de ambiente persistente vs efêmero

### ✅ Fase 5: Orquestração e Estabilização Técnica
- [x] Implementação do `HomeNewsOrchestratorService` (Orquestração de notícias)
- [x] Novo design Hero para o Carousel
- [x] Tipagem estrita e remoção de `any` (Backend/Frontend)
- [x] Correções de Acessibilidade (Modais e Teclado)
- [x] Resolução de conflitos de path do Prisma Client gerado (Local path)

---
*Última atualização: 10/04/2026*
