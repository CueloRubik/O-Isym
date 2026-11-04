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
| 8 | Planificador | Planificador 2.0: huecos reales, fechas límite, prioridades, explicaciones y vista previa segura |
| 9 | Focus | Duración por sesión y actividad, alarma configurable, aviso del sistema, resumen diario y recuperación al reabrir |
| 10 | Objetivos e Insights | Implementación inicial |
| 11 | Recomendaciones y autonomía | Implementación inicial; reglas locales explicables |
| 12 | Calidad, accesibilidad y publicación | Atajos y navegación accesible implementados; faltan validación manual en Mac, integración y empaquetado |
| 13 | Identidad visual personalizable | Primera entrega: avatar, tres temas claros y reducción de movimiento por perfil; selector visual más completo y prueba de creación de perfiles pendientes |

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
4. Accesos de teclado y navegación del calendario implementados; pruebas de cambio de fecha y límites de año añadidas.
5. Probar manualmente la recuperación de Focus, la alarma y los avisos al suspender el Mac, minimizar y reabrir O-Isym.
6. Diseñar el sistema de avatares y personalización visual configurable por perfil.
7. Completar accesibilidad, pruebas de integración y empaquetado.


## Avance: Planificador 2.0
- Motor de horarios que busca huecos continuos reales dentro de la jornada configurada.
- Respeta tareas bloqueadas, tareas programadas en otros días y compromisos con hora.
- Prioriza fechas límite cercanas y prioridad de tarea; explica cada horario propuesto.
- Señala tareas vencidas y tareas que no caben en la jornada, en lugar de colocarlas fuera de contexto.
- Presenta una vista previa editable por aceptación o descarte antes de guardar cambios.
- Pruebas automáticas para huecos, colisiones, vencimientos, prioridades y horarios inválidos.


## Avance: accesibilidad y navegación
- Atajos de teclado para crear tareas, volver a Hoy, navegar días/meses/semanas y consultar ayuda rápida.
- Navegación por teclado desactivada mientras se escribe en campos para evitar interferencias.
- Etiquetas accesibles y estado seleccionado en las celdas del calendario.
- Indicadores de foco visibles para controles interactivos.
- Pruebas de navegación en años nuevos y días bisiestos.


## Avance: personalización visual inicial
- Cada perfil conserva su propio avatar, tema claro y preferencia de movimiento.
- La creación de perfiles ya ofrece un diálogo guiado para elegir nombre, avatar, tema y color; el avatar también aparece en el selector lateral.
- Temas Clásico, Cálido y Cielo mantienen contraste y jerarquía profesional.
- La opción de movimiento reducido desactiva transiciones y animaciones no esenciales.
- Los perfiles antiguos reciben valores predeterminados seguros; no se altera su contenido.
- Pendiente: selector de avatares más gráfico con vista previa en vivo y revisión visual completa en macOS.


## Avance: Insights 2.0
- Métricas semanales de tareas, tiempo total de enfoque y duración media por sesión.
- Gráficas diarias de tareas completadas y minutos de concentración, escaladas según los datos reales.
- Distribución de tiempo por actividad durante los últimos 30 días.
- Panorama de fechas límite próximas y objetivos activos, con lenguaje neutral y sin rachas ni puntuaciones.
- Se ignoran sesiones con fechas inválidas para evitar errores al mostrar estadísticas.


## Avance: navegación adaptable y accesibilidad
- Se eliminó la región viva que envolvía toda la aplicación; ahora solo los avisos anuncian cambios a lectores de pantalla.
- Enlace para saltar directamente al contenido principal.
- Navegación identifica la sección actual mediante aria-current.
- Diálogo de perfil cerrable con Escape o al pulsar fuera, con vista previa del avatar.
- La interfaz ya no impone un ancho mínimo global de 780 px: sidebar, navegación, formularios y calendario se adaptan a ventanas estrechas.
- Preferencia del sistema para reducir movimiento respetada en CSS.
