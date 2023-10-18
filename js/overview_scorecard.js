/**
 * Logic for overview scorecards.
 *
 * @license BSD, see LICENSE.md
 */


/**
 * Presenter for the scorecards which show high level goal metrics on the overview tab.
 */
class ScorecardPresenter {
    /**
     * Create a new scorecard presenter.
     *
     * @param targetDiv Div in which the scorecards are rendered.
     * @param onGoalChange Callback if the user changes the highlighted goal metric.
     * @param prefix Flag indicating if the plus / minus sign should be forced to be shown.
     */
    constructor(targetDiv, onGoalChange, prefix) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onGoalChange = onGoalChange;
        self._prefix = prefix;
        self._tippyPrior = null;

        self._targetDiv.querySelectorAll(".card").forEach((card) => {
            card.addEventListener("click", () => {
                card.querySelector(".overview-radio").checked = true;
                self._onGoalChange(card.getAttribute("goal"));
            });
        });
    }

    /**
     * Render the card or update it if already present.
     *
     * @param year Year for which the metrics are to be shown.
     * @param goals The goal metric calculations.
     * @param selectedGoal Goal currently highlighted by the user.
     */
    render(year, goals, selectedGoal) {
        const self = this;

        if (self._tippyPrior === null) {
            // eslint-disable-next-line no-undef
            self._tippyPrior = tippy(
                self._targetDiv.querySelectorAll(".info-target"),
            );
        }

        const updateYear = () => {
            self._targetDiv.querySelector(".year").innerHTML = year;
        };

        const updateBody = () => {
            const setBody = (cardClass, value) => {
                const valueRounded = Math.round(value * 10) / 10;
                const prefix = self._prefix && valueRounded >= 0 ? "+" : "";
                const valueStr = prefix + valueRounded;

                const target = self._getD3().select("#" + self._targetDiv.id)
                    .select("." + cardClass)
                    .select(".body");

                if (target.text() !== valueStr) {
                    target.text(valueStr);
                    target.style("opacity", 0)
                        .transition()
                        .duration(750)
                        .style("opacity", 1);
                }
            };

            setBody(
                "mismanaged-waste-card",
                goals.get("global").get("mismanagedWaste"),
            );

            setBody(
                "landfill-waste-card",
                goals.get("global").get("landfillWaste"),
            );

            setBody(
                "incinerated-waste-card",
                goals.get("global").get("incineratedWaste"),
            );

            setBody(
                "recycling-card",
                goals.get("global").get("recycling"),
            );
        };

        const updateHighlight = () => {
            self._targetDiv.querySelectorAll(".card").forEach((card) => {
                if (card.getAttribute("goal") === selectedGoal) {
                    card.classList.add("active");
                    card.querySelector(".overview-radio").checked = true;
                } else {
                    card.classList.remove("active");
                    card.querySelector(".overview-radio").checked = false;
                }
            });
        };

        updateYear();
        updateBody();
        updateHighlight();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {ScorecardPresenter};
