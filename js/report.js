/**
 * Logic for a top line presenter which manages the details tab.
 *
 * @license BSD, see LICENSE.md
 */

import {
    DEFAULT_YEAR,
    DEFAULT_REGION,
    DISPLAY_TYPES,
    DISPLAY_STAGES,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
} from "const";
import {runIntro} from "intro";
import {makeCumulative} from "transformation";
import {getRelative} from "geotools";
import {getGoals} from "goals";
import {BubblegraphPresenter} from "report_bubble";
import {ConfigPresenter} from "report_config";
import {GoalPresenter} from "report_goals";
import {SparklinesSet} from "report_sparklines";
import {StagePresenter} from "report_stage";
import {TimeseriesPresenter} from "report_timeseries";


/**
 * Structure describing the selection like region and year made by the user.
 */
class ReportSelection {
    /**
     * Create a new structure describing a visualization / report configuration made by the user.
     *
     * @param year The year to highlight.
     * @param region The region like nafta to highlight.
     * @param displayType The type of metric to display like amount (see DISPLAY_TYPES).
     * @param displayStage The stage to display to the user like production.
     * @param showBauDelta Flag indicating if the user should be shown change from business as
     *      usual.
     */
    constructor(year, region, displayType, displayStage, showBauDelta) {
        const self = this;

        self._year = year;
        self._region = region;
        self._displayType = displayType;
        self._displayStage = displayStage;
        self._showBauDelta = showBauDelta;
    }

    /**
     * Get the year to highlight.
     *
     * @returns Year to be highlighted.
     */
    getYear() {
        const self = this;
        return self._year;
    }

    /**
     * Get the region to be highlighted.
     *
     * @returns The region like nafta to highlight.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the type of metric to show.
     *
     * @reutrns The type of metric to display like amount (see DISPLAY_TYPES).
     */
    getDisplayType() {
        const self = this;
        return self._displayType;
    }

    /**
     * Get the stage to highlight.
     *
     * @returns The stage to display to the user like production.
     */
    getDisplayStage() {
        const self = this;
        return self._displayStage;
    }

    /**
     * Determine if the user should be shown absolute values or changes from business as usual.
     *
     * @returns Flag indicating if the user should be shown change from business as usual. True if
     *      deltas from business as usual should be shown. False if absolute values.
     */
    getShowBauDelta() {
        const self = this;
        return self._showBauDelta;
    }
}


/**
 * Set of projections to display within the visualization.
 */
class VizStateSet {
    /**
     * Collection of model / simulation outputs.
     *
     * @param businessAsUsualRaw Business as usual projections.
     * @param businessAsUsualTransformed Business as usual with post-processing of data.
     * @param withInterventionsRaw Projections after having applied scenario interventions.
     * @param withInterventionsTransformed Projections with interventions after post-processing.
     * @param selectedYear The year to highlight.
     */
    constructor(businessAsUsualRaw, businessAsUsualTransformed,
        withInterventionsRaw, withInterventionsTransformed, selectedYear) {
        const self = this;
        self._businessAsUsualRaw = businessAsUsualRaw;
        self._businessAsUsualTransformed = businessAsUsualTransformed;
        self._withInterventionsRaw = withInterventionsRaw;
        self._withInterventionsTransformed = withInterventionsTransformed;
        self._selectedYear = selectedYear;
    }

    /**
     * Get business as usual projections over time.
     *
     * @param useRaw Flag indicating if post-processed data should be returned.
     * @returns Returns all years of business as usual projections.
     */
    getAllBusinessAsUsuals(useRaw) {
        const self = this;
        useRaw = useRaw === undefined ? false : useRaw;
        return useRaw ? self._businessAsUsualRaw : self._businessAsUsualTransformed;
    }

    /**
     * Get business as usual projections for a year.
     *
     * @param useRaw Flag indicating if post-processed data should be returned.
     * @param year The year for which projections should be returned.
     * @returns Returns a year of business as usual projections.
     */
    getBusinessAsUsual(useRaw, year) {
        const self = this;
        year = year === undefined ? self._selectedYear : year;
        const target = self.getBusinessAsUsuals(useRaw);
        return target.get(year);
    }

    /**
     * Get projections after applying interventions.
     *
     * @param useRaw Flag indicating if post-processed data should be returned.
     * @returns Returns all years of intervention projections.
     */
    getAllWithInterventions(useRaw) {
        const self = this;
        useRaw = useRaw === undefined ? false : useRaw;
        return useRaw ? self._withInterventionsRaw : self._withInterventionsTransformed;
    }

    /**
     * Get intervention projections for a year.
     *
     * @param useRaw Flag indicating if post-processed data should be returned.
     * @param year The year for which projections should be returned.
     * @returns Returns a year of intervention projections.
     */
    getWithIntervention(useRaw, year) {
        const self = this;
        year = year === undefined ? self._selectedYear : year;
        const target = self.getAllWithInterventions(useRaw);
        return target.get(year);
    }
}


/**
 * Presenter which runs the details tab, coordinating among children presenters.
 */
class ReportPresenter {
    /**
     * Create a new presenter to manage the details tab.
     *
     * @param onRequestRender Callback to invoke if the visualization needs to be redrawn.
     * @param onYearChange Callback to invoke if the user changes the highlighted year.
     */
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

        self._landfillWastePresenter = null;
        self._mismanagedWastePresenter = null;
        self._incineratedWastePresenter = null;
        self._recyclingPresenter = null;
        self._bubblegraphPresenter = null;
        self._configPresenter = null;
        self._consumptionStagePresenter = null;
        self._productionStagePresenter = null;
        self._eolStagePresenter = null;
        self._timeseriesPresenter = null;
        self._sparklineSet = null;

        self.rebuildViz();
        self._setupResizeListener();
        self._setupTutorial();
    }

    /**
     * Indicate the year to be highlighted in the report.
     *
     * @param year New year to highlight.
     */
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

    /**
     * Re-render this and all children presenters.
     *
     * @param businessAsUsual The projections over time in business as usual.
     * @param withInterventions The projections over time with interventions applied.
     */
    render(businessAsUsual, withInterventions) {
        const self = this;

        const displayType = self._selection.getDisplayType();
        const showingBauDelta = self._selection.getShowBauDelta();

        const getTransformedMaybe = (target) => {
            if (displayType == DISPLAY_TYPES.percent) {
                return self._getPercents(target);
            } else if (displayType == DISPLAY_TYPES.cumulative) {
                return makeCumulative(target);
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

        self._landfillWastePresenter.update(resultSet, self._selection);
        self._mismanagedWastePresenter.update(resultSet, self._selection);
        self._incineratedWastePresenter.update(resultSet, self._selection);
        self._recyclingPresenter.update(resultSet, self._selection);
        self._bubblegraphPresenter.update(resultSet, self._selection);
        self._configPresenter.update(resultSet, self._selection);
        self._consumptionStagePresenter.update(resultSet, self._selection);
        self._productionStagePresenter.update(resultSet, self._selection);
        self._eolStagePresenter.update(resultSet, self._selection);
        self._timeseriesPresenter.update(resultSet, self._selection);
        self._sparklineSet.update(resultSet, self._selection);
    }

    /**
     * Get the current visualization configuration selected by the user.
     *
     * @returns A ReportSelection describing the current visualization configuration.
     */
    getSelection() {
        const self = this;
        return self._selection;
    }

    /**
     * Allow the user to toggle absolute versus relative to BAU values.
     */
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

        const landfillWasteDiv = document.getElementById("landfill-waste-goal-container");
        self._landfillWastePresenter = new GoalPresenter(
            landfillWasteDiv,
            "landfillWaste",
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

        const incineratedWasteDiv = document.getElementById("incinerated-waste-goal-container");
        self._incineratedWastePresenter = new GoalPresenter(
            incineratedWasteDiv,
            "incineratedWaste",
            (region) => self._onRegionChange(region),
            () => self._onRequestRender(),
        );

        const recyclingDiv = document.getElementById("recycling-goal-container");
        self._recyclingPresenter = new GoalPresenter(
            recyclingDiv,
            "recycling",
            (region) => self._onRegionChange(region),
            () => self._onRequestRender(),
        );

        const bubblegraphDiv = document.getElementById("bubblegraph-container");
        if (self._bubblegraphPresenter !== null) {
            self._bubblegraphPresenter.cleanUp();
        }
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

        const productionStageDiv = document.getElementById("production-container");
        self._productionStagePresenter = new StagePresenter(
            productionStageDiv,
            DISPLAY_STAGES.production,
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
        if (self._timeseriesPresenter !== null) {
            self._timeseriesPresenter.cleanUp();
        }
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
            makePercents(regionOriginal, newRegionOut, PRODUCTION_ATTRS);
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

    _setupTutorial() {
        const self = this;

        if (self._getCookiesManager().get("skip-report-tutorial") === "yes") {
            runIntro("detailed");
            return;
        }

        const targetDiv = document.getElementById("detailed");

        const nextButton = targetDiv.querySelector(".tutorial-next-button");

        nextButton.addEventListener("click", (event) => {
            runIntro("detailed");
            event.preventDefault();

            self._getCookiesManager().set(
                "skip-report-tutorial",
                "yes",
                {expires: 7},
            );
        });
    }

    _getCookiesManager() {
        const self = this;
        // eslint-disable-next-line no-undef
        return Cookies;
    }
}


function buildReportPresenter(onRequestRender, onYearChange) {
    return new Promise((resolve) => {
        const presenter = new ReportPresenter(onRequestRender, onYearChange);
        resolve(presenter);
    });
}


export {buildReportPresenter};
