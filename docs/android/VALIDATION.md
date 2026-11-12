# Pruebas, evidencia y publicación Android

Estado: matriz definida; escenarios pendientes de ejecutar. Ninguna casilla representa una prueba ya superada.

## Dispositivos

| Entorno | Objetivo |
| --- | --- |
| Lenovo TB-J606L, Android 11, si está disponible | Prueba real de tablet y recuperación de sesión |
| Teléfono real, Android reciente | Pantalla pequeña, notificaciones, alarmas y servicios |
| Emuladores de APIs seleccionadas en A0 | Permisos, cambios del sistema y regresiones reproducibles |
| Mac con Electron 28 | Comprobar que el puente no rompe compatibilidad de escritorio |
| Windows | Conservar almacenamiento, Focus, archivos y avisos específicos |

No sustituir las pruebas de teléfono real por una captura con ancho reducido. Registrar fabricante, modelo, API, WebView y configuración de batería.

## Matriz funcional

| ID | Escenario | Resultado exigido |
| --- | --- | --- |
| D01 | Crear/editar datos, bloquear y volver | Últimos cambios válidos conservados |
| D02 | Interrumpir escritura o simular falta de espacio | Error visible y última copia válida recuperable |
| D03 | Importar archivo inválido/cancelar selector | Datos previos intactos |
| D04 | Actualizar APK con misma firma | Perfiles, preferencias e historial conservados |
| F01 | Focus sin música, pantalla apagada, hasta vencer | Tiempo correcto y aviso conforme a permisos |
| F02 | Focus con música, pantalla apagada, hasta vencer | Música continúa; se detiene antes de alarma finita |
| F03 | Pausar y reanudar desde UI y notificación | Estado convergente; aviso anterior cancelado |
| F04 | Cancelar justo cuando vence | Un único estado final, sin alarma fantasma |
| F05 | Reabrir después de vencer | Un registro; no repetir alarma antigua |
| F06 | Proceso terminado por sistema | Recuperación coherente sin depender de WebView viva |
| F07 | Reiniciar teléfono | Recuperar avisos futuros y Focus interrumpido, sin autoarrancar música |
| F08 | Revocar acceso a alarmas exactas | Detectar degradación y comunicarla |
| F09 | Forzar detención y después reabrir | Recuperación explícita; sin prometer ejecución durante force-stop |
| F10 | Cambiar perfil mientras Focus está activo | Sesión conserva identidad y no contamina otro historial |
| F11 | Cambiar hora/zona durante Focus | Duración estable en mismo arranque; tareas recalculadas correctamente |
| N01 | Denegar y después conceder notificaciones | Sin bloqueo; estado de permiso actualizado |
| N02 | Editar/completar/eliminar tarea con aviso | No aparece el recordatorio anterior |
| N03 | Tocar notificación desde inicio frío | Una actividad, perfil y destino correctos |
| N04 | Varias tareas cercanas, Doze y ahorro | Sin duplicados; retrasos registrados por tipo de alarma |
| A01 | Llamada, otra app de audio o auriculares desconectados | Manejo de audio focus y pausa adecuado |
| A02 | Vista previa, música y alarma compiten | Solo audio autorizado; detener siempre funciona |
| A03 | Parar alarma desde pantalla bloqueada | Sonido y recursos liberados |
| U01 | 360 px, horizontal y tablet | Todas las acciones alcanzables y sin desbordamientos generales |
| U02 | Teclado abierto y formulario largo | Campo y guardar visibles/alcanzables; borrador conservado |
| U03 | Atrás, rotación y notificación durante edición | Sin pérdida silenciosa ni ventanas duplicadas |
| U04 | Pizarrón con dos dedos y cancelación de gesto | No mover nodos accidentalmente ni perder selección |
| U05 | TalkBack y texto ampliado | Acciones identificables, lectura ordenada y contenido accesible |
| P01 | Focus sin música durante una sesión completa | Sin wake lock permanente ni actividad de CPU cada segundo |
| P02 | Focus con música y pantalla apagada | Consumo medido y sin reproductores duplicados |

Para F01/F02, medir la diferencia entre vencimiento solicitado, entrega nativa y presentación. Con permiso exacto y dispositivo de prueba normal, objetivo inicial de entrega de fin dentro de 5 segundos; ajustar o rechazar la solución si no lo cumple. En modo no exacto registrar retraso y explicarlo, sin usar el mismo criterio de precisión. Probar una sesión real de 25 minutos, además de las pruebas aceleradas de desarrollo.

## Pruebas automatizadas previstas

- Contratos idénticos del puente y errores manejables.
- Migraciones, validación y recuperación de snapshots.
- Cálculos de tiempo con reloj simulado, pausa, cancelación y vencimiento.
- Deduplificación por sesión/revisión e identidad de recordatorios.
- Reconciliación entre nativo y UI; callbacks antiguos y permisos revocados.
- Pruebas de interfaz de navegación, teclado y anchos.
- Pruebas Android del servicio/receptores y arranque frío; las pruebas JS no certifican estas funciones.

## Evidencia por ejecución

Registrar commit, APK y hash, versión/versionCode, dispositivo/API/WebView, permisos, batería, pasos, resultado esperado/observado y desfase medido. Estados permitidos: pendiente, aprobado, fallido o bloqueado con causa. Adjuntar logs o capturas sin datos personales.

## CI y publicación

Crear workflow Android después de fijar herramientas: instalar dependencias reproducibles, ejecutar pruebas compartidas, preparar web, sincronizar Capacitor, comprobar proyecto nativo y compilar debug. Separar compilación de firma/publicación.

Antes de release:
- [ ] Matriz crítica de datos, UI, Focus, suspensión y alarmas aprobada en dispositivos reales.
- [ ] Icono adaptable, icono monocromático de notificación y splash correctos.
- [ ] Debug separado de release, versión visible y versionCode incremental.
- [ ] APK/AAB release firmado, actualización probada y clave preservada fuera de Git.
- [ ] Notas describen versiones Android admitidas y límites verificados.
- [ ] APK adjunto a la release y botón Android probado en la web.
- [ ] Builds de escritorio siguen pasando; no se mezclan ajustes Android con Electron de Catalina.

No publicar claves, archivos de datos, firmas de depuración como versión final ni APK incompleto anunciado como terminado.
