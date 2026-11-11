# Sistema de apariencia de O-Isym

**Rama:** `development`  
**Alcance:** personalización por perfil sin modificar el esquema de datos 1, Focus, Pizarrones ni calendario.

## Funcionamiento

La sección **Ajustes → Apariencia** permite seleccionar:

- **Modo:** Claro, Oscuro o Automático. Automático sigue la preferencia de color de macOS mientras O-Isym permanece abierto.
- **18 paletas:** Bosque, Océano, Medianoche, Aurora, Orquídea, Lavanda, Rosa, Cobre, Arena, Lima, Pizarra, Grafito, Cobalto, Salvia, Coral, Ámbar, Ciruela y Glaciar. Cada una puede elegirse por separado en Claro y Oscuro.
- **8 canales de colores por modo:** Acento, Fondo, Tarjetas, Menú lateral, Campos, Texto, Bordes y Texto secundario. Cada campo se activa de forma independiente y conserva su elección tanto en Claro como en Oscuro. Los controles ajustan automáticamente el contraste de los textos sobre el menú y los campos.
- **Previsualización y aplicación inmediata:** las dieciocho opciones muestran miniaturas y hay una vista previa de menú, tarjeta, botón y campo de búsqueda. El selector «Personalizar Claro / Oscuro» permite preparar incluso el modo que todavía no está activo. Los cambios del modo activo se reflejan inmediatamente.
- **Guardado automático:** los cambios se agrupan durante unos 360 ms para evitar escrituras excesivas. La interfaz informa si se están guardando o ya se guardaron. No existe un botón de guardar apariencia. Al cambiar de sección o perfil, o al cerrar O-Isym, se fuerzan las escrituras pendientes. Si falla una escritura, solo se revierten las preferencias visuales al último estado guardado, sin revertir las tareas ni los pizarrones.
- **Restablecer colores de este modo:** recupera la paleta y los colores sugeridos únicamente para Claro u Oscuro, sin sobrescribir el otro modo. El guardado sigue siendo automático.
- **Distribución:** espaciado Cómodo o Compacto y esquinas Suaves, Redondeadas o Rectas, guardados por perfil.
- **Fuente de iconos:** vectoriales creados para la UI, imágenes PNG originales de `assets/icons` o sin iconos, siempre conservando las etiquetas de navegación y los textos de los botones.
- **Estilo vectorial:** línea fina, gruesa, bicolor suave o con relleno.
- **Color de los iconos:** automático, acento del perfil o un color elegido por el usuario, con colores distintos para Claro y Oscuro. También se puede elegir un fondo suave o intenso y personalizar el color de ese fondo para cada modo.
- **Tarjetas:** estilo con profundidad y sombra, suave o con contornos definidos. «Completadas hoy» agrupa las tareas en filas diferenciadas y la invitación de Focus presenta un encabezado y superficie consistentes con la paleta.
- **Cambio sin reconstruir formularios:** al alternar PNG/vectorial/sin iconos solo se sustituyen los recursos visuales, sin vaciar un campo en edición ni modificar las tareas o los pizarrones.

Los cambios se aplican al **perfil activo**. Cambiar de perfil recupera su propia apariencia. Duplicar configuración copia las preferencias visuales. Los perfiles anteriores conservan el esquema actual y reciben valores seguros sin cambiar sus tareas.

## Arquitectura

- `src/appearance.js`: resolución de colores para Claro y Oscuro, superficies, menú, campos, contraste y preferencias de distribución; sin dependencia de Electron.
- `src/domain.js`: normaliza `preferences.appearanceMode`, `preferences.appearancePalette` y `preferences.appearanceColors`. Rechaza colores que no sean `#RRGGBB` al importar.
- `src/app.js`: actualiza inmediatamente las variables CSS y gestiona los cambios con una cola de escritura aplazada y recuperación de apariencia. Las operaciones existentes de Focus, Pizarrones y perfiles se mantienen.
- `src/styles/appearance.css`: estilos coherentes para cada superficie; los campos y su contenedor comparten el mismo color, incluida la búsqueda de pizarrones. Los nodos de ideas mantienen sus colores propios.
- `src/icons.js`: iconos SVG con trazo adaptable a cada tema. La interfaz permite usarlos o volver a los PNG sin modificar los archivos originales; hay un modo sin iconos y un respaldo visible cuando un recurso no carga.
- `index.html`: carga apariencia e iconos antes de la aplicación, y los estilos de apariencia después de los estilos base.
- `tests/appearance.test.js`: comprueba las dieciocho paletas, ambas variantes por perfil, contraste en menú y buscadores, migración de perfiles antiguos e importación.
- `tests/planning-ui.test.js`: comprueba aplicación inmediata en toda la ventana, guardado automático, vaciado pendiente en navegación, reversión segura, cambios de macOS y regresiones de Focus/Pizarrones.
- `tests/icon-assets.test.js`: comprueba archivos de iconos y avatares PNG, así como referencias de recursos. Si falla un recurso de icono durante la ejecución se muestra un símbolo accesible en vez de eliminarlo.

### Datos por perfil

```json
{
  "preferences": {
    "appearanceMode": "system",
    "appearancePalette": "ocean",
    "appearancePalettes": {
      "light": "rose",
      "dark": "midnight"
    },
    "appearanceColorsByMode": {
      "light": {
        "accent": "", "page": "", "surface": "", "text": "",
        "sidebar": "", "field": "", "border": "", "muted": ""
      },
      "dark": {
        "accent": "", "page": "", "surface": "", "text": "",
        "sidebar": "", "field": "", "border": "", "muted": ""
      }
    },
    "appearanceDensity": "comfortable",
    "appearanceRadius": "soft",
    "appearanceIconMode": "vector",
    "appearanceIconVariant": "outline",
    "appearanceIconTone": "automatic",
    "appearanceIconBackground": "none",
    "appearanceIconColorsByMode": { "light": "", "dark": "" },
    "appearanceIconBackgroundColorsByMode": { "light": "", "dark": "" },
    "appearanceCardStyle": "elevated"
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
