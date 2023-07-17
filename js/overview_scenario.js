class ScenarioPresenter {

    constructor(targetDiv, scenarios, onPolicyChange) {
        const self = this;

        self._targetDiv = targetDiv;
        self._d3Selection = self._getD3().select("#" + self._targetDiv.id);
        self._onPolicyChangeCallback = onPolicyChange;

        self._createScenarios(scenarios);
    }

    _createScenarios(scenarios) {
        const self = this;

        const newDivs = self._d3Selection.select(".menu")
            .selectAll(".menu-option")
            .data(scenarios)
            .enter()
            .append("div")
            .classed("menu-option", true);

        const newLabels = newDivs.append("label");

        newLabels.append("input")
            .attr("type", "checkbox")
            .on("change", function (event, scenario) {
                self._onPolicyChangeCallback(scenario, this.checked)
            });

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
