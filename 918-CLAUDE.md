# 918 - Guía operativa para Claude Code

> Este archivo lo lee Claude Code automáticamente al arrancar en este repo. Mantenelo corto, específico, y actualizalo cuando algo cambie. Para trampas técnicas conocidas ver `918-GOTCHAS.md`.
>
> **Estado de este doc:** reescrito el 08/08/2026 verificando cada afirmación contra el código real (no contra Notion ni contra la versión anterior de este archivo). Último commit del repo al momento de esta auditoría: `3783930`, 18 de mayo de 2026 — el repo lleva casi 3 meses sin tocarse.

## Qué es

918 es el CRM B2B para talleres de bicicletas argentinos. Dos piezas pensadas: agente de WhatsApp que se hace cargo de toda la comunicación con el cliente final (precios, turnos, hallazgos con foto, resumen post-service), y PWA mobile-first con kanban que el mecánico mueve. Hoy solo la segunda pieza está construida — ver Estado del MVP.

Frase interna: el mecánico mueve tarjetas, el agente mueve conversaciones, el kit mueve confianza.

PRD vigente: el doc "PRD - Regbi v0.1" en Notion (el título es histórico, el contenido describe 918).

## Stack

- Next.js 16 App Router (`turbopack: {}` en `next.config.js`)
- Prisma 6 (`^6.19.3`)
- Postgres en Railway, todo bajo el schema `app918` (Prisma `multiSchema` preview feature) — **instancia Railway separada de 918TAG**, confirmado por hosts de conexión distintos, cero superposición.
- Vanilla CSS (CSS Modules), sin TypeScript, sin Tailwind
- PWA con manifest + Service Worker propios vía `@serwist/next` (no `next-pwa`): la fuente es `src/sw.js`, el build la compila a `public/sw.js` (no editar `public/sw.js` a mano, se pisa en cada build)
- WhatsApp Business API: **no integrado**, cero código — el texto sobre "el agente" en el onboarding es copy de producto, no funcionalidad real
- MercadoPago: **no integrado**, cero código
- Vercel para hosting

## Estructura de carpetas (verificada, `find src -type f`)

```
src/
  middleware.js          gatea /kanban /registro /configuracion /bici (privadas) y /login /onboarding
                          (públicas) según la cookie 918_session. Ver sección Auth más abajo — el
                          gate existe, pero no está conectado a las queries de datos.
  sw.js                  fuente del service worker, Serwist la compila a public/sw.js
  app/
    page.js              redirect fijo a /kanban (sin lógica propia — si no hay sesión, el
                          middleware lo intercepta antes y manda a /login)
    layout.js, globals.css
    login/page.js         busca taller por WhatsApp (sin password), setea cookie 918_session
    onboarding/page.js     alta inicial de un taller nuevo (nombre, WhatsApp, servicios)
    kanban/
      page.js               kanban principal, drag & drop (HTML5 + touch) con optimistic update
      KanbanCard.js          card individual — la que se usa de verdad, importada por page.js
      DetalleBici.js         bottom sheet de detalle por bici
      HallazgoForm.js        alta de hallazgo (precio, descripción, foto)
    bici/[id]/page.js
    registro/page.js       alta de bici en 4 pasos: cliente → bici+fotos → motivo → confirmación.
                            Fotos: cámara vía <input capture="environment">, comprimidas client-side
                            con canvas (maxWidth 1000px, calidad 0.7) y guardadas como base64.
    historial/
      page.js               historial de servicios con métricas, separadores por mes, tooltips
      DetalleServicio.js
    configuracion/page.js  ABM de servicios del taller (PATCH /api/taller)
    offline/page.js        fallback de la PWA sin conexión
    api/
      auth/login/route.js    POST — busca Taller por whatsapp, setea cookie 918_session (id del
                              taller en texto plano, sin firmar, sin password)
      auth/logout/route.js
      taller/route.js        GET/PATCH — usa TALLER_ID hardcoded (ver Auth más abajo)
      clientes/route.js      GET/POST — usa TALLER_ID hardcoded
      bicis/route.js, bicis/[id]/route.js   CRUD + PATCH de transición de estado — usan TALLER_ID hardcoded
      hallazgos/route.js, hallazgos/[id]/route.js   alta y aprobar/rechazar — sin validar que
                              quien aprueba sea el cliente real (no hay ninguna ruta pública en
                              todo el repo, se aprueba desde el propio kanban del taller)
      historial/route.js, historial/[id]/route.js, historial/resumen/route.js   usan TALLER_ID hardcoded
  components/KanbanCard/KanbanCard.js   [código muerto] — nada lo importa, el que se usa es
                                          src/app/kanban/KanbanCard.js. Candidato a borrar.
  lib/
    prisma.js
    config.js             export const TALLER_ID = process.env.TALLER_ID || '<id hardcoded de fallback>'
prisma/
  schema.prisma           modelos reales: Taller, Cliente, Bici, FotoRecepcion, Hallazgo,
                           EventoHistorial. No hay modelo "Bicicleta" ni "Service" (nombres que
                           decía una versión vieja de este doc). Bici.modelo es un solo campo de
                           texto libre — no hay marca ni año como campos separados.
  seed.js                 taller dummy + bicis de ejemplo
public/
  manifest.json           PWA manifest
  sw.js                   service worker COMPILADO (build output, no tocar a mano)
  icons/
```

## Comandos frecuentes

```bash
npm run dev
npm run seed
npx prisma generate
npx prisma migrate dev --name <nombre>
psql "$DATABASE_URL"
git push origin main
```

## Branch & commits

- **No existe rama `develop`** — a pesar de lo que decía este archivo antes. `git branch -a` muestra una sola rama: `main`. Todo el trabajo se commitea directo ahí.
- Conventional commits: `feat: F1.2 paso 1 y 2 del registro`, `fix: PATCH transición En reparación`

## Reglas inviolables

1. **Nunca em dashes.** Guion normal.
2. **Mobile-first 390px, dark-only.** Probado en celular real antes de mergear.
3. **Sin TypeScript, sin Tailwind.** Si se discute cambiar, va a Conocimiento de Notion como propuesta.
4. **`TALLER_ID` está hardcoded en `src/lib/config.js`** y lo importan `bicis`, `clientes`, `historial` (las 3 rutas) y `taller` — 6 archivos en total. Hay login y sesión reales (cookie `918_session`), pero ninguna ruta de API la lee todavía: todo el mundo pega contra el mismo taller sin importar quién esté logueado. Cuando agregues una ruta nueva que necesite `tallerId`, importá la constante existente, no inventes un valor distinto — y no asumas que conectar el login arregla esto solo, hay que tocar cada handler. Ver Auth más abajo.
5. **No commitear `.env.local`.**
6. **Cambios de schema → `prisma generate`** y a veces `rm -rf .next`.

## Auth y sesión — estado real (el hallazgo más importante de esta auditoría)

Hay más construido de lo que parece a primera vista, pero está desconectado:

- **Login real:** `/login` busca el `Taller` por número de WhatsApp (sin password) y `POST /api/auth/login` setea la cookie `918_session` con el `id` del taller en texto plano (no es un JWT, no está firmada).
- **Middleware real:** `src/middleware.js` gatea `/kanban` `/registro` `/configuracion` `/bici` (redirige a `/login` si no hay cookie) y al revés redirige `/login`/`/onboarding` a `/kanban` si ya hay sesión.
- **El problema #1 a resolver:** ninguna ruta de API lee esa cookie. Todas las que necesitan `tallerId` (`bicis`, `clientes`, `historial`, `taller`) importan la constante `TALLER_ID` hardcoded de `lib/config.js`. Resultado: la sesión decide qué *pantallas* podés ver, pero no qué *datos* ves — si dos talleres se registran hoy, los dos leen y escriben sobre el mismo taller (el del fallback hardcodeado, salvo que se override por env var a nivel deploy completo, no por sesión). Esto es lo primero a resolver en la próxima fase de trabajo ("Fase 2"): reemplazar el import de `TALLER_ID` por el `tallerId` de la cookie en esos 6 handlers.

## Decisiones arquitectónicas vigentes

- **Stack idéntico a 918TAG.** Razón: simplicidad operativa, un solo mental model para builder solo, mismo patrón de deploy. Si una decisión sirve para uno, sirve para los dos.
- **PWA con manifest + SW propios, NO `next-pwa`.** Razón: `next-pwa` está unmaintained, mejor manejar manifest y SW manualmente para tener control de cache y versiones. Implementado con `@serwist/next`.
- **Kanban de 5 columnas fijas:** `ingresada → diagnostico → reparacion → lista → entregada` (enum `EstadoBici` real del schema — no existe columna "Agendada", corrección sobre una versión anterior de este doc). Transiciones pensadas para disparar WhatsApp automático cuando se integre la API (a definir cuáles).
- **Storage de fotos: RESUELTO, pero es deuda técnica a sabiendas.** Compresión client-side con `<canvas>` (maxWidth 1000px, calidad 0.7 JPEG) y el resultado se guarda como string base64 directo en `FotoRecepcion.url` (columna de Postgres). Funciona hoy para volumen bajo. No escala: infla la DB, no hay CDN, no hay optimización de entrega. Migrar a un storage real (R2, como en 918TAG) antes de crecer en volumen de fotos.
- **Auth de sesión existe, pero la capa de datos la ignora** — ver sección Auth arriba. No es "auth no existe", es "auth existe pero no está cableada".
- **WhatsApp Business API, no `wa.me/`** (decisión, no implementación). Razón: necesitamos templates aprobados, recepción de replies y disparo de conversaciones automatizadas. URL scheme no sirve, es de un solo lado.
- **Usuario primario es el taller, secundario el ciclista.** El ciclista no se registra, no baja app, no crea cuenta — en la visión del producto solo recibe WhatsApp y abre una URL pública. Hoy esa URL pública no existe: no hay ninguna ruta sin auth en todo el repo, así que la aprobación/rechazo de hallazgos la hace el propio mecánico desde el kanban, no el cliente.

## Estado del MVP

**Completado y funcionando:**
- PWA: manifest + service worker propio (Serwist) + página offline + layout + seed de taller
- Kanban completo: `KanbanCard`, `GET /api/bicis`, `PATCH /api/bicis/[id]` (transiciones de estado), drag & drop HTML5 + touch con optimistic update y revert, bottom sheet `DetalleBici` con hallazgos
- **Registro de bici en 4 pasos, completo, con cámara** (cliente → bici + fotos → motivo → confirmación). No está bloqueado — la decisión de storage que lo frenaba ya se resolvió (ver más arriba).
- **Historial de servicios con métricas**, separadores por mes y tooltips — funcionando, no estaba mencionado en una versión anterior de este doc.
- Onboarding de taller nuevo y Configuración (ABM de servicios del taller).
- Login + sesión por cookie, con middleware gateando rutas privadas (ver limitación en la sección Auth).

**Pendiente — el problema #1, antes que cualquier feature nueva:**
- Conectar la sesión (`918_session`) con las 6 rutas de API que hoy usan `TALLER_ID` hardcoded. Sin esto, multi-taller no funciona en absoluto.

**Pendiente más adelante:**
- Integración WhatsApp Business API + templates (cero código hoy)
- Agente conversacional (Claude API + handoff a mecánico) — cero código hoy
- Portal público para el cliente final (aprobar/rechazar hallazgos, ver historial) — no existe ninguna ruta pública en el repo
- MercadoPago, multi-taller real, analytics
- Migrar storage de fotos de base64-en-Postgres a un storage real

## Variables de entorno (verificadas contra `.env`)

```
DATABASE_URL=<Railway postgres, host distinto al de 918TAG>   # la única que lee prisma/schema.prisma
DATABASE_PUBLIC_URL=<Railway postgres, endpoint público>       # presente pero no referenciada por
                                                                 # ningún código — convención estándar
                                                                 # de Railway al linkear el plugin Postgres
NEXT_PUBLIC_APP_URL=http://localhost:3000                      # dominio base para links generados
                                                                 # (aprobación de hallazgos). NEXT_PUBLIC_
                                                                 # → se congela en el bundle en next build,
                                                                 # en Vercel hay que setearla en el dashboard
                                                                 # ANTES de buildear producción (Fase 6),
                                                                 # cambiarla después no alcanza sin redeploy
# WhatsApp Business API + MercadoPago: sin variables todavía, no hay integración que las use
```

`NEXT_PUBLIC_BASE_URL` (nombre distinto al de arriba) que figuraba antes en este doc **no existe en `.env` ni se usa en ningún lado del código** — sigue sin existir, no confundir con `NEXT_PUBLIC_APP_URL`.

## Relación con 918TAG

Productos separados, ciclos de venta independientes, repos distintos, **DBs distintas confirmado** (instancias Railway con host y credenciales propias, sin superposición). Network effect cuando una bici con kit 918TAG entra a un taller con 918: identificación automática vía NFC, historial fluyendo entre ambos. Conexión a construir, no parte del MVP actual.

## Lo que vive en Notion, no acá

- PRD completo y value prop con tres pilares (tiempo, dinero, datos)
- Use cases v.0.1 y User Journeys MVP
- Roadmap por fases
- Análisis de estrategia del 27/2/26 que motivó el foco en software taller primero
- Auditoría Opus 4.7 del 17 de abril
- Tareas DB y Conocimiento DB

Si una decisión no está acá ni en Notion, no existe. Documentar antes de mergear.
