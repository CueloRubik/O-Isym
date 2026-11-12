# Decisiones y pendientes

## Acordado para esta preparación

| Tema | Decisión |
| --- | --- |
| Rama | `feature/android-capacitor`, temporal, creada desde development |
| Alcance de esta entrega | Planificación y contratos de diseño; implementación pendiente |
| Código compartido | Mantener dominio e interfaz; adaptar capacidades del dispositivo |
| Interfaz Android | Una actividad principal y navegación interna; sin permisos de superposición |
| Segundo plano | Estado persistente, planificador nativo y audio nativo cuando corresponda |
| Datos | Locales con validación, migraciones, respaldo y exportación |
| Compatibilidad desktop | Conservar Electron 28 para Catalina; no elevarlo por Android |
| Publicación | Solo después de compilar y probar; versión Android todavía sin publicar |

## Decisiones abiertas antes de escribir la integración

1. Combinación exacta de Capacitor/plugins, Node, JDK, Gradle y SDK.
2. Versión mínima Android, dispositivos disponibles y distribución inicial.
3. Plugin mantenido o plugin local para Media3, sesión Focus y alarma finita.
4. Almacenamiento Android y garantías de escritura/recuperación.
5. Tipo de alarma, permisos y comportamiento alternativo sin acceso exacto.
6. Presentación de sesión silenciosa activa sin inventar reproducción de audio.
7. Política de sesión interrumpida por reinicio y de retirada de recientes.
8. Diseño final de navegación y paneles tras probar en un teléfono.
9. Recuperación y revisión de cualquier código/APK Android previo antes de adoptarlo.
10. Firma de distribución y versión de la primera release Android.

Resolver cada decisión con fecha de verificación, alternativa considerada, fuente y prueba. No fijar una versión simplemente porque es la más nueva instalada en un equipo.

## Diferencias que no deben perderse

La documentación de `main` sigue describiendo ramas de plataforma separadas. `development/docs/RELEASE-STRATEGY.md` propone código compartido. Windows tiene cambios de sistema y una compilación comprobada que no deben perderse al integrar. Esta rama toma development como base de Android y documenta la revisión de diferencias en A0; no ejecuta una unificación automática.

## Referencias oficiales consultadas para el diseño

- [Entorno Capacitor](https://capacitorjs.com/docs/getting-started/environment-setup).
- [Configuración Capacitor](https://capacitorjs.com/docs/config).
- [Notificaciones locales](https://capacitorjs.com/docs/apis/local-notifications).
- [Android: alarmas](https://developer.android.com/develop/background-work/services/alarms).
- [Android: reproducción en segundo plano](https://developer.android.com/media/media3/session/background-playback).
- [Android: inicio de servicios en segundo plano](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start).
- [Android: Doze](https://developer.android.com/training/monitoring-device-state/doze-standby).
- [Android: edge-to-edge](https://developer.android.com/develop/ui/views/layout/edge-to-edge).

Consultadas al preparar esta planificación el 11 de noviembre de 2026 (hora de Ciudad de México). Revisar nuevamente al escoger SDK y dependencias.

## Lista de decisiones cerradas durante implementación

Todavía no hay decisiones de herramientas, permisos o servicios verificadas en un APK de esta rama. Añadir aquí su resolución a medida que avanza A0 y posteriores.
