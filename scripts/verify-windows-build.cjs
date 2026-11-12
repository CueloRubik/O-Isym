'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const { NtExecutable, NtExecutableResource, Resource } = await import('resedit');
  const asar = await import('@electron/asar');
  const root = path.resolve(__dirname, '../dist/win-unpacked');
  const executable = NtExecutable.from(fs.readFileSync(path.join(root, 'O-Isym.exe')));
  const resources = NtExecutableResource.from(executable);
  const groups = Resource.IconGroupEntry.fromEntries(resources.entries);
  assert.ok(groups.length > 0, 'Executable icon missing');
  assert.ok(groups.some(group => group.getIconItemsFromEntries(resources.entries).some(item => (item.width ?? item.bitmapInfo?.width) === 256)), '256px app icon missing');
  const archive = path.join(root, 'resources/app.asar');
  assert.deepEqual(asar.extractFile(archive, 'app.ico'), fs.readFileSync(path.resolve(__dirname, '../app.ico')));
  for (const entry of ['electron/preload.js', 'electron/task-notifications.js', 'src/app.js', 'assets/icons/notifications/task-reminder.png']) {
    assert.ok(asar.extractFile(archive, entry).length, `Missing packaged file: ${entry}`);
  }
  if (!process.argv.includes('--dir')) assert.ok(fs.readdirSync(path.dirname(root)).some(file => file.endsWith('-Setup.exe')), 'Installer missing');
  console.log('Windows executable, icon and packaged runtime verified.');
})().catch(error => { console.error(error); process.exitCode = 1; });
