# Sincronización puntual de plataformas

Fuente compartida: `development`, commit `8f38e14e8e57c55ead78a5ab3c6d5b9c11bb784a` (versión de aplicación `1.1.0`). Se integra el código actual y se conserva el historial previo de cada plataforma. `main`, `development`, la web, las etiquetas y las Releases no se modifican en esta operación.

## Windows: solo código compartido

- Base de código, recursos compartidos y pruebas tomados de `development`. Después de esta sincronización se incorporan [correcciones específicas de compatibilidad con Windows](WINDOWS-COMPATIBILITY.md).
- `package.json`, `package-lock.json` y el icono `app.ico` permanecen idénticos a la rama Windows anterior (`d382604940811dbe9ad17fe6b3af35ad523db3c6`). No se incorpora el workflow nuevo de instaladores.
- Se conserva por petición expresa la versión de paquete anterior (`5.0.0`), junto con los comandos y destinos de empaquetado. No se ha preparado una nueva versión distribuible de Windows.
- Para desarrollo: `npm ci` y `npm start` desde la raíz.
- Para ejecutar la suite nueva sin cambiar los manifiestos: después de `npm ci`, ejecutar `npm install --no-save --package-lock=false --ignore-scripts jsdom@22.1.0` y `npm test`. Una nueva ejecución de `npm ci` elimina esa dependencia adicional y habrá que repetir su instalación para las pruebas.
- CI instala `jsdom@22.1.0` en una carpeta temporal y lo expone mediante `NODE_PATH`, separado de las dependencias de compilación.
- La compilación, el problema de winCodeSign y las pruebas en Windows quedan pendientes; esta integración no los modifica ni los declara resueltos.

## Límites de la validación

La suite automatizada puede ejecutarse con Node.js 18 en Linux, incluyendo pruebas de interfaz con JSDOM y pruebas del proceso principal con dobles de Electron. Esto no sustituye ejecutar Electron, empaquetar, verificar firma/notarización o probar notificaciones e instaladores en macOS y Windows. No publicar ni reemplazar descargas como parte de esta sincronización.

La versión `1.0.0` del formato de intercambio `.oisym`, cuando aparezca en la especificación y ejemplos, identifica el esquema de datos: es independiente de la versión de la aplicación y no se cambia al sincronizar ramas.
