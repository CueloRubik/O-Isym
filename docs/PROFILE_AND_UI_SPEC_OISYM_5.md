# O-Isym 5 — Especificación de perfiles y reorganización de la interfaz

**Estado:** especificación funcional y visual; primera entrega de perfiles y Ajustes implementada parcialmente. Consulta el estado de implementación al final del documento.  
**Rama:** `oisym-5-development`. `main` debe permanecer intacta.  
**Compatibilidad:** Electron 28.3.3, Node 18.x, macOS Intel/Catalina.

Este documento define qué debe hacer cada control, qué información aparece en cada pantalla y cómo se validan las operaciones. Es la referencia para construir P2, P3 y completar P5. Reorganizar no autoriza a eliminar funciones existentes.

---

# A. Administración de perfiles

## 1. Diagnóstico actual

La aplicación ya tiene selector de perfil, creación básica, preferencias de perfil y datos independientes. Sin embargo, la administración está reducida a una lista simple dentro de Ajustes; la eliminación actual opera sobre el perfil activo con una confirmación genérica. No hay ficha completa, edición de perfiles inactivos, resumen de datos, exportación individual ni una separación clara entre seleccionar un perfil para administrarlo y activarlo.

Ajustes mezcla identidad, apariencia, planificación, Focus, horarios, atajos, copias, migración y perfiles en una sola columna. El resultado es demasiado largo y oculta acciones importantes.

## 2. Reglas fundamentales

Cada perfil es un espacio local independiente. Mantener los campos actuales y su compatibilidad:
- ID estable, nombre, edad opcional, color, avatar y marcas de tiempo.
- Preferencias visuales, de planificación, Focus, música, alarmas y notificaciones.
- Tareas, actividades, objetivos, historial y sesión Focus activa.
- Marcas de migración de datos antiguos.

Reglas:
1. Siempre debe existir al menos un perfil.
2. Conservar el límite actual de 50 perfiles.
3. Nombre obligatorio, recortado y de máximo 60 caracteres.
4. Edad opcional; si existe, entero entre 1 y 120. No guardar fecha de nacimiento.
5. IDs únicos y estables; editar no genera un ID nuevo.
6. El perfil activo se determina por `activeProfileId`, nunca por el orden de la lista.
7. Los perfiles antiguos deben seguir funcionando mediante normalización/migración.
8. Ninguna operación puede mezclar tareas, actividades, objetivos, sesiones ni preferencias.
9. Guardar antes de anunciar éxito o cerrar el flujo.
10. Si falla el guardado, no fingir que la operación terminó; restaurar el último estado persistido.
11. No añadir cuentas, contraseñas, nube, sincronización ni telemetría.
12. No inventar un perfil principal protegido: el modelo actual no lo define.

## 3. Nueva pantalla «Perfiles»

Acceso desde el selector de la barra lateral («Administrar perfiles») y desde Ajustes. El botón «+ Perfil» abre directamente el modal de creación.

### Encabezado
- Título «Perfiles».
- Descripción breve: «Administra tus espacios y la información de cada uno».
- Acción principal «+ Crear perfil».
- Contador «X de 50 perfiles».
- Al alcanzar 50, deshabilitar crear/duplicar/importar y explicar el límite.

### Distribución
Escritorio: lista de perfiles a la izquierda y ficha del seleccionado a la derecha. La lista puede desplazarse internamente si es larga. Seleccionar una tarjeta solo abre su ficha; **no activa** el perfil.

Ventana estrecha: lista primero; al seleccionar, mostrar ficha y acción «Volver a perfiles». Sin desbordamiento horizontal.

### Tarjeta de perfil
- Avatar, nombre y color de acento discreto.
- Etiqueta «En uso» si es el activo.
- Fecha de creación o actualización.
- Estado seleccionado accesible.
- Acción «Abrir»/seleccionar y menú de acciones.
- No usar una tabla densa ni mostrar botones destructivos en cada tarjeta.

### Ficha del perfil
Orden:
1. **Identidad:** avatar grande, nombre, etiqueta «Perfil actual»/«Perfil independiente», creado, actualizado y color.
2. **Resumen calculado:** tareas pendientes, completadas, actividades activas, objetivos activos, sesiones Focus y estado de sesión activa. No guardar contadores duplicados.
3. **Acciones:** «Usar este perfil» (si está inactivo), «Editar perfil», «Duplicar configuración», «Exportar este perfil» y «Eliminar perfil» separado visualmente.
4. **Preferencias resumidas:** tema, color, movimiento, autonomía, duración Focus/descanso y horario.
5. Enlace «Editar todas las preferencias».

## 4. Crear perfil

Modal centrado y compacto en escritorio; casi a pantalla completa con scroll interno en ventana estrecha.

Campos, en este orden:
1. **Nombre** obligatorio, máximo 60 caracteres; recortar espacios. Permitir nombres repetidos, pero mostrar avatar/color para distinguirlos.
2. **Edad** opcional, entero 1–120. Texto: «Se usa para adaptar algunas sugerencias. No guardamos fecha de nacimiento».
3. **Avatar:** selector de los 18 PNG existentes, estado elegido claro, vista previa grande y etiquetas accesibles.
4. **Color:** selector y muestras rápidas; vista previa; validar hexadecimal.
5. **Tema:** Clásico, Cálido, Cielo y Colorido con muestras pequeñas. El tema sugerido por edad es solo una propuesta inicial.

Acciones:
- «Crear perfil» principal y «Cancelar» secundario.
- Deshabilitar crear si el nombre no es válido o se alcanzó el límite.
- Escape cierra; si hay cambios, confirmar descarte.
- Cerrar fuera del modal solo si no hay cambios.
- Guardar primero; después activar perfil nuevo, cerrar y mostrar «Perfil creado».
- Si falla el guardado, mantener el perfil anterior y no mostrar éxito.
- Al crear: ir a Hoy y mostrar bienvenida vacía con accesos «Crear primera tarea», «Añadir actividad» y «Configurar Focus». No generar tareas de ejemplo.

## 5. Editar perfil

Debe poder editarse un perfil inactivo sin activarlo. Reutilizar el formulario de creación con título «Editar perfil», vista previa en vivo, «Guardar cambios», «Cancelar» e indicador de cambios sin guardar.

Campos editables: nombre, edad, avatar, color, tema, movimiento, autonomía, duración Focus/descanso y horario. Preferencias de sonido detalladas van en Ajustes > Sonido y alarmas.

Al guardar:
- Actualizar solo el perfil cuyo ID se está editando.
- Preservar íntegros sus arrays de tareas, actividades, objetivos e historial.
- Si es el activo, aplicar tema/color inmediatamente.
- Si es inactivo, no alterar la apariencia actual ni cambiar el perfil activo.
- Mantener `createdAt`; actualizar `updatedAt`.
- Ante error, conservar estado persistido y mostrar mensaje concreto.

## 6. Cambiar de perfil

### Selector rápido
Mostrar avatar y nombre actual. Al abrir:
- Lista de perfiles con avatar y nombre.
- Búsqueda si la lista es larga.
- Acción fija «Administrar perfiles».
- Acción «Crear perfil».
No incluir estadísticas ni acciones destructivas en este menú.

### Comportamiento
- Guardar cambios pendientes antes del cambio; si falla, cancelar.
- No mezclar datos.
- Detener música, vista previa y alarmas del perfil que deja de estar activo.
- No borrar ni reiniciar su `activeFocus`.
- El tiempo debe conservar coherencia temporal; al volver, recalcular tiempo restante y procesar una sesión ya terminada mediante el flujo normal.
- Notificaciones programadas deben corresponder al perfil activo y no duplicarse.
- Restaurar tema, color, preferencias y vista del nuevo perfil.
- Nunca mostrar una sesión Focus de un perfil dentro de otro.
- La política exacta de si un Focus inactivo sigue transcurriendo debe probarse. Cambiar de perfil jamás debe descartar silenciosamente una sesión.

## 7. Duplicar configuración

Acción «Duplicar configuración». Por defecto copiar solo:
- Tema, color, avatar.
- Preferencias de planificación.
- Duraciones y horario.
- Preferencias de Focus, música y alarma.

No copiar tareas, actividades, objetivos, historial Focus, sesión activa ni marcas de migración. Crear IDs y marcas de tiempo nuevos. Nombre sugerido editable «Nombre (copia)». Mostrar antes de confirmar: «Se copiarán tus preferencias, no tus tareas ni tu historial». Respetar límite de 50.

No implementar duplicación completa de datos en esta primera versión: puede copiar información no deseada.

## 8. Eliminar perfil

No permitir eliminar el último perfil. Se puede eliminar el activo si queda otro, pero el destino debe elegirse/confirmarse. No ejecutar por un clic accidental.

Diálogo:
- Título «Eliminar “Nombre”».
- Texto: «Se eliminarán los datos de este perfil. Los demás perfiles no se verán afectados».
- Resumen real de tareas, actividades, objetivos, sesiones y si existe Focus activo.
- Botones «Cancelar» y «Eliminar perfil».
- Para un perfil con datos o Focus activo, pedir escribir su nombre exacto como protección adicional.

Si es activo:
1. Confirmar un perfil de destino.
2. Detener audio y cancelar notificaciones vinculadas.
3. Preparar transición y respaldo recuperable del snapshot.
4. Eliminar del snapshot y guardar.
5. Solo tras guardado correcto, mostrar el perfil destino.
6. Si falla, restaurar snapshot anterior y mantener los datos.

Si es inactivo: eliminar solo el ID seleccionado, sin cambiar perfil actual. No prometer recuperación si el respaldo no se creó correctamente.

## 9. Exportar e importar perfil individual

Complementar, nunca reemplazar, el backup completo.

**Exportar:** JSON identificable como perfil individual, solo contiene el perfil elegido, nombre de archivo sanitizado y fecha. No incluir otros perfiles.

**Importar:** validar formato, versión, IDs, referencias, fechas, arrays, preferencias y límite antes de modificar snapshot. Si ID ya existe, generar otro y actualizar referencias internas. No sobrescribir perfil existente. Mostrar resumen antes de importar. Añadir como perfil inactivo por defecto y ofrecer «Usar ahora». Archivo inválido no cambia nada.

Diferenciar visualmente «Importar perfil» de «Importar copia completa», que reemplaza el snapshot.

## 10. Casos especiales

Diseñar y probar:
- Primer inicio sin perfiles: crear «Mi espacio».
- Un perfil: permitir editar, bloquear eliminar.
- 50 perfiles: bloquear creación/duplicación/importación.
- Nombre largo: truncar solo visualmente.
- Nombres repetidos: distinguir con avatar, color y fecha.
- Avatar faltante: mostrar iniciales.
- Color inválido: usar fallback seguro.
- Perfil antiguo: normalizar sin perder datos conocidos.
- Perfil corrupto: informar y ofrecer recuperación; no borrar automáticamente.
- Focus activo: proteger sesión en cambio, exportación y eliminación.
- Error de guardado: conservar estado persistido.

---

# B. Arquitectura de toda la interfaz

## 11. Principios

- Cada vista tiene un objetivo y una jerarquía.
- Acciones frecuentes arriba y junto al contenido relacionado.
- Una acción primaria por sección; acciones destructivas separadas.
- Información secundaria se agrupa o colapsa.
- Formularios largos no permanecen siempre abiertos encima de la lista.
- Ancho de lectura cómodo; no estirar texto a toda la ventana.
- Cuadrículas de dos columnas para contenido relacionado en escritorio; una columna en ventana estrecha.
- Mantener el aspecto claro, verde, limpio y actual. No introducir gradientes decorativos ni tema oscuro nuevo.
- No añadir tarjetas solo para rellenar espacio.
- Conservar todas las funciones actuales.

## 12. Estructura global

### Barra lateral
1. Marca O-Isym.
2. Selector de perfil (avatar + nombre).
3. «Administrar perfiles» desde el selector.
4. Navegación: Hoy, Tareas, Actividades, Calendario, Planificador, Focus, Objetivos, Insights.
5. Zona inferior fija: Ajustes y nota de privacidad local.

Debe permanecer estable y no crecer con el contenido. En ventanas estrechas, navegación compacta/adaptable sin aplastar el área de trabajo.

### Barra superior
- Izquierda: fecha o título contextual.
- Derecha: acción primaria contextual.
- Hoy/Tareas: «Nueva tarea».
- Actividades: «Nueva actividad».
- Objetivos: «Nuevo objetivo».
- Perfiles: «Crear perfil».
- Focus: controles en su panel, no un botón global redundante.
- Ajustes: sin acción primaria innecesaria.

Mantenerla visible al desplazarse si el tamaño lo permite.

### Área principal
- Contenedor centrado con ancho máximo coherente.
- Padding adaptable.
- Encabezado de vista: título, descripción corta y acción primaria.
- Toolbar inmediatamente debajo cuando aplique.
- Cuadrículas equilibradas y tarjetas con propósito.
- Títulos y lectura alineados a la izquierda; temporizador e indicadores pueden centrarse.
- Evitar que una tarjeta pequeña quede sola en una fila completa si puede compartir espacio con otra relacionada.

### Jerarquía de acciones
- Primaria: crear/iniciar/aplicar.
- Secundaria: cancelar, volver, cambiar vista.
- Terciaria: editar, archivar, exportar.
- Destructiva: eliminar, separada y confirmada.
- Acciones de fila alineadas al final y con etiquetas accesibles.

## 13. Ajustes: navegación secundaria, no página interminable

Escritorio: encabezado «Ajustes», navegación secundaria a la izquierda y panel de categoría a la derecha. Ventana estrecha: selector horizontal/desplegable y una categoría visible a la vez.

Categorías exactas:

### A. Mi perfil
Nombre, edad opcional, avatar/vista previa, color, tema, movimiento y acceso «Administrar todos los perfiles». Guardar en esta categoría.

### B. Planificación
Autonomía Manual/Sugerido/Híbrido/Automático, explicación real de cada modo y horario habitual. No prometer automatismos que el código no tenga.

### C. Focus
Duración habitual de enfoque y descanso, explicación de sugerencias por actividad y preferencias existentes. No alterar una sesión activa sin confirmación.

### D. Sonido y alarmas
Pista musical, volumen, vista previa, botón detener vista previa mientras suena, alarma al terminar, tono, volumen, repeticiones, intervalo, duración máxima, vista previa de alarma y botón detener alarma global. Evitar controles duplicados desincronizados con la vista Focus.

### E. Notificaciones
Activar/desactivar avisos, estado del permiso si puede leerse con fiabilidad y explicación de qué aviso se envía. No afirmar permisos no comprobados.

### F. Datos y copias
Exportar backup completo, importar backup completo, fecha de último respaldo si existe, restauración, migración del prototipo solo si se detectan datos antiguos. Separar claramente backup completo de exportación individual. Explicar que importar backup completo reemplaza snapshot.

### G. Atajos y ayuda
Lista compacta de atajos y ayuda breve. No ocupar el primer lugar de Ajustes.

### Guardado
Elegir un patrón coherente por categoría: botón «Guardar cambios» para grupos de campos o autoguardado con estado «Guardando/Guardado». No mezclar ambos sin explicación. Mostrar «Cambios sin guardar» y errores reales.

## 14. Organización de cada vista

### Hoy
Escritorio: columna principal con tareas de hoy y atrasadas; columna secundaria con Focus, sugerencias y semana. En estrecho: bienvenida/progreso, tareas, Focus, atrasadas, sugerencias y semana. Tarjetas:
1. Bienvenida y progreso en un solo bloque compacto.
2. Tareas de hoy con «Ver todas».
3. Atrasadas solo si existen.
4. Focus con «Abrir Focus».
5. Sugerencias con aceptar/ignorar.
6. Semana compacta.
No ocultar acciones importantes al final.

### Tareas
Encabezado, contador y «Nueva tarea». Toolbar con búsqueda, estado y filtros en panel desplegable. Formulario de alta/edición en modal o panel lateral. Filas: estado, título, fecha, prioridad, actividad y acciones. Descripción secundaria solo si existe. Diferenciar «sin tareas» de «sin resultados». Resumen lateral opcional solo en escritorio.

### Actividades
Encabezado y «Nueva actividad». Formulario modal/panel. Catálogo compacto: nombre, categoría, duración, frecuencia y descripción. Acciones editar/archivar. Actividades archivadas en filtro secundario. No confundir ideas sugeridas con actividades guardadas.

### Calendario
Encabezado con mes/semana, anterior/siguiente y botón «Hoy». Selector mes/semana. Calendario como área principal; detalle del día a la derecha en escritorio y debajo en ventana estrecha. «Añadir tarea» y «Abrir planificador» junto al detalle, nunca escondidos al final.

### Planificador
Fecha y navegación, resumen de jornada/disponibilidad, agenda principal, tareas sin programar secundarias y propuesta asistida diferenciada. «Analizar disponibilidad» cerca del resumen. Vista previa antes de aplicar. «Aplicar propuestas» y «Descartar» juntos. Explicar tareas omitidas. No aplicar automáticamente si se requiere aprobación.

### Focus
Temporizador y estado en el centro. Tarea/actividad, duración y acción principal iniciar/pausar/reanudar. Terminar/reiniciar como secundarias. Música/alarma en bloque compacto expandible. Controles para detener reproducción visibles mientras suena. Estadísticas debajo; historial después y con «Ver más». No poner historial antes del temporizador.

### Objetivos
Encabezado y «Nuevo objetivo». Resumen activo y tarjetas con nombre, progreso numérico, barra y fecha. +1/−1, editar y archivar agrupados. Formulario modal/panel. Archivados en sección secundaria.

### Insights
Cuatro métricas principales en cuadrícula, gráfico semanal de tareas, concentración, distribución por actividad y panorama textual breve. Gráficos vacíos usan estado vacío explicativo, no una falsa métrica de cero. Aclarar que estadísticas no califican.

### Perfiles
Seguir el Centro de perfiles de la Parte A; no duplicar una lista simple dentro de Ajustes.

## 15. Formularios, modales y confirmaciones

- Crear/editar breve: modal.
- Formulario que necesita consultar la lista: panel lateral.
- En ventana estrecha: modal casi completo con scroll interno.
- Etiquetas siempre visibles; placeholder solo como ejemplo.
- Agrupar campos por tema.
- Pie de acciones alineado a la derecha y fijo si el contenido desplaza.
- Cancelar nunca guarda.
- Escape cierra; si hay cambios, confirmar descarte.
- Foco inicial lógico, foco atrapado dentro y retorno al control que abrió el modal.
- No apilar modales salvo necesidad excepcional.
- Confirmación destructiva nombra el objeto, explica exactamente qué se elimina y muestra Cancelar claramente.

## 16. CSS, tipografía e iconos

Espaciado coherente basado en múltiplos de 4/8 px:
- 4–8 px entre icono y texto.
- 12–16 px entre controles relacionados.
- 20–24 px de padding de tarjetas.
- 24–32 px entre secciones.
- 32–40 px entre encabezado y contenido.

Tipografía del sistema; título de vista claro pero no gigante; títulos de tarjeta consistentes; texto secundario legible. Evitar párrafos largos en tarjetas de control.

Tarjetas: radios coherentes, sombras sutiles, fondos suaves solo para estados o agrupaciones, evitar tarjetas anidadas y alturas forzadas.

Iconos: reutilizar PNG de `assets/icons/`, `object-fit: contain`, no estirar, tamaños definidos por función, proporción y espacio interno. Iconos decorativos nunca sustituyen etiqueta de acción. Revisar cada PNG a tamaño real y en distintos temas antes de dar P4 por terminado. Conservar los no usados en `unused/`.

Cada control debe tener estados normal, hover, focus visible, active, disabled, loading y error cuando aplique. Botones asíncronos no deben permitir doble envío.

Comprobar ventana amplia, mediana, estrecha, altura reducida, zoom/escala y teclado. No fijar alturas que corten formularios. Scroll debe pertenecer al panel correcto.

## 17. Textos y accesibilidad

- Español natural y consistente; verbos directos: Crear, Guardar, Cancelar, Editar, Cambiar, Exportar, Importar, Eliminar.
- Mensajes de éxito breves y específicos; errores explican qué falló y qué hacer.
- Estados vacíos explican qué aparecerá y cómo empezar.
- No repetir descripciones.
- Todos los botones tienen texto o nombre accesible.
- Todos los campos tienen etiqueta.
- Foco visible y tabulación lógica.
- No comunicar estados solo por color.
- Respetar movimiento reducido.
- No interceptar atajos mientras se escribe.
- Mantener «Saltar al contenido».

---

# C. Construcción y control de calidad

## 18. Orden de implementación

### Fase 0 — Preparación
- [ ] Mapear dependencias de perfil, preferencias, almacenamiento, Focus y eventos.
- [ ] Inventariar todos los campos y defaults.
- [ ] Revisar pruebas actuales de perfiles/snapshot.
- [ ] No cambiar esquema sin migración justificada.

### Fase 1 — Base visual
- [ ] Contenedores, grids, encabezados, toolbars y estados comunes.
- [ ] Eliminar la dependencia de columnas verticales interminables.
- [ ] Navegación secundaria de Ajustes.
- [ ] Vista Perfiles y acceso desde selector.
- [ ] Confirmar que todas las vistas siguen accesibles.

### Fase 2 — Perfiles
- [ ] Lista y ficha.
- [ ] Resumen calculado.
- [ ] Selección administrativa separada de perfil activo.
- [ ] Cambio seguro.
- [ ] Crear y editar perfiles activos/inactivos.
- [ ] Duplicar solo preferencias.
- [ ] Exportar/importar individual.
- [ ] Eliminar con confirmación y respaldo.

### Fase 3 — Ajustes
- [ ] Mi perfil.
- [ ] Planificación.
- [ ] Focus.
- [ ] Sonido y alarmas.
- [ ] Notificaciones.
- [ ] Datos y copias.
- [ ] Atajos y ayuda.
- [ ] Sincronizar controles compartidos.

### Fase 4 — Vistas
- [ ] Hoy.
- [ ] Tareas.
- [ ] Actividades.
- [ ] Calendario.
- [ ] Planificador.
- [ ] Focus.
- [ ] Objetivos.
- [ ] Insights.
- [ ] Estados vacíos, formularios y diálogos.

### Fase 5 — Pulido
- [ ] Revisión de iconos reales.
- [ ] CSS, alineación y responsive.
- [ ] Teclado/accesibilidad.
- [ ] Rendimiento con muchos perfiles y tareas.
- [ ] Persistencia, recuperación y pruebas manuales.

## 19. Pruebas obligatorias de perfiles

1. Crear con todos los campos y crear con edad vacía.
2. Rechazar nombre vacío y perfil número 51.
3. Editar perfil inactivo sin activarlo.
4. Cambiar avatar/color/tema del activo y comprobar aplicación inmediata.
5. Cambiar entre perfiles y comprobar aislamiento de datos.
6. Cambiar con Focus activo: sesión preservada y sin audio duplicado.
7. Volver a perfil que tenía Focus activo.
8. Eliminar perfil inactivo y activo.
9. Intentar eliminar el último perfil.
10. Cancelar eliminación y verificar que nada cambia.
11. Simular error de guardado y verificar recuperación.
12. Duplicar preferencias y comprobar que no copia tareas/historial.
13. Exportar y verificar que no incluye otros perfiles.
14. Importar ID repetido y generar ID nuevo.
15. Importar archivo inválido sin alterar snapshot.
16. Abrir perfiles antiguos y normalizar.
17. Probar nombres largos/repetidos, avatar ausente y color inválido.
18. Verificar el límite 50 y los casos de Focus activo.

## 20. Pruebas obligatorias de interfaz

- Acción primaria visible sin scroll hasta el final.
- Ninguna vista es una columna larga sin agrupación.
- Ajustes navegable con ratón y teclado.
- Formularios validados y mensajes claros.
- Ningún botón decorativo o sin acción.
- Iconos no deforman ni desplazan textos.
- Guardar nunca queda oculto.
- Sin desbordamiento horizontal en ventanas estrechas.
- Estados vacíos comprensibles.
- Scroll en el panel correcto.
- El foco vuelve al control de origen al cerrar modal.
- Todas las funciones previas siguen presentes.

## 21. Criterios de aceptación

Perfiles terminado: crear, activar, editar cualquier perfil, duplicar preferencias, exportar/importar individual y eliminar; aislamiento completo; protección de guardado; compatibilidad antigua; casos Focus probados.

UI terminada: cada vista con jerarquía clara y acciones próximas; Ajustes por categorías; centro de perfiles propio; formularios contextuales; uso cómodo en ventanas amplias/estrechas; ninguna función eliminada; revisión visual con app ejecutándose, no solo leyendo CSS.

## 22. Límites

- No modificar `main`.
- No cambiar Electron/Node/dependencias Catalina-Intel sin necesidad y comprobación.
- No añadir cuentas, contraseñas, nube o telemetría.
- No borrar datos al reorganizar.
- No copiar tareas/historial al duplicar configuración.
- No eliminar perfiles sin explicar consecuencias.
- No declarar terminado por el mero hecho de compilar.
- No sustituir funciones por botones decorativos.
- No afirmar que la UI quedó bien sin probarla visualmente.
- Si una decisión cambia el significado de datos existentes, documentarla antes.

---

**Resultado esperado:** O-Isym debe sentirse como una aplicación con espacios independientes bien administrados. Cada vista debe poner lo importante a mano, con acciones donde se necesitan y sin obligar a recorrer páginas largas para encontrar controles básicos.


## Estado de implementación de la especificación (actualización)

Primera entrega de código realizada en `oisym-5-development`:
- [x] Vista dedicada «Perfiles» con lista y ficha seleccionable.
- [x] Resumen de tareas, actividades, objetivos y sesiones calculado desde datos.
- [x] Edición de perfil activo o inactivo sin activar el perfil editado.
- [x] Edad opcional en la creación y edición.
- [x] Duplicación de preferencias sin copiar tareas ni historial.
- [x] Exportación JSON de un perfil individual.
- [x] Eliminación del perfil seleccionado, resumen de contenido, bloqueo del último perfil y transición del perfil activo.
- [x] Navegación secundaria de Ajustes y separación inicial de categorías.
- [x] Guardado separado para identidad/apariencia y planificación.
- [x] Adaptación responsive inicial para Perfiles y Ajustes.
- [x] Ajustes de recuperación de estado Focus al cambiar/crear/eliminar perfil.
- [x] Confirmación al descartar cambios del modal y corrección del foco del teclado.
- [x] Importación individual de perfiles con validación del formato, versión, nombre, arrays y preferencias; los IDs repetidos se regeneran y el perfil se añade sin activarlo.
- [x] Diálogo visual de duplicación, con explicación de los datos que se copian y los que se dejan fuera.
- [x] Editor de perfiles con preferencias de planificación y Focus, incluso para perfiles inactivos.
- [x] Reorganización de Hoy: tareas del día, vencidas y completadas en bloques separados; progreso diario accesible.
- [ ] Tareas, Actividades, Calendario, Planificador, Objetivos e Insights requieren revisión visual final en Electron. En Focus, los controles principales de iniciar/pausar/descansar se movieron encima de las preferencias de sonido para evitar tener que desplazarse para iniciar una sesión.
- [x] Formularios de Tareas, Actividades y Objetivos movidos a diálogos contextuales; acciones primarias colocadas en sus encabezados.
- [x] Calendario e Insights agrupados en cuadrículas adaptables; Planificador dividido en agenda y panel de tareas por organizar.
- [x] Guardado fallido de tareas, actividades y objetivos conserva el formulario abierto y revierte el cambio en memoria.
- [ ] Pruebas manuales visuales en macOS Catalina y ventanas estrechas.
- [ ] Ampliar pruebas automatizadas de los recorridos de perfil.

La CI automatizada ejecutó `npm test` y `node --check` para los archivos indicados en `.github/workflows/tests.yml`. Esto no sustituye la prueba visual/manual de Electron.


## Segunda entrega de reorganización de interfaz

- [x] Tareas: creación y edición en diálogo contextual; la lista ya no queda separada del formulario largo.
- [x] Actividades: alta y edición en diálogo; el catálogo queda como contenido principal.
- [x] Objetivos: alta y edición en diálogo; el listado y el progreso quedan en primer plano.
- [x] Calendario: detalle del día al lado de la cuadrícula en escritorio y debajo en ventanas estrechas.
- [x] Insights: métricas y gráficos agrupados en una cuadrícula de dos columnas adaptable.
- [x] Planificador: agenda, tareas sin asignar y reserva de bloque organizadas en columnas relacionadas.
- [x] Formularios de tareas, actividades y objetivos conservan su contenido en pantalla si falla el guardado; se restaura el estado anterior.
- [x] La acción global «Nueva tarea» se limita a Hoy; Tareas tiene su propio botón contextual.
- [x] Reorganizar visualmente la vista Hoy y separar las tareas completadas de las pendientes.
- [ ] Revisar jerarquía y estados de Focus en una ejecución visual de Electron.
- [ ] Pruebas visuales en Electron sobre macOS Catalina, distintas anchuras y alturas.
- [ ] Pruebas manuales de recorridos completos y regresión de las vistas existentes.
