import {ALL_REGIONS, DISPLAY_TYPES} from "const";
import {STRINGS} from "strings";


class GoalPresenter {
    constructor(targetDiv, goalName, onRegionChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._goalName = goalName;
        self._onRegionChange = onRegionChange;
        self._requestRender = requestRender;

        self._d3Selection = self._getD3().select("#" + targetDiv.id);
    }

    update(stateSet, selection) {
        const self = this;

        const unitsStrRaw = STRINGS.get(selection.getDisplayType());
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const unitsStrLong = (isPercent ? "" : " ") + unitsStrRaw;
        const smallDisplay = window.innerWidth < 1400;
        const isMetricTons = unitsStrLong === " Metric Tons";
        const unitsStr = (smallDisplay && isMetricTons) ? " MT" : unitsStrLong;

        const state = stateSet.getWithIntervention();

        const regionData = new Map();
        ALL_REGIONS.forEach((region) => {
            const value = state.get("goal").get(region).get(self._goalName);
            regionData.set(region, value);
        });

        const maxValue = ALL_REGIONS.map((region) => regionData.get(region))
            .map((value) => Math.abs(value))
            .reduce((a, b) => a > b ? a : b);

        const minValue = selection.getShowBauDelta() ? -maxValue : 0;

        const horizontalScale = self._getD3().scaleLinear()
            .domain([minValue, maxValue])
            .range([0, self._targetDiv.getBoundingClientRect().width - 7]);

        const updateBars = () => {
            const bound = self._d3Selection.select(".bars")
                .selectAll(".bar")
                .data(ALL_REGIONS);

            bound.exit().remove();

            const newBars = bound.enter()
                .append("div")
                .classed("bar", true)
                .append("a")
                .attr("href", "#")
                .on("click", (event, region) => {
                    event.preventDefault();
                    self._onRegionChange(region);
                });


            const newText = newBars.append("div")
                .classed("text", true);

            const newLabel = newText.append("div")
                .classed("label", true);

            newText.append("div")
                .classed("value", true);

            const newSvgs = newBars.append("svg")
                .classed("glyph-holder", true);

            newSvgs.append("rect")
                .classed("glyph", true);

            const boundUpdated = self._d3Selection.select(".bars")
                .selectAll(".bar");

            boundUpdated.classed("selected", (region) => region === selection.getRegion());

            boundUpdated.select(".label")
                .html((region) => STRINGS.get(region));

            boundUpdated.select(".value")
                .html((region) => {
                    const value = Math.round(regionData.get(region));
                    const valueStr = value + unitsStr;
                    if (selection.getShowBauDelta() && value >= 0) {
                        return "+" + valueStr;
                    } else {
                        return valueStr;
                    }
                });

            boundUpdated.select(".glyph")
                .transition()
                .attr("width", (region) => {
                    const value = regionData.get(region);
                    const width = horizontalScale(value) - horizontalScale(0);
                    return Math.abs(width);
                })
                .attr("x", (region) => {
                    const value = regionData.get(region);
                    const width = horizontalScale(value) - horizontalScale(0);
                    if (width < 0) {
                        return horizontalScale(0) + width;
                    } else {
                        return horizontalScale(0);
                    }
                })
                .style("fill", (region) => {
                    if (selection.getRegion() === region) {
                        return "#505050";
                    } else {
                        return "#C0C0C0";
                    }
                });
        };

        updateBars();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {GoalPresenter};
