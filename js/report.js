class ReportPresenter {

    render(state) {
        const self = this;

        const outputs = state.get("out");

        const updateBar = (prefix, value) => {
            const valueRounded = Math.round(value * 100);
            document.getElementById(prefix + "-label").innerHTML = valueRounded;
            
            const width = valueRounded + "%";
            document.getElementById(prefix + "-bar").style.width = width;
        };

        const updateDisplay = (region) => {
            const localProjection = outputs.get(region);
            const recyclingMT = localProjection.get("eolRecyclingMT");
            const incinerationMT = localProjection.get("eolIncinerationMT");
            const landfillMT = localProjection.get("eolLandfillMT");
            const mismanagedMT = localProjection.get("eolMismanagedMT");

            const totalMT = recyclingMT + incinerationMT + landfillMT + mismanagedMT;

            const recyclingPercent = recyclingMT / totalMT;
            const incinerationPercent = incinerationMT / totalMT;
            const landfillPercent = landfillMT / totalMT;
            const mismanagedPercent = mismanagedMT / totalMT;

            updateBar("eol-" + region + "-recycling", recyclingPercent);
            updateBar("eol-" + region + "-incineration", incinerationPercent);
            updateBar("eol-" + region + "-landfill", landfillPercent);
            updateBar("eol-" + region + "-mismanaged", mismanagedPercent);
        };

        updateDisplay("china");
        updateDisplay("nafta");
        updateDisplay("eu30");
        updateDisplay("row");
    }

}


function buildReportPresenter() {
    return new Promise((resolve) => resolve(new ReportPresenter()));
}
