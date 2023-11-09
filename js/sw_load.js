/**
 * Simple service worker load script.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API/Using_Service_Workers
 *
 * @license BSD
 */


const registerServiceWorker = async () => {
    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.register("/service_worker.js", {
                scope: "/",
            });
            if (registration.installing) {
                console.log("[Service Worker] Installing");
            } else if (registration.waiting) {
                console.log("[Service Worker] Installed");
            } else if (registration.active) {
                console.log("[Service Worker] Active");
            }
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

registerServiceWorker();
