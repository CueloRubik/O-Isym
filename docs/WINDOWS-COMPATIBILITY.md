# Revisión de compatibilidad con Windows

## Hallazgos y correcciones

1. **Confirmaciones síncronas y foco.** La interfaz invocaba `window.confirm` para descartar cambios, eliminar registros e importar datos. En Electron/Windows ese diálogo nativo es un posible desencadenante del bloqueo de escritura comunicado, aunque el fallo nativo no se ha reproducido en este entorno. Windows usa ahora confirmaciones asíncronas dentro del renderer: Cancelar/Escape conservan los cambios y restauran el foco, Aceptar ejecuta la operación y se elimina el diálogo. Las confirmaciones de macOS mantienen su implementación anterior.
2. **Segundo plano ausente en Windows.** La bandeja solo se creaba en macOS y Windows salía al cerrar la ventana. Se crea ahora una bandeja Windows con `app.ico`; el cierre espera el guardado y oculta la ventana, conservando los programadores. Abrir, doble clic y segunda instancia recuperan la misma ventana. Salir desde el menú termina la aplicación. Sin bandeja disponible, se conserva el cierre normal para evitar un proceso inaccesible.
3. **Identidad de notificaciones.** Faltaba `app.setAppUserModelId`. Windows usa ahora `com.oisym.app`, coincidente con el `appId` de empaquetado. La entrega final necesita el acceso directo del instalador y los permisos del sistema; `Notification.isSupported()` no garantiza entrega.
4. **Texto exclusivo de macOS.** La actividad se enviaba en `subtitle`, que Windows no muestra. En Windows forma parte del título; macOS conserva su subtítulo y sonido Ping.
5. **Vida de los objetos nativos.** Los avisos de tareas y Focus no conservaban referencias JavaScript hasta su cierre. Ahora se retienen hasta `close`/`failed`, y se cierran al terminar el servicio. Los errores de Focus dejan de ocultarse silenciosamente.
6. **Fallos sin reintento y carrera de entrega.** Un fallo de tarea solo podía reintentarse al editar datos o reanudar el equipo; un `failed` síncrono podía volver a marcarse como enviado. Se evita esa carrera y se permiten hasta tres reintentos separados por 30 segundos, respetando preferencias de avisos vencidos. Salir cancela los reintentos. No se puede detectar si Windows oculta un aviso sin emitir `failed`.
7. **Inicio oculto exclusivo de macOS.** `openAsHidden` no implementa el inicio oculto en Windows. Se usa ahora un argumento explícito `--oisym-hidden`, tanto al registrar como al consultar el inicio automático. Solo se oculta con preferencia activa y bandeja disponible. Un inicio manual sigue mostrando la ventana.
8. **Instrucciones y cobertura limitadas a Mac/Linux.** Los ajustes hablaban exclusivamente de permisos de macOS. Se usa información común de permisos y No molestar. CI añade Windows a la matriz de pruebas con Node 18 y usa Bash para conservar el fallo de cualquier comando de la suite.

## Adaptación del empaquetado de Windows

La revisión siguiente completa el manifiesto y el lockfile de `oisym-windows`: Electron 45.3.0, electron-builder 26.18.0 y jsdom como dependencia de pruebas reproducible. Node mínimo 22.12. Comandos `build:win`, `build:win:portable` y `build:win:dir`, siempre x64 y sin publicar automáticamente.

`app.ico` forma parte de app.asar y se usa en ventana, bandeja, ejecutable e instalador/desinstalador NSIS. El instalador en español crea el acceso directo con el mismo AppUserModelID del proceso y conserva los datos. `signExecutable: false` omite firma, manteniendo icono y metadatos con resedit; no se usa el arreglo que desactiva también la edición del ejecutable.

Los ajustes abren exclusivamente `ms-settings:notifications` mediante IPC validado. Se sustituyen los avisos erróneos de permisos de macOS. Desarrollo y portable no pueden registrar inicio automático; la versión instalada usa el argumento oculto existente. El clic en notificaciones de Focus abre la ventana. La aceleración por hardware solo se desactiva para el caso de Mac antiguo que motivó esa excepción.

CI comprueba Node 24/26 en Linux/Windows. El workflow Windows installer genera NSIS y portable, verifica el icono PE y recursos en app.asar, instala silenciosamente, valida el acceso directo y abre una ventana. No certifica entrega visual ni sonido de los avisos. No modifica las ramas macOS ni development.

## Evidencia y límites

La suite con Node 18 ejecutada en Linux incluye JSDOM para los diálogos y dobles del proceso principal de Electron para simular Windows, bandeja, identidad, guardado, reapertura e inicio oculto. También cubre avisos, errores síncronos/asíncronos y reintentos. Los resultados en CI Windows son independientes de esta validación local y no deben darse por aprobados antes de observarlos.

No se ha reproducido ni certificado la desaparición del bloqueo nativo de teclado en Windows. Tampoco se han ejecutado el instalador, winCodeSign, las notificaciones reales ni el registro de inicio automático en Windows desde este entorno Linux.

## Comprobación nativa pendiente

En un equipo Windows, instalar una compilación de esta rama sin borrar los datos existentes y comprobar:

- Abrir y cancelar repetidamente confirmaciones mediante botón y Escape; continuar escribiendo en tareas, perfiles y pizarrones, alternando entre aplicaciones.
- Probar aviso de tarea, aviso de Focus, sonido activado/desactivado, ventana minimizada/oculta y suspensión/reanudación. Revisar permisos de O-Isym y No molestar si el sistema oculta avisos.
- Cerrar la ventana y comprobar que siguen llegando recordatorios; abrir desde bandeja, clic en aviso de tarea y segunda instancia sin duplicar ventanas. Salir desde la bandeja debe detener el proceso.
- Activar/desactivar inicio automático, iniciar una sesión Windows y comprobar que solo se oculta el inicio automático con bandeja accesible.
- Comprobar empaquetado y persistencia con copias de seguridad. No publicar una Release hasta completar las comprobaciones del instalador y de funcionamiento nativo.
