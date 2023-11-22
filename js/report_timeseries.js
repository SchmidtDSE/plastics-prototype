/**
 * Logic for the large timeseries in the detailed tab.
 *
 * @license BSD, see LICENSE.md
 */

import {
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    HISTORY_START_YEAR,
    MAX_YEAR,
    PRODUCTION_ATTRS,
    STANDARD_ATTR_NAMES,
    START_YEAR,
    getGlobalColors,
} from "const";
import {STRINGS} from "strings";


/**
 * Presenter to run the large timeseries plot in the details tab.
 */
class TimeseriesPresenter {
    /**
     * Create a new presenter to manage the large timeseries plot in the details tab.
     *
     * @param targetDiv The div where the visualization is rendered.
     * @param onYearChange Callback to invoke if the user changes the selected year.
     * @param requestRender Callback to invoke if the whole visualization needs redraw.
     */
    constructor(targetDiv, onYearChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._requestRender = requestRender;
        self._tippyPrior = null;
        self._lastYear = null;
        self._message = "Loading...";

        self._targetSvg = self._targetDiv.querySelector(".timeseries");
        self._d3Selection = self._getD3().select("#" + self._targetSvg.id);
        self._d3Selection.html("");
        self._d3Selection.append("g").attr("id", "axis-layer");
        self._d3Selection.append("g").attr("id", "indicator-layer");
        self._d3Selection.append("g").attr("id", "bar-layer");
        self._d3Selection.append("g").attr("id", "listener-layer");

        // Listen for historical change
        const historyCheck = self._targetDiv.querySelector(".history-check");
        historyCheck.addEventListener("change", () => {
            self._requestRender();
        });

        // Attrs
        self._attrNames = STANDARD_ATTR_NAMES;

        // Color scales
        const colorScalesEol = new Map();
        const globalColors = getGlobalColors();
        EOL_ATTRS.forEach((attr, i) => {
            const color = globalColors[i];
            colorScalesEol.set(attr, color);
        });

        const colorScalesConsumption = new Map();
        CONSUMPTION_ATTRS.forEach((attr, i) => {
            const color = globalColors[i];
            colorScalesConsumption.set(attr, color);
        });

        const colorScalesProduction = new Map();
        PRODUCTION_ATTRS.forEach((attr, i) => {
            const color = globalColors[i];
            colorScalesProduction.set(attr, color);
        });

        self._colorScales = new Map();
        self._colorScales.set(DISPLAY_STAGES.eol, colorScalesEol);
        self._colorScales.set(DISPLAY_STAGES.consumption, colorScalesConsumption);
        self._colorScales.set(DISPLAY_STAGES.production, colorScalesProduction);

        // Accessible change year
        self._targetDiv.addEventListener("keydown", (event) => {
            if (self._lastYear === null) {
                return;
            }

            if (event.key === "ArrowRight") {
                self._onYearChange(self._lastYear + 1);
            } else if (event.key === "ArrowLeft") {
                self._onYearChange(self._lastYear - 1);
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
     * Update the display.
     *
     * @param stateSet The set of state Maps having gone through the policy simulation.
     * @param selection Structure describing the selections made by the user like year and region.
     */
    update(stateSet, selection) {
        const self = this;

        const states = stateSet.getAllWithInterventions();

        const attrNames = self._attrNames.get(selection.getDisplayStage());
        const region = selection.getRegion();
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const historicalCheck = self._targetDiv.querySelector(".history-check");
        const showHistorical = historicalCheck.checked;
        const selectedYear = selection.getYear();
        const colorScale = self._colorScales.get(selection.getDisplayStage());

        self._lastYear = selectedYear;

        const determineStep = () => {
            if (selection.getDisplayType() == DISPLAY_TYPES.percent) {
                return 20;
            } else if (selection.getDisplayType() == DISPLAY_TYPES.amount) {
                return 50;
            } else {
                return 2000;
            }
        };

        // Determine units
        const unitsStr = isPercent ? "%" : "MMT";

        // Get layers
        const axisLayer = self._d3Selection.select("#axis-layer");
        const indicatorLayer = self._d3Selection.select("#indicator-layer");
        const barLayer = self._d3Selection.select("#bar-layer");
        const listenerLayer = self._d3Selection.select("#listener-layer");

        // Make vertical scale
        const verticalStep = determineStep();
        const height = self._targetSvg.getBoundingClientRect().height;
        const yearValues = Array.from(states.values()).map((state) => {
            const out = state.get("out").get(region);

            const totalPositive = attrNames.map((attr) => out.get(attr))
                .filter((x) => x > 0)
                .reduce((a, b) => a + b, 0);

            const totalNegative = attrNames.map((attr) => out.get(attr))
                .filter((x) => x < 0)
                .map((x) => Math.abs(x))
                .reduce((a, b) => a + b, 0);

            return Math.max(totalPositive, totalNegative);
        });
        const maxSumValueNativeFloat = yearValues.reduce((a, b) => a > b ? a : b);
        const maxSumValueNative = Math.round(maxSumValueNativeFloat);
        const maxSumValue = Math.ceil(maxSumValueNative / verticalStep) * verticalStep;
        const minSumValue = selection.getShowBauDelta() ? -maxSumValue : 0;

        const verticalScale = self._getD3().scaleLinear()
            .domain([minSumValue, maxSumValue])
            .range([height - 30, 30]);

        // Make horizontal scale
        const width = self._targetSvg.getBoundingClientRect().width;
        const narrowWindow = width < 500 && showHistorical;
        const minYear = showHistorical ? HISTORY_START_YEAR : Math.min(START_YEAR, selectedYear);
        const years = [];
        for (let year = minYear; year <= MAX_YEAR; year++) {
            years.push(year);
        }
        const horizontalScale = self._getD3().scaleBand()
            .domain(years)
            .range([67, width - 15])
            .paddingInner(0.1);

        const getTitle = () => {
            return [
                STRINGS.get(selection.getRegion()),
                "Annual",
                STRINGS.get(selection.getDisplayStage()),
                "in",
                STRINGS.get(selection.getDisplayType()),
            ].join(" ");
        };

        // Make updates
        const updateTitle = () => {
            const title = self._targetDiv.querySelector(".title");
            const text = getTitle();
            title.innerHTML = text;

            self._d3Selection.attr("aria-label", "Graph of: " + text);
        };

        const updateValueAxis = () => {
            const ticks = [];
            for (let i = minSumValue; i <= maxSumValue; i += verticalStep) {
                ticks.push(i);
            }

            const bound = axisLayer.selectAll(".value-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("value-tick", true)
                .attr("x", 50)
                .attr("y", 0)
                .html((amount) => amount + " " + unitsStr);

            const boundUpdated = axisLayer.selectAll(".value-tick");

            boundUpdated
                .attr("y", (amount) => verticalScale(amount))
                .attr("x", maxSumValue > 10000 ? 64 : 55);
        };

        const updateYearAxis = () => {
            const ticks = [];
            const increment = narrowWindow ? 10 : 5;
            for (let year = minYear; year <= MAX_YEAR; year += increment) {
                ticks.push(year);
            }

            const bound = axisLayer.selectAll(".year-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("year-tick", true)
                .attr("x", (x) => horizontalScale(x) + horizontalScale.step() / 2)
                .attr("y", height - 20)
                .html((x) => x);

            const boundUpdated = axisLayer.selectAll(".year-tick");

            boundUpdated.attr("x", (x) => horizontalScale(x) + horizontalScale.step() / 2);
        };

        const updateYearIndicator = () => {
            if (indicatorLayer.select(".year-indicator").empty()) {
                const newGroup = indicatorLayer.append("g")
                    .classed("year-indicator", true)
                    .attr("transform", "translate(50 0)");

                const effectiveHeight = height - 25 - 30;
                newGroup.append("rect")
                    .attr("width", 1)
                    .attr("y", 25)
                    .attr("height", effectiveHeight < 0 ? 0 : effectiveHeight)
                    .attr("x", 0);

                newGroup.append("text")
                    .attr("x", 0)
                    .attr("y", 20)
                    .html(selectedYear)
                    .classed("year-indicator-label", true);
            }

            const newX = horizontalScale(selectedYear) + horizontalScale.step() / 2;
            const yearIndicator = indicatorLayer.select(".year-indicator");
            yearIndicator.transition().attr(
                "transform",
                "translate(" + newX + " 0)",
            );

            yearIndicator.select(".year-indicator-label")
                .html(selectedYear);
        };

        const buildDataForYear = (year) => {
            let lastValue = 0;

            const values = states.get(year).get("out").get(region);

            const positiveData = Array.from(attrNames)
                .reverse()
                .filter((attr) => values.get(attr) >= 0)
                .map((attr) => {
                    const nextValue = values.get(attr);
                    const nextEnd = lastValue + nextValue;
                    const datum = {
                        "attr": attr,
                        "year": year,
                        "start": lastValue,
                        "end": nextEnd,
                        "value": nextValue,
                    };
                    lastValue = nextEnd;
                    return datum;
                });

            lastValue = 0;

            const negativeData = Array.from(attrNames)
                .reverse()
                .filter((attr) => values.get(attr) < 0)
                .map((attr) => {
                    const nextValue = values.get(attr);
                    const nextEnd = lastValue + nextValue;
                    const datum = {
                        "attr": attr,
                        "year": year,
                        "start": nextEnd,
                        "end": lastValue,
                    };
                    lastValue = nextEnd;
                    return datum;
                });

            return positiveData.concat(negativeData);
        };

        const updateBars = (flatData) => {
            const bound = barLayer.selectAll(".bar")
                .data(flatData, (datum) => datum["year"] + "/" + datum["attr"]);

            bound.exit().remove();

            const originalWidth = horizontalScale.bandwidth();
            bound.enter().append("rect")
                .classed("bar", true)
                .attr("x", (datum) => horizontalScale(datum["year"]))
                .attr("y", verticalScale(0))
                .attr("width", originalWidth < 0 ? 0 : originalWidth)
                .attr("height", 1)
                .style("fill", (datum) => colorScale.get(datum["attr"]));

            const boundUpdated = barLayer.selectAll(".bar");

            const newWidth = horizontalScale.bandwidth();
            boundUpdated.transition()
                .attr("x", (datum) => horizontalScale(datum["year"]))
                .attr("y", (datum) => verticalScale(datum["end"]))
                .attr("width", newWidth < 0 ? 0 : newWidth)
                .attr("height", (datum) => {
                    const end = verticalScale(datum["end"]);
                    const start = verticalScale(datum["start"]);
                    const height = start - end - 2;
                    const heightAllowed = Math.max(0, height);
                    return heightAllowed;
                });
        };

        const updateListeners = () => {
            const bound = listenerLayer.selectAll(".click-target")
                .data(years, (x) => x);

            bound.exit().remove();

            bound.enter().append("rect")
                .classed("click-target", true)
                .on("click", (event, year) => {
                    self._onYearChange(year);
                });

            const effectiveWidth = horizontalScale.bandwidth() + 2;
            const effectiveHeight = height - 25 - 30;
            const boundUpdated = listenerLayer.selectAll(".click-target");
            boundUpdated.attr("x", (year) => horizontalScale(year) - 1)
                .attr("y", 25)
                .attr("width", effectiveWidth < 0 ? 0 : effectiveWidth)
                .attr("height", effectiveHeight < 0 ? 0 : effectiveHeight);
        };

        const updateDescription = () => {
            const title = getTitle();

            const values = states.get(selectedYear).get("out").get(region);

            const attrDescriptions = attrNames.map((attr) => {
                const value = Math.round(values.get(attr) / 10) * 10;
                const valueStr = value + " " + unitsStr;
                return valueStr + " for " + STRINGS.get(attr);
            }).join(", ") + ".";

            const showingDelta = document.getElementById("show-delta").checked;
            const deltaStr = "Displaying changes or deltas due to interventions.";
            const regStr = "Displaying values after applying policies.";
            const modeStr = showingDelta ? deltaStr : regStr;

            const message = [
                "Timeseries chart titled",
                getTitle() + ".",
                modeStr,
                "Having selected",
                selectedYear + ",",
                "it reports the following as stacked bars from top to bottom:",
                attrDescriptions,
            ].join(" ");

            self._message = message;

            if (self._tippyPrior === null) {
                // eslint-disable-next-line no-undef
                self._tippyPrior = tippy(
                    "#detailed-timeseries-description-dynamic",
                    {"content": self._message},
                );
            } else {
                self._tippyPrior.forEach((x) => x.setContent(self._message));
            }

            const ariaLabelContent = [
                getTitle() + ".",
                "Highlighted year: " + selectedYear + ".",
                "Use arrow keys to change year.",
                "Tab in for data.",
            ].join(" ");

            self._targetDiv.setAttribute("aria-label", ariaLabelContent);
        };

        const flatData = years.flatMap(buildDataForYear);

        // Don't let the UI loop get overwhelmed.
        const preferTables = document.getElementById("show-table-radio").checked;
        const vizDelay = preferTables ? 1000 : 1;
        setTimeout(() => {
            updateTitle();
            updateValueAxis();
            updateYearAxis();
            updateYearIndicator();
            updateBars(flatData);
            updateListeners();
            updateDescription();
        }, vizDelay);

        const tableDelay = preferTables ? 1 : 1000;
        setTimeout(() => {
            self._updateTable(flatData);
        }, tableDelay);
    }

    _updateTable(flatData) {
        const self = this;

        const attrsSet = new Set(flatData.map((x) => x["attr"]));
        const attrs = Array.from(attrsSet);
        attrs.sort();

        const yearsSet = new Set(flatData.map((x) => x["year"]));
        const years = Array.from(yearsSet);
        years.sort();

        const indexed = new Map();
        flatData.forEach((elem) => {
            indexed.set(elem["attr"] + " " + elem["year"], elem["value"]);
        });

        const parentSelection = self._getD3().select(self._targetDiv);

        parentSelection.select(".table-option").html("");

        const table = parentSelection.select(".table-option")
            .append("table")
            .classed("access-table", true)
            .style("opacity", 0);

        const headerRow = table.append("tr");
        const units = "MMT";
        headerRow.append("th").html("Year");
        attrs.forEach((attr) => {
            const attrStr = STRINGS.get(attr);
            headerRow.append("th").html(attrStr + " " + units);
        });

        const newRows = table.selectAll(".row").data(years).enter().append("tr");
        newRows.append("td").html((year) => year);
        attrs.forEach((attr) => {
            newRows.append("td").html((year) => {
                const value = indexed.get(attr + " " + year);
                return Math.round(value);
            });
        });

        table.transition().style("opacity", 1);
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}

export {TimeseriesPresenter};
