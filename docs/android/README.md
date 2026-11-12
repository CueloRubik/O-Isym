# Android — preparación e índice

Estado: adaptación inicial implementada; APK debug compilado y 192 pruebas aprobadas en GitHub. Validación física pendiente.
Rama de trabajo: `oisym-android`.
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

## Implementación disponible

Consulta [el resultado y sus límites](IMPLEMENTATION.md) y el README de la raíz para descargar, compilar e instalar. El código nativo y los scripts ya están en esta rama. Los documentos de arquitectura y el plan contienen además criterios aún pendientes de comprobar en un dispositivo real.

## Próximas tareas

Instalar el APK debug en un Android real y ejecutar la matriz de teclado, navegación, guardado, suspensión, audio y permisos. Usar JDK 21, Capacitor 8.0.0 y SDK 36, como en la compilación comprobada.

## Reglas de esta rama

- Esta rama es temporal y nace de `development`; las funciones compartidas volverán mediante revisión, sin crear otra copia permanente de toda la aplicación.
- La documentación contradictoria de `main` no autoriza fusionar o sustituir ramas. No se cambia `main` en esta preparación.
- Conservar las mejoras específicas de Windows al diseñar el puente compartido; revisarlas antes de integrar.
- Electron sigue siendo la implementación de escritorio. Android no carga Node, IPC ni archivos de Electron.
- Cada etapa pendiente se marca terminada únicamente con evidencia de su criterio de aceptación.
- Esta entrega contiene código y APK debug de prueba. El proyecto Gradle se genera con android:sync; los servicios, el puente y los recursos editables están en mobile/native.
