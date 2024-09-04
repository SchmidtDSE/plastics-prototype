/**
 * Utilities to calculate high level metrics elevated to the user as "goal" metrics.
 *
 * @license BSD, see LICENSE.md
 */

import {ALL_REGIONS, CONSUMPTION_ATTRS, EOL_ATTRS} from "const";


function getRegionOutput(state, region) {
    return state.get("out").get(region);
}


/**
 * Get the high level goal metrics.
 *
 * @param target The state object (Map) for a year to be modified.
 * @returns Map from name of metric to goal metric value.
 */
function getGoals(target) {
    const strategies = [
        (state, region) => {
            return {
                "goal": "landfillWaste",
                "value": getRegionOutput(state, region).get("eolLandfillMT"),
            };
        },
        (state, region) => {
            return {
                "goal": "mismanagedWaste",
                "value": getRegionOutput(state, region).get("eolMismanagedMT"),
            };
        },
        (state, region) => {
            return {
                "goal": "incineratedWaste",
                "value": getRegionOutput(state, region).get("eolIncinerationMT"),
            };
        },
        (state, region) => {
            return {
                "goal": "recycling",
                "value": getRegionOutput(state, region).get("eolRecyclingMT"),
            };
        },
        (state, region) => {
            return {
                "goal": "productionEmissions",
                "value": 123,
            };
        },
        (state, region) => {
            return {
                "goal": "consumptionEmissions",
                "value": 123,
            };
        },
        (state, region) => {
            const total = CONSUMPTION_ATTRS
                .map((x) => getRegionOutput(state, region).get(x))
                .reduce((a, b) => a + b);

            return {
                "goal": "totalConsumption",
                "value": total,
            };
        },
        (state, region) => {
            const total = EOL_ATTRS
                .map((x) => getRegionOutput(state, region).get(x))
                .reduce((a, b) => a + b);

            return {
                "goal": "totalWaste",
                "value": total,
            };
        },
        (state, region) => {
            const getTotal = () => {
                if (state.has("ghg")) {
                    return state.get("ghg").get(region).get("overallGhg");
                } else {
                    return -1;
                }
            };

            return {
                "goal": "ghg",
                "value": getTotal(),
            };
        },
        (state, region) => {
            return {
                "goal": "primaryProduction",
                "value": getRegionOutput(state, region).get("primaryProductionMT"),
            };
        },
        (state, region) => {
            return {
                "goal": "secondaryProduction",
                "value": getRegionOutput(state, region).get("secondaryProductionMT"),
            };
        }
    ];

    const goals = new Map();
    ALL_REGIONS.forEach((region) => {
        const newValues = strategies.map((x) => x(target, region));

        const regionGoals = new Map();
        newValues.forEach((newValue) => {
            regionGoals.set(newValue["goal"], newValue["value"]);
        });

        goals.set(region, regionGoals);
    });

    return goals;
}


export {getGoals};
