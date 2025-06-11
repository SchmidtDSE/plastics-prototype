/**
 * Simple service worker for the PWA which caches application resources.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Tutorials/js13kGames/
 *     Offline_Service_workers
 * See https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Caching
 *
 * @license BSD
 */

const OLD_CACHES = [
    "GlobalPlasticsToolOffline_1",
    "GlobalPlasticsToolOffline_2",
    "GlobalPlasticsToolOffline_3",
    "GlobalPlasticsToolOffline_4",
    "GlobalPlasticsToolOffline_5",
    "GlobalPlasticsToolOffline_v1",
    "GlobalPlasticsToolOffline_v2",
    "GlobalPlasticsToolOffline_v3",
    "GlobalPlasticsToolOffline_v4",
    "GlobalPlasticsToolOfflineFlag_v1",
    "GlobalPlasticsToolOfflineFlag_v2",
    "GlobalPlasticsToolOfflineFlag_v3",
    "GlobalPlasticsToolOfflineFlag_v4",
    "GlobalPlasticsToolOfflineFlag_v5",
    "GlobalPlasticsTool_20240221",
    "GlobalPlasticsTool_20240221_1",
    "GlobalPlasticsTool_20240222",
    "GlobalPlasticsTool_20240222_1",
    "GlobalPlasticsTool_20240227",
    "GlobalPlasticsTool_20240301",
    "GlobalPlasticsTool_20240306",
    "GlobalPlasticsTool_20240307",
    "GlobalPlasticsTool_20240308",
    "GlobalPlasticsTool_20240405",
    "GlobalPlasticsTool_20240416",
    "GlobalPlasticsTool_20240421",
    "GlobalPlasticsTool_20240517",
    "GlobalPlasticsTool_20240518",
    "GlobalPlasticsTool_20240521",
    "GlobalPlasticsTool_202405211",
    "GlobalPlasticsTool_20240522",
    "GlobalPlasticsTool_202405221",
    "GlobalPlasticsTool_20240524",
    "GlobalPlasticsTool_20240621",
    "GlobalPlasticsTool_20240622",
    "GlobalPlasticsTool_20240623",
    "GlobalPlasticsTool_20240830",
    "GlobalPlasticsTool_20240902",
    "GlobalPlasticsTool_20240903",
    "GlobalPlasticsTool_20240904",
    "GlobalPlasticsTool_20240905",
    "GlobalPlasticsTool_20240906",
    "GlobalPlasticsTool_20240907",
    "GlobalPlasticsTool_20240908",
    "GlobalPlasticsTool_20240909",
    "GlobalPlasticsTool_20240910",
    "GlobalPlasticsTool_20250425"
];
const CACHE_NAME = "GlobalPlasticsTool_20250610";
const ESSENTIAL_FILES = [
    "/css/README.md",
    "/css/base.css",
    "/css/hide-details-goals.css",
    "/data/web.csv",
    "/data/overview_curve.csv",
    "/data/overview_naive.csv",
    "/data/live_polymer_ratios.csv",
    "/data/resin_trade_supplement.csv",
    "/data/live_production_trade_subtype_ratios.csv",
    "/data/overview_ml.csv",
    "/font/LeagueSpartan-Black.otf",
    "/font/LeagueSpartan-Bold.otf",
    "/font/LeagueSpartan-ExtraBold.otf",
    "/font/LeagueSpartan-ExtraLight.otf",
    "/font/LeagueSpartan-Light.otf",
    "/font/LeagueSpartan-Medium.otf",
    "/font/LeagueSpartan-Regular.otf",
    "/font/LeagueSpartan-SemiBold.otf",
    "/font/README.md",
    "/img/README.md",
    "/img/card.png",
    "/img/dialog.png",
    "/img/info.png",
    "/img/tab_1_legend.png",
    "/img/tab_1_legend.svg",
    "/img/tab_2_legend.png",
    "/img/tab_2_legend.svg",
    "/img/gpt_logo_192.png",
    "/img/line.png",
    "/js/README.md",
    "/js/compile_visitor.js_template",
    "/js/compiler.js",
    "/js/const.js",
    "/js/data.js",
    "/js/driver.js",
    "/js/file.js",
    "/js/geotools.js",
    "/js/goals.js",
    "/js/intro.js",
    "/js/overview.js",
    "/js/overview_scenario.js",
    "/js/overview_scorecard.js",
    "/js/overview_timedelta.js",
    "/js/report.js",
    "/js/report_bubble.js",
    "/js/report_config.js",
    "/js/report_goals.js",
    "/js/report_sparklines.js",
    "/js/report_stage.js",
    "/js/report_timeseries.js",
    "/js/sim_presenter.js",
    "/js/slider.js",
    "/js/strings.js",
    "/js/transformation.js",
    "/js/visitors_base.js_template",
    "/js/plastics_lang.js",
    "/js/visitors.js",
    "/js/sw_load.js",
    "/js/add_global_util.js",
    "/js/polymers.js",
    "/pt/README.md",
    "/pt/additives.pt",
    "/pt/consumption_tax.pt",
    "/pt/delta_waste_export.pt",
    "/pt/delta_waste_import.pt",
    "/pt/incineration_investment.pt",
    "/pt/index.json",
    "/pt/landfill_investment.pt",
    "/pt/maximum_mismanaged.pt",
    "/pt/minimum_recycled_content.pt",
    "/pt/minimum_recycling_rate.pt",
    "/pt/nivi_scratchpad.pt",
    "/pt/noop.pt",
    "/pt/recycling_investment.pt",
    "/pt/reduce_packaging_polymer.pt",
    "/pt/reduce_ps.pt",
    "/pt/scenarios.json",
    "/pt/simulation.pt",
    "/pt/sim_bau.pt",
    "/pt/sim_cap_virgin.pt",
    "/pt/sim_mrc.pt",
    "/pt/sim_package.pt",
    "/pt/sim_packaging_tax.pt",
    "/pt/sim_waste_invest.pt",
    "/pt/virgin_plastic_cap.pt",
    "/pt/virgin_tax.pt",
    "/pt/waste_trade.pt",
    "/pt/yield_loss.pt",
    "/template/README.md",
    "/template/base_prerender.html",
    "/template/harness.html",
    "/template/preview.html",
    "/template/section.html",
    "/template/slider.html",
    "/template/variables.html",
    "/template/base.html",
    "/template/index.html",
    "/third_party/ace.min.js",
    "/third_party/d3.min.js",
    "/third_party/theme-textmate.js",
    "/third_party/theme-textmate-css.js",
    "/third_party/papaparse.min.js",
    "/third_party/handlebars.min.js",
    "/third_party/tabby-ui.min.css",
    "/third_party/tabby.min.js",
    "/third_party/popper.min.js",
    "/third_party/simplebar.css",
    "/third_party/simplebar.min.js",
    "/third_party/tippy.min.js",
    "/third_party/js.cookie.min.js",
    "/third_party/pollyfill.min.js",
    "/third_party/es-module-shims.js",
    "/third_party/ua-parser.min.js",
    "/third_party/chart.min.js",
    "/standalone_tasks/businessAsUsual2014.json",
    "/standalone_tasks/businessAsUsual2015.json",
    "/standalone_tasks/businessAsUsual2016.json",
    "/standalone_tasks/businessAsUsual2017.json",
    "/standalone_tasks/businessAsUsual2018.json",
    "/standalone_tasks/businessAsUsual2019.json",
    "/standalone_tasks/businessAsUsual2020.json",
    "/standalone_tasks/businessAsUsual2021.json",
    "/standalone_tasks/businessAsUsual2022.json",
    "/standalone_tasks/businessAsUsual2023.json",
    "/standalone_tasks/businessAsUsual2024.json",
    "/standalone_tasks/businessAsUsual2025.json",
    "/standalone_tasks/businessAsUsual2026.json",
    "/standalone_tasks/businessAsUsual2027.json",
    "/standalone_tasks/businessAsUsual2028.json",
    "/standalone_tasks/businessAsUsual2029.json",
    "/standalone_tasks/businessAsUsual2030.json",
    "/standalone_tasks/businessAsUsual2031.json",
    "/standalone_tasks/businessAsUsual2032.json",
    "/standalone_tasks/businessAsUsual2033.json",
    "/standalone_tasks/businessAsUsual2034.json",
    "/standalone_tasks/businessAsUsual2035.json",
    "/standalone_tasks/businessAsUsual2036.json",
    "/standalone_tasks/businessAsUsual2037.json",
    "/standalone_tasks/businessAsUsual2038.json",
    "/standalone_tasks/businessAsUsual2039.json",
    "/standalone_tasks/businessAsUsual2040.json",
    "/standalone_tasks/businessAsUsual2041.json",
    "/standalone_tasks/businessAsUsual2042.json",
    "/standalone_tasks/businessAsUsual2043.json",
    "/standalone_tasks/businessAsUsual2044.json",
    "/standalone_tasks/businessAsUsual2045.json",
    "/standalone_tasks/businessAsUsual2046.json",
    "/standalone_tasks/businessAsUsual2047.json",
    "/standalone_tasks/businessAsUsual2048.json",
    "/standalone_tasks/businessAsUsual2049.json",
    "/standalone_tasks/scenarios_overview.csv",
    "/standalone_tasks/lowAmbition2039.json",
    "/standalone_tasks/lowAmbition2040.json",
    "/standalone_tasks/lowAmbition2041.json",
    "/standalone_tasks/lowAmbition2042.json",
    "/standalone_tasks/lowAmbition2043.json",
    "/standalone_tasks/lowAmbition2044.json",
    "/standalone_tasks/lowAmbition2045.json",
    "/standalone_tasks/lowAmbition2046.json",
    "/standalone_tasks/lowAmbition2047.json",
    "/standalone_tasks/lowAmbition2048.json",
    "/standalone_tasks/lowAmbition2049.json",
    "/standalone_tasks/highAmbition2024.json",
    "/standalone_tasks/highAmbition2025.json",
    "/standalone_tasks/highAmbition2026.json",
    "/standalone_tasks/highAmbition2027.json",
    "/standalone_tasks/highAmbition2028.json",
    "/standalone_tasks/highAmbition2029.json",
    "/standalone_tasks/highAmbition2030.json",
    "/standalone_tasks/highAmbition2031.json",
    "/standalone_tasks/highAmbition2032.json",
    "/standalone_tasks/highAmbition2033.json",
    "/standalone_tasks/highAmbition2034.json",
    "/standalone_tasks/highAmbition2035.json",
    "/standalone_tasks/highAmbition2036.json",
    "/standalone_tasks/highAmbition2037.json",
    "/standalone_tasks/highAmbition2038.json",
    "/standalone_tasks/highAmbition2039.json",
    "/standalone_tasks/highAmbition2040.json",
    "/standalone_tasks/highAmbition2041.json",
    "/standalone_tasks/highAmbition2042.json",
    "/standalone_tasks/highAmbition2043.json",
    "/standalone_tasks/highAmbition2044.json",
    "/standalone_tasks/highAmbition2045.json",
    "/standalone_tasks/highAmbition2046.json",
    "/standalone_tasks/highAmbition2047.json",
    "/standalone_tasks/highAmbition2048.json",
    "/standalone_tasks/highAmbition2049.json",
    "/standalone_tasks/businessAsUsual2011.json",
    "/standalone_tasks/businessAsUsual2012.json",
    "/standalone_tasks/businessAsUsual2013.json",
    "/standalone_tasks/minimumRecyclingRate.json",
    "/standalone_tasks/minimumRecycledContent.json",
    "/standalone_tasks/capVirgin.json",
    "/standalone_tasks/banPsPackaging.json",
    "/standalone_tasks/banSingleUse.json",
    "/standalone_tasks/reducedAdditives.json",
    "/standalone_tasks/recyclingInvestment.json",
    "/standalone_tasks/wasteInvestment.json",
    "/standalone_tasks/taxVirgin.json",
    "/standalone_tasks/banWasteTrade.json",
    "/standalone_tasks/lowAmbition.json",
    "/standalone_tasks/highAmbition.json",
    "/standalone_tasks/businessAsUsual.json",
    "/standalone_tasks/lowAmbition2024.json",
    "/standalone_tasks/lowAmbition2025.json",
    "/standalone_tasks/lowAmbition2026.json",
    "/standalone_tasks/lowAmbition2027.json",
    "/standalone_tasks/lowAmbition2028.json",
    "/standalone_tasks/lowAmbition2029.json",
    "/standalone_tasks/lowAmbition2030.json",
    "/standalone_tasks/lowAmbition2031.json",
    "/standalone_tasks/lowAmbition2032.json",
    "/standalone_tasks/lowAmbition2033.json",
    "/standalone_tasks/lowAmbition2034.json",
    "/standalone_tasks/lowAmbition2035.json",
    "/standalone_tasks/lowAmbition2036.json",
    "/standalone_tasks/lowAmbition2037.json",
    "/standalone_tasks/lowAmbition2038.json",
    "/index.html",
    "/preview.html",
    "/robots.txt",
    "/humans.txt",
    "/manifest.json",
    "/service_worker_v2.js",
];

/**
 * Determine if the resource is allowed to be cached.
 *
 * @returns True if cachable. False otherwise.
 */
function isCacheable(request) {
    const url = new URL(request.url);
    const isSentry = url.host.indexOf("sentry-cdn.com") != -1;
    const isTestFile = url.pathname.indexOf("version.txt") != -1;
    const nonCachable = isSentry || isTestFile;
    const isCacheable = !nonCachable;
    return isCacheable;
}

/**
 * Make a request and update cache in background.
 *
 * @param request The request to make after which the internal cache will be updated.
 * @returns Response
 */
async function cacheFirstWithRefresh(request) {
    const url = new URL(request.url);
    const currentHost = self.location.hostname;

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


/**
 * Intercept fetch
 */
self.addEventListener("fetch", (event) => {
    const request = event.request;
    if (isCacheable(request)) {
        event.respondWith(cacheFirstWithRefresh(request));
    }
});


// Thanks https://developer.mozilla.org/en-US/docs/Web/API/Cache
self.addEventListener("activate", (event) => {
    const expectedCacheNamesSet = new Set(Object.values(CACHE_NAME));
    event.waitUntil(
        caches.keys().then((cacheNames) =>
        Promise.all(
            cacheNames.map((cacheName) => {
            if (!expectedCacheNamesSet.has(cacheName)) {
                console.log("Deleting out of date cache:", cacheName);
                return caches.delete(cacheName);
            }
            }),
        ),
        ),
    );
});


/**
 * Schedule a cache fill after install.
 */
self.addEventListener("install", (e) => {
    const preloadCache = () => {
        const requests = ESSENTIAL_FILES.map((url) => new Request(url));
        requests.forEach((request) => cacheFirstWithRefresh(request));
        console.log("[Service Worker] Cache Loaded");
    };

    console.log("[Service Worker] Cache Queued");

    // In case someone is bouncing, don't add to download size
    setTimeout(preloadCache, 4000);
});
