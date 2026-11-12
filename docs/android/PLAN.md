# Plan de adaptación a Android

Estado inicial: todos los bloques de implementación están pendientes. El orden evita dar por resuelto el segundo plano con un APK que solamente abre la interfaz.

## A0 — Base y entorno reproducible

- [ ] Inventariar dependencias y diferencias relevantes entre `development` y Windows.
- [ ] Revisar código y APK de prototipos Android anteriores, si se recuperan; registrar procedencia y qué se reutiliza.
- [ ] Seleccionar versiones estables compatibles de Capacitor y plugins oficiales; fijar versiones y archivo de bloqueo. No subir Electron de Catalina para satisfacer Android.
- [ ] Documentar versiones exactas de Node, Java, Gradle, Android SDK y Android Studio, con sus comprobaciones en Windows.
- [ ] Elegir minSdk y targetSdk según Capacitor y distribución; incluir Android 11 en la matriz de prueba si la versión elegida lo admite.
- [ ] Registrar identificador Android propuesto `com.oisym.app` y estrategia de versionName/versionCode.

Aceptación: otra instalación de Windows reproduce las dependencias y las pruebas existentes desde un checkout limpio. Existe matriz de herramientas comprobada, sin credenciales en Git.

## A1 — Capacitor y primer arranque

Depende de A0.

- [ ] Crear entrada web móvil y directorio generado exclusivo para los recursos web.
- [ ] Añadir configuración Capacitor, plataforma Android y recursos de aplicación.
- [ ] Preparar scripts de generar recursos, sincronizar, abrir Android Studio y compilar APK debug.
- [ ] Incluir Gradle Wrapper; ignorar SDK local, cachés, paquetes compilados y secretos.
- [ ] Empaquetar archivos permitidos: interfaz y assets utilizados. Excluir Electron, tests, documentos, copias de seguridad y node_modules.
- [ ] Revisar CSP y puentes de Capacitor sin desactivar globalmente las protecciones.
- [ ] Añadir pantalla de carga y error recuperable.

Aceptación: APK debug instalado y arrancando sin internet, con una sola actividad principal, sin errores por Electron o rutas ausentes. Las funciones no implementadas muestran un estado claro.

## A2 — Puente de plataforma y datos

Depende de A1.

- [ ] Definir contratos compartidos y adaptar Electron sin perder su comportamiento.
- [ ] Implementar guardado Android, validación de snapshot, migraciones y copias.
- [ ] Mantener lectura/guardado serializados y recuperación ante escritura interrumpida.
- [ ] Adaptar importar/exportar `.oisym` al selector y al compartir de Android.
- [ ] Coordinar cambio de perfil, guardado de borradores y eventos de ciclo de vida.

Aceptación: datos conservados al bloquear, cerrar normalmente, recrear actividad y actualizar APK con la misma firma. Una importación inválida no destruye datos; compartir funciona sin pedir acceso general al almacenamiento.

## A3 — Interfaz móvil completa

Depende de A1; se prueba con datos reales después de A2.

- [ ] Aplicar navegación, medidas e interacciones de MOBILE-UI.md.
- [ ] Adaptar cada sección y sus estados vacíos, formularios y diálogos.
- [ ] Conservar ajustes de colores, esquinas, iconos y márgenes.
- [ ] Implementar gestos en pizarrones y alternativa por botones a toda acción compleja.
- [ ] Probar teclado, Atrás, rotación, texto grande y tablet.

Aceptación: todas las secciones son utilizables a 360 px CSS de ancho, sin desbordamientos generales ni botones ocultos por teclado o barras del sistema.

## A4 — Focus y avisos nativos

Depende de A2; las pruebas de pantalla apagada son obligatorias antes de distribuir.

- [ ] Implementar estado Focus persistente, identificadores y revisión de sesión.
- [ ] Programar/cancelar avisos con Android, sin depender de ticks de JavaScript.
- [ ] Implementar audio en servicio nativo y controles en notificación/pantalla bloqueada.
- [ ] Implementar fin de Focus: detener música, alarma finita y acción de detener.
- [ ] Adaptar recordatorios de tareas, zonas horarias, cambios y cancelaciones.
- [ ] Tratar permisos concedidos, denegados y revocados; canales y audio focus.
- [ ] Resolver reanudación, proceso terminado, reinicio y eventos duplicados.
- [ ] Verificar que ninguna acción externa marque una tarea como completada sin la acción correspondiente del usuario.

Aceptación: matriz de FOCUS-AND-NOTIFICATIONS.md y VALIDATION.md ejecutada en dispositivos reales. Una sesión produce un único registro y un único aviso válido, incluso con carreras entre interfaz y receptor nativo.

## A5 — Calidad, consumo y accesibilidad

Depende de A2–A4.

- [ ] Ejecutar pruebas compartidas, del puente y de Focus con relojes controlables.
- [ ] Medir consumo con/sin música; no mantener la pantalla ni CPU despiertas innecesariamente.
- [ ] Validar TalkBack, tamaños de texto, contraste y objetivos táctiles.
- [ ] Probar Doze, ahorro de batería, memoria baja y tareas con avisos cercanos.
- [ ] Corregir rutas e iconos, nombres largos, reproducción fallida y falta de espacio.

Aceptación: sin fallos bloqueantes, con resultados, dispositivo, versión y limitaciones registrados.

## A6 — Distribución

Depende de A5.

- [ ] Preparar versión y versionCode incremental, APK de pruebas y APK/AAB release firmado.
- [ ] Mantener keystore fuera de Git y conservar la identidad de firma entre actualizaciones.
- [ ] Probar actualización sobre datos existentes y recuperación de sesiones.
- [ ] Preparar CI Android separado de los runners macOS/Windows y de la web.
- [ ] Adjuntar el APK verificado a una release y comprobar el botón Android en la web.
- [ ] Actualizar notas y compatibilidad con resultados reales; no publicar automáticamente un APK sin revisar.

Aceptación: instalación y actualización verificadas, datos intactos y enlace público válido. No se publica Android por el simple hecho de terminar la compilación.

## Registro por bloque

Al cerrar un bloque, añadir commit, pruebas ejecutadas, dispositivo/API, resultado y pendientes. Los bloques incompletos permanecen pendientes; no confundir documento, código, compilación y funcionamiento comprobado.
