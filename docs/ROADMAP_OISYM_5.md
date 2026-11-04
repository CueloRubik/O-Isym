# O-Isym 5 — Plan maestro de construcción

> Rama de trabajo: `oisym-5-development`. La rama `main` se mantiene separada.
> La aplicación anterior se considera un prototipo heredado, no la arquitectura ni el diseño final.

## Visión del producto

O-Isym será un sistema personal de organización de la vida diaria, no solamente un calendario. Debe ayudar a decidir qué hacer, organizar actividades y tareas, proteger compromisos importantes, reservar tiempo de concentración y entender el progreso sin convertir cada día en una puntuación ni castigar el descanso.

## Decisiones de producto ya acordadas

- **Diseño:** propio, luminoso, claro, moderno y colorido con intención. Evitar interfaces genéricas, gradientes decorativos y una base oscura.
- **Perfiles:** un perfil principal y perfiles adicionales opcionales. Cada uno tendrá datos y preferencias independientes.
- **Actividades y tareas:** una actividad es una definición reutilizable; una tarea es una instancia concreta que se puede completar, posponer o programar.
- **Calendario:** integrado con tareas y actividades; no será una lista paralela de eventos.
- **Planificación:** manual, sugerida, automática o híbrida, configurable por perfil.
- **Protección de compromisos:** los elementos bloqueados nunca se moverán automáticamente. Los flexibles sí podrán recibir propuestas según las reglas del usuario.
- **Focus:** temporizador dentro de una tarea y espacio libre de concentración; ambos comparten historial.
- **Tecnología:** JavaScript y Electron 28.3.3, compatible con el entorno objetivo. Sin frameworks o dependencias pesadas salvo que exista una necesidad clara.
- **Datos:** almacenamiento local, versionado, separado por perfil, con escritura atómica y copias de seguridad.

## Reglas de construcción

1. No tratar el prototipo anterior como base de producto: solo rescatar ideas y, cuando corresponda, datos.
2. No crear pantallas decorativas ni controles que no funcionen.
3. Cada módulo debe tener interfaz, reglas, persistencia y estados de error antes de considerarse terminado.
4. Mantener una fuente de verdad compartida para tareas, actividades, bloques de calendario y sesiones.
5. Separar proceso Electron, interfaz, lógica de dominio y almacenamiento.
6. Validar toda entrada y construir contenido de usuario con APIs DOM seguras.
7. No migrar ni borrar datos antiguos hasta haberlos respaldado y verificado.
8. Cada etapa termina con pruebas automatizadas cuando sean viables y una comprobación manual en el Mac.
9. No avanzar si una comprobación importante de la etapa anterior falla.
10. Las sugerencias son explicables, editables y descartables; el sistema no impone una agenda.

## Arquitectura objetivo

```text
O-Isym/
├── electron/
│   ├── main.js
│   ├── preload.js
│   ├── ipc-handlers.js
│   └── storage.js
├── src/
│   ├── app/
│   │   ├── bootstrap.js
│   │   ├── navigation.js
│   │   └── state.js
│   ├── modules/
│   │   ├── profiles/
│   │   ├── activities/
│   │   ├── tasks/
│   │   ├── today/
│   │   ├── calendar/
│   │   ├── planner/
│   │   ├── focus/
│   │   ├── goals/
│   │   ├── insights/
│   │   └── settings/
│   ├── services/
│   │   ├── scheduling/
│   │   ├── recommendations/
│   │   └── statistics/
│   ├── components/
│   ├── styles/
│   └── views/
├── tests/
├── docs/
└── legacy/
    └── prototype/
```

No se crearán carpetas vacías solo para aparentar avance. Se añadirán cuando cada módulo empiece a implementarse.

## Modelo de datos previsto

- **Profile:** identificador, nombre visible, color de acento, preferencias y modo de autonomía.
- **Activity:** definición reutilizable, categoría, duración orientativa, frecuencia y preferencias.
- **Task:** instancia concreta, título, estado, prioridad, duración estimada, fechas y vínculo opcional con Activity.
- **ScheduleBlock:** ubicación temporal de una tarea o compromiso; indica flexibilidad y bloqueo.
- **Goal:** objetivo con periodo, progreso y relaciones opcionales.
- **FocusSession:** inicio, fin, pausas, duración real y vínculo opcional a tarea.
- **DailyRecord:** resumen derivado de eventos reales, no una puntuación punitiva.
- **Recommendation:** propuesta con explicación, motivo, impacto y opción de ignorar.

Todos los registros tendrán identificadores estables y fechas ISO. Los datos personales estarán aislados por perfil. Las estadísticas se calcularán desde el historial cuando sea posible.

## Etapas de construcción

### Paso 0 — Separar el prototipo del producto
- Congelar la lógica del prototipo: no añadirle nuevos módulos.
- Registrar qué partes existen, cuáles son defectuosas y qué datos antiguos pueden recuperarse.
- Mantener el prototipo disponible mientras se construye la nueva base.
- No borrar `localStorage` ni cambiar su origen hasta tener una migración verificada.

**Resultado:** sabemos qué se conserva como referencia y qué se reconstruye.

### Paso 1 — Fundamentos técnicos y almacenamiento
- Separar de forma segura el proceso principal de Electron y el renderer.
- Desactivar Node Integration en la interfaz y activar Context Isolation y sandbox.
- Exponer únicamente operaciones IPC concretas desde `preload`; validar el emisor de cada llamada.
- Crear almacenamiento JSON local con esquema versionado, validación, escritura atómica y copias de seguridad rotativas.
- Proteger archivos dañados: nunca sobrescribirlos silenciosamente.
- Añadir pruebas automatizadas para inicialización, guardado, lectura, validación y protección de datos.
- Mantener temporalmente la interfaz heredada, sin ampliarla, mientras se construye la nueva.

**Resultado:** una base segura y comprobable sobre la que construir el producto. No se considera terminada hasta pasar las pruebas y la comprobación manual.

### Paso 2 — Modelo de dominio y perfiles
- Definir validadores y operaciones para perfiles.
- Crear el perfil principal y permitir perfiles adicionales.
- Aislar todos los datos por perfil.
- Crear selector, edición y preferencias iniciales.
- Preparar importación de datos antiguos con vista previa, respaldo y confirmación.

**Resultado:** perfiles reales, persistentes y aislados.

### Paso 3 — Sistema visual y navegación
- Definir colores, tipografía, espaciado, superficies, estados y componentes.
- Crear navegación estable y adaptable al tamaño de ventana.
- Diseñar la identidad visual final y estados vacíos útiles.
- Sustituir la interfaz heredada por la nueva estructura, sin romper la persistencia.

**Resultado:** una aplicación coherente y navegable, todavía sin módulos incompletos.

### Paso 4 — Actividades
- Catálogo organizado por categorías.
- Crear, editar, archivar, restaurar y reutilizar actividades.
- Definir duración orientativa, frecuencia y preferencias.
- Búsqueda y filtros útiles.

**Resultado:** catálogo funcional y persistente.

### Paso 5 — Tareas y captura rápida
- Crear tareas desde una actividad o desde cero.
- Editar, completar, reabrir, posponer y archivar.
- Prioridad, duración estimada, fecha y notas.
- Captura rápida accesible desde las áreas principales.

**Resultado:** una única fuente de verdad para todas las tareas.

### Paso 6 — Hoy
- Resumen de la fecha actual.
- Próximas tareas y pendientes.
- Progreso claro, tiempo reservado y espacio libre.
- Acciones rápidas conectadas al modelo real.

**Resultado:** panel principal útil desde el primer uso.

### Paso 7 — Calendario
- Vistas diaria, semanal y mensual.
- Tareas y compromisos representados desde el mismo modelo.
- Navegación por fechas y filtros.
- Crear o editar elementos desde el calendario.

**Resultado:** calendario integrado, no duplicado.

### Paso 8 — Planificador
- Bloques flexibles y compromisos bloqueados.
- Detección de solapamientos y carga excesiva.
- Reprogramación manual.
- Propuestas automáticas explicables y confirmables.
- Ningún compromiso bloqueado se mueve sin autorización.

**Resultado:** planificación fiable y bajo control del usuario.

### Paso 9 — Focus
- Temporizador configurable y sesión libre.
- Sesiones asociadas a tareas.
- Pausa, reanudación y recuperación tras suspender o cerrar.
- Historial y duración real.

**Resultado:** concentración e historial consistentes.

### Paso 10 — Objetivos e Insights
- Objetivos por periodo.
- Seguimiento de progreso.
- Historial, tendencias y estadísticas comprensibles.
- Revisión semanal y descansos sin penalizaciones artificiales.

**Resultado:** información útil para reflexionar y ajustar planes.

### Paso 11 — Recomendaciones y autonomía
- Motor local de reglas.
- Explicación de cada sugerencia.
- Modos manual, sugerido, automático e híbrido.
- Reglas de flexibilidad, prioridades y protección de compromisos.
- Revertir o ignorar cambios fácilmente.

**Resultado:** asistencia predecible, configurable y no invasiva.

### Paso 12 — Calidad y publicación
- Pruebas de integración y persistencia.
- Accesibilidad y navegación por teclado.
- Manejo de errores y recuperación.
- Rendimiento y compatibilidad del entorno objetivo.
- Copias de seguridad, restauración y guía de actualización.
- Empaquetado de la aplicación.

**Resultado:** versión candidata para uso cotidiano.

## Criterio de aceptación de cada paso

Un paso se considera terminado únicamente cuando:
- Las acciones visibles funcionan de principio a fin.
- Los datos sobreviven al cierre y reapertura.
- Los errores previsibles se muestran sin perder información.
- Las pruebas automatizadas relevantes pasan.
- La comprobación manual en el Mac está documentada.
- No se rompe ninguna función que ya se haya aceptado como terminada.

## Estado actual

- **Paso 0:** completado a nivel de inventario inicial. El prototipo sigue presente y se conserva como referencia.
- **Paso 1:** en implementación. La capa segura de Electron y el servicio de almacenamiento ya están añadidos; falta ejecutar las pruebas y validar en el Mac.
- **Pasos 2–12:** pendientes.

La interfaz actual sigue siendo la del prototipo. No debe confundirse con el diseño final de O-Isym 5.
