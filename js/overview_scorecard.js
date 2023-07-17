class ScorecardPresenter {

    constructor(targetDiv, onGoalChange, prefix) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onGoalChange = onGoalChange;
        self._prefix = prefix;
    }

    render(year, goals) {
        const self = this;

        console.log(goals);

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

            
            /*setBody(
                "production-emissions-card",
                goals.get("productionEmissions"),
            );
            
            setBody(
                "consumption-emissions-card",
                goals.get("consumptionEmissions"),
            );*/
            
            setBody(
                "non-recycled-waste-card",
                goals.get("global").get("nonRecycledWaste"),
            );
            
            setBody(
                "mismanaged-waste-card",
                goals.get("global").get("mismanagedWaste"),
            );
        };

        updateYear();
        updateBody();
    }

}


export {ScorecardPresenter};
