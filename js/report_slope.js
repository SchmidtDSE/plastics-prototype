class SlopegraphPresenter {

    constructor(targetDiv) {
        const self = this;
        
        self._targetDiv = targetDiv;
        self._targetSvg = self._targetDiv.querySelector(".slopegraph");
        self._targetSvgId = self._targetSvg.id;

        const svgBoundingBox = self._targetSvg.getBoundingClientRect();
        self._svgWidth = svgBoundingBox.width;
        self._svgHeight = svgBoundingBox.height;

        // Attrs
        self._attrNames = new Map();
        self._attrNames.set(DISPLAY_STAGES.eol, EOL_ATTRS);

        // Horizontal scales
        self._horizontalScale = d3.scaleBand()
            .domain(["header"].concat(ALL_REGIONS))
            .range([0, self._svgWidth]);

        // Vertical scales
        const verticalScaleEol = d3.scaleBand()
            .domain(["header"].concat(EOL_ATTRS))
            .range([0, self._svgHeight]);
        
        self._verticalScales = new Map();
        self._verticalScales.set(DISPLAY_STAGES.eol, verticalScaleEol);

        // Vertical scales on index
        const eolIndicies = EOL_ATTRS.map((x, i) => i);
        const verticalIndexScaleEol = d3.scaleBand()
            .domain([-1].concat(eolIndicies))
            .range([0, self._svgHeight]);

        self._verticalIndexScales = new Map();
        self._verticalIndexScales.set(DISPLAY_STAGES.eol, verticalIndexScaleEol);

        // Color scales
        const colorScalesEol = new Map();
        EOL_ATTRS.forEach((attr, i) => {
            const color = COLORS[i];
            colorScalesEol.set(attr, color);
        });

        self._colorScales = new Map();
        self._colorScales.set(DISPLAY_STAGES.eol, colorScalesEol);

        // Text color scales
        const textColorScalesEol = new Map();
        EOL_ATTRS.forEach((attr, i) => {
            const color = TEXT_COLORS[i];
            textColorScalesEol.set(attr, color);
        });

        self._textColorScales = new Map();
        self._textColorScales.set(DISPLAY_STAGES.eol, textColorScalesEol);
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
            .range([0, 1000]);


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
                    const x = self._horizontalScale(datum) + self._horizontalScale.step() / 2;
                    const y = verticalScale("header") + verticalScale.step() / 2
                    return "translate(" + x + " " + y + ")";
                });

            newGroups.append("text")
                .attr("x", 0)
                .attr("y", 0)
                .classed("label", true)
                .text((datum) => STRINGS.get(datum));
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

            updatedBound.transition()
                .attr("d", buildDGetter(lineGeneratorUpdate))
        };

        const updateBubbles = () => {
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
                    const x = self._horizontalScale(region) + self._horizontalScale.step() / 2;
                    const y = verticalScale(attr) + verticalScale.step() / 2;
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

            updatedBound.transition()
                .attr("transform", (datum) => {
                    const region = datum["region"];
                    const attr = datum["attr"];
                    const index = indicies.get(region).get(attr);
                    const x = self._horizontalScale(region) + self._horizontalScale.step() / 2;
                    const y = verticalIndexScale(index) + verticalIndexScale.step() / 2;
                    return "translate(" + x + " " + y + ")";
                });

            updatedBound.select("text")
                .text((datum) => Math.round(datum["value"]))
                .transition()
                .attr("y", (datum) => {
                    const radius = getRadius(datum);
                    return radius < 10 ? 20 : 0;
                })
                .attr("fill", (datum) => {
                    const radius = getRadius(datum);
                    const defaultColor = textColorScale.get(datum["attr"]);
                    return radius < 10 ? "#333333" : defaultColor;
                });

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