import {
    COLORS,
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
    STANDARD_ATTR_NAMES,
} from "const";
import {STRINGS} from "strings";


class StagePresenter {
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

    update(stateSet, selection) {
        const self = this;

        const smallDisplay = window.innerWidth < 1200;

        const selected = selection.getDisplayStage() == self._stage;
        const attrs = STANDARD_ATTR_NAMES.get(self._stage);

        const unitsStrRaw = STRINGS.get(selection.getDisplayType());
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const unitsStrLong = (isPercent ? "" : " ") + unitsStrRaw;
        const isMetricTons = unitsStrRaw === "Million Metric Tons";
        const unitsStr = (smallDisplay && isMetricTons) ? " MT" : unitsStrLong;

        const state = stateSet.getWithIntervention();
        const regionData = state.get("out").get(selection.getRegion());

        const maxValue = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS)
            .map((attr) => Math.abs(regionData.get(attr)))
            .reduce((a, b) => a > b ? a : b);

        const minValue = selection.getShowBauDelta() ? -maxValue : 0;

        const horizontalScale = self._getD3().scaleLinear()
            .domain([minValue, maxValue])
            .range([0, self._targetDiv.getBoundingClientRect().width - 7]);

        const updateRadio = () => {
            const radio = self._targetDiv.querySelector(".stage-radio");
            radio.checked = selected;
        };

        const updateTitle = () => {
            const title = self._targetDiv.querySelector(".description");
            const subtitle = self._targetDiv.querySelector(".subtitle");

            const titleText = STRINGS.get(self._stage);
            const subtitleText = [
                selection.getYear() + "",
                STRINGS.get(selection.getRegion()),
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

            const boundUpdated = self._d3Selection.select(".bars")
                .selectAll(".bar");

            const isProduction = self._stage == DISPLAY_STAGES.production;
            boundUpdated.select(".label")
                .html((attr) => {
                    const labelRaw = STRINGS.get(attr);
                    if (smallDisplay && labelRaw === "House, Leis, Sport") {
                        return "Household";
                    } else if (labelRaw === "Domestic" && isProduction) {
                        return "Stays in Region";
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
                });

            if (self._stage === DISPLAY_STAGES.production) {
                boundUpdated.style("display", (attr) => {
                    const isZero = regionData.get(attr) == 0;
                    return isZero ? "none" : "block";
                });
            }
        };

        updateRadio();
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
