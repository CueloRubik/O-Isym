# O-Isym para Android

Rama de trabajo: `oisym-android`, creada desde development 1.1.0. Incluye la aplicación, puente nativo de Capacitor y una compilación debug reproducible. No es una release estable ni sustituye los instaladores de escritorio.

## Descargar en Windows

Abre PowerShell en una carpeta de trabajo y ejecuta:

```powershell
git clone --single-branch --branch oisym-android https://github.com/CueloRubik/O-Isym.git O-Isym-Android
cd O-Isym-Android
npm.cmd --prefix mobile install
npm.cmd run android:doctor
npm.cmd run android:debug
```

El APK queda en `dist-android/O-Isym-1.1.0-Android-debug.apk`. Puedes copiarlo al teléfono o tablet e instalarlo. Se requiere permitir la instalación desde la aplicación con la que abras el APK.

Para abrir el proyecto en Android Studio:

```powershell
npm.cmd run android:open
```

Para instalar por USB, habilita depuración USB en tu propio dispositivo y acepta su autorización. Conecta el cable y ejecuta:

```powershell
npm.cmd run android:install
```

No es necesario descargar imágenes de emulador para compilar ni para probar en un dispositivo físico.

## Herramientas

- Node 22 o superior.
- Android Studio Otter 2025.2.1 o superior, con Android SDK Platform 36, Build Tools 36.0.0, Platform Tools y Command-Line Tools.
- Java 21 recomendado. En Windows el script utiliza el JBR de Android Studio si JAVA_HOME no está definido. Si JAVA_HOME apunta a Java 25 y Gradle informa incompatibilidad, usa el JBR o JDK 21 en esa terminal.
- Capacitor core/android/cli 8.0.0 y esbuild 0.25.12 en `mobile/package.json`.
- Android 8.0/API 26 o superior para esta adaptación.

Si necesitas seleccionar Java para esta terminal:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm.cmd run android:debug
```

No se aceptan licencias del SDK silenciosamente desde los scripts. Completa ese paso en Android Studio si el SDK lo solicita.

## Qué incluye

- Perfiles, tareas, calendario, actividades, objetivos, temas, estadísticas y pizarrones del código base.
- Navegación móvil, menú lateral accesible, agenda inicial y una actividad principal.
- Almacenamiento privado con AtomicFile, validación y copias; recuperación e importaciones del formato existente.
- Exportación mediante selector de documentos de Android, sin permisos de acceso general al almacenamiento.
- Avisos de tareas y fin de Focus mediante AlarmManager, con acceso exacto opcional y estado de permiso visible.
- Música y vistas previas con un servicio de audio nativo, notificación y controles de detener.
- Alarma de Focus con tono, volumen, repeticiones y límite de duración.

Abre **Más → Android · permisos** para activar notificaciones y, si lo deseas, alarmas exactas. Sin acceso exacto Android puede retrasar el aviso de fin. El modo No molestar, el volumen y una detención forzada siguen bajo control del sistema.

## Verificaciones y límites

GitHub Actions compila el APK y ejecuta pruebas de JavaScript. El resultado se registra en `docs/android/IMPLEMENTATION.md`. Una compilación correcta no certifica suspensión, batería ni interfaz en un dispositivo real. La matriz física sigue en `docs/android/VALIDATION.md`.

En esta primera adaptación, los controles multimedia pausan o detienen el audio; la pausa de la sesión Focus se hace desde la app. Cambiar de perfil detiene el audio/aviso del perfil anterior y conserva su sesión para recuperarla al volver. El historial se reconcilia al abrir la interfaz. Reiniciar o forzar detención requiere volver a abrir y revisar el estado; no se garantiza reproducción después de forzar detención.

El código de Android está en `mobile/native/`. `android:sync` genera `mobile/android/` desde el template de Capacitor y aplica esos archivos. Esa carpeta y los APK son resultados locales, no fuentes para editar. No se modifican las ramas de Mac, Windows ni development.

## Pruebas de desarrollo

```powershell
npm.cmd ci
npm.cmd test
```

La instalación de dependencias de escritorio solo se necesita para las pruebas completas o Electron; no es necesaria para el comando de compilación Android.

[Planificación y matriz Android](docs/android/README.md).
