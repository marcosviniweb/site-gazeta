import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

/**
 * Lê `version` do package.json do app (mesmo valor que o PM2 exibe no `pm2 show`).
 * Ordem: build em dist (`__dirname/package.json`) ou fonte (`../package.json`).
 */
export const BACKEND_VERSION: string = (() => {
  const candidates = [join(__dirname, 'package.json'), join(__dirname, '..', 'package.json')];
  for (const pkgPath of candidates) {
    if (!existsSync(pkgPath)) continue;
    try {
      const v = JSON.parse(readFileSync(pkgPath, 'utf-8')).version;
      if (typeof v === 'string' && v.length > 0) {
        return v;
      }
    } catch {
      /* tenta próximo */
    }
  }
  return '1.1.0';
})();
