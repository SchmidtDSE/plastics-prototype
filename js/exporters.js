/**
 * Utilities for building CSV file exports / downloads from the tool.
 *
 * @license BSD, see LICENSE.md
 */

import {
    ALL_REGIONS,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
} from "const";

const POLYMER_EXPORT_SERIES = [
    "consumption",
    "overallNetTrade",
    "production",
];

const POLYMER_EXPORT_ATTRS = [
    "region",
    "year",
    "series",
    "polymer",
    "volumeMT",
];

const GHG_EXPORT_ATTRS = [
    "region",
    "year",
    "eCO2MTOverall",
];


/**
 * Get the string to use to identify a region in an export.
 * 
 * @param target The internal name for the region.
 * @returns The string to use to identify a region.
 */
function getRegionStr(target) {
    if (target === "row") {
        return "mw";
    } else if (target === "nafta") {
        return "na";
    } else {
        return target;
    }
};


/**
 * Build an inline data URI that encodes a CSV file with sector / fate volumes by year and region.
 *
 * @param withInterventions Map from year to state object (Map) with interventions applied.
 * @returns Data URI that embedds the CSV file with sector / fate by year.
 */
function buildSectorFateDownload(withInterventions) {
    const attrs = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS);

    const headerRow = ["year"];
    attrs.forEach((attr) => {
        ALL_REGIONS.forEach((region) => {
            headerRow.push(getRegionStr(region) + "." + attr);
        });
    });
    const headerRowStr = headerRow.join(",");

    const content = Array.of(...withInterventions.entries())
        .map((entry) => {
            const retObj = {"year": entry[0]};
            const outputs = entry[1].get("out");
            attrs.forEach((attr) => {
                ALL_REGIONS.forEach((region) => {
                    retObj[region + "." + attr] = outputs.get(region).get(attr);
                });
            });
            return retObj;
        })
        .map((record) => {
            const outputLinear = [record["year"]];
            attrs.forEach((attr) => {
                ALL_REGIONS.forEach((region) => {
                    outputLinear.push(record[region + "." + attr]);
                });
            });
            return outputLinear;
        })
        .map((recordLinear) => recordLinear.map((x) => x + ""))
        .map((recordLinear) => recordLinear.join(","))
        .join("\n");

    const fullCsv = headerRowStr + "\n" + content;
    return "data:text/csv;charset=UTF-8," + encodeURIComponent(fullCsv);
}


/**
 * Build an inline data URI that encodes a CSV file with polymer volumes by year and region.
 *
 * @param withInterventions Map from year to state object (Map) with interventions applied.
 * @returns Data URI that embedds the CSV file with polymer volumes by year.
 */
function buildPolymerDownload(withInterventions) {
    const headerRowStr = POLYMER_EXPORT_ATTRS.join(",");

    const content = Array.of(...withInterventions.entries())
        .flatMap((entry) => {
            const polymers = entry[1].get("polymers");
            return POLYMER_EXPORT_SERIES.flatMap((series) => {
                return ALL_REGIONS.filter((x) => x !== "global").flatMap((region) => {
                    if (!polymers.has(region) || !polymers.get(region).has(series)) {
                        alert([
                            "Could not generate export.",
                            "Reason: Application update is available.",
                            "Please refresh and try again.",
                            "Apologies for the inconvienence.",
                        ].join(" "));
                        throw "Out of date application error shown to user.";
                    }
                    const vector = polymers.get(region).get(series);
                    return Array.of(...vector.keys()).map((polymerName) => {
                        const volume = vector.get(polymerName);
                        return {
                            "region": getRegionStr(region),
                            "year": entry[0],
                            "series": series,
                            "polymer": polymerName,
                            "volumeMT": volume,
                        };
                    });
                });
            });
        })
        .map((record) => {
            return POLYMER_EXPORT_ATTRS.map((attr) => record[attr]);
        })
        .map((recordLinear) => recordLinear.map((x) => x + ""))
        .map((recordLinear) => recordLinear.join(","))
        .join("\n");

    const fullCsv = headerRowStr + "\n" + content;
    return "data:text/csv;charset=UTF-8," + encodeURIComponent(fullCsv);
}


/**
 * Build an inline data URI that encodes a CSV file with GHG projections by year and region.
 *
 * @param withInterventions Map from year to state object (Map) with interventions applied.
 * @returns Data URI that embedds the CSV file with GHG by year.
 */
function buildGhgDownload(withInterventions) {
    const headerRowStr = GHG_EXPORT_ATTRS.join(",");

    const content = Array.of(...withInterventions.entries())
        .flatMap((entry) => {
            const ghgInfo = entry[1].get("ghg");
            return ALL_REGIONS.filter((x) => x === "global").flatMap((region) => {
                const regionGhgInfo = ghgInfo.get(region);
                return {
                    "region": getRegionStr(region),
                    "year": entry[0],
                    "eCO2MTOverall": regionGhgInfo.get("overallGhg"),
                };
            });
        })
        .map((record) => {
            return GHG_EXPORT_ATTRS.map((attr) => record[attr]);
        })
        .map((recordLinear) => recordLinear.map((x) => x + ""))
        .map((recordLinear) => recordLinear.join(","))
        .join("\n");

    const fullCsv = headerRowStr + "\n" + content;
    return "data:text/csv;charset=UTF-8," + encodeURIComponent(fullCsv);
}


export {buildGhgDownload, buildPolymerDownload, buildSectorFateDownload};
