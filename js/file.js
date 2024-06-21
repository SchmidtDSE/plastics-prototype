/**
 * Utilities for saving and loading tool state (configuration options) and requeesting remote
 * resources.
 *
 * @license BSD, see LICENSE.md
 */

const SHARE_CONFIRM_MSG = [
    "A sharable URL with your policy selections has been copied to your",
    "clipboard. Paste and send that URL to share it with others.",
].join(" ");
const SAVE_QUESTION_MSG = [
    "Saving uses a small amount of local browser storage such that, when you",
    "return to this page later from the same device, you can pick up where you",
    "left off. Do you want to save?",
].join(" ");
const OVERWRITE_QUESTION_MSG = [
    SAVE_QUESTION_MSG,
    "This will overwrite your prior save.",
].join(" ");
const SAVE_CONFIRM_MSG = "Policy selections saved! Click load to open this save again later.";
const LOAD_QUESTION_MSG = [
    "Do you want to load your saved policy selections? Note that doing so may",
    "overwrite any changes you have made since your last save.",
].join(" ");
const LOAD_CONFIRM_MSG = "Saved policy selections loaded.";
const NO_SAVE_MSG = "No local saved policy selections found.";
const RESET_CONFIRM_MSG = "This will clear all of your policy selections. Do you want to continue?";
const IRRECOVERABLE_ERROR_MSG = [
    "Sorry!",
    "An error ocurred getting data from the server.",
    "Please reload and try again.",
    "Code: ",
].join(" ");

let irrecoverableErrorShown = false;


/**
 * Write the current state of the inputs / levers to a string.
 *
 * @param leversByVariable The levers in a Map indexed by variable name.
 * @returns String serialization of inputs / levers current state.
 */
function writeInputsToString(leversByVariable) {
    return Array.of(...leversByVariable.values())
        .filter((x) => !x.isAtDefault())
        .map((x) => {
            const variableName = x.getVariable();
            const variableValue = encodeURIComponent(x.getValue());
            return variableName + "=" + variableValue;
        })
        .join("&");
}


/**
 * Deserialize lever / input states from a string serialization.
 *
 * @param urlString The string from which to parse the tool state.
 * @param leversByVariable The Map structure into which the serialization should be loaded.
 */
function loadInputsFromString(urlString, leversByVariable) {
    urlString.split("&")
        .map((param) => param.split("="))
        .map((pieces) => {
            const variableName = pieces[0];
            const valueStr = decodeURIComponent(pieces[1]);
            return {
                "variable": variableName,
                "value": parseFloat(valueStr),
            };
        })
        .filter((x) => x["variable"] !== "prototype")
        .forEach((leverInfo) => {
            const lever = leversByVariable.get(leverInfo["variable"]);
            if (lever !== undefined) {
                lever.setValue(leverInfo["value"]);
            }
        });
}


/**
 * Presenter which manages state serialization.
 */
class FilePresenter {
    /**
     * Create a new pesenter to manage state persistence / serialization.
     *
     * @param leversByVariable Mapping from variable name to lever that this presenter should
     *      operate on top of.
     * @param onRequestRender Callback to invoke when this presenter needs the visualization
     *      rerendered.
     */
    constructor(leversByVariable, onRequestRender) {
        const self = this;
        self._leversByVariable = leversByVariable;
        self._onRequestRender = onRequestRender;
        self._attachListeners();
    }

    /**
     * Attach event listeners like on share links.
     */
    _attachListeners() {
        const self = this;
        document.querySelectorAll(".share-link").forEach((elem) => {
            elem.addEventListener("click", (event) => {
                self.writeToClipboard();
                event.preventDefault();
            });
        });

        document.querySelectorAll(".save-link").forEach((elem) => {
            elem.addEventListener("click", (event) => {
                self.writeToLocal();
                event.preventDefault();
            });
        });

        document.querySelectorAll(".load-link").forEach((elem) => {
            elem.addEventListener("click", (event) => {
                self.loadFromLocal();
                event.preventDefault();
            });
        });

        document.querySelectorAll(".reset-link").forEach((elem) => {
            elem.addEventListener("click", (event) => {
                self.reset();
                event.preventDefault();
            });
        });
    }

    /**
     * Write the current tool state to the clipboard as a URL serialization.
     *
     * Write the current tool state to the clipboard as a URL serialization, informing the user that
     * their clipboard has been updated. Note that this will update the browser location / URL with
     * the current serialization.
     */
    writeToClipboard() {
        const self = this;
        self.writeToUrl();
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert(SHARE_CONFIRM_MSG);
        });
    }

    /**
     * Write the current tool state to the browser URL.
     */
    writeToUrl() {
        const self = this;
        self._writeInputsToUrl(self._leversByVariable);
    }

    /**
     * Load the tool state from the current browser URL.
     */
    loadFromUrl() {
        const self = this;
        self._loadInputsFromUrl(self._leversByVariable);
        self._onRequestRender();
    }

    /**
     * Write serialization of current tool state to browser local storage.
     */
    writeToLocal() {
        const self = this;

        const priorMessage = window.localStorage.getItem("state") !== null;
        const message = priorMessage ? OVERWRITE_QUESTION_MSG : SAVE_QUESTION_MSG;
        if (!window.confirm(message)) {
            return;
        }

        self._writeInputsToLocal(self._leversByVariable);
        alert(SAVE_CONFIRM_MSG);
    }

    /**
     * Load a tool state serialization from local browser storage.
     */
    loadFromLocal() {
        const self = this;

        if (window.localStorage.getItem("state") === null) {
            alert(NO_SAVE_MSG);
            return;
        }

        if (!window.confirm(LOAD_QUESTION_MSG)) {
            return;
        }

        self._loadInputsFromLocal(self._leversByVariable);
        alert(LOAD_CONFIRM_MSG);
        self._onRequestRender();
    }

    /**
     * Reset the visualization to the default business as usual state.
     */
    reset() {
        const self = this;

        if (!window.confirm(RESET_CONFIRM_MSG)) {
            return;
        }

        Array.of(...self._leversByVariable.values())
            .forEach((lever) => lever.reset());

        self._onRequestRender();
    }

    _writeInputsToUrl(leversByVariable) {
        const self = this;

        const baseUrl = [
            location.protocol,
            "//",
            location.host,
            location.pathname,
            "?",
        ].join("");

        const url = baseUrl + writeInputsToString(leversByVariable);
        history.pushState({}, "", url);
    }

    _loadInputsFromUrl(leversByVariable) {
        const self = this;
        const fullString = window.location.search;
        const stripString = fullString.startsWith("?") ? fullString.substring(1) : fullString;
        loadInputsFromString(stripString, leversByVariable);
    }

    _writeInputsToLocal(leversByVariable) {
        const self = this;

        const stateString = writeInputsToString(leversByVariable);
        window.localStorage.setItem("state", stateString);
    }

    _loadInputsFromLocal(leversByVariable) {
        const self = this;

        const stateString = window.localStorage.getItem("state");
        if (stateString !== null) {
            loadInputsFromString(stateString, leversByVariable);
        }
    }
}


/**
 * Perform a HTTP Get with multiple retires.
 *
 * @param url The URL to request
 * @returns Promise resolving to the fetch response.
 */
function fetchWithRetry(url) {
    return new Promise((resolve, reject) => {
        let tries = 0;

        const execute = () => {
            fetch(url)
                .then((response) => {
                    if (response.ok) {
                        resolve(response);
                    } else {
                        makeTry(reponse.status);
                    }
                })
                .catch((error) => {
                    makeTry(-100);
                });
        };

        const makeTry = (statusCode) => {
            if (tries == 3 && !irrecoverableErrorShown) {
                alert(IRRECOVERABLE_ERROR_MSG + statusCode);
                irrecoverableErrorShown = true;
                return;
            } else if (tries > 0) {
                tries += 1;
                setTimeout(execute, Math.random() * (10000 - 1000) + 1000);
            } else {
                tries += 1;
                execute();
            }
        };

        makeTry(200);
    });
}


export {FilePresenter, writeInputsToString, loadInputsFromString, fetchWithRetry};
