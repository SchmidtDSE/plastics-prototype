import {CACHE_BUSTER} from "const";
import {fetchWithRetry} from "file";

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
    constructor(buildState, compileProgram, rootElement) {
        const self = this;

        self._rootElement = rootElement;
        self._buildState = buildState;
        self._compileProgram = compileProgram;

        const editorContainer = self._rootElement.querySelector(".editor");
        const editorId = editorContainer.id;
        self._editor = self._initEditor(editorId);

        self._attachListeners();
        self._onInputChangeInProgress();
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

    _attachListeners() {
        const self = this;
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



function buildSimPresenter(buildState, compileProgram) {
    return new Promise((resolve) => {
        const rootElement = document.getElementById("simulation");
        const presenter = new SimPresenter(buildState, compileProgram, rootElement);
        resolve(presenter);
    });
}


export {buildSimPresenter};
