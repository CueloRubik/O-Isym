# Android — preparación e índice

Estado: planificación lista; adaptación nativa todavía pendiente.
Rama de trabajo: `feature/android-capacitor`.
Base de código: `development`, commit `4adc205810d8511ba4d958ec5656ce82e49107d0`.

## Objetivo

Llevar O-Isym a Android con Capacitor, conservando perfiles, tareas, planificación, calendario, metas, Focus, temas y pizarrones. Toda la interfaz vive en una sola actividad principal: navegar entre secciones no abre ventanas independientes ni pierde ediciones. Con la pantalla apagada, Focus conserva su estado y el audio y los avisos usan componentes de Android cuando corresponda.

## Documentos para trabajar

| Documento | Contenido |
| --- | --- |
| [Plan de trabajo](PLAN.md) | Etapas, entregables, dependencias y criterios de terminación |
| [Arquitectura](ARCHITECTURE.md) | Código compartido, puente de plataforma, archivos y guardado |
| [Focus y segundo plano](FOCUS-AND-NOTIFICATIONS.md) | Temporizador, alarmas, música, permisos y recuperación |
| [Interfaz móvil](MOBILE-UI.md) | Pantallas, navegación, teclado, gestos y tamaños |
| [Pruebas y distribución](VALIDATION.md) | Matriz de dispositivos, escenarios y publicación |
| [Decisiones y pendientes](DECISIONS.md) | Estado real, decisiones abiertas y fuentes oficiales |

## Primera tarea ejecutable

A0 del plan: fijar y comprobar la combinación de Node, Capacitor, Android Studio, JDK, Gradle y SDK; revisar las diferencias de Windows y cualquier prototipo Android anterior disponible antes de reutilizarlo. Después integrar un primer APK de arranque, sin anunciar todavía soporte de alarmas o música en suspensión.

## Reglas de esta rama

- Esta rama es temporal y nace de `development`; las funciones compartidas volverán mediante revisión, sin crear otra copia permanente de toda la aplicación.
- La documentación contradictoria de `main` no autoriza fusionar o sustituir ramas. No se cambia `main` en esta preparación.
- Conservar las mejoras específicas de Windows al diseñar el puente compartido; revisarlas antes de integrar.
- Electron sigue siendo la implementación de escritorio. Android no carga Node, IPC ni archivos de Electron.
- Cada etapa pendiente se marca terminada únicamente con evidencia de su criterio de aceptación.
- Esta entrega añade organización y especificaciones. No contiene todavía Capacitor instalado, proyecto Gradle, servicio nativo ni APK Android nuevo.
