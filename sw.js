// Hazel 資產管理 — Service Worker v12
// 策略：導航請求網路優先（帶 8 秒超時，離線回退快取），資源快取優先；API 永不快取
const CACHE_NAME = 'hazel-asset-v17';
const CACHE_FILES = [
  './',
  './index.html',
  'index.html?v=12',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
  './piggy.png',
];

// 帶超時的 fetch（沙箱喚醒時網關可能長時間不回應）
function fetchWithTimeout(req, ms) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('timeout')), ms);
    fetch(req).then((resp) => {
      clearTimeout(timer);
      resolve(resp);
    }).catch((err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

// 安裝：預快取核心文件
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(CACHE_FILES.map((url) => cache.add(url)));
    }).then(() => {
      self.skipWaiting();
    })
  );
});

// 啟用：清除所有舊版本快取（含跨域名殘留），立即接管
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// 攔截請求
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  try {
    const u = new URL(req.url);
    if (u.pathname.indexOf('/api/') === 0) return;
    if (u.origin !== self.location.origin) return;
  } catch (e) { return; }

  // 導航請求 → 網路優先（8 秒超時），離線/超時回退快取
  if (req.mode === 'navigate') {
    event.respondWith(
      fetchWithTimeout(req, 8000).then((resp) => {
        // 只快取正常的 200 響應，避免把 404/504 錯誤頁快取進來
        if (resp.ok) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => {
            c.put(req, clone);
            c.put('index.html', clone.clone());
            c.put('./index.html', clone.clone());
          });
        }
        return resp;
      }).catch(() => {
        // 離線或超時：遍歷快取找頁面
        return caches.match(req).then((cached) => {
          if (cached) return cached;
          return caches.match('index.html').then((c2) => {
            if (c2) return c2;
            return caches.match('./index.html').then((c3) => {
              if (c3) return c3;
              return caches.match('./');
            });
          });
        }).then((result) => {
          if (result) return result;
          return new Response(
            '<html><head><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="font-family:-apple-system,sans-serif;text-align:center;padding:60px 20px"><h2>載入中...</h2><p>正在連接伺服器，請稍候後重試</p><button onclick="location.reload()" style="margin-top:20px;padding:10px 24px;font-size:16px;border:none;border-radius:8px;background:#b8e0d2;color:#1f4a3f;cursor:pointer">重試</button></body></html>',
            { headers: { 'Content-Type': 'text/html; charset=utf-8' } }
          );
        });
      })
    );
    return;
  }

  // 其他資源 → 快取優先
  event.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req).then((resp) => {
        if (resp.ok && new URL(req.url).origin === self.location.origin) {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((c) => c.put(req, clone));
        }
        return resp;
      }).catch(() => cached);
    })
  );
});
