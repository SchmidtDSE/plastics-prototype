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

        const bubblegraphSvg = document.getElementById("bubblegraph-container");
        self._bubblegraphPresenter = new BubblegraphPresenter(
            bubblegraphSvg,
            (region) => self._onRegionChange(region)
        );
    }

    render(state) {
        const self = this;
        self._bubblegraphPresenter.update(state, self._selection);
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

}


function buildReportPresenter(onRequestRender) {
    return new Promise((resolve) => resolve(
        new ReportPresenter(onRequestRender)
    ));
}
