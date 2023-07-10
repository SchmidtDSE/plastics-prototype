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

        const consumptionStageDiv = document.getElementById("consumption-container");
        self._consumptionStagePresenter = new StagePresenter(
            consumptionStageDiv,
            DISPLAY_STAGES.consumption,
            (stage) => self._onStageChange(stage),
            () => self._onRequestRender()
        );

        const eolStageDiv = document.getElementById("eol-container");
        self._eolStagePresenter = new StagePresenter(
            eolStageDiv,
            DISPLAY_STAGES.eol,
            (stage) => self._onStageChange(stage),
            () => self._onRequestRender()
        );

        const timeseriesDiv = document.getElementById("timeseries-container");
        self._timeseriesPresenter = new TimeseriesPresenter(
            timeseriesDiv,
            (year) => self._onYearChange(year),
            () => self._onRequestRender()
        );
    }

    render(states) {
        const self = this;

        const usingPercent = self._selection.getDisplayType() == DISPLAY_TYPES.percent;

        const targetStates = usingPercent ? self._getPercents(states) : states;
        const targetState = targetStates.get(self._selection.getYear());

        self._bubblegraphPresenter.update(targetState, self._selection);
        self._configPresenter.update(targetState, self._selection);
        self._consumptionStagePresenter.update(targetState, self._selection);
        self._eolStagePresenter.update(targetState, self._selection);
        self._timeseriesPresenter.update(targetStates, self._selection);
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

    _getPercents(states) {
        const self = this;
        const newStates = new Map();

        states.forEach((state, year) => {
            newStates.set(year, self._getPercent(state));
        });

        return newStates;
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