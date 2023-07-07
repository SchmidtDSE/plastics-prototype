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

    constructor() {
        const self = this;

        self._selection = new ReportSelection(
            DEFAULT_YEAR,
            DEFAULT_REGION,
            DISPLAY_TYPES.amount,
            DISPLAY_STAGES.eol
        );

        const slopegraphSvg = document.getElementById("slopegraph-container");
        self._slopegraphPresenter = new SlopegraphPresenter(slopegraphSvg);
    }

    render(state) {
        const self = this;

        self._slopegraphPresenter.update(state, self._selection);
    }

}


function buildReportPresenter() {
    return new Promise((resolve) => resolve(new ReportPresenter()));
}
