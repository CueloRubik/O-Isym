# Auditoría inicial del repositorio

Fecha: 2026-11-04  
Rama: `oisym-5-development`

## Estado de la estructura

La aplicación está organizada de esta manera:

```text
O-Isym/
├── electron/
│   └── main.js
├── src/
│   ├── scripts/
│   │   ├── app.js
│   │   ├── calendar.js
│   │   ├── planner.js
│   │   ├── timer.js
│   │   └── settings.js
│   └── styles/
│       └── styles.css
├── docs/
├── legacy/
│   └── renderer.js
├── index.html
├── package.json
└── .gitignore
```

## Hallazgos confirmados

1. Electron inicia desde `electron/main.js`, según el campo `main` de `package.json`.
2. `electron/main.js` carga el `index.html` de la raíz.
3. El HTML carga la hoja de estilos y los cinco scripts desde sus nuevas ubicaciones en `src/`.
4. `legacy/renderer.js` se conserva como código antiguo no referenciado por el HTML actual; no se elimina hasta revisar si contiene lógica recuperable.
5. Electron permanece fijado en la versión `28.3.3`, sin añadir dependencias.
6. `index.html` permanece en la raíz para no cambiar innecesariamente el origen del almacenamiento local usado por la versión anterior.

## Primera corrección funcional

Se corrigió el calendario mensual:

- Los días ahora aparecen bajo el día de la semana correcto, con celdas vacías antes del día 1.
- La navegación entre meses construye cada fecha desde el día 1, evitando saltos de mes cuando se navega desde meses con distinta cantidad de días.
- Las celdas de día pueden abrirse con ratón o teclado.
- El número del día y el rendimiento se insertan como texto, no como HTML.

La corrección conserva las claves de rendimiento existentes (`score_YYYY-MM-DD`) y la acción de abrir el planificador para cada fecha.

## Validaciones realizadas

- Revisión estática de las rutas entre `package.json`, Electron, HTML, scripts y CSS.
- Revisión de sintaxis JavaScript del cambio del calendario.
- Confirmación de que la rama de trabajo es `oisym-5-development`; `main` no se modifica.

## Pendiente de validar localmente

La aplicación todavía no se ha ejecutado en el Mac del usuario. Antes de migrar almacenamiento o seguridad, hace falta confirmar:

- Que `npm install` termina correctamente.
- Que `npm start` abre la ventana de Electron.
- Que el calendario, el planificador, el temporizador y los colores funcionan.
- Que las actividades y preferencias siguen presentes después de cerrar y volver a abrir la app.

## Riesgos técnicos para las siguientes etapas

- La ventana aún usa `nodeIntegration: true` y `contextIsolation: false`. No cambiar estos valores hasta implementar y probar una capa `preload`/IPC que reemplace los accesos existentes.
- La aplicación usa `localStorage`. Antes de migrarlo hay que preservar los datos ya guardados.
- El planificador todavía inserta algunos valores del usuario mediante plantillas HTML; debe migrarse a creación segura de nodos y `textContent`.
- El temporizador actual depende de `setInterval`; deberá evolucionar a cálculo basado en marcas de tiempo para tolerar suspensión o cierre de la ventana.

## Estado

**Reorganización y primera corrección de calendario completadas mediante revisión estática. Prueba de ejecución en el Mac pendiente.** No se afirma que la aplicación completa esté probada en tiempo de ejecución.
