import { test, expect } from '@playwright/test';

test.describe('Autenticação - Login/Logout', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
    await page.waitForSelector('.login-card', { timeout: 10000 });
  });

  // ─── Renderização da Página de Login ───────────────────────────────

  test('deve renderizar a página de login completa', async ({ page }) => {
    // Logo
    await expect(page.locator('.logo img')).toBeVisible();

    // Título e subtítulo
    await expect(page.locator('h2')).toHaveText('Painel de controle');
    await expect(page.locator('.login-header p')).toHaveText(
      'Faça login para continuar',
    );

    // Campos do formulário
    await expect(page.locator('#email')).toBeVisible();
    await expect(page.locator('#password')).toBeVisible();

    // Checkbox "Lembrar-me"
    await expect(page.locator('#remember')).toBeVisible();

    // Botão de submit
    await expect(page.locator('button[type="submit"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toHaveText('Entrar');

    // Link "Esqueceu a senha?"
    await expect(page.locator('.forgot-password')).toHaveText(
      'Esqueceu a senha?',
    );
  });

  // ─── Validação de Campos ──────────────────────────────────────────

  test('deve manter botão desabilitado com campos vazios', async ({
    page,
  }) => {
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('deve manter botão desabilitado com email inválido', async ({
    page,
  }) => {
    await page.fill('#email', 'email-invalido');
    await page.fill('#password', 'senha123');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeDisabled();
  });

  test('deve habilitar botão com campos válidos', async ({ page }) => {
    await page.fill('#email', 'master@email.com');
    await page.fill('#password', '123456');
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeEnabled();
  });

  // ─── Toggle de Visibilidade de Senha ──────────────────────────────

  test('deve alternar visibilidade da senha', async ({ page }) => {
    const passwordInput = page.locator('#password');
    const toggleBtn = page.locator('.password-toggle');

    // Estado inicial: senha oculta
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Clica no toggle
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Clica de novo para ocultar
    await toggleBtn.click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─── Login com Sucesso ────────────────────────────────────────────

  test('deve fazer login com credenciais válidas e redirecionar', async ({
    page,
  }) => {
    await page.fill('#email', 'master@email.com');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');

    // Deve redirecionar para o dashboard
    await page.waitForURL('**/');
    await expect(page).not.toHaveURL(/\/login/);
  });

  test('deve salvar token no sessionStorage sem "lembrar-me"', async ({
    page,
  }) => {
    await page.fill('#email', 'master@email.com');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');

    const token = await page.evaluate(() =>
      sessionStorage.getItem('access_token'),
    );
    expect(token).toBeTruthy();
  });

  test('deve salvar token no localStorage com "lembrar-me" ativado', async ({
    page,
  }) => {
    await page.fill('#email', 'master@email.com');
    await page.fill('#password', '123456');
    await page.click('#remember');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');

    const token = await page.evaluate(() =>
      localStorage.getItem('access_token'),
    );
    expect(token).toBeTruthy();
  });

  // ─── Login com Erro ───────────────────────────────────────────────

  test('deve exibir mensagem de erro com credenciais inválidas', async ({
    page,
  }) => {
    await page.fill('#email', 'invalido@email.com');
    await page.fill('#password', 'senhaerrada');
    await page.click('button[type="submit"]');

    // Aguardar mensagem de erro do servidor
    const errorMessage = page.locator('error-message');
    await expect(errorMessage.last()).toBeVisible({ timeout: 5000 });
  });

  // ─── Guard de Rota ────────────────────────────────────────────────

  test('deve redirecionar para login quando não autenticado', async ({
    page,
  }) => {
    // Limpar tokens existentes
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    await page.goto('/');
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });

  // ─── Logout ───────────────────────────────────────────────────────

  test('deve fazer logout e redirecionar para login', async ({ page }) => {
    // Primeiro, fazer login
    await page.fill('#email', 'master@email.com');
    await page.fill('#password', '123456');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/');

    // Clicar no botão de sair
    const logoutBtn = page.locator('.auth_button');
    await logoutBtn.first().click();

    // Deve redirecionar para login
    await page.waitForURL('**/login');
    await expect(page).toHaveURL(/\/login/);
  });
});
