/**
 * Logic for the timeseries chart on the overview tab.
 *
 * @license BSD, see LICENSE.md
 */

import {
    HISTORY_START_YEAR,
    MAX_YEAR,
    GOALS,
} from "const";
import {STRINGS} from "strings";


/**
 * Presenter for the timeseries chart displayed on the overview tab.
 */
class TimeDeltaPresenter {
    /**
     * Start running a new presenter for the overview timeseries chart.
     *
     * @param targetDiv The div in which the chart is rendered.
     * @param attrName The name of the metric (goal metric) to be displayed. See GOALS.
     * @param metricName Name of metric treatment like cumulative.
     * @param onYearChange Callback to invoke if the user changes the selected year.
     */
    constructor(targetDiv, attrName, metricName, onYearChange) {
        const self = this;

        self._attrName = attrName;
        self._metricName = metricName;
        self._color = "#1f78b4";
        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._lastYear = null;
        self._d3Selection = self._getD3().select("#" + targetDiv.id);
        self._tippyPrior = null;
        self._message = "Loading...";

        self._initElements();
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
     * Change the attribute being shown to the user.
     *
     * @param newAttr THe name fo the new attribute like GOALS.mismanagedWaste.
     */
    setAttr(newAttr) {
        const self = this;
        self._attrName = newAttr;
    }

    /**
     * Change the metric treatment being used.
     *
     * @param newMetric The new metric treatment like cumulative.
     */
    setMetric(newMetric) {
        const self = this;
        self._metricName = newMetric;
    }

    /**
     * Re-render this component.
     *
     * @param businessAsUsuals The business as usual projections.
     * @param withInterventions The projections having applied the intervention scenario.
     * @param selectedYear The year highlighted by the user.
     * @param sparseTicks Flag indicating if the axis ticks should be spread out.
     */
    render(businessAsUsuals, withInterventions, selectedYear, sparseTicks) {
        const self = this;

        self._lastYear = selectedYear;

        const step = sparseTicks ? 1000 : 50;

        const boundingBox = self._targetDiv.querySelector(".body")
            .getBoundingClientRect();

        const totalWidth = boundingBox.width;
        const totalHeight = boundingBox.height;

        const narrowWindow = totalWidth < 500;

        const startYear = HISTORY_START_YEAR;
        const endYear = MAX_YEAR;
        const region = "global";

        const unitOptions = new Map();
        unitOptions.set(
            GOALS.productionEmissions,
            {"short": "LB", "long": "Pounds"},
        );
        unitOptions.set(
            GOALS.consumptionEmissions,
            {"short": "LB", "long": "Pounds"},
        );
        unitOptions.set(
            GOALS.landfillWaste,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.mismanagedWaste,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.incineratedWaste,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.recycling,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.totalWaste,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.totalConsumption,
            {"short": "MMT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.ghg,
            {"short": "GMT", "long": "Megatons CO2 Equivalent"},
        );
        const unitsInfo = unitOptions.get(self._attrName);
        const unitsLong = unitsInfo["long"];
        const units = unitsInfo["short"];

        const getSummary = (target, reducer) => {
            return Array.from(target.values())
                .map((state) => state.get(region).get(self._attrName))
                .reduce(reducer, 0);
        };

        const getMax = (target) => getSummary(target, (a, b) => a > b ? a : b);
        const getMin = (target) => getSummary(target, (a, b) => a < b ? a : b);

        const maxValueNative = Math.max(
            getMax(businessAsUsuals),
            getMax(withInterventions),
        );
        const maxValue = Math.ceil(maxValueNative / step) * step;

        const minValueNative = Math.min(
            getMin(businessAsUsuals),
            getMin(withInterventions),
        );
        const minValueRounded = Math.ceil(Math.abs(minValueNative) / step) * step;
        const hasNegtive = minValueNative < 0;
        const minValue = hasNegtive ? -1 * minValueRounded : 0;

        const horizontalScale = self._getD3().scaleLinear()
            .domain([startYear, endYear])
            .range([85, totalWidth - 90]);

        const verticalScale = self._getD3().scaleLinear()
            .domain([minValue, maxValue])
            .range([totalHeight - 25, 20]);

        const pathGenerator = self._getD3().line()
            .x((x) => horizontalScale(x["year"]))
            .y((x) => verticalScale(x["value"]));

        const getData = (target) => {
            return Array.of(...target.entries())
                .map((raw) => {
                    return {
                        "year": raw[0],
                        "value": raw[1].get(region).get(self._attrName),
                    };
                })
                .filter((datum) => datum["year"] >= startYear)
                .filter((datum) => datum["year"] <= endYear);
        };

        const updateValueAxis = () => {
            const ticks = [];
            for (let i = minValue; i <= maxValue; i += step) {
                ticks.push(i);
            }

            const bound = self._d3Selection.select(".value-labels").selectAll(".value-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("value-tick", true)
                .classed("value-label", true)
                .classed("timedelta-label", true)
                .attr("y", 0)
                .html((amount) => amount);

            const boundUpdated = self._d3Selection.select(".value-labels").selectAll(".value-tick");

            boundUpdated.html((x) => x + " " + units);

            boundUpdated.transition()
                .attr("opacity", (x) => {
                    if (maxValue > 500) {
                        return x % 200 == 0 ? 1 : 0;
                    } else {
                        return 1;
                    }
                })
                .attr("y", (amount) => verticalScale(amount) + 5)
                .attr("x", (x) => {
                    if (maxValue > 500) {
                        return 70;
                    } else {
                        return sparseTicks ? 65 : 55;
                    }
                });
        };

        const updateYearAxis = () => {
            const ticks = [];
            const increment = narrowWindow ? 10 : 5;
            for (let year = startYear; year <= endYear; year += increment) {
                ticks.push(year);
            }

            const bound = self._d3Selection.select(".year-labels")
                .selectAll(".year-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("year-tick", true)
                .classed("year-label", true)
                .classed("timedelta-label", true)
                .attr("x", (x) => horizontalScale(x))
                .attr("y", totalHeight - 10)
                .html((x) => x);

            const boundUpdated = self._d3Selection.select(".year-labels")
                .selectAll(".year-tick");

            boundUpdated.attr("x", (x) => horizontalScale(x));
        };

        const updateIndicator = () => {
            const newX = horizontalScale(selectedYear);

            self._d3Selection.select(".year-indicator-group")
                .transition()
                .duration(750)
                .attr("transform", "translate(" + newX + " 16)");

            self._d3Selection.select(".selected-year-label")
                .html(selectedYear);

            const bauValue = businessAsUsuals.get(selectedYear)
                .get(region)
                .get(self._attrName);

            const bauY = verticalScale(bauValue) - 16;
            self._d3Selection.select(".current-bau-value-indicator")
                .transition()
                .duration(750)
                .attr("cy", bauY);

            const interventionValue = withInterventions.get(selectedYear)
                .get(region)
                .get(self._attrName);

            const interventionY = verticalScale(interventionValue) - 16;
            const distance = Math.abs(bauY - interventionY);
            self._d3Selection.select(".current-intervention-value-indicator")
                .transition()
                .duration(750)
                .attr("cy", interventionY);

            const interventionValueDisplay = self._d3Selection.select(
                ".current-intervention-value-display",
            );

            interventionValueDisplay.transition()
                .duration(750)
                .attr("transform", "translate(8 " + (interventionY - 15) + ")")
                .style("opacity", distance < 1 ? 0 : 1);

            interventionValueDisplay.select(".value")
                .html(Math.round(interventionValue) + " " + units);

            const bauValueDisplay = self._d3Selection.select(".current-bau-value-display");
            bauValueDisplay.transition()
                .duration(750)
                .attr("transform", "translate(8 " + (bauY - 15) + ")")
                .style("opacity", distance < 1 ? 0 : 1);

            bauValueDisplay.select(".value").html(Math.round(bauValue) + " " + units);

            if (distance > 0) {
                self._d3Selection.select(".legend").style("display", "block");
            }

            self._d3Selection.select(".legend")
                .transition()
                .duration(750)
                .style("opacity", distance > 0 ? 1 : 0);
        };

        const updateLines = () => {
            const bauData = getData(businessAsUsuals);
            const projectionData = getData(withInterventions);

            self._d3Selection.select(".bau-glyph")
                .transition()
                .duration(750)
                .attr("d", pathGenerator(bauData));

            self._d3Selection.select(".projection-glyph")
                .transition()
                .duration(750)
                .attr("d", pathGenerator(projectionData));
        };

        const updateHoverTargets = () => {
            const yearWidth = horizontalScale(2050) - horizontalScale(2049) - 2;
            const effectiveHeight = totalHeight - 20 - 16;
            const years = [];
            for (let year = startYear; year <= endYear; year++) {
                years.push(year);
            }

            self._d3Selection.select(".timedelta-hover-targets")
                .html("");

            self._d3Selection.select(".timedelta-hover-targets")
                .selectAll(".timedelta-hover-target")
                .data(years)
                .enter()
                .append("rect")
                .classed("timedelta-hover-target", true)
                .attr("x", (year) => horizontalScale(year) - yearWidth / 2)
                .attr("width", yearWidth < 0 ? 0 : yearWidth)
                .attr("y", 16)
                .attr("height", effectiveHeight < 0 ? 0 : effectiveHeight)
                .on("click", (event, year) => self._onYearChange(year));
        };

        const getTitle = () => {
            return [
                "Global",
                self._metricName === "cumulative" ? "Cumulative" : "Annual Rate of",
                STRINGS.get(self._attrName),
                "as",
                unitsLong,
            ].join(" ");
        };

        const updateTitle = () => {
            const newTitle = getTitle();
            self._targetDiv.querySelector(".title").innerHTML = newTitle;
            self._d3Selection.select(".body")
                .attr("aria-label", "Graph of: " + newTitle);

            const ariaLabelContent = [
                newTitle + ".",
                "Highlighted year: " + selectedYear + ".",
                "Tab in for data.",
            ].join(" ");

            self._targetDiv.setAttribute("aria-label", ariaLabelContent);
        };

        const updateAxisRect = () => {
            const effectiveWidth = totalWidth - 91 - 71;
            self._d3Selection.select(".zero-line")
                .transition()
                .duration(750)
                .attr("opacity", hasNegtive ? 1 : 0)
                .attr("width", effectiveWidth < 0 ? 0 : effectiveWidth)
                .attr("y", verticalScale(0));
        };

        const updateDescription = () => {
            const getValueText = (target) => {
                const value = target.get(selectedYear)
                    .get(region)
                    .get(self._attrName);
                return Math.round(value * 10) / 10 + " MMT";
            };

            const message = [
                "Timeseries chart titled",
                getTitle() + ".",
                "It shows",
                getValueText(businessAsUsuals),
                "in business as usual and",
                getValueText(withInterventions),
                "in selected policy scenario",
                "for",
                selectedYear + ".",
            ].join(" ");

            self._message = message;

            if (self._tippyPrior === null) {
                // eslint-disable-next-line no-undef
                self._tippyPrior = tippy(
                    "#overview-timeseries-description-dynamic",
                    {"content": self._message},
                );
            } else {
                self._tippyPrior.forEach((x) => x.setContent(self._message));
            }
        };

        // Don't let the UI loop get overwhelmed.
        const preferTables = document.getElementById("show-table-radio").checked;
        const vizDelay = preferTables ? 1000 : 1;
        setTimeout(() => {
            updateValueAxis();
            updateYearAxis();
            updateAxisRect();
            updateIndicator();
            updateLines();
            updateHoverTargets();
            updateTitle();
            updateDescription();
        }, vizDelay);

        const tableDelay = preferTables ? 1 : 1000;
        setTimeout(() => {
            const bauData = getData(businessAsUsuals);
            const projectionData = getData(withInterventions);
            self._updateTable(bauData, projectionData);
        }, tableDelay);
    }

    _initElements() {
        const self = this;

        self._d3Selection.select(".legend").style("display", "none");

        const targetSvg = self._d3Selection.select(".body");
        targetSvg.html("");

        const boundingBox = self._targetDiv.querySelector(".body")
            .getBoundingClientRect();
        const totalWidth = boundingBox.width;
        const totalHeight = boundingBox.height;

        const effectiveWidth = totalWidth - 91 - 71;
        targetSvg.append("rect")
            .classed("zero-line", true)
            .attr("x", 71)
            .attr("y", totalHeight)
            .attr("width", effectiveWidth < 0 ? 0 : effectiveWidth)
            .attr("height", 1)
            .attr("fill", "#E0E0E0")
            .attr("opacity", 0);

        targetSvg.append("g").classed("year-labels", true);
        targetSvg.append("g").classed("value-labels", true);

        targetSvg.append("path")
            .classed("timedelta-glyph", true)
            .classed("bau-glyph", true)
            .style("stroke", self._color);

        targetSvg.append("path")
            .classed("timedelta-glyph", true)
            .classed("projection-glyph", true)
            .style("stroke", self._color);

        const yearIndicatorGroup = targetSvg.append("g")
            .attr("transform", "translate(70 16)")
            .classed("year-indicator-group", true);

        yearIndicatorGroup.append("text")
            .attr("x", 0)
            .attr("y", -2)
            .classed("selected-year-label", true)
            .classed("year-label", true)
            .classed("timedelta-label", true);

        const effectiveHeight = totalHeight - 20 - 16;
        yearIndicatorGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1)
            .attr("height", effectiveHeight < 0 ? 0 : effectiveHeight)
            .classed("timedelta-year-indicator", true);

        const currentBauValueDisplay = yearIndicatorGroup.append("g")
            .attr("transform", "translate(8, 0)")
            .classed("current-value-display", true)
            .classed("current-bau-value-display", true);

        currentBauValueDisplay.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 77)
            .attr("height", 30)
            .classed("background-panel", true);

        currentBauValueDisplay.append("text")
            .attr("x", 1)
            .attr("y", 11)
            .html("Business as Usual")
            .classed("label", true);

        currentBauValueDisplay.append("text")
            .attr("x", 1)
            .attr("y", 26)
            .classed("value", true);

        yearIndicatorGroup.append("ellipse")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("rx", 7)
            .attr("ry", 7)
            .attr("fill", self._color)
            .classed("current-value-indicator", true)
            .classed("current-bau-value-indicator", true);

        const currentInterventionValueDisplay = yearIndicatorGroup.append("g")
            .attr("transform", "translate(8, 0)")
            .classed("current-value-display", true)
            .classed("current-intervention-value-display", true);

        currentInterventionValueDisplay.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 77)
            .attr("height", 30)
            .classed("background-panel", true);

        currentInterventionValueDisplay.append("text")
            .attr("x", 1)
            .attr("y", 11)
            .html("With Policies")
            .classed("label", true);

        currentInterventionValueDisplay.append("text")
            .attr("x", 1)
            .attr("y", 26)
            .classed("value", true);

        yearIndicatorGroup.append("ellipse")
            .attr("cx", 0)
            .attr("cy", 0)
            .attr("rx", 7)
            .attr("ry", 7)
            .attr("fill", self._color)
            .classed("current-value-indicator", true)
            .classed("current-intervention-value-indicator", true);

        targetSvg.append("g")
            .classed("timedelta-hover-targets", true);
    }

    _getShowHistory() {
        const self = this;

        // Should move this out at some point.
        const historicalCheck = document.getElementById("history-check");
        return historicalCheck.checked;
    }

    _updateTable(bauData, projectionData) {
        const self = this;

        const getByYear = (target) => {
            const retMap = new Map();
            target.forEach((record) => {
                retMap.set(record["year"], record["value"]);
            });
            return retMap;
        };

        const bauDataIndexed = getByYear(bauData);
        const projectionDataIndexed = getByYear(projectionData);

        self._d3Selection.select(".table-option").html("");

        const table = self._d3Selection.select(".table-option")
            .append("table")
            .classed("access-table", true)
            .style("opacity", 0);

        const headerRow = table.append("tr");
        const units = "MMT";
        headerRow.append("th").html("Year");
        headerRow.append("th").html("Business as Usual (" + units + ")");
        headerRow.append("th").html("With Policies (" + units + ")");

        const startYear = HISTORY_START_YEAR;
        const endYear = MAX_YEAR;
        const years = [];
        for (let year = startYear; year <= endYear; year++) {
            years.push(year);
        }
        const newRows = table.selectAll(".row").data(years).enter().append("tr");

        const region = "global";
        newRows.append("td").html((year) => year);
        newRows.append("td").html((year) => {
            const valueRaw = bauDataIndexed.get(year);
            const valueRounded = Math.round(valueRaw);
            return valueRounded;
        });
        newRows.append("td").html((year) => {
            const valueRaw = projectionDataIndexed.get(year);
            const valueRounded = Math.round(valueRaw);
            return valueRounded;
        });

        table.transition().style("opacity", 1);
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {TimeDeltaPresenter};
