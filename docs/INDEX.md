# Documentación de O-Isym 5

La rama de desarrollo es `oisym-5-development`. La rama `main` se mantiene separada.

## Documentos vigentes

- [Auditoría técnica, registro de errores y prioridades](QUALITY_AUDIT_OISYM_5.md) — documento principal y fuente vigente para riesgos, correcciones, pruebas y backlog.
- [Hoja de ruta](ROADMAP_OISYM_5.md) — estado de producto y orden recomendado de trabajo.
- [Especificación de perfiles e interfaz](PROFILE_AND_UI_SPEC_OISYM_5.md) — comportamiento esperado de perfiles y pantallas.
- [Auditoría inicial](INITIAL_AUDIT.md) — registro histórico de la primera reconstrucción; no sustituye la auditoría técnica vigente.

## Convenciones

- **Resuelto:** corrección incorporada y acompañada de prueba cuando es viable.
- **Confirmado / pendiente:** comportamiento reproducible o visible en el código que todavía no se corrige.
- **Por verificar:** sospecha que necesita reproducción antes de llamarse error.
- **Mejora:** trabajo de calidad que no implica que la función actual esté rota.

No se deben borrar hallazgos resueltos: se conservan en el historial para conocer qué se arregló y evitar repetir trabajo.
