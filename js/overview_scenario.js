import {loadInputsFromString} from "file";

const NO_CUSTOM_MSG = "Please make policy changes first and then try adding a new policy option";
const URL_MSG = "Please enter the share URL of the policy to add as a new option.";
const CANCEL_MSG = "Cancelled adding policy option.";


class VirtualLever {
    constructor(variable, value) {
        const self = this;
        self._variable = variable;
        self._value = value;
    }

    getVariable() {
        const self = this;
        return self._variable;
    }

    getValue() {
        const self = this;
        return self._value;
    }

    setValue(newValue) {
        const self = this;
        self._value = newValue;
    }
}


class ScenarioPresenter {
    constructor(targetDiv, scenarios, onPolicyChange) {
        const self = this;

        self._targetDiv = targetDiv;
        self._d3Selection = self._getD3().select("#" + self._targetDiv.id);
        self._onPolicyChangeCallback = onPolicyChange;
        self._scenarios = scenarios;
        self._lastInputValues = null;

        self._customScenario = {
            "name": "Custom",
            "values": [],
            "description": "Policy choices you have made in the details tab.",
        };

        self._createScenarios(self._scenarios);
        self._setupAddDialog();
    }

    updateSelection(baseline) {
        const self = this;
        const inputValues = baseline.get("in");

        self._lastBaseline = baseline;

        self._d3Selection.select(".menu")
            .selectAll(".menu-option")
            .select(".menu-check")
            .property("checked", (scenario) => {
                const variables = scenario["values"];
                if (scenario["config"] === undefined) {
                    const nonMatched = variables.filter((variable) => {
                        const leverName = variable["lever"];
                        const expectedValue = variable["value"];
                        const actualValue = inputValues.get(leverName);
                        return Math.abs(expectedValue - actualValue) > 0.00001;
                    });
                    const numNonMatched = nonMatched.length;
                    return numNonMatched == 0;
                } else {
                    const config = scenario["config"];
                    const matchingOptions = config["options"].filter((option) => {
                        const nonMatched = variables.filter((variable) => {
                            const mulitplier = option / config["default"];
                            const leverName = variable["lever"];
                            const expectedValue = variable["baseValue"] * mulitplier;
                            const actualValue = inputValues.get(leverName);
                            return Math.abs(expectedValue - actualValue) > 0.00001;
                        });
                        const numNonMatched = nonMatched.length;
                        return numNonMatched == 0;
                    });
                    if (matchingOptions.length == 0) {
                        return false;
                    } else {
                        document.getElementById(
                            "inner-select-" + scenario["id"],
                        ).value = matchingOptions[0];
                        return true;
                    }
                }
            });
    }

    _createScenarios(scenarios) {
        const self = this;

        self._d3Selection.select(".menu").html("");

        const newRows = self._d3Selection.select(".menu")
            .append("table")
            .selectAll(".menu-option")
            .data(scenarios.concat([self._customScenario]))
            .enter()
            .append("tr")
            .classed("menu-option", true);

        newRows.append("td").append("input")
            .attr("type", "checkbox")
            .classed("menu-check", true)
            .on("change", function(event, scenario) {
                // eslint-disable-next-line no-invalid-this
                self._onPolicyChangeCallback(scenario, this.checked);
            })
            .classed("custom-menu-check", (x) => x["name"] === "Custom")
            .property("disabled", (x) => x["name"] === "Custom")
            .attr("id", (scenario) => scenario["id"] + "-menu-check")
            .attr("aria-describedby", (scenario) => scenario["id"] + "-menu-check-label");

        const newLabels = newRows.append("td").append("label");

        newLabels.append("span")
            .html((scenario, i) => {
                if (scenario["config"] === undefined) {
                    return scenario["name"].replaceAll("<option>", "") + " ";
                } else {
                    const defaultVal = scenario["config"]["default"];
                    const options = scenario["config"]["options"].map((x) => {
                        const selectedStr = defaultVal === x ? "selected" : "";
                        const start = "<option value=\"" + x + "\"" + selectedStr + ">";
                        const end = x + "</option>";
                        return start + end;
                    });
                    const selectStart = [
                        "<select ",
                        "class=\"check-dropdown\" id=\"inner-select-",
                        scenario["id"],
                        "\">",
                    ].join("");
                    const select = selectStart + "\n" + options.join("\n") + "\n</select>";
                    return scenario["name"].replaceAll("<option>", select) + " ";
                }
            })
            .attr("id", (scenario) => scenario["id"] + "-menu-check-label")
            .attr("aria-describedby", (scenario) => scenario["id"] + "-menu-check-info");

        newLabels.append("span")
            .html("<img alt='info' src='/img/info.png' class='info-img'>")
            .classed("info-target", true)
            .attr("id", (scenario) => scenario["id"] + "-menu-check-info")
            .attr("tabindex", "0")
            .attr("data-tippy-content", (scenario) => scenario["description"]);

        d3.selectAll(".check-dropdown").on("change", function() {
            // eslint-disable-next-line no-invalid-this
            const elem = this;

            const scenarioId = elem.id.replace("inner-select-", "");
            const scenario = scenarios.filter((x) => x["id"] === scenarioId)[0];
            const config = scenario["config"];
            const mulitplier = elem.value / config["default"];

            const newValues = scenario["values"].map((x) => {
                return {
                    "lever": x["lever"],
                    "value": x["baseValue"] * mulitplier,
                    "baseValue": x["baseValue"],
                };
            });

            scenario["values"] = newValues;

            const checkbox = document.getElementById(scenarioId + "-menu-check");
            const isChecked = checkbox.checked;
            self._onPolicyChangeCallback(scenario, isChecked);
        });

        // eslint-disable-next-line no-undef
        tippy("[data-tippy-content]");
    }

    _setupAddDialog() {
        const self = this;
        document.getElementById("add-policy-link").addEventListener("click", () => {
            document.getElementById("add-dialog").showModal();
        });

        document.getElementById("continue-add-button").addEventListener("click", (event) => {
            event.preventDefault();

            const name = document.getElementById("policy-name-input").value;

            if (self._lastBaseline === null) {
                alert(NO_CUSTOM_MSG);
                return;
            }

            const entries = Array.of(...self._lastBaseline.get("in").entries());
            const shouldAddCurrent = document.getElementById("add-current-radio").checked;

            const addCurrent = () => {
                const leverValues = entries.map((entry) => {
                    return {"lever": entry[0], "value": entry[1]};
                });

                return {
                    "name": name,
                    "values": leverValues,
                };
            };

            const addFromUrl = () => {
                const url = prompt(URL_MSG);
                if (url === null) {
                    alert(CANCEL_MSG);
                    return null;
                }

                const urlPieces = url.split("?");
                const searchString = urlPieces[urlPieces.length-1];

                const virtualLevers = new Map();
                entries.forEach((entry) => {
                    const newLever = new VirtualLever(entry[0], entry[1]);
                    virtualLevers.set(newLever.getVariable(), newLever);
                });

                loadInputsFromString(searchString, virtualLevers);

                const virtualLeversValues = Array.of(...virtualLevers.values());
                const leverValues = virtualLeversValues.map((lever) => {
                    return {"lever": lever.getVariable(), "value": lever.getValue()};
                });

                return {
                    "name": name,
                    "values": leverValues,
                };
            };

            const newScenario = shouldAddCurrent ? addCurrent() : addFromUrl();

            if (newScenario === null) {
                return;
            }

            self._scenarios.push(newScenario);
            self._createScenarios(self._scenarios);
            self.updateSelection(self._lastBaseline);

            document.getElementById("add-dialog").close(true);
        });
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {ScenarioPresenter};
