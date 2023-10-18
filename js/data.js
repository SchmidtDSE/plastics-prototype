/**
 * Utilities to generate state Maps for the plastics decision support tool.
 * 
 * Utilities to generate state Maps for the plastics decision support tool, objects fed into
 * plastics language scripts.
 * 
 * @license BSD, see LICENSE.md
 */

import {CACHE_BUSTER} from "const";


/**
 * Utility to operate on business as usual data, the records on which simulation is performed.
 * 
 * Utility to operate on business as usual data, the records on which simulation is performed. This
 * is technically a facade which allows for request of state objects (Map) which are fed into
 * plastics language scripts.
 */
class DataLayer {

    /**
     * Create a new data management facade.
     * 
     * @param baseline Raw business as usual data.
     * @param getLevers Function which returns the current state of the levers or policy sliders.
     *      Should return an interable over objects with getValue and getVariable methods like
     *      SliderPresenters.
     */
    constructor(baseline, getLevers) {
        const self = this;

        self._getLevers = getLevers;

        self._baselineByYear = new Map();
        baseline.forEach((record) => {
            const year = record["year"];

            if (!self._baselineByYear.has(year)) {
                self._baselineByYear.set(year, []);
            }

            self._baselineByYear.get(year).push(record);
        });
    }

    /**
     * Create a new state object (as Map).
     * 
     * @param year The year for which a state object should be built. 
     * @returns Newly constructed state object as a Map.
     */
    buildState(year) {
        const self = this;

        const state = new Map();
        state.set("local", new Map());

        // Convert normal outputs
        const outputs = new Map();
        const targetData = self._baselineByYear.get(year);
        targetData.forEach((datum) => {
            const region = datum["region"];
            if (!outputs.has(region)) {
                outputs.set(region, new Map());
            }

            const regionData = outputs.get(region);
            for (const key in datum) {
                if (datum[key] !== undefined) {
                    regionData.set(key, datum[key]);
                }
            }
        });

        // Add outputs
        state.set("out", outputs);

        // Add inputs
        const inputs = new Map();
        self._getLevers().forEach((lever) => {
            inputs.set(lever.getVariable(), lever.getValue());
        });
        state.set("in", inputs);

        // Prepare for inspect
        state.set("inspect", []);

        return state;
    }
}


/**
 * Build a data management facade
 * 
 * @param getLevers Function which returns the current state of the levers or policy sliders.
 *      Should return an interable over objects with getValue and getVariable methods like
 *      SliderPresenters.
 * @returns Promise resolving to a DataLayer.
 */
function buildDataLayer(getLevers) {
    const dataFuture = new Promise((resolve) => {
        const urlParams = new URLSearchParams(window.location.search);
        const sourceOverride = urlParams.has("source");

        const filename = sourceOverride ? urlParams.get("source") : "web.csv";

        // eslint-disable-next-line no-undef
        Papa.parse("/data/" + filename + "?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    return dataFuture.then((baseline) => new DataLayer(baseline, getLevers));
}


export {buildDataLayer};
