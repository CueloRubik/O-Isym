# O-Isym 1.0.0 — Plan de desarrollo

> Documento de trabajo. La rama `oisym-5-development` parte de `main`; la versión principal se conserva intacta.

## Objetivo

Convertir O-Isym en un sistema personal de organización de la vida diaria: actividades, tareas, calendario, planificación flexible, concentración, objetivos y seguimiento. Debe sentirse rápido, claro y agradable, sin convertir la organización en una obligación rígida.

## Decisiones ya establecidas

- **Identidad:** Personal Life System; no es solamente un calendario.
- **Diseño:** visual personalizado, limpio, moderno y luminoso; colores con intención, sin estética genérica ni fondos oscuros como base.
- **Perfiles:** un perfil principal y perfiles adicionales opcionales, con datos y preferencias separados.
- **Calendario:** integrado con tareas y actividades.
- **Autonomía:** manual, automática o híbrida, configurable. Las citas y compromisos bloqueados no se mueven sin autorización.
- **Creación:** catálogo de actividades reutilizables y tareas personalizadas.
- **Focus:** temporizador dentro de una actividad y espacio de concentración independiente; ambos comparten historial y estadísticas.
- **Primera versión técnica:** conservar Electron 28 y JavaScript; persistencia local sencilla y versionada. No añadir dependencias nativas sin una razón demostrable.

## Principios de trabajo

1. Trabajar en etapas pequeñas y comprobables; no reemplazar toda la aplicación de una vez.
2. Mantener `main` intacta y desarrollar exclusivamente en esta rama.
3. Antes de cambiar una función, entender cómo funciona y qué otras partes dependen de ella.
4. Mantener una sola fuente de verdad para tareas, actividades, calendario e historial.
5. Separar interfaz, lógica de negocio y almacenamiento.
6. Validar entradas del usuario y evitar insertar texto sin escapar mediante `innerHTML`.
7. Guardar datos de forma segura, con versión de esquema, copias de respaldo y escritura resistente a interrupciones.
8. Cada etapa debe incluir una comprobación manual concreta y, cuando sea viable, pruebas automatizadas.
9. No añadir funciones decorativas que compliquen el uso. Cada módulo debe resolver una necesidad real.
10. Las recomendaciones ayudan; no imponen horarios ni penalizan al usuario por descansar o cambiar de plan.

## Arquitectura objetivo

La arquitectura se introducirá gradualmente. No se crearán carpetas vacías por adelantado ni se moverán todos los archivos en un solo cambio.

```text
O-Isym/
  electron/
    main.js
    preload.js
    ipc-handlers.js
  src/
    app/
      bootstrap.js
      navigation.js
      state.js
    modules/
      profiles/
      activities/
      today/
      calendar/
      planner/
      focus/
      goals/
      insights/
      settings/
    services/
      storage/
      scheduling/
      recommendations/
      statistics/
    components/
      navigation/
      buttons/
      cards/
      dialogs/
      forms/
    styles/
      tokens.css
      layout.css
      components.css
    views/
      onboarding/
      profile-selector/
      today/
      activities/
      calendar/
      focus/
      goals/
      insights/
      settings/
  tests/
  docs/
```

### Límites entre capas

- **Electron:** ventana, ciclo de vida, almacenamiento y operaciones del sistema. El renderer no tendrá acceso directo a Node.
- **Interfaz (renderer):** vistas, componentes, navegación y presentación del estado.
- **Módulos:** reglas y acciones propias de cada área.
- **Servicios:** almacenamiento, planificación, recomendaciones y estadísticas compartidos.
- **Datos:** entidades identificadas por ID, fechas normalizadas y relaciones explícitas.

## Modelo de datos inicial

- **Profile:** identidad, color/acento, preferencias, autonomía y configuración.
- **Activity:** definición reutilizable (nombre, categoría, duración orientativa, frecuencia y preferencias).
- **Task:** instancia concreta de algo que se quiere hacer; puede vincularse a una Activity.
- **ScheduleBlock:** ubicación temporal de una tarea o compromiso; admite bloqueos y flexibilidad.
- **Goal:** objetivo con periodo, progreso y relación opcional con actividades.
- **FocusSession:** sesión con inicio, fin, pausas, duración real y vínculo opcional a tarea.
- **DailyRecord:** resumen diario calculado a partir de eventos reales.
- **Recommendation:** sugerencia explicable, descartable y nunca obligatoria.

Los datos personales estarán separados por perfil. Los registros tendrán identificadores estables y fechas ISO. Las estadísticas se derivarán del historial siempre que sea posible, en vez de duplicar datos que puedan desincronizarse.

## Navegación prevista

1. **Hoy:** resumen del día, tareas próximas y pendientes, progreso, tiempo libre y captura rápida.
2. **Actividades:** catálogo, categorías y actividades personalizadas.
3. **Calendario:** vistas diaria, semanal y mensual.
4. **Focus:** temporizador vinculado a una tarea o sesión libre.
5. **Objetivos:** metas y seguimiento.
6. **Insights:** tendencias, constancia e historial.
7. **Perfil y ajustes:** perfiles, preferencias, autonomía y apariencia.

## Etapas de implementación

### Etapa 0 — Auditoría y estabilización
- Confirmar el árbol real del repositorio y las rutas que usa Electron.
- Resolver cualquier discrepancia entre la ubicación de `main.js`, HTML, CSS y scripts.
- Identificar qué archivos son activos y cuáles son restos de versiones anteriores.
- Verificar que la aplicación abre y que las funciones actuales siguen funcionando.
- Registrar el comportamiento existente antes de refactorizar.

**Salida:** aplicación actual reproducible y mapa fiable de archivos. No rediseñar todavía.

### Etapa 1 — Base técnica
- Separar el proceso principal de Electron y el renderer.
- Introducir `preload` y una API IPC pequeña y validada.
- Establecer estructura modular y convenciones.
- Implementar almacenamiento local con versión de esquema, escritura segura y respaldo.
- Añadir manejo visible de errores.

**Salida:** base segura y estable, sin cambiar todavía el alcance funcional de la app.

### Etapa 2 — Perfiles y preferencias
- Crear perfil principal y perfiles adicionales.
- Aislar tareas, calendario, objetivos, sesiones e historial por perfil.
- Selector y configuración de perfil.
- Preferencias visuales y de autonomía.

**Salida:** cambio de perfil sin mezcla de datos.

### Etapa 3 — Sistema visual y navegación
- Definir tokens de color, tipografía, espaciado, superficies y estados.
- Construir navegación y componentes reutilizables.
- Aplicar el diseño luminoso y personalizado.
- Adaptar la ventana a tamaños razonables.

**Salida:** interfaz coherente; las vistas pueden usar datos de prueba mientras se conectan los módulos.

### Etapa 4 — Actividades y tareas
- Catálogo de actividades por categorías.
- Crear, editar, archivar y reutilizar actividades.
- Crear tareas desde el catálogo o desde cero.
- Estados, prioridades, duración estimada y recurrencia básica.
- Captura rápida de tareas.

**Salida:** las tareas tienen un modelo común y persisten correctamente.

### Etapa 5 — Hoy
- Panel diario alimentado por los datos reales.
- Próximas tareas, pendientes, progreso y captura rápida.
- Acciones rápidas para completar, posponer o reprogramar.

**Salida:** pantalla principal útil, no una maqueta.

### Etapa 6 — Calendario y planificación
- Vistas diaria, semanal y mensual.
- Bloques flexibles y compromisos bloqueados.
- Detección de solapamientos y días sobrecargados.
- Reprogramación manual y propuestas automáticas explicables.
- Nunca mover citas bloqueadas sin confirmación.

**Salida:** calendario y tareas comparten datos; no hay duplicados independientes.

### Etapa 7 — Focus
- Temporizador configurable y sesión libre.
- Sesiones vinculadas a tareas.
- Pausa, reanudación y recuperación correcta tras suspender/cerrar la app.
- Historial y duración real.

**Salida:** sesiones fiables incluso si el equipo duerme o la ventana se cierra.

### Etapa 8 — Objetivos, constancia e insights
- Objetivos con periodos y progreso.
- Historial, tendencias y estadísticas.
- Rachas razonables, sin castigar descansos planificados.
- Revisión semanal.

**Salida:** métricas comprensibles derivadas de datos reales.

### Etapa 9 — Recomendaciones y autonomía
- Motor local de reglas para sugerir horarios y detectar conflictos.
- Recomendaciones con explicación y opción de ignorar.
- Modos manual, sugerido, automático e híbrido.
- Solo reorganizar elementos flexibles según las reglas del perfil.

**Salida:** asistencia útil y predecible, sin depender de servicios externos.

### Etapa 10 — Pulido y publicación
- Accesibilidad, estados vacíos, mensajes de error y rendimiento.
- Pruebas de persistencia, perfiles, navegación y planificación.
- Copias de seguridad y recuperación.
- Empaquetado y guía de actualización.

**Salida:** versión candidata estable para uso cotidiano.

## Criterio para avanzar entre etapas

No se considera terminada una etapa solo porque la pantalla se vea bien. Debe funcionar con datos reales, guardar y recuperar los datos, manejar errores básicos y no romper las etapas anteriores. Si una comprobación falla, se corrige antes de ampliar el alcance.

## Primera tarea concreta

Empezar por la **Etapa 0**: revisar el árbol completo y las rutas de ejecución, reproducir el arranque esperado y decidir la corrección mínima. La primera modificación de código debe ser pequeña, reversible y acompañada de una prueba.
