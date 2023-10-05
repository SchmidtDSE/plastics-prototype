import fs from "fs";
import papaparse from "papaparse";

import {CompileVisitor} from "./standalone_visitors.js";

const DATA_ATTRS = [
    "eolRecyclingMT",
    "eolLandfillMT",
    "eolIncinerationMT",
    "eolMismanagedMT",
    "consumptionAgricultureMT",
    "consumptionConstructionMT",
    "consumptionElectronicMT",
    "consumptionHouseholdLeisureSportsMT",
    "consumptionPackagingMT",
    "consumptionTransporationMT",
    "consumptionTextileMT",
    "consumptionOtherMT",
    "netImportsMT",
    "netExportsMT",
    "domesticProductionMT"
];

const NUM_ARGS = 1;
const USAGE_STR = "USAGE: npm run standalone [job]";


function loadJson(loc) {
    return new Promise((resolve, reject) => {
        fs.readFile(loc, "utf8", (error, data) => {
            if (error){
               reject(error);
               return;
            }
            resolve(JSON.parse(data));
        });
    });
}


function buildWorkspace(jobInfo) {
    const loadOutputData = (loc, targetYear) => {
        const loadRawData = () => {
            const results = [];
    
            return new Promise((resolve, reject) => {
                fs.createReadStream(loc)
                    .pipe(papaparse.parse(
                        papaparse.NODE_STREAM_INPUT,
                        { header: true }
                    ))
                    .on("data", (data) => {
                        const year = parseInt(data["year"]);
                        const included = year == targetYear;
                        if (included) {
                            results.push(data);
                        }
                    })
                    .on("end", () => {
                        resolve(results);
                    })
                    .on("error", () => {
                        reject(results);
                    });
            });
        };
    
        const createOutputs = (rawData) => {
            const workspaceOut = new Map();
            rawData.forEach((row) => {
                const region = row["region"];
                
                if (!workspaceOut.has(region)) {
                    workspaceOut.set(region, new Map());
                }
                
                const workspaceRegion = workspaceOut.get(region);
                DATA_ATTRS.forEach((attr) => {
                    const value = parseFloat(row[attr]);
                    workspaceRegion.set(attr, value);
                });
            });
            
            return workspaceOut;
        };
    
        return loadRawData().then(createOutputs);
    };

    const loadInputs = (rawInputs) => {
        return new Promise((resolve) => {
            const inputMap = new Map();
            rawInputs.forEach((lever) => {
                inputMap.set(lever["lever"], lever["value"]);
            });
            resolve(inputMap);
        });
    };
    
    const loadMeta = (targetYear) => {
        return new Promise((resolve) => {
            const workspaceMeta = new Map();
            workspaceMeta.set("year", targetYear);
            resolve(workspaceMeta);
        });
    };

    const promises = [
        loadOutputData(jobInfo["data"], jobInfo["year"]),
        loadInputs(jobInfo["inputs"]),
        loadMeta(jobInfo["year"])
    ];

    return Promise.all(promises).then((results) => {
        const outputs = results[0];
        const inputs = results[1];
        const meta = results[2];

        const workspace = new Map();
        workspace.set("out", outputs);
        workspace.set("in", inputs);
        workspace.set("meta", meta);

        return workspace;
    });
}


function buildLevers(jobInfo) {
    const loadLever = (loc) => {
        return fs.promises.open(loc, "r")
            .then(fileBuffer => fileBuffer.toString())
            .then()
    };
}


function main() {
    if (process.argv.length != NUM_ARGS + 2) {
        console.error(USAGE_STR);
        return;
    }

    const jobLoc = process.argv[2];

    const jobFuture = loadJson(jobLoc);

    jobFuture.then(buildWorkspace).then(
        (result) => { console.log("done"); },
        (error) => { console.error("error: " + error); }
    );
}


main();
