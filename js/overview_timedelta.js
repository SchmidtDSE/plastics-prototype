import {
    HISTORY_START_YEAR,
    MAX_YEAR,
    GOALS,
} from "const";
import {STRINGS} from "strings";


class TimeDeltaPresenter {
    constructor(targetDiv, attrName, onYearChange) {
        const self = this;

        self._attrName = attrName;
        self._color = "#1f78b4";
        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._d3Selection = self._getD3().select("#" + targetDiv.id);

        self._initElements();
    }

    setAttr(newAttr) {
        const self = this;
        self._attrName = newAttr;
    }

    render(businessAsUsuals, withInterventions, selectedYear, sparseTicks) {
        const self = this;

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
            {"short": "MT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.mismanagedWaste,
            {"short": "MT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.incineratedWaste,
            {"short": "MT", "long": "Million Metric Tons"},
        );
        unitOptions.set(
            GOALS.totalConsumption,
            {"short": "MT", "long": "Million Metric Tons"},
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
            .range([70, totalWidth - 90]);

        const verticalScale = self._getD3().scaleLinear()
            .domain([minValue, maxValue])
            .range([totalHeight - 20, 20]);

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

            boundUpdated
                .attr("y", (amount) => verticalScale(amount) + 5)
                .html((x) => x + " " + units)
                .attr("x", sparseTicks ? 60 : 50);
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
                .attr("transform", "translate(" + newX + " 16)");

            self._d3Selection.select(".selected-year-label")
                .html(selectedYear);

            const bauValue = businessAsUsuals.get(selectedYear)
                .get(region)
                .get(self._attrName);

            const bauY = verticalScale(bauValue) - 16;
            self._d3Selection.select(".current-bau-value-indicator")
                .transition()
                .attr("cy", bauY);

            const bauValueDisplay = self._d3Selection.select(".current-bau-value-display");
            bauValueDisplay.transition().attr("transform", "translate(8 " + (bauY - 15) + ")");
            bauValueDisplay.select(".value").html(Math.round(bauValue) + " " + units);

            const interventionValue = withInterventions.get(selectedYear)
                .get(region)
                .get(self._attrName);

            const interventionY = verticalScale(interventionValue) - 16;
            const distance = Math.abs(bauY - interventionY);
            self._d3Selection.select(".current-intervention-value-indicator")
                .transition()
                .attr("cy", interventionY);

            const interventionValueDisplay = self._d3Selection.select(
                ".current-intervention-value-display",
            );

            interventionValueDisplay.transition()
                .attr("transform", "translate(8 " + (interventionY - 15) + ")")
                .style("opacity", distance < 30 ? 0 : 1);

            interventionValueDisplay.select(".value")
                .html(Math.round(interventionValue) + " " + units);
        };

        const updateLines = () => {
            const bauData = getData(businessAsUsuals);
            const projectionData = getData(withInterventions);

            self._d3Selection.select(".bau-glyph")
                .transition()
                .attr("d", pathGenerator(bauData));

            self._d3Selection.select(".projection-glyph")
                .transition()
                .attr("d", pathGenerator(projectionData));
        };

        const updateHoverTargets = () => {
            const yearWidth = horizontalScale(2050) - horizontalScale(2049) - 2;
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
                .attr("width", yearWidth)
                .attr("y", 16)
                .attr("height", totalHeight - 20 - 16)
                .on("click", (event, year) => self._onYearChange(year));
        };

        const updateTitle = () => {
            const newTitle = [
                "Global",
                STRINGS.get(self._attrName),
                "Over Time by",
                unitsLong,
            ].join(" ");
            self._targetDiv.querySelector(".title").innerHTML = newTitle;
        };

        const updateAxisRect = () => {
            self._d3Selection.select(".zero-line")
                .transition()
                .attr("opacity", hasNegtive ? 1 : 0)
                .attr("y", verticalScale(0));
        };

        updateValueAxis();
        updateYearAxis();
        updateAxisRect();
        updateIndicator();
        updateLines();
        updateHoverTargets();
        updateTitle();
    }

    _initElements() {
        const self = this;

        const targetSvg = self._d3Selection.select(".body");
        targetSvg.html("");

        const boundingBox = self._targetDiv.querySelector(".body")
            .getBoundingClientRect();
        const totalWidth = boundingBox.width;
        const totalHeight = boundingBox.height;

        targetSvg.append("rect")
            .classed("zero-line", true)
            .attr("x", 71)
            .attr("y", totalHeight)
            .attr("width", totalWidth - 91 - 71)
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

        yearIndicatorGroup.append("rect")
            .attr("x", 0)
            .attr("y", 0)
            .attr("width", 1)
            .attr("height", totalHeight - 20 - 16)
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

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {TimeDeltaPresenter};
