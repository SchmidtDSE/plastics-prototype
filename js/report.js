class ReportSelection {

    constructor(year, region, displayType, displayStage) {
        const self = this;

        self._year = year;
        self._region = region;
        self._displayType = displayType;
        self._displayStage = displayStage;
    }
    
    getYear() {
        const self = this;
        return self._year;
    }
    
    getRegion() {
        const self = this;
        return self._region;
    }
    
    getDisplayType() {
        const self = this;
        return self._displayType;
    }
    
    getDisplayStage() {
        const self = this;
        return self._displayStage;
    }

}


class ReportPresenter {

    constructor(onRequestRender) {
        const self = this;

        self._onRequestRender = onRequestRender;

        self._selection = new ReportSelection(
            DEFAULT_YEAR,
            DEFAULT_REGION,
            DISPLAY_TYPES.amount,
            DISPLAY_STAGES.eol
        );

        const bubblegraphDiv = document.getElementById("bubblegraph-container");
        self._bubblegraphPresenter = new BubblegraphPresenter(
            bubblegraphDiv,
            (region) => self._onRegionChange(region),
            () => self._onRequestRender()
        );

        const configDiv = document.getElementById("config-container");
        self._configPresenter = new ConfigPresenter(
            configDiv,
            (stage) => self._onStageChange(stage),
            (region) => self._onRegionChange(region),
            (year) => self._onYearChange(year),
            (type) => self._onTypeChange(type)
        );
    }

    render(states) {
        const self = this;

        const state = states.get(self._selection.getYear());

        const usingPercent = self._selection.getDisplayType() == DISPLAY_TYPES.percent;
        const targetState = usingPercent ? self._getPercent(state) : state;

        self._bubblegraphPresenter.update(targetState, self._selection);
        self._configPresenter.update(targetState, self._selection);
    }

    _onStageChange(stage) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            stage
        );

        self._onRequestRender();
    }

    _onRegionChange(region) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            region,
            self._selection.getDisplayType(),
            self._selection.getDisplayStage()
        );

        self._onRequestRender();
    }

    _onYearChange(year) {
        const self = this;

        self._selection = new ReportSelection(
            year,
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            self._selection.getDisplayStage()
        );

        self._onRequestRender();
    }

    _onTypeChange(type) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            self._selection.getRegion(),
            type,
            self._selection.getDisplayStage()
        );

        self._onRequestRender();
    }

    _getPercent(state) {
        const makePercents = (input, output, attrs) => {
            const total = attrs.map((attr) => input.get(attr))
                .reduce((a, b) => a + b);

            attrs.forEach((attr) => {
                output.set(attr, input.get(attr) / total * 100);
            });
        };

        const newOut = new Map();
        state.get("out").forEach((regionOriginal, region) => {
            const newRegionOut = new Map();
            makePercents(regionOriginal, newRegionOut, CONSUMPTION_ATTRS);
            makePercents(regionOriginal, newRegionOut, EOL_ATTRS);
            newOut.set(region, newRegionOut);
        });

        const newState = new Map();
        newState.set("out", newOut);
        return newState;
    }

}


function buildReportPresenter(onRequestRender) {
    return new Promise((resolve) => resolve(
        new ReportPresenter(onRequestRender)
    ));
}
