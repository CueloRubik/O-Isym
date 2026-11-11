# Revisión de Pizarrones — 11 de noviembre de 2026

Cambios basados en las notas de uso del usuario: conexiones, agrupación, selección, movimiento, deshacer/rehacer y cierre.

- Los iconos de la raíz se movieron a `assets/icons/actions`, `interface` e `ideas`. Buscar y duplicar comparten la imagen nueva en toda la aplicación. Editar, exportar, filtrar y dashboard reutilizan los recursos existentes. Abrir usa dashboard con texto.
- Las herramientas del editor se distribuyen por edición, conexiones y vista. Incluyen ayuda de gestos, renombrar y exportar desde el editor.
- Arrastrar el fondo con el botón izquierdo dibuja una selección con previsualización. Shift añade sin retirar lo seleccionado. Un clic vacío sin Shift limpia la selección.
- Seleccionar una tarjeta agrupada incluye su grupo. Option/Alt permite seleccionar únicamente esa tarjeta. Arrastrar un encabezado mueve la selección. Reagrupar transfiere la pertenencia y elimina los grupos vacíos, sin duplicar combinaciones.
- La rueda pulsada permite desplazar; dos dedos/rueda desplazan; pellizco o Ctrl/Cmd + rueda cambian el zoom. Los botones de zoom siguen disponibles.
- El atajo de historial se registra una sola vez, incluso después de volver a dibujar la vista. No se repite mientras se mantiene pulsada la tecla. El atajo dentro de una tarjeta usa el historial del pizarrón. Los diálogos conservan su edición de texto normal.
- Cada guardado con cambios de contenido registra un estado; el texto usa el retardo existente para agrupar la escritura. La cámara y las marcas de modificación no crean pasos ni borran Rehacer. Deshacer conserva la cámara y la selección de elementos que siguen existiendo. Mover tarjetas sí es deshacible.
- Las respuestas de guardado no reemplazan el estado actual de la interfaz. Las solicitudes se serializan con copias independientes de los datos.
- Cerrar u ocultar la ventana solicita guardar los cambios pendientes y espera confirmación. Si falla, la ventana sigue abierta; no se descartan los cambios. Esto cubre cierre normal, no terminación forzada ni pérdida de energía.
- Las conexiones se dibujan por encima del fondo de los grupos y las tarjetas, con recálculo tras montar el editor. La representación visual de los límites de grupos ya no modifica los datos durante el renderizado.

## Comprobación

Pruebas de dominio, almacenamiento, audio y notificaciones más pruebas de integración del editor en DOM simulado: historial y teclado, selección, grupos, conexiones, iconos, guardados lentos, errores y reapertura desde almacenamiento real. Pruebas del cierre con eventos de Electron simulados verifican la confirmación y el rechazo de mensajes no confiables.

Pendiente de validación física: apariencia y gestos en macOS Catalina/trackpad, y cierre en Electron en macOS y Windows. El entorno de revisión no permitió iniciar Chromium por su restricción de sockets; las pruebas DOM no sustituyen esa revisión visual.
