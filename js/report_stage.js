import {COLORS, CONSUMPTION_ATTRS, DISPLAY_STAGES, DISPLAY_TYPES, EOL_ATTRS} from "const";
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
        const isEol = self._stage == DISPLAY_STAGES.eol;

        const makeColorsEol = () => {
            const colorScalesEol = new Map();
            EOL_ATTRS.forEach((attr, i) => {
                const color = COLORS[i];
                colorScalesEol.set(attr, color);
            });
            return colorScalesEol;
        };

        const makeColorsConsumption = () => {
            const colorScalesConsumption = new Map();
            CONSUMPTION_ATTRS.forEach((attr, i) => {
                const color = COLORS[i];
                colorScalesConsumption.set(attr, color);
            });
            return colorScalesConsumption;
        };

        self._colorScale = isEol ? makeColorsEol() : makeColorsConsumption();
    }

    update(stateSet, selection) {
        const self = this;

        const selected = selection.getDisplayStage() == self._stage;
        const isEol = self._stage == DISPLAY_STAGES.eol;
        const attrs = isEol ? EOL_ATTRS : CONSUMPTION_ATTRS;

        const unitsStrRaw = STRINGS.get(selection.getDisplayType());
        const isPercent = selection.getDisplayType() == DISPLAY_TYPES.percent;
        const unitsStr = (isPercent ? "" : " ") + unitsStrRaw;

        const state = stateSet.getWithIntervention();
        const regionData = state.get("out").get(selection.getRegion());

        const maxValue = CONSUMPTION_ATTRS.concat(EOL_ATTRS)
            .map((attr) => regionData.get(attr))
            .reduce((a, b) => a > b ? a : b);

        const widthScale = self._getD3().scaleLinear()
            .domain([0, maxValue])
            .range([1, self._targetDiv.getBoundingClientRect().width - 5]);

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

            newBars.append("div")
                .classed("glyph", true)
                .style("width", "1px");

            const boundUpdated = self._d3Selection.select(".bars")
                .selectAll(".bar");

            boundUpdated.select(".label")
                .html((attr) => STRINGS.get(attr));

            boundUpdated.select(".value").
                html((attr) => {
                    const value = Math.round(regionData.get(attr));
                    return value + unitsStr;
                });

            boundUpdated.select(".glyph")
                .transition()
                .style("width", (attr) => {
                    const value = regionData.get(attr);
                    const width = widthScale(value);
                    return width + "px";
                })
                .style("background-color", (attr) => {
                    if (selected) {
                        return self._colorScale.get(attr);
                    } else {
                        return "#C0C0C0";
                    }
                });
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
