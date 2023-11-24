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
            const registration = await navigator.serviceWorker.register("/service_worker_v2.js", {
                scope: "/",
            });
            registration.update();
        } catch (error) {
            console.error(`Registration failed with ${error}`);
        }
    }
};

registerServiceWorker();
