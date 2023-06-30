let levers = null;


class SliderPresenter {
    constructor(config, rootElement, onChange) {
        const self = this;

        self._config = config;
        self._rootElement = rootElement;
        self._onChange = onChange;

        const editorContainer = self._rootElement.querySelector(".editor");
        const editorId = editorContainer.id;
        self._editor = self._initEditor(editorId);

        self._attachListeners();
        self._onInputChangeInProgress();
    }

    getProgram() {
        const self = this;

        const input = self._editor.getValue();
        const compileResult = compileProgram(input);

        const hasErrors = compileResult.getErrors().length > 0;
        const hasProgram = compileResult.getProgram() !== null;

        if (hasErrors) {
            const errorsStr = compileResult.getErrors().join("\n\n");
            self._showStatusText(errorsStr);
            return null;
        } else if (hasProgram) {
            return compileResult.getProgram();
        } else {
            self._showStatusText("Ready!");
            return null;
        }
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
                250
            );
        });
        
        innerSlider.addEventListener("input", () => {
            self._onInputChangeInProgress();
        });
    }

    _showStatusText(text) {
        const self = this;

        const display = self._rootElement.querySelector('.status-display');
        display.textContent = text;
    }

    _updateValueLabel() {
        const self = this;

        const innerSlider = self._rootElement.querySelector('.slider');
        const value = parseFloat(innerSlider.value);
        const units = " " + self._config["units"];
        const valueStr = value >= 0 ? ("+" + value + units) : (value + units);
        self._rootElement.querySelector(".delta-display").innerHTML = valueStr;
    }

    _onInputChangeInProgress() {
        const self = this;
        self._updateValueLabel();
    }

    _onInputChange(data) {
        const self = this;
        self._onInputChangeInProgress();
    }

    /**
     * Enable and disable Ace editor commands.
     *
     * To better support accessibility, turn editor commands on and off like for
     * tab support. Thanks stackoverflow.com/questions/24963246/ace-editor-simply-re-enable-command-after-disabled-it.
     *
     * @param editor The Ace editor to modify.
     * @param name The name of the command to modify.
     * @param enabled Flag indicating if the command should be enabled.
     */
    _setCommandEnabled(editor, name, enabled) {
        const self = this;

        var command = editor.commands.byName[name]
        if (!command.bindKeyOriginal)
            command.bindKeyOriginal = command.bindKey
        command.bindKey = enabled ? command.bindKeyOriginal : null;
        editor.commands.addCommand(command);
        // special case for backspace and delete which will be called from
        // textarea if not handled by main commandb binding
        if (!enabled) {
            var key = command.bindKeyOriginal;
            if (key && typeof key == "object")
                key = key[editor.commands.platform];
            if (/backspace|delete/i.test(key))
                editor.commands.bindKey(key, "null")
        }
    }


    /**
     * Initalize the editor.
     */
    _initEditor(editorId) {
        const self = this;

        const editor = ace.edit(editorId);
        editor.getSession().setUseWorker(false);

        editor.session.setOptions({
            tabSize: 2,
            useSoftTabs: true
        });

        editor.setOption("printMarginColumn", 100);

        editor.setTheme("ace/theme/textmate");

        // Support keyboard escape for better accessibility
        const setTabsEnabled = (target) => {
            self._setCommandEnabled(editor, "indent", target);
            self._setCommandEnabled(editor, "outdent", target);
        };

        editor.on("focus", () => { setTabsEnabled(true); });

        editor.commands.addCommand({
            name: "escape",
            bindKey: {win: "Esc", mac: "Esc"},
            exec: () => {
              setTabsEnabled(false);
            }
        });

        return editor;
    }
}


function getData() {
    return new Promise((resolve) => {
        Papa.parse("/data/web.csv", {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true
        });
    });
}


function applyTransformation(projectionRaw) {
    const naftaData = projectionRaw.filter((x) => x["region"] === "nafta");
    const targetData = naftaData.filter((x) => x["year"] == 2050);
    const targetDatum = targetData[0];

    const naftaProjection = new Map();
    naftaProjection.set("eolIncinerationPercent", targetDatum["eolIncinerationPercent"]);
    naftaProjection.set("eolLandfillPercent", targetDatum["eolLandfillPercent"]);
    naftaProjection.set("inputProduceResinMTt", targetDatum["inputProduceResinMTt"]);
    naftaProjection.set("eolMismanagedPercent", targetDatum["eolMismanagedPercent"]);
    naftaProjection.set("inputImportFiberMT", targetDatum["inputImportFiberMT"]);
    naftaProjection.set("inputProduceResinMT", targetDatum["inputProduceResinMT"]);
    naftaProjection.set("inputImportResinMT", targetDatum["inputImportResinMT"]);
    naftaProjection.set("inputAdditivesMT", targetDatum["inputAdditivesMT"]);
    naftaProjection.set("inputImportGoodsMT", targetDatum["inputImportGoodsMT"]);
    naftaProjection.set("inputImportArticlesMT", targetDatum["inputImportArticlesMT"]);
    naftaProjection.set("eolRecyclingPercent", targetDatum["eolRecyclingPercent"]);
    naftaProjection.set("inputProduceFiberMT", targetDatum["inputProduceFiberMT"]);

    const projection = new Map();
    projection.set("nafta", naftaProjection);

    const exampleVariable = document.getElementById("example-variable").value;
    const exampleValue = parseFloat(
        document.getElementById("example-input").value
    );

    const state = new Map();
    state.set("local", new Map());
    state.set("out", projection);

    const inputs = new Map();
    inputs.set(exampleVariable, exampleValue);
    state.set("in", inputs);

    const program = compileLiveProgram();
    if (program !== null) {
        program(state);
    }

    return state.get("out");
}


function onInputChange() {

}


function buildSliders() {
    const listingFuture = fetch("/pt/index.json").then(x => x.json());
    const templateFuture = fetch("/template/slider.html")
        .then(x => x.text())
        .then(x => Handlebars.compile(x));


    const renderLever = (config, htmlTemplate) => {
        const templateUrl = "/pt/" + config["template"];
        return fetch(templateUrl).then(x => x.text())
            .then(x => Handlebars.compile(x))
            .then((codeTemplate) => codeTemplate(config["attrs"]))
            .then((code) => {
                config["code"] = code;
                return htmlTemplate(config)
            });
    };

    return new Promise((resolve) => {
        Promise.all([listingFuture, templateFuture])
            .then((values) => {
                const listing = values[0];
                const template = values[1];

                const leverHtmlFutures = listing["levers"]
                    .map((config) => renderLever(config, template));

                return Promise.all(leverHtmlFutures)
                    .then((leverHtmls) => {
                        return {"leverHtmls": leverHtmls, "listing": listing};
                    });
            })
            .then((workspace) => {
                const parent = document.getElementById("levers-panel");
                const leverHtmls = workspace["leverHtmls"];
                const listing = workspace["listing"];

                parent.innerHTML = leverHtmls.join("\n");

                const presenters = listing["levers"].map((config) => {
                    const variable = config["variable"];
                    const element = document.getElementById(
                        "slider-holder-" + variable
                    );
                    return new SliderPresenter(config, element, onInputChange);
                });

                resolve(presenters);
            });
    });
}


function main() {
    buildSliders().then((newPresenters) => {
        presenters = newPresenters;
    });
}


main();
