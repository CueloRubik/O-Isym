# Documentación de O-Isym

## Organización y distribución

- [Estrategia de ramas, compilaciones y Releases](RELEASE-STRATEGY.md) — fuente actual para las ramas `development` y futura `main`, builds multiplataforma y página oficial.

## Android

- [Plan e índice Android](android/README.md) — adaptación con Capacitor, interfaz de teléfono, datos, notificaciones, música y Focus con pantalla apagada.
- [Etapas y criterios de aceptación](android/PLAN.md).
- [Matriz de pruebas y distribución](android/VALIDATION.md).

Estado: planificación en `feature/android-capacitor`; implementación y pruebas Android pendientes.

## Próxima etapa de producto

- [Organización Unificada: planificación diaria y calendario avanzado](UNIFIED-PLANNING.md) — especificación y bloques de trabajo.
- [Implementación de Organización Unificada](UNIFIED-PLANNING-IMPLEMENTATION.md) — arquitectura incorporada en `development`, validación automatizada y lista de comprobaciones en Catalina.
- [Rediseño del espacio de trabajo y ventanas](UNIFIED-UI-REDESIGN.md) — navegación, calendario visual, paneles laterales y pruebas de la nueva interfaz.
- [Temas claros, oscuros y colores personalizados](APPEARANCE-SYSTEM.md) — paletas por perfil, vista previa, contraste y compatibilidad.
- [Auditoría de superficies, bordes y espaciado](UI-SURFACE-AUDIT.md) — relieve, esquinas configurables, márgenes interiores y excepciones del lienzo.

## Desarrollo y revisión

- [Correcciones de la revisión del 11 de noviembre de 2026](AUDIT-FIXES-2026-11-11.md) — recuperación, instancia única, Focus, recordatorios y límites del planificador.
- [Auditoría técnica y prioridades](QUALITY_AUDIT_OISYM_1.md).
- [Hoja de ruta del producto](ROADMAP_OISYM_1.md).
- [Especificaciones de perfiles e interfaz](PROFILE_AND_UI_SPEC_OISYM_1.md).
- [Plan de implementación de pizarrones](IDEAS-PLANNER-IMPLEMENTATION.md).
- [Formato de archivos .oisym](OISYM-FILE-FORMAT.md).
- [Revisión de pizarrones](PIZARRONES-REVISION.md).
- [Auditoría inicial (histórica)](INITIAL_AUDIT.md).

## Convenciones

- **Resuelto:** incorporado y acompañado de prueba cuando es viable.
- **Confirmado / pendiente:** reproducido o visible en el código y todavía sin corregir.
- **Por verificar:** necesita reproducción.
- **Mejora:** oportunidad de calidad sin implicar un error existente.

Conservar el historial de hallazgos y no confundir código en desarrollo con instaladores listos para distribuir.
