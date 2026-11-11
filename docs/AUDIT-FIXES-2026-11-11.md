# Correcciones de la revisión de development

Se corrigen los siete errores de la revisión del 11 de noviembre de 2026, realizada sobre `bb999e5`.

## Recuperación de datos

El proceso principal abre la ventana de recuperación si el archivo está dañado o su formato es inválido. No sustituye el archivo, no programa recordatorios con datos ilegibles y no modifica la preferencia de inicio de sesión hasta disponer de datos válidos. La recuperación se muestra aunque la aplicación se haya abierto automáticamente en segundo plano.

Las operaciones de almacenamiento transportan sus resultados y códigos de error explícitamente entre el proceso principal y preload. Esto permite que la interfaz reconozca los errores recuperables, incluso cuando Electron no conserva las propiedades personalizadas de los errores rechazados por IPC. Las comprobaciones de origen y ventana principal siguen ejecutándose antes de acceder al almacenamiento.

La restauración conserva el archivo dañado en una copia de emergencia. La creación de datos nuevos sigue requiriendo la acción y confirmación existentes en la pantalla de recuperación.

Pruebas: `tests/main-lifecycle.test.js` y `tests/recovery-ui.test.js`, incluyendo almacenamiento real en carpetas temporales y el recorrido por los manejadores IPC y preload.

## Una instancia por carpeta de datos

El proceso adquiere el bloqueo de instancia única antes de inicializar el almacenamiento, las ventanas y los recordatorios. Una segunda apertura sale y lleva al frente la ventana de la instancia existente. Si la apertura ocurre durante el arranque, se recuerda la solicitud y se muestra la ventana cuando termina la inicialización.

Esto evita que dos procesos de O-Isym escriban instantáneas diferentes sobre el mismo archivo. No se añade una fusión automática de datos ni se modifica su formato.

Pruebas: `tests/main-lifecycle.test.js`, con la segunda instancia rechazada antes de abrir el almacenamiento y la reapertura anterior a la disponibilidad de Electron.

## Focus cuando falla el guardado

Si termina una sesión o descanso y falla el guardado, se conserva la sesión y se detienen los reintentos automáticos de finalización. Focus muestra «Reintentar guardar sesión». Un intento que vuelve a fallar mantiene esa opción disponible; uno correcto termina la sesión y registra una sola entrada de historial. Los descansos siguen sin generar entradas de concentración.

La recuperación de un guardado fallido restaura únicamente los campos de esa sesión. Conserva tareas editadas mientras se esperaba la escritura y no cambia de vuelta el perfil activo si el usuario ya salió de él. Los clics repetidos no inician dos finalizaciones simultáneas. Si falla una parada manual antes de agotar el tiempo, la sesión sigue funcionando.

Pruebas: `tests/focus-save.test.js`.

## Recordatorios puntuales y avisos vencidos

«Omitir avisos vencidos» permite los avisos que llegan a su hora. Se admite hasta un minuto de retraso para absorber demoras normales del temporizador. Los avisos más antiguos se omiten con esa preferencia. La opción de notificar vencidos conserva su ventana de doce horas y el historial evita envíos duplicados.

Pruebas: `tests/task-notifications.test.js`, con entrega exacta, demoras de 250 ms y 30 segundos, y un aviso perdido seguido de otro puntual.

## Límites y duraciones del planificador

Todos los huecos se comprueban contra el final del horario habitual, aunque haya compromisos fuera de ese horario. Una tarea que no cabe aparece en los resultados omitidos.

Las propuestas y la ordenación respetan el mismo límite de 1.440 minutos permitido por las tareas. Una estimación de 720 minutos recibe 720 minutos si cabe; no se recorta a 600 ni se divide sin avisar.

Pruebas: `tests/planner-boundaries.test.js`, incluyendo citas anteriores y posteriores a la jornada, conflictos, duraciones de 30 a 1.440 minutos y varias propuestas consecutivas.

## Apertura desde la barra de menús

Los eventos del icono y el menú abren la ventana sin pasar sus objetos nativos como recordatorios. La apertura de una notificación valida y copia solamente el identificador de tarea y la fecha, evitando enviar objetos de Electron a la interfaz.

Pruebas: `tests/main-lifecycle.test.js`, con objetos que contienen funciones no serializables y un recordatorio válido.

## Validación

Se añadieron 21 pruebas a las 166 existentes: 187 en total. Se ejecuta la suite completa con Node.js 18 y Node.js 24, además de comprobar la sintaxis y el diff.

Al ejecutar las nuevas pruebas de arranque, recuperación, límites y recordatorios sobre el código anterior, 15 fallan y 9 pruebas previas pasan. La reproducción previa de Focus generaba cinco intentos en menos de 100 ms; las nuevas pruebas exigen un solo intento automático y reintentos explícitos posteriores.

Las pruebas de interfaz usan JSDOM; las de ciclo de vida simulan las dependencias de Electron. No certifican la ejecución nativa de los instaladores en Catalina, Apple Silicon o Windows. Las comprobaciones en esos dispositivos siguen siendo necesarias antes de publicar una versión estable.
