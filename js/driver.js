import {ALL_ATTRS, HISTORY_START_YEAR, MAX_YEAR, START_YEAR} from "const";
import {buildCompiler} from "compiler";
import {buildDataLayer} from "data";
import {addGlobalToState} from "geotools";
import {buildReportPresenter} from "report";
import {buildSliders} from "slider";


class Driver {
    constructor() {
        const self = this;

        self._compiler = null;
        self._dataLayer = null;
        self._reportPresenter = null;
        self._levers = null;

        self._historicYears = [];
        for (let year = HISTORY_START_YEAR; year < START_YEAR; year++) {
            self._historicYears.push(year);
        }

        self._projectionYears = [];
        for (let year = START_YEAR; year <= MAX_YEAR; year++) {
            self._projectionYears.push(year);
        }
    }

    init() {
        const self = this;

        const promises = [
            buildCompiler(),
            buildDataLayer(() => self._getLevers()),
            buildReportPresenter(
                () => self._onInputChange(),
            ),
            buildSliders(
                (year) => self._buildStateForCurrentYear(),
                (x) => self._compileProgram(x),
                () => self._onSlidersChange(),
                () => self._reportPresenter.getSelection()
            ),
        ];

        Promise.all(promises).then((values) => {
            self._compiler = values[0];
            self._dataLayer = values[1];
            self._reportPresenter = values[2];
            self._levers = values[3];

            self._onInputChange();
        });
    }

    _getLevers() {
        const self = this;
        return self._levers;
    }

    _buildState(year) {
        const self = this;

        const meta = new Map();
        meta.set("year", year);

        const state = self._dataLayer.buildState(year);
        state.set("meta", meta);

        return state;
    }

    _buildStateForCurrentYear() {
        const self = this;

        const year = self._reportPresenter.getSelection().getYear();
        const state = self._buildState(year);
        self._addGlobalToState(state);
        return state;
    }

    _compileProgram(code) {
        const self = this;
        return self._compiler.compile(code);
    }

    _getStates(runPrograms) {
        const self = this;

        const states = new Map();

        const getPrograms = () => {
            return self._getLevers()
                .map((lever) => {
                    return {
                        "lever": lever,
                        "program": lever.getProgram(),
                    };
                })
                .filter((leverInfo) => leverInfo["program"] !== null);
        };

        const programs = runPrograms ? getPrograms() : [];

        self._historicYears.forEach((year) => {
            const state = self._buildState(year);
            self._addGlobalToState(state);
            states.set(year, state);
        });

        self._projectionYears.forEach((year) => {
            const state = self._buildState(year);

            programs.forEach((programInfo) => {
                const program = programInfo["program"];
                const lever = programInfo["lever"];

                state.set("local", new Map());
                state.set("inspect", []);
                program(state);

                const inspects = state.get("inspect");
                lever.showInspects(inspects);
            });

            self._addGlobalToState(state);
            states.set(year, state);
        });

        return states;
    }

    _onSlidersChange() {
        const self = this;
        self._reportPresenter.showDeltaCheck();
        self._onInputChange();
    }

    _onInputChange() {
        const self = this;

        const businessAsUsual = self._getStates(false);
        const withInterventions = self._getStates(true);

        self._updateOutputs(businessAsUsual, withInterventions);
        self._levers.forEach((lever) => lever.refreshSelection());
    }

    _updateOutputs(businessAsUsual, withInterventions) {
        const self = this;
        self._reportPresenter.render(businessAsUsual, withInterventions);
    }

    _addGlobalToState(state) {
        const self = this;
        return addGlobalToState(state);
    }
}


function main() {
    const driver = new Driver();
    driver.init();
}


export {main};
