import {
    COLORS,
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    HISTORY_START_YEAR,
    MAX_YEAR,
    PRODUCTION_ATTRS,
    STANDARD_ATTR_NAMES,
    START_YEAR,
} from "const";
import {STRINGS} from "strings";


class TimeseriesPresenter {
    constructor(targetDiv, onYearChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._requestRender = requestRender;

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
    }

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

        // Make updates
        const updateTitle = () => {
            const title = self._targetDiv.querySelector(".title");
            const text = [
                STRINGS.get(selection.getRegion()),
                "Annual",
                STRINGS.get(selection.getDisplayStage()),
                "in",
                STRINGS.get(selection.getDisplayType()),
            ].join(" ");
            title.innerHTML = text;
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

                newGroup.append("rect")
                    .attr("width", 1)
                    .attr("y", 25)
                    .attr("height", height - 25 - 30)
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

        const updateBars = () => {
            const data = years.flatMap(buildDataForYear);

            const bound = barLayer.selectAll(".bar")
                .data(data, (datum) => datum["year"] + "/" + datum["attr"]);

            bound.exit().remove();

            bound.enter().append("rect")
                .classed("bar", true)
                .attr("x", (datum) => horizontalScale(datum["year"]))
                .attr("y", verticalScale(0))
                .attr("width", horizontalScale.bandwidth())
                .attr("height", 1)
                .style("fill", (datum) => colorScale.get(datum["attr"]));

            const boundUpdated = barLayer.selectAll(".bar");

            boundUpdated.transition()
                .attr("x", (datum) => horizontalScale(datum["year"]))
                .attr("y", (datum) => verticalScale(datum["end"]))
                .attr("width", horizontalScale.bandwidth())
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

            const boundUpdated = listenerLayer.selectAll(".click-target");
            boundUpdated.attr("x", (year) => horizontalScale(year) - 1)
                .attr("y", 25)
                .attr("width", horizontalScale.bandwidth() + 2)
                .attr("height", height - 25 - 30);
        };

        updateTitle();
        updateValueAxis();
        updateYearAxis();
        updateYearIndicator();
        updateBars();
        updateListeners();
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}

export {TimeseriesPresenter};
