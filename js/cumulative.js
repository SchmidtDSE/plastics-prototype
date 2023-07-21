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

export {makeCumulative};
