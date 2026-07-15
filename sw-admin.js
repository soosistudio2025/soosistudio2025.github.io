const CACHE_NAME = 'soosi-admin-v5'; // 更新版本號
const ASSETS_TO_CACHE = [
    './admin.html',
    './manifest-admin.json',
    './nav.png'
];

self.addEventListener('install', (event) => {
    console.log('🔍 [SW-Admin] install 事件觸發');
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('🔍 [SW-Admin] 開始快取資源');
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            console.log('✅ [SW-Admin] 快取完成');
        })
    );
    // ⚠️ 確保這裡沒有呼叫 self.skipWaiting()
});

self.addEventListener('activate', (event) => {
    console.log('🔍 [SW-Admin] activate 事件觸發');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            console.log('🔍 [SW-Admin] 清理舊快取:', cacheNames);
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('🗑️ [SW-Admin] 刪除舊快取:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            console.log('✅ [SW-Admin] 清理完成，claim clients');
            return self.clients.claim();
        })
    );
});

// ✅ 新增：監聽來自頁面的訊息（處理 SKIP_WAITING）
self.addEventListener('message', (event) => {
    console.log('📨 [SW-Admin] 收到訊息:', event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log('✅ [SW-Admin] 收到 SKIP_WAITING 指令，執行 skipWaiting()');
        self.skipWaiting();
    }
});

// 攔截請求：優先使用快取，若無快取則發起網路請求
self.addEventListener('fetch', (event) => {
    // 跳過 Supabase 請求
    if (event.request.url.includes('supabase.co')) return;
    event.respondWith(
        caches.match(event.request).then((response) => {
            return response || fetch(event.request);
        })
    );
});