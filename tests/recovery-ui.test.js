const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const { createStorage } = require('../electron/storage');
const { createProfile, createTask } = require('../src/domain');
const { storageBridge } = require('./helpers/storage-bridge.cjs');
const { renderer } = require('./helpers/renderer.cjs');

async function fixture(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-recovery-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  const storage = createStorage(dir);
  return { storage, bridge: storageBridge(storage) };
}
async function until(check) {
  for (let i = 0; i < 100; i++) {
    if (await check()) return;
    await new Promise(resolve => setTimeout(resolve, 20));
  }
  assert.fail('Recovery UI did not reach the expected state');
}

test('storage error codes survive the IPC/preload boundary and untrusted callers stay rejected', async t => {
  const { storage, bridge } = await fixture(t);
  await fs.writeFile(storage.storePath, '{roto');
  await assert.rejects(bridge.storage.read(), error => error.code === 'OISYM_STORE_CORRUPT');
  bridge.trust(false);
  await assert.rejects(bridge.storage.read(), /no autorizada/);
  bridge.trust(true);
  await bridge.storage.recovery.overwrite();
  const initial = await bridge.storage.read();
  assert.equal(initial.schemaVersion, 1);
  const saved = await bridge.storage.save(initial);
  assert.equal(saved.schemaVersion, 1);
});

test('recovery screen restores a real backup and preserves the damaged bytes through IPC', async t => {
  const { storage, bridge } = await fixture(t);
  const initial = await storage.read();
  const profile = createProfile('Recuperable');
  profile.tasks.push(createTask({ title: 'Practicar violín' }));
  const saved = await storage.save({ ...initial, profiles: [profile], activeProfileId: profile.id });
  await storage.save({ ...saved, profiles: [{ ...profile, name: 'Cambio posterior' }] });
  const broken = '{datos dañados que se deben conservar';
  await fs.writeFile(storage.storePath, broken);
  const r = await renderer({ storage: bridge.storage, startInBoard: false });
  t.after(() => r.dispose());
  await until(() => r.query('[data-action="recovery-restore"]'));
  const backups = await bridge.storage.recovery.listBackups();
  r.query('#recovery-backup-select').value = backups.find(item => item.profiles === 1).name;
  r.click('[data-action="recovery-restore"]');
  await until(() => r.app.state.profile?.name === 'Recuperable' && r.query('#main-content'));
  assert.equal(r.app.state.profile.tasks[0].title, 'Practicar violín');
  const names = await fs.readdir(storage.backupsPath);
  const emergency = names.find(name => name.startsWith('oisym-recovery-'));
  assert.equal(await fs.readFile(path.join(storage.backupsPath, emergency), 'utf8'), broken);
  assert.equal((await storage.read()).profiles[0].name, 'Recuperable');
  assert.equal(r.errors.length, 0);
});

test('recovery screen can explicitly create fresh data while retaining the damaged file', async t => {
  const { storage, bridge } = await fixture(t);
  const broken = '{archivo incompleto';
  await fs.writeFile(storage.storePath, broken);
  const r = await renderer({ storage: bridge.storage, startInBoard: false });
  t.after(() => r.dispose());
  await until(() => r.query('[data-action="recovery-overwrite"]'));
  assert.equal(await fs.readFile(storage.storePath, 'utf8'), broken);
  r.click('[data-action="recovery-overwrite"]');
  await until(() => r.app.state.profile && r.query('#main-content'));
  assert.equal(await r.app.flushIdeaChanges(), true);
  const names = await fs.readdir(storage.backupsPath);
  const emergency = names.find(name => name.startsWith('oisym-recovery-'));
  assert.equal(await fs.readFile(path.join(storage.backupsPath, emergency), 'utf8'), broken);
  assert.equal((await storage.read()).profiles.length, 1);
  assert.equal(r.errors.length, 0);
});
