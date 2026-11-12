# Sincronización puntual de plataformas

Fuente compartida: `development`, commit `8f38e14e8e57c55ead78a5ab3c6d5b9c11bb784a` (versión de aplicación `1.1.0`). Se integra el código actual y se conserva el historial previo de cada plataforma. `main`, `development`, la web, las etiquetas y las Releases no se modifican en esta operación.

## macOS Intel

- Código, pruebas, dependencias y versión de paquete (`1.1.0`) de `development`.
- Se mantiene el destino macOS Intel x64, el identificador `com.oisym.app` y la firma ad-hoc.
- Ejecutar `npm ci`, `npm test` y `npm start` desde la raíz.
- Para empaquetar en macOS: disponer de `app.icns` local y ejecutar `npm run build:mac`. El icono no estaba versionado en esta rama y sigue siendo un requisito local.

## Límites de la validación

La suite automatizada puede ejecutarse con Node.js 18 en Linux, incluyendo pruebas de interfaz con JSDOM y pruebas del proceso principal con dobles de Electron. Esto no sustituye ejecutar Electron, empaquetar, verificar firma/notarización o probar notificaciones e instaladores en macOS y Windows. No publicar ni reemplazar descargas como parte de esta sincronización.

La versión `1.0.0` del formato de intercambio `.oisym`, cuando aparezca en la especificación y ejemplos, identifica el esquema de datos: es independiente de la versión de la aplicación y no se cambia al sincronizar ramas.
