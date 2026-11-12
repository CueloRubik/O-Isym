# Primera adaptación Android

Estado: APK debug 1.1.0 / versionCode 11004 compilado. El usuario confirmó que la primera APK abre en su dispositivo; esta revisión de interfaz aún debe probarse físicamente.

## Implementado en oisym-android

- Scripts de preparación web, generación Capacitor, sincronización, doctor, APK debug e instalación USB.
- Dependencias Android separadas en mobile para no cambiar Electron 28 ni el lockfile de escritorio.
- Plugin nativo propio: almacenamiento AtomicFile con respaldos y recuperación; selector de exportación; estado de permisos; programación de avisos y audio.
- Receiver de fin de Focus y servicio de música/alarma con finalización identificada por sesión y fecha límite.
- Navegación móvil con menú vertical desplazable, bloqueo y restauración del scroll de fondo, Atrás con confirmación de cambios y avisos de errores visibles.
- Orientación portrait en el manifiesto, incluida compatibilidad de restricciones en Android 16; sin rotación automática en teléfonos.
- Una columna y controles táctiles de al menos 44 px para acciones principales. Títulos de tareas con ancho legible y formularios con scroll propio y ajuste al espacio del teclado.
- Focus muestra el botón de inicio en una pantalla de 640 px de alto; tarea/actividad, música y alarma quedan en paneles plegables. Categorías de ajustes plegables.
- Pizarrones: Desplazar página permite scroll vertical; Mover pizarrón permite arrastrar el fondo y las cabeceras. Zoom con botones, filtros y conexiones plegables.
- Los contenedores Android conservan la clase base card y los ajustes de tema; se corrigió el selector múltiple del interruptor de alarma.
- Pruebas de contratos del puente, captura de snapshots y recordatorios.
- Ícono de aplicación con una sola fuente: assets/icons/app.png. Nombres Android propios para evitar el robot de plantilla drawable-v24. [Causa y verificación del ícono](ICON.md).

## Antes de considerar Android estable

La matriz de VALIDATION.md sigue pendiente en dispositivos reales: suspensión/Doze, permisos revocados, reinstalación y actualización, llamadas y auriculares, ahorro de batería, teclado, rotación, TalkBack y pizarrones.

La duración de Focus usa el modelo existente de fechas; el vencimiento nativo del mismo arranque usa elapsedRealtime. El cambio manual de hora, reinicio y reprogramación deben validarse antes de declarar soporte completo. No mantener una sesión silenciosa con un servicio multimedia vacío.

Los recordatorios móviles iniciales usan las tareas del perfil activo y un máximo de 250 avisos futuros. No se solicitan permisos de superposición, micrófono o acceso general a archivos.

## Evidencia

- Pruebas locales: 68 pruebas de puente Android, dominio, planificación y audio aprobadas con Node 26; revisión de sintaxis de los scripts.
- [Compilación CI y APK de esta revisión](https://github.com/CueloRubik/O-Isym/actions/runs/43244291310), código 7521ed1be73734bece864133e16cd08747f0092a: 199 pruebas aprobadas, compilación limpia e incremental correctas, versionName 1.1.0, versionCode 11004, minSdk 26 y targetSdk 36. La inspección del APK verifica que el ícono seleccionado termina en el PNG original. Artefactos: O-Isym-Android-debug y mobile-ui-screenshots.
- Dependencias exactas y lockfile mobile/package-lock.json guardados después de la compilación.
- El ejecutable JBR de Android Studio instalado en la Lenovo es Java 25; el comando de compilación detecta y solicita JDK 21 para evitar un error de Gradle.
- Chromium en CI: anchos 320, 360, 412 y 768 px; límites de controles, títulos de tareas, objetivos táctiles, scroll por gestos de página/editor/pizarrón, menú visible, pantalla de Focus de 640 px de alto y cambio de viewport al enfocar un campo (simulación del espacio del teclado). Las capturas se revisaron visualmente.
- JSDOM: navegación, retorno de foco, formulario sucio y confirmación de Atrás, gesto de cámara, interruptor de alarma y error visible.
- Prueba física de esta revisión: pendiente del usuario en su Android. Los gestos Chromium no certifican el teclado/IME real, la rotación del sistema, Doze, audio ni la entrega nativa de alarmas.
