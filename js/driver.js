/**
 * Entrypoint for the plastics decision support tool.
 *
 * @license BSD, see LICENSE.md
 */

import {
    ALL_ATTRS,
    FLAG_DEFAULT_GHG,
    FLAG_DEFAULT_GHG_EXPORT,
    FLAG_DEFAULT_THREADS,
    HISTORY_START_YEAR,
    MAX_YEAR,
    START_YEAR,
} from "const";
import {buildCompiler} from "compiler";
import {buildDataLayer} from "data";
import {FilePresenter} from "file";
import {addGlobalToState} from "geotools";
import {buildOverviewPresenter} from "overview";
import {buildReportPresenter} from "report";
import {buildSliders} from "slider";


const ACCESSIBILITY_MSG = "Prior tool settings found. Do you want to load them?";
const SCROLL_REFRESH_MSG = [
    "This accessibility setting requires the application to reload.",
    "Your policy settings will be saved.",
    "Do you want to reload now?",
].join(" ");
const REFRESH_LATER_MESSAGE = "When you refresh later, your changes will update.";


/**
 * Top level presenter that run delegation to component-level presenters.
 */
class Driver {
    /**
     * Create a new driver.
     *
     * @param disableDelay True if render delays for performace should be disabled and false
     *      otherwise.
     */
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
        self._lastYear = MAX_YEAR;
        self._polymerWorkerQueue = new PolymerWorkerQueue();

        self._historicYears = [];
        for (let year = HISTORY_START_YEAR; year < START_YEAR; year++) {
            self._historicYears.push(year);
        }

        self._projectionYears = [];
        for (let year = START_YEAR; year <= MAX_YEAR; year++) {
            self._projectionYears.push(year);
        }

        self._pauseUiLoop = true;

        self._registerGlobalAccessibiltyControls();
        self._loadFeatureFlags();

        setTimeout(() => {
            self._loadAccessibility();
        }, 3000);

        setTimeout(() => {
            self._checkUpdate();
        }, 6000);
    }

    /**
     * Indicate if UI updates should be paused like during bulk updates.
     *
     * @param shouldPause True if the UI updates should be paused and false otherwise.
     */
    setPauseUiLoop(shouldPause) {
        const self = this;
        self._pauseUiLoop = shouldPause;
    }

    /**
     * Initialize the decision support tool.
     *
     * @param includeDevelopment True if unreleased levers should be included and false if they
     *      should be hidden.
     * @returns Promise which resolves after the initalization is complete.
     */
    init(includeDevelopment) {
        const self = this;

        return new Promise((outerResolve) => {
            // eslint-disable-next-line no-undef
            self._tabs = new Tabby("[data-tabs]");

            self._subtabs = new Tabby("[data-sub-tabs-about]");
            self._subtabs_guide = new Tabby("[data-sub-tabs-guide]");

            document.addEventListener("tabby", (event) => {
                if (self._reportPresenter !== null) {
                    self._reportPresenter.rebuildViz();
                }

                if (event.target.href.indexOf("#detailed") != -1) {
                    document.querySelector(".custom-menu-check").checked = true;
                }

                history.pushState(
                    null,
                    null,
                    "#" + event.target.href.split("#")[1],
                );
                self._onInputChange();
            }, false);

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

    /**
     * Get a collection of SliderPresenters.
     *
     * @returns Levers in the visualization.
     */
    _getLevers() {
        const self = this;
        return self._levers;
    }

    /**
     * Build a state Map for year which can be run through plastics language interventinos.
     *
     * @param year The year for which to build the state.
     * @param allowChanges If true, use current value of lever. If false, use default.
     * @returns State as a Map.
     */
    _buildState(year, allowChanges) {
        const self = this;

        const meta = new Map();
        meta.set("year", year);

        const state = self._dataLayer.buildState(year, allowChanges);
        state.set("meta", meta);

        return state;
    }

    /**
     * Build a state Map for the currently selected year.
     *
     * @returns State which can be fed into the plastics language scripts.
     */
    _buildStateForCurrentYear() {
        const self = this;

        const year = self._reportPresenter.getSelection().getYear();
        const state = self._buildState(year, true);
        self._addGlobalToState(state);
        return state;
    }

    /**
     * Convienence function which can compile plastics language scripts to lambdas.
     *
     * @param code String code to be compiled.
     * @returns Lambda compiled from the code.
     */
    _compileProgram(code) {
        const self = this;
        return self._compiler.compile(code);
    }

    /**
     * Build states for all years in the simulation tool.
     *
     * @param runPrograms True if the scripts should be run and false otherwise.
     * @returns Map from year to state Map for that year.
     */
    _getStates(runPrograms) {
        const self = this;

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

        const historicStates = self._historicYears.map((year) => {
            return {"year": year, "state": self._buildState(year, runPrograms)};
        });
        const projectionStates = self._projectionYears.map((year) => {
            const state = self._buildState(year, runPrograms);

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

            return {"year": year, "state": state};
        });

        const allStates = historicStates.concat(projectionStates);
        const promises = allStates.map((task) => {
            const year = task["year"];
            const state = task["state"];
            return self._polymerWorkerQueue.request(year, state);
        });

        return Promise.all(promises).then((tasks) => {
            const states = new Map();

            tasks.forEach((task) => {
                const year = task["year"];
                const state = task["state"];
                states.set(year, state);
            });

            return states;
        });
    }

    /**
     * Callback when the sliders / levers change.
     */
    _onSlidersChange() {
        const self = this;
        self._reportPresenter.showDeltaCheck();
        self._onInputChange();
    }

    /**
     * Callback when the year selected in the simulation (highlighted) is changed.
     *
     * @param year The year to select in the tool.
     */
    _onYearChange(year) {
        const self = this;

        self._lastYear = year;
        self._reportPresenter.setYear(year);
        self._overviewPresenter.setYear(year);
        self._onInputChange();
    }

    /**
     * Callback for when any visualization inputs (including levers) are changed.
     */
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

            const businessAsUsualFuture = self._getStates(false);
            const withInterventionsFuture = self._getStates(true);

            Promise.all([businessAsUsualFuture, withInterventionsFuture])
                .then((results) => {
                    const businessAsUsual = results[0];
                    const withInterventions = results[1];
                    self._updateOutputs(businessAsUsual, withInterventions, timestamp);
                    self._redrawTimeout = null;
                })
                .catch((error) => {
                    console.log(error);
                    alert("Whoops! The engine ran into an exception.");
                    throw error;
                });
        };

        // Give the UI loop a minute to catch up from OS
        if (self._pauseUiLoop) {
            reschedule();
        } else {
            execute();
        }
    }

    /**
     * Update the output displays in the visualization.
     *
     * @param businessAsUsual Business as usual projections.
     * @param withInterventions BAU projections after applying plastics scripts interventions.
     * @param timestamp The timestamp for when this update was requested. This will be cancelled if
     *      an update with a later timestamp is requested afterwards.
     */
    _updateOutputs(businessAsUsual, withInterventions, timestamp) {
        const self = this;

        const executeReport = () => {
            self._reportPresenter.render(businessAsUsual, withInterventions);
            self._overviewPresenter.render(businessAsUsual, withInterventions);
        };

        const executeLevers = () => {
            self._levers.forEach((lever) => lever.refreshSelection());
        };

        if (self._disableDelay) {
            executeReport();
            executeLevers();
        } else {
            setTimeout(() => {
                if (timestamp == self._latestRequest) {
                    executeReport();
                }
            }, 25);
            setTimeout(() => {
                if (timestamp == self._latestRequest) {
                    executeLevers();
                }
            }, 1500);
        }
    }

    /**
     * Add global values to a state Map.
     *
     * @param state The state Map to which global values should be added.
     * @returns The state Map after updated.
     */
    _addGlobalToState(state) {
        const self = this;
        return addGlobalToState(state);
    }

    /**
     * Establish listeners for when the browser dimension changes.
     *
     * Establish listeners for when the browser dimension changes, causing an update in layout if
     * needed.
     */
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

    /**
     * Callback when a policy has changed.
     *
     * @param change Structure (object) describing a change in different levers with name of lever
     *      ("lever") and the new value ("value").
     * @param selected True if the value of the lever should be updated to the value provided. False
     *      if the lever should be reset to default.
     */
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

    /**
     * Get the d3 library entrypoint.
     *
     * @returns Get the d3 object.
     */
    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }

    /**
     * Update which set of tabs are selected based on window location hash.
     */
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
        } else if (hash.startsWith("#settings")) {
            self._tabs.toggle("#settings");
            self._subtabs.toggle(hash);
        } else if (hash.startsWith("#guide")) {
            self._tabs.toggle("#guide");
            self._subtabs_guide.toggle(hash);
        } else if (hash.startsWith("#toc")) {
            self._tabs.toggle("#toc");
        }
    }

    /**
     * Check for updates if network is available.
     */
    _checkUpdate() {
        fetch("/js/version.txt")
            .then((response) => {
                if (!response.ok) {
                    return;
                }
                return response.text();
            })
            .then((rawText) => rawText.trim())
            .then((trimmedText) => parseFloat(trimmedText))
            .then((newVersion) => {
                const versionInput = document.getElementById("version-number");
                const currentVersion = versionInput === null ? 0 : parseFloat(versionInput.value);

                if (newVersion > currentVersion) {
                    document.querySelector(".fallback-warning").style.display = "block";
                }
            });
    }

    /**
     * Register callbacks for global accessiblity controls.
     */
    _registerGlobalAccessibiltyControls() {
        const self = this;
        Array.of(...document.querySelectorAll(".color-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                self._onInputChange();
            });
        });

        Array.of(...document.querySelectorAll(".header-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                self._refreshAccessibility();
            });
        });

        Array.of(...document.querySelectorAll(".toggle-editor-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                self._refreshAccessibility();
            });
        });

        Array.of(...document.querySelectorAll(".viz-table-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                self._refreshAccessibility();
            });
        });

        Array.of(...document.querySelectorAll(".toggle-scroll-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                if (confirm(SCROLL_REFRESH_MSG)) {
                    self._filePresenter.writeToUrl();
                    self._persistAccessibility();
                    location.reload();
                } else {
                    alert(REFRESH_LATER_MESSAGE);
                }
            });
        });

        Array.of(...document.querySelectorAll(".access-radio")).forEach((elem) => {
            elem.addEventListener("click", () => {
                self._persistAccessibility();
            });
        });

        Array.of(...document.querySelectorAll(".next-year-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                if (self._lastYear == MAX_YEAR) {
                    alert("Reached maximum year");
                    return;
                }
                self._onYearChange(self._lastYear + 1);
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".previous-year-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                if (self._lastYear == HISTORY_START_YEAR) {
                    alert("Reached minimum year");
                    return;
                }
                self._onYearChange(self._lastYear - 1);
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".china-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                self._reportPresenter.setRegion("china");
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".eu30-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                self._reportPresenter.setRegion("eu30");
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".nafta-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                self._reportPresenter.setRegion("nafta");
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".row-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                self._reportPresenter.setRegion("row");
                e.preventDefault();
            });
        });

        Array.of(...document.querySelectorAll(".global-button")).forEach((elem) => {
            elem.addEventListener("click", (e) => {
                self._reportPresenter.setRegion("global");
                e.preventDefault();
            });
        });
    }

    _refreshAccessibility() {
        const self = this;

        const useStatic = document.getElementById("static-header-radio").checked;
        Array.of(...document.querySelectorAll(".static-h2")).forEach((header) => {
            if (useStatic) {
                header.style.display = "block";
            } else {
                header.style.display = "none";
            }
        });
        Array.of(...document.querySelectorAll(".interactive-h2")).forEach((header) => {
            if (useStatic) {
                header.style.display = "none";
            } else {
                header.style.display = "block";
            }
        });

        const showEditors = document.getElementById("show-editor-radio").checked;
        Array.of(...document.querySelectorAll(".editor")).forEach((header) => {
            if (showEditors) {
                header.style.display = "block";
            } else {
                header.style.display = "none";
            }
        });

        const showTables = document.getElementById("show-table-radio").checked;
        Array.of(...document.querySelectorAll(".table-option")).forEach((target) => {
            if (showTables) {
                target.style.display = "block";
            } else {
                target.style.display = "none";
            }
        });
        Array.of(...document.querySelectorAll(".viz-option")).forEach((target) => {
            if (showTables) {
                target.style.display = "none";
            } else {
                target.style.display = "block";
            }
        });
    }

    _persistAccessibility() {
        const self = this;

        const getRadio = (id) => {
            return document.getElementById(id).checked;
        };

        const linearOn = getRadio("linear-radio");
        const contrastOn = getRadio("high-contrast-radio");
        const staticHeaderOn = getRadio("static-header-radio");
        const tablesOn = getRadio("show-table-radio");
        const hideEditorOn = getRadio("hide-editor-radio");
        const disableScrollOn = getRadio("disable-scroll-radio");

        const optionsLinear = [
            linearOn,
            contrastOn,
            staticHeaderOn,
            tablesOn,
            hideEditorOn,
            disableScrollOn,
        ];
        const optionsEnabled = optionsLinear.filter((x) => x);
        const numOptionsEnabled = optionsEnabled.length;

        const cookiesManager = self._getCookiesManager();
        const priorValue = cookiesManager.get("accessibility");
        if (numOptionsEnabled > 0) {
            cookiesManager.set(
                "accessibility",
                JSON.stringify({
                    "linear": linearOn,
                    "contrast": contrastOn,
                    "staticHeader": staticHeaderOn,
                    "tables": tablesOn,
                    "hideEditor": hideEditorOn,
                    "disableScroll": disableScrollOn,
                }),
                {expires: 30},
            );
        } else if (priorValue !== undefined && priorValue !== null) {
            cookiesManager.remove("accessibility");
        }
    }

    _loadAccessibility() {
        const self = this;
        const cookiesManager = self._getCookiesManager();

        const accessibilityValue = cookiesManager.get("accessibility");
        if (accessibilityValue === null || accessibilityValue === undefined) {
            self._applyScroll();
            return;
        }

        if (!confirm(ACCESSIBILITY_MSG)) {
            cookiesManager.remove("accessibility");
            self._applyScroll();
            return;
        }

        const setRadio = (id, check) => {
            if (check) {
                document.getElementById(id).checked = true;
            }
        };

        const config = JSON.parse(accessibilityValue);

        setRadio("linear-radio", config["linear"]);
        setRadio("high-contrast-radio", config["contrast"]);
        setRadio("static-header-radio", config["staticHeader"]);
        setRadio("show-table-radio", config["tables"]);
        setRadio("hide-editor-radio", config["hideEditor"]);
        setRadio("disable-scroll-radio", config["disableScroll"]);

        self._refreshAccessibility();
        self._applyScroll();
    }

    _applyScroll() {
        const simpleScroll = document.getElementById("disable-scroll-radio").checked;
        Array.of(...document.querySelectorAll(".overflowing-enabled")).forEach((target) => {
            if (simpleScroll) {
                target.classList.add("overflowing-disabled");
                target.classList.remove("overflowing-enabled");
            // eslint-disable-next-line no-undef
            } else if (SCROLL_ALLOWED) {
                // eslint-disable-next-line no-undef
                new SimpleBar(target, {autoHide: false});
            }
        });
    }

    _getCookiesManager() {
        const self = this;
        // eslint-disable-next-line no-undef
        return Cookies;
    }

    _loadFeatureFlags() {
        const self = this;
        const getGhgEnabled = () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("ghgEnabled")) {
                return urlParams.get("ghgEnabled") === "y";
            } else {
                return FLAG_DEFAULT_GHG;
            }
        };

        const getGhgExportEnabled = () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("ghgExportEnabled")) {
                return urlParams.get("ghgExportEnabled") === "y";
            } else {
                return FLAG_DEFAULT_GHG_EXPORT;
            }
        };

        const hideElements = (className) => {
            document.querySelectorAll("." + className).forEach(
                (x) => x.style.display = "none",
            );
        };

        const addOption = (value, name) => {
            const newOption = document.createElement("option");
            newOption.value = value;
            newOption.innerHTML = name;

            const target = document.getElementById("overview-goal-select");
            target.appendChild(newOption);
        };

        if (getGhgEnabled()) {
            hideElements("feature-flag-recycling");
            addOption("ghg", "Greenhouse Gas Emissions");
        } else {
            hideElements("feature-flag-ghg");
            addOption("recycling", "Recycling");
        }

        if (!getGhgExportEnabled()) {
            hideElements("feature-flag-ghg-export");
        }
    }
}


/**
 * Start the decision support tool.
 *
 * @param shouldPause True if updates should be paused so that UI updates are disabled. False if
 *      updates should be allowed at the start. This can be changed with setPauseUiLoop.
 * @param includeDevelopment True if unreleased levers should be included and false if they should
 *      be hidden.
 * @param disableDelay Disable UI paauses between updates. True if updates should be instant and
 *      false if the delays should be included.
 * @returns Promise which resolves after initialization.
 */
function main(shouldPause, includeDevelopment, disableDelay) {
    const driver = new Driver(disableDelay);
    driver.setPauseUiLoop(shouldPause);
    return driver.init(includeDevelopment);
}


/**
 * Facade which sends tasks to the queue potentially backed by web workers if available.
 */
class PolymerWorkerQueue {
    /**
     * Create a new queue.
     */
    constructor() {
        const self = this;
        self._workerRequestId = 0;
        self._workerCallbacks = new Map();

        const getWorkersEnabled = () => {
            const urlParams = new URLSearchParams(window.location.search);
            if (urlParams.has("threadsEnabled")) {
                return urlParams.get("threadsEnabled") === "y";
            } else {
                return FLAG_DEFAULT_THREADS;
            }
        };

        // Require that worker is supported and, for Safari, that network is available for
        // importScripts within the worker.
        self._workersFuture = new Promise((resolve) => {
            const workers = [];

            if (!window.Worker || !window.navigator.onLine || !getWorkersEnabled()) {
                console.log("Running without threads.");
                self._modifierFuture = buildModifier();
                resolve(workers);
                return;
            }

            fetch("/js/version.txt").then((response) => {
                if (response.ok) {
                    const nativeConcurrency = window.navigator.hardwareConcurrency;
                    const hasKnownConcurrency = nativeConcurrency !== undefined;
                    const concurrencyAllowed = hasKnownConcurrency ? nativeConcurrency - 1 : 1;
                    const concurrencyCap = concurrencyAllowed > 5 ? 5 : concurrencyAllowed;
                    const concurrencyDesired = concurrencyCap < 1 ? 1 : concurrencyCap;
                    for (let i = 0; i < concurrencyDesired; i++) {
                        workers.push(self._makeWorker());
                    }
                } else {
                    self._modifierFuture = buildModifier();
                }
                resolve(workers);
            });
        });
    }

    /**
     * Request processing of a year and state.
     *
     * @param year The year like 2050 for which a state is provided.
     * @param state The state object (Map) to process.
     * @returns Promise which resolves when the object is processed.
     */
    request(year, state) {
        const self = this;

        return self._workersFuture.then((workers) => {
            if (workers.length == 0) {
                return self._modifierFuture.then((modifier) => {
                    modifier.modify(year, state, ALL_ATTRS);
                    return {"year": year, "state": state};
                });
            }

            const requestId = self._workerRequestId;
            const workerId = requestId % workers.length;

            const requestObj = {
                "year": year,
                "state": state,
                "requestId": requestId,
                "attrs": ALL_ATTRS,
            };

            self._workerRequestId++;

            return new Promise((resolve, reject) => {
                self._workerCallbacks.set(requestId, {"resolve": resolve, "reject": reject});
                workers[workerId].postMessage(requestObj);
            });
        });
    }

    /**
     * Process a response from a worker.
     *
     * @param response Response from worker thread.
     */
    _onResponse(response) {
        const self = this;
        const requestId = response["requestId"];
        const year = response["year"];
        if (!self._workerCallbacks.has(requestId)) {
            return;
        }

        const callbacks = self._workerCallbacks.get(requestId);
        if (response["error"] === null) {
            callbacks["resolve"]({"year": year, "state": response["state"]});
        } else {
            callbacks["reject"](response["error"]);
        }
    }

    /**
     * Make a new web worker.
     *
     * @returns Newly constructed worker.
     */
    _makeWorker() {
        const self = this;
        const newWorker = new Worker("/js/polymers.js");
        newWorker.onmessage = (event) => self._onResponse(event.data);
        return newWorker;
    }
}


export {main};
