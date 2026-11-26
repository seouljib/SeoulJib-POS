// 서비스 워커 해제용: 요청을 가로채지 않고, 설치되는 즉시 스스로 등록을 해제함
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) { e.waitUntil(self.registration.unregister()); });
