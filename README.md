# O-Isym 5

Sistema personal de organización de la vida diaria. El desarrollo del producto nuevo se realiza en la rama `oisym-5-development`; la interfaz anterior se conserva temporalmente como prototipo heredado.

## Requisitos

- Node.js 18.x
- npm 10.x
- Electron 28.3.3 (se instala mediante npm)

## Instalar y ejecutar

Desde la carpeta raíz del proyecto:

```bash
npm install
npm start
```

No ejecutes `npm init -y`: el proyecto ya incluye su `package.json`.
No actualices Electron a otra versión durante esta etapa.

## Pruebas

```bash
npm test
```

Las pruebas usan el módulo integrado `node:test`; no requieren dependencias adicionales.

## Arquitectura en construcción

- `electron/main.js`: ventana y ciclo de vida de Electron.
- `electron/preload.js`: API limitada que se expone a la interfaz.
- `electron/ipc-handlers.js`: validación de solicitudes entre procesos.
- `electron/storage.js`: almacenamiento JSON versionado, escritura atómica y respaldos.
- `src/`: la nueva interfaz y los módulos se irán incorporando por etapas.
- `tests/`: pruebas automatizadas.
- `legacy/`: prototipo anterior, conservado como referencia.

Los datos nuevos se guardan en el directorio de datos de usuario de Electron, en el archivo `oisym-data.json`, con copias de seguridad en la carpeta `backups`. No se borran automáticamente los datos antiguos de `localStorage`; la importación se implementará después de definir y probar su migración.

## Estado

La capa técnica inicial está en construcción. La interfaz que se abre todavía es el prototipo anterior y no representa el diseño final de O-Isym 5. Consulta `docs/ROADMAP_OISYM_5.md` para el orden y los criterios de aceptación de cada etapa.
