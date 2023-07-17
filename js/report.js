import {
    DEFAULT_YEAR,
    DEFAULT_REGION,
    DISPLAY_TYPES,
    DISPLAY_STAGES,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
} from "const";
import {getRelative} from "geotools";
import {getGoals} from "goals";
import {BubblegraphPresenter} from "report_bubble";
import {ConfigPresenter} from "report_config";
import {GoalPresenter} from "report_goals";
import {SparklinesSet} from "report_sparklines";
import {StagePresenter} from "report_stage";
import {TimeseriesPresenter} from "report_timeseries";


class ReportSelection {
    constructor(year, region, displayType, displayStage, showBauDelta) {
        const self = this;

        self._year = year;
        self._region = region;
        self._displayType = displayType;
        self._displayStage = displayStage;
        self._showBauDelta = showBauDelta;
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

    getShowBauDelta() {
        const self = this;
        return self._showBauDelta;
    }
}


class VizStateSet {
    constructor(businessAsUsualRaw, businessAsUsualTransformed,
        withInterventionsRaw, withInterventionsTransformed, selectedYear) {
        const self = this;
        self._businessAsUsualRaw = businessAsUsualRaw;
        self._businessAsUsualTransformed = businessAsUsualTransformed;
        self._withInterventionsRaw = withInterventionsRaw;
        self._withInterventionsTransformed = withInterventionsTransformed;
        self._selectedYear = selectedYear;
    }

    getAllBusinessAsUsuals(useRaw) {
        const self = this;
        useRaw = useRaw === undefined ? false : useRaw;
        return useRaw ? self._businessAsUsualRaw : self._businessAsUsualTransformed;
    }

    getBusinessAsUsual(useRaw, year) {
        const self = this;
        year = year === undefined ? self._selectedYear : year;
        const target = self.getBusinessAsUsuals(useRaw);
        return target.get(year);
    }

    getAllWithInterventions(useRaw) {
        const self = this;
        useRaw = useRaw === undefined ? false : useRaw;
        return useRaw ? self._withInterventionsRaw : self._withInterventionsTransformed;
    }

    getWithIntervention(useRaw, year) {
        const self = this;
        year = year === undefined ? self._selectedYear : year;
        const target = self.getAllWithInterventions(useRaw);
        return target.get(year);
    }
}


class ReportPresenter {

    constructor(onRequestRender, onYearChange) {
        const self = this;

        self._onRequestRender = onRequestRender;
        self._onYearChangeCallback = onYearChange;

        self._selection = new ReportSelection(
            DEFAULT_YEAR,
            DEFAULT_REGION,
            DISPLAY_TYPES.amount,
            DISPLAY_STAGES.eol,
            false,
        );

        self.rebuildViz();
        self._setupResizeListener();
    }

    setYear(year) {
        const self = this;

        self._selection = new ReportSelection(
            year,
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            self._selection.getDisplayStage(),
            self._selection.getShowBauDelta(),
        );

        self._onRequestRender();
    }

    render(businessAsUsual, withInterventions) {
        const self = this;

        const displayType = self._selection.getDisplayType();
        const showingBauDelta = self._selection.getShowBauDelta();
        const usingPercent = displayType == DISPLAY_TYPES.percent;

        const getTransformedMaybe = (target) => {
            if (usingPercent) {
                return self._getPercents(target);
            } else {
                return target;
            }
        };

        const getRelativeMaybe = (target, reference) => {
            if (showingBauDelta) {
                return getRelative(target, reference);
            } else {
                return target;
            }
        };

        const getWithGoals = (target) => {
            Array.of(...target.keys()).forEach((year) => {
                const yearState = target.get(year);
                const goals = self._getGoals(yearState, self._selection);
                yearState.set("goal", goals);
            });

            return target;
        };

        const bauTransformed = getTransformedMaybe(businessAsUsual);
        const interventionsTransformed = getTransformedMaybe(withInterventions);

        const bauRelative = getRelativeMaybe(
            bauTransformed,
            bauTransformed,
        );
        const interventionsRelative = getRelativeMaybe(
            interventionsTransformed,
            bauTransformed,
        );

        const bauGoals = getWithGoals(bauRelative);
        const interventionsGoals = getWithGoals(interventionsRelative);

        const resultSet = new VizStateSet(
            businessAsUsual,
            bauGoals,
            withInterventions,
            interventionsGoals,
            self._selection.getYear(),
        );

        self._nonRecycledWastePresenter.update(resultSet, self._selection);
        self._mismanagedWastePresenter.update(resultSet, self._selection);
        self._bubblegraphPresenter.update(resultSet, self._selection);
        self._configPresenter.update(resultSet, self._selection);
        self._consumptionStagePresenter.update(resultSet, self._selection);
        self._eolStagePresenter.update(resultSet, self._selection);
        self._timeseriesPresenter.update(resultSet, self._selection);
        self._sparklineSet.update(resultSet, self._selection);
    }

    getSelection() {
        const self = this;
        return self._selection;
    }

    showDeltaCheck() {
        const self = this;
        self._configPresenter.showDeltaCheck();
    }

    _setupResizeListener() {
        const self = this;

        let timeoutId = null;
        let lastWindowWidth = window.innerWidth;
        window.addEventListener("resize", (event) => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(() => {
                const newWindowWidth = window.innerWidth;
                if (Math.abs(lastWindowWidth - newWindowWidth) < 20) {
                    return;
                }

                lastWindowWidth = newWindowWidth;
                timeoutId = null;
                self.rebuildViz();
                self._onRequestRender();
            }, 200);
        });
    }

    rebuildViz() {
        const self = this;

        const nonRecycledWasteDiv = document.getElementById("total-waste-goal-container");
        self._nonRecycledWastePresenter = new GoalPresenter(
            nonRecycledWasteDiv,
            "nonRecycledWaste",
            (region) => self._onRegionChange(region),
            () => self._onRequestRender(),
        );

        const mismanagedWasteDiv = document.getElementById("mismanaged-waste-goal-container");
        self._mismanagedWastePresenter = new GoalPresenter(
            mismanagedWasteDiv,
            "mismanagedWaste",
            (region) => self._onRegionChange(region),
            () => self._onRequestRender(),
        );

        const bubblegraphDiv = document.getElementById("bubblegraph-container");
        self._bubblegraphPresenter = new BubblegraphPresenter(
            bubblegraphDiv,
            (region) => self._onRegionChange(region),
            () => self._onRequestRender(),
        );

        const configDiv = document.getElementById("config-container");
        self._configPresenter = new ConfigPresenter(
            configDiv,
            (stage) => self._onStageChange(stage),
            (region) => self._onRegionChange(region),
            (year) => self._onYearChange(year),
            (type) => self._onTypeChange(type),
            (showBau) => self._onShowBauChange(showBau),
        );

        const consumptionStageDiv = document.getElementById("consumption-container");
        self._consumptionStagePresenter = new StagePresenter(
            consumptionStageDiv,
            DISPLAY_STAGES.consumption,
            (stage) => self._onStageChange(stage),
            () => self._onRequestRender(),
        );

        const eolStageDiv = document.getElementById("eol-container");
        self._eolStagePresenter = new StagePresenter(
            eolStageDiv,
            DISPLAY_STAGES.eol,
            (stage) => self._onStageChange(stage),
            () => self._onRequestRender(),
        );

        const timeseriesDiv = document.getElementById("timeseries-container");
        self._timeseriesPresenter = new TimeseriesPresenter(
            timeseriesDiv,
            (year) => self._onYearChange(year),
            () => self._onRequestRender(),
        );

        const sparklinesDiv = document.getElementById("sparklines-section");
        self._sparklineSet = new SparklinesSet(
            sparklinesDiv,
            (year) => self._onYearChange(year),
            () => self._onRequestRender(),
        );
    }

    _onStageChange(stage) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            stage,
            self._selection.getShowBauDelta(),
        );

        self._onRequestRender();
    }

    _onRegionChange(region) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            region,
            self._selection.getDisplayType(),
            self._selection.getDisplayStage(),
            self._selection.getShowBauDelta(),
        );

        self._onRequestRender();
    }

    _onYearChange(year) {
        const self = this;
        self._onYearChangeCallback(year);
    }

    _onTypeChange(type) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            self._selection.getRegion(),
            type,
            self._selection.getDisplayStage(),
            self._selection.getShowBauDelta(),
        );

        self._onRequestRender();
    }

    _onShowBauChange(showBau) {
        const self = this;

        self._selection = new ReportSelection(
            self._selection.getYear(),
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            self._selection.getDisplayStage(),
            showBau,
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

    _getGoals(target, selection) {
        const self = this;
        return getGoals(target);
    }
}


function buildReportPresenter(onRequestRender) {
    return new Promise((resolve) => resolve(
        new ReportPresenter(onRequestRender),
    ));
}


export {buildReportPresenter};
