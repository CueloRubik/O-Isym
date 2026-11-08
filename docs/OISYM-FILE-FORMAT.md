# Formato de archivo O-Isym (.oisym)

Versión inicial: `1.0.0`.

Un archivo `.oisym` contiene un único pizarrón. Se serializa como JSON UTF-8 y no contiene rutas locales, identificadores de perfil, preferencias del dispositivo ni datos ajenos al pizarrón.

## Estructura

```json
{
  "format": "oisym",
  "formatVersion": "1.0.0",
  "exportedAt": "2026-11-06T12:00:00.000Z",
  "board": {
    "id": "board-example",
    "title": "Mi pizarrón",
    "description": "",
    "createdAt": "2026-11-06T12:00:00.000Z",
    "modifiedAt": "2026-11-06T12:00:00.000Z",
    "viewport": { "x": 0, "y": 0, "zoom": 1 },
    "nodes": [],
    "connections": []
  }
}
```

La estructura interna de `board`, `nodes` y `connections` sigue las reglas de `validateIdeaBoard` en `src/domain.js`. Los tipos de nodo iniciales son `note`, `activity` y `group`.

## Límites de importación

- Tamaño máximo por archivo: 10 MB.
- Importación por lote: hasta 20 archivos y 20 MB combinados por operación.
- Máximo 2.000 elementos por pizarrón.
- Máximo 5.000 conexiones.
- Máximo 100 pizarrones por perfil.
- Coordenadas dentro de ±1.000.000 y zoom entre 0.1 y 4.
- IDs únicos; referencias de grupos y conexiones deben apuntar a elementos existentes.
- Fechas, colores, estados, prioridades y dimensiones deben superar la validación del dominio.

## Reglas de importación y exportación

- La exportación conserva el contenido del pizarrón, no datos del dispositivo.
- La exportación valida el pizarrón antes de serializarlo y genera JSON UTF-8 con nombre de archivo seguro.
- La fecha `exportedAt`, cuando está presente, debe ser una fecha reconocible.
- La importación valida todos los archivos seleccionados antes de cambiar el perfil; si uno falla, no se importa ninguno.
- Se pueden seleccionar varios archivos en una misma operación, respetando los límites de cantidad y tamaño combinado.
- Cada pizarrón importado recibe un ID nuevo; también se regeneran IDs de elementos y conexiones y se actualizan las referencias internas.
- Si ya existe un pizarrón con el mismo nombre, se añade un sufijo para evitar colisiones.
- La importación siempre añade un pizarrón nuevo; nunca reemplaza uno existente.
- Se muestra un resumen de cada pizarrón y se solicita una única confirmación antes de guardar el lote.
- La operación guarda todos los pizarrones juntos; si el guardado falla, se restaura el perfil anterior.
- Una versión desconocida o estructura inválida se rechaza sin modificar los datos actuales.

## Compatibilidad futura

Los cambios incompatibles de estructura requieren una nueva versión de formato y una estrategia explícita de migración. No se debe interpretar una versión desconocida como si fuera `1.0.0`.
