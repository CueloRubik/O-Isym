# Estructura del repositorio

## Vista general

```text
O-Isym/
├── README.md
├── docs/
│   ├── ROADMAP.md
│   ├── IDEAS-PLANNER.md
│   ├── OISYM-FILE-FORMAT.md
│   ├── BRANCH-STRATEGY.md
│   └── REPOSITORY-STRUCTURE.md
└── examples/
    └── blank-project.oisym
```

Esta es la estructura deseada de `main`. Debe contener documentación y ejemplos portátiles, no archivos de la aplicación ni recursos de compilación.

## Responsabilidad por rama

### `main`

Centro de coordinación del proyecto:
- Visión y principios.
- Hoja de ruta y prioridades.
- Especificaciones funcionales.
- Decisiones de arquitectura.
- Formatos de intercambio y ejemplos.

### Ramas de plataforma

Las ramas `oisym-mac-intel`, `oisym-mac-universal` y `oisym-windows` conservan sus propios archivos ejecutables, código, recursos, pruebas, configuración de Electron y empaquetado. Su estructura interna no se modifica en esta reorganización.

### `oisym-website`

Conserva por separado los archivos del sitio web. No se mezcla con el código de escritorio ni con la documentación central salvo que exista una razón concreta.

### Ramas `planning/*`

Contienen propuestas temporales de documentación. Una vez revisadas, se incorporan a `main` mediante Pull Request.

## Criterio para el futuro

Si más adelante se decide compartir módulos entre plataformas, primero se diseñará y documentará una estrategia de arquitectura y pruebas. No se moverá código ni se fusionarán ramas solo para que el árbol parezca más uniforme.
