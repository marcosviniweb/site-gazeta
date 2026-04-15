module.exports = {
  apps: [
    {
      name: 'backend-gazeta',
      script: './dist/apps/backend-gazeta/main.js',
      cwd: '/home/gazetadopara.com/public_html/site-gazeta',
      // Defina DATABASE_URL aqui ou em apps/backend-gazeta/.env.production / .env.production na raiz do deploy (não commitar segredo).
      env: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        USE_PRODUCTION_ENV: 'true',
        PORT: 3002,
        BASE_URL: 'https://gazetadopara.com'
      },
      // Se usar: pm2 start ecosystem.config.js --env production
      env_production: {
        NODE_ENV: 'production',
        APP_ENV: 'production',
        USE_PRODUCTION_ENV: 'true',
        PORT: 3002,
        BASE_URL: 'https://gazetadopara.com'
      },
      instances: 1,
      exec_mode: 'cluster',
      watch: false,
      max_memory_restart: '1G',
      error_file: './logs/backend-err.log',
      out_file: './logs/backend-out.log',
      log_file: './logs/backend-combined.log',
      time: true,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 4000
    }
  ]
};
