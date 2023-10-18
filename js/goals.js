/**
 * Utilities to calculate high level metrics elevated to the user as "goal" metrics.
 *
 * @license BSD, see LICENSE.md
 */

import {ALL_REGIONS, CONSUMPTION_ATTRS, EOL_ATTRS} from "const";


/**
 * Get the high level goal metrics.
 *
 * @param target The state object (Map) for a year to be modified.
 * @returns Map from name of metric to goal metric value.
 */
function getGoals(target) {
    const strategies = [
        (output) => {
            return {
                "goal": "landfillWaste",
                "value": output.get("eolLandfillMT"),
            };
        },
        (output) => {
            return {
                "goal": "mismanagedWaste",
                "value": output.get("eolMismanagedMT"),
            };
        },
        (output) => {
            return {
                "goal": "incineratedWaste",
                "value": output.get("eolIncinerationMT"),
            };
        },
        (output) => {
            return {
                "goal": "recycling",
                "value": output.get("eolRecyclingMT"),
            };
        },
        (output) => {
            return {
                "goal": "productionEmissions",
                "value": 123,
            };
        },
        (output) => {
            return {
                "goal": "consumptionEmissions",
                "value": 123,
            };
        },
        (output) => {
            const total = CONSUMPTION_ATTRS
                .map((x) => output.get(x))
                .reduce((a, b) => a + b);

            return {
                "goal": "totalConsumption",
                "value": total,
            };
        },
        (output) => {
            const total = EOL_ATTRS
                .map((x) => output.get(x))
                .reduce((a, b) => a + b);

            return {
                "goal": "totalWaste",
                "value": total,
            };
        },
    ];

    const goals = new Map();
    ALL_REGIONS.forEach((region) => {
        const regionOutputs = target.get("out").get(region);
        const newValues = strategies.map((x) => x(regionOutputs));

        const regionGoals = new Map();
        newValues.forEach((newValue) => {
            regionGoals.set(newValue["goal"], newValue["value"]);
        });

        goals.set(region, regionGoals);
    });

    return goals;
}


export {getGoals};
