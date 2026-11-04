# O-Isym 5

O-Isym es un espacio personal para organizar tareas, actividades, calendario, planificación y concentración. La construcción principal se realiza en \`oisym-5-development\`; \`main\` permanece separada.

## Instalar y ejecutar

Requisitos: Node.js 18.x, npm 10.x y Electron 28.3.3 (instalado con npm).

\`\`\`bash
npm install
npm test
npm start
\`\`\`

## Funciones implementadas en esta versión de desarrollo

- Perfiles independientes y preferencias por perfil.
- Catálogo de actividades reutilizables.
- Tareas con prioridad, fechas, duración, notas, estado y bloqueo.
- Panel Hoy, calendario mensual y agenda diaria.
- Planificador con propuestas de horarios; no modifica compromisos bloqueados.
- Temporizador Focus con pausa, reanudación e historial persistente.
- Objetivos con progreso e Insights semanales.
- Recomendaciones locales, configurables y descartables.
- Exportación e importación de copias JSON.
- Importación opcional de registros del prototipo sin borrar el localStorage original.

## Datos y seguridad

Los datos nuevos se guardan en el directorio de usuario de Electron, en \`oisym-data.json\`, con copias de seguridad rotativas. El renderer no tiene acceso directo a Node.js. El almacenamiento valida el esquema y protege archivos dañados. La aplicación no envía datos a servicios externos.

La importación del prototipo es manual y no elimina sus claves antiguas. Exporta una copia antes de importar archivos externos.

## Desarrollo

- \`electron/\`: proceso principal, preload, IPC y almacenamiento.
- \`src/domain.js\`: modelos y reglas de dominio.
- \`src/app.js\`: interfaz y flujos de aplicación.
- \`src/styles/app.css\`: sistema visual.
- \`tests/\`: pruebas automatizadas.
- \`docs/ROADMAP_OISYM_5.md\`: plan y estado.

Los archivos antiguos de \`src/scripts/\` se conservan como referencia y ya no se cargan desde la nueva interfaz.
