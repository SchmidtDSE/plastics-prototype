class ScorecardPresenter {
    constructor(targetDiv, onGoalChange, prefix) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onGoalChange = onGoalChange;
        self._prefix = prefix;

        self._targetDiv.querySelectorAll(".card").forEach((card) => {
            card.addEventListener("click", () => {
                self._onGoalChange(card.getAttribute("goal"));
            });
        });
    }

    render(year, goals, selectedGoal) {
        const self = this;

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

                target.text(valueStr);
                target.style("opacity", 0)
                    .transition()
                    .duration(750)
                    .style("opacity", 1);
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
                "total-waste-card",
                goals.get("global").get("totalWaste"),
            );
        };

        const updateHighlight = () => {
            self._targetDiv.querySelectorAll(".card").forEach((card) => {
                if (card.getAttribute("goal") === selectedGoal) {
                    card.classList.add("active");
                } else {
                    card.classList.remove("active");
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
