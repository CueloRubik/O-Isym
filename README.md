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
# Las pruebas de interfaz requieren jsdom, sin cambiar package.json ni el lockfile:
npm install --no-save --package-lock=false --ignore-scripts jsdom@22.1.0
npm test
npm start
```

## Compilación de Windows pendiente

Esta rama recibe el código actual de `development`, pero conserva **sin cambios** su `package.json`, `package-lock.json`, configuración de empaquetado e iconos. Por ello, el paquete mantiene su versión anterior (`5.0.0`); no representa una nueva Release. No se incorporan aquí los comandos nuevos `build:win` ni el workflow de instaladores de `development`.

La generación y validación de instaladores Windows queda para una tarea posterior. Esta sincronización no corrige ni valida el problema de permisos de winCodeSign, ni publica o reemplaza descargas.

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
