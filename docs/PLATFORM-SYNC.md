# Sincronización puntual de plataformas

Fuente compartida: `development`, commit `8f38e14e8e57c55ead78a5ab3c6d5b9c11bb784a` (versión de aplicación `1.1.0`). Se integra el código actual y se conserva el historial previo de cada plataforma. `main`, `development`, la web, las etiquetas y las Releases no se modifican en esta operación.

## macOS Universal

- Código, pruebas, dependencias y versión de paquete (`1.1.0`) de `development`.
- Se conserva el archivo `app.icns` versionado en esta rama y su configuración `build.mac` anterior.
- Ejecutar `npm ci`, `npm test` y `npm start` desde la raíz.
- Para empaquetar en macOS para Intel y Apple Silicon: `npm run build:mac:universal`. Para la carpeta de aplicación: `npm run build:mac:universal:dir`. Los comandos `build:mac` y `build:mac:dir` siguen siendo explícitamente Intel x64.

## Límites de la validación

La suite automatizada puede ejecutarse con Node.js 18 en Linux, incluyendo pruebas de interfaz con JSDOM y pruebas del proceso principal con dobles de Electron. Esto no sustituye ejecutar Electron, empaquetar, verificar firma/notarización o probar notificaciones e instaladores en macOS y Windows. No publicar ni reemplazar descargas como parte de esta sincronización.

La versión `1.0.0` del formato de intercambio `.oisym`, cuando aparezca en la especificación y ejemplos, identifica el esquema de datos: es independiente de la versión de la aplicación y no se cambia al sincronizar ramas.
