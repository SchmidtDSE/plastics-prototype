/**
 * Calculate global statistics from region statistics for a state Map
 *
 * @param state The state Map in which the global statistics should be added.
 * @param attrs All attributes to add.
 */
function addGlobalToStateAttrs(state, attrs) {
    const outputs = state.get("out");
    const globalValues = new Map();
    attrs.forEach((attr) => {
        const total = Array.of(...outputs.keys())
            .filter((region) => region !== "global")
            .map((region) => outputs.get(region))
            .map((regionValues) => {
                const ATTRS_TO_ZERO = [
                    "netImportsMT",
                    "netWasteImportMT",
                ];

                const originalValue = regionValues.get(attr);
                if (ATTRS_TO_ZERO.indexOf(attr) != -1) {
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
