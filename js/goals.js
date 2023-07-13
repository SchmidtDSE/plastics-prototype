import {ALL_REGIONS, EOL_ATTRS} from "const";


function getGoals(target) {
    const strategies = [
        (output) => {
            const total = EOL_ATTRS.filter((x) => x !== "eolRecyclingMT")
                .map((x) => output.get(x))
                .reduce((a, b) => a + b);

            return {
                "goal": "nonRecycledWaste",
                "value": total,
            };
        },
        (output) => {
            return {
                "goal": "mismanagedWaste",
                "value": output.get("eolMismanagedMT"),
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
