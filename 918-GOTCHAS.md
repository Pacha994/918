# 918 - Trampas conocidas

> Bugs, workarounds y rarezas que ya costaron tiempo. Compartido con 918TAG en lo que aplica al stack común. Para gotchas de Next.js 16, Prisma, JSX, ENV, o copiar código desde Notion: ver `918TAG/GOTCHAS.md`. Mismo stack, mismas trampas.
>
> **Nota para Loco**: este archivo está más liviano que el de 918TAG porque el repo está menos avanzado y hay menos sesiones de debug acumuladas. Va a crecer rápido cuando arrancamos PATCH y F1.2.

## Sesión existe, pero las rutas de API no la leen

### `tallerId` hardcoded en rutas actuales

Hay login real (`/login` busca el `Taller` por WhatsApp), sesión real (cookie `918_session`) y `src/middleware.js` gateando rutas privadas. Lo que falta es conectar esa sesión con los datos: todas las rutas que necesitan `tallerId` lo toman de la constante `TALLER_ID` en **`src/lib/config.js`**, no de la cookie.

**Riesgos:**
- Si seedeás un taller nuevo y borrás el viejo, todas las rutas rompen porque apuntan al ID viejo.
- Multi-taller no funciona todavía: dos talleres logueados en simultáneo leen y escriben sobre el mismo `tallerId` hardcoded, sin importar cuál inició sesión.
- Cuando se conecte la sesión, hay que tocar cada handler que importa `TALLER_ID` (`bicis`, `clientes`, `historial`, `taller` — 6 archivos en total) para que lea el `tallerId` de la cookie en su lugar.

**Workaround temporal:** dejar siempre el mismo taller seedeado en la DB, no borrarlo aunque hagas otros experimentos. Si necesitás cambiarlo, actualizá la constante en `src/lib/config.js` y verificá que todos los handlers la importan de ahí (no que la repitan inline).

## PWA

### `next-pwa` no se usa

Por decisión arquitectónica, manejamos manifest y SW a mano. Si en algún momento se sugiere instalar `next-pwa`, ver decisiones en `CLAUDE.md` (está unmaintained y queremos control fino del cache).

### Service Worker cacheando versiones viejas

Si pusheás cambios y en mobile no aparecen, casi seguro es el SW cacheando.

**Fix manual:**
1. En el celular, borrar el SW desde DevTools remotos (`chrome://inspect` desde Chrome desktop con cable USB).
2. O bumpear la versión del SW en **`src/sw.js`** (cualquier comentario que cambie el hash del archivo sirve para forzar update en clientes existentes) — **no en `public/sw.js`**, que es build output: Serwist lo compila desde `src/sw.js` (`swSrc`/`swDest` en `next.config.js`) y lo pisa en cada build, así que cualquier edición manual ahí se pierde.
3. Recargar con cache disabled.

**Fix preventivo:** versionar el SW automáticamente al deployar (poner el commit hash en un comentario del SW como build step).

## Onboarding / Settings

### `POST /api/taller` creaba un taller con ID distinto a `TALLER_ID`

`POST /api/taller` originalmente usaba `findUnique({ where: { whatsapp } })` y si no encontraba nada creaba un taller con ID auto-generado por Prisma, nunca coincidía con `TALLER_ID`. Settings hace `GET /api/taller` → `findUnique({ where: { id: TALLER_ID } })` → registro distinto, datos del onboarding nunca visibles.

Corregido con `upsert({ where: { id: TALLER_ID } })` para que onboarding y settings siempre referencien el mismo registro.

## CSS / Layout

### `100vh` no es el viewport visible en mobile Safari

`100vh` en mobile Safari equivale a la altura del viewport con la barra de dirección oculta, que es más alto que el viewport visible real. Esto genera scroll innecesario aunque el contenido entre en pantalla.

Usar `100dvh` (dynamic viewport height) en su lugar:
- Páginas con un scroll container interno (`overflow-y: auto` en un hijo): `height: 100dvh + overflow: hidden` en el `.page`.
- Páginas que crecen con el contenido y scrollean como un todo: `min-height: 100dvh` en el `.page`.

## Drag & drop del kanban

(Construido en `d163f3b`, PATCH de transición de estado incluido. Sin gotchas puntuales identificados en el historial de commits posterior — se llena acá si aparece alguno.)

## Storage de fotos

### Resuelto con base64 client-compressed — es deuda técnica, no una integración real

No se terminó eligiendo entre Cloudflare R2 / Uploadthing / Supabase. La solución real: `comprimirFoto()` en `src/app/registro/page.js` comprime client-side con `<canvas>` (maxWidth 1000px, calidad 0.7 JPEG) y el resultado se guarda como string base64 directo en `FotoRecepcion.url` (columna de Postgres).

**Riesgos conocidos:**
- Infla la DB — cada foto pesa varias veces más como base64 que como binario.
- No hay CDN: cada carga de página trae el base64 completo desde Postgres, no un asset optimizado.
- No escala con volumen — sirve para F&F con pocas fotos por bici, no para producción real.

Si se migra a un storage real (R2, como en 918TAG), agregar acá los gotchas que aparezcan (subida directa vs presigned URLs, límites de tamaño, manejo de progreso, errores de red en mobile, y migración de las fotos ya guardadas como base64).

## WhatsApp Business API

### Aprobación de templates puede tardar

Cuando se arme la integración, los templates de mensaje (precio, turno, hallazgo, lista, entregada) tienen que ser aprobados por Meta. Aprobación puede tardar 24-48hs y ser rechazada por wording. No empezar a probar el day-of-launch.

(Sección a llenar cuando se arranque F2.)

## Pendientes de llenar

- F1: PATCH transiciones del kanban — hecho (`d163f3b`).
- F1.3: bottom sheet — hecho (`DetalleBici`, ver `0bcc9ac`/`d05c498`).
- F1.2: registro de bici 4 pasos — hecho, storage resuelto con base64 (ver sección arriba).
- F2+: integración WhatsApp — sigue pendiente, cero código todavía.
