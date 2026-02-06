const CACHE_NAME = 'soosi-admin-v4';
// 只快取本地核心檔案，不快取 CDN (避免 CORS 錯誤)
const ASSETS_TO_CACHE = [
    './admin.html',
    './manifest-admin.json',
    './nav.png'
];
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
    );
});

self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => self.clients.claim()) // 讓新 SW 安裝後立刻取得頁面控制權
    );
});

// 核心修正：接收來自 admin.html 的 SKIP_WAITING 指令
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

self.addEventListener('fetch', (event) => {
    // API 請求直接走網路
    if (event.request.url.includes('supabase.co')) return;
    
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});