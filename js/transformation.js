/**
 * Post-processing logic for the projections.
 * 
 * Post-processing logic for the projections, allowing for operations like making the projections
 * relative to business as usual or cumulative.
 * 
 * @license BSD, see LICENSE.md
 */


/**
 * Make the projections cumulative.
 * 
 * @param target Multi-year proejction set from which to pull raw values.
 * @returns New multi-year projection set with cumulative values.
 */
function makeCumulative(target) {
    const priorValues = new Map();

    const years = Array.of(...target.keys());
    years.sort();

    const allNewOutputs = new Map();
    years.forEach((year) => {
        const yearTarget = target.get(year);
        const oldOut = yearTarget.get("out");
        const newOut = new Map();

        Array.of(...oldOut.keys()).forEach((region) => {
            const oldRegionOut = oldOut.get(region);
            const newRegionOut = new Map();

            if (!priorValues.has(region)) {
                priorValues.set(region, new Map());
            }

            const priorValuesRegion = priorValues.get(region);

            Array.of(...oldRegionOut.entries()).forEach((entry) => {
                const attrName = entry[0];
                const oldValue = entry[1];

                if (!priorValuesRegion.has(attrName)) {
                    priorValuesRegion.set(attrName, 0);
                }

                const newValue = priorValuesRegion.get(attrName) + oldValue;

                newRegionOut.set(attrName, newValue);
                priorValuesRegion.set(attrName, newValue);
            });

            newOut.set(region, newRegionOut);
        });

        const decoratedOut = new Map();
        decoratedOut.set("out", newOut);
        decoratedOut.set("in", yearTarget.get("in"));

        allNewOutputs.set(year, decoratedOut);
    });

    return allNewOutputs;
}


/**
 * Make the projections relative to business as usual
 * 
 * @param target Multi-year proejction set from which to pull raw values.
 * @returns New multi-year projection set with deltas to BAU.
 */
function makeYearDelta(target, baseline) {
    const years = Array.of(...target.keys());

    const allNewOutputs = new Map();
    years.forEach((year) => {
        const yearTarget = target.get(year);
        const oldOut = yearTarget.get("out");
        const newOut = new Map();

        Array.of(...oldOut.keys()).forEach((region) => {
            const oldRegionOut = oldOut.get(region);
            const newRegionOut = new Map();

            const baselineRegion = baseline.get("out").get(region);

            Array.of(...oldRegionOut.entries()).forEach((entry) => {
                const attrName = entry[0];
                const oldValue = entry[1];

                const newValue = oldValue - baselineRegion.get(attrName);
                newRegionOut.set(attrName, newValue);
            });

            newOut.set(region, newRegionOut);
        });

        const decoratedOut = new Map();
        decoratedOut.set("out", newOut);
        decoratedOut.set("in", yearTarget.get("in"));

        allNewOutputs.set(year, decoratedOut);
    });

    return allNewOutputs;
}


export {makeCumulative, makeYearDelta};
