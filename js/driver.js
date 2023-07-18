import {ALL_ATTRS, HISTORY_START_YEAR, MAX_YEAR, START_YEAR} from "const";
import {buildCompiler} from "compiler";
import {buildDataLayer} from "data";
import {addGlobalToState} from "geotools";
import {buildOverviewPresenter} from "overview";
import {buildReportPresenter} from "report";
import {buildSliders} from "slider";


class Driver {
    constructor() {
        const self = this;

        self._tabs = null;
        self._compiler = null;
        self._dataLayer = null;
        self._reportPresenter = null;
        self._overviewPresenter = null;
        self._levers = null;
        self._renderEnabled = true;

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

        // eslint-disable-next-line no-undef
        self._tabs = new Tabby("[data-tabs]");
        document.addEventListener("tabby", function(event) {
            self._reportPresenter.rebuildViz();
            self._onInputChange();
        }, false);

        const promises = [
            buildCompiler(),
            buildDataLayer(() => self._getLevers()),
            buildReportPresenter(
                () => self._onInputChange(),
                (year) => self._onYearChange(year),
            ),
            buildSliders(
                (year) => self._buildStateForCurrentYear(),
                (x) => self._compileProgram(x),
                () => self._onSlidersChange(),
                () => self._reportPresenter.getSelection(),
            ),
            buildOverviewPresenter(
                () => self._onInputChange(),
                (change, selected) => self._onPolicyChange(change, selected),
                (year) => self._onYearChange(year),
            ),
        ];

        Promise.all(promises).then((values) => {
            self._compiler = values[0];
            self._dataLayer = values[1];
            self._reportPresenter = values[2];
            self._levers = values[3];
            self._overviewPresenter = values[4];

            self._leversByName = new Map();
            self._levers.forEach((lever) => {
                self._leversByName.set(lever.getVariable(), lever);
            });

            document.getElementById("loading-indicator").style.display = "none";
            self._getD3().select("#loaded")
                .transition()
                .duration(700)
                .style("opacity", 1);

            self._onInputChange();
        });

        self._setupLayoutListeners();
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

    _onYearChange(year) {
        const self = this;

        self._renderEnabled = false;
        self._reportPresenter.setYear(year);
        self._overviewPresenter.setYear(year);
        self._renderEnabled = true;
        self._onInputChange();
    }

    _onInputChange() {
        const self = this;

        if (!self._renderEnabled) {
            return;
        }

        const businessAsUsual = self._getStates(false);
        const withInterventions = self._getStates(true);

        self._updateOutputs(businessAsUsual, withInterventions);
        self._levers.forEach((lever) => lever.refreshSelection());
    }

    _updateOutputs(businessAsUsual, withInterventions) {
        const self = this;
        self._reportPresenter.render(businessAsUsual, withInterventions);
        self._overviewPresenter.render(businessAsUsual, withInterventions);
    }

    _addGlobalToState(state) {
        const self = this;
        return addGlobalToState(state);
    }

    _setupLayoutListeners() {
        const self = this;

        const rebuild = () => {
            setTimeout(() => {
                self._reportPresenter.rebuildViz();
                self._onInputChange();
            }, 50);
        };

        document.getElementById("side-by-side-radio").addEventListener("click", () => {
            document.getElementById("panel-box").classList.add("active");
            rebuild();
        });

        document.getElementById("linear-radio").addEventListener("click", () => {
            document.getElementById("panel-box").classList.remove("active");
            rebuild();
        });
    }

    _onPolicyChange(change, selected) {
        const self = this;

        self._renderEnabled = false;

        change["values"].forEach((valueInfo) => {
            const lever = self._leversByName.get(valueInfo["lever"]);

            if (selected) {
                lever.setValue(valueInfo["value"]);
            } else {
                lever.resetToDefault();
            }

            lever.refreshSelection();
        });

        self._renderEnabled = true;
        self._onInputChange();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


function main() {
    const driver = new Driver();
    driver.init();
}


export {main};
