class WorkerRequest {
    constructor(requestIndex, states, historicYears, projectionYears, programs, allAttrs) {
        const self = this;
        self._requestIndex = requestIndex;
        self._states = states;
        self._historicYears = historicYears;
        self._projectionYears = projectionYears;
        self._programs = programs;
        self._allAttrs = allAttrs;
    }

    getRequestIndex() {
        const self = this;
        return self._requestIndex;
    }

    getStates() {
        const self = this;
        return self._states;
    }
    
    getProjectionYears() {
        const self = this;
        return self._projectionYears;
    }

    getHistoricYears() {
        const self = this;
        return self._historicYears;
    }
    
    getPrograms() {
        const self = this;
        return self._programs;
    }

    getAllAttrs() {
        const self = this;
        return self._allAttrs;
    }
}


class WorkerResponse {

    constructor(error, requestIndex, states) {
        const self = this;
        self._error = error;
        self._requestIndex = requestIndex;
        self._states = states;
    }

    hasError() {
        const self = this;
        return self._error !== null;
    }

    getError() {
        const self = this;
        return self._error;
    }

    getRequestIndex() {
        const self = this;
        return self._requestIndex;
    }

    getStates() {
        const self = this;
        return self._states;
    }
}


function executeWorkerRequest(request) {
    const programs = request.getPrograms();
    const states = request.getStates();
    const historicYears = request.getHistoricYears();
    const projectionYears = request.getProjectionYears();
    const allAttrs = request.getAllAttrs();

    historicYears.forEach((year) => {
        const state = self._buildState(year);
        addGlobalToState(state, allAttrs);
        states.set(year, state);
    });

    projectionYears.forEach((year) => {
        const state = self._buildState(year);

        programs.forEach((programInfo) => {
            const program = programInfo["program"];

            state.set("local", new Map());
            state.set("inspect", []);
            program(state);
        });

        addGlobalToState(state, allAttrs);
        states.set(year, state);
    });

    return new WorkerResponse(null, request.getRequestIndex(), states);
}


/**
 * Calculate global statistics from region statistics for a state Map
 *
 * @param state The state Map in which the global statistics should be added.
 * @param allAttrs The attributes to summarize.
 */
function addGlobalToState(state, allAttrs) {
    const outputs = state.get("out");
    const globalValues = new Map();
    allAttrs.forEach((attr) => {
        const total = Array.of(...outputs.keys())
            .filter((region) => region !== "global")
            .map((region) => outputs.get(region))
            .map((regionValues) => {
                const ATTRS_TO_ZERO = [
                    "netImportsMT",
                    "netWasteImportMT",
                ];

                const originalValue = regionValues.get(attr);
                if (ATTRS_TO_ZERO.indexOf(attr) != -1) {
                    return 0;
                } else {
                    return originalValue;
                }
            })
            .reduce((a, b) => a + b);
        globalValues.set(attr, total);
    });
    outputs.set("global", globalValues);
}


export {WorkerRequest, WorkerResponse, executeWorkerRequest};
