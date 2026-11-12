# O-Isym

O-Isym es una aplicación de organización personal con perfiles, tareas, calendario, actividades, metas, Focus y pizarrones de ideas.

## Estado del repositorio

- **`development`**: base de código en desarrollo, compartida por macOS y Windows.
- **`main`**: todavía conserva documentación de una organización anterior; está pendiente su migración controlada a rama estable de código.
- **`oisym-website`**: página de descargas, desplegada por separado.
- **`oisym-mac-intel`, `oisym-mac-universal`, `oisym-windows`**: instantáneas sincronizadas con `development` a petición del proyecto; conservan los recursos y ajustes propios de cada plataforma. El desarrollo compartido continúa en `development`. Consulta [el alcance de esta sincronización](docs/PLATFORM-SYNC.md).

Consulta [la estrategia de Releases](docs/RELEASE-STRATEGY.md) antes de fusionar ramas o publicar una versión.

## Windows: instalar, probar y compilar

Esta rama `oisym-windows` usa Electron 45.3.0 y electron-builder 26.18.0 para Windows 10/11 x64. Requiere Node.js 22.12 o posterior; se comprueba con Node 24 y 26. Las versiones de macOS se compilan desde sus respectivas ramas.

En PowerShell, desde la carpeta del proyecto:

```powershell
git switch oisym-windows
git pull --ff-only origin oisym-windows
npm.cmd ci
npm.cmd test
npm.cmd start
npm.cmd run build:win
```

El instalador queda en `dist/O-Isym-5.0.0-Windows-x64-Setup.exe`. Incluye el icono `app.ico`, asistente en español, selección de carpeta, acceso directo en Inicio y en el escritorio. Conserva los datos de perfiles al actualizar o desinstalar. No se publica ninguna Release automáticamente.

Otros destinos:

```powershell
npm.cmd run build:win:portable
npm.cmd run build:win:dir
```

El portable se genera como `dist/O-Isym-5.0.0-Windows-x64-Portable.exe`. Para notificaciones e inicio automático se recomienda instalar: el portable no registra inicio automático porque su ruta de ejecución es temporal. `npm start` también desactiva ese registro para evitar iniciar `electron.exe` sin la aplicación.

La firma digital está desactivada mediante `signExecutable: false`; el empaquetador sigue aplicando icono y metadatos. Así se evita el flujo antiguo de winCodeSign sin desactivar la edición del icono. Windows puede mostrar editor desconocido porque estos paquetes no tienen certificado de firma.

## Notificaciones y segundo plano en Windows

- El instalador crea el acceso directo de Inicio con la identidad `com.oisym.app`, compartida por Electron y el empaquetador.
- Al cerrar con la X, se guarda y oculta la ventana. O-Isym sigue en la bandeja con sus recordatorios, música y alarmas. Clic o doble clic abre la ventana; el menú **Salir de O-Isym** termina el proceso y los temporizadores.
- Ajustes → Notificaciones incluye una prueba, el botón para abrir la configuración de Windows e inicio automático para la aplicación instalada.
- Windows puede silenciar avisos con No molestar. La disponibilidad de la API no garantiza que Windows muestre cada aviso.
- Mientras el equipo está suspendido no reproduce música ni ejecuta temporizadores. Al reanudar se revisan los avisos pendientes según tus preferencias. Los avisos requieren que O-Isym siga ejecutándose; salir por completo los detiene.
- Pulsar un aviso de tarea abre su tarea; pulsar un aviso de Focus vuelve a abrir O-Isym.

Consulta [la revisión de Windows](docs/WINDOWS-COMPATIBILITY.md). El workflow **Windows installer** compila en Windows, comprueba el icono y los archivos empaquetados, instala y abre la aplicación, y adjunta los `.exe` como artefactos. La entrega visual y el sonido de notificaciones requieren la comprobación final en un equipo Windows.

## Desarrollo y recursos

- `electron/`: proceso principal, almacenamiento, IPC y notificaciones.
- `src/`: interfaz, reglas de aplicación y Focus.
- `assets/avatars/`: avatares.
- `assets/icons/`: iconos de navegación, acciones e ideas.
- `assets/audio/`: música y alarmas.
- `tests/`: pruebas.
- `docs/`: documentación funcional y técnica.
- `docs/RELEASE-STRATEGY.md`: ramas, instaladores y publicación.

La aplicación guarda datos localmente y mantiene copias de respaldo. Antes de probar instaladores nuevos, exporta una copia de tus datos.

## Descargas públicas

La página de O-Isym está en https://polite-caramel-67d540.netlify.app/ . Las nuevas versiones deben publicarse mediante una GitHub Release con instaladores comprobados; solo entonces se actualizan los enlaces del sitio. No anunciar una versión de `development` como estable.
