/**
 * Logic for the bubble chart appearing at the bottom of the detailed tab.
 *
 * @license BSD, see LICENSE.md
 */

import {
    ALL_REGIONS,
    COLORS,
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
    TEXT_COLORS,
    STANDARD_ATTR_NAMES,
} from "const";

import {STRINGS} from "strings";

const ALL_REGIONS_SORTED = ALL_REGIONS.filter((x) => x !== "global").concat(["global"]);


/**
 * Presenter for the detailed tab bubblegraph.
 *
 * Presenter for the bubblegraph appearing at the bottom of the detailed tab which shows cross-
 * regional information.
 */
class BubblegraphPresenter {
    /**
     * Create a new presenter to start managing the bubblegraph.
     *
     * @param targetDiv Div where the bubblegraph is rendered.
     * @param onRegionChange Callback to invoke if the user changes the selected region.
     * @param requestRender Callback to invoke if the visualizaiton needs to be redrawn.
     */
    constructor(targetDiv, onRegionChange, requestRender) {
        const self = this;

        self._onRegionChange = onRegionChange;
        self._requestRender = requestRender;

        self._targetDiv = targetDiv;
        self._targetSvg = self._targetDiv.querySelector(".bubblegraph");
        self._targetSvgId = self._targetSvg.id;
        self._tippyPrior = null;
        self._message = "Loading...";

        // Setup svg
        self._d3Selection = self._getD3().select("#" + self._targetSvgId);
        self._d3Selection.html("");
        self._d3Selection.append("g").classed("line-layer", true);
        self._d3Selection.append("g").classed("bubble-layer", true);
        self._d3Selection.append("g").classed("label-layer", true);

        // Setup slope checkbox
        const slopeCheck = self._targetDiv.querySelector(".slope-check");
        self._enableSlope = slopeCheck.checked;
        slopeCheck.addEventListener("click", () => {
            const isChecked = slopeCheck.checked;
            self._enableSlope = isChecked;
            self._requestRender();
        });

        const svgBoundingBox = self._targetSvg.getBoundingClientRect();
        self._svgWidth = svgBoundingBox.width;
        self._svgHeight = svgBoundingBox.height;

        // Attrs
        self._attrNames = STANDARD_ATTR_NAMES;

        // Horizontal scales
        self._horizontalScale = self._getD3().scaleBand()
            .domain(["header"].concat(ALL_REGIONS_SORTED))
            .range([0, self._svgWidth]);

        // Vertical scales
        const verticalScaleEol = self._getD3().scaleBand()
            .domain(EOL_ATTRS)
            .range([50, self._svgHeight - 10]);

        const verticalScaleConsumption = self._getD3().scaleBand()
            .domain(CONSUMPTION_ATTRS)
            .range([50, self._svgHeight - 10]);

        const verticalScaleProduction = self._getD3().scaleBand()
            .domain(PRODUCTION_ATTRS)
            .range([50, self._svgHeight - 10]);

        self._verticalScales = new Map();
        self._verticalScales.set(DISPLAY_STAGES.eol, verticalScaleEol);
        self._verticalScales.set(DISPLAY_STAGES.consumption, verticalScaleConsumption);
        self._verticalScales.set(DISPLAY_STAGES.production, verticalScaleProduction);

        // Vertical scales on index
        const eolIndicies = EOL_ATTRS.map((x, i) => i);
        const verticalIndexScaleEol = self._getD3().scaleBand()
            .domain(eolIndicies)
            .range([50, self._svgHeight - 10]);

        const consumptionIndicies = CONSUMPTION_ATTRS.map((x, i) => i);
        const verticalIndexScaleConsumption = self._getD3().scaleBand()
            .domain(consumptionIndicies)
            .range([50, self._svgHeight - 10]);

        const productionIndicies = PRODUCTION_ATTRS.map((x, i) => i);
        const verticalIndexScaleProduction = self._getD3().scaleBand()
            .domain(productionIndicies)
            .range([50, self._svgHeight - 10]);

        self._verticalIndexScales = new Map();
        self._verticalIndexScales.set(DISPLAY_STAGES.eol, verticalIndexScaleEol);
        self._verticalIndexScales.set(DISPLAY_STAGES.consumption, verticalIndexScaleConsumption);
        self._verticalIndexScales.set(DISPLAY_STAGES.production, verticalIndexScaleProduction);

        // Color scales
        const colorScalesEol = new Map();
        EOL_ATTRS.forEach((attr, i) => {
            const color = COLORS[i];
            colorScalesEol.set(attr, color);
        });

        const colorScalesConsumption = new Map();
        CONSUMPTION_ATTRS.forEach((attr, i) => {
            const color = COLORS[i];
            colorScalesConsumption.set(attr, color);
        });

        const colorScalesProduction = new Map();
        PRODUCTION_ATTRS.forEach((attr, i) => {
            const color = COLORS[i];
            colorScalesProduction.set(attr, color);
        });

        self._colorScales = new Map();
        self._colorScales.set(DISPLAY_STAGES.eol, colorScalesEol);
        self._colorScales.set(DISPLAY_STAGES.consumption, colorScalesConsumption);
        self._colorScales.set(DISPLAY_STAGES.production, colorScalesProduction);

        // Text color scales
        const textColorScalesEol = new Map();
        EOL_ATTRS.forEach((attr, i) => {
            const color = TEXT_COLORS[i];
            textColorScalesEol.set(attr, color);
        });

        const textColorScalesConsumption = new Map();
        CONSUMPTION_ATTRS.forEach((attr, i) => {
            const color = TEXT_COLORS[i];
            textColorScalesConsumption.set(attr, color);
        });

        const textColorScalesProduction = new Map();
        PRODUCTION_ATTRS.forEach((attr, i) => {
            const color = TEXT_COLORS[i];
            textColorScalesProduction.set(attr, color);
        });

        self._textColorScales = new Map();
        self._textColorScales.set(DISPLAY_STAGES.eol, textColorScalesEol);
        self._textColorScales.set(DISPLAY_STAGES.consumption, textColorScalesConsumption);
        self._textColorScales.set(DISPLAY_STAGES.production, textColorScalesProduction);

        // Accessible change year
        self._targetDiv.addEventListener("keydown", (event) => {
            if (event.key === "c") {
                self._onRegionChange("china");
            } else if (event.key === "e") {
                self._onRegionChange("eu30");
            } else if (event.key === "n") {
                self._onRegionChange("nafta");
            } else if (event.key === "r") {
                self._onRegionChange("row");
            } else if (event.key === "g") {
                self._onRegionChange("global");
            }
        });
    }

    /**
     * Clean up elements before the visualization is destroyed or reconstructed.
     */
    cleanUp() {
        const self = this;
        if (self._tippyPrior !== null) {
            self._tippyPrior.forEach((x) => x.destroy());
        }
    }

    /**
     * Re-render this graphic.
     *
     * @param stateSet The set of state Maps having gone through the policy simulation.
     * @param selection Structure describing the selections made by the user like year and region.
     */
    update(stateSet, selection) {
        const self = this;

        const smallDisplay = window.innerWidth < 800;

        const displayStage = selection.getDisplayStage();
        const attrNames = self._attrNames.get(displayStage);
        const colorScale = self._colorScales.get(displayStage);
        const textColorScale = self._textColorScales.get(displayStage);
        const verticalScale = self._verticalScales.get(displayStage);
        const verticalIndexScale = self._verticalIndexScales.get(displayStage);

        const state = stateSet.getWithIntervention();
        const outputData = state.get("out");

        const info = [];
        ALL_REGIONS_SORTED.forEach((region) => {
            attrNames.forEach((attr) => {
                info.push({
                    "region": region,
                    "attr": attr,
                    "value": outputData.get(region).get(attr),
                });
            });
        });

        const maxRegionValue = info
            .filter((x) => x["region"] !== "global")
            .map((x) => x["value"])
            .map((x) => Math.abs(x))
            .reduce((a, b) => a > b ? a : b, 1);

        const maxGlobalValue = info
            .filter((x) => x["region"] === "global")
            .map((x) => x["value"])
            .map((x) => Math.abs(x))
            .reduce((a, b) => a > b ? a : b, 1);

        const bubbleAreaScale = self._getD3().scaleLinear()
            .domain([0, maxRegionValue])
            .range([0, 800]);

        const rectWidthScale = self._getD3().scaleLinear()
            .domain([0, maxGlobalValue])
            .range([0, self._horizontalScale.step() / 2 - 7]);

        const indicies = new Map();
        ALL_REGIONS_SORTED.forEach((region) => {
            const regionInfo = info.filter((x) => x["region"] == region);
            regionInfo.sort((a, b) => b["value"] - a["value"]);

            const attrsSorted = regionInfo.map((x) => x["attr"]);

            const getter = (attr) => attrsSorted.indexOf(attr);

            indicies.set(region, {"get": getter});
        });
        indicies.set("header", {"get": (x) => -1});

        const lineLayer = self._d3Selection.select(".line-layer");
        const bubbleLayer = self._d3Selection.select(".bubble-layer");
        const labelLayer = self._d3Selection.select(".label-layer");

        const getTitle = () => {
            const stageString = STRINGS.get(selection.getDisplayStage());
            const typeString = STRINGS.get(selection.getDisplayType());
            const text = [
                stageString,
                "by Region in",
                selection.getYear() + " as",
                typeString,
            ].join(" ");
            return text;
        };

        const updateTitle = () => {
            const titleElement = self._targetDiv.querySelector(".title");
            const titleContent = getTitle();
            titleElement.textContent = titleContent;
            self._targetDiv.querySelector(".bubblegraph")
                .setAttribute("aria-label", titleContent);

            const topAriaLabelContent = [
                titleContent + ".",
                "Highlighted region: " + selection.getRegion() + ".",
                "Press c for China,",
                "e for EU 30,",
                "n for NAFTA,",
                "r for rest of world",
                "and g for global.",
                "Tab in for data.",
            ].join(" ");

            self._targetDiv.setAttribute("aria-label", topAriaLabelContent);
        };

        const updateMetricLabels = () => {
            const bound = labelLayer.selectAll(".metric-intro")
                .data(attrNames, (x) => x);

            bound.exit().remove();

            const newGroups = bound.enter()
                .append("g")
                .classed("metric-intro", true)
                .attr("transform", (datum) => {
                    const x = self._horizontalScale("header") + self._horizontalScale.step();
                    const y = verticalScale(datum) + verticalScale.step() / 2;
                    return "translate(" + x + " " + y + ")";
                });

            newGroups.append("text")
                .attr("x", -12)
                .attr("y", 0)
                .classed("label", true)
                .text((datum) => STRINGS.get(datum));

            newGroups.append("rect")
                .attr("x", -10)
                .attr("y", -5)
                .attr("width", 10)
                .attr("height", 10)
                .classed("color-box", true)
                .style("fill", (x) => colorScale.get(x));
        };

        const updateRegionLabels = () => {
            const bound = labelLayer.selectAll(".region-intro")
                .data(ALL_REGIONS_SORTED, (x) => x);

            bound.exit().remove();

            const newGroups = bound.enter()
                .append("g")
                .classed("region-intro", true)
                .attr("transform", (datum) => {
                    const x = self._horizontalScale(datum);
                    const y = 0;
                    return "translate(" + x + " " + y + ")";
                })
                .on("click", (event, datum) => self._onRegionChange(datum));

            newGroups.append("ellipse")
                .classed("radio", true)
                .attr("cx", self._horizontalScale.step() / 2)
                .attr("cy", 13)
                .attr("rx", 6)
                .attr("ry", 6);

            newGroups.append("rect")
                .classed("active-indicator", true)
                .attr("x", 5)
                .attr("y", 5)
                .attr("width", self._horizontalScale.step() - 10)
                .attr("height", self._svgHeight - 10);

            newGroups.append("text")
                .attr("x", self._horizontalScale.step() / 2)
                .attr("y", 30)
                .classed("label", true)
                .text((datum) => {
                    const rawText = STRINGS.get(datum);
                    if (rawText === "Rest of World" && smallDisplay) {
                        return "ROW";
                    } else {
                        return rawText;
                    }
                });

            const updatedBound = labelLayer.selectAll(".region-intro");
            updatedBound
                .classed("active", (datum) => datum === selection.getRegion())
                .classed("inactive", (datum) => datum !== selection.getRegion());
        };

        const updateLines = () => {
            const bound = lineLayer.selectAll(".line")
                .data(attrNames, (x) => x);

            bound.exit().remove();

            const horizOffset = self._horizontalScale.step() / 2;
            const horizOffsetFull = self._horizontalScale.step();
            const vertOffset = verticalIndexScale.step() / 2;

            const getX = (point) => {
                const region = point["region"];
                const isHeader = region === "header";
                const effectiveOffset = isHeader ? horizOffsetFull : horizOffset;
                return self._horizontalScale(region) + effectiveOffset;
            };

            const lineGenerator = self._getD3().line()
                .x(getX)
                .y((point) => {
                    const attr = point["attr"];
                    return verticalScale(attr) + vertOffset;
                });

            const lineGeneratorUpdate = self._getD3().line()
                .x(getX)
                .y((point) => {
                    const region = point["region"];
                    const attr = point["attr"];
                    if (region === "header") {
                        return verticalScale(attr) + vertOffset;
                    } else {
                        const index = indicies.get(region).get(attr);
                        return verticalIndexScale(index) + vertOffset;
                    }
                });

            const buildDGetter = (generator) => {
                return (attr) => {
                    const points = ["header"].concat(ALL_REGIONS_SORTED).map(
                        (region) => {
                            return {"region": region, "attr": attr};
                        },
                    );
                    return generator(points);
                };
            };

            const newGroups = bound.enter()
                .append("path")
                .classed("line", true)
                .attr("d", buildDGetter(lineGenerator))
                .attr("stroke", (attr) => colorScale.get(attr));

            const updatedBound = lineLayer.selectAll(".line");

            if (self._enableSlope) {
                updatedBound.transition()
                    .attr("d", buildDGetter(lineGeneratorUpdate));
            } else {
                updatedBound.transition()
                    .attr("d", buildDGetter(lineGenerator));
            }
        };

        const updateBubbles = () => {
            const horizOffset = self._horizontalScale.step() / 2;
            const vertOffset = verticalIndexScale.step() / 2;

            const getRadius = (datum) => {
                const value = Math.abs(datum["value"]);
                const area = bubbleAreaScale(value);
                return Math.sqrt(area);
            };

            const getWidth = (datum) => {
                const value = Math.abs(datum["value"]);
                return rectWidthScale(value);
            };

            const bound = bubbleLayer.selectAll(".bubble")
                .data(info, (x) => x["region"] + "\t" + x["attr"]);

            bound.exit().remove();

            const newGroups = bound.enter()
                .append("g")
                .classed("bubble", true)
                .attr("transform", (datum) => {
                    const region = datum["region"];
                    const attr = datum["attr"];
                    const x = self._horizontalScale(region) + horizOffset;
                    const y = verticalScale(attr) + vertOffset;
                    return "translate(" + x + " " + y + ")";
                });

            newGroups.append("ellipse")
                .attr("x", 0)
                .attr("y", 0)
                .attr("rx", 0)
                .attr("ry", 0)
                .attr("fill", (datum) => colorScale.get(datum["attr"]))
                .attr("stroke", (datum) => colorScale.get(datum["attr"]))
                .style("opacity", 0)
                .classed("positive-bubble", true);

            newGroups.append("rect")
                .attr("x", 0)
                .attr("y", 0)
                .attr("width", 0)
                .attr("height", 0)
                .attr("fill", (datum) => colorScale.get(datum["attr"]))
                .attr("stroke", (datum) => colorScale.get(datum["attr"]))
                .style("opacity", 0)
                .classed("negative-bubble", true);

            newGroups.append("rect")
                .attr("x", 0)
                .attr("y", -5)
                .attr("width", 0)
                .attr("height", 10)
                .attr("fill", (datum) => colorScale.get(datum["attr"]))
                .attr("stroke", (datum) => colorScale.get(datum["attr"]))
                .style("opacity", 0)
                .classed("bar-rect", true);

            newGroups.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", (datum) => {
                    if (datum["region"] === "global") {
                        return "#505050";
                    } else {
                        return textColorScale.get(datum["attr"]);
                    }
                });

            const updatedBound = bubbleLayer.selectAll(".bubble");

            updatedBound.select("text")
                .text((datum) => Math.round(datum["value"]))
                .transition()
                .attr("y", (datum) => {
                    if (datum["region"] === "global") {
                        return -12;
                    } else {
                        const radius = getRadius(datum);
                        return radius < 5 ? 13 : 0;
                    }
                })
                .attr("fill", (datum) => {
                    if (datum["region"] === "global") {
                        return "#505050";
                    } else {
                        const radius = getRadius(datum);
                        const defaultColor = textColorScale.get(datum["attr"]);
                        return radius < 5 ? "#333333" : defaultColor;
                    }
                })
                .style("text-anchor", (datum) => {
                    if (datum["region"] === "global" && !selection.getShowBauDelta()) {
                        return "start";
                    } else {
                        return "middle";
                    }
                });

            if (self._enableSlope) {
                updatedBound.transition()
                    .attr("transform", (datum) => {
                        const region = datum["region"];
                        const attr = datum["attr"];
                        const index = indicies.get(region).get(attr);
                        const x = self._horizontalScale(region) + horizOffset;
                        const y = verticalIndexScale(index) + vertOffset;
                        return "translate(" + x + " " + y + ")";
                    });
            } else {
                updatedBound.transition()
                    .attr("transform", (datum) => {
                        const region = datum["region"];
                        const attr = datum["attr"];
                        const x = self._horizontalScale(region) + horizOffset;
                        const y = verticalScale(attr) + vertOffset;
                        return "translate(" + x + " " + y + ")";
                    });
            }

            updatedBound.select(".positive-bubble")
                .transition()
                .attr("rx", getRadius)
                .attr("ry", getRadius)
                .style("opacity", (x) => {
                    if (x["region"] === "global") {
                        return 0;
                    } else if (x["value"] >= 0) {
                        return 1;
                    } else {
                        return 0;
                    }
                });

            updatedBound.select(".negative-bubble")
                .transition()
                .attr("width", (x) => getRadius(x) * 2)
                .attr("height", (x) => getRadius(x) * 2)
                .attr("x", (x) => -1 * getRadius(x))
                .attr("y", (x) => -1 * getRadius(x))
                .style("opacity", (x) => {
                    if (x["region"] === "global") {
                        return 0;
                    } else if (x["value"] >= 0) {
                        return 0;
                    } else {
                        return 1;
                    }
                });

            updatedBound.select(".bar-rect")
                .transition()
                .attr("width", getWidth)
                .attr("x", (x) => {
                    if (x["value"] >= 0) {
                        return 0;
                    } else {
                        return -1 * getWidth(x);
                    }
                })
                .style("opacity", (x) => x["region"] === "global" ? 1 : 0);
        };

        const updateDescription = () => {
            const title = getTitle();

            const showingDelta = document.getElementById("show-delta").checked;
            const deltaStr = "Displaying changes or deltas due to interventions.";
            const regStr = "Displaying values after applying policies.";
            const modeStr = showingDelta ? deltaStr : regStr;

            // Determine units
            const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
            const unitsStr = isPercent ? "%" : "MMT";

            const attrDescriptions = self._attrNames.get(displayStage).map((attr) => {
                const value = outputData.get(selection.getRegion()).get(attr);
                const valueRounded = Math.round(value * 10) / 10 + " " + unitsStr;
                return valueRounded + " for " + STRINGS.get(attr);
            });

            const message = [
                "Bubble chart titled",
                getTitle() + ".",
                modeStr,
                "Having selected",
                selection.getYear() + ",",
                "it reports the following:",
                attrDescriptions.join(", "),
            ].join(" ");

            self._message = message;

            if (self._tippyPrior === null) {
                // eslint-disable-next-line no-undef
                self._tippyPrior = tippy(
                    "#detailed-bubble-description-dynamic",
                    {"content": self._message},
                );
            } else {
                self._tippyPrior.forEach((x) => x.setContent(self._message));
            }
        };

        updateTitle();
        updateMetricLabels();
        updateRegionLabels();
        updateLines();
        updateBubbles();
        updateDescription();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {BubblegraphPresenter};
