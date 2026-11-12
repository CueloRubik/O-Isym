# Focus, música, alarmas y suspensión

Estado: requisitos y diseño; implementación pendiente.

## Resultado esperado

Iniciar Focus, navegar a otra sección o aplicación, apagar la pantalla y volver sin perder el tiempo transcurrido. La música elegida continúa mediante Android. Al finalizar se detiene la música antes de emitir la alarma configurada. Hay controles para pausar, reanudar, cancelar y detener la alarma, incluso desde las superficies del sistema que lo permitan.

No se necesita una ventana flotante encima de otras aplicaciones. Se mantiene una actividad principal; la notificación permite controlar o volver a Focus.

## Estado de sesión y relojes

El modelo existente guarda `activeFocus` con `startedAt`, `sessionStartedAt`, `pausedAt`, `elapsedBeforePause`, duración y vínculos a tarea/actividad. Reutilizar esa semántica y añadir mediante migración los identificadores necesarios.

- Una sesión tiene sessionId, profileId y revisión persistentes; cada reprogramación invalida su generación anterior.
- En el mismo arranque del dispositivo, medir duración con reloj monotónico que incluya suspensión, como elapsedRealtime.
- Persistir también referencias de hora civil y arranque para recuperar el estado después de reinicio; documentar el caso de cambio manual de hora.
- JavaScript pinta el tiempo restante consultando el estado; setInterval no es la fuente del tiempo.
- Pausa guarda tiempo restante y cancela el aviso de fin. Reanudar crea una nueva fecha límite.
- Android conserva un estado mínimo transaccional de la sesión; el dominio compartido reconcilia al volver.
- Una finalización se confirma una sola vez por sessionId/revisión, aunque lleguen simultáneamente un aviso, un control de notificación y la reapertura de la UI.
- No atribuir trabajo durante el intervalo en que el teléfono estuvo apagado: recuperar como interrumpida o pendiente de confirmar, con política explícita.

## Máquina de estados prevista

| Estado | Acción válida | Efectos que deben persistirse |
| --- | --- | --- |
| Inactiva | Iniciar | Crear sesión, guardar, programar fin; iniciar audio si se eligió |
| En curso | Pausar | Guardar restante, invalidar fin anterior, pausar música |
| Pausada | Reanudar | Nueva revisión y límite, reprogramar, restaurar música |
| En curso/pausada | Cancelar | Invalidar alarmas, detener audio y dejar sesión cancelada |
| En curso | Vencer | Confirmar una finalización, detener música, emitir alarma finita |
| Finalizada con alarma | Detener/agotarse límite | Parar sonido y liberar recursos; no duplicar historial |
| Cualquier estado | Recuperar | Leer estado nativo y datos, reconciliar; descartar callbacks obsoletos |

## Tres mecanismos distintos

1. **Tiempo y recuperación:** estado persistente y relojes adecuados. No exige mantener la WebView despierta.
2. **Aviso de fin y tareas:** programación nativa y receptores válidos, permisos y cancelación por identificador.
3. **Música:** reproducción nativa en MediaSessionService con tipo mediaPlayback y permisos requeridos para la versión objetivo. Iniciar desde una acción visible del usuario; no usar un servicio de reproducción ficticio para mantener un temporizador silencioso.

Cuando no hay música, no sostener un servicio multimedia solamente para contar segundos. Evaluar la superficie de temporizador/notificación admitida por Android y el planificador nativo.

## Alarma de fin

- Conservar tono, volumen, número de repeticiones, intervalo y duración máxima ya configurables en O-Isym.
- Programar el fin como operación nativa; la UI cerrada no debe ser necesaria para reproducir la alarma.
- Validar por API qué componente puede iniciar la reproducción al vencer y qué excepción/permisos lo permiten. No asumir que un servicio se puede iniciar desde cualquier contexto.
- Un receptor hace trabajo breve. Si el aviso necesita audio prolongado, delegar en un componente permitido, con notificación y acción Detener.
- Si no hay capacidad para el patrón completo, notificar la limitación y ofrecer aviso del sistema; nunca declarar que una alarma exacta está garantizada sin el permiso.
- Al vencer, detener música y vista previa antes de iniciar alarma; prevenir doble reproducción.
- Detener al llegar al límite, al cancelar, al recibir la acción correspondiente o al cambiar una configuración que invalide la reproducción.
- Una sesión ya terminada no vuelve a sonar al abrirla mucho después.

## Notificaciones de tareas

Identidad estable por perfil/tarea/ocurrencia. Reprogramar al editar hora, anticipación, zona horaria, tipo de tarea o preferencias; cancelar al completar, borrar o desactivar. No entregar contenido de otro perfil por usar un identificador reutilizado.

El toque abre la actividad principal en la tarea correspondiente. No crea ventanas duplicadas. Una notificación retrasada sigue la preferencia de avisos vencidos. Separar los canales de tareas, sesión y fin de Focus; respetar los ajustes del sistema y su control sobre sonido/importancia.

## Permisos y cambios del sistema

| Capacidad | Tratamiento previsto |
| --- | --- |
| Notificaciones | Comprobar y solicitar cuando corresponda; explicar el beneficio al activar avisos |
| Alarmas exactas | Comprobar acceso especial; evaluar SCHEDULE_EXACT_ALARM y política aplicable antes de elegir permisos |
| Media playback | Declarar servicio, tipo y permisos compatibles; iniciar desde la interacción del usuario |
| Reinicio/actualización | Reconciliar avisos y estado permitido; no arrancar música automáticamente al encender |
| Ahorro de batería | Probar primero con ajustes normales; ayuda contextual si un fabricante restringe funciones |
| No molestar/volumen | Respetar el sistema; no prometer anular silencio o DND |

No solicitar permisos amplios de archivos, micrófono, ubicación ni superposición para estas funciones. No exigir desactivar todas las optimizaciones como primer paso.

## Escenarios diferenciados

| Situación | Comportamiento que debe verificarse |
| --- | --- |
| Pantalla apagada o app en segundo plano | Tiempo correcto; música y aviso nativos según permisos |
| Actividad recreada por rotación | Recuperar UI, borrador y sesión sin duplicar reproductor |
| Proceso terminado por memoria | Recuperar sesión y avisos programados; no depender del proceso web |
| Quitar de recientes | Probar por fabricante; definir si se conserva música iniciada y cómo detenerla |
| Reiniciar teléfono | Restaurar recordatorios futuros; mostrar Focus interrumpido; no reproducir automáticamente |
| Forzar detención desde Ajustes | No garantizar avisos ni audio hasta que el usuario reabra la app |
| Permiso revocado | Detectar al volver, explicar estado y evitar indicadores falsos de protección |
| Reloj/zona cambiados | Duración monotónica en el mismo arranque; recalcular tareas por su semántica local |

## Fuentes oficiales

- [Capacitor: notificaciones locales](https://capacitorjs.com/docs/apis/local-notifications).
- [Android: programar alarmas](https://developer.android.com/develop/background-work/services/alarms).
- [Android: reproducción en segundo plano](https://developer.android.com/media/media3/session/background-playback).
- [Android: restricciones de servicios](https://developer.android.com/develop/background-work/services/fgs/restrictions-bg-start).
- [Android: Doze y App Standby](https://developer.android.com/training/monitoring-device-state/doze-standby).

Las restricciones dependen de API objetivo, versión del sistema, permisos y fabricante. Verificar la documentación durante A0 y cada cambio de SDK; este diseño no certifica funcionamiento aún.
