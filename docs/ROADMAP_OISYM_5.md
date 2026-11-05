# O-Isym 5 — Hoja de ruta y estado del proyecto

**Rama de desarrollo:** `oisym-5-development`  
**Documento de auditoría vigente:** [QUALITY_AUDIT_OISYM_5.md](QUALITY_AUDIT_OISYM_5.md)

> Este archivo organiza el trabajo de producto. Para el registro detallado de errores, riesgos, soluciones, pruebas y prioridades técnicas, la fuente principal es la auditoría técnica. Los estados antiguos de esta hoja de ruta se actualizaron para no presentar como pendientes funciones ya implementadas.

## 1. Estado general

| Área | Estado | Observaciones |
|---|---|---|
| Aplicación Electron para macOS Intel | Implementada | Electron 28.3.3, build x64 |
| Navegación y vistas principales | Implementadas | Hoy, Tareas, Actividades, Calendario, Planificador, Focus, Objetivos e Insights |
| Perfiles | Implementados | Crear, editar, duplicar, importar, exportar y eliminar con protección |
| Planificador | Implementado | Propuestas explicables; no aplica cambios sin aprobación |
| Focus y audio | Implementados | Música, vista previa, alarma, parada manual e historial |
| Persistencia y recuperación | Implementadas | Escritura atómica, cola de guardados y respaldos |
| Recordatorios de tareas | Implementados | Scheduler principal, preferencias y Tray en macOS |
| Iconografía | Integrada | Recursos organizados bajo `assets/icons/` |
| Pruebas automatizadas | Activas | 62 pruebas aprobadas en la última ejecución auditada |
| Pruebas de integración Electron | Pendientes | Añadir IPC, ciclo de vida y recorridos completos |
| Modularización del renderer | Pendiente | Separar gradualmente el archivo principal |
| Revisión visual de regresión | Continua | Confirmar cada build relevante en macOS Catalina |

## 2. Funciones terminadas que deben conservarse

### Aplicación y datos

- [x] Electron con Node Integration desactivado, context isolation y sandbox.
- [x] Preload de superficie reducida e IPC restringido.
- [x] Almacenamiento JSON versionado, escritura atómica y cola de guardados.
- [x] Respaldos rotativos, recuperación y protección de archivos dañados.
- [x] Validación de perfiles y colecciones internas al guardar e importar.

### Organización

- [x] Perfiles independientes y preferencias por perfil.
- [x] Actividades reutilizables y tareas concretas.
- [x] Tareas con prioridad, fechas, horarios, duración, notas, bloqueo y recordatorio.
- [x] Panel Hoy, calendario y agenda.
- [x] Planificador con propuestas que respetan compromisos bloqueados.
- [x] Objetivos e Insights.

### Focus

- [x] Temporizador con pausa, reanudación e historial.
- [x] Música en bucle y vista previa.
- [x] Detener música, vista previa y alarma.
- [x] Alarma al finalizar Focus, con tono, volumen, repeticiones e intervalo.
- [x] Notificación del sistema y recuperación al volver de suspensión.
- [x] Rollback cuando no se puede guardar un cambio de Focus.

### macOS

- [x] Recordatorios de tareas programados en el proceso principal.
- [x] Icono de O-Isym en la barra de menús.
- [x] Cerrar ventana oculta la app y mantiene el proceso activo.
- [x] Opción de iniciar sesión con apertura oculta.
- [x] Sonido Ping de sistema cuando el sonido está habilitado.

## 3. Próximas prioridades

### P2 — Comportamiento y pruebas

- [ ] Añadir pruebas de integración para preload, IPC, Tray y ciclo de vida de la ventana.
- [ ] Mejorar accesibilidad del diálogo inicial de inicio automático (Escape y confinamiento del foco).
- [ ] Crear una lista de regresión manual para cada nueva build de macOS.
- [ ] Generar y versionar `package-lock.json` con Node 18 y migrar CI a `npm ci`.

### P2 — Mantenimiento

- [ ] Modularizar `src/app.js` por áreas funcionales sin reescritura completa.
- [ ] Añadir pruebas de interfaz y recorridos completos entre perfiles, tareas, agenda y Focus.
- [ ] Separar claramente los archivos históricos del prototipo.
- [ ] Hacer más legible y uniforme el código de los módulos Electron.

### P3 — Pulido

- [ ] Revisar accesibilidad, navegación por teclado y lectores de pantalla en todas las vistas.
- [ ] Probar rendimiento con muchos perfiles y tareas.
- [ ] Ampliar pruebas de zonas horarias, suspensión prolongada y errores del sistema de notificaciones.
- [ ] Mantener al día instrucciones de instalación, compilación y recuperación.
- [ ] Decidir si el repositorio necesita una licencia pública.

## 4. Criterios para cerrar una tarea

Una tarea no se considera terminada solo porque compile.

- [ ] El comportamiento esperado está implementado.
- [ ] Las rutas de error y cancelación están cubiertas.
- [ ] Los cambios de datos se revierten si falla el almacenamiento.
- [ ] Hay una prueba de regresión cuando es viable.
- [ ] La suite completa pasa.
- [ ] La interfaz se revisó en los tamaños de ventana relevantes.
- [ ] La documentación refleja el comportamiento real.
- [ ] No se eliminó ninguna función no relacionada.

## 5. Arquitectura que se debe conservar

- `electron/`: proceso principal, preload, IPC, almacenamiento y schedulers.
- `src/domain.js`: modelos, normalización, validación y reglas de dominio.
- `src/app.js`: renderer y flujos de aplicación (pendiente de modularización gradual).
- `src/focus-audio.js`: controlador de reproducción de Focus.
- `src/styles/app.css`: sistema visual.
- `assets/avatars/`: avatares.
- `assets/icons/`: iconografía organizada por área.
- `assets/audio/`: música y alarmas.
- `tests/`: pruebas automatizadas.
- `legacy/` y `src/scripts/`: prototipo histórico; no cargar en la interfaz actual.

## 6. Decisiones de producto

- Interfaz clara, luminosa, moderna y adaptable.
- Personalización por perfil.
- Actividades como definiciones reutilizables; tareas como instancias.
- Calendario, tareas y planificador comparten los mismos datos.
- Los compromisos bloqueados no se reprograman automáticamente.
- Focus puede asociarse a una tarea o ser libre.
- Almacenamiento local y recuperación segura.
- Mantener Electron 28.3.3 y compatibilidad con el Mac Intel de desarrollo.
- Evitar dependencias innecesarias y cambios de versión sin comprobar compatibilidad.

## 7. Ramas y publicación

- Trabajar en `oisym-5-development`.
- Mantener `main` intacta y separada.
- No fusionar ni reescribir ramas sin autorización explícita.
- No publicar una nueva build hasta comprobarla en macOS.
- No iniciar una adaptación a otra plataforma antes de cerrar la versión Mac.
