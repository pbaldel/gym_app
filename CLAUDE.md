# CLAUDE.md — Gym Log PWA

PWA personal para registrar entrenamientos de fuerza en un iPhone 15 Pro (Safari, instalada en la pantalla de inicio). Todo local, sin backend ni cuentas. Un único usuario.

## Stack

- Vite + React + TypeScript (strict)
- Dexie (IndexedDB) + `dexie-react-hooks` (`useLiveQuery`) para datos reactivos
- Recharts para gráficas
- vite-plugin-pwa (`registerType: 'autoUpdate'`, precache de todo el bundle; la app debe funcionar 100 % offline)
- React Router con `HashRouter` (hosting estático sin reescrituras)
- Despliegue estático por HTTPS (GitHub Pages, Netlify o Cloudflare Pages). Hace falta HTTPS para instalarla en el iPhone.

## Principios

1. **Rápida entre series**: registrar una serie = 1 toque si repites, ≤ 3 toques si cambias peso o repeticiones. Nada de teclado salvo que se quiera.
2. **Una mano, pulgar**: acciones principales abajo, botones ≥ 48 px de alto (las principales a 56–64 px), y nada importante en la franja superior.
3. **Oscuro por defecto** y respetar `prefers-color-scheme` si el usuario lo elige en Ajustes.
4. **Los datos son sagrados**: pedir persistencia, recordar que se haga la copia, guardar cada serie al instante y nunca perder una sesión a medias.
5. **Las métricas derivadas no se guardan**: los récords y los volúmenes se calculan a partir de las series.

## Modelo de datos (Dexie)

Convenciones: los `id` son `crypto.randomUUID()` (string), para poder fusionar importaciones sin choques. Las fechas van en epoch ms (`number`), el peso en kg (`number`, admite decimales como 1,25) y el borrado es suave (`archived`) en el catálogo.

```
exercises        id, name, muscleGroup, type, archived, createdAt, updatedAt
                 + notes?
  muscleGroup: 'pecho'|'espalda'|'hombro'|'biceps'|'triceps'|'cuadriceps'
               |'isquios'|'gluteo'|'gemelo'|'core'|'antebrazo'|'otro'
  type: 'maquina'|'peso_libre'|'polea'|'peso_corporal'

machineSettings  exerciseId (PK, 1:1 con exercise), updatedAt
                 + seat?, backrest?, rollers?, grip?, notes?, photoId?
                 (campos de texto libre: "4", "agujero 3", "agarre neutro")

photos           id, createdAt
                 + blob (Blob JPEG), width, height, bytes
                 (tabla aparte para no cargar blobs al listar ejercicios)

sessions         id, startedAt, endedAt?, status ('active'|'done')
                 + notes?

sessionExercises id, sessionId, exerciseId, order
                 + notes?
                 (un ejercicio dentro de una sesión; puede repetirse)

sets             id, sessionId, sessionExerciseId, exerciseId, order, completedAt
                 + weight, reps, rpe? (6–10, de 0,5 en 0,5), isWarmup (bool)
                 (exerciseId y sessionId están desnormalizados para las consultas de progreso)

settings         key (PK), value
                 theme, defaultRestSec, weightStep, lastBackupAt, schemaVersion
```

Índices de Dexie (versión 1):

```
exercises:        'id, name, muscleGroup, type, archived'
machineSettings:  'exerciseId'
photos:           'id'
sessions:         'id, startedAt, status'
sessionExercises: 'id, sessionId, exerciseId, [sessionId+order]'
sets:             'id, sessionExerciseId, sessionId, [exerciseId+completedAt]'
settings:         'key'
```

Reglas:
- Solo hay una sesión `active` a la vez. Al abrir la app, si existe, se ofrece reanudarla.
- `peso_corporal`: `weight` es el lastre extra (0 = solo peso corporal). En las gráficas se usan repeticiones o volumen de repeticiones.
- Las series de calentamiento (`isWarmup`) no cuentan para récords ni volumen.
- Cualquier cambio de esquema se hace con `db.version(n).upgrade(...)`, nunca editando la versión anterior.

### Métricas derivadas (funciones puras en `src/domain/metrics.ts`)

- **Peso máximo por sesión**: max(weight) de las series efectivas.
- **e1RM** (Epley): `weight * (1 + reps/30)`, solo si reps ≤ 12.
- **Volumen por sesión**: Σ weight × reps de las series efectivas.
- **Récords personales por ejercicio**: peso máximo, mejor e1RM, más repeticiones con un peso dado, serie de mayor volumen y sesión de mayor volumen, cada uno con fecha y enlace a su sesión.
- **Última vez**: la sesión `done` más reciente con ese `exerciseId` (o la actual si ya hay series) → lista de series.

## Pantallas y navegación

Barra de pestañas inferior con 4 pestañas (respetando `safe-area-inset-bottom`):

| Pestaña | Ruta | Contenido |
|---|---|---|
| Entrenar | `#/` | Si hay sesión activa: tarjeta "Reanudar". Si no, botón grande "Empezar sesión" y las últimas 5 sesiones. |
| Ejercicios | `#/exercises` | Catálogo con búsqueda y filtros (grupo, tipo), botón "+" y archivados ocultos. |
| Progreso | `#/progress` | Ejercicios ordenados por uso reciente, que llevan a su detalle de progreso. |
| Ajustes | `#/settings` | Tema, descanso por defecto, incremento de peso, copia de seguridad, estado del almacenamiento. |

Rutas secundarias (sin barra de pestañas o con botón de volver):

- `#/session/:id`: **sesión activa**, con la lista ordenada de ejercicios (resumen "3 × 8 @ 60 kg"), el botón "Añadir ejercicio" y "Terminar sesión" (pide confirmación).
- `#/session/:id/pick`: **selector de ejercicio**, con búsqueda, "recientes" arriba y creación rápida en línea.
- `#/session/:id/ex/:sessionExerciseId`: **registro de ejercicio** (la pantalla clave, ver abajo).
- `#/history` y `#/history/:sessionId`: historial y detalle editable de sesiones pasadas (se llega desde Entrenar).
- `#/exercises/new` y `#/exercises/:id/edit`: formulario del ejercicio + ajustes de máquina + foto.
- `#/exercises/:id`: **detalle del ejercicio**, con ajustes, foto, gráficas, récords e historial. Comparte componente con `#/progress/:id`.

### Pantalla "Registro de ejercicio" (prioridad máxima)

De arriba abajo:
1. Cabecera: nombre del ejercicio, grupo y un icono para editar los ajustes.
2. **Tarjeta "Última vez"** (plegable, abierta por defecto): fecha relativa ("hace 4 días") y series en chips: `60×8 · 60×8 · 62,5×6 (RPE 9)`.
3. **Tarjeta "Ajustes de máquina"** (solo para máquina o polea): asiento, respaldo, rodillos y agarre en una cuadrícula 2×2 con números grandes, más las notas y una miniatura de la foto que se amplía al tocarla. Se pueden editar en línea, porque los ajustes cambian.
4. Series ya hechas hoy: filas con nº, peso × reps y RPE. Al tocar una se edita y deslizando o con un botón se borra.
5. **Panel de entrada fijo abajo**:
   - Peso: `[−] 62,5 kg [+]` (el paso sale de Ajustes, 2,5 por defecto; con pulsación larga, paso fino de 1,25). Tocar el número abre el teclado `inputmode="decimal"`.
   - Reps: `[−] 8 [+]`.
   - RPE: fila de chips opcional `– 6 7 7,5 8 8,5 9 9,5 10`.
   - Botón principal "Guardar serie" de ancho completo y 64 px.
   - Valores precargados: la última serie de hoy o, si no hay, la primera serie efectiva de la última vez.
6. Al guardar arranca el **temporizador de descanso** (barra superior con cuenta atrás, ±15 s y "saltar"). Se calcula con timestamps, no con setInterval acumulado, para que aguante si la app pasa a segundo plano.

## Requisitos específicos de iOS / Safari

- `manifest`: `display: standalone`, `theme_color` y `background_color` oscuros, iconos de 180, 192 y 512 px. En `index.html`: `apple-touch-icon`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style=black-translucent` y `viewport-fit=cover`.
- Usar `env(safe-area-inset-*)` en la cabecera y la barra de pestañas.
- Llamar a `navigator.storage.persist()` en el primer arranque y mostrar el resultado en Ajustes. iOS puede borrar los datos de webs que no se usan; instalada en la pantalla de inicio el riesgo es menor, pero **la copia JSON es la red de seguridad real**.
- Evitar el zoom al enfocar campos (`font-size ≥ 16px` en los inputs), quitar `-webkit-tap-highlight-color` y usar `touch-action: manipulation`.
- No existe `navigator.vibrate` en iOS, así que el feedback es visual (flash o animación del botón).
- Wake Lock (`navigator.wakeLock`) es opcional y debe detectarse antes de usarse. Su soporte en PWA instalada depende de la versión de iOS.
- Exportar: usar `navigator.share({ files: [file] })` si `navigator.canShare` lo permite (permite guardar en Archivos o en iCloud) y, si no, un enlace `download` con un Blob. Importar: `<input type="file" accept="application/json">`.
- Fotos: `<input type="file" accept="image/*" capture="environment">`, redimensionar en un canvas a un lado máximo de 1280 px, codificar en JPEG con calidad 0,7 (objetivo < 200 KB) y guardar como Blob en `photos`. No depender de la codificación WebP en Safari.

## Copia de seguridad (JSON)

Formato:

```
{
  "app": "gym-log",
  "schemaVersion": 1,
  "exportedAt": 1731670000000,
  "data": {
    "exercises": [...], "machineSettings": [...], "sessions": [...],
    "sessionExercises": [...], "sets": [...], "settings": [...],
    "photos": [{ "id", "createdAt", "width", "height", "mime", "dataBase64" }]
  }
}
```

- Nombre del archivo: `gymlog-backup-YYYY-MM-DD.json`. Opción de exportar sin fotos (archivo ligero).
- La importación primero **valida** (app, schemaVersion y forma de cada tabla) y muestra un resumen ("120 sesiones, 35 ejercicios, 12 fotos").
- Hay dos modos: **Reemplazar** (borra todo y carga, con doble confirmación) y **Fusionar** (upsert por `id`, ganando el `updatedAt` más reciente donde exista).
- Todo dentro de una única transacción `rw` de Dexie: o se aplica completo o nada.
- Guardar `lastBackupAt` y mostrar un aviso discreto en Entrenar si han pasado más de 7 días.
- Si `schemaVersion` es antigua, migrarla en memoria antes de insertar.

## Estructura del proyecto

```
src/
  db/          schema.ts (Dexie), migrations, repositories (exercises, sessions, sets, photos)
  domain/      types.ts, metrics.ts (pura, testeada), lastTime.ts, prs.ts
  backup/      export.ts, import.ts, validate.ts
  features/
    workout/   Home, ActiveSession, ExercisePicker, LogExercise, RestTimer
    exercises/ ExerciseList, ExerciseForm, MachineSettingsCard, PhotoField
    progress/  ProgressList, ExerciseProgress (charts, PRs, history)
    history/   HistoryList, SessionDetail
    settings/  Settings, BackupSection, StorageStatus
  ui/          Stepper, BigButton, Chip, Sheet, TabBar, theme.css
  lib/         image.ts (compresión), format.ts (kg, fechas relativas), share.ts
```

- Estilos con CSS Modules o CSS plano con variables (`--bg`, `--surface`, `--text`, `--accent`). Sin librería de componentes pesada.
- Tests con Vitest para `domain/` y `backup/` (redondeos, e1RM, récords, ida y vuelta de exportar/importar).

## MVP por fases

**Fase 0. Base instalable**
Proyecto Vite + TS, PWA con manifest e iconos, tema oscuro, TabBar, esquema Dexie v1 y despliegue por HTTPS. *Hecho cuando* se instala en el iPhone, abre sin conexión y respeta el notch y la barra inferior.

**Fase 1. Catálogo**
CRUD de ejercicios (nombre, grupo, tipo), búsqueda y filtro, y ajustes de máquina de texto (sin foto). Archivar en lugar de borrar. *Hecho cuando* doy de alta mis ~20 ejercicios en menos de 5 minutos.

**Fase 2. Registrar entrenamiento (núcleo)**
Empezar, reanudar y terminar sesión. Selector de ejercicio con recientes. Pantalla de registro con steppers, RPE, precarga, edición y borrado de series. Tarjetas "Última vez" y "Ajustes". Historial básico. *Hecho cuando* hago un entrenamiento real sin fricción y sin perder datos al cerrar la app a mitad.

**Fase 3. Copia de seguridad**
Exportar (Share Sheet o descarga) e importar (validar, reemplazar o fusionar), aviso de copia y `storage.persist()`. *Hecho cuando* exporto, borro los datos de la web, importo y todo queda igual. *Va antes que las gráficas a propósito.*

**Fase 4. Progreso y récords**
Gráficas Recharts de peso máximo, e1RM y volumen por sesión, con rango de 1 mes, 3 meses, 1 año o todo. Lista de récords e historial por ejercicio. Insignia "¡Récord!" al guardar una serie que bate un récord. *Hecho cuando* las gráficas se ven bien a 393 px de ancho en modo oscuro.

**Fase 5. Fotos de máquina**
Captura y compresión, miniatura, visor a pantalla completa, reemplazar o borrar, e inclusión en la copia. *Hecho cuando* una foto ocupa menos de 250 KB y aparece en la pantalla de registro.

**Fase 6. Pulido (opcional)**
Temporizador de descanso configurable, plantillas o rutinas ("Día de pierna"), duplicar sesión anterior, Wake Lock, superseries, notas por serie, calculadora de discos y modo claro.

## Fuera del alcance

Backend, cuentas, sincronización entre dispositivos, notificaciones push, HealthKit, cardio o planes de entrenamiento con IA.

## Convenciones para Claude

- Responde y comenta en español. Los nombres de código, en inglés.
- No añadas dependencias sin justificarlo. Prioriza el tamaño del bundle y el arranque rápido.
- Toda lógica de cálculo va en `domain/` como funciones puras con tests.
- Los componentes no tocan Dexie directamente: usan repositorios y hooks.
- Probar siempre a 393 × 852 (iPhone 15 Pro) y en modo standalone.
