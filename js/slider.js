import {CACHE_BUSTER} from "const";
import {addGlobalToState} from "geotools";
import {getGoals} from "goals";
import {STRINGS} from "strings";


class SliderPresenter {
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

    getVariable() {
        const self = this;
        return self._config["variable"];
    }

    getValue() {
        const self = this;
        const slider = self._rootElement.querySelector(".slider");
        return parseFloat(slider.value + "");
    }

    setValue(value) {
        const self = this;
        const slider = self._rootElement.querySelector(".slider");
        slider.value = value;
        self._onInputChangeInProgress();
    }

    resetToDefault() {
        const self = this;
        if (self._config["unselectDefault"] === undefined) {
            self.setValue(self._config["default"]);
        } else {
            self.setValue(self._config["unselectDefault"]);
        }
    }

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

    showInspects(inspects) {
        const self = this;

        const hasInspects = inspects.length > 0;
        const inspectsArea = self._rootElement.querySelector(".inspects-area");

        if (!hasInspects) {
            inspectsArea.innerHTML = "";
            return;
        }

        const leverTemplateFuture = fetch("/template/variables.html?v=" + CACHE_BUSTER)
            .then((x) => x.text())
            .then((x) => getHandlebars().compile(x))
            .then((template) => {
                const inspectsHtml = template({"variables": inspects});
                inspectsArea.innerHTML = inspectsHtml;
            });
    }

    refreshSelection() {
        const self = this;
        self._refreshTable();
    }

    reset() {
        const self = this;
        self.setValue(self._config["default"]);
    }

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
                return prefix + value + " MT";
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
     * Enable and disable Ace editor commands.
     *
     * To better support accessibility, turn editor commands on and off like for
     * tab support. Thanks stackoverflow.com/questions/24963246.
     *
     * @param editor The Ace editor to modify.
     * @param name The name of the command to modify.
     * @param enabled Flag indicating if the command should be enabled.
     */
    _setCommandEnabled(editor, name, enabled) {
        const self = this;

        const command = editor.commands.byName[name];
        if (!command.bindKeyOriginal) {
            command.bindKeyOriginal = command.bindKey;
        }
        command.bindKey = enabled ? command.bindKeyOriginal : null;
        editor.commands.addCommand(command);
        // special case for backspace and delete which will be called from
        // textarea if not handled by main commandb binding
        if (!enabled) {
            let key = command.bindKeyOriginal;
            if (key && typeof key == "object") {
                key = key[editor.commands.platform];
            }
            if (/backspace|delete/i.test(key)) {
                editor.commands.bindKey(key, "null");
            }
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

        editor.setTheme("ace/theme/textmate");

        // Support keyboard escape for better accessibility
        const setTabsEnabled = (target) => {
            self._setCommandEnabled(editor, "indent", target);
            self._setCommandEnabled(editor, "outdent", target);
        };

        editor.on("focus", () => {
            setTabsEnabled(true);
        });

        editor.commands.addCommand({
            name: "escape",
            bindKey: {win: "Esc", mac: "Esc"},
            exec: () => {
                setTabsEnabled(false);
            },
        });

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
            const parsedFuture = fetch(url).then((result) => {
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
