# O-Isym

O-Isym es una aplicación de organización personal con perfiles, tareas, calendario, actividades, metas, Focus y pizarrones de ideas.

## Estado del repositorio

- **`development`**: base de código en desarrollo, compartida por macOS y Windows.
- **`main`**: todavía conserva documentación de una organización anterior; está pendiente su migración controlada a rama estable de código.
- **`oisym-website`**: página de descargas, desplegada por separado.
- **`oisym-mac-intel`, `oisym-mac-universal`, `oisym-windows`**: instantáneas sincronizadas con `development` a petición del proyecto; conservan los recursos y ajustes propios de cada plataforma. El desarrollo compartido continúa en `development`. Consulta [el alcance de esta sincronización](docs/PLATFORM-SYNC.md).

Consulta [la estrategia de Releases](docs/RELEASE-STRATEGY.md) antes de fusionar ramas o publicar una versión.

## Instalar y probar

Node.js 18.x y npm. Instala desde la raíz del proyecto:

```bash
npm ci
npm test
npm start
```

## Compilar desde el mismo código

Los instaladores se crean desde esta misma rama. Los iconos deben estar disponibles localmente en la raíz: `app.icns` para macOS y `app.ico` para Windows.

| Destino | Comando |
| --- | --- |
| Mac Intel x64 | `npm run build:mac` |
| Mac universal (Intel y Apple Silicon) | `npm run build:mac:universal` |
| Windows x64 NSIS | `npm run build:win` |
| Windows x64 portable | `npm run build:win:portable` |

Las compilaciones se guardan en `dist/`. La existencia de un comando **no certifica** que el instalador haya pasado pruebas. Windows requiere validar el error anterior de permisos de winCodeSign. Para macOS, compilar en Mac; para Windows, preferir un runner Windows. La compilación universal y las notificaciones requieren validación en los dispositivos destino.

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
