/**
 * Simple service worker for the PWA which caches application resources.
 * 
 * See https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/Offline_Service_workers
 * See https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching
 * 
 * @license BSD
 */

const CACHE_NAME = "GlobalPlasticsToolOffline_1";


function isCacheable(request) {
    const url = new URL(request.url);
    return url.host.indexOf("sentry-cdn.com") == -1;
}

async function cacheFirstWithRefresh(request) {
    const url = new URL(request.url);
    const currentHost = self.location.hostname;

    console.log(currentHost, url.hostname);
    console.log(url.pathname);

    const fetchResponsePromise = fetch(request).then(async (networkResponse) => {
        if (url.hostname === currentHost && networkResponse.ok && request.method === "GET") {
            const cache = await caches.open(CACHE_NAME);
            cache.put(url.pathname, networkResponse.clone());
        }
        return networkResponse;
    });

    if (currentHost === url.hostname) {
        return (await caches.match(url.pathname)) || (await fetchResponsePromise);
    } else {
        return (await fetchResponsePromise);
    }
}

self.addEventListener("fetch", (event) => {
    if (isCacheable(event.request)) {
        event.respondWith(cacheFirstWithRefresh(event.request));
    }
});

