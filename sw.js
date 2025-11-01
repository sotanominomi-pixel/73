const CACHE_NAME = 'n-clock-v1';
// キャッシュに保存するファイルリスト
const urlsToCache = [
    './', // 👈 カレントディレクトリ（リポジトリのルートを指す）に変更
    'index.html', // 👈 '/' を削除
    'style.css',
    'script.js',
    'manifest.json',
    // アイコン画像も '/' を削除 (ファイルが実際に存在することを確認してください)
    'images/icon-192x192.png',
    'images/icon-512x512.png'
];

// Service Worker のインストール（キャッシュの初期化）
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// リソースの取得（キャッシュからの提供またはネットワークからの取得）
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // キャッシュに見つかったらそれを返す
                if (response) {
                    return response;
                }
                // 見つからなければネットワークにリクエスト
                return fetch(event.request);
            })
    );
});

// キャッシュのクリーンアップ（古いキャッシュの削除）
self.addEventListener('activate', (event) => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});
