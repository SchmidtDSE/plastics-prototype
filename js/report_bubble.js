class BubblegraphPresenter {

    constructor(targetDiv, onRegionChange, requestRender) {
        const self = this;

        self._onRegionChange = onRegionChange;
        self._requestRender = requestRender;
        
        self._targetDiv = targetDiv;
        self._targetSvg = self._targetDiv.querySelector(".bubblegraph");
        self._targetSvgId = self._targetSvg.id;

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
        self._attrNames = new Map();
        self._attrNames.set(DISPLAY_STAGES.eol, EOL_ATTRS);
        self._attrNames.set(DISPLAY_STAGES.consumption, CONSUMPTION_ATTRS);

        // Horizontal scales
        self._horizontalScale = d3.scaleBand()
            .domain(["header"].concat(ALL_REGIONS))
            .range([0, self._svgWidth]);

        // Vertical scales
        const verticalScaleEol = d3.scaleBand()
            .domain(EOL_ATTRS)
            .range([30, self._svgHeight]);

        const verticalScaleConsumption = d3.scaleBand()
            .domain(CONSUMPTION_ATTRS)
            .range([30, self._svgHeight]);
        
        self._verticalScales = new Map();
        self._verticalScales.set(DISPLAY_STAGES.eol, verticalScaleEol);
        self._verticalScales.set(DISPLAY_STAGES.consumption, verticalScaleConsumption);

        // Vertical scales on index
        const eolIndicies = EOL_ATTRS.map((x, i) => i);
        const verticalIndexScaleEol = d3.scaleBand()
            .domain(eolIndicies)
            .range([30, self._svgHeight]);

        const consumptionIndicies = CONSUMPTION_ATTRS.map((x, i) => i);
        const verticalIndexScaleConsumption = d3.scaleBand()
            .domain(consumptionIndicies)
            .range([30, self._svgHeight]);

        self._verticalIndexScales = new Map();
        self._verticalIndexScales.set(DISPLAY_STAGES.eol, verticalIndexScaleEol);
        self._verticalIndexScales.set(DISPLAY_STAGES.consumption, verticalIndexScaleConsumption);

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

        self._textColorScales = new Map();
        self._textColorScales.set(DISPLAY_STAGES.eol, textColorScalesEol);
        self._textColorScales.set(DISPLAY_STAGES.consumption, textColorScalesConsumption);
    }

    update(state, selection) {
        const self = this;

        const displayStage = selection.getDisplayStage();
        const attrNames = self._attrNames.get(displayStage);
        const colorScale = self._colorScales.get(displayStage);
        const textColorScale = self._textColorScales.get(displayStage);
        const verticalScale = self._verticalScales.get(displayStage);
        const verticalIndexScale = self._verticalIndexScales.get(displayStage);

        const outputData = state.get("out");

        const bubbleInfo = [];
        ALL_REGIONS.forEach((region) => {
            attrNames.forEach((attr) => {
                bubbleInfo.push({
                    "region": region,
                    "attr": attr,
                    "value": outputData.get(region).get(attr)
                });
            });
        });

        const maxValue = bubbleInfo
            .map((x) => x["value"])
            .reduce((a, b) => a > b ? a : b);

        const bubbleAreaScale = d3.scaleLinear()
            .domain([0, maxValue])
            .range([0, 800]);


        const indicies = new Map();
        ALL_REGIONS.forEach((region) => {
            const regionInfo = bubbleInfo.filter((x) => x["region"] == region);
            regionInfo.sort((a, b) => b["value"] - a["value"]);

            const attrsSorted = regionInfo.map((x) => x["attr"]);

            const getter = (attr) => attrsSorted.indexOf(attr);

            indicies.set(region, {"get": getter});
        });
        indicies.set("header", {"get": (x) => -1});

        const svgSelection = d3.select("#" + self._targetSvgId);

        const updateTitle = () => {
            const titleElement = self._targetDiv.querySelector(".title");
            const stageString = STRINGS.get(selection.getDisplayStage());
            const typeString = STRINGS.get(selection.getDisplayType());
            const text = [
                stageString,
                "by Country in",
                selection.getYear() + " as",
                typeString
            ].join(" ");

            titleElement.textContent = text;
        };

        const updateMetricLabels = () => {
            const bound = svgSelection.selectAll(".metric-intro")
                .data(attrNames);

            bound.exit().remove();

            const newGroups = bound.enter()
                .append("g")
                .classed("metric-intro", true)
                .attr("transform", (datum) => {
                    const x = self._horizontalScale("header") + self._horizontalScale.step();
                    const y = verticalScale(datum) + verticalScale.step() / 2
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
            const bound = svgSelection.selectAll(".region-intro")
                .data(ALL_REGIONS);

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

            newGroups.append("rect")
                .classed("active-indicator", true)
                .attr("x", 5)
                .attr("y", 5)
                .attr("width", self._horizontalScale.step() - 10)
                .attr("height", self._svgHeight - 10);

            newGroups.append("text")
                .attr("x", self._horizontalScale.step() / 2)
                .attr("y", 20)
                .classed("label", true)
                .text((datum) => STRINGS.get(datum));

            const updatedBound = svgSelection.selectAll(".region-intro");
            updatedBound
                .classed("active", (datum) => datum === selection.getRegion())
                .classed("inactive", (datum) => datum !== selection.getRegion());
        };

        const updateLines = () => {
            const bound = svgSelection.selectAll(".line")
                .data(attrNames);

            bound.exit().remove();

            const horizOffset = self._horizontalScale.step() / 2;
            const horizOffsetFull = self._horizontalScale.step();
            const vertOffset = verticalIndexScale.step() / 2;

            const getX = (point) => {
                const region = point["region"];
                const isHeader = region === "header";
                const effectiveOffset = isHeader ? horizOffsetFull : horizOffset;
                return self._horizontalScale(region) + effectiveOffset
            };

            const lineGenerator = d3.line()
                .x(getX)
                .y((point) => {
                    const attr = point["attr"];
                    return verticalScale(attr) + vertOffset;
                });

            const lineGeneratorUpdate = d3.line()
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
                    const points = ["header"].concat(ALL_REGIONS).map(
                        (region) => { return {"region": region, "attr": attr}; }
                    );
                    return generator(points);
                };
            };

            const newGroups = bound.enter()
                .append("path")
                .classed("line", true)
                .attr("d", buildDGetter(lineGenerator))
                .attr("stroke", (attr) => colorScale.get(attr));

            const updatedBound = svgSelection.selectAll(".line");

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
                const area = bubbleAreaScale(datum["value"]);
                return Math.sqrt(area);
            };

            const bound = svgSelection.selectAll(".bubble")
                .data(bubbleInfo);

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
                .attr("rx", 10)
                .attr("ry", 10)
                .attr("fill", (datum) => colorScale.get(datum["attr"]))
                .attr("stroke", (datum) => colorScale.get(datum["attr"]));

            newGroups.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .attr("fill", (datum) => textColorScale.get(datum["attr"]));

            const updatedBound = svgSelection.selectAll(".bubble");

            updatedBound.select("text")
                .text((datum) => Math.round(datum["value"]))
                .transition()
                .attr("y", (datum) => {
                    const radius = getRadius(datum);
                    return radius < 5 ? 13 : 0;
                })
                .attr("fill", (datum) => {
                    const radius = getRadius(datum);
                    const defaultColor = textColorScale.get(datum["attr"]);
                    return radius < 5 ? "#333333" : defaultColor;
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

            updatedBound.select("ellipse")
                .transition()
                .attr("rx", getRadius)
                .attr("ry", getRadius);
        };

        updateTitle();
        updateMetricLabels();
        updateRegionLabels();
        updateLines();
        updateBubbles();
    }

}