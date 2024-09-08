/**
 * Logic for running the simulation tab where monte carlo trials can be run.
 *
 * @license BSD, see LICENSE.md
 */

import {CACHE_BUSTER, DEFAULT_YEAR, HISTORY_START_YEAR, MAX_YEAR} from "const";
import {buildSimDownload, buildSimSummaryDownload} from "exporters";
import {fetchWithRetry} from "file";
import {getGoals} from "goals";

const NUM_TRIALS_STANDALONE = 1000;
const NUM_TRIALS_POLICY = 500;

const SELECTED_POLICIES = [
    {"series": "baseline", "source": "sim_bau.pt"},
    {"series": "mrc40Percent", "source": "sim_mrc.pt"},
    {"series": "wasteInvest50Billion", "source": "sim_waste_invest.pt"},
    {"series": "capVirgin", "source": "sim_cap_virgin.pt"},
    {"series": "packagingConsumptionTaxHigh", "source": "sim_packaging_tax.pt"},
    {"series": "package", "source": "sim_package.pt"},
    {"series": "recycleInvest100Billion", "source": "sim_recycle_invest.pt"},
    {"series": "mrr40Percent", "source": "sim_mrr.pt"},
    {"series": "banSingleUse", "source": "sim_ban_single_use.pt"},
    {"series": "packagingReuse80Percent", "source": "sim_packaging_reuse.pt"},
];

const SERIES_LABELS = {
    "baseline": ["BAU"],
    "mrc40Percent": ["Min", "Recycle", "Content", "(40%)"],
    "wasteInvest50Billion": ["50B", "Waste", "Invest"],
    "capVirgin": ["Cap", "Virgin", "2020"],
    "packagingConsumptionTaxHigh": ["Packaging", "Tax"],
    "package": ["4", "Policy", "Package"],
    "recycleInvest100Billion": ["100B", "Recycle", "Invest"],
    "mrr40Percent": ["Min", "Recycle", "Collect", "Rate (40%)"],
    "banSingleUse": ["Ban", "Single", "Use (90%)"],
    "packagingReuse80Percent": ["Packaging", "Reuse (80%)"],
};

const STANDALONE_X_TITLES = {
    "landfillWaste": "Global Landfill Waste (Mt)",
    "mismanagedWaste": "Global Mismanaged Waste (Mt)",
    "incineratedWaste": "Global Incinerated Waste (Mt)",
    "recycling": "Global Recycled Waste (Mt)",
    "totalConsumption": "Global Total Consumption (Mt)",
    "ghg": "Global Gross GHG (CO2e Mt)",
    "primaryProduction": "Primary Production (Mt)",
    "secondaryProduction": "Secondary Production (Mt)",
    "consumptionPackagingMT": "Packaging Consumption (Mt)"
};

/**
 * Presenter which provides a slider representation of a simulation parameter (lever).
 */
class SimPresenter {
    /**
     * Create a new slider presenter.
     *
     * @param buildState Function to invoke to get a new state Map.
     * @param compileProgram Function to invoke to compile a plastics language program.
     * @param onYearChange Callback to invoke when the user changes the year selected.
     * @param executeSingle Function to call to execute a single simulation.
     * @param rootElement Element where this editor is to be rendered.
     */
    constructor(buildState, compileProgram, onYearChange, executeSingle, rootElement) {
        const self = this;

        self._rootElement = rootElement;
        self._d3Selection = d3.select(self._rootElement);
        self._buildState = buildState;
        self._compileProgram = compileProgram;
        self._onYearChange = onYearChange;
        self._executeSingleInner = executeSingle;
        self._policies = [];

        self._standaloneReportPresenter = new StandaloneReportPresenter(
            self._rootElement.querySelector(".sim-standalone-results-panel"),
        );

        self._policiesReportPresenter = new PoliciesReportPresenter(
            self._rootElement.querySelector(".sim-policies-results-panel"),
        );

        const editorContainer = self._rootElement.querySelector(".editor");
        const editorId = editorContainer.id;
        self._editor = self._initEditor(editorId);

        self._initYears();

        // eslint-disable-next-line no-undef
        tippy(".tippy-btn");

        // eslint-disable-next-line no-undef
        tippy(".sim-year-select");
    }

    /**
     * Compile the current program for simulations.
     *
     * @returns The compilation of the current code which may be edited by the user.
     */
    getProgram() {
        const self = this;

        const getProgramNoCache = () => {
            const input = self._editor.getValue();
            const compileResult = self._compileProgram(input);

            const hasErrors = compileResult.getErrors().length > 0;
            const hasProgram = compileResult.getProgram() !== null;

            if (hasErrors) {
                const errorsStr = compileResult.getErrors().join("\n\n");
                self._showError(errorsStr);
                return null;
            } else if (hasProgram) {
                self._showError(null);
                return compileResult.getProgram();
            } else {
                self._showError(null);
                return null;
            }
        };

        if (self._programCache === null) {
            self._programCache = getProgramNoCache();
        }

        return self._programCache;
    }

    /**
     * Show the inspection table for debugging.
     *
     * @param inspects Array describing the inspection results.
     */
    showInspects(inspects) {
        const self = this;

        const hasInspects = inspects.length > 0;
        const inspectsArea = self._rootElement.querySelector(".inspects-area");

        if (!hasInspects) {
            inspectsArea.innerHTML = "";
            return;
        }

        const leverTemplateFuture = fetchWithRetry("/template/variables.html?v=" + CACHE_BUSTER)
            .then((x) => x.text())
            .then((x) => getHandlebars().compile(x))
            .then((template) => {
                const inspectsHtml = template({"variables": inspects});
                inspectsArea.innerHTML = inspectsHtml;
            });
    }

    /**
     * Specify the year to be simulated.
     *
     * @param year The year as an integer.
     */
    setYear(year) {
        const self = this;
        const yearSelector = self._rootElement.querySelector(".sim-year-select");
        yearSelector.value = year;
    }

    /**
     * Get the year being simulated.
     *
     * @returns The year currently selected by the user as an integer.
     */
    getYear() {
        const self = this;
        const yearSelector = self._rootElement.querySelector(".sim-year-select");
        return parseInt(yearSelector.value );
    }

    /**
     * Load code for policies and the simulation default code.
     */
    loadInitialCode() {
        const self = this;

        const futureMainCode = fetchWithRetry("/pt/simulation.pt?v=" + CACHE_BUSTER)
            .then((response) => response.text())
            .then((text) => {
                self._editor.setValue(text);
                self._editor.clearSelection();
                self._checkStatus();
            });

        const futurePolicies = self._getPolicyPrograms()
            .then((policies) => {
                self._policies = policies;
                return policies;
            });

        Promise.all([futureMainCode, futurePolicies]).then((results) => {
            self._attachListeners();
        });
    }

    _initYears() {
        const self = this;

        const years = [];
        for (let year = HISTORY_START_YEAR; year <= MAX_YEAR; year++) {
            years.push(year);
        }

        self._d3Selection
            .select(".sim-year-select")
            .selectAll(".year")
            .data(years)
            .enter()
            .append("option")
            .attr("value", (x) => x)
            .html((x) => x)
            .classed("year", true);

        self.setYear(DEFAULT_YEAR);
    }

    _attachListeners() {
        const self = this;

        const yearSelector = self._rootElement.querySelector(".sim-year-select");
        yearSelector.addEventListener("change", () => {
            self._onYearChange(self.getYear());
        });

        const executeStandaloneLink = self._rootElement.querySelector("#run-standalone");
        executeStandaloneLink.addEventListener("click", (event) => {
            self._runStandalone().then((x) => {
                self._reportStandalone(x);
            });
            event.preventDefault();
        });

        const executePoliciesLink = self._rootElement.querySelector("#run-policies");
        executePoliciesLink.addEventListener("click", (event) => {
            self._runPolicies().then((x) => {
                self._reportPolicies(x);
            });
            event.preventDefault();
        });

        const standaloneFinishLink = self._rootElement.querySelector("#finish-standalone");
        standaloneFinishLink.addEventListener("click", (event) => {
            self._resetUI();
            event.preventDefault();
        });

        const policiesFinishLink = self._rootElement.querySelector("#finish-policies");
        policiesFinishLink.addEventListener("click", (event) => {
            self._resetUI();
            event.preventDefault();
        });
    }

    _checkStatus(text) {
        const self = this;

        // Invalid cache
        self._programCache = null;

        // Get new program
        const program = self.getProgram();
        if (program === null) {
            return;
        }

        // Run program
        const state = self._buildState();
        try {
            program(state);
            self._showError(null);
        } catch (error) {
            self._showError(error);
        }
    }

    _showError(text) {
        const self = this;

        const errorIndicator = self._rootElement.querySelector(
            ".error-indicator",
        );
        const actionsArea = self._rootElement.querySelector(
            ".sim-actions",
        );
        const display = self._rootElement.querySelector(".status-display");

        if (text === null) {
            errorIndicator.style.display = "none";
            display.style.display = "none";
            actionsArea.style.display = "block";
        } else {
            display.textContent = text;
            display.style.display = "block";
            errorIndicator.style.display = "block";
            actionsArea.style.display = "none";
        }
    }

    /**
     * Initalize the editor.
     */
    _initEditor(editorId) {
        const self = this;

        const editor = self._getAce().edit(editorId);
        editor.getSession().setUseWorker(false);

        editor.session.setOptions({
            tabSize: 2,
            useSoftTabs: true,
        });

        editor.setOption("printMarginColumn", 100);
        editor.setOption("enableKeyboardAccessibility", true);

        editor.setTheme("ace/theme/textmate");

        let timeoutId = null;
        editor.on("change", () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }
            timeoutId = setTimeout(() => {
                timeoutId = null;
                self._checkStatus();
            }, 500);
        });

        return editor;
    }

    _getAce() {
        const self = this;
        // eslint-disable-next-line no-undef
        return ace;
    }

    _executeMany(count, label, setupProgram) {
        const self = this;
        const promises = Array.from(Array(count)).map(() => {
            return self._executeSingle(label, setupProgram);
        });
        return Promise.all(promises);
    }

    _executeSingle(label, setupProgram) {
        const self = this;

        const prePrograms = [self.getProgram()];
        if (setupProgram !== undefined) {
            prePrograms.push(setupProgram);
        }

        const singleFuture = self._executeSingleInner(
            true,
            prePrograms,
            [],
            [self.getYear()],
        );

        return singleFuture.then((x) => getGoals(x.get(self.getYear())))
            .then((x) => self._labelGoals(x, label))
            .then((x) => x, (err) => {
                throw ("Failed on " + label + " with " + err);
            });
    }

    _labelGoals(targets, label) {
        const self = this;
        targets.forEach((regionInfo) => {
            regionInfo.set("series", label);
        });
        return targets;
    }

    _runStandalone() {
        const self = this;

        const editor = self._rootElement.querySelector(".editor-panel");
        editor.style.display = "none";

        const progressPanel = self._rootElement.querySelector(".sim-progress-panel");
        progressPanel.style.display = "block";

        const completeLabel = self._rootElement.querySelector(".complete-sim-count");
        const totalLabel = self._rootElement.querySelector(".total-sim-count");
        const progressBar = self._rootElement.querySelector(".sim-progress-bar");

        totalLabel.innerHTML = NUM_TRIALS_STANDALONE;
        progressBar.max = NUM_TRIALS_STANDALONE;

        const displayStatus = (completed) => {
            completeLabel.innerHTML = completed;
            progressBar.value = completed;
            progressBar.innerHTML = completed;
        };

        displayStatus(0);

        return new Promise((resolve) => {
            let completed = 0;
            const completedResults = [];

            const continueSimulations = () => {
                setTimeout(onSimResults, 10);
            };

            const onSimResults = () => {
                self._executeMany(10, "standalone").then((newResults) => {
                    completedResults.push(...newResults);
                    completed += 10;
                    displayStatus(completed);
                    if (completed < NUM_TRIALS_STANDALONE) {
                        continueSimulations();
                    } else {
                        resolve(completedResults);
                    }
                });
            };

            continueSimulations();
        });
    }

    _reportStandalone(allResults) {
        const self = this;
        const outputLink = buildSimDownload(allResults);

        const progressPanel = self._rootElement.querySelector(".sim-progress-panel");
        const resultsPanel = self._rootElement.querySelector(".sim-standalone-results-panel");

        progressPanel.style.display = "none";
        resultsPanel.style.display = "block";

        const downloadLink = self._rootElement.querySelector("#export-standalone");
        downloadLink.href = outputLink;

        self._standaloneReportPresenter.setResults(allResults);
    }

    _runPolicies() {
        const self = this;

        const editor = self._rootElement.querySelector(".editor-panel");
        editor.style.display = "none";

        const progressPanel = self._rootElement.querySelector(".sim-progress-panel");
        progressPanel.style.display = "block";

        const completeLabel = self._rootElement.querySelector(".complete-sim-count");
        const totalLabel = self._rootElement.querySelector(".total-sim-count");
        const progressBar = self._rootElement.querySelector(".sim-progress-bar");

        totalLabel.innerHTML = NUM_TRIALS_POLICY * self._policies.length;
        progressBar.max = NUM_TRIALS_POLICY * self._policies.length;

        const displayStatus = (completed) => {
            completeLabel.innerHTML = completed;
            progressBar.value = completed;
            progressBar.innerHTML = completed;
        };

        displayStatus(0);

        let totalCompleted = 0;
        const completedResults = [];

        const executePolicy = (policyInfo) => {
            const policyName = policyInfo["series"];
            const policyProgram = policyInfo["program"];

            return new Promise((innerResolve) => {
                let completed = 0;

                const continueSimulations = () => {
                    setTimeout(onSimResults, 10);
                };

                const onSimResults = () => {
                    self._executeMany(10, policyName, policyProgram).then((newResults) => {
                        completedResults.push(...newResults);
                        completed += 10;
                        totalCompleted += 10;
                        displayStatus(totalCompleted);
                        if (completed < NUM_TRIALS_POLICY) {
                            continueSimulations();
                        } else {
                            innerResolve(completedResults);
                        }
                    });
                };

                continueSimulations();
            });
        };

        const policyFutures = self._policies.map(executePolicy);

        return Promise.all(policyFutures).then((results) => results.flat());
    }

    _reportPolicies(allResults) {
        const self = this;

        const summarizedRecords = self._summarizeRecords(allResults);

        const progressPanel = self._rootElement.querySelector(".sim-progress-panel");
        const resultsPanel = self._rootElement.querySelector(".sim-policies-results-panel");

        progressPanel.style.display = "none";
        resultsPanel.style.display = "block";

        const outputLink = buildSimSummaryDownload(summarizedRecords);
        const downloadLink = self._rootElement.querySelector("#export-policies");
        downloadLink.href = outputLink;

        self._policiesReportPresenter.setResults(summarizedRecords);
    }

    _summarizeRecords(allResults) {
        const self = this;

        const allResultsByKey = new Map();
        allResults.forEach((inputRecord) => {
            Array.of(...inputRecord.keys()).forEach((region) => {
                const regionRecord = inputRecord.get(region);
                const series = regionRecord.get("series");
                const variables = Array.of(...regionRecord.keys())
                    .filter((x) => x !== "series")
                    .filter((x) => x !== "region");

                return variables.forEach((variable) => {
                    const key = [series, region, variable].join("\t");
                    const value = regionRecord.get(variable);
                    if (!allResultsByKey.has(key)) {
                        allResultsByKey.set(key, []);
                    }
                    allResultsByKey.get(key).push(value);
                });
            });
        });

        const summarizedRecords = [];
        allResultsByKey.forEach((values, key) => {
            const keyComponents = key.split("\t");
            const series = keyComponents[0];
            const region = keyComponents[1];
            const variable = keyComponents[2];
            const mean = getMean(values);
            const std = getStandardDeviation(values);
            summarizedRecords.push({
                "series": series,
                "region": region,
                "variable": variable,
                "mean": mean,
                "std": std,
            });
        });

        return summarizedRecords;
    }

    _resetUI() {
        const self = this;

        const editorPanel = self._rootElement.querySelector(".editor-panel");
        const progressPanel = self._rootElement.querySelector(".sim-progress-panel");
        const standaloneResultsPanel = self._rootElement.querySelector(
            ".sim-standalone-results-panel",
        );
        const policiesResultsPanel = self._rootElement.querySelector(
            ".sim-policies-results-panel",
        );

        editorPanel.style.display = "block";
        progressPanel.style.display = "none";
        standaloneResultsPanel.style.display = "none";
        policiesResultsPanel.style.display = "none";
    }

    _getPolicyPrograms() {
        const self = this;

        const promises = SELECTED_POLICIES.map((policyRecord) => {
            return fetchWithRetry("/pt/" + policyRecord["source"] + "?v=" + CACHE_BUSTER)
                .then((response) => response.text())
                .then((text) => {
                    const compileResult = self._compileProgram(text);
                    const hasErrors = compileResult.getErrors().length > 0;

                    if (hasErrors) {
                        console.log("Failed to load: " + policyRecord["source"]);
                    }

                    const program = compileResult.getProgram();
                    const hasProgram = program !== null;
                    return hasProgram ? program : null;
                })
                .then((program) => {
                    return {
                        "series": policyRecord["series"],
                        "source": policyRecord["source"],
                        "program": program,
                    };
                });
        });

        return Promise.all(promises);
    }
}


class StandaloneReportPresenter {
    constructor(rootElement) {
        const self = this;
        self._rootElement = rootElement;
        self._results = null;
        self._chart = null;

        self._attachListeners();
    }

    setResults(results) {
        const self = this;
        self._results = results;
        self._refreshChart();
    }

    _getSelectedDimension() {
        const self = this;

        const dropdown = self._rootElement.querySelector(".standalone-dim-selector");
        return dropdown.value;
    }

    _attachListeners() {
        const self = this;

        const dropdown = self._rootElement.querySelector(".standalone-dim-selector");
        dropdown.addEventListener("change", () => {
            self._refreshChart();
        });
    }

    _refreshChart() {
        const self = this;

        if (self._chart !== null) {
            self._chart.destroy();
        }

        const percentInfo = self._getPercents();
        const dimension = self._getSelectedDimension();

        const canvas = self._rootElement.querySelector(".standalone-canvas");

        self._chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: percentInfo.map((x) => x["bucket"]),
                datasets: [{
                    label: "Percent of Simulations",
                    data: percentInfo.map((x) => x["percent"]),
                }],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            "display": true,
                            "text": "Frequency of Simulations (%)",
                        },
                    },
                    x: {
                        title: {
                            "display": true,
                            "text": STANDALONE_X_TITLES[dimension],
                        },
                    },
                },
            },
        });
    }

    _getPercents() {
        const self = this;
        const dimension = self._getSelectedDimension();
        const globalResults = self._results.map((x) => x.get("global"));
        const dimensionResults = globalResults.map((x) => x.get(dimension));

        const counts = new Map();

        const valuesRounded = dimensionResults.map((x) => Math.round(x / 10) * 10);
        const minValue = Math.min(...valuesRounded);
        const maxValue = Math.max(...valuesRounded);
        for (let x = minValue; x <= maxValue; x += 10) {
            counts.set(x, 0);
        }

        dimensionResults.forEach((x) => {
            const bucket = Math.round(x / 10) * 10;
            counts.set(bucket, counts.get(bucket) + 1);
        });

        const percents = new Map();
        counts.forEach((count, bucket) => {
            percents.set(bucket, count / dimensionResults.length * 100);
        });

        const outputRecords = [];
        percents.forEach((percent, bucket) => {
            outputRecords.push({"bucket": bucket, "percent": percent});
        });

        outputRecords.sort((a, b) => a["bucket"] - b["bucket"]);

        return outputRecords;
    }
}

class PoliciesReportPresenter {
    constructor(rootElement) {
        const self = this;
        self._rootElement = rootElement;
        self._results = null;
        self._chart = null;

        self._attachListeners();
    }

    setResults(results) {
        const self = this;
        self._results = results.filter((x) => x["region"] === "global");
        self._refreshChart();
    }

    _getSelectedDimension() {
        const self = this;

        const dropdown = self._rootElement.querySelector(".policies-dim-selector");
        return dropdown.value;
    }

    _getIntervalInStd() {
        const self = this;

        const dropdown = self._rootElement.querySelector(".policies-interval-selector");
        return parseInt(dropdown.value);
    }

    _attachListeners() {
        const self = this;

        const dimDropdown = self._rootElement.querySelector(".policies-dim-selector");
        dimDropdown.addEventListener("change", () => {
            self._refreshChart();
        });

        const intervalDropdown = self._rootElement.querySelector(".policies-interval-selector");
        intervalDropdown.addEventListener("change", () => {
            self._refreshChart();
        });
    }

    _refreshChart() {
        const self = this;

        if (self._chart !== null) {
            self._chart.destroy();
        }

        const dimension = self._getSelectedDimension();
        const interval = self._getIntervalInStd();

        const canvas = self._rootElement.querySelector(".policies-canvas");

        const variableResults = self._results.filter((x) => x["variable"] === dimension);

        self._chart = new Chart(canvas, {
            type: "bar",
            data: {
                labels: variableResults.map((x) => SERIES_LABELS[x["series"]]),
                datasets: [{
                    label: "+/- " + interval + " std",
                    data: variableResults.map((x) => {
                        const mean = x["mean"];
                        const std = x["std"];
                        const low = mean - std * interval;
                        const high = mean + std * interval;
                        return [Math.round(low * 10) / 10, Math.round(high * 10) / 10];
                    }),
                }],
            },
            options: {
                scales: {
                    y: {
                        beginAtZero: true,
                        title: {
                            "display": true,
                            "text": STANDALONE_X_TITLES[dimension],
                        },
                    },
                    x: {
                        title: {
                            "display": true,
                            "text": "Scenario",
                        },
                    },
                },
            },
        });
    }
}


/**
 * Get the mean value of an array.
 *
 * @param target Array of numbers
 * @returns Mean
 */
function getMean(target) {
    if (target.length == 0) {
        return 0;
    }

    const total = target.reduce((a, b) => a + b);
    const mean = total / target.length;
    return mean;
}


/**
 * Get the standard deviation of an array.
 *
 * @param target Array of numbers
 * @returns Standard deviation
 */
function getStandardDeviation(target) {
    if (target.length == 0) {
        return 0;
    }

    const total = target.reduce((a, b) => a + b);
    const mean = total / target.length;
    const varianceNum = target.map((x) => Math.pow(x - mean, 2)).reduce((a, b) => a + b);
    const variance = varianceNum / target.length;
    const std = Math.sqrt(variance);
    return std;
};


/**
 * Create a new simulation tab presenter.
 *
 * @param buildState Function to invoke to get a new state Map.
 * @param compileProgram Function to invoke to compile a plastics language program.
 * @param onYearChange Callback to invoke when the user changes the year selected.
 * @param executeSingle Function to call to execute a single simulation.
 * @returns Promise that resolves to the simulation presenter.
 */
function buildSimPresenter(buildState, compileProgram, onYearChange, executeSingle) {
    return new Promise((resolve) => {
        const rootElement = document.getElementById("simulation");
        const presenter = new SimPresenter(
            buildState,
            compileProgram,
            onYearChange,
            executeSingle,
            rootElement,
        );
        resolve(presenter);
    });
}


export {buildSimPresenter};
