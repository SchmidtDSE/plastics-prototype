import {ALL_REGIONS, DISPLAY_STAGES, DISPLAY_TYPES, HISTORY_START_YEAR, MAX_YEAR} from "const";
import {STRINGS} from "strings";


class ConfigPresenter {
    constructor(targetDiv, onStageChange, onRegionChange, onYearChange,
        onTypeChange, onShowBauChange) {
        const self = this;

        self._targetDiv = targetDiv;

        self._onStageChange = onStageChange;
        self._onRegionChange = onRegionChange;
        self._onYearChange = onYearChange;
        self._onTypeChange = onTypeChange;
        self._onShowBauChange = onShowBauChange;

        self._stageSelect = self._targetDiv.querySelector(".stage-select");
        self._regionSelect = self._targetDiv.querySelector(".region-select");
        self._yearSelect = self._targetDiv.querySelector(".year-select");
        self._typeSelect = self._targetDiv.querySelector(".type-select");
        self._showBauDeltaCheck = self._targetDiv.querySelector(".show-delta");

        self._d3Selection = self._getD3().select("#" + self._targetDiv.id);

        self._setupStage();
        self._setupRegion();
        self._setupYear();
        self._setupType();
        self._setupBauCheck();
    }

    update(stateSet, selection) {
        const self = this;

        self._stageSelect.value = selection.getDisplayStage();
        self._regionSelect.value = selection.getRegion();
        self._yearSelect.value = selection.getYear();
        self._typeSelect.value = selection.getDisplayType();
        self._showBauDeltaCheck.checked = selection.getShowBauDelta() ? 1 : 0;
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

        self._stageSelect.addEventListener("change", () => {
            self._onStageChange(parseInt(self._stageSelect.value));
        });
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

        self._regionSelect.addEventListener("change", () => {
            self._onRegionChange(self._regionSelect.value);
        });
    }

    _setupYear() {
        const self = this;

        const years = [];
        for (let year = HISTORY_START_YEAR; year <= MAX_YEAR; year++) {
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

        self._yearSelect.addEventListener("change", () => {
            self._onYearChange(parseInt(self._yearSelect.value));
        });
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

        self._typeSelect.addEventListener("change", () => {
            self._onTypeChange(parseInt(self._typeSelect.value));
        });
    }

    _setupBauCheck() {
        const self = this;

        self._showBauDeltaCheck.addEventListener("change", () => {
            self._onShowBauChange(self._showBauDeltaCheck.checked == 1);
        });
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {ConfigPresenter};
