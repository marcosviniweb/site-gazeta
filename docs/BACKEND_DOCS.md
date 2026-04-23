# Documentação de Alterações no Backend (News Layer)

## 1. Visão Geral
A camada de comunicação de notícias (`NewsCoreService`, `NewsVideoController` e relacionados) foi refatorada para centralizar a lógica de negócios e adotar as melhores práticas do NestJS. O objetivo principal foi resolver bugs relacionados ao limite de destaques, integridade dos payloads (vídeos e mídias), e gestão de lixeira (status de publicação).

## 2. Mudanças Estruturais
### 2.1 Refatoração de Controllers
- **`NewsVideoController`**: Atualizado para suportar `JSON` padrão em vez de formulários complexos. Agora utiliza interceptors adequados (`NewsErrorInterceptor`) para gestão padronizada de exceções, evitando tratamento redundante de erros.

### 2.2 Centralização de Lógica de Negócio (`NewsCoreService`)
- A responsabilidade de manter o limite de destaques (máximo de 6 itens) foi removida do Frontend e movida para o Backend.
- Implementação de Transação Atômica (`$transaction` no Prisma) para gerenciar o toggle de destaques de forma segura (`handleEmphasisLimit`).
- Quando uma 7ª notícia é marcada como destaque, o backend automaticamente localiza e remove o destaque da notícia mais antiga (`orderBy: { createdAt: 'asc' }`).

### 2.3 Padronização de Payload e Uploads
- Garantido que as validações de status sejam **case-insensitive**, alinhando as Enums (`NewsStatus.ACTIVE`, `INACTIVE`, `TRASH`).
- Limpeza física de arquivos aprimorada durante remoção permanente e lixeira.
- Sincronização melhorada entre `ContentMediaService` e `ImageProcessingService`.

## 3. Testes Adicionados
- **Testes Unitários** (`news-core.service.spec.ts`): Implementados testes para a transação `handleEmphasisLimit`, `validateSlug` e `validateCategories`. Mock das instâncias do PrismaService implementado.
- **Testes End-to-End** (`news.spec.ts` - Playwright): Adicionado fluxo completo que engloba criação da notícia, conteúdo do editor, adição de vídeo via JSON/Input, e ativação de toggle de destaque.

## 4. Próximos Passos
As alterações resolvem o núcleo da instabilidade do painel e as próximas manutenções de backend devem estender as suítes de teste de integração para o `NewsCategoryController` e o sistema de Analytics interno.
