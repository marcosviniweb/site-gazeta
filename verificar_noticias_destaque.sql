-- SQL para verificar notícias em destaque no banco de dados
-- Este script mostra como as notícias estão sendo salvas e ordenadas

-- 1. Ver todas as notícias em destaque com seus dados principais
SELECT 
    id,
    title,
    is_emphasis,
    views,
    created_at,
    update_at,
    status,
    published
FROM news
WHERE is_emphasis = true
ORDER BY created_at DESC, views DESC;

-- 2. Ver notícias em destaque ativas (como o endpoint retorna)
SELECT 
    id,
    title,
    is_emphasis,
    views,
    created_at,
    update_at,
    status,
    published
FROM news
WHERE is_emphasis = true 
  AND status = 'ACTIVE'
ORDER BY created_at DESC, views DESC;

-- 3. Verificar quantas notícias em destaque existem
SELECT 
    COUNT(*) as total_destaques,
    COUNT(CASE WHEN status = 'ACTIVE' THEN 1 END) as destoques_ativos,
    COUNT(CASE WHEN status = 'INACTIVE' THEN 1 END) as destoques_inativos,
    COUNT(CASE WHEN status = 'TRASH' THEN 1 END) as destoques_lixeira
FROM news
WHERE is_emphasis = true;

-- 4. Ver as 5 notícias mais recentes em destaque (como aparece no carousel)
SELECT 
    id,
    title,
    is_emphasis,
    views,
    created_at,
    update_at,
    status,
    published
FROM news
WHERE is_emphasis = true 
  AND status = 'ACTIVE'
ORDER BY created_at DESC, views DESC
LIMIT 5;

-- 5. Verificar se há notícias em destaque com mesma data de criação (para ver o critério de desempate)
SELECT 
    DATE(created_at) as data_criacao,
    COUNT(*) as quantidade,
    GROUP_CONCAT(id ORDER BY views DESC SEPARATOR ', ') as ids_ordenados_por_views
FROM news
WHERE is_emphasis = true 
  AND status = 'ACTIVE'
GROUP BY DATE(created_at)
HAVING COUNT(*) > 1
ORDER BY data_criacao DESC;
