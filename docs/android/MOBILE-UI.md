# Interfaz para teléfono y tablet

Estado: especificación pendiente de implementar y verificar.

## Una actividad y una navegación

- Una actividad principal de Android; secciones como rutas/paneles internos.
- Navegación inferior propuesta: Hoy, Calendario, Focus, Pizarrones y Más. Más reúne actividades, metas, perfiles y ajustes.
- Navegar no reinicia Focus ni crea reproductores nuevos. Mantener un acceso compacto a la sesión activa.
- Atrás cierra primero teclado, diálogo, editor o panel actual; después vuelve a la sección anterior. No cancelar una sesión por salir de la pantalla.
- Si hay texto sin guardar, conservar borrador o mostrar una decisión clara antes de descartarlo.
- El toque en una notificación abre el destino dentro de esta misma actividad.

## Tamaños y espaciado

| Ancho disponible en CSS px | Diseño inicial a validar |
| --- | --- |
| 320–359 | Comprobación de accesibilidad y ausencia de bloqueos; una columna |
| 360–599 | Teléfono; una columna, navegación inferior y acciones principales visibles |
| 600–839 | Pantalla amplia; panel secundario solo cuando hay espacio útil |
| 840 o más | Tablet; dos paneles cuando mejoran la tarea, con navegación coherente |

Los cortes son decisiones iniciales, no una detección de modelo de teléfono. Reaccionar al espacio real, teclado y orientación.

- Objetivos táctiles de al menos 48 dp en superficies nativas y equivalente visual validado en WebView.
- Márgenes iniciales de 16 px CSS, adaptables; ningún icono o texto pegado al borde del contenedor.
- Mantener paletas, modo oscuro, relieve y esquinas configurables con los mismos tokens.
- Aplicar insets de barras del sistema y recortes de pantalla; no sumar dos veces insets nativos y CSS.
- Altura disponible dinámica y tratamiento del teclado; no confiar únicamente en 100vh.
- Evitar scroll horizontal de toda la aplicación. El desplazamiento del calendario o lienzo es local e intencional.
- Texto grande y etiquetas largas ajustan la altura de componentes; no truncar la única explicación de una acción.

## Adaptación por sección

| Sección | Comportamiento móvil |
| --- | --- |
| Hoy y tareas | Tarjetas compactas, horarios visibles y completar sin abrir el editor |
| Formularios | Una columna; guardar accesible con teclado; errores junto al campo |
| Calendario | Agenda/día como vista cómoda inicial, selector de fecha y cambio a semana/mes |
| Focus | Tiempo legible; iniciar/pausar/reanudar/cancelar; música y alarma con controles diferenciados |
| Pizarrones | Pan y zoom táctiles; modo selección claro; edición en panel inferior o pantalla interna |
| Actividades y metas | Lista y detalle secuenciales; no forzar columnas de escritorio estrechas |
| Perfiles | Selección/edición cómoda; confirmar borrado; indicar qué perfil tiene Focus activo |
| Ajustes | Grupos cortos, vistas internas y previsualización; estado real de permisos |

## Gestos y accesibilidad

En pizarrones, separar mover un nodo, desplazar el lienzo y seleccionar. Pinza para zoom con límites y controles alternativos de acercar/alejar/centrar. Una pulsación larga puede abrir acciones, pero no será la única forma de descubrirlas. Gestionar pointercancel, multitouch y scroll sin mover objetos accidentalmente.

Usar semántica de botones/campos, etiquetas accesibles y foco visible. Con TalkBack, permitir recorrer acciones sin depender del gesto de arrastre. Probar texto ampliado, contraste, colores de usuario, teclado físico y orientación horizontal.

## Estados que también se diseñan

Carga, lista vacía, permiso denegado, archivo cancelado, almacenamiento lleno, error recuperable, audio no disponible, sesión recuperada y confirmaciones. Los avisos no deben tapar permanentemente los botones principales.

## Fuentes

- [Android: contenido y barras edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge).
- [Capacitor: construir la interfaz](https://capacitorjs.com/docs/basics/building-your-ui).

Prueba de aceptación: recorrer todas las secciones en teléfono con teclado y texto grande, guardar cambios y volver a Focus sin perder estado.
