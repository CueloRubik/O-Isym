# O-Isym 5

O-Isym es un sistema personal de organización: actividades, tareas, calendario, enfoque y objetivos.

## Requisitos

- Node.js 18.x
- npm 10.x
- Electron 28.3.3 (se instala automáticamente con npm)

## Preparar el proyecto

1. Descarga el ZIP de la rama `oisym-5-development` o clona esa rama.
2. Abre la carpeta del proyecto en Terminal o VS Code.
3. Ejecuta:

   ```bash
   npm install
   ```

4. Inicia la aplicación:

   ```bash
   npm start
   ```

No ejecutes `npm init -y`: el proyecto ya incluye su propio `package.json`.
Tampoco es necesario instalar Electron por separado: `npm install` instala la versión exacta declarada por el proyecto.

## Estructura actual

La reorganización se está haciendo por etapas para no romper las funciones existentes ni perder datos guardados localmente.

- `main.js`: proceso principal de Electron.
- `index.html`, `styles.css`: interfaz actual.
- `app.js`, `calendar.js`, `planner.js`, `timer.js`, `settings.js`: módulos actuales de la interfaz.
- `docs/`: auditoría y hoja de ruta.

## Compatibilidad

La versión de Electron está fijada en **28.3.3**. No actualizar Electron sin comprobar antes la compatibilidad con el equipo de desarrollo.

## Estado

Proyecto en desarrollo. La rama `oisym-5-development` es la rama de trabajo; `main` se conserva como versión principal.
