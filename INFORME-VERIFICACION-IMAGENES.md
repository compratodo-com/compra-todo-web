# Informe: verificación de imágenes de productos

_Última actualización: 2026-07-16_

Este documento resume el trabajo hecho sobre el buscador de imágenes de
Compra-Todo ([www.compra-todo.com](https://www.compra-todo.com)): el problema, la causa raíz,
la solución implementada, cómo operarla y qué queda pendiente.

---

## 1. El problema

Muchos productos mostraban fotos que **no correspondían** al producto:
banners publicitarios, fotos de stock genéricas o productos de otra marca.

## 2. Cómo funciona el sistema (contexto)

- **Deploy:** Vercel + Next.js 16, base de datos Postgres (Prisma), `pnpm`.
- **Motor autónomo:** `src/lib/agents/runner.ts` define ~11 agentes. El `curator`
  arma el catálogo (desde la API de MercadoLibre si hay credenciales, o un
  catálogo sintético si no). Otros agentes manejan tendencias, promociones,
  eventos, correos, etc.
- **Cron:** `vercel.json` llama `/api/cron/agents?agent=all` una vez al día.
- **Imágenes en producción:** la base guarda **URLs externas directas**
  (hotlink) de distintos CDNs (MercadoLibre, Paris.cl, Amazon, eBay, etc.).

## 3. Causa raíz (lo que encontramos)

1. **El `image_hunter` no corría solo.** No estaba incluido en `runAllAgents()`,
   así que el cron diario nunca lo ejecutaba.
2. **Se aceptaba la primera imagen sin verificar.** El buscador tomaba el primer
   resultado del scraping (Paris/Google), que muchas veces era un banner, una
   promo o un producto equivocado.
3. **Fuentes genéricas.** Pexels/Picsum se usaban como respaldo, pero son bancos
   de fotos de stock que nunca traen el producto real → mismatch garantizado.
4. **`CRON_SECRET` no existía** en Vercel → el cron automático nunca se autenticó
   (los agentes probablemente no corrían solos en producción).

## 4. La solución

### Verificación con IA + heurísticas

Nuevo módulo `src/lib/images/verify.ts`:

- **Heurísticas gratis** (sin red): descartan por URL los banners/logos
  (`banner`, `cta`, `hero`, `logo`, …) y los dominios de stock (pexels, picsum,
  unsplash). Matan los casos más groseros sin gastar nada.
- **Groq Vision** (modelo `meta-llama/llama-4-scout-17b-16e-instruct`, vía el SDK
  `openai` con `baseURL` de Groq — sin dependencias nuevas). Puntúa de 0 a 1 qué
  tan bien la imagen representa al producto.
- **Descarga propia + base64:** en vez de pasarle la URL a Groq (que fallaba por
  redirects 302 y hotlink), **descargamos la imagen nosotros** (siguiendo
  redirects, con user-agent de navegador) y le mandamos los bytes. Esto fue clave
  para que la verificación funcione en producción.

### Lógica de decisión (segura, sin regresiones)

`pickBestVerifiedImage` en `verify.ts`:

- Junta candidatos de varias fuentes **+ la imagen actual** como candidata.
- Puntúa hasta 3 candidatos (corte temprano si uno supera 0.9).
- **Conserva la imagen actual** salvo que un retador la supere por un **margen**
  (evita cambiar imágenes buenas por ruido del modelo).
- Si **no se puede verificar** la imagen actual (Groq no la pudo descargar), la
  **conserva** — un fallo de descarga no es evidencia de que sea mala.
- Solo reemplaza cuando hay evidencia positiva (un candidato que supera el umbral
  de 0.6). Si no encuentra nada mejor, deja lo que había.

### Integración

- `src/lib/agents/image-hunter-pro.ts`: orquesta el proceso por producto. Solo
  revisa productos cuya imagen **no** viene de fuentes ya confiables (ML/Paris).
- `src/lib/agents/runner.ts`: el agente `image_hunter` usa el hunter pro y **entra
  al cron diario** (`runAllAgents`).
- `src/app/api/cron/agents/route.ts`: el endpoint acepta parámetros extra y define
  `maxDuration = 60` para no chocar con el timeout de Vercel.
- Se eliminó `image-hunter.ts` (versión vieja sin verificación).

## 5. Cómo operarlo

El endpoint del cron permite correr el verificador a mano. Reemplaza
`TU_CRON_SECRET` por el valor real (está en Vercel → Environment Variables).

**Simular sin escribir nada (recomendado primero):**
```
https://www.compra-todo.com/api/cron/agents?key=TU_CRON_SECRET&agent=image_hunter&dry=1&max=6&offset=0
```

**Aplicar los cambios de verdad:** la misma URL **sin** `&dry=1`.

Parámetros:
- `dry=1` — simula; devuelve los cambios propuestos sin tocar la base.
- `max=N` — cuántos productos procesar en la corrida (acota el tiempo).
- `offset=N` — desde qué producto empezar (para recorrer en tandas: 0, 6, 12…).

La respuesta trae `candidates` (total que necesita revisión), `changes` (cambios
propuestos con `before`/`after`/`score`) y, en dry-run, un `trace` con el detalle
por producto.

⚠️ La URL lleva tu `CRON_SECRET`: trátala como sensible, no la compartas.

## 6. Costo (tokens de Groq)

- Tier gratis de Groq: **500.000 tokens/día**.
- Cada imagen verificada cuesta ~5.000 tokens (visión).
- Un barrido completo (~18 productos × 3 verificaciones) ≈ **270.000 tokens** →
  **cabe en un día** con margen.
- El uso en régimen normal (cron diario + productos nuevos) es sostenible en el
  tier gratis. Conviene **no** correr barridos repetidos el mismo día.

## 7. Limitaciones conocidas

- **Algunos hosts no se pueden descargar** (p. ej. `cougargaming.com`,
  `media.currys.biz` bloquean). Sus imágenes se **conservan** por precaución.
- Si el scraping no encuentra un buen reemplazo para un producto, su imagen
  (aunque sea de stock) se mantiene hasta que aparezca algo mejor.
- El presupuesto diario de Groq puede agotarse si se hacen muchas pruebas.

## 8. Pendientes / mejoras futuras

- **Arreglar el cron automático:** `vercel.json` usa `key=@CRON_SECRET`, que
  probablemente no se interpola. Conviene migrar a la autenticación nativa de
  Vercel (header `Authorization: Bearer ${CRON_SECRET}`) para que los agentes
  corran solos cada día.
- **Redimensionar imágenes a ~512px** antes de enviarlas a Groq (con `sharp`) →
  recorta el costo en tokens ~8x. Útil si el presupuesto diario queda corto.
- **Marcar productos ya verificados** para que el cron no los revise cada día.
- **Seguridad:** rotar el token de GitHub (`ghp_…`) que está en texto plano en la
  URL del remoto de git.

## 9. Historial de cambios (commits)

- `fix: verificar imágenes con Groq Vision antes de asignarlas`
- `chore: eliminar image-hunter.ts (código muerto)`
- `feat: paginación y maxDuration para el verificador de imágenes`
- `feat: diagnóstico (trace) en dry-run del verificador de imágenes`
- `fix: descargar imagen y enviar base64 a Groq (evita fallos de fetch)`

## 10. Estado actual

El sistema está **desplegado y funcionando**. Validado en producción: reemplazó
correctamente un banner por la foto real del producto (score 1.0) y conservó las
imágenes buenas. Falta hacer el **barrido completo** cuando el presupuesto diario
de Groq se reinicie (correr las URLs de la sección 5 en tandas).
