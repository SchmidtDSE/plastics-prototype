import {ALL_ATTRS} from "const";


function addGlobalToState(state) {
    const outputs = state.get("out");
    const globalValues = new Map();
    ALL_ATTRS.forEach((attr) => {
        const total = Array.of(...outputs.keys())
            .filter((region) => region !== "global")
            .map((region) => outputs.get(region))
            .map((regionValues) => {
                const ATTRS_TO_ZERO = [
                    "netImportsMT",
                    "netExportsMT",
                    "netWasteImportMT",
                    "netWasteExportMT",
                ];
                if (ATTRS_TO_ZERO.indexOf(attr) != -1) {
                    return 0;
                } else {
                    return regionValues.get(attr);
                }
            })
            .reduce((a, b) => a + b);
        globalValues.set(attr, total);
    });
    outputs.set("global", globalValues);
}


function getRelative(target, reference) {
    const newTargetYears = new Map();

    target.forEach((targetValues, year) => {
        const referenceValues = reference.get(year);
        const newTargetValues = getRelativeSingleYear(
            targetValues,
            referenceValues,
        );
        newTargetYears.set(year, newTargetValues);
    });

    return newTargetYears;
}


function getRelativeSingleYear(target, reference) {
    const newOut = new Map();

    const targetOut = target.get("out");
    const referenceOut = reference.get("out");

    targetOut.forEach((targetRegions, region) => {
        const newRegionOut = new Map();
        targetRegions.forEach((targetValue, key) => {
            const referenceValue = referenceOut.get(region).get(key);
            const relativeValue = targetValue - referenceValue;
            newRegionOut.set(key, relativeValue);
        });
        newOut.set(region, newRegionOut);
    });

    const wrapped = new Map();
    wrapped.set("out", newOut);
    return wrapped;
}


export {addGlobalToState, getRelative, getRelativeSingleYear};
