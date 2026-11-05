const fs = require('node:fs/promises');
const { constants: fsConstants } = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { validateImportedProfile } = require('../src/domain');

const SCHEMA_VERSION = 1;
const MAX_STORE_BYTES = 5 * 1024 * 1024;
const MAX_BACKUPS = 5;

function createInitialSnapshot(now = new Date().toISOString()) {
  return { schemaVersion: SCHEMA_VERSION, createdAt: now, updatedAt: now, activeProfileId: null, profiles: [] };
}
function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function validateSnapshot(snapshot) {
  if (!isPlainObject(snapshot)) throw new TypeError('Los datos de O-Isym deben ser un objeto.');
  if (snapshot.schemaVersion !== SCHEMA_VERSION) throw new Error('Versión de datos no compatible: ' + snapshot.schemaVersion + '.');
  if (typeof snapshot.createdAt !== 'string' || Number.isNaN(Date.parse(snapshot.createdAt))) throw new TypeError('La fecha de creación no es válida.');
  if (typeof snapshot.updatedAt !== 'string' || Number.isNaN(Date.parse(snapshot.updatedAt))) throw new TypeError('La fecha de actualización no es válida.');
  if (snapshot.activeProfileId !== null && typeof snapshot.activeProfileId !== 'string') throw new TypeError('El perfil activo debe ser un identificador o null.');
  if (!Array.isArray(snapshot.profiles) || snapshot.profiles.length > 50) throw new TypeError('La colección de perfiles no es válida.');
  const ids = new Set();
  for (const profile of snapshot.profiles) {
    if (!isPlainObject(profile) || typeof profile.id !== 'string' || !profile.id || ids.has(profile.id)) throw new TypeError('Hay perfiles con identificadores inválidos o repetidos.');
    if (typeof profile.name !== 'string' || !profile.name.trim() || profile.name.length > 60) throw new TypeError('Hay un perfil con un nombre inválido.');
    ids.add(profile.id);
    try { validateImportedProfile(profile); }
    catch (cause) {
      const error = new TypeError('El perfil "' + profile.name + '" contiene datos internos no válidos: ' + cause.message);
      error.code = 'OISYM_PROFILE_INVALID';
      error.cause = cause;
      throw error;
    }
  }
  if (snapshot.activeProfileId !== null && !ids.has(snapshot.activeProfileId)) throw new TypeError('El perfil activo no existe.');
  let serialized;
  try { serialized = JSON.stringify(snapshot); } catch { throw new TypeError('Los datos no se pueden serializar.'); }
  if (Buffer.byteLength(serialized, 'utf8') > MAX_STORE_BYTES) throw new RangeError('Los datos superan el límite de almacenamiento permitido.');
  return serialized;
}
function createStorage(userDataPath) {
  if (typeof userDataPath !== 'string' || !userDataPath) throw new TypeError('Se necesita una ruta válida para el almacenamiento.');
  const storePath = path.join(userDataPath, 'oisym-data.json');
  const backupsPath = path.join(userDataPath, 'backups');
  let saveQueue = Promise.resolve();
  async function writeAtomically(serialized) {
    await fs.mkdir(userDataPath, { recursive: true });
    const temporaryPath = path.join(userDataPath, '.oisym-data-' + process.pid + '-' + crypto.randomUUID() + '.tmp');
    let handle;
    try {
      handle = await fs.open(temporaryPath, 'wx', 0o600);
      await handle.writeFile(serialized, 'utf8');
      await handle.sync();
      await handle.close(); handle = null;
      await fs.rename(temporaryPath, storePath);
    } catch (error) {
      if (handle) await handle.close().catch(() => {});
      await fs.unlink(temporaryPath).catch(() => {});
      throw error;
    }
  }
  async function createBackup() {
    await fs.mkdir(backupsPath, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
    await fs.copyFile(storePath, path.join(backupsPath, 'oisym-data-' + stamp + '.json'), fsConstants.COPYFILE_EXCL);
    const entries = (await fs.readdir(backupsPath)).filter(name => name.startsWith('oisym-data-') && name.endsWith('.json')).sort().reverse();
    await Promise.all(entries.slice(MAX_BACKUPS).map(name => fs.unlink(path.join(backupsPath, name)).catch(() => {})));
  }
  async function read() {
    let raw;
    try { raw = await fs.readFile(storePath, 'utf8'); }
    catch (error) {
      if (error.code !== 'ENOENT') throw error;
      const initial = createInitialSnapshot();
      await writeAtomically(validateSnapshot(initial));
      return initial;
    }
    let parsed;
    try { parsed = JSON.parse(raw); }
    catch {
      const error = new Error('El archivo de datos está dañado. No se modificó para proteger tu información.');
      error.code = 'OISYM_STORE_CORRUPT'; throw error;
    }
    try { validateSnapshot(parsed); }
    catch (cause) {
      const error = new Error('El archivo de datos no coincide con el formato esperado. No se modificó.');
      error.code = 'OISYM_STORE_INVALID'; error.cause = cause; throw error;
    }
    return parsed;
  }
  async function saveSerialized(serialized) {
    let current = null;
    try {
      const currentRaw = await fs.readFile(storePath, 'utf8');
      try {
        current = JSON.parse(currentRaw);
        validateSnapshot(current);
      } catch {
        const error = new Error('No se guardó: el archivo actual no se puede validar y debe protegerse.');
        error.code = 'OISYM_STORE_PROTECTED'; throw error;
      }
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    const candidate = JSON.parse(serialized);
    if (current) {
      const comparableCurrent = { ...current };
      const comparableCandidate = { ...candidate };
      delete comparableCurrent.updatedAt;
      delete comparableCandidate.updatedAt;
      comparableCurrent.profiles = current.profiles.map(profile => {
        const copy = { ...profile }; delete copy.updatedAt; return copy;
      });
      comparableCandidate.profiles = candidate.profiles.map(profile => {
        const copy = { ...profile }; delete copy.updatedAt; return copy;
      });
      if (isDeepStrictEqual(comparableCurrent, comparableCandidate)) return current;
      await createBackup();
    }

    const next = { ...candidate, updatedAt: new Date().toISOString() };
    await writeAtomically(validateSnapshot(next));
    return next;
  }

  async function save(snapshot) {
    // Capture and validate the submitted state immediately, then serialize disk writes.
    const serialized = validateSnapshot(snapshot);
    const operation = saveQueue.then(() => saveSerialized(serialized));
    saveQueue = operation.catch(() => {});
    return operation;
  }
  function makeBackupName(prefix) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-') + '-' + crypto.randomUUID().slice(0, 8);
    return prefix + '-' + stamp + '.json';
  }
  async function backupCurrentFile() {
    await fs.mkdir(backupsPath, { recursive: true });
    const name = makeBackupName('oisym-recovery');
    await fs.copyFile(storePath, path.join(backupsPath, name), fsConstants.COPYFILE_EXCL);
    return name;
  }
  async function listBackups() {
    let names = [];
    try { names = await fs.readdir(backupsPath); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const result = [];
    for (const name of names.filter(item => /^oisym-data-[\w.-]+\.json$/.test(item)).sort().reverse()) {
      try {
        const raw = await fs.readFile(path.join(backupsPath, name), 'utf8');
        const snapshot = JSON.parse(raw);
        validateSnapshot(snapshot);
        result.push({ name, updatedAt: snapshot.updatedAt, profiles: snapshot.profiles.length });
      } catch {}
    }
    return result;
  }
  async function overwriteWithFreshData() {
    await fs.mkdir(userDataPath, { recursive: true });
    let backupName = null;
    try { backupName = await backupCurrentFile(); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    const fresh = createInitialSnapshot();
    await writeAtomically(validateSnapshot(fresh));
    return { backupName };
  }
  async function restoreBackup(name) {
    if (typeof name !== 'string' || !/^oisym-data-[\w.-]+\.json$/.test(name) || path.basename(name) !== name) {
      throw new TypeError('El nombre de la copia de seguridad no es válido.');
    }
    const backupPath = path.join(backupsPath, name);
    const raw = await fs.readFile(backupPath, 'utf8');
    let snapshot;
    try {
      snapshot = JSON.parse(raw);
      validateSnapshot(snapshot);
    } catch {
      const error = new Error('La copia seleccionada también está dañada y no se puede restaurar.');
      error.code = 'OISYM_BACKUP_INVALID';
      throw error;
    }
    let emergencyBackup = null;
    try { emergencyBackup = await backupCurrentFile(); }
    catch (error) { if (error.code !== 'ENOENT') throw error; }
    await writeAtomically(validateSnapshot(snapshot));
    return { emergencyBackup };
  }
  return Object.freeze({
    read, save, storePath, backupsPath,
    recovery: Object.freeze({ listBackups, overwriteWithFreshData, restoreBackup })
  });
}
module.exports = { SCHEMA_VERSION, createInitialSnapshot, createStorage, validateSnapshot };
