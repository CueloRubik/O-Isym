# Implementación del Organizador de ideas

**Rama de trabajo:** `development`  
**Plataforma inicial:** macOS Intel  
**Estado:** etapas 1–8 implementadas en `development`; pendiente robustez e historial  
**Objetivo:** añadir un administrador de pizarrones y un editor visual de ideas sin alterar el funcionamiento de las tareas, actividades, perfiles ni Focus existentes.

## 1. Decisiones de producto

### Dos pantallas distintas

1. **Biblioteca de pizarrones:** es la pantalla inicial de la sección. Muestra los pizarrones creados y permite crear, abrir, buscar, renombrar, duplicar, exportar y eliminar. Un perfil nuevo comienza con una lista vacía; no se crean pizarrones de muestra.
2. **Editor de pizarrón:** espacio de trabajo visual amplio para notas, actividades, grupos y conexiones. Incluye herramientas de navegación, edición, búsqueda y propiedades.

Los pizarrones pertenecen al perfil activo: cambiar de perfil cambia también su biblioteca.

### Lienzo y navegación

Se utilizará un **lienzo virtual de extensión amplia**, no una superficie DOM gigantesca. Las posiciones se guardan en coordenadas del mundo y la cámara mantiene desplazamiento y zoom. Esto ofrece una experiencia prácticamente infinita sin crear miles de elementos invisibles.

- Desplazamiento: arrastrar el fondo; también espacio + arrastrar.
- Zoom: rueda/trackpad y controles +/−, centrado en el puntero cuando sea posible.
- Controles: porcentaje, centrar contenido y ajustar todo a pantalla.
- Límites de seguridad para coordenadas y zoom, sin imponer un borde visual al área útil.
- Tarjetas renderizadas como elementos DOM; conexiones dibujadas en SVG detrás de ellas.
- Solo se montan elementos visibles o cercanos al área visible cuando el volumen lo justifique.

## 2. Experiencia de la biblioteca

- Crear pizarrón con nombre y descripción opcional.
- Abrir un pizarrón con doble clic o botón.
- Renombrar y editar descripción.
- Duplicar con todos sus nodos, grupos, conexiones, categorías locales y vista; se regeneran todos los IDs.
- Eliminar con confirmación que indique el nombre del pizarrón.
- Buscar por nombre, descripción y contenido.
- Ordenar por modificación reciente, creación o nombre.
- Mostrar vista previa, número de elementos y última modificación.
- Exportar un pizarrón individual o todo el proyecto.
- Importar archivos `.oisym` después de validar y mostrar un resumen; resolver colisiones de nombres sin sobrescribir.
- Estado vacío claro con botón «Crear pizarrón», sin ejemplos precargados.

## 3. Editor: herramientas y funciones

### Barra superior
- Volver a la biblioteca.
- Nombre editable del pizarrón.
- Estado de guardado: guardando, guardado o error.
- Deshacer y rehacer.
- Añadir nota, actividad o grupo.
- Herramienta de selección y herramienta de conexión.
- Buscar dentro del pizarrón.
- Exportar y abrir opciones del pizarrón.

### Lienzo
- Mover elementos arrastrando su cuerpo.
- Seleccionar uno o varios elementos; selección múltiple con Shift o marco de selección.
- Duplicar, copiar, pegar y eliminar.
- Conectar dos elementos arrastrando desde sus puntos de conexión.
- Conexiones con etiqueta opcional, dirección y estilo sencillo.
- Grupos visuales para reunir elementos; mover el grupo mueve sus elementos asociados.
- Ajuste a cuadrícula opcional y alineación/distribución básica.
- Menú contextual con acciones apropiadas al elemento.
- Atajos de teclado visibles en ayuda; no interceptar teclas mientras se escribe en campos.

### Tipos de elemento iniciales

**Nota**
- Título y texto libre.
- Color, categoría, tamaño y posición.
- Edición directa y redimensionado.

**Actividad**
- Título y descripción.
- Fecha de inicio opcional y fecha límite.
- Estado: pendiente, en curso o completada.
- Prioridad y categoría.
- Hora opcional y duración estimada.
- Checklist sencilla, si no complica el primer corte.
- La fecha se representa como fecha local `YYYY-MM-DD`, no como instante UTC, para evitar cambios de día por zona horaria.

**Grupo**
- Título, color y elementos asociados.
- Contenedor visual que permite mover y organizar un conjunto.
- Los elementos agrupados siguen siendo seleccionables y editables individualmente.

### Panel de propiedades
Al seleccionar un elemento muestra sus campos editables, color, categoría, fechas, estado, prioridad y acciones. Con varios elementos seleccionados ofrece solo las acciones comunes.

### Herramientas fuera del lienzo
- Búsqueda con salto y resaltado del resultado.
- Filtros por tipo, categoría, estado y fecha.
- Vista de lista opcional para localizar actividades sin navegar visualmente.
- Panel de ayuda de atajos.
- Ajustes de cuadrícula, comportamiento del lienzo y preferencias visuales del pizarrón.

## 4. Modelo de datos propuesto

Los datos vivirán dentro del perfil activo, en una colección nueva e independiente: `ideaBoards`. No se reutilizarán ni alterarán las colecciones actuales `tasks`, `activities` o `goals`.

Cada pizarrón tendrá:
- `id`, `title`, `description`, `createdAt`, `modifiedAt`.
- `viewport: { x, y, zoom }`.
- `nodes: []` con notas, actividades y grupos.
- `connections: []` con referencias a IDs de nodos.
- Preferencias visuales opcionales.

Cada nodo tendrá ID estable, tipo, posición, tamaño, contenido, color/categoría y marcas de tiempo. Las actividades añadirán fechas, estado y prioridad. Los grupos guardarán referencias a sus elementos. Las conexiones tendrán ID, origen, destino, etiqueta y estilo.

Los IDs deben ser únicos. Las conexiones y referencias de grupos deben apuntar a elementos existentes. La validación rechazará datos malformados, valores no finitos, tamaños extremos y colecciones excesivas.

## 5. Arquitectura propuesta

Mantener la aplicación vanilla JS y sus convenciones actuales. Añadir módulos independientes y cargar los scripts en orden desde `index.html`:

- `src/domain.js` (ampliación compatible): creación, normalización, validación y operaciones puras sobre pizarrones y nodos; el dominio se mantiene junto a las reglas de perfiles y tareas existentes.
- `src/ideas-library.js`: pantalla de biblioteca y operaciones de administración.
- `src/ideas-editor.js`: estado del editor, selección, herramientas y composición de la interfaz.
- `src/ideas-canvas.js`: cámara, zoom, desplazamiento, coordenadas y renderizado visible.
- `src/ideas-connections.js`: creación, edición y renderizado SVG de conexiones.
- `src/ideas-history.js`: comandos de deshacer/rehacer.
- `src/ideas-io.js`: validación, importación y exportación `.oisym`.
- Estilos específicos en un archivo separado, por ejemplo `src/styles/ideas.css`.

La navegación actual conservará el identificador `planner`, pero su renderer pasará a mostrar la biblioteca o el editor según el estado interno. La agenda asistida actual no se eliminará ni se mezclará con los pizarrones; se conservará como funcionalidad existente y se revisará su ubicación para evitar perder acceso a ella.

El almacenamiento seguirá usando `window.oisym.storage.save`. Se ampliará la normalización y validación del perfil de forma retrocompatible: perfiles antiguos sin `ideaBoards` se interpretarán como `ideaBoards: []`. No se requiere cambiar Electron IPC ni crear un almacenamiento paralelo.

## 6. Guardado, historial y protección de datos

- Guardado automático con debounce después de cambios reales.
- Durante el arrastre no guardar cada píxel: actualizar la vista y persistir al terminar el gesto.
- Mostrar estado de guardado y conservar cambios pendientes si ocurre un error.
- Reintentar guardado sin descartar el último estado válido.
- El guardado utilizará la cola y las copias de seguridad ya implementadas por O-Isym.
- Antes de eliminar pizarrones o importar contenido se pedirá confirmación; el guardado actual crea respaldo al detectar cambios.
- Deshacer/rehacer con historial acotado por comandos, no con copias completas del perfil.
- Cerrar o cambiar de vista con guardado pendiente: esperar al guardado o advertir claramente si falló.
- La exportación es independiente del guardado local y nunca incluirá rutas locales, datos del dispositivo ni secretos.

## 7. Formato `.oisym`

Respetar `docs/OISYM-FILE-FORMAT.md` y su versión inicial `1.0.0`. Validar formato, versión, estructura, límites, IDs, fechas y referencias antes de importar. Mostrar cantidad y nombres de pizarrones, notas, actividades, grupos y conexiones antes de confirmar. Importar como pizarrones nuevos por defecto; nunca reemplazar silenciosamente. Si la versión no es compatible, conservar el archivo original y no modificar los datos existentes.

## 8. Implementación por etapas

1. **Base de datos y dominio:** modelo, IDs, validación, normalización retrocompatible y pruebas unitarias.
2. **Biblioteca:** estado vacío, creación, apertura, edición de nombre/descripción, duplicación, eliminación, búsqueda y orden.
3. **Lienzo navegable:** cámara, zoom, desplazamiento, persistencia de viewport y controles.
4. **Notas:** crear, editar, mover, redimensionar, colorear, seleccionar, duplicar y eliminar.
5. **Actividades:** fechas, estado, prioridad, categoría, edición y filtros.
6. **Conexiones:** herramienta de conexión, etiquetas, dirección y eliminación segura.
7. **Grupos y selección múltiple:** agrupar, desagrupar, mover en conjunto y operaciones masivas.
8. **Productividad:** búsqueda, vista de lista, filtros, atajos, cuadrícula y alineación.
9. **Historial y robustez:** deshacer/rehacer, guardado ante errores y pruebas de recuperación.
10. **Importar/exportar:** archivos `.oisym`, vista previa, conflictos y validación.
11. **Pulido y pruebas:** accesibilidad, ventanas pequeñas, rendimiento con muchos elementos y pruebas de regresión.

## 9. Pruebas de aceptación

- Un perfil nuevo muestra cero pizarrones.
- Los pizarrones de un perfil no aparecen en otro.
- Crear, editar, duplicar, eliminar y reabrir conserva el contenido correcto.
- Mover/editar elementos no mueve accidentalmente la cámara y viceversa.
- Zoom y desplazamiento mantienen el punto de referencia esperado.
- Fechas no cambian de día al reabrir en otra zona horaria.
- No se permiten conexiones colgantes ni referencias a elementos inexistentes.
- Un fallo de guardado no borra la última versión guardada.
- Importar archivos inválidos o de versión desconocida no modifica los datos.
- La agenda, tareas, actividades, perfiles, calendario y Focus actuales siguen funcionando.
- `npm test` y las pruebas nuevas pasan antes de integrar.

## 10. Fuera del primer lanzamiento

Colaboración en tiempo real, sincronización en nube, comentarios, adjuntos pesados, automatizaciones inteligentes, plantillas precargadas y pizarrones públicos quedan fuera del primer corte. Se podrán diseñar después de que el flujo local sea estable.

## 11. Progreso registrado

- [x] Definición de la experiencia de biblioteca y editor.
- [x] Decisión de lienzo virtual amplio con cámara, zoom y desplazamiento.
- [x] Modelo inicial de pizarrones, notas, actividades, grupos y conexiones en `src/domain.js`.
- [x] Compatibilidad retroactiva: perfiles anteriores sin `ideaBoards` se normalizan como una colección vacía.
- [x] Validación de límites, fechas, IDs y referencias entre elementos.
- [x] Primeros casos automatizados añadidos a `tests/domain.test.js`.
- [ ] Ejecutar la suite en un entorno Node 18 y corregir cualquier fallo.
- [x] Implementar primera biblioteca visual: crear, abrir, buscar, ordenar, duplicar y eliminar pizarrones.
- [x] Añadir edición de nombre y descripción, exportación individual e importación validada con confirmación.
- [x] Implementar la primera base del editor: lienzo virtual, desplazamiento, zoom con punto de referencia, centrado y ajuste a pantalla.
- [x] Añadir notas y actividades visuales editables al lienzo.
- [x] Añadir conexiones entre elementos.
- [x] Implementar grupos visuales, selección múltiple y movimiento conjunto.
- [x] Añadir búsqueda de contenido, filtros por tipo/estado/prioridad y contador de resultados.
- [ ] Continuar con historial y robustez.


### Etapa 3: lienzo navegable

- El editor provisional se sustituyó por un lienzo amplio con cámara virtual; no se crea una superficie de tamaño infinito ni nodos DOM masivos.
- El desplazamiento se realiza arrastrando el fondo. También se puede navegar con las flechas cuando el lienzo tiene el foco; Shift aumenta el paso.
- El zoom funciona con rueda/trackpad y controles +/−, conserva el punto situado bajo el puntero y está limitado al rango validado de 0.1 a 4.
- «Centrar» vuelve al centro del contenido y «Ajustar todo» calcula un zoom que intenta encajar los elementos dentro del área visible. Si el pizarrón está vacío, ambos recuperan una vista limpia al centro.
- La cámara se guarda en `viewport` con debounce al terminar la interacción; al volver a la biblioteca o cambiar de sección se fuerza el guardado pendiente.
- Esta etapa no añade todavía notas, actividades, grupos ni conexiones. El lienzo vacío muestra una indicación breve de uso.


### Etapa 4: notas en el lienzo

- Se incorporó la creación de notas en el centro de la vista actual, con límite de elementos del modelo.
- Cada nota permite editar título y contenido directamente, seleccionarse visualmente, moverse desde su encabezado y redimensionarse desde la esquina inferior derecha; los cambios de texto, posición y tamaño se guardan con debounce.
- Se añadieron seis colores, duplicación y eliminación con confirmación. Los identificadores de las copias se generan de nuevo mediante el modelo de dominio.
- El lienzo muestra un estado vacío solo cuando no hay elementos; la cuadrícula y la cámara continúan funcionando con tarjetas presentes.
- Las notas se guardan dentro de `ideaBoards[].nodes` y pasan por `createIdeaNode` / `updateIdeaNode`; no se introduce almacenamiento paralelo.


### Etapa 5: actividades en el lienzo

- Se añadió «+ Actividad» a la barra del editor. Las tarjetas nuevas se colocan cerca del centro de la vista actual y se guardan dentro de `ideaBoards[].nodes`, sin crear ni modificar actividades de la agenda general.
- Cada tarjeta permite editar título y descripción, fecha de inicio, fecha límite, estado (pendiente, en curso o completada), prioridad, categoría y duración estimada en minutos.
- Las actividades se pueden mover arrastrando su encabezado, seleccionar, duplicar y eliminar con confirmación. También pueden cambiarse entre cuatro colores.
- Los campos se validan mediante el modelo de dominio existente y se guardan con el mismo guardado automático con debounce utilizado por las notas.
- Se añadió validación para impedir que la fecha límite sea anterior a la fecha de inicio y pruebas automatizadas de los campos de planificación y duración.
- La etapa no incluye todavía filtros por estado/categoría/fecha; esos controles permanecen en la etapa de productividad.


### Etapa 6: conexiones entre elementos

- Se incorporaron dos modos de creación: conexión con flecha y conexión sin flecha. El usuario selecciona dos tarjetas del lienzo y puede escribir una etiqueta opcional de hasta 100 caracteres.
- Las conexiones se dibujan en una capa SVG independiente, por detrás de las tarjetas, y unen los centros de los elementos. Se actualizan cuando las notas o actividades se mueven o cuando cambia el tamaño de una nota.
- Las conexiones se guardan en `board.connections` y conservan el formato validado por el dominio: identificador único, origen, destino, etiqueta, estilo y dirección.
- Al seleccionar una línea aparecen las acciones para editar su etiqueta o eliminarla. La eliminación de una nota o actividad también elimina sus conexiones asociadas para evitar referencias colgantes.
- Se añadieron pruebas automatizadas de conexiones válidas, referencias inexistentes, extremos iguales, etiquetas fuera de límite y direcciones inválidas.
- Los grupos aún no se pueden conectar desde la interfaz; se habilitarán cuando se implemente su edición visual.


### Etapa 7: grupos y selección múltiple

- Se habilitó la selección múltiple con Shift + clic sobre notas y actividades. La barra indica cuántos elementos están seleccionados y permite agrupar dos o más.
- Los grupos se representan como contenedores visuales detrás de las tarjetas. Su encabezado permite cambiar el título, desagrupar sin borrar los elementos y mover el conjunto completo.
- Los grupos guardan referencias a nodos existentes; el dominio rechaza referencias ausentes, autorreferencias y grupos anidados. Al eliminar una nota o actividad se retira también su referencia del grupo.
- Eliminar un grupo conserva intactas sus notas y actividades. El guardado continúa usando el almacenamiento habitual del perfil.


### Etapa 8: búsqueda, filtros y productividad

- La biblioteca ahora busca también dentro del título, descripción, contenido y categoría de las notas y actividades de cada pizarrón. Se añadió el orden «Más elementos».
- En el lienzo se incorporó búsqueda por título, descripción y categoría, filtro por tipo de elemento y filtros de estado y prioridad para actividades.
- Los filtros son visuales y temporales: ocultan tarjetas y conexiones que no coinciden, sin modificar ni borrar datos. Los grupos se muestran cuando contienen al menos un elemento visible.
- Un contador informa cuántos elementos y actividades coinciden con los filtros actuales. Los controles se adaptan a pantallas estrechas.
