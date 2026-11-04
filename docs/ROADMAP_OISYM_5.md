# O-Isym 5 — Hoja de ruta y mejoras pendientes

Rama de trabajo: `oisym-5-development`. La rama `main` permanece intacta y separada.

## Estado general

**La versión actual para macOS ya está funcional y probada manualmente por el usuario.** Se han comprobado los flujos principales, la persistencia después de cerrar y volver a abrir, Focus, la revisión visual y la compilación real de la aplicación.

Por tanto, esas tareas dejan de figurar como pendientes. El trabajo restante corresponde a mejoras de producto, refinamiento de interfaz y pulido; no a completar desde cero la versión actual.

## Base ya construida

- Seguridad de Electron, preload, IPC y almacenamiento local JSON versionado con respaldos.
- Modelo de dominio para perfiles, actividades, tareas, objetivos y sesiones Focus.
- Interfaz principal, navegación, panel Hoy, calendario mensual/semanal y planificador 2.0.
- Catálogo de actividades, captura y edición de tareas, búsqueda, filtros y validaciones.
- Focus con sesiones asociadas o libres, avisos y recuperación.
- Objetivos, Insights y recomendaciones locales explicables.
- Perfiles personalizables, avatares, temas claros y preferencias de movimiento.
- Accesibilidad, atajos de teclado y adaptación a ventanas estrechas.
- Pruebas automatizadas existentes aprobadas en CI.
- Compilación macOS configurada con `app.icns` en la raíz y compilación real probada por el usuario.

## Prioridades de desarrollo

### P1 — Sistema de alarmas ampliado

Objetivo: convertir las alarmas de Focus en un sistema configurable, claro y consistente.

- [ ] Diseñar varios tipos de sonido/alarma, con identidad diferenciada y propósito claro.
- [ ] Permitir elegir el sonido de finalización de Focus.
- [ ] Permitir configurar por separado avisos de inicio, finalización y recordatorios, cuando corresponda.
- [ ] Añadir controles de volumen o intensidad si la plataforma lo permite.
- [ ] Incluir una vista previa para escuchar cada sonido antes de seleccionarlo.
- [ ] Guardar las preferencias sin afectar perfiles existentes.
- [ ] Definir comportamiento cuando la aplicación está minimizada, cerrada o el sistema está en reposo; documentar límites de macOS.

Criterio de aceptación: el usuario puede elegir y probar sus alarmas, guardar la configuración y comprobar que se respeta en sesiones posteriores.

### P2 — Reorganización de Ajustes

Objetivo: que cada configuración esté en su lugar y sea fácil de encontrar.

- [ ] Auditar todas las opciones actuales y agruparlas por tema.
- [ ] Crear secciones de Ajustes con navegación clara y títulos descriptivos.
- [ ] Separar, según el inventario real, preferencias generales, apariencia, perfiles, Focus/notificaciones y datos/respaldos.
- [ ] Mantener visibles los ajustes importantes sin saturar una sola pantalla.
- [ ] Añadir descripciones breves y controles coherentes.
- [ ] Revisar el diseño en ventanas estrechas y navegación por teclado.

Criterio de aceptación: cada opción tiene una ubicación lógica, se encuentra sin recorrer una pantalla interminable y conserva su comportamiento actual.

### P3 — Administración avanzada de perfiles

Objetivo: dar al usuario control completo sobre sus perfiles y su presentación.

- [ ] Diseñar una pantalla o panel de administración de perfiles.
- [ ] Permitir crear, editar y cambiar entre perfiles desde un flujo consistente.
- [ ] Implementar eliminación de perfiles con confirmación explícita.
- [ ] Explicar qué datos se eliminarán y proteger el perfil activo y el perfil principal frente a eliminaciones accidentales.
- [ ] Definir qué ocurre al intentar borrar el último perfil o el perfil principal.
- [ ] Mejorar la edición visual: avatar con vista previa, nombre, edad, tema, color y preferencias disponibles.
- [ ] Asegurar que los datos de cada perfil permanezcan aislados.
- [ ] Probar migración y compatibilidad con perfiles antiguos.

Criterio de aceptación: crear, editar, cambiar y eliminar perfiles funciona sin pérdida accidental de datos de otros perfiles y con confirmaciones comprensibles.

### P4 — Sistema de iconografía

Objetivo: dar a O-Isym un lenguaje visual consistente.

- [ ] Inventariar botones, secciones, categorías, acciones y estados que necesitan iconos.
- [ ] Elegir una sola familia o estilo visual coherente.
- [ ] Diseñar o seleccionar iconos para navegación, tareas, actividades, calendario, Focus, objetivos, Insights, perfiles y Ajustes.
- [ ] Añadir iconos a acciones frecuentes cuando ayuden a reconocerlas, sin llenar la interfaz de adornos.
- [ ] Definir tamaños, alineación, grosor y estados (normal, seleccionado, deshabilitado).
- [ ] Mantener etiquetas de texto o nombres accesibles; no depender únicamente del icono.
- [ ] Verificar contraste y legibilidad en los tres temas.

Criterio de aceptación: los iconos se sienten parte del mismo producto, son reconocibles y mejoran la orientación sin añadir ruido visual.

### P5 — Pulido general

- [ ] Revisar consistencia de márgenes, tamaños, tipografía, botones, formularios y diálogos.
- [ ] Unificar mensajes de confirmación, errores, estados vacíos y avisos.
- [ ] Revisar textos, nombres de opciones y explicaciones para que sean claros.
- [ ] Corregir detalles visuales o interacciones incómodas encontrados durante el uso diario.
- [ ] Comprobar navegación por teclado, foco visible y etiquetas accesibles después de cada cambio.
- [ ] Evitar animaciones innecesarias y respetar movimiento reducido.
- [ ] Revisar rendimiento y comportamiento con varios perfiles y conjuntos grandes de tareas.

Criterio de aceptación: la aplicación se siente coherente, predecible y cuidada en todas sus secciones.

## Pruebas y calidad

Las pruebas manuales de flujos completos, persistencia, Focus, revisión visual y compilación macOS ya fueron realizadas y confirmadas por el usuario. No se deben volver a marcar como pendientes sin un motivo concreto.

Las **pruebas de integración automatizadas** son una mejora de calidad: ejecutan automáticamente recorridos que conectan varias partes (por ejemplo, crear perfil → crear tarea → programarla → completar Focus → reiniciar y verificar datos). Pueden añadirse gradualmente para detectar regresiones futuras; no son un requisito para invalidar las pruebas manuales ya realizadas ni un bloqueo artificial para seguir desarrollando.

Después de cada prioridad, ejecutar la suite automatizada existente y hacer una comprobación manual enfocada en la función modificada.

## Orden recomendado

1. P1 — Alarmas ampliadas.
2. P2 — Ajustes reorganizados.
3. P3 — Administración de perfiles.
4. P4 — Iconografía.
5. P5 — Pulido general y revisión final.

Las prioridades pueden ajustarse si una decisión de diseño revela dependencias. No comenzar la adaptación Android hasta que el usuario considere cerrada la versión Mac.

## Arquitectura de referencia

- `electron/`: proceso principal, preload, IPC y almacenamiento.
- `src/domain.js`: creación, normalización, validación y reglas del dominio.
- `src/app.js`: navegación, vistas y acciones.
- `src/styles/app.css`: sistema visual.
- `tests/`: pruebas automatizadas.
- `assets/avatars/`: avatares de perfiles.
- `legacy/` y `src/scripts/`: referencia del prototipo; no cargar en la interfaz nueva.

## Decisiones de producto que se mantienen

- Interfaz luminosa, moderna y clara, con color intencional y sin gradientes decorativos.
- Personalización por perfil sin bloquear funciones.
- Actividades como definiciones reutilizables; tareas como instancias concretas.
- Calendario y planificador conectados a las mismas tareas.
- Los compromisos bloqueados nunca se reprograman automáticamente.
- Focus puede asociarse a una tarea o ser libre.
- Almacenamiento local, migración segura y respaldos.
- Electron 28.3.3 y compatibilidad con el Mac Intel de desarrollo.

## Publicación y ramas

- La rama de desarrollo sigue siendo `oisym-5-development`.
- No modificar ni fusionar a `main` sin autorización explícita del usuario.
- La versión actual ya cuenta con compilación macOS probada por el usuario.
- La decisión de declarar cerrada la versión Mac y preparar una publicación final se tomará después de completar las mejoras que el usuario considere necesarias.
