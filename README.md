# O-Isym 5

O-Isym es un espacio personal para organizar tareas, actividades, calendario, planificación y concentración. La construcción principal se realiza en \`oisym-5-development\`; \`main\` permanece separada.

## Instalar y ejecutar

Requisitos: Node.js 18.x, npm 10.x y Electron 28.3.3 (instalado con npm).

\`\`\`bash
npm install
npm test
npm start
\`\`\`

## Crear la aplicación para macOS

La build está preparada para macOS Intel (x64), incluido el MacBook Pro Intel. Antes de compilar, coloca tu archivo **`app.icns`** directamente en la raíz del proyecto, al mismo nivel que `package.json`. No hace falta añadirlo al repositorio: Git lo ignora, pero el empaquetador lo encuentra en tu copia local.

Desde la carpeta del proyecto, ejecuta:

```bash
npm install
npm run build:mac
```

El resultado será un instalador **`O-Isym-5.0.0.dmg`** dentro de `dist/`. El icono de la aplicación se toma de `app.icns`. Si el archivo no está en la raíz, el comando se detiene y muestra un aviso claro en lugar de generar una aplicación sin el icono esperado.

Para generar solamente la carpeta de la aplicación sin crear el DMG:

```bash
npm run build:mac:dir
```

La compilación de DMG para macOS debe ejecutarse en macOS. Esta configuración apunta a Intel x64; no cambia la versión de Electron ni las dependencias de ejecución de la aplicación. La aplicación usa firma local *ad-hoc* (sin certificado de Apple Developer ni notarización) para habilitar las notificaciones nativas de macOS en una instalación local. macOS puede seguir mostrando una advertencia de seguridad al abrirla por primera vez; esta firma no convierte el DMG en una distribución notarizada.

## Funciones implementadas en esta versión de desarrollo

- Perfiles independientes y preferencias por perfil.
- Catálogo de actividades reutilizables.
- Tareas con prioridad, fechas, horarios visibles, duración, notas, estado, bloqueo y recordatorios individuales.
- Panel Hoy, calendario mensual y agenda diaria.
- Planificador con propuestas de horarios; no modifica compromisos bloqueados.
- Temporizador Focus con pausa, reanudación e historial persistente.
- Alarmas configurables de Focus y recordatorios nativos de tareas, programados en el proceso principal y persistentes mientras O-Isym permanece en segundo plano.
- Icono de la propia aplicación O-Isym en la barra de menús de macOS. Al entrar por primera vez al Planificador, ofrece activarse al iniciar sesión; cerrar la ventana la oculta sin detener recordatorios. La app debe permanecer ejecutándose en segundo plano: salir por completo detiene los avisos.
- Objetivos con progreso e Insights semanales.
- Recomendaciones locales, configurables y descartables.
- Exportación e importación de copias JSON.
- Importación opcional de registros del prototipo sin borrar el localStorage original.

## Datos y seguridad

Los datos nuevos se guardan en el directorio de usuario de Electron, en \`oisym-data.json\`, con copias de seguridad rotativas. El renderer no tiene acceso directo a Node.js. El almacenamiento valida el esquema y protege archivos dañados. La aplicación no envía datos a servicios externos. Los recordatorios se calculan localmente; en macOS usan el sonido de sistema «Ping» cuando el sonido está activado. macOS debe permitir las notificaciones de O-Isym. La opción de inicio automático depende de que macOS acepte el elemento de inicio de sesión; la compilación local ad-hoc puede tener restricciones frente a una app firmada y notarizada. Salir por completo desde el menú de la barra detiene los recordatorios hasta que la app vuelva a iniciarse.

La importación del prototipo es manual y no elimina sus claves antiguas. Exporta una copia antes de importar archivos externos.

## Desarrollo

- \`electron/\`: proceso principal, preload, IPC y almacenamiento.
- \`src/domain.js\`: modelos y reglas de dominio.
- \`src/app.js\`: interfaz y flujos de aplicación.
- \`src/styles/app.css\`: sistema visual.
- \`assets/avatars/\`: avatares de perfiles.
- \`assets/icons/\`: iconografía de navegación, Focus, tareas e interfaz; incluye un catálogo en \`assets/icons/README.md\`.
- \`assets/audio/\`: música y sonidos de Focus.
- \`tests/\`: pruebas automatizadas.
- `docs/INDEX.md`: índice de documentación.
- `docs/QUALITY_AUDIT_OISYM_5.md`: auditoría técnica vigente, errores resueltos, riesgos y prioridades.
- `docs/ROADMAP_OISYM_5.md`: hoja de ruta de producto.

Los archivos antiguos de \`src/scripts/\` se conservan como referencia y ya no se cargan desde la nueva interfaz.
