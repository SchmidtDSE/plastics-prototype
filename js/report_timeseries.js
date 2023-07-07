class TimeseriesPresenter {

    constructor(targetDiv, onYearChange, requestRender) {
        const self = this;

        self._targetDiv = targetDiv;
        self._onYearChange = onYearChange;
        self._requestRender = requestRender;

        self._targetSvg = self._targetDiv.querySelector(".timeseries");
        self._d3Selection = d3.select("#" + self._targetSvg.id);

        // Listen for historical change
        const historyCheck = self._targetDiv.querySelector(".history-check");
        historyCheck.addEventListener("change", () => {
            self._requestRender();
        });

        // Attrs
        self._attrNames = new Map();
        self._attrNames.set(DISPLAY_STAGES.eol, EOL_ATTRS);
        self._attrNames.set(DISPLAY_STAGES.consumption, CONSUMPTION_ATTRS);

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

        self._colorScales = new Map();
        self._colorScales.set(DISPLAY_STAGES.eol, colorScalesEol);
        self._colorScales.set(DISPLAY_STAGES.consumption, colorScalesConsumption);
    }

    update(states, selection) {
        const self = this;

        const attrNames = self._attrNames.get(selection.getDisplayStage());
        const region = selection.getRegion();
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const historicalCheck = self._targetDiv.querySelector(".history-check");
        const showHistorical = historicalCheck.checked;
        const selectedYear = selection.getYear();
        const colorScale = self._colorScales.get(selection.getDisplayStage());

        // Make vertical scale
        const verticalStep = isPercent ? 20 : 50;
        const height = self._targetSvg.getBoundingClientRect().height;
        const yearValues = Array.from(states.values()).map((state) => {
            const out = state.get("out").get(region);
            const total = attrNames.map((attr) => out.get(attr))
                .reduce((a, b) => a + b);
            return total;
        });
        const maxSumValueNative = Math.round(
            yearValues.reduce((a, b) => a > b ? a : b)
        );
        const maxSumValue = Math.ceil(maxSumValueNative / verticalStep) * verticalStep;
        const verticalScale = d3.scaleLinear()
            .domain([0, maxSumValue])
            .range([height - 30, 30]);

        // Make horizontal scale
        const width = self._targetSvg.getBoundingClientRect().width;
        const minYear = showHistorical ? HISTORY_START_YEAR : Math.min(START_YEAR, selectedYear);
        const years = [];
        for (let year = minYear; year <= MAX_YEAR; year++) {
            years.push(year);
        }
        const horizontalScale = d3.scaleBand()
            .domain(years)
            .range([55, width - 15])
            .paddingInner(0.1);

        // Make updates
        const updateTitle = () => {
            const title = self._targetDiv.querySelector(".title");
            const text = [
                STRINGS.get(selection.getRegion()),
                "Annual",
                STRINGS.get(selection.getDisplayStage()),
                "in",
                STRINGS.get(selection.getDisplayType())
            ].join(" ");
            title.innerHTML = text;
        };

        const updateValueAxis = () => {
            const ticks = [];
            for (let i = 0; i <= maxSumValue; i += verticalStep) {
                ticks.push(i);
            }

            const bound = self._d3Selection.selectAll(".value-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("value-tick", true)
                .attr("x", 50)
                .attr("y", 0)
                .html((amount) => amount);

            const boundUpdated = self._d3Selection.selectAll(".value-tick");

            boundUpdated.attr("y", (amount) => verticalScale(amount));
        };

        const updateYearAxis = () => {
            const ticks = [];
            for (let year = minYear; year <= MAX_YEAR; year += 5) {
                ticks.push(year);
            }

            const bound = self._d3Selection.selectAll(".year-tick")
                .data(ticks, (x) => x);

            bound.exit().remove();

            bound.enter().append("text")
                .classed("tick", true)
                .classed("year-tick", true)
                .attr("x", (x) => horizontalScale(x) + horizontalScale.step() / 2)
                .attr("y", height - 20)
                .html((x) => x);

            const boundUpdated = self._d3Selection.selectAll(".year-tick");

            boundUpdated.attr("x", (x) => horizontalScale(x) + horizontalScale.step() / 2);
        }

        const updateYearIndicator = () => {
            if (self._d3Selection.select(".year-indicator").empty()) {
                const newGroup = self._d3Selection.append("g")
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
            const yearIndicator = self._d3Selection.select(".year-indicator");
            yearIndicator.transition().attr(
                "transform",
                "translate(" + newX + " 0)"
            );

            yearIndicator.select(".year-indicator-label")
                .html(selectedYear);
        }

        const buildDataForYear = (year) => {
            let lastValue = 0;

            const values = states.get(year).get("out").get(region);

            return Array.from(attrNames).reverse().map((attr) => {
                const nextValue = values.get(attr);
                const nextEnd = lastValue + nextValue;
                const datum = {
                    "attr": attr,
                    "year": year,
                    "start": lastValue,
                    "end": nextEnd
                };
                lastValue = nextEnd;
                return datum;
            });
        };

        const updateBars = () => {
            const data = years.flatMap(buildDataForYear);

            const bound = self._d3Selection.selectAll(".bar")
                .data(data, (datum) => datum["year"] + "/" + datum["attr"]);

            bound.exit().remove();

            bound.enter().append("rect")
                .classed("bar", true)
                .attr("x", (datum) => horizontalScale(datum["year"]))
                .attr("y", verticalScale(0))
                .attr("width", horizontalScale.bandwidth())
                .attr("height", 1)
                .style("fill", (datum) => colorScale.get(datum["attr"]));

            const boundUpdated = self._d3Selection.selectAll(".bar");

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
            const bound = self._d3Selection.selectAll(".click-target")
                .data(years, (x) => x);

            bound.exit().remove();

            bound.enter().append("rect")
                .classed("click-target", true)
                .on("click", (event, year) => {
                    self._onYearChange(year);
                });

            const boundUpdated = self._d3Selection.selectAll(".click-target");
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

}
