const fs = require('node:fs/promises');
const { constants: fsConstants } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');

const SCHEMA_VERSION = 1;
const MAX_STORE_BYTES = 5 * 1024 * 1024;
const MAX_BACKUPS = 5;

function createInitialSnapshot(now = new Date().toISOString()) {
  return {
    schemaVersion: SCHEMA_VERSION,
    createdAt: now,
    updatedAt: now,
    activeProfileId: null,
    profiles: []
  };
}

function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) {
    throw new TypeError('Los datos de O-Isym deben ser un objeto.');
  }

  if (snapshot.schemaVersion !== SCHEMA_VERSION) {
    throw new Error(`Versión de datos no compatible: ${snapshot.schemaVersion}.`);
  }

  if (typeof snapshot.createdAt !== 'string' || Number.isNaN(Date.parse(snapshot.createdAt))) {
    throw new TypeError('La fecha de creación de los datos no es válida.');
  }

  if (typeof snapshot.updatedAt !== 'string' || Number.isNaN(Date.parse(snapshot.updatedAt))) {
    throw new TypeError('La fecha de actualización de los datos no es válida.');
  }

  if (snapshot.activeProfileId !== null && typeof snapshot.activeProfileId !== 'string') {
    throw new TypeError('El perfil activo debe ser un identificador o null.');
  }

  if (!Array.isArray(snapshot.profiles)) {
    throw new TypeError('La colección de perfiles debe ser una lista.');
  }

  let serialized;
  try {
    serialized = JSON.stringify(snapshot);
  } catch {
    throw new TypeError('Los datos contienen valores que no se pueden guardar.');
  }

  if (Buffer.byteLength(serialized, 'utf8') > MAX_STORE_BYTES) {
    throw new RangeError('Los datos superan el límite de almacenamiento permitido.');
  }

  return serialized;
}

function createStorage(userDataPath) {
  if (typeof userDataPath !== 'string' || userDataPath.length === 0) {
    throw new TypeError('Se necesita una ruta válida para el almacenamiento.');
  }

  const storePath = path.join(userDataPath, 'oisym-data.json');
  const backupsPath = path.join(userDataPath, 'backups');

  async function writeAtomically(serialized) {
    await fs.mkdir(userDataPath, { recursive: true });

    const temporaryPath = path.join(
      userDataPath,
      `.oisym-data-${process.pid}-${crypto.randomUUID()}.tmp`
    );

    let handle;
    try {
      handle = await fs.open(temporaryPath, 'wx', 0o600);
      await handle.writeFile(serialized, 'utf8');
      await handle.sync();
      await handle.close();
      handle = null;
      await fs.rename(temporaryPath, storePath);
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      await fs.unlink(temporaryPath).catch(() => {});
      throw error;
    }
  }

  async function createBackup() {
    await fs.mkdir(backupsPath, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = path.join(backupsPath, `oisym-data-${stamp}.json`);
    await fs.copyFile(storePath, backupPath, fsConstants.COPYFILE_EXCL);

    const entries = (await fs.readdir(backupsPath))
      .filter(name => name.startsWith('oisym-data-') && name.endsWith('.json'))
      .sort()
      .reverse();

    await Promise.all(
      entries.slice(MAX_BACKUPS).map(name =>
        fs.unlink(path.join(backupsPath, name)).catch(() => {})
      )
    );
  }

  async function read() {
    let raw;
    try {
      raw = await fs.readFile(storePath, 'utf8');
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;

      const initial = createInitialSnapshot();
      await writeAtomically(validateSnapshot(initial));
      return initial;
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      const error = new Error('El archivo de datos está dañado. No se modificó para proteger tu información.');
      error.code = 'OISYM_STORE_CORRUPT';
      throw error;
    }

    try {
      validateSnapshot(parsed);
    } catch (cause) {
      const error = new Error('El archivo de datos no coincide con el formato esperado. No se modificó.');
      error.code = 'OISYM_STORE_INVALID';
      error.cause = cause;
      throw error;
    }

    return parsed;
  }

  async function save(snapshot) {
    const serialized = validateSnapshot(snapshot);

    // Nunca sobrescribir un archivo existente que no podamos leer y validar.
    try {
      const currentRaw = await fs.readFile(storePath, 'utf8');
      let current;
      try {
        current = JSON.parse(currentRaw);
        validateSnapshot(current);
      } catch {
        const error = new Error('No se guardó: el archivo actual no se puede validar y debe protegerse.');
        error.code = 'OISYM_STORE_PROTECTED';
        throw error;
      }
      await createBackup();
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const nextSnapshot = {
      ...JSON.parse(serialized),
      updatedAt: new Date().toISOString()
    };

    await writeAtomically(validateSnapshot(nextSnapshot));
    return nextSnapshot;
  }

  return Object.freeze({ read, save, storePath, backupsPath });
}

module.exports = {
  SCHEMA_VERSION,
  createInitialSnapshot,
  createStorage,
  validateSnapshot
};
