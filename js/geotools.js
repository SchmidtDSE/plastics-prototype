import {ALL_ATTRS} from "const";


function addGlobalToState(state) {
    const outputs = state.get("out");
    const globalValues = new Map();
    ALL_ATTRS.forEach((attr) => {
        const total = Array.of(...outputs.keys())
            .filter((region) => region !== "global")
            .map((region) => outputs.get(region))
            .map((regionValues) => regionValues.get(attr))
            .reduce((a, b) => a + b);
        globalValues.set(attr, total);
    });
    outputs.set("global", globalValues);
}


export {addGlobalToState};
