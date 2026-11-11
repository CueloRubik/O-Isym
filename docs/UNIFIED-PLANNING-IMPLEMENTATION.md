# Organización unificada — implementación en development

**Estado:** código integrado en `development`, con pruebas automatizadas. La comprobación manual en macOS Catalina está pendiente antes de cualquier distribución.
**Alcance:** bloques A–E de `UNIFIED-PLANNING.md`, sin introducir un segundo almacén de tareas ni modificar el esquema de archivo número 1.

## Inventario y decisiones de arquitectura (A)

| Registro o servicio | Fuente actual | Uso |
| --- | --- | --- |
| Tareas | `profile.tasks` | Captura, estado, fechas, horas, prioridad, bloqueo, recordatorios e instancias de plantillas |
| Actividades | `profile.activities` | Definiciones de uso repetido y origen opcional para tareas |
| Objetivos | `profile.goals` | Progreso y fecha objetivo |
| Focus | `profile.activeFocus` / `focusSessions` | Sesiones y asociaciones por `taskId` |
| Pizarrones | `profile.ideaBoards` | Editor y biblioteca independientes |
| Plantillas | `profile.dayTemplates` | Reglas de repetición y bloques previstos; **no son tareas ejecutadas** |
| Calendario y Hoy | Selectores de `src/planning.js` | Proyecciones temporales, sin colecciones duplicadas |

`src/planning.js` ofrece `getItemsForDay`, `getCalendarRange`, `getUnscheduledTasks`, `detectScheduleConflicts`, `getFreeTimeSlots`, `taskMutation`, `createDayTemplate`, `previewDayTemplate` y `applyDayTemplate`. Las fechas son civiles (`YYYY-MM-DD`) y las horas se expresan como hora local de 24 horas (`HH:mm`). Una fecha límite no crea una reserva temporal ni activa un recordatorio horario por sí misma.

`taskMutation` concentra las operaciones de alta, edición, traslado, completado reversible y eliminación. Se preservan los identificadores originales; editar una tarea en otra vista modifica el mismo registro. La escritura se realiza mediante la cola de guardados y copias de seguridad existentes. Se recupera el perfil anterior si falla un guardado. Los intervalos inválidos son rechazados por el dominio; los horarios superpuestos requieren confirmación y los bloqueos se mantienen.

## Calendario y planificación (B y C)

- Calendario presenta **Mes, Semana, Día y Agenda** desde los mismos registros. Las selecciones y los atajos continúan disponibles.
- Día/Agenda muestran los bloques ordenados por hora, sus prioridades, los compromisos bloqueados, los intervalos libres y las advertencias por superposición.
- La bandeja de entrada recoge tareas pendientes sin fecha programada; se pueden vincular al día elegido sin inventar una hora.
- El editor existente de tareas se utiliza también desde Calendario y Hoy. No se crea un formulario de tarea paralelo.
- La planificación asistida conserva el motor `analyzeSchedule`. La vista previa, el descarte sin cambios y la aceptación explícita preceden la escritura.
- Hoy muestra las tareas y bloques del día en el mismo modelo y enlaza con Calendario. La agenda anterior sale de la navegación de Pizarrones; la biblioteca y el lienzo de ideas permanecen independientes.

## Plantillas y recurrencia (D)

`dayTemplates` es una propiedad opcional de cada perfil. Cada plantilla tiene `id`, nombre, `entries` y una regla `recurrence` con días de semana, vigencia y excepciones. Se pueden crear plantillas, agregar o retirar bloques, editar su nombre y regla, previsualizar una fecha, excluir fechas y aplicar solo después de confirmación.

Las propuestas no modifican tareas. La aplicación genera tareas reales con `templateId`, `templateEntryId` y `templateOccurrenceDate`. La clave de ocurrencia se conserva aunque se cambie de fecha la tarea creada, evitando regenerarla al volver a aplicar la plantilla para el día original. Las tareas creadas pueden editarse individualmente sin modificar la serie; eliminar la plantilla o un bloque conserva las tareas anteriores.

La repetición **no genera tareas automáticamente** al iniciar O-Isym ni al abrir un día. El usuario elige cuándo aplicar las propuestas, para evitar cambios involuntarios y notificaciones duplicadas.

## Compatibilidad, validación y límites (E)

- No se incrementa `schemaVersion` (sigue en **1**) y los perfiles antiguos que carecen de `dayTemplates` se normalizan a una lista vacía.
- No se modifica el modelo existente de Focus, los pizarrones ni el motor de guardado / recuperación.
- Las notificaciones siguen saliendo de `profile.tasks` y sus fechas y horas. No hay otro programador de avisos.
- Los formularios están operables con teclado; se corrigió el selector de controles que retienen el foco en diálogos y se añadieron estilos para ventanas estrechas.
- Se comprueban sintaxis de `src/app.js` y `src/planning.js` y pruebas con Node 18 en GitHub Actions (`development`).
- Hay pruebas de selectores, choques horarios, intervalos, recurrencia, idempotencia, aislamiento de perfiles, datos antiguos, edición desde el calendario, guardado fallido, Focus y Pizarrones.

**Limitaciones deliberadas:** no hay todavía una colección `events` ni una migración de eventos nativos, arrastre gráfico de bloques o sincronización externa. Son partes de la ampliación prevista en el diseño, pero no deben simularse creando una segunda colección de tareas. Los bloques se pueden ajustar desde el editor accesible.

## Comprobación manual necesaria en macOS Catalina 10.15.7

Antes de compilar para distribución en la Mac real:

1. En `development`, ejecutar `npm ci`, `npm test` y `npm start`.
2. Abrir datos de un perfil existente y verificar tareas, pizarrones, Focus, archivos `.oisym` y copias de seguridad.
3. Probar Mes/Semana/Día/Agenda con teclado y ratón; introducir, editar, completar y mover una tarea y comprobar que aparece igual en Hoy, Calendario y Tareas.
4. Crear una plantilla, aplicar dos veces en la misma fecha, editar una instancia y volver a aplicar. No deben aparecer duplicados.
5. Comprobar superposiciones y bloqueos, descartar y aceptar propuestas, e intentar un cambio con almacenamiento temporalmente inaccesible para verificar recuperación.
6. Probar notificaciones al adelantar o mover una tarea con hora; verificar que no se envían avisos duplicados.
7. Verificar animaciones, diseño y botones en ventanas estrechas, salida de Focus y cierre de la aplicación con datos pendientes de guardar.
8. Si todo es correcto, compilar **localmente** con `npm run build:mac` (Intel) o `npm run build:mac:universal`; probar los instaladores en los dispositivos destino antes de publicar.

La CI de GitHub utiliza Linux y **no demuestra por sí sola** que la interfaz Electron o las notificaciones funcionen en Catalina. No se han publicado Releases ni se ha fusionado con `main`.
