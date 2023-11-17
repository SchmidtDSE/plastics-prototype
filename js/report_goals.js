/**
 * Logic for the goals summary components appearing at the top of the detailed tab.
 *
 * @license BSD, see LICENSE.md
 */

import {ALL_REGIONS, DISPLAY_TYPES} from "const";
import {STRINGS, UNITS} from "strings";


/**
 * Presenter for a goal summary component appearing at the top of the detailed tab.
 */
class GoalPresenter {
    /**
     *
     * @param targetDiv  Div where the display is rendered.
     * @param goalName The name of the goal (see const.GOALS) being displayed by this presenter.
     * @param onRegionChange Callback to invoke if the user changes the selected region.
     * @param requestRender Callback to request visualization re-render.
     */
    constructor(targetDiv, goalName, onRegionChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._goalName = goalName;
        self._onRegionChange = onRegionChange;
        self._requestRender = requestRender;

        self._d3Selection = self._getD3().select("#" + targetDiv.id);
    }

    /**
     * Update the display.
     *
     * @param stateSet The set of state Maps having gone through the policy simulation.
     * @param selection Structure describing the selections made by the user like year and region.
     */
    update(stateSet, selection) {
        const self = this;

        const unitsStrRaw = UNITS.get(selection.getDisplayType());
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const unitsStrLong = (isPercent ? "" : " ") + unitsStrRaw;
        const smallDisplay = window.innerWidth < 1650;
        const isMetricTons = unitsStrRaw.includes("Tons");
        const unitsStr = (smallDisplay && isMetricTons) ? " MMT" : unitsStrLong;

        const state = stateSet.getWithIntervention();

        const regionData = new Map();
        ALL_REGIONS.forEach((region) => {
            if (state.get("goal").has(region)) {
                const value = state.get("goal").get(region).get(self._goalName);
                regionData.set(region, value);
            }
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

            newSvgs.append("rect")
                .classed("zero", true)
                .style("fill", "#C0C0C0")
                .attr("width", 1);

            const boundUpdated = self._d3Selection.select(".bars")
                .selectAll(".bar");

            boundUpdated.classed("selected", (region) => region === selection.getRegion());

            boundUpdated.select(".label")
                .html((region) => STRINGS.get(region));

            boundUpdated.select(".value")
                .html((region) => {
                    if (!regionData.has(region)) {
                        return "Not found.";
                    }

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
                    if (!regionData.has(region)) {
                        return 0;
                    }

                    const value = regionData.get(region);
                    const width = horizontalScale(value) - horizontalScale(0);
                    return Math.abs(width);
                })
                .attr("x", (region) => {
                    if (!regionData.has(region)) {
                        return horizontalScale(0);
                    }

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
                })
                .attr("height", selection.getShowBauDelta() ? 4 : 7);

            boundUpdated.select(".zero")
                .transition()
                .style("fill", (region) => {
                    if (selection.getRegion() === region) {
                        return "#505050";
                    } else {
                        return "#C0C0C0";
                    }
                })
                .attr("x", horizontalScale(0))
                .attr("height", selection.getShowBauDelta() ? 7 : 0);
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
