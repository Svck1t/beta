# Generador de carruseles — Foto Fast

Sube la foto de un producto y genera copy + diseño para carruseles de Instagram/Facebook.

## Estructura

- `index.html` — la app (frontend, estático)
- `api/generate.js` — función serverless que llama a la API de Anthropic (tu key nunca queda expuesta en el navegador)

## Deploy en Vercel

1. Sube esta carpeta a un repo de GitHub.
2. En Vercel: **Add New → Project** → importa el repo.
3. Framework Preset: deja **Other** (no necesita build, Vercel detecta `api/` solo).
4. Antes de hacer deploy (o después, en Settings → Environment Variables) agrega:
   - `ANTHROPIC_API_KEY` = tu API key de [console.anthropic.com](https://console.anthropic.com)
5. Deploy.

Si agregas la variable de entorno después del primer deploy, tienes que hacer un **Redeploy** para que tome el cambio.

## Notas

- El modelo usado es `claude-sonnet-5`. Si Anthropic saca un modelo más nuevo y quieres actualizarlo, se cambia en `api/generate.js`.
- Los fondos de las slides (papel, tinta, cálido, foto desenfocada) son generados por canvas, no por IA — no consumen tokens extra.
- Costo: cada carrusel generado es una sola llamada a la API con una imagen (uso normal de tu plan de Anthropic).
