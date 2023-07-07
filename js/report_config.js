class ConfigPresenter {

    constructor(targetDiv, onStageChange, onRegionChange, onYearChange,
        onTypeChange) {
        const self = this;

        self._targetDiv = targetDiv;

        self._onStageChange = onStageChange;
        self._onRegionChange = onRegionChange;
        self._onYearChange = onYearChange;
        self._onTypeChange = onTypeChange;

        self._d3Selection = d3.select("#" + self._targetDiv.id);

        self._setupStage();
        self._setupRegion();
        self._setupYear();
        self._setupType();
    }

    _setupStage() {
        const self = this;

        self._d3Selection
            .select(".stage-select")
            .selectAll(".stage")
            .data([DISPLAY_STAGES.consumption, DISPLAY_STAGES.eol])
            .enter()
            .append("option")
            .attr("value", (x) => x)
            .html((x) => STRINGS.get(x))
            .classed("stage", true);
    }
    
    _setupRegion() {
        const self = this;

        self._d3Selection
            .select(".region-select")
            .selectAll(".region")
            .data(ALL_REGIONS)
            .enter()
            .append("option")
            .attr("value", (x) => x)
            .html((x) => STRINGS.get(x))
            .classed("region", true);
    }
    
    _setupYear() {
        const self = this;

        const years = [];
        for (let year = START_YEAR; year <= MAX_YEAR; year++) {
            years.push(year);
        }

        self._d3Selection
            .select(".year-select")
            .selectAll(".year")
            .data(years)
            .enter()
            .append("option")
            .attr("value", (x) => x)
            .html((x) => x)
            .classed("year", true);
    }
    
    _setupType() {
        const self = this;

        self._d3Selection
            .select(".type-select")
            .selectAll(".type")
            .data([DISPLAY_TYPES.amount, DISPLAY_TYPES.percent])
            .enter()
            .append("option")
            .attr("value", (x) => x)
            .html((x) => STRINGS.get(x))
            .classed("type", true);
    }

}
