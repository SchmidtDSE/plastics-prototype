import {
    DEFAULT_YEAR,
    DEFAULT_REGION,
    DISPLAY_TYPES,
    DISPLAY_STAGES,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
} from "const";
import {BubblegraphPresenter} from "report_bubble";
import {ConfigPresenter} from "report_config";
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
    constructor(onRequestRender) {
        const self = this;

        self._onRequestRender = onRequestRender;

        self._selection = new ReportSelection(
            DEFAULT_YEAR,
            DEFAULT_REGION,
            DISPLAY_TYPES.amount,
            DISPLAY_STAGES.eol,
            false,
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
            () => self._onRequestRender()
        );
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
                return self._getRelative(target, reference);
            } else {
                return target;
            }
        };

        const bauTransformed = getTransformedMaybe(businessAsUsual);
        const interventionsTransformed = getTransformedMaybe(withInterventions);

        const bauFinal = getRelativeMaybe(
            bauTransformed,
            bauTransformed,
        );

        const interventionsFinal = getRelativeMaybe(
            interventionsTransformed,
            bauTransformed,
        );

        const resultSet = new VizStateSet(
            businessAsUsual,
            bauFinal,
            withInterventions,
            interventionsFinal,
            self._selection.getYear(),
        );

        self._bubblegraphPresenter.update(resultSet, self._selection);
        self._configPresenter.update(resultSet, self._selection);
        self._consumptionStagePresenter.update(resultSet, self._selection);
        self._eolStagePresenter.update(resultSet, self._selection);
        self._timeseriesPresenter.update(resultSet, self._selection);
        self._sparklineSet.update(resultSet, self._selection);
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

        self._selection = new ReportSelection(
            year,
            self._selection.getRegion(),
            self._selection.getDisplayType(),
            self._selection.getDisplayStage(),
            self._selection.getShowBauDelta(),
        );

        self._onRequestRender();
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

    _getRelative(target, reference) {
        const self = this;

        const newTargetYears = new Map();

        target.forEach((targetValues, year) => {
            const referenceValues = reference.get(year);
            const newTargetValues = self._getRelativeSingleYear(
                targetValues,
                referenceValues,
            );
            newTargetYears.set(year, newTargetValues);
        });

        return newTargetYears;
    }

    _getRelativeSingleYear(target, reference) {
        const self = this;

        const newOut = new Map();

        const targetOut = target.get("out");
        const referenceOut = reference.get("out");

        targetOut.forEach((targetRegions, region) => {
            const newRegionOut = new Map();
            targetRegions.forEach((targetValue, key) => {
                const referenceValue = referenceOut.get(region).get(key);
                const relativeValue = targetValue - referenceValue;
                newRegionOut.set(key, relativeValue);
            });
            newOut.set(region, newRegionOut);
        });

        const wrapped = new Map();
        wrapped.set("out", newOut);
        return wrapped;
    }
}


function buildReportPresenter(onRequestRender) {
    return new Promise((resolve) => resolve(
        new ReportPresenter(onRequestRender),
    ));
}


export {buildReportPresenter};
