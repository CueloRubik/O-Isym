# Auditoría y registro de construcción

Fecha: 2026-11-04  
Rama: \`oisym-5-development\`

## Reconstrucción de la interfaz

La interfaz nueva sustituye al prototipo anterior desde \`index.html\`. Los scripts antiguos de \`src/scripts/\` se conservan en el repositorio, pero ya no se ejecutan. El origen del documento se mantiene en la raíz para no perder acceso al localStorage anterior.

## Funciones incorporadas

- Arquitectura renderer sin Node Integration, con preload limitado y almacenamiento JSON local.
- Validación de perfiles y snapshots, escritura atómica y respaldos.
- Perfiles independientes con preferencias y colecciones separadas.
- Actividades reutilizables, tareas y estados.
- Panel Hoy, calendario mensual y agenda diaria.
- Propuestas de planificación que excluyen tareas bloqueadas.
- Temporizador Focus con pausa y recuperación del estado activo.
- Objetivos, Insights y sugerencias locales.
- Exportación/importación JSON e importación opcional del prototipo.
- Interfaz clara, luminosa, adaptable y sin dependencias de UI.

## Pruebas

Se añadieron pruebas para almacenamiento y dominio. No se afirma que estén ejecutadas en esta sesión: el entorno de edición de GitHub no proporciona un runtime Node local. Deben ejecutarse con \`npm test\`. La comprobación de ventana, IPC y compatibilidad final debe realizarse en el Mac con \`npm start\`.

## Riesgos y limitaciones conocidos

- La planificación es una primera versión determinista por huecos de horario; todavía no es un optimizador avanzado.
- El calendario actual es mensual y la agenda diaria; las vistas semanal y anual quedan para una iteración posterior.
- El temporizador guarda la sesión activa, pero no puede garantizar precisión si el sistema suspende el proceso durante largos periodos.
- El importador antiguo reconoce las claves de agenda \`acts_*\` y la paleta \`oisym_colors\`; conserva el localStorage original.
- La importación de un backup reemplaza el conjunto de perfiles después de la confirmación y genera respaldo del archivo actual.

## Comprobación local pendiente

\`\`\`bash
npm install
npm test
npm start
\`\`\`

Revisar cambio de perfiles, cierre/reapertura, calendario, completar tareas, propuestas de planificación, temporizador, exportación y migración. No fusionar a \`main\` hasta validar estos flujos.
