# Especificación inicial — Planificador de ideas

**Prioridad:** Muy alta. Es la siguiente gran función que se recomienda desarrollar en O-Isym.

## Propósito

Un espacio visual para capturar, organizar y relacionar ideas de O-Isym. Debe servir tanto para pensar libremente como para convertir ideas en un plan de desarrollo comprensible.

## Experiencia principal

- Varios tableros con nombre y descripción.
- Área de trabajo amplia con desplazamiento y zoom.
- Tarjetas de texto movibles.
- Conectores entre tarjetas, con posibilidad de indicar dirección o relación.
- Categorías y colores configurables.
- Agrupación visual de tarjetas.
- Selección, edición, duplicación y eliminación.
- Búsqueda entre ideas.
- Guardado automático.
- Exportar e importar archivos `.oisym`.

## Tipos de elemento iniciales

1. **Nota:** texto libre para una idea, pregunta o recordatorio.
2. **Grupo:** contenedor visual para reunir notas relacionadas.
3. **Conexión:** relación entre dos elementos; puede tener etiqueta.

Se pueden añadir más tipos después, sin complicar la primera versión.

## Requisitos de interacción

- Mover tarjetas sin mover accidentalmente el tablero.
- Desplazar el tablero y acercar/alejar la vista con controles claros.
- Editar texto de manera sencilla.
- Seleccionar uno o varios elementos si no complica la primera versión.
- Crear y eliminar conexiones de forma predecible.
- Mostrar una señal discreta cuando existan cambios pendientes de guardar.
- Permitir deshacer acciones importantes si la arquitectura lo permite.

## Guardado y seguridad

- Los datos deben persistir al cerrar y volver a abrir O-Isym.
- El guardado debe ser independiente de la exportación: el archivo `.oisym` es un formato de intercambio y respaldo.
- No perder el último estado válido ante un fallo de escritura.
- Crear respaldo antes de operaciones destructivas o importaciones que puedan reemplazar datos.
- No sobrescribir tableros durante una importación sin mostrar primero qué se va a incorporar.

## Archivo `.oisym`

La especificación de datos está en [OISYM-FILE-FORMAT.md](OISYM-FILE-FORMAT.md). Debe permitir que otra herramienta —incluido ChatGPT— pueda interpretar tableros, notas, categorías y conexiones sin necesitar la base de datos interna de la aplicación.

## Primera versión sugerida

Para evitar que el planificador se vuelva demasiado grande desde el principio, la primera versión puede limitarse a:

- Crear y renombrar tableros.
- Crear, editar, mover y borrar notas.
- Conectar notas.
- Cambiar color o categoría.
- Guardado automático.
- Exportar e importar `.oisym`.

Los grupos avanzados, historial completo, colaboración y funciones inteligentes pueden esperar.
