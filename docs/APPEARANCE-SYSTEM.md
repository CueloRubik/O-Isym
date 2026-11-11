# Sistema de apariencia de O-Isym

**Rama:** `development`  
**Alcance:** personalización por perfil sin modificar el esquema de datos 1, Focus, Pizarrones ni calendario.

## Funcionamiento

La sección **Ajustes → Apariencia** permite seleccionar:

- **Modo:** Claro, Oscuro o Automático. Automático sigue la preferencia de color de macOS mientras O-Isym permanece abierto.
- **12 paletas:** Bosque, Océano, Medianoche, Aurora, Orquídea, Lavanda, Rosa, Cobre, Arena, Lima, Pizarra y Grafito. Todas disponen de alternativas claras y oscuras.
- **4 colores configurables:** Acento, Fondo, Paneles y Texto. Cada campo se activa independientemente; los demás siguen los valores calculados de la paleta.
- **Previsualización real y aplicación inmediata:** las doce opciones muestran miniaturas de una ventana de O-Isym. Al elegir una paleta o modificar un color, toda la aplicación cambia de inmediato y también se actualiza la vista de ejemplo.
- **Guardado automático:** los cambios se agrupan durante unos 360 ms para evitar escrituras excesivas. La interfaz informa si se están guardando o ya se guardaron. No existe un botón de guardar apariencia. Al cambiar de sección o perfil, o al cerrar O-Isym, se fuerzan las escrituras pendientes. Si falla una escritura, solo se revierten las preferencias visuales al último estado guardado, sin revertir las tareas ni los pizarrones.
- **Restablecer colores originales:** recupera al instante el esquema y la paleta sugeridos para ese perfil, también con guardado automático.

Los cambios se aplican al **perfil activo**. Cambiar de perfil recupera su propia apariencia. Duplicar configuración copia las preferencias visuales. Los perfiles anteriores conservan el esquema actual y reciben valores seguros sin cambiar sus tareas.

## Arquitectura

- `src/appearance.js`: paletas, resolución de esquema, mezcla de colores y contraste. Es un módulo puro; no importa Electron ni accede al almacenamiento.
- `src/domain.js`: normaliza `preferences.appearanceMode`, `preferences.appearancePalette` y `preferences.appearanceColors`. Rechaza colores que no sean `#RRGGBB` al importar.
- `src/app.js`: actualiza inmediatamente las variables CSS y gestiona los cambios con una cola de escritura aplazada y recuperación de apariencia. Las operaciones existentes de Focus, Pizarrones y perfiles se mantienen.
- `src/styles/appearance.css`: utiliza variables comunes para ventanas, menús, paneles, formularios, tarjetas, Calendario y elementos de Focus. No recolorea las notas y conexiones del contenido de un pizarrón.
- `index.html`: carga el módulo de apariencia antes de la aplicación y los estilos después de los estilos base.
- `tests/appearance.test.js`: comprueba las doce paletas, ambos esquemas, contraste, migración, importación y aislamiento.
- `tests/planning-ui.test.js`: comprueba aplicación inmediata en toda la ventana, guardado automático, vaciado pendiente en navegación, reversión segura, cambios de macOS y regresiones de Focus/Pizarrones.
- `tests/icon-assets.test.js`: comprueba archivos de iconos y avatares PNG, así como referencias de recursos. Si falla un recurso de icono durante la ejecución se muestra un símbolo accesible en vez de eliminarlo.

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
