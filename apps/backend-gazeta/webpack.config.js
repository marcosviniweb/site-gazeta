const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/backend-gazeta'),
  },
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: [
        './src/assets',
        // Engines e runtime do Prisma (binaryTargets Linux + Windows); necessário no deploy.
        {
          glob: '**/*',
          input: 'apps/backend-gazeta/generated/prisma',
          output: 'generated/prisma',
        },
      ],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: true,
    }),
  ],
};
