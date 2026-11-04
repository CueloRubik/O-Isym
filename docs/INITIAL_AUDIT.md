# Auditoría inicial del repositorio

Fecha: 2026-11-04  
Rama: `oisym-5-development`

## Alcance

Revisión estática de la estructura del repositorio y de las rutas de arranque. No se ha ejecutado la aplicación en el Mac del usuario; por tanto, esta auditoría no afirma que el arranque esté probado en ese entorno.

## Hallazgos confirmados

1. `package.json` declara `main.js` como entrada de Electron.
2. `main.js` intentaba cargar `src/index.html`, pero el HTML existente está en la raíz.
3. El HTML cargaba cinco scripts desde `js/`, pero los cinco archivos existentes están en la raíz.
4. `styles.css` ya estaba referenciado desde la raíz y también existe allí.
5. `renderer.js` existe, pero no aparece referenciado por el HTML principal actual. Debe tratarse como posible código antiguo hasta rastrear sus dependencias; no borrarlo todavía.
6. No existen actualmente las carpetas `src/` ni `js/` en la raíz del repositorio.

## Correcciones mínimas aplicadas en esta rama

- `main.js`: ahora carga `index.html` desde la raíz.
- `index.html`: ahora carga `app.js`, `calendar.js`, `planner.js`, `timer.js` y `settings.js` desde la raíz.

No se han cambiado las reglas de negocio ni el diseño de la interfaz.

## Pendiente de validar localmente

- Ejecutar `npm start` en el entorno del usuario y confirmar que Electron abre la ventana.
- Comprobar consola de DevTools y errores de carga de recursos.
- Probar navegación, calendario, alta y finalización de actividades, temporizador y preferencias de color.
- Verificar persistencia tras cerrar y volver a abrir la aplicación.
- Revisar compatibilidad con la versión concreta de macOS y la instalación local de dependencias.

## Riesgos técnicos para las siguientes etapas

- La ventana de Electron mantiene actualmente `nodeIntegration: true` y `contextIsolation: false`. No cambiar esta configuración hasta introducir y probar una capa `preload`/IPC que reemplace los accesos existentes.
- La lógica usa `localStorage`; antes de migrarla hay que definir cómo preservar los datos actuales.
- Algunas vistas insertan texto de actividades en HTML. Al refactorizar, usar APIs DOM seguras como `textContent` y validar entradas.
- El temporizador debe evolucionar a medición basada en marcas de tiempo para tolerar suspensión del equipo y cierre de la ventana.

## Estado

**Auditoría estática inicial completada; prueba de ejecución pendiente.** No iniciar la migración de arquitectura hasta comprobar el arranque y las funciones actuales en el Mac.
