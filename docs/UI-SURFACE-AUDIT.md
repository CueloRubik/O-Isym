# Auditoría y sistema de superficies de O-Isym

**Estado:** implementación en la rama `development`. No publicar DMG sin revisar visualmente macOS Catalina.

## Problema corregido

Las ventanas de la interfaz tenían tarjetas con sombras antiguas, bordes aislados, esquinas fijas y cuadros interiores sin un espacio coherente. Esto causaba tarjetas planas o dobles relieves y dejaba algunos iconos y textos demasiado cerca del borde. Los estilos de `app.css`, `workspace.css` y `appearance.css` no siempre coincidían.

La nueva hoja **`src/styles/surfaces.css`**, cargada **después** de estas tres, reúne las reglas de relieve, contornos y separación. No sustituye funciones de Focus, actividades, calendario, notas ni guardado.

## Configuraciones respetadas

- **Esquinas Rectas:** cantos casi rectos en tarjetas, campos, controles y cuadros interiores.
- **Esquinas Suaves:** redondeo moderado.
- **Esquinas Redondeadas:** mayor curvatura en la misma familia de controles.
- **Tarjetas con profundidad:** sombra exterior discreta, contorno y reflejo interior.
- **Tarjetas suaves:** color secundario, contorno y relieve ligero.
- **Tarjetas con contornos:** borde más definido y relieve interior mínimo.
- **Espaciado Cómodo o Compacto:** adapta los márgenes interiores; Compacto nunca elimina la separación de textos e iconos.

Las formas se gobiernan mediante `--ui-radius-card`, `--ui-radius-control`, `--ui-radius-nested`, `--ui-radius-tiny` y `--ui-radius-pill`. Los márgenes interiores usan `--ui-outer-padding`, `--ui-inner-padding` y `--ui-small-padding`. Los colores proceden de la paleta activa, sin imponer bloques blancos en modo oscuro.

## Inventario revisado

| Zona | Componentes |
|---|---|
| Inicio | Cabecera, métricas, «Completadas hoy», filas de tareas, sugerencias y tarjeta de Focus |
| Tareas y metas | Tarjetas de catálogo, listas, actividades, objetivos, prioridades, campos y botones |
| Calendario | Celdas de mes y semana, agenda, cuadro del día, conflictos, fecha seleccionada |
| Focus | Panel principal, música, alarmas y estadísticas |
| Perfiles | Selector, lista de usuarios, avatar, métricas, preferencias y diálogos |
| Ajustes | Navegación, formularios, paletas, muestras de color y vista previa |
| Pizarrones | Biblioteca, búsqueda, botones, barra del lienzo, notas, actividades y encabezados de grupos |
| Ventanas | Editor lateral de tareas, editor de entidades, modales y menús de opciones |

Las filas de tareas, actividades, historial, bandeja, propuestas, estadísticas semanales y otros elementos que antes eran líneas planas ahora disponen de contorno, fondo y espaciado propios.

## Excepciones importantes

- Los menús de opciones conservan `overflow: visible` en sus tarjetas para que las acciones desplegables no queden cortadas.
- El lienzo de Pizarrones **debe** usar `overflow: hidden` para recortar correctamente el área visible mientras se arrastra el mundo infinito. Los nodos conservan posiciones, tamaños y colores definidos por el usuario.
- Los bloques horarios posicionados absolutamente pueden ser muy cortos; conservan márgenes reducidos y títulos truncados. No se cambia su duración ni su posición para añadir espacio decorativo.
- El editor lateral ocupa el ancho de pantalla en ventanas pequeñas. Su contenedor puede tocar el borde de la ventana, pero el formulario y sus botones conservan separación interior.
- Las barras de progreso, controles deslizantes, conectores y tiradores de redimensionado siguen siendo elementos geométricos, no tarjetas con relleno.

## Validación

`tests/surface-ui.test.js` verifica el orden de hojas de estilo, los tres modos de esquinas, el relieve por estilo, los componentes cubiertos, la separación mínima, las excepciones del lienzo, los menús y las ventanas estrechas. La batería general sigue comprobando navegación, datos, Focus y Pizarrones.

**Prueba visual manual pendiente en Catalina:** verificar todas las combinaciones entre esquinas Rectas, Suaves y Redondeadas; estilos de tarjetas con profundidad, suaves y contornos; modo claro/oscuro; espaciado Cómodo/Compacto; ventanas estrechas; tareas con títulos largos; menús abiertos al final de las listas; notas pequeñas, zoom, y editores laterales. La cobertura automatizada no garantiza que todas las mediciones de píxel de cada sistema estén libres de desbordamiento.
