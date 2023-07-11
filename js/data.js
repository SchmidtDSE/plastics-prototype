import {CACHE_BUSTER} from "const";


class DataLayer {
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

    buildState(year) {
        const self = this;

        const state = new Map();
        state.set("local", new Map());

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
        state.set("out", outputs);

        const inputs = new Map();
        self._getLevers().forEach((lever) => {
            inputs.set(lever.getVariable(), lever.getValue());
        });
        state.set("in", inputs);

        state.set("inspect", []);

        return state;
    }
}


function buildDataLayer(getLevers) {
    const dataFuture = new Promise((resolve) => {
        // eslint-disable-next-line no-undef
        Papa.parse("/data/web.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    return dataFuture.then((baseline) => new DataLayer(baseline, getLevers));
}


export {buildDataLayer};
