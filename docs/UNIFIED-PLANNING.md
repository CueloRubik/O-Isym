# Organización Unificada — Planificación diaria y calendario avanzado

**Estado:** bloques A–E integrados en `development`; pruebas automatizadas incorporadas, verificación manual en macOS Catalina pendiente. Consulta [el informe de implementación](UNIFIED-PLANNING-IMPLEMENTATION.md).
**Rama:** development.
**Prioridad actual:** macOS Intel / experiencia central de O-Isym.
**Aplazado:** auditoría específica de Windows, integración con servicios externos y nuevas funciones educativas.

## 1. Diagnóstico de la aplicación actual

El código revisado ya contiene:
- `profile.tasks` con `dueDate`, `scheduledDate`, `startTime`, `endTime`, duración estimada, prioridad, estado y recordatorios.
- `profile.activities` como definiciones reutilizables con nombre, categoría, duración y frecuencia.
- `renderToday` y `renderCalendar` (mes y semana).
- `renderPlannerAgenda` y `analyzeSchedule` para propuestas de planificación.
- `Focus` asociado opcionalmente a tareas.
- `ideaBoards` independientes y la sección `planner` que ahora presenta biblioteca, editor y una agenda heredada.

**Problema a evitar:** sumar un segundo planificador, un segundo calendario o una segunda colección de tareas en lugar de coordinar los existentes.

## 2. Principio rector: una fuente de verdad

Un registro se define una vez y se muestra desde diferentes perspectivas. Cambios desde Hoy, Calendario, Tareas o la futura planificación diaria se reflejan en todas.

| Concepto | Qué representa | Colección de referencia |
| --- | --- | --- |
| Actividad | Definición reutilizable (por ejemplo, practicar violín) | `activities` |
| Tarea | Acción concreta, realizable o pendiente | `tasks` |
| Evento/compromiso | Bloque horario que ocupa tiempo, sin obligación de completarse | Nueva colección `events`, solo tras diseñar migración |
| Objetivo | Resultado de largo plazo; puede enlazar tareas | `goals` |
| Focus | Sesión de concentración, vinculable a una tarea | `focusSessions` / `activeFocus` |
| Pizarrón | Espacio de ideas; referencia opcional a tareas existentes | `ideaBoards` |

**Evitar duplicación:** no crear copias de tareas al verlas en Hoy/Calendario. No crear un evento para cada tarea programada; un elemento visual del calendario se deriva de `tasks` o `events`, y mantiene `kind` e `id` del registro original.

Los nodos de actividad de los pizarrones siguen siendo entidades propias hasta diseñar una vinculación explícita. Convertir una idea en tarea debe crear un registro una sola vez y, si procede, guardar el `taskId`; nunca sincronizar dos estados independientes por aproximación de título.

## 3. Navegación propuesta

- **Hoy:** resumen de tareas pendientes, línea temporal del día, próximos compromisos, tareas atrasadas y botón de planificación. No es otra colección.
- **Calendario:** lugar central para organizar fechas y horas. Modos mes, semana, día y agenda/lista accesible. El plan diario se edita aquí, y se accede a él también desde Hoy.
- **Tareas:** bandeja de entrada (sin programar), todas, pendientes, completadas, filtros y edición detallada. Incluye fecha límite y fecha programada diferenciadas.
- **Actividades:** catálogo de rutinas o acciones reutilizables; crear una tarea a partir de ellas.
- **Objetivos:** progreso y tareas relacionadas.
- **Focus:** control de sesiones; iniciar desde una tarea u operar libremente.
- **Pizarrones:** biblioteca y editor de ideas independientes; la agenda heredada se traslada con cuidado al Calendario antes de retirar su acceso duplicado.
- **Ajustes:** preferencias globales o por perfil de semana, horario habitual, recordatorios y planificación.

En pantallas estrechas, evitar barras y paneles simultáneos; mostrar panel de detalle bajo demanda, conservar acceso por teclado y utilizar lenguaje comprensible.

## 4. Flujo diario único

1. **Capturar:** añadir tareas a una bandeja de entrada sin exigir hora ni fecha.
2. **Priorizar:** asignar prioridad, fecha límite y estimación si se conocen.
3. **Planificar:** abrir el día en Calendario, revisar tiempo disponible, arrastrar o asignar tareas a bloques horarios; respetar compromisos y bloqueos.
4. **Sugerir (opcional):** reutilizar `analyzeSchedule` como motor de propuestas, mostrar razones y conflictos, y exigir aprobación antes de aplicar cambios.
5. **Ejecutar:** consultar Hoy, iniciar Focus desde la tarea y marcar avance o finalización.
6. **Revisar:** mover lo no terminado con decisión explícita; no reprogramar silenciosamente.

Los días pueden quedar parcialmente planificados. No imponer un porcentaje de productividad ni exigir un horario rígido.

## 5. Calendario avanzado: alcance gradual

**Primera entrega**
- Modo día con línea temporal y horas claras.
- Conservar modos semana y mes; corregir consistencia y navegación.
- Abrir el mismo editor de tareas desde cualquiera de las vistas.
- Distinguir visualmente fecha límite de bloque programado.
- Conflictos y superposiciones evidentes; prevenir intervalos inválidos.
- Visibilidad de tareas sin hora y de compromisos bloqueados.
- Navegación por teclado y estados vacíos útiles.

**Segunda entrega**
- Eventos/compromisos nativos (con diseño de esquema y migración).
- Plantillas de día como configuración que crea o propone **instancias de tarea**, nunca copias de una colección paralela.
- Repeticiones/rutinas con reglas explícitas de ocurrencia, excepciones y edición de una sola instancia frente a toda la serie.
- Desplazamiento de bloques mediante arrastre accesible también por controles de teclado.
- Filtros y personalización por perfil.

**Posterior**
- Vistas y preferencias avanzadas según pruebas con usuarios; importación de calendarios externos solo si aporta valor real.

## 6. Decisiones de datos y arquitectura

- Mantener `tasks` y `activities` como fuente vigente y preservar IDs.
- Crear selectores derivados puros: `getItemsForDay(profile,date)`, `getCalendarRange(profile,start,end)`, `getUnscheduledTasks(profile)`, `detectScheduleConflicts(...)`. No persistir copias de estas listas.
- Un solo servicio de mutaciones de tareas; validación y rollback ante fallo de guardado en cualquier vista.
- Reutilizar el editor existente, sin formularios independientes en Hoy y Calendario.
- Extraer gradualmente los renderers de `src/app.js`, que hoy contiene Hoy, Calendario y la agenda heredada. No hacer una reescritura total.
- Separar modelo de dominio, selectores de consulta, reglas del planificador, componentes de calendario y accesibilidad.
- Fechas civiles en formato `YYYY-MM-DD`; horas locales validadas; documentar zonas horarias y cambios de horario. No confundir fecha límite con inicio programado.
- Las notificaciones se deducen del horario canónico y se recalculan al editar, mover o borrar registros.
- La persistencia actual con copias de seguridad se conserva. Cualquier cambio de esquema debe incluir migración, importación antigua y pruebas.
- El planificador no debe modificar tareas bloqueadas sin permiso ni aplicar sugerencias sin confirmación.

### Ejemplo del modelo

```text
Activity(id) ---[plantilla/origen]---> Task(id)
Task(id) -----[vista derivada]-------> Hoy / Calendario / Tareas
Task(id) -----[sesiones]------------> Focus
Goal(id) -----[relación opcional]----> Task(id)
IdeaNode(id) -[referencia opcional]--> Task(id)
Event(id) ---[vista derivada]-------> Calendario / Hoy
```

## 7. Plan de implementación en bloques

### Bloque A — Fundamentos sin rediseño visual
- Inventario de los flujos actuales y campos de datos.
- Definir reglas comunes de fechas, conflictos y prioridades.
- Crear selectores de datos compartidos y pruebas.
- Unificar operaciones de creación, edición, traslado y completado.
- Verificar preservación de datos, perfiles y backups.

### Bloque B — Calendario y agenda unificados
- Incorporar vista día al Calendario actual.
- Trasladar las acciones útiles de `renderPlannerAgenda` sin perderlas.
- Unificar editor y selección de fecha entre Hoy y Calendario.
- Conservar enlaces/atajos antiguos durante la transición.

### Bloque C — Planificación diaria
- Bandeja de entrada de tareas no planificadas.
- Bloques temporales, conflictos, tiempo libre y propuestas confirmadas.
- Resumen de Hoy coherente con Calendario.
- Pruebas de navegación, cambios de fecha y guardado fallido.

### Bloque D — Plantillas y rutinas
- Diseñar modelo de plantillas y recurrencia con excepciones.
- Crear propuestas e instancias idempotentes, sin duplicados.
- Configuración opcional y adaptable; no obligar a usar plantillas.

### Bloque E — Pulido y validación
- Accesibilidad, rendimiento, ventanas pequeñas, uso sin ratón.
- Pruebas manuales en macOS Catalina y regresión de Focus, pizarrones y notificaciones.
- Actualizar documentación y registrar cambios; no publicar hasta validar.

## 8. Criterios de aceptación

- Una tarea modificada en cualquier vista refleja sus cambios en todas sin duplicados.
- Completar una tarea desde Hoy actualiza Calendario, Tareas y enlaces a Focus.
- Añadir fecha límite no inventa una hora de ejecución.
- Reprogramar un bloque actualiza los recordatorios sin duplicarlos.
- Rechazar una propuesta no modifica ninguna tarea.
- Una plantilla aplicada dos veces no produce instancias repetidas involuntariamente.
- Una migración conserva tareas y perfiles de instalaciones anteriores.
- El fallo de guardado revierte o retiene de manera explícita el estado, sin falsa confirmación.
- El calendario es operable mediante teclado y entendible sin colores como única señal.
- Pizarrones y Focus permanecen accesibles con comportamiento anterior intacto.

## 9. Fuera de alcance ahora

Auditoría específica de Windows, sincronización remota, colaboración multiusuario, inteligencia artificial obligatoria, Isym Kids y academia. Mantener sus ideas en la hoja de ruta general, sin bloquear esta etapa.

## 10. Situación tras la implementación

Los bloques A–E están integrados en `development` con las limitaciones y pruebas indicadas en [el informe de implementación](UNIFIED-PLANNING-IMPLEMENTATION.md). Antes de publicar instaladores es necesario realizar la comprobación manual en macOS Catalina. Los eventos nativos y el arrastre gráfico de bloques permanecen reservados para una ampliación posterior con migración explícita. No fusionar con `main` ni publicar nuevas Releases sin esa validación.
