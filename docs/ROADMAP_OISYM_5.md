# O-Isym 5 — Planificación general y estado del proyecto

Rama de trabajo: `oisym-5-development`. La rama `main` permanece separada y no debe modificarse ni fusionarse sin autorización expresa.

## Cómo leer esta planificación

- **Terminado**: función implementada y registrada como comprobada en el proyecto o validada manualmente por el usuario.
- **Pendiente**: trabajo de producto que todavía falta implementar.
- **Por revisar**: punto detectado durante la auditoría del código que necesita confirmación antes de tratarlo como error.
- **Decisión pendiente**: requiere elegir un comportamiento o criterio antes de implementarlo.

La planificación distingue entre funciones ya construidas, mejoras nuevas y revisiones técnicas. No se debe volver a marcar como pendiente una función terminada sin una regresión o un motivo concreto.

---

## 1. Estado general

La versión Mac de O-Isym 5 ya tiene una base funcional. Según el historial de trabajo del proyecto, el usuario ya comprobó manualmente los flujos principales, la persistencia al cerrar y volver a abrir, Focus, la revisión visual y la compilación real para macOS.

**Estado actual:** base principal construida; el trabajo restante es reorganización de Ajustes, administración de perfiles, iconografía, pulido y una revisión técnica adicional.

| Área | Estado | Nota |
|---|---|---|
| Aplicación Electron para macOS Intel | **Terminado** | Configuración de compilación x64 existente |
| Navegación y vistas principales | **Terminado** | Base funcional ya construida |
| Tareas, actividades y calendario | **Terminado** | Flujos principales existentes |
| Planificador 2.0 | **Terminado** | Genera propuestas sin mover compromisos bloqueados |
| Focus y recuperación | **Terminado** | Temporizador, historial y recuperación existentes |
| Música y alarma de Focus | **Terminado** | P1 de audio marcada como completada |
| Objetivos e Insights | **Terminado** | Funciones existentes |
| Perfiles y personalización básica | **Terminado** | Administración avanzada sigue pendiente |
| Importación y exportación JSON | **Terminado** | La robustez de validación se revisará por separado |
| Seguridad, IPC y almacenamiento local | **Terminado como base** | Mejoras técnicas de robustez pendientes de revisión |
| Reorganización de Ajustes | **Pendiente** | P2 |
| Administración avanzada de perfiles | **Pendiente** | P3 |
| Sistema de iconografía | **Pendiente** | P4 |
| Pulido general | **Pendiente** | P5 |
| Revisión técnica de almacenamiento y datos | **Por revisar** | Nueva lista de auditoría |
| Pruebas de integración automatizadas | **Pendiente** | Mejora de calidad, no bloqueo para usar la versión actual |

---

## 2. Inventario de funciones ya construidas

Esta sección sirve como registro de lo que O-Isym ya tiene. No son tareas para volver a hacer desde cero.

### Aplicación y estructura
- [x] Aplicación de escritorio basada en Electron.
- [x] Proceso principal, preload y comunicación IPC.
- [x] Aislamiento del renderer y acceso limitado a funciones del proceso principal.
- [x] Almacenamiento local JSON versionado.
- [x] Respaldos rotativos y mecanismos de recuperación.
- [x] Configuración de compilación para macOS Intel (x64).
- [x] Icono de aplicación mediante `app.icns` en la raíz local del proyecto.
- [x] Compatibilidad de desarrollo basada en Electron 28.3.3 y Node.js 18.x.

### Organización y planificación
- [x] Perfiles independientes.
- [x] Catálogo de actividades reutilizables.
- [x] Creación y edición de tareas.
- [x] Prioridades, fechas, duración, notas, estado y bloqueo de tareas.
- [x] Panel Hoy.
- [x] Calendario mensual.
- [x] Agenda diaria/semanal.
- [x] Búsqueda, filtros y validaciones de tareas.
- [x] Planificador 2.0 con propuestas de horarios.
- [x] Protección de compromisos bloqueados frente a la reprogramación.

### Focus y sonido
- [x] Temporizador Focus con pausa y reanudación.
- [x] Sesiones Focus asociadas a tareas o sesiones libres.
- [x] Historial persistente y recuperación de sesiones.
- [x] Selección de catorce pistas MP3.
- [x] Música en bucle durante Focus y descansos.
- [x] Detener música al pausar, reiniciar o terminar.
- [x] Botón para detener la vista previa musical.
- [x] Una sola alarma personalizada al completar Focus.
- [x] Selección y activación/desactivación de la alarma.
- [x] Botón para detener la alarma, incluso al navegar fuera de Focus.
- [x] Repeticiones, intervalo, duración máxima y volumen configurables.
- [x] Detener la música antes de reproducir la alarma.
- [x] Notificaciones del sistema silenciosas para evitar sonidos duplicados.
- [x] Limpieza de reproducción y temporizadores al cambiar de perfil o importar datos.
- [x] Pruebas automatizadas de vista previa, bucle musical, repeticiones, intervalos y parada manual.

**Límite conocido del audio:** el MP3 requiere que la ventana permanezca abierta o minimizada. Al cerrar la ventana puede quedar una notificación silenciosa; al salir con Cmd + Q los temporizadores se detienen. Durante la suspensión, la notificación se revisa al reanudarse.

### Otras funciones
- [x] Objetivos con progreso.
- [x] Insights semanales.
- [x] Recomendaciones locales explicables, configurables y descartables.
- [x] Avatares, colores y temas claros por perfil.
- [x] Preferencias de movimiento.
- [x] Atajos de teclado y adaptación a ventanas estrechas.
- [x] Exportación e importación de copias JSON.
- [x] Importación opcional de registros del prototipo sin borrar su almacenamiento original.

---

## 3. Plan de producto pendiente

### P2 — Reorganización de Ajustes
**Estado: pendiente.**

Objetivo: que cada configuración esté en su lugar y sea fácil de encontrar.

- [ ] Auditar todas las opciones actuales y hacer un inventario antes de moverlas.
- [ ] Agrupar las opciones por tema.
- [ ] Crear secciones de Ajustes con navegación clara y títulos descriptivos.
- [ ] Separar, según el inventario real, preferencias generales, apariencia, perfiles, Focus/notificaciones y datos/respaldos.
- [ ] Mantener visibles los ajustes importantes sin saturar una sola pantalla.
- [ ] Añadir descripciones breves y controles coherentes.
- [ ] Revisar el diseño en ventanas estrechas y la navegación por teclado.
- [ ] Comprobar que cada ajuste conserva exactamente su comportamiento.

Criterio de aceptación: cada opción tiene una ubicación lógica, se encuentra sin recorrer una pantalla interminable y conserva su comportamiento actual.

### P3 — Administración avanzada de perfiles
**Estado: pendiente.**

Objetivo: dar al usuario control completo sobre sus perfiles y su presentación.

- [ ] Diseñar una pantalla o panel de administración de perfiles.
- [ ] Permitir crear, editar y cambiar entre perfiles desde un flujo consistente.
- [ ] Implementar eliminación de perfiles con confirmación explícita.
- [ ] Explicar qué datos se eliminarán.
- [ ] Proteger el perfil activo y el perfil principal frente a eliminaciones accidentales.
- [ ] Definir qué ocurre al intentar borrar el último perfil o el perfil principal.
- [ ] Mejorar la edición visual: avatar con vista previa, nombre, edad, tema, color y preferencias disponibles.
- [ ] Asegurar que los datos de cada perfil permanezcan aislados.
- [ ] Probar migración y compatibilidad con perfiles antiguos.

Criterio de aceptación: crear, editar, cambiar y eliminar perfiles funciona sin pérdida accidental de datos de otros perfiles y con confirmaciones comprensibles.

### P4 — Sistema de iconografía
**Estado: pendiente.**

Objetivo: dar a O-Isym un lenguaje visual consistente.

- [ ] Inventariar botones, secciones, categorías, acciones y estados que necesitan iconos.
- [ ] Elegir una sola familia o estilo visual coherente.
- [ ] Diseñar o seleccionar iconos para navegación, tareas, actividades, calendario, Focus, objetivos, Insights, perfiles y Ajustes.
- [ ] Añadir iconos a acciones frecuentes cuando ayuden a reconocerlas, sin llenar la interfaz de adornos.
- [ ] Definir tamaños, alineación, grosor y estados (normal, seleccionado, deshabilitado).
- [ ] Mantener etiquetas de texto o nombres accesibles; no depender únicamente del icono.
- [ ] Verificar contraste y legibilidad en los temas disponibles.

Criterio de aceptación: los iconos se sienten parte del mismo producto, son reconocibles y mejoran la orientación sin añadir ruido visual.

### P5 — Pulido general
**Estado: pendiente.**

- [ ] Revisar consistencia de márgenes, tamaños, tipografía, botones, formularios y diálogos.
- [ ] Unificar mensajes de confirmación, errores, estados vacíos y avisos.
- [ ] Revisar textos, nombres de opciones y explicaciones para que sean claros.
- [ ] Corregir detalles visuales o interacciones incómodas encontrados durante el uso diario.
- [ ] Comprobar navegación por teclado, foco visible y etiquetas accesibles después de cada cambio.
- [ ] Evitar animaciones innecesarias y respetar movimiento reducido.
- [ ] Revisar rendimiento y comportamiento con varios perfiles y conjuntos grandes de tareas.

Criterio de aceptación: la aplicación se siente coherente, predecible y cuidada en todas sus secciones.

---

## 4. Auditoría técnica pendiente

Estos puntos proceden de la revisión del código. **No todos están confirmados como errores**: los marcados «por verificar» deben reproducirse o comprobarse con pruebas antes de cambiar el comportamiento.

### P6 — Robustez del almacenamiento y los datos

- [ ] **Por verificar:** serializar los guardados mediante una cola o mecanismo equivalente para evitar que operaciones simultáneas compitan entre sí.
- [ ] **Por verificar:** evitar crear respaldos cuando el contenido no cambió.
- [ ] **Por verificar:** comprobar que el guardado terminó correctamente antes de iniciar una sesión Focus o mostrarla como iniciada.
- [ ] Revisar que la rotación de cinco respaldos no elimine respaldos de recuperación ni archivos ajenos.
- [ ] **Por verificar:** validar individualmente la estructura de tareas, actividades, objetivos y sesiones al leer o importar datos.
- [ ] **Por verificar:** hacer que la importación valide el snapshot completo antes de sustituir el estado actual.
- [ ] **Por verificar:** definir y probar el comportamiento al importar un snapshot vacío o sin un perfil activo.
- [ ] Añadir pruebas para JSON malformado, versiones incompatibles, registros incompletos y datos fuera de rango.
- [ ] Confirmar que una importación fallida nunca deja el perfil o el estado actual a medias.

### P7 — Revisión de lógica de producto

- [ ] **Por verificar:** comprobar si los modos Manual, Sugerido, Híbrido y Automático producen comportamientos realmente distintos.
- [ ] Definir claramente qué puede hacer cada modo antes de modificar la lógica.
- [ ] **Por verificar:** revisar los estados de Focus cuando falla el almacenamiento, se cambia de perfil o se importa una copia.
- [ ] Comprobar la coordinación entre música, vista previa y alarma en todos los caminos: iniciar, pausar, reanudar, terminar, reiniciar, cambiar de perfil y cerrar.
- [ ] Documentar el límite de reproducción de alarma al cerrar la ventana y decidir si el comportamiento actual es suficiente.

### P8 — Mantenimiento del código y herramientas

- [ ] **Confirmado en la inspección:** revisar las dos referencias CSS a `--border`; la hoja define `--line`, no una variable `--border`.
- [ ] **No encontrado en la rama inspeccionada:** decidir si se debe incorporar `package-lock.json` para fijar las versiones resueltas y hacer instalaciones reproducibles.
- [ ] Dividir progresivamente `src/app.js` en módulos de vistas, componentes y flujos, sin reescribirlo todo de una vez.
- [ ] Ampliar las pruebas de integración para cubrir recorridos completos entre perfiles, tareas, calendario, Focus y persistencia.
- [ ] **Decisión pendiente:** elegir y documentar una licencia para el repositorio, si se desea permitir reutilización o distribución por terceros.
- [ ] Revisar documentación de instalación, desarrollo, compilación y recuperación para mantenerla alineada con el comportamiento real.

---

## 5. Pruebas y criterios de finalización

Las pruebas manuales de flujos completos, persistencia, Focus, revisión visual y compilación macOS ya fueron realizadas y confirmadas por el usuario. No deben volver a marcarse como pendientes sin un motivo concreto.

Las pruebas de integración automatizadas son una mejora de calidad: pueden cubrir recorridos como crear perfil → crear tarea → programarla → completar Focus → reiniciar y verificar datos. No invalidan las pruebas manuales ya realizadas ni son un bloqueo artificial para continuar desarrollando.

Después de cada cambio:
- [ ] Ejecutar la suite automatizada existente.
- [ ] Comprobar manualmente la función modificada.
- [ ] Comprobar controles relacionados para detectar regresiones.
- [ ] Revisar que no se haya eliminado ni cambiado otra función sin autorización.
- [ ] Revisar la interfaz en los tamaños de ventana relevantes.

No considerar terminado un cambio solo porque compile: también deben funcionar sus botones, estados, guardado y rutas de cancelación.

---

## 6. Orden de trabajo recomendado

Este orden es una propuesta, no una prioridad impuesta. El usuario puede cambiarlo en cualquier momento.

1. **P2 — Ajustes:** reorganizar las opciones sin cambiar su comportamiento.
2. **P3 — Perfiles:** completar la administración avanzada.
3. **P6 — Almacenamiento y datos:** verificar primero los riesgos y corregir los confirmados.
4. **P7 — Lógica de producto:** definir y comprobar modos de autonomía y estados de Focus.
5. **P4 — Iconografía:** unificar el lenguaje visual.
6. **P5 — Pulido general:** corregir detalles de experiencia.
7. **P8 — Mantenimiento:** modularización, dependencias, licencia y documentación.
8. **Pruebas de integración:** ampliar gradualmente la cobertura.

El orden definitivo se decide con el usuario antes de comenzar cada bloque. No iniciar la adaptación Android hasta que el usuario considere cerrada la versión Mac.

---

## 7. Arquitectura y decisiones que se deben conservar

- `electron/`: proceso principal, preload, IPC y almacenamiento.
- `src/domain.js`: creación, normalización, validación y reglas del dominio.
- `src/app.js`: navegación, vistas y acciones.
- `src/styles/app.css`: sistema visual.
- `tests/`: pruebas automatizadas.
- `assets/avatars/`: avatares de perfiles.
- `assets/audio/music/`: catorce pistas de Focus.
- `assets/audio/alarms/`: sonidos de alarma.
- `legacy/` y `src/scripts/`: referencia del prototipo; no cargar en la interfaz nueva.

Decisiones de producto:
- Interfaz luminosa, moderna y clara, con color intencional y sin gradientes decorativos.
- Personalización por perfil sin bloquear funciones.
- Actividades como definiciones reutilizables; tareas como instancias concretas.
- Calendario y planificador conectados a las mismas tareas.
- Los compromisos bloqueados nunca se reprograman automáticamente.
- Focus puede asociarse a una tarea o ser libre.
- Almacenamiento local, migración segura y respaldos.
- Mantener Electron 28.3.3 y compatibilidad con el Mac Intel de desarrollo.
- No añadir dependencias innecesarias ni elevar versiones sin comprobar compatibilidad.
- No eliminar funcionalidades existentes ni cambiar el diseño por iniciativa propia.

---

## 8. Ramas y publicación

- La rama de desarrollo sigue siendo `oisym-5-development`.
- `main` permanece intacta y separada.
- No modificar ni fusionar a `main` sin autorización explícita del usuario.
- La versión actual ya cuenta con compilación macOS probada por el usuario.
- La decisión de cerrar la versión Mac y preparar una publicación final se tomará después de completar las mejoras que el usuario considere necesarias.
