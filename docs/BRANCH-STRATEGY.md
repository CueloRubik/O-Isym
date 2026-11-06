# Estrategia de ramas de O-Isym

## Objetivo

Separar claramente el código que se ejecuta y distribuye en cada sistema operativo de la documentación que explica cómo evoluciona el proyecto.

## Ramas permanentes

| Rama | Responsabilidad |
|---|---|
| `main` | Centro de documentación, decisiones, hoja de ruta y formatos de intercambio. Sin código de aplicación. |
| `oisym-mac-intel` | Versión de O-Isym para macOS Intel. |
| `oisym-mac-universal` | Versión de O-Isym para macOS Universal. |
| `oisym-windows` | Versión de O-Isym para Windows x64. |
| `oisym-website` | Sitio web y recursos propios de la página. |

Estas ramas ya existen y se mantienen con sus nombres actuales para no romper enlaces, automatizaciones, descargas ni hábitos de trabajo.

## Ramas de trabajo

### `planning/<tema>`

Para propuestas, estructura del proyecto, hojas de ruta y documentación. Se crean desde `main` y se integran mediante Pull Request a `main`.

Ejemplos:
- `planning/project-structure`
- `planning/oisym-roadmap`

### `feature/<tema>`

Para desarrollar una función nueva. Debe partir de la rama de plataforma que vaya a recibir el cambio. Si una función debe existir en varias plataformas, se revisa y adapta en cada una; no se presupone que sus archivos sean intercambiables.

Ejemplos:
- `feature/ideas-planner` si el desarrollo se realiza primero sobre una rama de plataforma elegida.
- `feature/calendar-improvements`

### `fix/<tema>`

Para corregir un problema concreto, partiendo de la rama afectada.

### `release/<version>-<plataforma>`

Opcional y temporal, para preparar y verificar una distribución. Se crea desde la rama de plataforma correspondiente y se conserva solo mientras sea útil.

## Reglas de integración

1. Los Pull Requests de documentación se dirigen a `main`.
2. Los Pull Requests de código se dirigen a la rama de plataforma correspondiente.
3. No fusionar automáticamente macOS Intel, macOS Universal y Windows entre sí.
4. No usar `main` como rama de desarrollo de la aplicación.
5. Antes de integrar cambios, revisar archivos modificados y confirmar que pertenecen al ámbito correcto.
6. No borrar ramas de plataforma ni cambiarles el nombre sin revisar antes enlaces de descarga, workflows y despliegues.
7. Las ramas de planificación pueden mantenerse mientras se estén usando; una vez integradas y sin trabajo pendiente, se pueden eliminar.

## Por qué se conserva la separación actual

Las tres ramas de aplicación contienen el código completo y los recursos específicos de sus versiones. Esta reorganización no intenta unificar ese código ni cambiar su arquitectura. La separación evita que una limpieza documental altere las aplicaciones que ya funcionan.
