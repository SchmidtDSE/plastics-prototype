import {DEFAULT_YEAR, GOALS} from "const";
import {getRelative} from "geotools";
import {getGoals} from "goals";
import {ScorecardPresenter} from "overview_scorecard";


class OverviewPresenter {

    constructor(onRequestRender, onPolicyChange, onYearChange) {
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
    }

    setYear(year) {
        const self = this;

        self._year = year;
        self._onRequestRender();
    }

    render(businessAsUsual, withInterventions) {
        const self = this;

        const currentYear = withInterventions.get(self._year);
        const relative = getRelative(withInterventions,businessAsUsual);
        const currentYearRelative = relative.get(self._year);

        const rawGoals = getGoals(currentYear);
        self._rawScorecardPresenter.render(self._year, rawGoals);

        const relativeGoals = getGoals(currentYearRelative);
        self._relativeScorecardPresenter.render(self._year, relativeGoals);
    }

    _onGoalChange(newGoal) {
        const self = this;
    }

}


function buildOverviewPresenter(onRequestRerender, onPolicyChange, onYearChange) {
    return new Promise((resolve, reject) => {
        const newPresenter = new OverviewPresenter(
            onRequestRerender,
            onPolicyChange,
            onYearChange,
        );
        resolve(newPresenter);
    });
}


export {buildOverviewPresenter};
