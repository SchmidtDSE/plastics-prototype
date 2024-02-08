import {addGlobalToState} from "geotools";


class WorkerRequest {
    constructor(requestIndex, states, historicYears, projectionYears, programs) {
        const self = this;
        self._requestIndex = requestIndex;
        self._states = states;
        self._historicYears = historicYears;
        self._projectionYears = projectionYears;
        self._programs = programs;
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
}


class Response {

    constructor(requestIndex, states) {
        const self = this;
        self._requestIndex = requestIndex;
        self._states = states;
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


function execute(request) {
    const programs = request.getPrograms();
    const states = request.getStates();
    const historicYears = request.getHistoricYears();
    const projectionYears = request.getProjectionYears();

    historicYears.forEach((year) => {
        const state = self._buildState(year);
        addGlobalToState(state);
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

        addGlobalToState(state);
        states.set(year, state);
    });

    return new Response(request.getRequestIndex(), states);
}



