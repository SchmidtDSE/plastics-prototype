/**
 * Logic graphical representation of simulation levers.
 *
 * @license BSD, see LICENSE.md
 */

import {CACHE_BUSTER} from "const";
import {fetchWithRetry} from "file";
import {addGlobalToState} from "geotools";
import {getGoals} from "goals";
import {STRINGS} from "strings";


/**
 * Presenter which provides a slider representation of a simulation parameter (lever).
 */
class SliderPresenter {
    /**
     * Create a new slider presenter.
     *
     * @param buildState Function to invoke to get a new state Map.
     * @param compileProgram Function to invoke to compile a plastics language program.
     * @param config The lever configuratoin.
     * @param rootElement Element where this slider is to be rendered.
     * @param onChange Callback to invoke if the slider / lever value is changed.
     * @param getSelection Function to invoke to get the current visualization selection
     *      (ReportSelection).
     * @param priority The priority level assigned to this lever.
     */
    constructor(buildState, compileProgram, config, rootElement, onChange,
        getSelection, priority) {
        const self = this;

        self._config = config;
        self._rootElement = rootElement;
        self._onChange = onChange;
        self._buildState = buildState;
        self._compileProgram = compileProgram;
        self._getSelection = getSelection;
        self._programCache = null;
        self._priority = priority;

        const editorContainer = self._rootElement.querySelector(".editor");
        const editorId = editorContainer.id;
        self._editor = self._initEditor(editorId);

        self._attachListeners();
        self._onInputChangeInProgress();
    }

    /**
     * Get the variable name represented by this lever.
     *
     * @returns The name of the variable manipulated by this slider.
     */
    getVariable() {
        const self = this;
        return self._config["variable"];
    }

    /**
     * Get the current value of this lever.
     *
     * @returns Current value of this variable.
     */
    getValue() {
        const self = this;
        const slider = self._rootElement.querySelector(".slider");
        return parseFloat(slider.value + "");
    }

    /**
     * Set the value of this variable.
     *
     * @param value The new value to assign to this lever / slider.
     */
    setValue(value) {
        const self = this;
        const slider = self._rootElement.querySelector(".slider");
        slider.value = value;
        self._onInputChangeInProgress();
    }

    /**
     * Reset this lever to the value given in a "fresh" scenario without interventions.
     */
    resetToDefault() {
        const self = this;
        const defaultValue = self.getDefault();
        self.setValue(defaultValue);
    }

    /**
     * Get the default value for this lever.
     *
     * @returns The default value for this lever.
     */
    getDefault() {
        const self = this;
        if (self._config["unselectDefault"] === undefined) {
            return self._config["default"];
        } else {
            return self._config["unselectDefault"];
        }
    }

    /**
     * Determine if the lever is currently in its default value.
     *
     * @returns True if at the default value (within 1 step) and false otherwise.
     */
    isAtDefault() {
        const self = this;
        const currentValue = self.getValue();
        const defaultValue = self.getDefault();
        const stepSize = self.getStepSize();
        return Math.abs(currentValue - defaultValue) < stepSize;
    }

    getStepSize() {
        const self = this;
        const configStep = self._config["step"];
        if (configStep === undefined) {
            return 0.01;
        } else {
            return configStep;
        }
    }

    /**
     * Compile the current program assigned to this lever.
     *
     * @returns The compilation of the current code for this lever which may be edited by the user.
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
     * Update the output table which estimates the current impact of the lever.
     */
    refreshSelection() {
        const self = this;
        self._refreshTable();
    }

    /**
     * Reset the slider / lever to its default value.
     */
    reset() {
        const self = this;
        self.setValue(self._config["default"]);
    }

    /**
     * Get the priority level associated with this lever.
     *
     * @returns Priority level assigned to this lever as an integer.
     */
    getPriority() {
        const self = this;
        return self._priority;
    }

    _attachListeners() {
        const self = this;

        let timeoutId = null;
        const innerSlider = self._rootElement.querySelector(".slider");
        innerSlider.addEventListener("change", () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                self._onInputChangeInProgress();
            }

            timeoutId = setTimeout(
                () => {
                    self._onInputChange();
                    timeoutId = null;
                },
                50,
            );
        });

        innerSlider.addEventListener("input", () => {
            self._onInputChangeInProgress();
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
        const display = self._rootElement.querySelector(".status-display");

        if (text === null) {
            errorIndicator.style.display = "none";
            display.style.display = "none";
        } else {
            display.textContent = text;
            display.style.display = "block";
            errorIndicator.style.display = "inline-block";
        }
    }

    _updateValueLabel() {
        const self = this;

        const innerSlider = self._rootElement.querySelector(".slider");
        const value = parseFloat(innerSlider.value);
        const units = " " + self._config["units"];
        const plus = self._config["forcePlus"] == false ? "" : "+";
        const decimals = self._config["decimals"];
        const valueDec = decimals === undefined ? value : value.toFixed(decimals);
        const valueStr = value >= 0 ? (plus + valueDec + units) : (valueDec + units);
        self._rootElement.querySelector(".delta-display").innerHTML = valueStr;
    }

    _onInputChangeInProgress() {
        const self = this;
        self._updateValueLabel();
    }

    _onInputChange(data) {
        const self = this;
        self._onInputChangeInProgress();
        self._refreshTable();
        self._onChange();
        self._checkContextInfo();
    }

    _checkContextInfo() {
        const self = this;

        if (self._config["context"] === undefined) {
            return;
        }

        const contextInfo = self._config["context"];
        const value = self.getValue();
        const minValue = contextInfo["min"];
        const maxValue = contextInfo["max"];
        const showContextInfo = value >= minValue && value <= maxValue;
        if (showContextInfo) {
            self._rootElement.querySelector(
                ".info-indicator",
            ).style.display = "inline-block";

            const contextInfoElem = self._rootElement.querySelector(".context-info");
            contextInfoElem.style.display = "block";
            contextInfoElem.innerHTML = contextInfo["message"];
        } else {
            self._rootElement.querySelector(
                ".info-indicator",
            ).style.display = "none";
            self._rootElement.querySelector(
                ".context-info",
            ).style.display = "none";
        }
    }

    _refreshTable(data) {
        const self = this;

        const region = "global";
        const regionStr = STRINGS.get(region);

        const showTable = () => {
            const newDisplay = self.getValue() == self._config["default"] ? "none" : "block";
            self._rootElement.querySelector(".goals-table").style.display = newDisplay;
        };

        const updateLabels = () => {
            const selection = self._getSelection();

            self._rootElement.querySelectorAll(".goal-table-year").forEach((elem) => {
                elem.innerHTML = selection.getYear();
            });

            self._rootElement.querySelector(".global-table-region").innerHTML = regionStr;
        };

        const updateGoals = () => {
            const selection = self._getSelection();

            const program = self.getProgram();
            if (program === null) {
                return;
            }

            const stateBefore = self._buildState();
            const stateAfter = self._buildState();
            try {
                program(stateAfter);
            } catch {
                return;
            }

            addGlobalToState(stateBefore);
            addGlobalToState(stateAfter);

            const goalsBefore = getGoals(stateBefore).get(region);
            const goalsAfter = getGoals(stateAfter).get(region);

            const getDelta = (attr) => {
                const unrounded = goalsAfter.get(attr) - goalsBefore.get(attr);
                return Math.round(unrounded * 100) / 100;
            };

            const getText = (value) => {
                const prefix = value >= 0 ? "+" : "";
                return prefix + value + " Mt";
            };

            const setText = (value, selector) => {
                self._rootElement.querySelector(selector).innerHTML = getText(value);
            };

            const deltaLandfill = getDelta("landfillWaste");
            setText(deltaLandfill, ".goal-table-landfill-waste");

            const deltaMismanaged = getDelta("mismanagedWaste");
            setText(deltaMismanaged, ".goal-table-mismanaged-waste");

            const deltaIncinerated = getDelta("incineratedWaste");
            setText(deltaIncinerated, ".goal-table-incinerated-waste");

            const deltaTotalConsumption = getDelta("recycling");
            setText(deltaTotalConsumption, ".goal-table-recycling");
        };

        showTable();
        updateLabels();
        updateGoals();
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
}


function getHandlebars() {
    // eslint-disable-next-line no-undef
    return Handlebars;
}


function buildSliders(includeDevelopment, buildState, compileProgram, onInputChange, getSelection) {
    const promiseCache = new Map();

    const fetchSafe = (url, isJson) => {
        return new Promise((resolve) => {
            const parsedFuture = fetchWithRetry(url).then((result) => {
                if (isJson) {
                    return result.json();
                } else {
                    return result.text();
                }
            });
            parsedFuture.then((x) => {
                resolve({
                    "json": () => x,
                    "text": () => x,
                });
            });
        });
    };

    const fetchCache = (url, isJson) => {
        if (url.startsWith("/pt/noop.pt?v=")) {
            return new Promise((resolve) => {
                resolve({"text": () => ""});
            });
        }

        if (promiseCache.has(url)) {
            return promiseCache.get(url);
        }

        promiseCache.set(url, fetchSafe(url, isJson));
        return promiseCache.get(url);
    };

    const listingFuture = fetchCache("/pt/index.json?v=" + CACHE_BUSTER, true)
        .then((x) => x.json())
        .then((x) => {
            x["categories"].forEach((category) => {
                category["levers"] = category["levers"].filter((lever) => {
                    if (includeDevelopment) {
                        return true;
                    } else {
                        return lever["released"] == true;
                    }
                });
            });
            return x;
        });

    const leverTemplateFuture = fetchCache("/template/slider.html?v=" + CACHE_BUSTER, false)
        .then((x) => x.text())
        .then((x) => getHandlebars().compile(x));

    const sectionTemplateFuture = fetchCache("/template/section.html?v=" + CACHE_BUSTER, false)
        .then((x) => x.text())
        .then((x) => getHandlebars().compile(x));


    const renderLever = (config, htmlTemplate) => {
        const templateUrl = "/pt/" + config["template"] + "?v=" + CACHE_BUSTER;
        return fetchCache(templateUrl, false).then((x) => x.text())
            .then((x) => getHandlebars().compile(x))
            .then((codeTemplate) => codeTemplate(config["attrs"]))
            .then((code) => {
                config["code"] = code;
                return htmlTemplate(config);
            });
    };

    const renderSection = (config, leverTemplate, sectionTemplate) => {
        const htmlFutures = config["levers"].map(
            (leverConfig) => renderLever(leverConfig, leverTemplate),
        );
        return Promise.all(htmlFutures).then((htmls) => {
            const innerHtml = htmls.join("\n");
            config["innerHtml"] = innerHtml;
            return sectionTemplate(config);
        });
    };

    return new Promise((resolve) => {
        Promise.all([listingFuture, leverTemplateFuture, sectionTemplateFuture])
            .then((values) => {
                const listing = values[0];
                const leverTemplate = values[1];
                const sectionTemplate = values[2];

                const htmlFutures = listing["categories"]
                    .map((config) => renderSection(config, leverTemplate, sectionTemplate));

                return Promise.all(htmlFutures)
                    .then((htmls) => {
                        return {"html": htmls.join("\n"), "listing": listing};
                    });
            })
            .then((workspace) => {
                const parent = document.getElementById("levers-panel-inner");
                const innerHtml = workspace["html"];
                const listing = workspace["listing"];

                parent.innerHTML = innerHtml;

                const levers = listing["categories"].flatMap((x) => x["levers"]);

                const presenters = levers.map((config) => {
                    const variable = config["variable"];
                    const element = document.getElementById(
                        "slider-holder-" + variable,
                    );
                    return new SliderPresenter(
                        buildState,
                        compileProgram,
                        config,
                        element,
                        onInputChange,
                        getSelection,
                        config["priority"],
                    );
                });

                presenters.push(new SliderPresenter(
                    buildState,
                    compileProgram,
                    {"units": "units", "variable": "prototype"},
                    document.getElementById("slider-holder-prototype"),
                    onInputChange,
                    getSelection,
                    100,
                ));

                resolve(presenters);
            });
    });
}


export {buildSliders};
