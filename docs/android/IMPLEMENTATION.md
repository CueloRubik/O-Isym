# Primera adaptación Android

Estado: código implementado y APK debug compilado. Validación física pendiente.

## Implementado en oisym-android

- Scripts de preparación web, generación Capacitor, sincronización, doctor, APK debug e instalación USB.
- Dependencias Android separadas en mobile para no cambiar Electron 28 ni el lockfile de escritorio.
- Plugin nativo propio: almacenamiento AtomicFile con respaldos y recuperación; selector de exportación; estado de permisos; programación de avisos y audio.
- Receiver de fin de Focus y servicio de música/alarma con finalización identificada por sesión y fecha límite.
- Navegación para móvil y estilos independientes de escritorio.
- Pruebas de contratos del puente, captura de snapshots y recordatorios.

## Antes de considerar Android estable

La matriz de VALIDATION.md sigue pendiente en dispositivos reales: suspensión/Doze, permisos revocados, reinstalación y actualización, llamadas y auriculares, ahorro de batería, teclado, rotación, TalkBack y pizarrones.

La duración de Focus usa el modelo existente de fechas; el vencimiento nativo del mismo arranque usa elapsedRealtime. El cambio manual de hora, reinicio y reprogramación deben validarse antes de declarar soporte completo. No mantener una sesión silenciosa con un servicio multimedia vacío.

Los recordatorios móviles iniciales usan las tareas del perfil activo y un máximo de 250 avisos futuros. No se solicitan permisos de superposición, micrófono o acceso general a archivos.

## Evidencia

- Pruebas locales: 68 pruebas de puente Android, dominio, planificación y audio aprobadas con Node 26; revisión de sintaxis de los scripts.
- [Compilación CI y APK](https://github.com/CueloRubik/O-Isym/actions/runs/43162441874): 192 pruebas aprobadas, assembleDebug correcto, versionName 1.1.0, versionCode 11001, minSdk 26 y targetSdk 36. El archivo generado está disponible como artefacto O-Isym-Android-debug.
- Dependencias exactas y lockfile mobile/package-lock.json guardados después de la compilación.
- El ejecutable JBR de Android Studio instalado en la Lenovo es Java 25; el comando de compilación detecta y solicita JDK 21 para evitar un error de Gradle.
- Prueba física: pendiente del usuario en su Android.
