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
