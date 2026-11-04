# O-Isym 5 — Plan maestro y estado

Rama de trabajo: \`oisym-5-development\`. La rama \`main\` permanece separada.

## Visión

O-Isym es un sistema personal para organizar el día, las tareas, las actividades, el tiempo y los objetivos. Debe ayudar sin imponer una agenda ni convertir el descanso en una falta.

## Decisiones de producto

- Interfaz luminosa, moderna, clara, colorida con intención y sin gradientes decorativos.
- Personalización por perfil: experiencias visuales apropiadas para niños, adolescentes y adultos, siempre configurables y sin limitar funciones.
- Avatares predeterminados seleccionables al crear perfiles, con posibilidad de cambiarlos después.
- Temas, ilustraciones y animaciones opcionales; respetar preferencias de accesibilidad y rendimiento.
- Un perfil principal y perfiles adicionales opcionales, con datos independientes.
- Actividades como definiciones reutilizables; tareas como instancias concretas.
- Calendario y planificador conectados a las mismas tareas.
- Modos de autonomía manual, sugerido, híbrido y automático.
- Los compromisos bloqueados nunca se reprograman automáticamente.
- Focus puede asociarse a una tarea o ser libre.
- Almacenamiento local JSON versionado, respaldos y migración segura.
- Electron 28.3.3, sin dependencias adicionales de interfaz.

## Etapas y progreso

| Etapa | Alcance | Estado |
|---|---|---|
| 0 | Inventario y conservación del prototipo | Completado |
| 1 | Seguridad Electron y almacenamiento | CI aprobada; validación manual en Mac pendiente |
| 2 | Modelo de dominio y perfiles | Implementado; edición de actividades y objetivos añadida |
| 3 | Sistema visual y navegación | Implementado en esta versión |
| 4 | Catálogo de actividades | Implementado en esta versión |
| 5 | Tareas y captura rápida | Mejorado: edición completa, búsqueda y validación de fechas/horas |
| 6 | Panel Hoy | Implementado en esta versión |
| 7 | Calendario y agenda | Vista mensual y semanal; selección de día y acceso rápido a tareas |
| 8 | Planificador | Implementación inicial; huecos y compromisos bloqueados |
| 9 | Focus | Duración por sesión y actividad, alarma configurable, aviso del sistema, resumen diario y recuperación al reabrir |
| 10 | Objetivos e Insights | Implementación inicial |
| 11 | Recomendaciones y autonomía | Implementación inicial; reglas locales explicables |
| 12 | Calidad, accesibilidad y publicación | Pendiente de pruebas y empaquetado |
| 13 | Identidad visual personalizable | Planificado: avatares, temas por etapa/preferencia y animaciones opcionales |

## Modelo principal

Profile contiene preferencias y colecciones de Activity, Task, Goal y FocusSession. Task distingue estado, prioridad, fecha límite, fecha programada, horario y bloqueo. Los bloques del calendario se derivan de las tareas, evitando duplicar la fuente de verdad.

## Arquitectura

- \`electron/\`: proceso principal, preload, IPC y almacenamiento.
- \`src/domain.js\`: creación, normalización, validación y reglas.
- \`src/app.js\`: navegación, vistas y acciones.
- \`src/styles/app.css\`: sistema visual.
- \`tests/\`: pruebas de dominio y almacenamiento.
- \`legacy/\` y \`src/scripts/\`: referencia del prototipo, no cargada por la nueva interfaz.

## Criterio de aceptación

Una función no se considera validada hasta comprobar su flujo completo, persistencia tras reiniciar, errores previsibles y pruebas automatizadas. La suite automatizada debe pasar en CI y la revisión manual en macOS es obligatoria antes de fusionar a main.

## Trabajo pendiente

1. Ejecutar \`npm test\` y resolver cualquier fallo.
2. Validar instalación y apertura en el Mac.
3. Completar búsqueda y filtros, y validar edición de actividades y objetivos.
4. Añadir accesos de teclado y pruebas de navegación del calendario.
5. Probar manualmente la recuperación de Focus, la alarma y los avisos al suspender el Mac, minimizar y reabrir O-Isym.
6. Diseñar el sistema de avatares y personalización visual configurable por perfil.
7. Completar accesibilidad, pruebas de integración y empaquetado.
