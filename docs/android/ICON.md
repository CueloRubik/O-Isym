# Ícono Android: una sola imagen

La única fuente gráfica del ícono de la aplicación es `assets/icons/app.png`. No se redibuja el calendario ni se genera otra imagen monocromática.

## Causa del robot blanco

El proyecto generado por Capacitor conserva `res/drawable-v24/ic_launcher_foreground.xml`, que contiene el robot Android. El primer cambio reemplazaba el recurso sin calificador, pero Android seleccionaba la variante v24 del mismo nombre. Una compilación correcta no detectaba este conflicto.

## Implementación

- `scripts/android-icons.cjs` copia el PNG original en cada compilación a `res/drawable-nodpi/oisym_app_icon.png`; no modifica sus bytes.
- El manifiesto usa `@mipmap/oisym_launcher` y `@mipmap/oisym_launcher_round`.
- Los XML adaptativos usan `@drawable/oisym_app_foreground`, que contiene únicamente el PNG original con margen y fondo blanco.
- Los nombres propios evitan las variantes `ic_launcher*` de la plantilla.
- No hay una capa monocromática dibujada por separado.
- Se mantiene un alias del color antiguo para que los recursos residuales de una carpeta Android ya generada sigan compilando.
- Los recursos nativos se instalan después de `cap sync`.

## Comprobaciones

Las pruebas verifican la copia actual del PNG y el caso de un recurso de plantilla v24 todavía presente. La inspección del APK resuelve la cadena de recursos compilados desde el manifiesto hasta el PNG y rechaza variantes inesperadas del primer plano.

CI compila desde cero y repite la compilación después de añadir un recurso v33 con referencias antiguas, para comprobar el flujo de actualización en una carpeta existente.

Versión de prueba: 1.1.0, versionCode 11004. Verificación física del ícono pendiente de instalar la actualización.

## Evidencia de esta revisión

[CI 43244291310](https://github.com/CueloRubik/O-Isym/actions/runs/43244291310), código 7521ed1be73734bece864133e16cd08747f0092a: 199 pruebas JavaScript aprobadas, comprobaciones táctiles de interfaz aprobadas, compilación limpia e incremental aprobadas. La inspección AAPT del APK resolvió manifiesto → primer plano O-Isym → PNG original y comprobó que no hay una variante v24 del primer plano seleccionado.
