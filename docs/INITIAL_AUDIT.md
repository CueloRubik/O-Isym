# Auditoría y registro de construcción

Fecha: 2026-11-04  
Rama: `oisym-5-development`

## Estado del prototipo heredado

La interfaz que todavía se abre desde `index.html` pertenece al prototipo anterior. Se conserva temporalmente para no borrar ni cambiar de origen los datos que pudiera tener guardados en `localStorage`. No se utilizará como arquitectura del producto nuevo ni se ampliará con módulos nuevos.

Archivos heredados actualmente activos:
- `index.html`
- `src/scripts/app.js`
- `src/scripts/calendar.js`
- `src/scripts/planner.js`
- `src/scripts/timer.js`
- `src/scripts/settings.js`
- `src/styles/styles.css`

El archivo `legacy/renderer.js` sigue conservado como código antiguo no conectado al HTML principal.

## Paso 1 — Fundamentos técnicos

### Implementado en esta rama

- `electron/main.js` ahora usa `preload.js`, desactiva Node Integration y activa Context Isolation y sandbox.
- `electron/preload.js` expone únicamente dos operaciones específicas de almacenamiento; no expone `ipcRenderer` ni APIs generales de Electron.
- `electron/ipc-handlers.js` valida que las solicitudes provengan del frame principal de la ventana local de O-Isym.
- `electron/storage.js` crea un archivo JSON con esquema versionado dentro del directorio de datos de usuario de Electron.
- El almacenamiento valida el esquema y el tamaño, escribe mediante archivo temporal y renombrado, crea copias de respaldo antes de reemplazar datos válidos y conserva hasta cinco respaldos.
- Si encuentra un archivo dañado o incompatible, se niega a sobrescribirlo silenciosamente.
- `package.json` incorpora `npm test` usando el módulo integrado `node:test`.
- `tests/storage.test.js` cubre inicialización, guardado/lectura, creación de respaldo, rechazo de esquema desconocido y protección de archivos dañados.
- README y roadmap actualizados para dejar claro que el prototipo no es la base del producto nuevo.

### Límites deliberados de esta etapa

- El almacenamiento nuevo está preparado, pero todavía no contiene perfiles ni datos de producción.
- La interfaz heredada aún utiliza `localStorage`; la migración se hará en una etapa posterior con respaldo, vista previa y confirmación.
- La interfaz visual final todavía no se ha construido.
- No se han añadido frameworks ni dependencias nuevas. Electron sigue fijado en 28.3.3.

## Validaciones

- Revisión estática de las rutas de Electron, preload e IPC.
- Pruebas automatizadas añadidas, pendientes de ejecución en el entorno del usuario.
- No se pudo ejecutar el repositorio en este entorno de revisión; por tanto, no se afirma que `npm test` ni `npm start` hayan pasado aquí.
- La validación manual en el Mac sigue pendiente.

## Próxima comprobación manual

En la carpeta del proyecto, ejecutar:

```bash
npm install
npm test
npm start
```

Comprobar que la ventana sigue abriendo y que calendario, planificador, temporizador y preferencias heredadas siguen funcionando. La seguridad nueva no debe alterar las funciones del renderer porque este ya no necesita acceso directo a Node.

## Próximo paso de producto

Después de validar esta base, el Paso 2 será diseñar e implementar el modelo de perfiles y preferencias sobre el almacenamiento nuevo. La importación de datos antiguos se hará antes de retirar la interfaz heredada o su `localStorage`.
