# Estrategia de desarrollo y distribución de O-Isym

Actualizado: 2026-11-11

## Principio

**Un solo código de aplicación para todas las plataformas.** `development` sigue siendo la fuente compartida. Por petición del proyecto, las ramas `oisym-mac-intel`, `oisym-mac-universal` y `oisym-windows` reciben una sincronización puntual; no se convierten en líneas independientes de desarrollo. Consulta [el alcance y las excepciones de plataforma](PLATFORM-SYNC.md).

## Ramas

- `development`: fuente de trabajo vigente. Integrar aquí las funciones, correcciones y pruebas.
- `main`: futuro código estable de la aplicación, junto con su documentación. **Todavía NO ha sido migrada**: actualmente conserva la documentación de la estrategia anterior. No fusionar ni reemplazar a ciegas; primero preservar los documentos exclusivos de `main`, revisar las diferencias y aprobar la transición.
- `feature/*` y `fix/*`: opcionales y temporales, nacen de `development` y regresan a ella mediante Pull Request.
- `oisym-website`: sitio web independiente. Se actualiza al publicar una Release verificada.
- `oisym-mac-intel`, `oisym-mac-universal`, `oisym-windows`: instantáneas de plataforma sincronizadas puntualmente desde `development`, conservando su historial. Windows conserva su manifiesto y configuración de compilación anteriores. Las funciones y correcciones compartidas se desarrollan en `development`; sincronizar código no equivale a publicar instaladores verificados.
- `planning/*`: trabajo histórico de documentación. Revisar antes de retirar.
  
## Compilaciones desde development

Antes de compilar: instalar dependencias, ejecutar `npm test`, verificar compatibilidad en las plataformas respectivas y utilizar los iconos locales `app.icns` para macOS y `app.ico` para Windows. El archivo `app.icns` está ignorado por Git; **no está disponible automáticamente en GitHub Actions**.

| Plataforma | Comando | Salida |
| --- | --- | --- |
| Mac Intel (x64) | `npm run build:mac` | DMG |
| Mac universal (Intel + Apple Silicon) | `npm run build:mac:universal` | DMG |
| Windows x64 (instalador) | `npm run build:win` | NSIS EXE |
| Windows x64 (alternativa) | `npm run build:win:portable` | EXE portable |

El instalador Windows todavía necesita validación (se observó un problema de permisos al extraer winCodeSign en Windows). Las compilaciones en CI también requieren comprobar iconos, runners y permisos, por lo que **no deben anunciarse como automatizadas** todavía.

## Publicación segura

1. Incorporar y probar los cambios en `development`.
2. Revisar la integración a `main` mediante Pull Request, conservando la documentación y evitando perder cambios. No distribuir una compilación solamente porque se creó.
3. Ajustar `package.json` al número de versión correspondiente y crear la etiqueta `vX.Y.Z` únicamente desde un commit estable.
4. Compilar y probar macOS Intel, macOS universal y Windows en sus sistemas de destino. Revisar especialmente firma/ad-hoc y advertencias del sistema, funcionamiento del instalador y persistencia de datos.
5. Crear **una GitHub Release por versión**, con los instaladores verificados y notas de cambios. No reemplazar versiones anteriores.
6. Actualizar los enlaces de descarga en `oisym-website` / Netlify hacia los archivos de la nueva Release. Comprobar cada enlace y comprobar que la web publicada refleja la actualización.

**Regla de seguridad:** los instaladores antiguos y la web publicada permanecen intactos hasta contar con reemplazos comprobados.

## Pendientes

- Migrar `main` cuidadosamente porque `main` y `development` han divergido.
- Comprobar el sitio desplegado en Netlify y cómo se despliega la rama `oisym-website`.
- Preparar los iconos de compilación para CI sin perder calidad ni almacenar secretos.
- Implementar un workflow de empaquetado y publicación solo cuando existan builds reproducibles y probadas.
- Revisar y archivar ramas heredadas después de una Release multiplataforma satisfactoria.
