/**
 * Logic for the combination menu / bar graph overview of different stages.
 *
 * @license BSD, see LICENSE.md
 */

import {
    COLORS,
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
    STANDARD_ATTR_NAMES,
} from "const";
import {STRINGS, UNITS} from "strings";


/**
 * Presenter for the stage presenter which typically appears on the left side of the details tab.
 *
 * Presenter which summaries different stages for the user and allows for selection from among those
 * stages where stages include production, consumption, and waste / end of life.
 */
class StagePresenter {
    /**
     * Create a new stage presenter to manage the stage summary / selection widget.
     *
     * @param targetDiv The div where the stage presenter / selector is rendered.
     * @param stage The stage currently selected like production.
     * @param onStageChange Callback to invoke if the user changes the highlighted stage.
     * @param requestRender Callback to invoke if the visualiztation needs to be redrawn.
     */
    constructor(targetDiv, stage, onStageChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._stage = stage;
        self._onStageChange = onStageChange;
        self._requestRender = requestRender;

        self._d3Selection = self._getD3().select("#" + targetDiv.id);

        // Setup radio
        const radio = self._targetDiv.querySelector(".stage-radio");
        radio.addEventListener("change", () => {
            self._onStageChange(self._stage);
        });

        self._targetDiv.addEventListener("click", () => {
            self._onStageChange(self._stage);
            radio.checked = true;
        });

        // Color scales
        const colorScaleConstructors = new Map();

        const makeColorsEol = () => {
            const colorScalesEol = new Map();
            EOL_ATTRS.forEach((attr, i) => {
                const color = COLORS[i];
                colorScalesEol.set(attr, color);
            });
            return colorScalesEol;
        };
        colorScaleConstructors.set(DISPLAY_STAGES.eol, makeColorsEol);

        const makeColorsConsumption = () => {
            const colorScalesConsumption = new Map();
            CONSUMPTION_ATTRS.forEach((attr, i) => {
                const color = COLORS[i];
                colorScalesConsumption.set(attr, color);
            });
            return colorScalesConsumption;
        };
        colorScaleConstructors.set(DISPLAY_STAGES.consumption, makeColorsConsumption);

        const makeColorsProduction = () => {
            const colorScalesProduction = new Map();
            PRODUCTION_ATTRS.forEach((attr, i) => {
                const color = COLORS[i];
                colorScalesProduction.set(attr, color);
            });
            return colorScalesProduction;
        };
        colorScaleConstructors.set(DISPLAY_STAGES.production, makeColorsProduction);

        self._colorScale = colorScaleConstructors.get(self._stage)();
    }

    /**
     * Update the display.
     *
     * @param stateSet The set of state Maps having gone through the policy simulation.
     * @param selection Structure describing the selections made by the user like year and region.
     */
    update(stateSet, selection) {
        const self = this;

        const smallDisplay = window.innerWidth < 1500;

        const selected = selection.getDisplayStage() == self._stage;
        const attrs = STANDARD_ATTR_NAMES.get(self._stage);

        const unitsStrRaw = UNITS.get(selection.getDisplayType());
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const unitsStrLong = (isPercent ? "" : " ") + unitsStrRaw;
        const isMetricTons = unitsStrRaw.includes("Tons");
        const unitsStr = (smallDisplay && isMetricTons) ? " MMT" : unitsStrLong;

        const state = stateSet.getWithIntervention();
        const regionData = state.get("out").get(selection.getRegion());

        const maxValue = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS)
            .map((attr) => Math.abs(regionData.get(attr)))
            .reduce((a, b) => a > b ? a : b);

        const minValue = selection.getShowBauDelta() ? -maxValue : 0;

        const horizontalScale = self._getD3().scaleLinear()
            .domain([minValue, maxValue])
            .range([0, self._targetDiv.getBoundingClientRect().width - 7]);

        const updateSelected = () => {
            if (selected) {
                self._targetDiv.classList.add("selected");
                self._targetDiv.classList.remove("unselected");
            } else {
                self._targetDiv.classList.remove("selected");
                self._targetDiv.classList.add("unselected");
            }
            const radio = self._targetDiv.querySelector(".stage-radio");
            radio.checked = selected;
        };

        const updateTitle = () => {
            const title = self._targetDiv.querySelector(".description");
            const subtitle = self._targetDiv.querySelector(".subtitle");

            const regionName = selection.getRegion();
            const regionStr = regionName === "row" ? "RoW" : STRINGS.get(regionName);

            const titleText = STRINGS.get(self._stage);
            const subtitleText = [
                selection.getYear() + "",
                regionStr,
            ].join(" ");

            title.innerHTML = titleText;
            subtitle.innerHTML = subtitleText;
        };

        const updateBars = () => {
            const bound = self._d3Selection.select(".bars")
                .selectAll(".bar")
                .data(attrs);

            bound.exit().remove();

            const newBars = bound.enter()
                .append("div")
                .classed("bar", true);

            const newText = newBars.append("div")
                .classed("text", true);

            newText.append("div")
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

            const isProduction = self._stage == DISPLAY_STAGES.production;
            boundUpdated.select(".label")
                .html((attr) => {
                    const labelRaw = STRINGS.get(attr);
                    if (smallDisplay && labelRaw === "House, Leis, Sport") {
                        return "Household";
                    } else if (labelRaw === "Net Export" && isProduction) {
                        return "Traded";
                    } else {
                        return labelRaw;
                    }
                });

            boundUpdated.select(".value")
                .html((attr) => {
                    const value = Math.round(regionData.get(attr));
                    const valueStr = value + unitsStr;
                    if (selection.getShowBauDelta() && value >= 0) {
                        return "+" + valueStr;
                    } else {
                        return valueStr;
                    }
                });

            boundUpdated.select(".glyph")
                .transition()
                .attr("width", (attr) => {
                    const value = regionData.get(attr);
                    const width = horizontalScale(value) - horizontalScale(0);
                    return Math.abs(width);
                })
                .attr("x", (attr) => {
                    const value = regionData.get(attr);
                    const width = horizontalScale(value) - horizontalScale(0);
                    if (width < 0) {
                        return horizontalScale(0) + width;
                    } else {
                        return horizontalScale(0);
                    }
                })
                .style("fill", (attr) => {
                    if (selected) {
                        return self._colorScale.get(attr);
                    } else {
                        return "#C0C0C0";
                    }
                })
                .attr("height", selection.getShowBauDelta() ? 4 : 7);

            boundUpdated.select(".zero")
                .transition()
                .attr("x", horizontalScale(0))
                .attr("height", selection.getShowBauDelta() ? 7 : 0);

            const hideZeros = false; //isProduction && !selection.getShowBauDelta();
            if (hideZeros) {
                boundUpdated.style("display", (attr) => {
                    const isZero = regionData.get(attr) == 0;
                    return isZero ? "none" : "block";
                });
            }
        };

        updateSelected();
        updateTitle();
        updateBars();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {StagePresenter};
