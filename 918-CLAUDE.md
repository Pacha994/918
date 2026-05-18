# 918 - Guía operativa para Claude Code

> Este archivo lo lee Claude Code automáticamente al arrancar en este repo. Mantenelo corto, específico, y actualizalo cuando algo cambie. Para trampas técnicas conocidas ver `GOTCHAS.md`.
>
> **Nota para Loco**: este draft tiene secciones que necesito que verifiques o corrijas porque están basadas en lo que sabés del repo y no tengo sesiones recientes del código (última actividad en Notion del 21/04). Marqué con `[VERIFICAR]` lo que tengo que confirmar con vos.

## Qué es

918 es el CRM B2B para talleres de bicicletas argentinos. Dos piezas: agente de WhatsApp que se hace cargo de toda la comunicación con el cliente final (precios, turnos, hallazgos con foto, resumen post-service), y PWA mobile-first con kanban de 5 columnas que el mecánico mueve. Tres cambios de estado disparan WhatsApp automáticos.

Frase interna: el mecánico mueve tarjetas, el agente mueve conversaciones, el kit mueve confianza.

PRD vigente: el doc "PRD - Regbi v0.1" en Notion (el título es histórico, el contenido describe 918).

## Stack

- Next.js 16 App Router
- Prisma 6
- Postgres en Railway
- Vanilla CSS, sin TypeScript, sin Tailwind
- Mobile-first 390px, dark-only
- PWA con manifest + Service Worker propios (no `next-pwa`)
- WhatsApp Business API (no URL scheme), integración pendiente
- MercadoPago API (Fase 2)
- Vercel para hosting

## Estructura de carpetas `[VERIFICAR estructura real]`

```
src/                    mismo patrón que 918TAG (verificar si está usando src/ o no)
  app/
    api/
      bicis/            kanban — GET + PATCH /[id] implementados
    page.js             kanban principal con drag & drop
  lib/
    prisma.js
prisma/
  schema.prisma         modelos: Taller, Cliente, Bicicleta, Service [VERIFICAR nombres exactos]
  seed.js               taller dummy + bicis de ejemplo
public/
  manifest.json         PWA manifest
  sw.js                 service worker
```

## Comandos frecuentes

```bash
npm run dev
npm run seed
npx prisma generate
npx prisma migrate dev --name <nombre>
psql "$DATABASE_URL"
git push origin develop
git push origin main
```

## Branch & commits

- `develop` para trabajo diario
- `main` para producción
- Conventional commits: `feat: F1.2 paso 1 y 2 del registro`, `fix: PATCH transición En reparación`

## Reglas inviolables

1. **Nunca em dashes.** Guion normal.
2. **Mobile-first 390px, dark-only.** Probado en celular real antes de mergear.
3. **Sin TypeScript, sin Tailwind.** Si se discute cambiar, va a Conocimiento de Notion como propuesta.
4. **`tallerId` está hardcoded** porque auth no existe hasta F4.3. Cuando agregues rutas nuevas, usá la constante existente, no inventes un valor distinto. Search & replace global cuando llegue F4.3. `[VERIFICAR ubicación de la constante]`
5. **No commitear `.env.local`.**
6. **Cambios de schema → `prisma generate`** y a veces `rm -rf .next`.

## Decisiones arquitectónicas vigentes

- **Stack idéntico a 918TAG.** Razón: simplicidad operativa, un solo mental model para builder solo, mismo patrón de deploy. Si una decisión sirve para uno, sirve para los dos.
- **PWA con manifest + SW propios, NO `next-pwa`.** Razón: `next-pwa` está unmaintained, mejor manejar manifest y SW manualmente para tener control de cache y versiones.
- **Kanban de 5 columnas fijas:** Agendada → Ingresada → En reparación → Lista → Entregada. Tres transiciones disparan WhatsApp (a definir cuáles cuando se integre WhatsApp Business API). Las columnas no se modifican sin discusión, la lógica del agente depende del set fijo.
- **Auth no existe hasta F4.3:** rutas actuales necesitan `tallerId`, hoy hardcoded. Decisión consciente para no bloquear F1-F3 en construcción de auth. Trade-off: si seedeás un taller nuevo, el ID rota y todo rompe.
- **Storage de fotos: PENDIENTE** (decisión semana 4-9 mayo, compartida con 918TAG). Bloquea F1.2 paso 3 (subida de fotos en registro de bici).
- **WhatsApp Business API, no `wa.me/`.** Razón: necesitamos templates aprobados, recepción de replies y disparo de conversaciones automatizadas. URL scheme no sirve, es de un solo lado.
- **Usuario primario es el taller, secundario el ciclista.** El ciclista no se registra, no baja app, no crea cuenta. Solo recibe WhatsApp y abre URL pública. Toda decisión de UX prioriza al taller.

## Estado del MVP

**Completado:**
- F0: PWA manifest + service worker + layout.js + seed de taller
- F1.1: kanban completo — KanbanCard, GET /api/bicis, PATCH /api/bicis/[id] (5 transiciones), drag & drop HTML5 + touch con optimistic update y revert, bottom sheet DetalleBici con hallazgos

**Pendiente próximo:**
- F1.2: registro de bici en 4 pasos (cliente → bici → fotos → confirmación). Paso 3 bloqueado por decisión de storage.
- F1.3: (ya integrado en DetalleBici, ver F1.1)

**Pendiente más adelante:**
- F2: integración WhatsApp Business API + templates
- F3: agente conversacional (Claude API + handoff a mecánico)
- F4: auth real (F4.3 elimina el hardcoding de `tallerId`)
- F5+: MercadoPago, multi-taller, analytics

## Variables de entorno requeridas `[VERIFICAR nombres reales]`

```
DATABASE_URL=<Railway postgres>
NEXT_PUBLIC_BASE_URL=http://localhost:3000
# WhatsApp Business API + MercadoPago: pendientes
```

## Relación con 918TAG

Productos separados, ciclos de venta independientes, repos distintos, DBs distintas. Network effect cuando una bici con kit 918TAG entra a un taller con 918: identificación automática vía NFC, historial fluyendo entre ambos. Conexión a construir, no parte del MVP de F1.

## Lo que vive en Notion, no acá

- PRD completo y value prop con tres pilares (tiempo, dinero, datos)
- Use cases v.0.1 y User Journeys MVP
- Roadmap por fases (F0 a F4+)
- Análisis de estrategia del 27/2/26 que motivó el foco en software taller primero
- Auditoría Opus 4.7 del 17 de abril
- Tareas DB y Conocimiento DB

Si una decisión no está acá ni en Notion, no existe. Documentar antes de mergear.
