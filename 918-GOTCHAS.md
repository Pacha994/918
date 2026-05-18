# 918 - Trampas conocidas

> Bugs, workarounds y rarezas que ya costaron tiempo. Compartido con 918TAG en lo que aplica al stack común. Para gotchas de Next.js 16, Prisma, JSX, ENV, o copiar código desde Notion: ver `918TAG/GOTCHAS.md`. Mismo stack, mismas trampas.
>
> **Nota para Loco**: este archivo está más liviano que el de 918TAG porque el repo está menos avanzado y hay menos sesiones de debug acumuladas. Va a crecer rápido cuando arrancamos PATCH y F1.2.

## Auth ausente hasta F4.3

### `tallerId` hardcoded en rutas actuales

Hoy todas las rutas que necesitan `tallerId` lo toman de un valor fijo. **`[VERIFICAR ubicación]`** (probablemente `src/lib/constants.js`, o inline en cada handler).

**Riesgos:**
- Si seedeás un taller nuevo y borrás el viejo, todas las rutas rompen porque apuntan al ID viejo.
- Cuando llegue F4.3, hay que hacer search & replace global para sacar el hardcoding.

**Workaround temporal:** dejar siempre el mismo taller seedeado en la DB, no borrarlo aunque hagas otros experimentos. Si necesitás cambiarlo, actualizá la constante en un solo lugar y verificá que todos los handlers la importan de ahí (no que la repitan inline).

## PWA

### `next-pwa` no se usa

Por decisión arquitectónica, manejamos manifest y SW a mano. Si en algún momento se sugiere instalar `next-pwa`, ver decisiones en `CLAUDE.md` (está unmaintained y queremos control fino del cache).

### Service Worker cacheando versiones viejas

Si pusheás cambios y en mobile no aparecen, casi seguro es el SW cacheando.

**Fix manual:**
1. En el celular, borrar el SW desde DevTools remotos (`chrome://inspect` desde Chrome desktop con cable USB).
2. O bumpear la versión del SW en `public/sw.js` (cualquier comentario que cambie el hash del archivo sirve para forzar update en clientes existentes).
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

(Sección a llenar cuando se construya el PATCH y aparezcan los primeros bugs reales del drag & drop entre columnas. Por ahora vacía.)

## Storage de fotos

### Decisión pendiente, F1.2 paso 3 bloqueado

No abrir paso 3 del registro hasta que la decisión esté tomada (Cloudflare R2 vs Uploadthing vs Supabase). La integración va a impactar también a 918TAG, así que la decisión tiene que servir para los dos productos. Una vez tomada, agregar la sección de integración acá con los gotchas que aparezcan (subida directa vs presigned URLs, límites de tamaño, manejo de progreso, errores de red en mobile).

## WhatsApp Business API

### Aprobación de templates puede tardar

Cuando se arme la integración, los templates de mensaje (precio, turno, hallazgo, lista, entregada) tienen que ser aprobados por Meta. Aprobación puede tardar 24-48hs y ser rechazada por wording. No empezar a probar el day-of-launch.

(Sección a llenar cuando se arranque F2.)

## Pendientes de llenar

- F1: PATCH transiciones del kanban (próxima sesión).
- F1.3: bottom sheet (próxima sesión).
- F1.2: registro de bici 4 pasos (después de decidir storage).
- F2+: integración WhatsApp.
