// ============================================================
// 🌟 版本號：每次修改此檔案時請更新此數字
// ============================================================
const SW_VERSION = 'v7';
const CACHE_NAME = `soosi-admin-${SW_VERSION}`;

// ✅ 只快取靜態資源，不包含 admin.html（避免頁面被快取）
const ASSETS_TO_CACHE = [
    './manifest-admin.json',
    './nav.png'
];

// ============================================================
// INSTALL: 安裝新版本時，不強制跳過等待
// ============================================================
self.addEventListener('install', (event) => {
    console.log(`🔍 [SW-Admin ${SW_VERSION}] install 事件觸發`);
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log(`🔍 [SW-Admin ${SW_VERSION}] 開始快取資源`);
            return cache.addAll(ASSETS_TO_CACHE);
        }).then(() => {
            console.log(`✅ [SW-Admin ${SW_VERSION}] 快取完成`);
        })
    );
    // ⚠️ 不主動 skipWaiting，讓頁面控制何時切換
});

// ============================================================
// ACTIVATE: 清理舊快取，立即接管頁面
// ============================================================
self.addEventListener('activate', (event) => {
    console.log(`🔍 [SW-Admin ${SW_VERSION}] activate 事件觸發`);
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            console.log(`🔍 [SW-Admin ${SW_VERSION}] 檢查舊快取:`, cacheNames);
            const deletePromises = cacheNames.map((cacheName) => {
                // ✅ 刪除所有不包含當前版本號的快取
                if (cacheName !== CACHE_NAME) {
                    console.log(`🗑️ [SW-Admin ${SW_VERSION}] 刪除舊快取:`, cacheName);
                    return caches.delete(cacheName);
                }
                return Promise.resolve();
            });
            return Promise.all(deletePromises);
        }).then(() => {
            console.log(`✅ [SW-Admin ${SW_VERSION}] 清理完成，claim clients`);
            // ✅ 立即接管所有已開啟的頁面
            return self.clients.claim();
        })
    );
});

// ============================================================
// MESSAGE: 處理來自頁面的指令 (SKIP_WAITING)
// ============================================================
self.addEventListener('message', (event) => {
    console.log(`📨 [SW-Admin ${SW_VERSION}] 收到訊息:`, event.data);
    if (event.data && event.data.type === 'SKIP_WAITING') {
        console.log(`✅ [SW-Admin ${SW_VERSION}] 執行 skipWaiting()`);
        self.skipWaiting();
    }
});

// ============================================================
// FETCH: 網路優先策略（避免快取舊版 HTML）
// ============================================================
self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    // 1. 跳過 Supabase 請求（避免干擾 API）
    if (url.hostname.includes('supabase.co')) {
        return;
    }

    // 2. ✅ 對 admin.html 採用「網路優先」策略，確保總是載入最新版
    if (url.pathname.endsWith('admin.html') || url.pathname.endsWith('/')) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    // 成功取得網路資源，回傳給頁面
                    return response;
                })
                .catch(() => {
                    // 網路失敗時，從快取取用備份
                    return caches.match(event.request);
                })
        );
        return;
    }

    // 3. 其他靜態資源：快取優先，但檢查更新
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            if (cachedResponse) {
                // 有快取就直接回傳
                return cachedResponse;
            }
            // 沒快取則發起網路請求
            return fetch(event.request);
        })
    );
});