# Auditoría técnica y registro de calidad — O-Isym 5

**Última revisión:** 2026-11-05  
**Rama auditada:** `oisym-5-development`  
**Commit de código revisado:** `b8c83170c8964a6daa26092a1031f0bcd32c2779`  
**Estado de referencia:** 62 pruebas aprobadas en GitHub Actions  
**Documento principal:** este archivo es el registro vigente de errores, riesgos, correcciones y prioridades.

> Esta auditoría distingue entre errores confirmados por inspección, correcciones implementadas, mejoras recomendadas y verificaciones que requieren ejecutar la aplicación en macOS. No se marca algo como probado solo porque el código compile.

## 1. Resumen ejecutivo

- No se encontró una vulnerabilidad crítica confirmada (P0) en los archivos activos durante esta revisión.
- Se corrigieron problemas de persistencia de Focus, cambio de perfil, validación interna de datos y manejo de fallos de notificación.
- Las acciones de tareas, actividades, objetivos, planificación e importación del prototipo ahora revierten el estado visible cuando falla el guardado.
- La interfaz activa no usa `innerHTML`, `outerHTML`, `eval` ni `new Function` en los archivos principales inspeccionados.
- El renderer mantiene `nodeIntegration: false`, `contextIsolation: true`, `sandbox: true` y un preload pequeño con funciones IPC explícitas.
- El mayor trabajo pendiente es ampliar las pruebas de integración, terminar de modularizar el renderer y pulir algunos flujos de accesibilidad y notificaciones.

### Estado por prioridad

| Prioridad | Estado | Interpretación |
|---|---|---|
| P0 — Crítica | Sin hallazgos confirmados | No se encontró un fallo que justifique detener el uso por sí mismo |
| P1 — Alta | Hallazgos principales corregidos | Persistencia y validación recibieron una segunda capa de protección |
| P2 — Media | Pendiente | Comportamientos mejorables, pruebas de integración y mantenimiento |
| P3 — Baja | Pendiente | Pulido, documentación adicional y mejoras no bloqueantes |

## 2. Alcance de la revisión

Se inspeccionaron el árbol completo de la rama y, con mayor profundidad, estos archivos:

- Aplicación y dominio: `src/app.js`, `src/domain.js`, `src/focus-audio.js`.
- Proceso principal y persistencia: `electron/main.js`, `electron/preload.js`, `electron/ipc-handlers.js`, `electron/storage.js`.
- Avisos: `electron/focus-notifications.js`, `electron/task-notifications.js`.
- Presentación y entrada: `src/styles/app.css`, `index.html`.
- Configuración y automatización: `package.json`, `.gitignore`, `.github/workflows/tests.yml`.
- Pruebas existentes: `tests/`.
- Documentación, prototipo y archivos históricos.

El análisis estático no sustituye una prueba manual de cada pantalla, ni una compilación y ejecución en el Mac real.

## 3. Correcciones realizadas en esta auditoría

### [P1] Validación profunda de perfiles antes de guardar — RESUELTO

**Problema:** el almacenamiento comprobaba la estructura general del snapshot y los identificadores de perfil, pero no validaba por sí mismo los registros internos de tareas, actividades, objetivos y sesiones Focus. Un JSON incompleto podía superar esa primera validación y llegar al renderer.

**Solución:** `electron/storage.js` ahora utiliza `validateImportedProfile` del dominio para revisar cada perfil antes de guardar. Los errores se identifican como `OISYM_PROFILE_INVALID` y no se escribe el snapshot inválido.

**Prueba:** se añadió una regresión que intenta guardar un perfil con una tarea incompleta y comprueba que se rechaza y que el archivo actual permanece intacto.

### [P1] Focus podía cambiar aunque fallara el guardado — RESUELTO

**Problema:** iniciar, comenzar un descanso, pausar, reanudar, terminar o reiniciar Focus podía modificar el estado en memoria aunque el proceso principal rechazara el guardado. Eso podía mostrar una sesión que no sobreviviría al reinicio.

**Solución:** se conserva una copia del perfil antes de la mutación. Si el guardado falla, se restaura el perfil anterior y se sincronizan de nuevo el temporizador, la música y la notificación.

### [P1] El selector de perfil no sincronizaba todos los recursos — RESUELTO

**Problema:** el selector de la barra lateral cambiaba de perfil por un camino más simple que la administración de perfiles. No detenía todos los recursos de Focus ni actualizaba el inicio automático de macOS, y no gestionaba correctamente el fallo de guardado.

**Solución:** ahora guarda el perfil actual antes del cambio, detiene el ticker y las alarmas, cambia al nuevo perfil y sincroniza inicio automático, notificaciones y música. Si falla el guardado, restaura el perfil anterior.

### [P1] Acciones de datos sin rollback uniforme — RESUELTO EN LOS FLUJOS REVISADOS

Se corrigieron los caminos de guardar de:

- Completar o reabrir una tarea.
- Bloquear, desbloquear, eliminar o posponer una tarea.
- Crear una tarea desde una actividad.
- Archivar actividades y objetivos.
- Aplicar recomendaciones y propuestas del planificador.
- Actualizar el progreso de objetivos.
- Importar registros del prototipo.
- Guardar preferencias de música, alarma y notificaciones de Focus.

Si el guardado falla, la interfaz recupera el estado anterior y no muestra el cambio como completado.

### [P2] Fallos de entrega de notificaciones — RESUELTO

**Problema:** si Electron notificaba que una notificación había fallado después de llamar a `show()`, el recordatorio podía permanecer marcado como enviado.

**Solución:** el evento `failed` elimina la marca persistida para que el siguiente ciclo de sincronización pueda reintentarlo.

### [P2] La notificación de prueba ignoraba el ajuste de sonido — RESUELTO

**Problema:** la notificación de prueba siempre se enviaba con sonido aunque el perfil tuviera desactivado el sonido de recordatorios.

**Solución:** ahora consulta la preferencia del perfil activo y la respeta.

## 4. Registro de correcciones anteriores ya incorporadas

Esta lista consolida el trabajo realizado antes de la auditoría actual. Se mantiene como historial de decisiones y no como lista de tareas pendientes.

### Seguridad y almacenamiento

- [x] Renderer aislado: Node Integration desactivado, context isolation y sandbox activados.
- [x] Preload expone operaciones limitadas, no el objeto IPC completo.
- [x] IPC comprueba que la solicitud procede del frame principal local esperado.
- [x] Snapshot con versión de esquema y límites de tamaño y cantidad de perfiles.
- [x] Escrituras atómicas y permisos restrictivos para el archivo temporal.
- [x] Cola de guardados para serializar escrituras y respaldos.
- [x] Copias rotativas y protección del archivo cuando está dañado.
- [x] Recuperación que conserva el archivo anterior antes de reemplazarlo.
- [x] Importación completa transaccional y validación de perfiles importados.
- [x] Evitar respaldos y reescrituras cuando solo cambian marcas de actualización.

### Interfaz y perfiles

- [x] Administración independiente de perfiles, edición de perfiles inactivos y protección del último perfil.
- [x] Duplicar, exportar e importar perfiles individuales.
- [x] Ajustes separados por categorías.
- [x] Formularios de tareas, actividades y objetivos en diálogos.
- [x] Protección básica del foco de teclado en diálogos de perfiles.
- [x] Estados accesibles para filtros, calendario y progreso.
- [x] Diseño adaptable y diálogos con altura máxima y desplazamiento.
- [x] Acciones principales conectadas a handlers; se conserva el texto de botones cuando mejora la claridad.

### Focus y sonido

- [x] Detener vista previa musical.
- [x] Detener música principal y alarma de forma explícita.
- [x] Una sola alarma configurable al finalizar Focus.
- [x] Repeticiones, intervalo, volumen y duración máxima.
- [x] Evitar que música, vista previa y alarma compitan entre sí.
- [x] Sincronizar el temporizador y el audio al cambiar de perfil o importar datos.

### Recordatorios de tareas y macOS

- [x] Horarios visibles y recordatorios individuales por tarea.
- [x] Scheduler en el proceso principal, no en la ventana renderer.
- [x] Manejo de suspensión y reanudación del sistema.
- [x] Evitar notificaciones duplicadas con un registro persistente.
- [x] Icono de aplicación en la barra de menús de macOS.
- [x] Cerrar la ventana oculta la app; salir completamente detiene los avisos.
- [x] Opción de inicio automático y apertura oculta al iniciar sesión.
- [x] Sonido de sistema Ping para los recordatorios con sonido activado.

## 5. Hallazgos pendientes y prioridades

### P2 — Prioridad media

#### A-01. El clic en una notificación no abre directamente la tarea

**Estado:** confirmado en código; pendiente.

El scheduler entrega el recordatorio al callback `onOpenTask`, pero el proceso principal lo conecta a `showMainWindow`, que solo muestra la ventana y no utiliza el identificador de tarea. El clic abre O-Isym, pero no lleva al usuario a la tarea concreta.

**Mejora recomendada:** enviar el identificador y la fecha a través del preload y abrir la tarea correspondiente o el día de su agenda. Añadir una prueba de integración del recorrido completo.

#### A-02. Falta una prueba de integración de Electron e IPC

**Estado:** pendiente.

La suite cubre dominio, almacenamiento, audio y schedulers, pero no levanta un proceso Electron real ni verifica conjuntamente preload, IPC, Tray, notificaciones y ciclo de vida de la ventana.

**Mejora recomendada:** crear pruebas aisladas de IPC con emisores simulados y una lista manual de aceptación en macOS para los flujos que requieren el sistema operativo.

#### A-03. Accesibilidad del diálogo de inicio automático

**Estado:** confirmado por inspección; pendiente.

El diálogo inicial de «Añadir O-Isym al Mac» tiene roles y etiquetas, pero no cuenta con el mismo tratamiento completo de teclado que los diálogos de perfiles (por ejemplo, cierre con Escape y confinamiento del foco).

**Mejora recomendada:** reutilizar el controlador de diálogos accesibles o extraer uno compartido.

#### A-04. Renderer demasiado concentrado en un solo archivo

**Estado:** confirmado; mejora de mantenimiento.

`src/app.js` tiene aproximadamente 2.400 líneas y concentra vistas, formularios, navegación, eventos, Focus, importación y perfiles.

**Riesgo:** los cambios pequeños pueden tener efectos laterales en zonas no relacionadas y las pruebas unitarias de interfaz son difíciles.

**Mejora recomendada:** separar gradualmente módulos de vistas, perfiles, tareas, Focus, importación y componentes compartidos. No hacer una reescritura completa de golpe.

#### A-05. Código histórico conservado junto al código activo

**Estado:** confirmado; no es un error de ejecución.

`src/scripts/` y `legacy/renderer.js` pertenecen al prototipo anterior y no están cargados por el `index.html` actual. Algunos scripts antiguos utilizan patrones inseguros como HTML interpolado. No se ejecutan en la aplicación actual.

**Mejora recomendada:** conservarlos por ahora como referencia, documentar su carácter histórico y, en una limpieza futura, moverlos a una carpeta de archivo claramente separada o eliminarlos solo después de verificar que no se necesita migrar ningún dato.

#### A-06. Instalaciones no completamente reproducibles

**Estado:** confirmado: no hay `package-lock.json` en la rama auditada.

Las versiones directas de Electron y electron-builder están fijadas, pero las dependencias transitivas pueden resolverse de forma diferente en instalaciones futuras.

**Mejora recomendada:** generar y versionar un lockfile con npm compatible con Node 18 y usar `npm ci` en CI. Hacerlo en una máquina con acceso a npm y comprobar la build en Catalina.

#### A-07. Verificación nativa de notificaciones y empaquetado

**Estado:** el usuario ha indicado que la función ya está funcionando; la revisión de código no vuelve a probar macOS.

La suite de CI no puede confirmar permisos reales de notificaciones, sonido Ping, elemento de inicio de sesión, comportamiento de Tray ni apertura oculta después de reiniciar el Mac.

**Mejora recomendada:** mantener una lista de regresión manual para cada nueva build macOS. No confundir CI verde con validación del sistema operativo.

### P3 — Mejora de calidad y pulido

- [ ] Revisar y unificar el estilo de los módulos Electron; `electron/focus-notifications.js` está comprimido y es más difícil de mantener que el resto.
- [ ] Ampliar pruebas de accesibilidad para navegación por teclado, foco visible, lectores de pantalla y ventanas estrechas.
- [ ] Probar conjuntos grandes de tareas y perfiles para observar tiempos de renderizado.
- [ ] Añadir pruebas de zona horaria, cambios de horario y reanudación prolongada para los recordatorios.
- [ ] Mejorar el registro y diagnóstico de errores de inicio y notificaciones sin registrar contenido privado de tareas.
- [ ] Evaluar una CSP más estricta cuando se hayan eliminado los estilos inline que la requieren actualmente.
- [ ] Añadir una licencia si se decide permitir reutilización o distribución del código.
- [ ] Revisar y mantener actualizados los documentos de instalación, recuperación y compilación.

## 6. Pruebas y evidencia

### GitHub Actions

- **Ejecución:** [42052395821](https://github.com/CueloRubik/O-Isym/actions/runs/42052395821)
- **Commit:** `b8c83170c8964a6daa26092a1031f0bcd32c2779`
- **Resultado:** 62 tests, 62 aprobados, 0 fallidos, 0 omitidos.
- **Sintaxis:** `node --check` pasó para los archivos activos de renderer, dominio, audio y proceso Electron.

### Límites de la evidencia

- CI se ejecuta en Linux con Node 18; no equivale a ejecutar O-Isym en macOS Catalina.
- No se generó un DMG durante esta auditoría.
- No se ejecutó una inspección visual automatizada de todas las pantallas.
- El usuario informó que la integración reciente de macOS ya funciona; se registra como validación del usuario, no como prueba independiente de esta revisión.

## 7. Prioridades recomendadas para el siguiente ciclo

1. **P2 — Abrir la tarea correcta desde una notificación.** Completar el recorrido que ahora solo abre la ventana.
2. **P2 — Pruebas de integración IPC/Electron.** Cubrir cambios de perfil, inicio automático, cierre de ventana y notificaciones.
3. **P2 — Accesibilidad del diálogo de inicio.** Unificar el manejo de foco y teclado.
4. **P2 — Lockfile reproducible.** Añadir `package-lock.json` y pasar CI a `npm ci`.
5. **P2 — Modularización progresiva de `src/app.js`.** Separar sin cambiar el comportamiento.
6. **P3 — Archivo histórico.** Aislar mejor los scripts del prototipo.
7. **P3 — Pulido y documentación.** Completar pruebas visuales y manuales en Catalina.

Los elementos de prioridad P2 son mejoras pendientes, no una afirmación de que la aplicación actual esté rota.

## 8. Ramas y publicación

- Rama de trabajo: `oisym-5-development`.
- `main` no se modificó.
- En la comparación consultada, desarrollo tenía 304 commits que no están en `main`, mientras que `main` tenía 2 commits no incorporados. Esos dos commits añadían iconos PNG antiguos en la raíz; no se integraron automáticamente porque la rama de desarrollo ya organiza esos recursos bajo `assets/icons/`.
- No fusionar ni reescribir ramas sin autorización explícita.

## 9. Registro de actualizaciones

| Fecha | Cambio | Estado |
|---|---|---|
| 2026-11-04 | Auditoría inicial y reconstrucción de la interfaz | Histórico |
| 2026-11-05 | Recordatorios de tareas, Tray, inicio automático e icono de aplicación | Implementado |
| 2026-11-05 | Validación profunda de perfiles, rollback de Focus y selector de perfil | Corregido |
| 2026-11-05 | Rollback de acciones de tareas, objetivos, planificación y preferencias | Corregido |
| 2026-11-05 | Reintento tras fallo de notificación y prueba de sonido respetuosa con preferencias | Corregido |
| 2026-11-05 | Suite completa | 62/62 aprobadas |

---

**Regla de mantenimiento:** cada error nuevo debe registrarse con identificador, prioridad, archivo afectado, estado, evidencia, solución y prueba de regresión. Cuando se corrija, no se borra del historial: se marca como resuelto y se anota el commit.
