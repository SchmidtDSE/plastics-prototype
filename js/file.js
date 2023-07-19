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
    "This will overwrite your prior save."
].join(" ");
const SAVE_CONFIRM_MSG = "Policy selections saved! Click load to open this save again later.";
const LOAD_QUESTION_MSG = [
    "Do you want to load your saved policy selections? Note that doing so may",
    "overwrite any changes you have made since your last save.",
].join(" ");
const LOAD_CONFIRM_MSG = "Saved policy selections loaded.";
const NO_SAVE_MSG = "No local saved policy selections found.";
const RESET_CONFIRM_MSG = "This will clear all of your policy selections. Do you want to continue?";


class FilePresenter {

    constructor(leversByVariable, onRequestRender) {
        const self = this;
        self._leversByVariable = leversByVariable;
        self._onRequestRender = onRequestRender;
        self._attachListeners();
    }

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
        })
    }

    writeToClipboard() {
        const self = this;
        self.writeToUrl();
        navigator.clipboard.writeText(window.location.href).then(() => {
            alert(SHARE_CONFIRM_MSG);
        });
    }

    writeToUrl() {
        const self = this;
        self._writeInputsToUrl(self._leversByVariable);
    }

    loadFromUrl() {
        const self = this;
        self._loadInputsFromUrl(self._leversByVariable);
        self._onRequestRender();
    }

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

    reset() {
        const self = this;

        if (!window.confirm(RESET_CONFIRM_MSG)) {
            return;
        }

        Array.of(...self._leversByVariable.values())
            .forEach((lever) => lever.reset());
        
        self._onRequestRender();
    }

    _writeInputsToString(leversByVariable) {
        const self = this;

        return Array.of(...leversByVariable.values())
            .map((x) => {
                const variableName = x.getVariable();
                const variableValue = encodeURIComponent(x.getValue());
                return variableName + "=" + variableValue
            })
            .join("&");
    }

    _loadInputsFromString(urlString, leversByVariable) {
        const self = this;

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
            .forEach((leverInfo) => {
                const lever = leversByVariable.get(leverInfo["variable"])
                lever.setValue(leverInfo["value"]);
            });
    }

    _writeInputsToUrl(leversByVariable) {
        const self = this;

        const baseUrl = [
            location.protocol,
            "//",
            location.host,
            location.pathname,
            "?"
        ].join("");

        const url = baseUrl + self._writeInputsToString(leversByVariable);
        history.pushState({}, "", url);
    }

    _loadInputsFromUrl(leversByVariable) {
        const self = this;
        const fullString = window.location.search;
        const stripString = fullString.startsWith("?") ? fullString.substring(1) : fullString;
        console.log(leversByVariable);
        self._loadInputsFromString(stripString, leversByVariable);
    }

    _writeInputsToLocal(leversByVariable) {
        const self = this;

        const stateString = self._writeInputsToString(leversByVariable);
        window.localStorage.setItem("state", stateString);
    }

    _loadInputsFromLocal(leversByVariable) {
        const self = this;

        const stateString = window.localStorage.getItem("state");
        if (stateString !== null) {
            self._loadInputsFromString(stateString, leversByVariable);
        }
    }
}


export {FilePresenter};
