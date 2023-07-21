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
                const card = self._targetDiv.querySelector("." + cardClass);
                const body = card.querySelector(".body");
                const valueRounded = Math.round(value * 10) / 10;
                const prefix = self._prefix && valueRounded >= 0 ? "+" : "";
                const valueStr = prefix + valueRounded;
                body.innerHTML = valueStr;
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
                "total-consumption-card",
                goals.get("global").get("totalConsumption"),
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
}


export {ScorecardPresenter};
