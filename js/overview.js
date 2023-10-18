/**
 * Central presenter which manages the overview tab and the compontent presenters underneath.
 * 
 * @license BSD, see LICENSE.md
 */


import {
    ALL_REGIONS,
    CACHE_BUSTER,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
    DEFAULT_YEAR,
    GOALS,
    PRODUCTION_ATTRS,
} from "const";
import {makeCumulative, makeYearDelta} from "transformation";
import {fetchWithRetry} from "file";
import {getRelative} from "geotools";
import {getGoals} from "goals";
import {runIntro} from "intro";
import {ScenarioPresenter} from "overview_scenario";
import {ScorecardPresenter} from "overview_scorecard";
import {TimeDeltaPresenter} from "overview_timedelta";


/**
 * Presenter to manage the overall overview tab.
 */
class OverviewPresenter {

    /**
     * Create a new presenter to start managing the overview tab.
     * 
     * @param scenarios The scenario component options to display on the overview tab.
     * @param onRequestRender Callback to invoke when the visualization needs to be re-rendered.
     * @param onPolicyChange Callback to invoke if the user has changed the policy scenario.
     * @param onYearChange Callback to invoke if the user changed the year selection.
     */
    constructor(scenarios, onRequestRender, onPolicyChange, onYearChange) {
        const self = this;

        self._targetDiv = document.getElementById("overview");
        self._onRequestRender = onRequestRender;
        self._onPolicyChange = onPolicyChange;
        self._onYearChange = onYearChange;
        self._goal = GOALS.mismanagedWaste;
        self._year = DEFAULT_YEAR;

        self._goalSelector = self._targetDiv.querySelector(".goal-select");
        self._goalSelector.addEventListener("change", () => {
            self._onGoalChange(self._goalSelector.value);
        });

        self._metricSwitch = self._targetDiv.querySelector(".metric-select");
        self._metricSwitch.addEventListener("change", () => self._onMetricSwitch());

        const rawScorecordDiv = self._targetDiv.querySelector(".raw-scorecard");
        self._rawScorecardPresenter = new ScorecardPresenter(
            rawScorecordDiv,
            (newGoal) => self._onGoalChange(newGoal),
            false,
        );

        const relativeScorecordDiv = self._targetDiv.querySelector(".relative-scorecard");
        self._relativeScorecardPresenter = new ScorecardPresenter(
            relativeScorecordDiv,
            (newGoal) => self._onGoalChange(newGoal),
            true,
        );

        const policyScenariosDiv = self._targetDiv.querySelector(".scenarios");
        self._policyScenarioPresenter = new ScenarioPresenter(
            policyScenariosDiv,
            scenarios,
            (scenario, selected) => self._onPolicyChange(scenario, selected),
        );

        const timedeltaDiv = self._targetDiv.querySelector(".overview-timeseries");
        self._timedeltaPresenter = new TimeDeltaPresenter(
            timedeltaDiv,
            self._goal,
            self._metricSwitch.value,
            (year) => self._onYearChange(year),
        );

        self._setupTutorial();
    }

    /**
     * Determine if the user has requested cumulative values to be displayed.
     * 
     * @returns True if should use cumulative values and false otherwise. 
     */
    getCumulativeEnabled() {
        const self = this;
        return self._metricSwitch.value === "cumulative";
    }

    /**
     * Determine if the user has requested values be shown as a delta against the reference year.
     * 
     * @returns True if the reference should be used and false otherwise. 
     */
    getYearDeltaEnabled() {
        const self = this;
        return self._metricSwitch.value === "reference";
    }

    /**
     * Update the year highlighted by the user.
     * 
     * @param year The new year to highlight.
     */
    setYear(year) {
        const self = this;

        self._year = year;
        self._onRequestRender();
    }

    /**
     * Re-render all of the components of the overview tab.
     * 
     * @param businessAsUsuals The business as usual projections.  
     * @param withInterventions The projections having applied scenario interventions.
     */
    render(businessAsUsuals, withInterventions) {
        const self = this;

        if (self.getCumulativeEnabled()) {
            businessAsUsuals = makeCumulative(businessAsUsuals);
            withInterventions = makeCumulative(withInterventions);
        } else if (self.getYearDeltaEnabled()) {
            const baseline = businessAsUsuals.get(2023);
            businessAsUsuals = makeYearDelta(businessAsUsuals, baseline);
            withInterventions = makeYearDelta(withInterventions, baseline);
        }

        const currentYear = withInterventions.get(self._year);
        const relative = getRelative(withInterventions, businessAsUsuals);
        const currentYearRelative = relative.get(self._year);

        const rawGoalsCurrentYear = getGoals(currentYear);
        self._rawScorecardPresenter.render(self._year, rawGoalsCurrentYear, self._goal);

        const relativeGoalsCurrentYear = getGoals(currentYearRelative);
        self._relativeScorecardPresenter.render(self._year, relativeGoalsCurrentYear, self._goal);

        const getGoalsYears = (target) => {
            const byYear = new Map();

            Array.of(...target.keys()).forEach((year) => {
                const yearValue = target.get(year);
                const goalOutput = getGoals(yearValue);
                byYear.set(year, goalOutput);
            });

            return byYear;
        };

        const rawGoalsBau = getGoalsYears(businessAsUsuals);
        const rawGoalsIntervention = getGoalsYears(withInterventions);
        self._timedeltaPresenter.render(
            rawGoalsBau,
            rawGoalsIntervention,
            self._year,
            self.getCumulativeEnabled(),
        );

        self._policyScenarioPresenter.updateSelection(businessAsUsuals.get(self._year));

        const downloadLink = document.querySelector(".download-link");
        downloadLink.href = self._buildDownload(withInterventions);
        downloadLink.download = "plasticsProjections.csv";
    }

    _setupTutorial() {
        const self = this;

        if (self._getCookiesManager().get("skip-overview-tutorial") === "yes") {
            runIntro(self._targetDiv.id);
            return;
        }

        const nextButton = self._targetDiv.querySelector(".tutorial-next-button");

        nextButton.addEventListener("click", (event) => {
            runIntro(self._targetDiv.id);
            self._getCookiesManager().set(
                "skip-overview-tutorial",
                "yes",
                {expires: 7},
            );
            event.preventDefault();
        });
    }

    _onMetricSwitch() {
        const self = this;
        self._timedeltaPresenter.setMetric(self._metricSwitch.value);
        self._onRequestRender();
    }

    _onGoalChange(newGoal) {
        const self = this;
        self._goal = newGoal;
        self._timedeltaPresenter.setAttr(newGoal);
        self._goalSelector.value = newGoal;
        self._onRequestRender();
    }

    _buildDownload(withInterventions) {
        const attrs = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS);

        const headerRow = ["year"];
        attrs.forEach((attr) => {
            ALL_REGIONS.forEach((region) => {
                headerRow.push(region + "." + attr);
            });
        });
        const headerRowStr = headerRow.join(",");

        const content = Array.of(...withInterventions.entries())
            .map((entry) => {
                const retObj = {"year": entry[0]};
                const outputs = entry[1].get("out");
                attrs.forEach((attr) => {
                    ALL_REGIONS.forEach((region) => {
                        retObj[region + "." + attr] = outputs.get(region).get(attr);
                    });
                });
                return retObj;
            })
            .map((record) => {
                const outputLinear = [record["year"]];
                attrs.forEach((attr) => {
                    ALL_REGIONS.forEach((region) => {
                        outputLinear.push(record[region + "." + attr]);
                    });
                });
                return outputLinear;
            })
            .map((recordLinear) => recordLinear.map((x) => x + ""))
            .map((recordLinear) => recordLinear.join(","))
            .join("\n");

        const fullCsv = headerRowStr + "\n" + content;
        return "data:text/csv;charset=UTF-8," + encodeURIComponent(fullCsv);
    }

    _getCookiesManager() {
        const self = this;
        // eslint-disable-next-line no-undef
        return Cookies;
    }
}


function buildOverviewPresenter(includeDevelopment, onRequestRerender, onPolicyChange,
    onYearChange) {
    return fetchWithRetry("/pt/scenarios.json?v=" + CACHE_BUSTER)
        .then((x) => x.json())
        .then((x) => x["scenarios"])
        .then((x) => x.filter((scenario) => {
            if (includeDevelopment) {
                return true;
            } else {
                return scenario["released"] == true;
            }
        }))
        .then((scenarios) => {
            return new OverviewPresenter(
                scenarios,
                onRequestRerender,
                onPolicyChange,
                onYearChange,
            );
        });
}


export {buildOverviewPresenter};
