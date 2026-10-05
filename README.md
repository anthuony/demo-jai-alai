# Jai Alai · Meta + BCV automático

Esta versión mantiene la web, carrito, delivery y pedido por WhatsApp, y añade:

- Feed real de Instagram cargado desde la API oficial de Meta.
- Publicaciones de @jaialai_restaurant y, cuando Meta lo permite para la cuenta/app, contenido público donde la cuenta está etiquetada.
- Fallback automático a fotos locales si Meta está temporalmente indisponible.
- Tasa BCV consultada desde el backend y refrescada automáticamente; el sitio vuelve a comprobar la fuente con una caché máxima de 30 minutos.
- Precios en USD + equivalente en bolívares en menú, carrito y mensaje de WhatsApp.
- El token de Meta nunca queda expuesto en el navegador.

## IMPORTANTE

Esta versión ya no puede desplegarse solo con “Upload static files”, porque la integración con Meta necesita un Worker backend para proteger el token.

## 1. Conectar Instagram una sola vez

La cuenta debe ser Profesional (Business o Creator). En Meta for Developers crea/configura una app con **Instagram API with Instagram Login** y autoriza `@jaialai_restaurant` con el permiso básico de lectura (`instagram_business_basic`). Genera un token de acceso de larga duración.

No pegues ese token en `app.js` ni en GitHub.

## 2. Guardar el token en Cloudflare

Desde la carpeta del proyecto:

```bash
npm install
npx wrangler login
npx wrangler secret put META_ACCESS_TOKEN
```

Pega el token cuando Wrangler lo solicite.

## 3. Desplegar conservando demo-jai-alai

```bash
npm run deploy
```

El `wrangler.jsonc` ya usa el nombre `demo-jai-alai`, por lo que el deploy actualiza ese Worker.

## 4. Probar

- `/api/instagram` debe devolver `configured: true` y una lista `items`.
- `/api/bcv` debe devolver `rate`, `updatedAt` y `checkedAt`.
- En la web, la sección Instagram debe mostrar publicaciones reales.
- En el menú, el equivalente en Bs debe aparecer junto al precio en USD.

## Sobre contenido de clientes

El Worker intenta combinar publicaciones de la cuenta y medios públicos donde la cuenta está etiquetada. Si la app de Meta no tiene permiso/acceso para la arista de etiquetas, la web seguirá mostrando las publicaciones de @jaialai_restaurant sin romperse.

## Sobre la tasa BCV

El backend consulta la tasa publicada por el proveedor configurado y usa una caché máxima de 30 minutos. Por eso no queda una tasa fija: cuando cambia la tasa diaria, la web toma la nueva automáticamente sin volver a desplegar.
