# Arquitectura propuesta para Android

Estado: diseño por implementar.

## Base observada

- `src/domain.js` y `src/planning.js`: reglas compartidas.
- `src/app.js`: interfaz principal extensa; extraer las dependencias de plataforma gradualmente.
- `src/focus-audio.js`: reproducción web; necesita implementación nativa para Android en segundo plano.
- `electron/preload.js`: expone `window.oisym.storage`, `notifications`, `focusAlarms` y guardado antes de cerrar.
- `electron/storage.js`: persistencia de escritorio, no reutilizable como acceso directo a archivos en Android.
- `electron/focus-notifications.js`: planificador ligado al proceso Electron, no planificador Android.

## Separación

| Capa | Responsabilidad |
| --- | --- |
| Dominio compartido | Perfiles, tareas, metas, pizarrones, normalización y semántica de Focus |
| Interfaz compartida | Secciones y componentes que responden a capacidades y tamaño |
| Puente de plataforma | Contratos estables de datos, archivos, audio, avisos y ciclo de vida |
| Adaptador Electron | Conserva IPC, almacenamiento y comportamiento de escritorio |
| Adaptador Android | Invoca Capacitor y componentes nativos con permisos y errores explícitos |

La interfaz no decide qué sistema operativo está usando en cada botón. Consume un puente seleccionado durante el arranque y consulta capacidades. Cada operación asíncrona devuelve un resultado o un error tratable. Un método no disponible nunca simula éxito.

## Ubicaciones previstas

Estas rutas son una propuesta, no archivos ya implementados.

| Ruta | Trabajo previsto |
| --- | --- |
| `src/platform/contracts.js` | Operaciones y errores compartidos |
| `src/platform/electron.js` | Adaptador sobre el preload existente |
| `src/platform/android.js` | Implementación Capacitor |
| `src/platform/index.js` | Selección de plataforma y capacidades |
| `src/styles/mobile.css` | Presentación móvil compatible con temas |
| `scripts/build-android-web.cjs` | Copia permitida de recursos web |
| `capacitor.config.*` | Identidad y webDir generado |
| `android/` | Proyecto Gradle, actividad y componentes nativos |
| `tests/platform/` | Contratos, errores y regresiones de escritorio |
| `tests/android/` | Sesiones, avisos, recuperación y pruebas nativas |

Preferir plugins oficiales cuando resuelvan el contrato. Para audio/Focus, evaluar un plugin mantenido o un plugin local pequeño; documentar elección, licencia, compatibilidad y pruebas. La existencia de un plugin no certifica el funcionamiento con la pantalla apagada.

## Contratos mínimos

| Área | Operaciones y garantías |
| --- | --- |
| Datos | read, save, listBackups, restore; snapshot validado y errores diferenciados |
| Archivos | elegir importación, leer URI, exportar/compartir; tratar cancelación y permisos de URI |
| Avisos | estado de permisos, solicitar, programar, cancelar, reconciliar y abrir tarea |
| Focus | crear, pausar, reanudar, cancelar, consultar y reconciliar sesión persistida |
| Audio | reproducir/pausar música, vista previa, alarma, detener; una autoridad nativa en Android |
| Ciclo de vida | aplicación activa/inactiva, recreación, navegación Atrás y guardado |
| Capacidades | alarmas exactas, notificaciones, reproducción nativa, selector y ajustes |

Mantener compatibilidad inicial con `window.oisym` para evitar reemplazar simultáneamente toda la interfaz. Añadir contratos antes de migrar sus llamadas una a una.

## Datos

Conservar esquema y normalizadores actuales. Guardar snapshots completos en almacenamiento privado apropiado; usar preferencias pequeñas para indicadores y configuración, no como sustituto sin evaluar de toda la base.

- Serializar escrituras y usar archivo temporal/recuperación segura según las garantías del almacenamiento elegido.
- Conservar última copia válida y respaldos con retención documentada.
- Guardar cada cambio importante y borradores; no esperar exclusivamente al evento de cierre.
- No sobrescribir un fallo de lectura con una colección vacía.
- Restaurar o importar no incorpora silenciosamente avisos ni sesiones antiguas al planificador.
- Intercambio mediante selector del sistema y URI; no asumir rutas de escritorio.
- Un cambio de perfil no cambia la identidad de una sesión ya iniciada sin detenerla o resolverla expresamente.
- Mantener la información necesaria de sesiones nativas y snapshots sincronizada mediante revisiones, no dos escrituras competidoras del mismo archivo.

## Construcción y seguridad

Mantener `android/` y su wrapper versionados; recursos web y APK son resultados reproducibles. Excluir claves, SDK local, cachés y datos personales. No incluir puentes de escritorio ni abrir contenido externo arbitrario dentro de la WebView con acceso nativo. Probar CSP, navegación externa y validación de argumentos del plugin.

La nueva rama conserva el código base. No crea una segunda fuente de verdad ni elimina las implementaciones de escritorio.
