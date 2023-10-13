import {
    ALL_ATTRS,
    COLORS,
    CONSUMPTION_ATTRS,
    DISPLAY_STAGES,
    DISPLAY_TYPES,
    EOL_ATTRS,
    HISTORY_START_YEAR,
    MAX_YEAR,
    PRODUCTION_ATTRS,
    START_YEAR,
    STANDARD_ATTR_NAMES,
} from "const";
import {STRINGS} from "strings";


class SparklinePresenter {
    constructor(attrName, color, targetDiv, onYearChange) {
        const self = this;

        self._attrName = attrName;
        self._color = color;
        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._d3Selection = self._getD3().select("#" + targetDiv.id);

        self._initElements();
    }

    update(stateSet, selection) {
        const self = this;

        const boundingBox = self._targetDiv.querySelector(".sparkline")
            .getBoundingClientRect();
        const totalWidth = boundingBox.width;
        const totalHeight = boundingBox.height;

        const states = stateSet.getAllWithInterventions();

        const showHistorical = self._getShowHistory();
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const selectedYear = selection.getYear();
        const forwardYear = Math.min(START_YEAR, selectedYear);
        const startYear = showHistorical ? HISTORY_START_YEAR : forwardYear;
        const endYear = MAX_YEAR;
        const region = selection.getRegion();

        const allStates = [stateSet.getAllWithInterventions(), stateSet.getAllBusinessAsUsuals()];

        const allValues = allStates.map((x) => x.values())
            .flatMap((x) => Array.from(x));

        let attrs = null;
        if (selection.getDisplayStage() == DISPLAY_STAGES.consumption) {
            attrs = CONSUMPTION_ATTRS;
        } else if (selection.getDisplayStage() == DISPLAY_STAGES.production) {
            attrs = PRODUCTION_ATTRS;
        } else {
            attrs = EOL_ATTRS;
        }

        const yearValues = allValues.map((state) => {
            const out = state.get("out").get(region);

            const maxPositive = attrs.map((attr) => out.get(attr))
                .filter((x) => x > 0)
                .reduce((a, b) => a > b ? a : b, 0);

            const maxNegative = attrs.map((attr) => out.get(attr))
                .filter((x) => x < 0)
                .map((x) => Math.abs(x))
                .reduce((a, b) => a > b ? a : b, 0);

            return Math.max(maxPositive, maxNegative);
        });
        const maxValueFloat = yearValues.reduce((a, b) => a > b ? a : b);
        const maxValue = Math.round(maxValueFloat);
        const minValue = selection.getShowBauDelta() ? -maxValue : 0;

        const horizontalScale = self._getD3().scaleLinear()
            .domain([startYear, endYear])
            .range([35, totalWidth - 30]);

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
                        "value": raw[1].get("out").get(region).get(self._attrName),
                    };
                })
                .filter((datum) => datum["year"] >= startYear)
                .filter((datum) => datum["year"] <= endYear);
        };
        attrs;
        const updateLabels = () => {
            self._d3Selection.select(".start-year-label")
                .html(startYear);

            self._d3Selection.select(".end-year-label")
                .html(endYear);

            self._d3Selection.select(".min-value-label")
                .html(minValue)
                .attr("x", maxValue >= 1000 ? 30 : 20);

            self._d3Selection.select(".max-value-label")
                .html(maxValue)
                .attr("x", maxValue >= 1000 ? 30 : 20);

            self._d3Selection.select(".units-value-label")
                .html(isPercent ? "%" : "MMT")
                .attr("x", maxValue >= 1000 ? 30 : 20);
        };

        const updateIndicator = () => {
            const selectedYear = selection.getYear();
            const newX = horizontalScale(selectedYear);

            self._d3Selection.select(".spark-year-indicator")
                .transition()
                .attr("x", newX);

            self._d3Selection.select(".selected-year-label")
                .html(selectedYear)
                .transition()
                .attr("x", newX);
        };

        const updateLines = () => {
            const bauData = getData(stateSet.getAllBusinessAsUsuals());
            const projectionData = getData(stateSet.getAllWithInterventions());

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

            self._d3Selection.select(".spark-hover-targets")
                .html("");

            self._d3Selection.select(".spark-hover-targets")
                .selectAll(".spark-hover-target")
                .data(years)
                .enter()
                .append("rect")
                .classed("spark-hover-target", true)
                .attr("x", (year) => horizontalScale(year) - yearWidth / 2)
                .attr("width", yearWidth)
                .attr("y", 16)
                .attr("height", totalHeight - 20 - 16)
                .on("click", (event, year) => self._onYearChange(year));
        };

        const updateDescription = () => {
            const value = stateSet.getAllWithInterventions().get(selectedYear)
                .get("out")
                .get(region)
                .get(self._attrName);
            const valueRounded = Math.round(value * 10) / 10;
            const labelContent = [
                STRINGS.get(self._attrName) + ":",
                valueRounded,
                isPercent ? "%" : "MMT",
                "in",
                selectedYear,
                "with interventions.",
            ].join(" ");
            self._d3Selection.select(".sparkline")
                .attr("aria-label", labelContent);
        };

        updateLabels();
        updateIndicator();
        updateLines();
        updateHoverTargets();
        updateDescription();
    }

    _initElements() {
        const self = this;

        const targetSvg = self._d3Selection.select(".sparkline");
        targetSvg.html("");

        const boundingBox = self._targetDiv.querySelector(".sparkline")
            .getBoundingClientRect();
        const totalWidth = boundingBox.width;
        const totalHeight = boundingBox.height < 1 ? 100 : boundingBox.height;

        targetSvg.append("text")
            .attr("x", 35)
            .attr("y", totalHeight - 12)
            .classed("start-year-label", true)
            .classed("year-label", true)
            .classed("spark-label", true);

        targetSvg.append("text")
            .attr("x", totalWidth - 30)
            .attr("y", totalHeight - 12)
            .classed("end-year-label", true)
            .classed("year-label", true)
            .classed("spark-label", true);

        targetSvg.append("text")
            .attr("x", 20)
            .attr("y", totalHeight - 20)
            .classed("min-value-label", true)
            .classed("value-label", true)
            .classed("spark-label", true);

        targetSvg.append("text")
            .attr("x", 20)
            .attr("y", totalHeight / 2)
            .html("MMT")
            .classed("units-value-label", true)
            .classed("value-label", true)
            .classed("spark-label", true);

        targetSvg.append("text")
            .attr("x", 20)
            .attr("y", 20)
            .classed("max-value-label", true)
            .classed("value-label", true)
            .classed("spark-label", true);

        targetSvg.append("text")
            .attr("x", 35)
            .attr("y", 14)
            .classed("selected-year-label", true)
            .classed("year-label", true)
            .classed("spark-label", true);

        targetSvg.append("rect")
            .attr("x", 35)
            .attr("y", 16)
            .attr("width", 1)
            .attr("height", totalHeight - 20 - 16)
            .classed("spark-year-indicator", true);

        targetSvg.append("path")
            .classed("sparkline-glyph", true)
            .classed("bau-glyph", true)
            .style("stroke", self._color);

        targetSvg.append("path")
            .classed("sparkline-glyph", true)
            .classed("projection-glyph", true)
            .style("stroke", self._color);

        targetSvg.append("g")
            .classed("spark-hover-targets", true);
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


class SparklinesSet {
    constructor(targetDiv, onYearChange) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;

        self._d3Selection = self._getD3().select("#" + self._targetDiv.id);

        self._sparklines = self._buildSparklines(onYearChange);
    }

    update(stateSet, selection) {
        const self = this;

        const attrsOptions = STANDARD_ATTR_NAMES;
        const attrs = attrsOptions.get(selection.getDisplayStage());

        self._d3Selection.selectAll(".sparkline-container")
            .style("display", (x) => {
                return attrs.indexOf(x) == -1 ? "none" : "block";
            });

        self._sparklines.forEach((sparkline) => sparkline.update(stateSet, selection));
    }

    _buildSparklines(onYearChange) {
        const self = this;

        // Color scales
        const colorScales = new Map();
        [EOL_ATTRS, CONSUMPTION_ATTRS, PRODUCTION_ATTRS].forEach((attrList) => {
            attrList.forEach((attr, i) => {
                const color = COLORS[i];
                colorScales.set(attr, color);
            });
        });

        const bound = self._d3Selection.selectAll(".sparkline-container")
            .data(ALL_ATTRS, (x) => x);

        bound.exit().remove();

        const newContainers = bound.enter()
            .append("div")
            .classed("sparkline-container", true)
            .attr("id", (x) => "sparkline-container-" + x);

        newContainers.append("div")
            .classed("caption", true)
            .html((x) => STRINGS.get(x));

        newContainers.append("svg")
            .classed("sparkline", true);

        return ALL_ATTRS.map((attrName) => {
            const attrDivId = "sparkline-container-" + attrName;
            const attrDiv = document.getElementById(attrDivId);
            const color = colorScales.get(attrName);
            return new SparklinePresenter(attrName, color, attrDiv, onYearChange);
        });
    }

    _getD3() {
        const self = this;
        // eslint-disable-next-line no-undef
        return d3;
    }
}


export {SparklinesSet};
