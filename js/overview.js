import {CACHE_BUSTER, DEFAULT_YEAR, GOALS} from "const";
import {getRelative} from "geotools";
import {getGoals} from "goals";
import {ScenarioPresenter} from "overview_scenario";
import {ScorecardPresenter} from "overview_scorecard";
import {TimeDeltaPresenter} from "overview_timedelta";


class OverviewPresenter {
    constructor(scenarios, onRequestRender, onPolicyChange, onYearChange) {
        const self = this;

        self._targetDiv = document.getElementById("overview");
        self._onRequestRender = onRequestRender;
        self._onPolicyChange = onPolicyChange;
        self._onYearChange = onYearChange;
        self._goal = GOALS.nonRecycledWaste;
        self._year = DEFAULT_YEAR;

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
            (year) => self._onYearChange(year),
        );
    }

    setYear(year) {
        const self = this;

        self._year = year;
        self._onRequestRender();
    }

    render(businessAsUsuals, withInterventions) {
        const self = this;

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
        );
    }

    _onGoalChange(newGoal) {
        const self = this;
        self._goal = newGoal;
        self._timedeltaPresenter.setAttr(newGoal);
        self._onRequestRender();
    }
}


function buildOverviewPresenter(onRequestRerender, onPolicyChange, onYearChange) {
    return fetch("/pt/scenarios.json?v=" + CACHE_BUSTER)
        .then((x) => x.json())
        .then((x) => x["scenarios"])
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