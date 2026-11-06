# O-Isym — Centro de organización del proyecto

Este repositorio contiene varias líneas de trabajo de O-Isym. **La rama `main` es el centro de documentación y organización del proyecto; no contiene el código de las aplicaciones.**

## Dónde está cada cosa

| Rama | Contenido | ¿Modificar código aquí? |
|---|---|---|
| `main` | Organización, hoja de ruta, especificaciones y ejemplos de datos | No |
| `oisym-mac-intel` | Código y recursos de la versión macOS Intel | Sí, para esa versión |
| `oisym-mac-universal` | Código y recursos de la versión macOS Universal | Sí, para esa versión |
| `oisym-windows` | Código y recursos de la versión Windows x64 | Sí, para esa versión |
| `oisym-website` | Sitio web de O-Isym | Solo para la web |
| `planning/*` | Propuestas de documentación y organización antes de incorporarlas a `main` | No |

Las ramas de las tres aplicaciones se conservan tal como están. No se mezclan ni se sincronizan automáticamente: cada una puede tener configuraciones, iconos, empaquetado o ajustes propios de su plataforma.

## Documentación principal

- [Hoja de ruta](docs/ROADMAP.md)
- [Planificador de ideas](docs/IDEAS-PLANNER.md)
- [Formato de intercambio .oisym](docs/OISYM-FILE-FORMAT.md)
- [Organización de ramas](docs/BRANCH-STRATEGY.md)
- [Estructura del repositorio](docs/REPOSITORY-STRUCTURE.md)
- [Archivo .oisym de ejemplo](examples/blank-project.oisym)

## Orden de prioridades

1. Construir el Planificador de ideas y el formato `.oisym`.
2. Auditar la compatibilidad de Windows.
3. Mejorar planificación diaria, calendario y Focus.
4. Explorar Isym Kids y, mucho más adelante, la miniacademia.

Consulta la [hoja de ruta completa](docs/ROADMAP.md) para conocer los detalles.

## Reglas importantes

- No poner código de aplicación en `main`.
- No modificar una rama de plataforma al trabajar en otra.
- No borrar ni reemplazar código de una versión sin comprobar antes el objetivo y crear respaldo cuando corresponda.
- Las propuestas de organización se trabajan en ramas `planning/*` y se incorporan a `main` mediante Pull Request.
- Mantener los datos del usuario y la compatibilidad como prioridades.
- O-Isym sigue siendo un proyecto personal: no hay presión por comercializarlo ni por seguir fechas artificiales.

## Código y descargas

Para trabajar en una aplicación, abre la rama correspondiente a su plataforma. Para consultar planes y decisiones del proyecto, comienza aquí, en `main`.
