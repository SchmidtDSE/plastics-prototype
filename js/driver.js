import {ALL_ATTRS, HISTORY_START_YEAR, MAX_YEAR, START_YEAR} from "const";
import {buildCompiler} from "compiler";
import {buildDataLayer} from "data";
import {FilePresenter} from "file";
import {addGlobalToState} from "geotools";
import {buildOverviewPresenter} from "overview";
import {buildReportPresenter} from "report";
import {buildSliders} from "slider";


class Driver {
    constructor(disableDelay) {
        const self = this;

        self._tabs = null;
        self._subtabs = null;
        self._compiler = null;
        self._dataLayer = null;
        self._reportPresenter = null;
        self._overviewPresenter = null;
        self._levers = null;
        self._redrawTimeout = null;
        self._latestRequest = null;
        self._disableDelay = disableDelay;

        self._historicYears = [];
        for (let year = HISTORY_START_YEAR; year < START_YEAR; year++) {
            self._historicYears.push(year);
        }

        self._projectionYears = [];
        for (let year = START_YEAR; year <= MAX_YEAR; year++) {
            self._projectionYears.push(year);
        }

        self._pauseUiLoop = true;
    }

    setPauseUiLoop(shouldPause) {
        const self = this;
        self._pauseUiLoop = shouldPause;
    }

    init(includeDevelopment) {
        const self = this;

        return new Promise((outerResolve) => {
            // eslint-disable-next-line no-undef
            self._tabs = new Tabby("[data-tabs]");
            document.addEventListener("tabby", (event) => {
                if (self._reportPresenter !== null) {
                    self._reportPresenter.rebuildViz();
                }

                if (event.target.href.indexOf("#detailed") != -1) {
                    document.querySelector(".custom-menu-check").checked = true;
                }
                self._onInputChange();
            }, false);

            self._subtabs = new Tabby("[data-sub-tabs-about]");
            self._subtabs_guide = new Tabby("[data-sub-tabs-guide]");

            self._updateTabVisibility();

            window.addEventListener("hashchange", (event) => {
                self._updateTabVisibility();
            });

            Array.of(...document.querySelectorAll(".detailed-cta")).forEach((elem) => {
                elem.addEventListener("click", (event) => {
                    self._tabs.toggle("#detailed");
                    event.preventDefault();
                });
            });

            Array.of(...document.querySelectorAll(".toc-link")).forEach((elem) => {
                elem.addEventListener("click", (event) => {
                    const getLast = (x) => x[x.length - 1];
                    const locationAnchorSplit = window.location.hash.split("#");
                    const locationAnchor = getLast(locationAnchorSplit);
                    const hrefAnchorSplit = elem.href.split("#");
                    const hrefAnchor = getLast(hrefAnchorSplit);
                    if (locationAnchor === hrefAnchor) {
                        self._updateTabVisibility();
                    }
                });
            });

            document.getElementById("overview-cta").addEventListener("click", (event) => {
                self._tabs.toggle("#overview");
            });

            const promises = [
                buildCompiler(),
                buildDataLayer(() => self._getLevers()),
                buildReportPresenter(
                    () => self._onInputChange(),
                    (year) => self._onYearChange(year),
                ),
                buildSliders(
                    includeDevelopment,
                    (year) => self._buildStateForCurrentYear(),
                    (x) => self._compileProgram(x),
                    () => self._onSlidersChange(),
                    () => self._reportPresenter.getSelection(),
                ),
                buildOverviewPresenter(
                    includeDevelopment,
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

                self._levers.sort((a, b) => {
                    const diff = a.getPriority() - b.getPriority();
                    if (Math.abs(diff) < 0.00001) {
                        return a.getVariable().localeCompare(b.getVariable());
                    } else {
                        return diff;
                    }
                });

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

                self._filePresenter = new FilePresenter(
                    self._leversByName,
                    () => self._onInputChange(),
                );
                if (window.location.search !== "") {
                    self._filePresenter.loadFromUrl();
                }

                outerResolve();
            });

            self._setupLayoutListeners();
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

                if (year === 2050) {
                    const inspects = state.get("inspect");
                    lever.showInspects(inspects);
                }
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

        self._reportPresenter.setYear(year);
        self._overviewPresenter.setYear(year);
        self._onInputChange();
    }

    _onInputChange() {
        const self = this;

        if (self._redrawTimeout !== null) {
            clearTimeout(self._redrawTimeout);
        }

        const reschedule = () => {
            if (self._disableDelay) {
                execute();
            } else {
                const timestamp = new Date().getTime();
                self._latestRequest = timestamp;
                self._redrawTimeout = setTimeout(() => {
                    execute(timestamp);
                }, 25);
            }
        };

        const execute = (timestamp) => {
            if (self._dataLayer === null) {
                reschedule();
                return;
            }

            const businessAsUsual = self._getStates(false);
            const withInterventions = self._getStates(true);

            self._updateOutputs(businessAsUsual, withInterventions, timestamp);
            self._redrawTimeout = null;
        };

        // Give the UI loop a minute to catch up from OS
        if (self._pauseUiLoop) {
            reschedule();
        } else {
            execute();
        }
    }

    _updateOutputs(businessAsUsual, withInterventions, timestamp) {
        const self = this;

        const execute = () => {
            self._reportPresenter.render(businessAsUsual, withInterventions);
            self._overviewPresenter.render(businessAsUsual, withInterventions);
            self._levers.forEach((lever) => lever.refreshSelection());
        };

        if (self._disableDelay) {
            execute();
        } else {
            setTimeout(() => {
                if (timestamp == self._latestRequest) {
                    execute();
                }
            }, 25);
        }
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
            }, 25);
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

        change["values"].forEach((valueInfo) => {
            const lever = self._leversByName.get(valueInfo["lever"]);

            if (selected) {
                lever.setValue(valueInfo["value"]);
            } else {
                lever.resetToDefault();
            }

            lever.refreshSelection();
        });

        self._onInputChange();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }

    _updateTabVisibility() {
        const self = this;
        const hash = window.location.hash;
        if (hash === "") {
            return;
        }

        if (hash.startsWith("#overview")) {
            self._tabs.toggle("#overview");
        } else if (hash.startsWith("#detailed")) {
            self._tabs.toggle("#detailed");
        } else if (hash.startsWith("#downloads")) {
            self._tabs.toggle("#downloads");
        } else if (hash.startsWith("#about")) {
            self._tabs.toggle("#about");
            self._subtabs.toggle(hash);
        } else if (hash.startsWith("#guide")) {
            self._tabs.toggle("#guide");
            self._subtabs_guide.toggle(hash);
        } else if (hash.startsWith("#toc")) {
            self._tabs.toggle("#toc");
        }
    }
}


function main(shouldPause, includeDevelopment, disableDelay) {
    const driver = new Driver(disableDelay);
    driver.setPauseUiLoop(shouldPause);
    return driver.init(includeDevelopment);
}


export {main};
