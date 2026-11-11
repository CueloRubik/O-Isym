# Sistema de apariencia de O-Isym

**Rama:** `development`  
**Alcance:** personalización por perfil sin modificar el esquema de datos 1, Focus, Pizarrones ni calendario.

## Funcionamiento

La sección **Ajustes → Apariencia** permite seleccionar:

- **Modo:** Claro, Oscuro o Automático. Automático sigue la preferencia de color de macOS mientras O-Isym permanece abierto.
- **12 paletas:** Bosque, Océano, Medianoche, Aurora, Orquídea, Lavanda, Rosa, Cobre, Arena, Lima, Pizarra y Grafito. Todas disponen de alternativas claras y oscuras.
- **4 colores configurables:** Acento, Fondo, Paneles y Texto. Cada campo se activa independientemente; los demás siguen los valores calculados de la paleta.
- **Vista previa:** el editor muestra el menú y una tarjeta con los colores nuevos antes de aplicarlos. Ningún cambio se guarda hasta pulsar Guardar apariencia.
- **Restablecer selección:** recupera los valores sugeridos del perfil en el formulario, sin sobrescribir datos hasta que el usuario decida guardar.

Los cambios se aplican al **perfil activo**. Cambiar de perfil recupera su propia apariencia. Duplicar configuración copia las preferencias visuales. Los perfiles anteriores conservan el esquema actual y reciben valores seguros sin cambiar sus tareas.

## Arquitectura

- `src/appearance.js`: paletas, resolución de esquema, mezcla de colores y contraste. Es un módulo puro; no importa Electron ni accede al almacenamiento.
- `src/domain.js`: normaliza `preferences.appearanceMode`, `preferences.appearancePalette` y `preferences.appearanceColors`. Rechaza colores que no sean `#RRGGBB` al importar.
- `src/app.js`: edita y previsualiza la apariencia, guarda mediante la cola actual con recuperación en caso de fallo y actualiza las variables CSS al cambiar de perfil o de modo del sistema.
- `src/styles/appearance.css`: utiliza variables comunes para ventanas, menús, paneles, formularios, tarjetas, Calendario y elementos de Focus. No recolorea las notas y conexiones del contenido de un pizarrón.
- `index.html`: carga el módulo de apariencia antes de la aplicación y los estilos después de los estilos base.
- `tests/appearance.test.js`: comprueba las doce paletas, ambos esquemas, contraste, migración, importación y aislamiento.
- `tests/planning-ui.test.js`: comprueba previsualización, guardado, restablecimiento, rollback y seguimiento de la preferencia del sistema.

### Datos por perfil

```json
{
  "preferences": {
    "appearanceMode": "system",
    "appearancePalette": "ocean",
    "appearanceColors": {
      "accent": "",
      "page": "",
      "surface": "",
      "text": ""
    }
  }
}
```

Una cadena vacía significa «calcular este color desde la paleta». Ninguna de estas claves contiene CSS arbitrario ni se aplica mediante HTML dinámico. `profile.color` sigue identificando el color del avatar y los campos `theme` históricos continúan disponibles para compatibilidad.

## Legibilidad y comportamiento seguro

El color del texto sobre botones de acento se selecciona entre negro y blanco para garantizar un contraste mínimo de **4,5:1** en los colores RGB admitidos. La función de cálculo compara el texto personalizado con el fondo del panel y utiliza un sustituto legible cuando la combinación no alcanza ese contraste; el valor que el usuario eligió permanece guardado, de modo que puede seguir editándolo.

No se cambia el contenido de archivos `.oisym`, el modelo de tareas ni las sesiones Focus. La apariencia no habilita comunicaciones con terceros. Reducir movimiento sigue siendo una preferencia independiente.

## Verificación antes de distribución

La CI de Node 18 comprueba el motor de apariencia y las regresiones de interfaz sobre Linux y un runner macOS moderno. Esta comprobación **no sustituye** la prueba manual sobre macOS Catalina 10.15.7. Antes de publicar un DMG conviene verificar el inicio en oscuro, cambio automático de macOS, cierre y reapertura, dos perfiles con esquemas diferentes, imágenes y lienzo de Pizarrones, Focus, avisos y distintas dimensiones de ventana.

No se modifica `main`, no se publica Release y no se altera la compilación de Windows en esta etapa.
