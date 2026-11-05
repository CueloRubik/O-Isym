# Catálogo de iconos de O-Isym

Los PNG se organizan por función para evitar una carpeta de recursos desordenada. Se mantienen los archivos originales sin recomprimir ni alterar.

## Navegación

| Archivo | Uso |
|---|---|
| `navigation/today.png` | Vista Hoy |
| `navigation/tasks.png` | Vista Tareas |
| `navigation/activities.png` | Vista Actividades |
| `navigation/calendar.png` | Vista Calendario |
| `navigation/planner.png` | Vista Planificador |
| `navigation/goals.png` | Vista Objetivos |
| `navigation/insights.png` | Vista Insights |

## Focus

| Archivo | Uso |
|---|---|
| `focus/timer.png` | Sesión Focus activa |
| `focus/break.png` | Descanso activo |
| `focus/pause.png` | Sesión pausada |
| `focus/zen.png` | Estado inicial, listo para concentrarse |

## Tareas

| Archivo | Uso |
|---|---|
| `tasks/filter.png` | Identifica el control de filtros |
| `tasks/priority.png` | Acompaña la prioridad en las filas de tareas |
| `tasks/reminder.png` | Reservado: la interfaz actual no tiene una función de recordatorio individual que justifique mostrarlo |
| `tasks/repeat.png` | Reservado: la interfaz actual no implementa tareas recurrentes |

## Acciones

| Archivo | Uso |
|---|---|
| `actions/edit.png` | Editar tareas, actividades, objetivos y perfiles |
| `actions/profiles.png` | Vista Perfiles y su acceso en la navegación |
| `actions/save.png` | Guardar cambios en formularios y ajustes |
| `actions/export.png` | Exportar perfiles y copias de datos |
| `actions/duplicate.png` | Duplicar la configuración de un perfil |
| `actions/archivate.png` | Archivar actividades y objetivos |

## Interfaz

| Archivo | Uso |
|---|---|
| `interface/add.png` | Acción principal de crear tarea |
| `interface/search.png` | Campo de búsqueda de tareas |
| `interface/settings.png` | Acceso a Ajustes |

## Sin uso por ahora

- `unused/projects.png`: no existe una sección de Proyectos en O-Isym 5. Se conserva en el repositorio, separada de los recursos activos, para no sugerir una función que la aplicación todavía no ofrece.

## Criterios de uso

- Los iconos se muestran con dimensiones CSS controladas y `object-fit: contain`; no se modifica el PNG original.
- Los iconos decorativos llevan texto accesible en el control contenedor y usan `alt=""` para no duplicar el anuncio del lector de pantalla.
- Si una imagen falla al cargar, se elimina el elemento visual y permanece el texto del control.
- No se usa un icono solo por llenar espacio: los recursos de recordatorio, repetición y proyectos esperan a que existan funciones reales.
- La clasificación actual se basa en los nombres de archivo y su relación con las vistas existentes. Queda pendiente una revisión visual individual de los PNG a resolución completa para ajustar recortes, transparencias o proporciones si hiciera falta.
