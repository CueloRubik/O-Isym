const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');

const { createStorage } = require('../electron/storage');

async function makeTemporaryStorage(t) {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), 'oisym-storage-test-'));
  t.after(() => fs.rm(directory, { recursive: true, force: true }));
  return { directory, storage: createStorage(directory) };
}

test('inicializa un archivo de datos con el esquema esperado', async t => {
  const { storage } = await makeTemporaryStorage(t);
  const snapshot = await storage.read();

  assert.equal(snapshot.schemaVersion, 1);
  assert.equal(snapshot.activeProfileId, null);
  assert.deepEqual(snapshot.profiles, []);

  const persisted = JSON.parse(await fs.readFile(storage.storePath, 'utf8'));
  assert.deepEqual(persisted, snapshot);
});

test('guarda y recupera datos, creando una copia de respaldo', async t => {
  const { storage } = await makeTemporaryStorage(t);
  const initial = await storage.read();

  const saved = await storage.save({
    ...initial,
    profiles: [{ id: 'profile-main', name: 'Perfil principal' }],
    activeProfileId: 'profile-main'
  });

  const recovered = await storage.read();
  assert.equal(recovered.activeProfileId, 'profile-main');
  assert.equal(recovered.profiles[0].name, 'Perfil principal');
  assert.ok(Date.parse(saved.updatedAt));

  const backups = await fs.readdir(storage.backupsPath);
  assert.equal(backups.length, 1);
});

test('rechaza datos con una versión de esquema desconocida', async t => {
  const { storage } = await makeTemporaryStorage(t);
  const initial = await storage.read();

  await assert.rejects(
    storage.save({ ...initial, schemaVersion: 99 }),
    /Versión de datos no compatible/
  );
});

test('protege un archivo existente si está dañado', async t => {
  const { storage } = await makeTemporaryStorage(t);
  await fs.mkdir(path.dirname(storage.storePath), { recursive: true });
  await fs.writeFile(storage.storePath, '{datos incompletos', 'utf8');

  await assert.rejects(storage.read(), error => error.code === 'OISYM_STORE_CORRUPT');

  const candidate = {
    schemaVersion: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    activeProfileId: null,
    profiles: []
  };

  await assert.rejects(
    storage.save(candidate),
    error => error.code === 'OISYM_STORE_PROTECTED'
  );

  assert.equal(await fs.readFile(storage.storePath, 'utf8'), '{datos incompletos');
});


test('guarda una copia exacta del archivo dañado antes de sobrescribirlo', async t => {
  const { storage } = await makeTemporaryStorage(t);
  const damaged = '{datos incompletos y valiosos';
  await fs.writeFile(storage.storePath, damaged, 'utf8');

  const result = await storage.recovery.overwriteWithFreshData();
  assert.ok(result.backupName);
  assert.equal(await fs.readFile(path.join(storage.backupsPath, result.backupName), 'utf8'), damaged);

  const fresh = await storage.read();
  assert.equal(fresh.schemaVersion, 1);
  assert.deepEqual(fresh.profiles, []);
});

test('restaura una copia válida y conserva el archivo que estaba activo', async t => {
  const { storage } = await makeTemporaryStorage(t);
  const initial = await storage.read();
  const withProfile = await storage.save({
    ...initial,
    profiles: [{ id: 'profile-old', name: 'Perfil recuperable' }],
    activeProfileId: 'profile-old'
  });
  // Cada guardado conserva la versión anterior; hacemos un segundo guardado
  // para que la copia disponible contenga el perfil recuperable.
  await storage.save({ ...withProfile, updatedAt: new Date().toISOString() });
  const backups = await storage.recovery.listBackups();
  assert.equal(backups.length, 1);

  await fs.writeFile(storage.storePath, '{archivo roto', 'utf8');
  const restored = await storage.recovery.restoreBackup(backups[0].name);

  const current = await storage.read();
  assert.equal(current.profiles[0].name, 'Perfil recuperable');
  assert.ok(restored.emergencyBackup);
  assert.equal(await fs.readFile(path.join(storage.backupsPath, restored.emergencyBackup), 'utf8'), '{archivo roto');
});

test('no permite restaurar rutas fuera de la carpeta de copias', async t => {
  const { storage } = await makeTemporaryStorage(t);
  await assert.rejects(storage.recovery.restoreBackup('../oisym-data-secret.json'), /nombre de la copia/);
});
