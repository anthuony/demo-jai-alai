const META_API_VERSION = 'v26.0';
const META_HOST = 'https://graph.instagram.com';
const BCV_PROVIDER = 'https://ve.dolarapi.com/v1/dolares/oficial';

function json(data, status = 200, cacheControl = 'no-store') {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'content-type': 'application/json; charset=utf-8',
      'cache-control': cacheControl,
      'x-content-type-options': 'nosniff'
    }
  });
}

async function cachedJson(request, ttlSeconds, producer) {
  const cache = caches.default;
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await producer();
  if (response.ok) {
    const copy = new Response(response.body, response);
    copy.headers.set('cache-control', `public, max-age=${ttlSeconds}, stale-while-revalidate=${ttlSeconds * 4}`);
    await cache.put(request, copy.clone());
    return copy;
  }
  return response;
}

async function getBcv(request) {
  return cachedJson(request, 1800, async () => {
    try {
      const upstream = await fetch(BCV_PROVIDER, {
        headers: { accept: 'application/json', 'user-agent': 'JaiAlaiWeb/1.0' },
        cf: { cacheTtl: 1800, cacheEverything: true }
      });
      if (!upstream.ok) throw new Error(`BCV provider HTTP ${upstream.status}`);
      const data = await upstream.json();
      const rate = Number(data.promedio ?? data.venta ?? data.price);
      if (!Number.isFinite(rate) || rate <= 0) throw new Error('Tasa BCV inválida');
      return json({
        rate,
        updatedAt: data.fechaActualizacion || data.fecha || new Date().toISOString(),
        checkedAt: new Date().toISOString(),
        source: 'BCV'
      }, 200, 'public, max-age=1800');
    } catch (error) {
      return json({ error: 'bcv_unavailable', message: String(error?.message || error) }, 502);
    }
  });
}

function imageForMedia(media) {
  if (media.media_type === 'VIDEO') return media.thumbnail_url || media.media_url || null;
  if (media.media_url) return media.media_url;
  if (Array.isArray(media.children?.data)) {
    const child = media.children.data.find(x => x.media_url || x.thumbnail_url);
    return child?.media_url || child?.thumbnail_url || null;
  }
  return null;
}

async function metaFetch(path, token, fields) {
  const url = new URL(`${META_HOST}/${META_API_VERSION}/${path}`);
  if (fields) url.searchParams.set('fields', fields);
  url.searchParams.set('access_token', token);
  const response = await fetch(url.toString(), {
    headers: { accept: 'application/json' },
    cf: { cacheTtl: 180, cacheEverything: true }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok || data.error) {
    const message = data?.error?.message || `Meta API HTTP ${response.status}`;
    const err = new Error(message);
    err.status = response.status;
    throw err;
  }
  return data;
}

async function discoverInstagramUser(token) {
  const me = await metaFetch('me', token, 'user_id,username,account_type,profile_picture_url');
  const id = me.user_id || me.id;
  if (!id) throw new Error('Meta no devolvió el identificador de la cuenta de Instagram');
  return { id, username: me.username || 'jaialai_restaurant' };
}

function normalizeMedia(media, source, defaultUsername) {
  const image = imageForMedia(media);
  if (!image || !media.permalink) return null;
  return {
    id: media.id,
    image,
    permalink: media.permalink,
    caption: media.caption || '',
    timestamp: media.timestamp || null,
    mediaType: media.media_type || 'IMAGE',
    username: media.username || defaultUsername || 'jaialai_restaurant',
    source
  };
}

async function getInstagram(request, env) {
  return cachedJson(request, 300, async () => {
    const token = env.META_ACCESS_TOKEN;
    if (!token) {
      return json({
        configured: false,
        message: 'Falta conectar la cuenta de Instagram en Cloudflare (META_ACCESS_TOKEN).',
        items: []
      }, 503);
    }

    try {
      const account = await discoverInstagramUser(token);
      const fields = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,username,children{id,media_type,media_url,thumbnail_url}';
      const own = await metaFetch(`${account.id}/media?limit=12`, token, fields);

      let tagged = { data: [] };
      try {
        tagged = await metaFetch(`${account.id}/tags?limit=12`, token, fields);
      } catch (error) {
        // Tagged media can require extra account/app permissions. Own feed still works.
        console.log('Tagged media unavailable:', error.message);
      }

      const seen = new Set();
      const items = [];
      for (const [list, source] of [[tagged.data || [], 'tagged'], [own.data || [], 'account']]) {
        for (const media of list) {
          const item = normalizeMedia(media, source, account.username);
          if (!item || seen.has(item.id)) continue;
          seen.add(item.id);
          items.push(item);
        }
      }
      items.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));

      return json({
        configured: true,
        username: account.username,
        checkedAt: new Date().toISOString(),
        items: items.slice(0, 8)
      }, 200, 'public, max-age=300');
    } catch (error) {
      return json({ configured: true, error: 'meta_api_error', message: error.message, items: [] }, 502);
    }
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === '/api/bcv') return getBcv(request);
    if (url.pathname === '/api/instagram') return getInstagram(request, env);
    return env.ASSETS.fetch(request);
  }
};
