/**
 * Tools to calculate metrics and meta values by region.
 *
 * @license BSD, see LICENSE.md
 */

import {ALL_ATTRS} from "const";


/**
 * Calculate global statistics from region statistics for a state Map
 *
 * @param state The state Map in which the global statistics should be added.
 */
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

                const originalValue = regionValues.get(attr);
                if (ATTRS_TO_ZERO.indexOf(attr) != -1 && originalValue < 0) {
                    return 0;
                } else {
                    return originalValue;
                }
            })
            .reduce((a, b) => a + b);
        globalValues.set(attr, total);
    });
    outputs.set("global", globalValues);
}


/**
 * Make a collection of year state Maps into percent differences.
 *
 * @param target The new values.
 * @param reference The old values.
 * @returns The states with relative values.
 */
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


/**
 * Convert a stat Map for a single year into percent change.
 *
 * @param target The new values.
 * @param reference The old values.
 * @returns The newly constructed state object (Map).
 */
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
