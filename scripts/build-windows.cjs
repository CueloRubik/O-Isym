'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const target = process.argv[2];
if (!['nsis', 'portable', 'dir'].includes(target)) throw new Error('Destino de Windows desconocido.');
const icon = fs.readFileSync(path.join(root, 'app.ico'));
if (icon.length < 22 || icon.readUInt16LE(0) !== 0 || icon.readUInt16LE(2) !== 1 || icon.readUInt16LE(4) < 1) {
  throw new Error('app.ico debe ser un icono de Windows válido.');
}
const builder = require.resolve('electron-builder/cli.js');
const args = [builder, '--win', ...(target === 'dir' ? ['--dir'] : [target]), '--x64', '--publish', 'never'];
const result = spawnSync(process.execPath, args, { cwd: root, stdio: 'inherit', env: { ...process.env, CSC_IDENTITY_AUTO_DISCOVERY: 'false' } });
if (result.error) throw result.error;
process.exit(result.status ?? 1);
