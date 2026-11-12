# Código histórico de O-Isym

Esta carpeta conserva archivos de prototipos anteriores para referencia, pero **no se ejecutan ni se incluyen en los instaladores actuales**.

- `scripts/` contiene el calendario y planificador antiguos que utilizaban `localStorage`. El calendario unificado actual está en `src/app.js` y sus reglas compartidas en `src/planning.js`.
- `styles.css` conserva los estilos del prototipo anterior. La aplicación actual carga `src/styles/app.css`.
- `renderer.js` es el renderizador histórico previamente archivado.

No reutilices estos archivos como componentes de producción sin una migración explícita al modelo de perfiles y tareas. Conservamos el historial para consulta, evitando empaquetar dos planificadores distintos.
