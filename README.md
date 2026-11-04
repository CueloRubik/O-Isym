# O-Isym 5

Sistema personal de organización y planificación.

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
No instales otra versión de Electron: está fijada en 28.3.3.

## Estructura

```text
O-Isym/
├── electron/
│   └── main.js
├── src/
│   ├── scripts/
│   │   ├── app.js
│   │   ├── calendar.js
│   │   ├── planner.js
│   │   ├── timer.js
│   │   └── settings.js
│   └── styles/
│       └── styles.css
├── docs/
│   ├── INITIAL_AUDIT.md
│   └── ROADMAP_OISYM_5.md
├── legacy/
│   └── renderer.js
├── index.html
├── package.json
└── .gitignore
```

`index.html` se mantiene en la raíz deliberadamente: así evitamos cambiar innecesariamente la ubicación del documento principal mientras la aplicación todavía guarda preferencias y datos con `localStorage`. El renderer antiguo se conserva en `legacy/` porque no está conectado al HTML actual; no se ejecuta.

La configuración de seguridad de Electron y la migración del almacenamiento se harán en etapas posteriores, no como parte de este simple movimiento de archivos.
