# Rediseño de experiencia: espacio de trabajo unificado
Estado: implementación en rama `development`, pendiente de verificación manual en macOS Catalina.

## Arquitectura de navegación
- **Planificar**: Hoy, Calendario, Tareas, Actividades, Objetivos. Todas muestran registros del perfil activo, sin colecciones duplicadas.
- **Crear y analizar**: Pizarrones, Focus, Estadísticas. No se mezclan con el calendario.
- **Cuenta**: selector de perfiles y ajustes, siempre accesibles.
- Encabezado persistente de contexto: sección activa, navegación directa al día y captura rápida de tareas.
- Navegación colapsable para aprovechar ventanas pequeñas. Iconos con nombres accesibles y grupos etiquetados.

## Flujos
1. Capturar una tarea desde cualquier pantalla: abre un único editor reutilizable en un panel lateral (ventana compacta en pantallas estrechas).
2. Planificar una tarea existente: accede al mismo editor y enfoca el campo de fecha. El registro conserva su ID.
3. Calendario: mes y semana para localizar días; día con representación visual de intervalos y superposiciones; agenda textual accesible. Todas derivan de `profile.tasks`.
4. Hoy: resumen visual, acceso a planificación y Focus; sin estado de tareas propio.
5. Plantillas: aplicaciones explícitas que crean instancias de tareas idempotentes. Los pizarrones continúan independientes.

## Accesibilidad y compatibilidad
- Botones reales, `aria-current`, grupos de navegación y encabezados semánticos.
- Editor con nombre accesible, Escape, control de foco, cierre consciente de cambios, confirmación ante conflictos y recuperación ante fallo de guardado.
- CSS claro adaptable a Catalina/Electron 28 sin APIs experimentales.
- Movimiento opcional según preferencias de perfil, con respeto a `prefers-reduced-motion`.
- Nuevos componentes de agenda deben mantener una alternativa textual, sin depender de arrastre ni de color.

## No cambiar
- Motor de persistencia, backups, modelo Focus, API de pizarrones, formato .oisym, esquema de perfiles, `main`, Releases y trabajo específico de Windows.

## Revisión
- Verificar navegación entre secciones, búsqueda, selección de perfiles, editor de tareas, planificador, horarios superpuestos, plantillas, teclado, Focus y pizarrones.
- Ejecutar `npm test` y validación de sintaxis en CI. Una ejecución CI sobre Linux no reemplaza validación en un Mac con Catalina.

## Implementación realizada

- `src/app.js`: navegación agrupada (Planificar, Explorar y crear, Tu espacio), menú colapsable y encabezado con acciones persistentes. Los perfiles mantienen su selector.
- `src/app.js`: Hoy integra un resumen de cuatro indicadores, horario antes de la lista y accesos directos a tareas y Calendario.
- `src/planning.js`: `getTimelineLayout` distribuye los intervalos con superposiciones por columnas, sin duplicar ni persistir tareas.
- `src/app.js`: Calendario Día usa cuadrícula horaria real con ruler; Agenda conserva la alternativa textual accesible, y Mes/Semana siguen disponibles.
- `src/app.js`: un panel lateral de tarea para crear, editar y programar. Los botones Programar/Mover abren ese editor, con foco directo en fecha; Guardar es la única mutación.
- `src/app.js`: descartar cambios del editor exige confirmación. Mover compromisos bloqueados exige aprobación. El menú de tareas usa botones explícitos para bloquear, posponer al día siguiente o eliminar.
- `src/app.js`: Actividades y Objetivos usan el mismo patrón visual de panel lateral, preservando sus formularios y mutaciones.
- `src/styles/workspace.css`: estilos claros y adaptables que no reescriben la presentación interna de Pizarrones ni Focus.
- `index.html`: carga `workspace.css` después de `app.css`.
- `tests/planning.test.js`, `tests/planning-ui.test.js`: regresiones del algoritmo temporal, menú, flujos de edición, superposición, protección de cambios y regresiones previas.
- `.github/workflows/tests.yml`: añade job de comprobación en macOS 15 con Node 18, aparte de Linux. **macOS 15 no es macOS Catalina**; es cobertura complementaria.

## Reglas conservadas

- No se alteran esquema, migraciones, Focus, Pizarrones, copias de seguridad ni importación `.oisym`.
- Las propuestas de planificación no se aplican sin autorización.
- Los horarios de tareas siguen siendo una única fuente canónica. Fecha límite no crea automáticamente un bloque.
- El interfaz no requiere arrastrar bloques: hay siempre un botón Editar y campos accesibles con teclado.

## Limitaciones pendientes de la revisión manual

Las capturas visuales, los avisos nativos y la apertura/instalación real sobre macOS Catalina 10.15.7 necesitan pruebas en el equipo de destino. La CI valida reglas y DOM con simulación, no el renderizador de Electron en un equipo Catalina. No se ha publicado instalador ni Release.
