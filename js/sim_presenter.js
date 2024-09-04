import {CACHE_BUSTER, DEFAULT_YEAR, HISTORY_START_YEAR, MAX_YEAR} from "const";
import {buildSimDownload} from "exporters";
import {fetchWithRetry} from "file";
import {getGoals} from "goals";

const NUM_TRIALS = 100;


/**
 * Presenter which provides a slider representation of a simulation parameter (lever).
 */
class SimPresenter {

    /**
     * Create a new slider presenter.
     *
     * @param buildState Function to invoke to get a new state Map.
     * @param compileProgram Function to invoke to compile a plastics language program.
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

        const editorContainer = self._rootElement.querySelector(".editor");
        const editorId = editorContainer.id;
        self._editor = self._initEditor(editorId);

        self._initYears();
        self._attachListeners();

        // eslint-disable-next-line no-undef
        tippy(".tippy-btn");
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

    setYear(year) {
        const self = this;
        const yearSelector = self._rootElement.querySelector(".sim-year-select");
        yearSelector.value = year;
    }

    getYear() {
        const self = this;
        const yearSelector = self._rootElement.querySelector(".sim-year-select");
        return parseInt(yearSelector.value );
    }

    loadInitialCode() {
        const self = this;
        
        return fetchWithRetry("/pt/simulation.pt?v=" + CACHE_BUSTER)
            .then((response) => response.text())
            .then((text) => {
                self._editor.setValue(text);
                self._editor.clearSelection();
                self._checkStatus();
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

    _executeMany(count) {
        const self = this;
        const promises = Array.from(Array(count)).map(() => {
            return self._executeSingle();
        });
        return Promise.all(promises);
    }

    _executeSingle() {
        const self = this;
        return self._executeSingleInner(
            true,
            [self.getProgram()],
            [],
            [self.getYear()]
        )
        .then((x) => getGoals(x.get(self.getYear())))
        .then((x) => self._labelGoals(x, "standalone"));
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

        totalLabel.innerHTML = NUM_TRIALS;
        progressBar.max = NUM_TRIALS;

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
                self._executeMany(10).then((newResults) => {
                    completedResults.push(...newResults);
                    completed += 10;
                    displayStatus(completed);
                    if (completed < NUM_TRIALS) {
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
    }
}



function buildSimPresenter(buildState, compileProgram, onYearChange, executeSingle) {
    return new Promise((resolve) => {
        const rootElement = document.getElementById("simulation");
        const presenter = new SimPresenter(
            buildState,
            compileProgram,
            onYearChange,
            executeSingle,
            rootElement
        );
        resolve(presenter);
    });
}


export {buildSimPresenter};
