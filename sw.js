const CACHE_NAME = 'soosi-pet-v6'; // 更新版本號
const ASSETS_TO_CACHE = [
  './index.html',
  './nav.png',
  './logo.png',
  './line.png'
];

// 安裝 Service Worker 並快取資源
self.addEventListener('install', (event) => {
  console.log('🔍 [SW] install 事件觸發');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('🔍 [SW] 開始快取資源');
      return cache.addAll(ASSETS_TO_CACHE);
    }).then(() => {
      console.log('✅ [SW] 快取完成');
    })
  );
  // ⚠️ 確保這裡沒有呼叫 self.skipWaiting()
  // 不要加入 self.skipWaiting();
});

// 激活時清理舊快取
self.addEventListener('activate', (event) => {
  console.log('🔍 [SW] activate 事件觸發');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('🔍 [SW] 清理舊快取:', cacheNames);
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('🗑️ [SW] 刪除舊快取:', cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => {
      console.log('✅ [SW] 清理完成，claim clients');
      return self.clients.claim();
    })
  );
});

// ✅ 新增：監聽來自頁面的訊息（處理 SKIP_WAITING）
self.addEventListener('message', (event) => {
  console.log('📨 [SW] 收到訊息:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('✅ [SW] 收到 SKIP_WAITING 指令，執行 skipWaiting()');
    self.skipWaiting();
  }
});

// 攔截請求：優先使用快取，若無快取則發起網路請求
self.addEventListener('fetch', (event) => {
  // 跳過 Supabase 請求
  if (event.request.url.includes('supabase.co')) {
    return;
  }
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});