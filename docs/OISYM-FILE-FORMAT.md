# Formato de archivo O-Isym (.oisym)

**Estado:** propuesta inicial para el Planificador de ideas.  
**Extensión:** `.oisym`  
**Representación interna:** JSON UTF-8.

## Objetivo

Un archivo portátil que contenga metadatos de O-Isym y la organización de ideas del usuario. Debe poder exportarse desde la aplicación, compartirse y leerse fuera de ella —por ejemplo, por ChatGPT— sin acceder al almacenamiento interno de O-Isym.

## Reglas del formato

1. La extensión del archivo es `.oisym`, aunque su contenido sea JSON.
2. Todo archivo debe incluir `format` y `formatVersion`.
3. Los identificadores de tableros, elementos, categorías y conexiones deben ser estables y únicos dentro del archivo.
4. Las posiciones y dimensiones deben expresarse como números; el zoom debe ser un número positivo.
5. Las fechas deben usar ISO 8601 en UTC.
6. El contenido debe evitar rutas locales, identificadores del dispositivo, contraseñas, tokens y otros secretos.
7. Los lectores deben ignorar campos opcionales que no conozcan y conservarlos cuando sea posible al volver a guardar.
8. Los cambios incompatibles requieren incrementar la versión y documentar una migración.

## Estructura de nivel superior

| Campo | Tipo | Uso |
|---|---|---|
| `format` | string | Identificador fijo: `oisym` |
| `formatVersion` | string | Versión del esquema, inicialmente `1.0.0` |
| `createdAt` | string | Fecha de creación ISO 8601 |
| `modifiedAt` | string | Última modificación ISO 8601 |
| `project` | object | Metadatos generales del proyecto |
| `categories` | array | Categorías reutilizables |
| `boards` | array | Tableros y su contenido |

## Estructura de un tablero

Cada tablero contiene:

- `id`: identificador estable.
- `title`: nombre visible.
- `description`: descripción opcional.
- `createdAt` y `modifiedAt`: fechas ISO 8601.
- `viewport`: posición y zoom de la cámara.
- `nodes`: notas y grupos.
- `connections`: relaciones entre elementos.

### Tipos de nodo

- `note`: nota con texto.
- `group`: contenedor visual para organizar otros elementos.

Los nodos pueden incluir posición, tamaño, color, categoría y marcas de tiempo. Los grupos pueden contener referencias a los identificadores de los nodos que agrupan.

### Conexiones

Cada conexión identifica:

- `id`: identificador propio.
- `from`: ID del nodo de origen.
- `to`: ID del nodo de destino.
- `label`: etiqueta opcional.
- `style`: estilo visual opcional.

Una conexión no debe apuntar a un nodo inexistente.

## Ejemplo mínimo

```json
{
  "format": "oisym",
  "formatVersion": "1.0.0",
  "createdAt": "2026-11-06T12:00:00.000Z",
  "modifiedAt": "2026-11-06T12:00:00.000Z",
  "project": {
    "name": "O-Isym",
    "description": "Ideas y planificación del proyecto"
  },
  "categories": [],
  "boards": [
    {
      "id": "board-main",
      "title": "Ideas de O-Isym",
      "description": "",
      "createdAt": "2026-11-06T12:00:00.000Z",
      "modifiedAt": "2026-11-06T12:00:00.000Z",
      "viewport": {
        "x": 0,
        "y": 0,
        "zoom": 1
      },
      "nodes": [],
      "connections": []
    }
  ]
}
```

## Validación e importación

Al importar un archivo, O-Isym debe:

1. Comprobar que sea JSON válido.
2. Comprobar `format === "oisym"` y reconocer `formatVersion`.
3. Validar campos obligatorios, tipos, IDs y referencias.
4. Rechazar o aislar conexiones que apunten a nodos inexistentes.
5. Mostrar un resumen de tableros y elementos antes de incorporarlos.
6. Evitar reemplazar tableros existentes sin una acción explícita.
7. Crear una copia de seguridad antes de cualquier operación que pueda modificar datos existentes.

Si la versión es más nueva que la que entiende la aplicación, no debe importarse de forma destructiva. Debe conservarse el archivo original y explicar que esa versión todavía no es compatible.

## Lectura por herramientas externas

Un lector externo puede usar `format`, `formatVersion`, `project`, `boards`, `nodes` y `connections` para reconstruir el mapa de ideas. Los nombres de campos deben mantenerse estables y documentados.

## Evolución

- `1.0.0`: primera estructura documentada.
- Cambios compatibles pueden incrementar la versión menor.
- Cambios incompatibles requieren una versión mayor y una estrategia de migración.

La especificación puede ampliarse cuando el Planificador de ideas tenga un diseño técnico definitivo.
