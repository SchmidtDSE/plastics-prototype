class ScenarioPresenter {
    constructor(targetDiv, scenarios, onPolicyChange) {
        const self = this;

        self._targetDiv = targetDiv;
        self._d3Selection = self._getD3().select("#" + self._targetDiv.id);
        self._onPolicyChangeCallback = onPolicyChange;
        self._scenarios = scenarios;

        self._customScenario = {"name": "Custom", "values": []};

        self._createScenarios(self._scenarios);

    }

    updateSelection(baseline) {
        const self = this;
        const inputValues = baseline.get("in");

        self._d3Selection.select(".menu")
            .selectAll(".menu-option")
            .select(".menu-check")
            .property("checked", (scenario) => {
                const variables = scenario["values"];
                const nonMatched = variables.filter((variable) => {
                    const leverName = variable["lever"];
                    const expectedValue = variable["value"];
                    const actualValue = inputValues.get(leverName);
                    return expectedValue != actualValue;
                });
                const numNonMatched = nonMatched.length;
                return numNonMatched == 0;
            });
    }

    _createScenarios(scenarios) {
        const self = this;

        const newDivs = self._d3Selection.select(".menu")
            .selectAll(".menu-option")
            .data(scenarios.concat([self._customScenario]))
            .enter()
            .append("div")
            .classed("menu-option", true);

        const newLabels = newDivs.append("label");

        newLabels.append("input")
            .attr("type", "checkbox")
            .classed("menu-check", true)
            .on("change", function(event, scenario) {
                // eslint-disable-next-line no-invalid-this
                self._onPolicyChangeCallback(scenario, this.checked);
            })
            .classed("custom-menu-check", (x) => x["name"] === "Custom")
            .property("disabled", (x) => x["name"] === "Custom");

        newLabels.append("span")
            .html((scenario) => scenario["name"]);
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {ScenarioPresenter};
