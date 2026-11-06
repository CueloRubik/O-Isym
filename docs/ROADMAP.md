# O-Isym — Hoja de ruta e ideas

> Documento vivo. Recoge las ideas que hemos definido hasta ahora; no representa fechas prometidas ni obliga a convertir cada idea en una función.

## Dirección del proyecto

O-Isym es, por ahora, un proyecto personal que crecerá a su propio ritmo. La prioridad es construir algo útil, estable y agradable de usar, sin presión por publicarlo ni monetizarlo.

### Principios que guían las decisiones

- **Primero la utilidad y la calidad.** Añadir funciones cuando resuelvan una necesidad real.
- **Local-first.** Siempre que sea razonable, tareas, calendarios, tableros, actividades y ajustes deben funcionar localmente, sin depender de servidores.
- **Cuidar los datos.** Las actualizaciones no deben borrar información. Antes de reemplazar datos ante un error, crear una copia de seguridad y pedir confirmación. Distinguir errores de programación de daños reales en el almacenamiento.
- **Compatibilidad real.** Las funciones deben probarse en macOS y Windows; no asumir que una solución específica de un sistema funciona en el otro.
- **Evitar dependencias innecesarias.** Preferir soluciones gratuitas y locales. Incorporar servicios, IA, sincronización o servidores solo si aportan valor claro y se puede asumir su coste.
- **Sin calendario comercial por ahora.** Compartir el proyecto o buscar ingresos es una posibilidad futura, no un objetivo actual.

## Prioridades

| Orden | Área | Prioridad | Objetivo |
|---|---|---|---|
| 1 | Planificador de ideas | **Muy alta — siguiente gran función** | Capturar, visualizar, conectar y exportar ideas de O-Isym |
| 2 | Compatibilidad Windows | Alta — después del planificador | Revisar y corregir diferencias entre Windows y macOS |
| 3 | Productividad y calendario | Media-alta | Mejorar la planificación diaria y la conexión entre herramientas |
| 4 | Isym Kids | Largo plazo | Crear una experiencia sencilla y configurable para niños, con perfiles de tutor |
| 5 | Miniacademia y herramientas educativas | Largo plazo | Ampliar Isym Kids con actividades, aprendizaje y organización familiar |

---

## 1. Planificador de ideas — prioridad inmediata

Crear dentro de O-Isym un espacio visual para organizar ideas del proyecto y tenerlas disponibles mientras se desarrolla.

### Funciones previstas

- Crear varios tableros independientes.
- Añadir notas o tarjetas de texto libre.
- Mover, seleccionar, editar, duplicar y eliminar elementos.
- Conectar notas con líneas o flechas para representar relaciones y secuencias.
- Agrupar elementos y organizarlos por categorías.
- Asignar colores para distinguir temas, estados o tipos de idea.
- Desplazarse por el tablero y acercar o alejar la vista sin perder la organización.
- Guardado automático y persistente.
- Buscar ideas y localizar tableros.
- Exportar e importar tableros en archivos **`.oisym`**.

### Formato de intercambio `.oisym`

El archivo será JSON estructurado con una extensión propia. Debe incluir una versión de formato, metadatos del proyecto, tableros, nodos, categorías y conexiones. La especificación está en [OISYM-FILE-FORMAT.md](OISYM-FILE-FORMAT.md).

El objetivo es que el usuario pueda compartir un archivo `.oisym` conmigo y yo pueda leer la estructura y comprender cómo están organizadas sus ideas. El formato debe ser legible, documentado y ampliable.

### Criterios importantes

- El archivo exportado debe contener la información del tablero, no datos privados del equipo ni rutas locales.
- Importar debe permitir revisar el contenido antes de incorporarlo.
- Una importación no debe sobrescribir tableros existentes silenciosamente.
- Los cambios de formato deben tener migraciones por versión.
- Un fallo al guardar no debe borrar la última copia válida.

## 2. Compatibilidad y estabilidad en Windows

Después del planificador, hacer una revisión ordenada de la aplicación en Windows.

- Probar cada sección y cada botón, no solo comprobar que la ventana abre.
- Revisar rutas de archivos, almacenamiento persistente, diálogos, notificaciones, alarmas, sonidos, temporizadores y apertura de ventanas.
- Identificar código o APIs exclusivos de macOS y proporcionar alternativas para Windows.
- Revisar diferencias de rutas, separadores, permisos y comportamiento de Electron.
- Comprobar instalación, inicio, cierre, actualización y persistencia de datos.
- Mantener el comportamiento equivalente en macOS y Windows cuando sea posible.
- Documentar las excepciones inevitables.

No reemplazar funciones existentes ni datos de usuario para resolver errores sin respaldo y confirmación.

## 3. Mejoras de productividad

### Planificación diaria

- Permitir crear, editar, completar y eliminar tareas con facilidad.
- Añadir plantillas de planificación para distintos tipos de día.
- Ofrecer, de manera configurable, cargar o revisar el plan del día al iniciar la jornada.
- Facilitar la organización de tareas por prioridad, fecha o categoría.

### Calendario

- Mejorar las vistas y la navegación del calendario.
- Hacer más clara la relación entre tareas, eventos y objetivos.
- Facilitar la creación y edición de elementos desde el calendario.
- Mantener sincronizados los cambios entre las secciones relacionadas.

### Enfoque y ventanas conectadas

- Mejorar la integración entre Focus, tareas y calendario.
- Permitir que una sesión de enfoque se relacione con una tarea o actividad.
- Revisar la comunicación entre ventanas y secciones para evitar estados desactualizados.
- Completar los ajustes para que las funciones se puedan configurar sin complicaciones.

## 4. Isym Kids — proyecto separado a largo plazo

Explorar una experiencia distinta de O-Isym para niños. Puede compartir infraestructura con O-Isym en el futuro, pero debe tener una interfaz propia, más sencilla y configurable.

### Perfiles y acompañamiento

- Perfil infantil con interfaz simple y opciones adaptadas a la edad.
- Perfil de padre, madre, tutor o docente para configurar actividades y acompañar el progreso.
- Controles claros sobre qué puede ver y modificar cada perfil.
- Privacidad y protección de la información infantil desde el diseño.

### Motivación saludable

Inspirarse en elementos atractivos de aplicaciones educativas —progreso visible, pequeñas metas, recompensas opcionales y actividades breves— sin convertirlos en presión.

- Evitar castigos por perder rachas, presión constante, comparaciones públicas o mecanismos que generen ansiedad.
- Los descansos deben estar disponibles por bienestar, no ser algo que el niño tenga que ganarse.
- Las recompensas deben ser flexibles y opcionales.
- Favorecer la autonomía, la curiosidad y el aprendizaje real.

### Creador de actividades

Una herramienta para que el tutor pueda crear y editar actividades con:

- Preguntas y respuestas.
- Opción múltiple.
- Respuesta escrita.
- Verdadero o falso.
- Relacionar elementos.
- Ordenar elementos.
- Imágenes, pistas y explicaciones.
- Configuración de dificultad y cantidad de preguntas.

### Brain Start

Una actividad corta de calentamiento mental que pueda incluir:

- Adivinanzas.
- Cálculo mental.
- Patrones y secuencias.
- Memoria.
- Reconocimiento y razonamiento.

Debe ser breve, variada y sin penalizar al niño por equivocarse o no participar.

## 5. Miniacademia y organización familiar — visión lejana

Una posible expansión educativa inspirada en plataformas como Khan Academy, combinada con herramientas para organizar el aprendizaje y la vida familiar.

Ideas iniciales:

- Biblioteca de actividades y contenidos educativos.
- Recorridos de aprendizaje por temas.
- Vídeos educativos, si en el futuro existe una forma sostenible de ofrecerlos.
- Organización de días familiares y horarios de estudio.
- Herramientas para familias que educan en casa.
- Apoyo para padres y tutores que necesitan preparar y organizar actividades con poco tiempo.

Esta etapa depende de que Isym Kids tenga una base útil y probada. No debe adelantarse al desarrollo del producto principal.

---

## Orden de trabajo recomendado

1. Definir y construir el Planificador de ideas, incluido el formato `.oisym`.
2. Probarlo y corregir cualquier problema de guardado, exportación e importación.
3. Auditar O-Isym en Windows y corregir incompatibilidades.
4. Mejorar la planificación diaria, el calendario y la integración con Focus.
5. Cuando O-Isym esté estable, explorar Isym Kids mediante prototipos pequeños.
6. Considerar la miniacademia solo después de validar las funciones educativas.

## Cómo mantener esta hoja de ruta

- Marcar una idea como terminada solo cuando esté implementada y probada.
- Separar ideas confirmadas de ideas exploratorias.
- Añadir nuevas propuestas sin obligarse a desarrollarlas.
- Actualizar prioridades cuando cambien las necesidades.
- Mantener esta hoja de ruta como referencia; los detalles técnicos de cada función pueden vivir en documentos o incidencias independientes.
