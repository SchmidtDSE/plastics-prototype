/**
 * Entry point for the standalone engine.
 *
 * @license BSD, see LICENSE.md
 */

import fs from "fs";

import papaparse from "papaparse";
import handlebars from "handlebars";

import {CompileVisitor, toolkit} from "./standalone_visitors.js";

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
    "consumptionTransportationMT",
    "consumptionTextileMT",
    "consumptionOtherMT",
    "netImportsMT",
    "netExportsMT",
    "primaryProductionMT",
    "secondaryProductionMT",
    "netWasteExportMT",
    "netWasteImportMT",
];

const NUM_ARGS = 3;
const USAGE_STR = "USAGE: npm run standalone [job] [output] [error]";


/**
 * Load a JSON file with promises.
 *
 * @param loc File path
 * @returns Promise resolving to parsed json.
 */
function loadJson(loc) {
    return fs.promises.readFile(loc)
        .then((data) => JSON.parse(data));
}


/**
 * Write to a JSON file with promises.
 *
 * @param payload The contents to serialize and write.
 * @param loc File path
 * @returns Promise resolving after writing.
 */
function writeJson(payload, loc) {
    return fs.promises.writeFile(loc, JSON.stringify(payload, null, 4));
}


/**
 * Scaffold the workspace.
 *
 * @param jobInfo Contents of the JSON job description file.
 * @returns Promsie that resolves after the workspace is created.
 */
function buildWorkspace(jobInfo) {
    const loadOutputData = (loc, targetYear) => {
        const loadRawData = () => {
            const results = [];

            return new Promise((resolve, reject) => {
                fs.createReadStream(loc)
                    .pipe(papaparse.parse(
                        papaparse.NODE_STREAM_INPUT,
                        {header: true},
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
                workspaceRegion.set("eolReuseMT", 0);
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
        loadMeta(jobInfo["year"]),
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


/**
 * Build lever representations.
 *
 * @param jobInfo Contents of the JSON job description file.
 * @returns Promise resolving to the levers with compiled code.
 */
function buildLevers(jobInfo) {
    const parseProgram = (input, loc) => {
        if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
            return null;
        }

        const errors = [];

        const chars = new toolkit.antlr4.InputStream(input);
        const lexer = new toolkit.PlasticsLangLexer(chars);
        lexer.removeErrorListeners();
        lexer.addErrorListener({
            syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
                const result = `${loc} line ${line} col ${column}: ${msg}`;
                errors.push(result);
            },
        });

        const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
        const parser = new toolkit.PlasticsLangParser(tokens);

        parser.buildParsePlastics = true;
        parser.removeErrorListeners();
        parser.addErrorListener({
            syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
                const result = `${loc} line ${line}, col ${column}: ${msg}`;
                errors.push(result);
            },
        });

        const programUncompiled = parser.program();

        if (errors.length > 0) {
            throw errors[0];
        }

        const program = programUncompiled.accept(new CompileVisitor());
        if (errors.length > 0) {
            throw errors[0];
        }

        return program;
    };

    const loadProgram = (loc, templateVals) => {
        return fs.promises.readFile(loc)
            .then((x) => x.toString())
            .then((x) => handlebars.compile(x))
            .then((x) => x(templateVals))
            .then((x) => parseProgram(x, loc));
    };

    const baseUrl = jobInfo["levers"];

    return loadJson(baseUrl + "/index.json")
        .then((rawResult) => {
            return rawResult["categories"].flatMap(
                (category) => category["levers"],
            );
        })
        .then((leversRaw) => {
            return new Promise((resolve, reject) => {
                const programFutures = leversRaw.map((raw) => {
                    const fullUrl = baseUrl + "/" + raw["template"];
                    const templateVals = raw["attrs"];
                    return {
                        "url": fullUrl,
                        "templateVals": templateVals,
                    };
                }).map((x) => loadProgram(x["url"], x["templateVals"]));

                Promise.all(programFutures).then((programs) => {
                    for (let i = 0; i < programs.length; i++) {
                        leversRaw[i]["compiled"] = programs[i];
                    }

                    resolve(leversRaw);
                }, reject);
            });
        });
}


/**
 * Add the levers to a workspace.
 *
 * @param workspace The workspace in which to add the levers.
 * @param levers The levers to be added.
 * @returns Reference to the workspace which has been modified in place.
 */
function consolidateWorkspace(workspace, levers) {
    workspace.set("levers", levers);

    const workspaceInputs = workspace.get("in");

    levers.forEach((lever) => {
        const defaultValue = lever["default"];
        const variableName = lever["variable"];
        if (!workspaceInputs.has(variableName)) {
            workspaceInputs.set(variableName, defaultValue);
        }
    });

    return workspace;
}


/**
 * Execute all of the levers in a workspace.
 *
 * @param workspace The workspace in which to execute.
 * @returns Reference to workspace which was modified in place.
 */
function executeWorkspace(workspace) {
    const levers = workspace.get("levers");
    levers.filter((x) => x["compiled"] !== null).forEach((lever) => {
        workspace.set("local", new Map());
        workspace.set("inspect", []);
        lever["compiled"](workspace);
    });
    return workspace;
}


/**
 * Serialize outputs from having run a simulation in the stand-alone engine.
 *
 * @param workspace The workspace to serialize.
 * @returns The serialization (simple JS object).
 */
function serializeOutputs(workspace) {
    const output = {};
    const regions = workspace.get("out");
    regions.forEach((regionVars, region) => {
        const regionOutput = {};
        regionVars.forEach((value, name) => {
            regionOutput[name] = value;
        });
        output[region] = regionOutput;
    });
    return output;
}


/**
 * Main script entry point
 */
function main() {
    if (process.argv.length != NUM_ARGS + 2) {
        console.error(USAGE_STR);
        return;
    }

    const jobLoc = process.argv[2];
    const outputLoc = process.argv[3];
    const errorLoc = process.argv[4];
    const jobFuture = loadJson(jobLoc);

    const futureWorkspace = jobFuture.then(buildWorkspace);
    const futureLevers = jobFuture.then(buildLevers).then((levers) => {
        levers.sort((a, b) => {
            const diff = a["priority"] - b["priority"];
            if (Math.abs(diff) < 0.00001) {
                return a["variable"].localeCompare(b["variable"]);
            } else {
                return diff;
            }
        });
        return levers;
    });

    const downstreamFutures = [futureWorkspace, futureLevers];

    Promise.all(downstreamFutures)
        .then((x) => consolidateWorkspace(x[0], x[1]))
        .then(executeWorkspace)
        .then(serializeOutputs)
        .then((workspace) => writeJson(workspace, outputLoc))
        .then(
            (x) => console.log("done"),
            (x) => {
                console.log("error: " + x);
                return fs.promises.writeFile(errorLoc, x);
            },
        );
}


main();
