function buildPolymerTest() {

    const REGIONS = ["china", "eu30", "nafta", "row"];
    
    QUnit.module("polymer", function() {

        function addToVector(vector, key, value) {
            vector.set(key, vector.get(key) + value);
        }

        function isWithinTollerance(vector, key, expected) {
            return Math.abs(vector.get(key) - expected) < 0.00001;
        }

        QUnit.test("PolymerInfo key", function(assert) {
            const a = new PolymerInfo("subtype", "regionA", "polymer", "percent", "seriesA");
            const b = new PolymerInfo("subtype", "regionA", "polymer", "percent", "seriesB");
            const c = new PolymerInfo("subtype", "regionB", "polymer", "percent", "seriesA");
            assert.ok(a.getKey() === b.getKey());
            assert.ok(a.getKey() !== c.getKey());
        });

        QUnit.test("SubtypeInfo key", function(assert) {
            const a = new SubtypeInfo(2024, "region", "subtype", 1);
            const b = new SubtypeInfo(2024, "region", "subtype", 2);
            const c = new SubtypeInfo(2023, "region", "subtype", 1);
            assert.ok(a.getKey() === b.getKey());
            assert.ok(a.getKey() !== c.getKey());
        });

        QUnit.test("build matricies for polymer", function(assert) {
            const done = assert.async();
            const matrixFuture = buildMatricies();
            matrixFuture.then((modifier) => {
                const polymerInfo = modifier.getPolymer("china", "transportation", "ldpe");
                const error = Math.abs(polymerInfo.getPercent() - 0.1429);
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("build matricies for subtype", function(assert) {
            const done = assert.async();
            const matrixFuture = buildMatricies();
            matrixFuture.then((modifier) => {
                const polymerInfo = modifier.getSubtype(2048, "nafta", "50% otp, 50% ots");
                const ratio = polymerInfo.getRatio();
                assert.ok(ratio > 0);
                done();
            });
        });

        QUnit.test("query for non-textile polymer", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    new Map(),
                    2050,
                    "china",
                    "transportation",
                    "ldpe"
                );
                const error = Math.abs(percent - 0.1429);
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("query for non-textile polymer with additives", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            
            const inputs = new Map();
            inputs.set("chinaPercentTransportationAdditives", 1);

            const state = new Map();
            state.set("in", inputs);
            
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "transportation",
                    "ldpe"
                );
                const error = Math.abs(percent - (0.1429 * 0.99));
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("query for non-textile polymer with additives wind down", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            
            const inputs = new Map();
            inputs.set("chinaPercentTransportationAdditives", 1);
            inputs.set("chinaAdditivesPercentReduction", 80);
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);

            const state = new Map();
            state.set("in", inputs);
            
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "transportation",
                    "ldpe"
                );
                const multiplier = 1 - (0.01 * 0.2);
                const error = Math.abs(percent - (0.1429 * multiplier));
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("query for additives", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            
            const inputs = new Map();
            inputs.set("chinaPercentTransportationAdditives", 1);

            const state = new Map();
            state.set("in", inputs);
            
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "transportation",
                    "additives"
                );
                const error = Math.abs(percent - 0.01);
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("query for additives wind down", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            
            const inputs = new Map();
            inputs.set("chinaPercentTransportationAdditives", 1);
            inputs.set("chinaAdditivesPercentReduction", 80);
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);

            const state = new Map();
            state.set("in", inputs);
            
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "transportation",
                    "additives"
                );
                const error = Math.abs(percent - 0.01 * 0.2);
                assert.ok(error < 0.001);
                done();
            });
        });

        QUnit.test("query for textile polymer match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    new Map(),
                    2050,
                    "china",
                    "textiles",
                    "pp&a fibers"
                );
                const error = Math.abs(percent - 1);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("query for textile other polymer for match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    new Map(),
                    2050,
                    "china",
                    "textiles",
                    "other"
                );
                const error = Math.abs(percent - 0);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("query for textile textile polymer for non-match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent(
                    new Map(),
                    2050,
                    "china",
                    "other",
                    "pp&a fibers"
                );
                const error = Math.abs(percent - 0);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("get all polymers", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const allPolymers = modifier._getAllPolymers();
                assert.ok(allPolymers.size > 1);
                assert.ok(allPolymers.has("pp&a fibers"));
                done();
            });
        });

        QUnit.test("get net trade", function(assert) {
            const done = assert.async();

            const testMap = new Map();
            testMap.set("netImportsMT", 5);
            testMap.set("netExportsMT", 0);

            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier._getNetTrade(testMap);
                const error = Math.abs(5 - result);
                assert.ok(error < 0.0001);
                done();
            });
        });

        QUnit.test("get combine vectors", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();

            modifierFuture.then((modifier) => {
                const v1 = modifier._makeEmptyPolymersVector();
                addToVector(v1, "ldpe", 1);
                addToVector(v1, "hdpe", 2);

                const v2 = modifier._makeEmptyPolymersVector();
                addToVector(v2, "hdpe", 3);
                addToVector(v2, "pp", 4);

                const v3 = modifier._combinePolymerVectors(v1, v2);
                assert.ok(isWithinTollerance(v3, "ldpe", 1));
                assert.ok(isWithinTollerance(v3, "hdpe", 5));
                assert.ok(isWithinTollerance(v3, "pp", 4));
                done();
            });
        });

        QUnit.test("get textile polymers", function(assert) {
            const chinaMap = new Map();
            chinaMap.set("consumptionTextileMT", 1);

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const state = new Map();
            state.set("out", outMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier._getTextilePolymers("china", state, 2050);
                assert.ok(isWithinTollerance(result, "pp&a fibers", 1));
                done();
            });
        });

        QUnit.test("get goods polymers", function(assert) {
            const chinaMap = new Map();
            GOODS.map((x) => x["attr"]).forEach((attr, i) => {
                chinaMap.set(attr, i + 1);
            });

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const state = new Map();
            state.set("out", outMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier._getGoodsPolymers("china", state);
                assert.ok(Math.abs(result.get("pp")) > 0);
                assert.ok(isWithinTollerance(result, "pp&a fibers", 0));
                done();
            });
        });

        QUnit.test("get goods polymers", function(assert) {
            const chinaMap = new Map();
            GOODS.map((x) => x["attr"]).forEach((attr, i) => {
                chinaMap.set(attr, i + 1);
            });

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const inMap = new Map();
            inMap.set("chinaPercentTransportationAdditives", 1);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier._getGoodsPolymers("china", state);
                assert.ok(Math.abs(result.get("pp")) > 0);
                assert.ok(Math.abs(result.get("additives")) > 0);
                assert.ok(isWithinTollerance(result, "pp&a fibers", 0));
                done();
            });
        });

        QUnit.test("get trade polymers", function(assert) {
            const outMap = new Map();

            REGIONS.forEach((region) => {
                const regionMap = new Map();
                regionMap.set("consumptionTextileMT", 1);
                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                outMap.set(region, regionMap);
            });

            const inMap = new Map();
            inMap.set("chinaPercentTransportationAdditives", 1);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                modifier._addDetailedTrade(2050, state);
                const result = modifier._getTradePolymers(2050, "china", state, [TEXTILES_SUBTYPE]);
                assert.ok(isWithinTollerance(result, "pp", 0));
                assert.ok(isWithinTollerance(result, "additives", 0));
                assert.ok(result.get("pp&a fibers") < 0);
                done();
            });
        });

        QUnit.test("get trade polymers additives", function(assert) {
            const outMap = new Map();

            REGIONS.forEach((region) => {
                const regionMap = new Map();
                regionMap.set("consumptionPackagingMT", 1);
                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                outMap.set(region, regionMap);
            });

            const inMap = new Map();
            inMap.set("chinaPercentPackagingAdditives", 1);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                modifier._addDetailedTrade(2050, state);
                const result = modifier._getTradePolymers(2050, "china", state, ["packaging"]);
                assert.ok(result.get("additives") < 0);
                done();
            });
        });

        QUnit.test("modify to add polymers", function(assert) {
            const chinaMap = new Map();
            chinaMap.set("consumptionTextileMT", 1);
            chinaMap.set("netImportsMT", 0);
            chinaMap.set("netExportsMT", 10);
            GOODS.map((x) => x["attr"]).forEach((attr, i) => {
                chinaMap.set(attr, i + 2);
            });

            const inMap = new Map();
            inMap.set("chinaPercentTextileAdditives", 1);

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                modifier._addDetailedTrade(2050, state);
                const result = modifier._calculatePolymers(2050, state);
                assert.ok(result.has("polymers"));

                assert.ok(
                    result.get("polymers").get("china").get("consumption").get("pp&a fibers") > 0
                );
                assert.ok(
                    result.get("polymers").get("china").get("goodsTrade").get("pp&a fibers") < 0
                );

                assert.ok(
                    result.get("polymers").get("china").get("consumption").get("additives") > 0
                );
                assert.ok(
                    result.get("polymers").get("china").get("goodsTrade").get("additives") < 0
                );
                done();
            });
        });

        QUnit.test("modify to add global", function(assert) {
            const chinaMap = new Map();
            chinaMap.set("consumptionTextileMT", 1);
            chinaMap.set("netImportsMT", 0);
            chinaMap.set("netExportsMT", 10);
            GOODS.map((x) => x["attr"]).forEach((attr, i) => {
                chinaMap.set(attr, i + 2);
            });

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const state = new Map();
            state.set("out", outMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier._addOutputGlobalToStateAttrs(state, ["consumptionTextileMT"]);
                assert.ok(result.get("out").has("global"));
                done();
            });
        });

        QUnit.test("modify state add ghg", function(assert) {
            const inMap = new Map();
            const outMap = new Map();

            REGIONS.forEach((region) => {
                const regionMap = new Map();

                GOODS.forEach((info, i) => {
                    regionMap.set(info["attr"], i + 1);
                });

                RESIN_SUBTYPES.forEach((attr, i) => {
                    regionMap.set(attr, i + 1);
                });

                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                regionMap.set(TEXTILE_ATTR, 11);
                outMap.set(region, regionMap);

                GHGS.forEach((info, i) => {
                    inMap.set(region + info["leverName"] + "EmissionsProduction", i * 0.5);
                    inMap.set(region + info["leverName"] + "EmissionsConversion", i * 0.5);
                });

                EOLS.forEach((info, i) => {
                    inMap.set(region + info["leverName"] + "Emissions", i);
                    outMap.get(region).set(info["attr"], i);
                });
            });

            inMap.set("startYear", 2020);
            inMap.set("endYearImmediate", 2030);
            inMap.set("chinaPercentReducePs", 0);
            inMap.set("eu30PercentReducePs", 0);
            inMap.set("naftaPercentReducePs", 0);
            inMap.set("rowPercentReducePs", 0);
            inMap.set("chinaMinGHGReduction", 0);
            inMap.set("eu30MinGHGReduction", 0);
            inMap.set("naftaMinGHGReduction", 0);
            inMap.set("rowMinGHGReduction", 0);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier.modify(2050, state, ["consumptionTextileMT"]);
                assert.ok(result.has("ghg"));

                assert.ok(
                    result.get("ghg").get("china").get("consumption") > 0
                );
                assert.ok(
                    result.get("ghg").get("china").get("eol") > 0
                );
                assert.ok(
                    result.get("ghg").get("china").get("goodsTrade") < 0
                );
                assert.ok(
                    !isNaN(result.get("ghg").get("china").get("resinTrade"))
                );
                done();
            });
        });

        QUnit.test("modify state add ghg with offset", function(assert) {
            const inMap = new Map();
            const outMap = new Map();

            REGIONS.forEach((region) => {
                const regionMap = new Map();

                GOODS.forEach((info, i) => {
                    regionMap.set(info["attr"], i + 1);
                });

                RESIN_SUBTYPES.forEach((attr, i) => {
                    regionMap.set(attr, i + 1);
                });

                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                regionMap.set(TEXTILE_ATTR, 11);
                outMap.set(region, regionMap);

                GHGS.forEach((info, i) => {
                    inMap.set(region + info["leverName"] + "EmissionsProduction", i * 0.5);
                    inMap.set(region + info["leverName"] + "EmissionsConversion", i * 0.5);
                });

                EOLS.forEach((info, i) => {
                    inMap.set(region + info["leverName"] + "Emissions", i);
                    outMap.get(region).set(info["attr"], i);
                });
            });

            inMap.set("startYear", 2020);
            inMap.set("endYearImmediate", 2030);
            inMap.set("chinaPercentReducePs", 0);
            inMap.set("eu30PercentReducePs", 0);
            inMap.set("naftaPercentReducePs", 0);
            inMap.set("rowPercentReducePs", 0);
            inMap.set("chinaMinGHGReduction", 1);
            inMap.set("eu30MinGHGReduction", 0);
            inMap.set("naftaMinGHGReduction", 0);
            inMap.set("rowMinGHGReduction", 0);

            const state = new Map();
            state.set("out", outMap);
            state.set("in", inMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const result = modifier.modify(2050, state, ["consumptionTextileMT"]);
                assert.ok(result.has("ghg"));

                assert.ok(
                    result.get("ghg").get("china").get("consumption") > 0
                );
                assert.ok(
                    result.get("ghg").get("china").get("eol") > 0
                );
                assert.ok(
                    result.get("ghg").get("china").get("goodsTrade") < 0
                );
                assert.ok(
                    !isNaN(result.get("ghg").get("china").get("resinTrade"))
                );
                done();
            });
        });

        QUnit.test("get GHG", function(assert) {
            const inputs = new Map();
            inputs.set("chinaTestEmissionsProduction", 1.5);
            inputs.set("chinaTestEmissionsConversion", 0.5);
            
            const outputs = new Map();
            outputs.set("china", new Map());

            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);
            
            const result = getGhg(state, "china", 4000, "Test");
            const error = Math.abs(result - 8);
            assert.ok(error < 0.00001)
        });

        QUnit.test("get GHG with percent recyclable", function(assert) {
            const inputs = new Map();

            GHGS.map((x) => x["leverName"]).forEach((x, i) => {
                inputs.set("china" + x + "EmissionsProduction", 0);
                inputs.set("china" + x + "EmissionsConversion", 0);
            });
            inputs.set("chinaPETEmissionsProduction", 2);
            inputs.set("chinaPETEmissionsConversion", 1);

            const chinaOutputs = new Map();
            chinaOutputs.set("primaryProductionMT", 3);
            chinaOutputs.set("secondaryProductionMT", 1);
            
            const outputs = new Map();
            outputs.set("china", chinaOutputs);

            const productionPolymers = new Map();
            POLYMER_NAMES.forEach((x) => {
                productionPolymers.set(x, 0);
            });
            productionPolymers.set("pet", 3);
            
            const chinaPolymers = new Map();
            chinaPolymers.set("production", productionPolymers);
            
            const polymers = new Map();
            polymers.set("china", chinaPolymers);

            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);
            state.set("polymers", polymers);
            
            const result = getGhg(state, "china", 4000, "PET");
            const expected = (3 / 4 * 2 + 1) * 4000 * 0.001;
            const error = Math.abs(result - expected);
            assert.ok(error < 0.00001)
        });

        QUnit.test("get GHG with percent recyclable with non-recyclable", function(assert) {
            const inputs = new Map();

            GHGS.map((x) => x["leverName"]).forEach((x, i) => {
                inputs.set("china" + x + "EmissionsProduction", 0);
                inputs.set("china" + x + "EmissionsConversion", 0);
            });
            inputs.set("chinaPETEmissionsProduction", 2);
            inputs.set("chinaPETEmissionsConversion", 1);

            const chinaOutputs = new Map();
            chinaOutputs.set("primaryProductionMT", 3);
            chinaOutputs.set("secondaryProductionMT", 1);
            
            const outputs = new Map();
            outputs.set("china", chinaOutputs);

            const productionPolymers = new Map();
            POLYMER_NAMES.forEach((x) => {
                productionPolymers.set(x, 0);
            });
            productionPolymers.set("pet", 3);
            productionPolymers.set("other thermosets", 3);
            
            const chinaPolymers = new Map();
            chinaPolymers.set("production", productionPolymers);
            
            const polymers = new Map();
            polymers.set("china", chinaPolymers);

            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);
            state.set("polymers", polymers);
            
            const result = getGhg(state, "china", 4000, "PET");
            const expectedPercent = 1 - (1 / 4) / (1 / 2);
            const expected = (expectedPercent * 2 + 1) * 4000 * 0.001;
            const error = Math.abs(result - expected);
            assert.ok(error < 0.00001)
        });

        QUnit.test("add fully domestic ghg", function(assert) {
            const chinaOutputs = new Map();
            chinaOutputs.set("eolRecyclingMT", 1);
            chinaOutputs.set("eolLandfillMT", 2);
            chinaOutputs.set("eolIncinerationMT", 3);
            chinaOutputs.set("eolMismanagedMT", 4);
            chinaOutputs.set("netWasteExportMT", 0);
            chinaOutputs.set("netWasteImportMT", 1);

            const outputs = new Map();
            outputs.set("china", chinaOutputs);

            const chinaGhg = new Map();
            chinaGhg.set("consumption", 10);
            chinaGhg.set("goodsTrade", 1);
            chinaGhg.set("resinTrade", 2);
            chinaGhg.set("eol", 5);

            const ghg = new Map();
            ghg.set("china", chinaGhg);
            
            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);
            
            const finalizer = new GhgFinalizer();
            finalizer._getFullyDomesticGhg(state);

            assert.ok(isWithinTollerance(chinaGhg, "fullyDomesticProductGhg", 7));
            assert.ok(isWithinTollerance(chinaGhg, "fullyDomesticWasteGhg", 5 * 0.9));
        });

        QUnit.test("add trade ghg", function(assert) {
            const inputs = new Map();
            inputs.set("emissionPercentProductImporter", 30);
            inputs.set("emissionPercentWasteExporter", 40);

            const outputs = new Map();
            outputs.set("china", new Map());

            const ghg = new Map();
            const chinaGhg = new Map();
            ghg.set("china", chinaGhg);

            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);
            state.set("in", inputs);

            const ledger = new GhgTradeLedger();
            ledger.addImport("china", "Landfill", 10, 20);
            ledger.addExport("eu30", "Landfill", 10, 10);
            ledger.addImport("eu30", "pet", 5, 5);
            ledger.addExport("china", "pet", 5, 10);

            const finalizer = new GhgFinalizer();
            finalizer._addTradeGhg(state, ledger);

            assert.ok(isWithinTollerance(chinaGhg, "productTradeGhg", 0.7 * 10));
            assert.ok(isWithinTollerance(chinaGhg, "eolTradeGhg", 0.6 * 20));
        });

        QUnit.test("add overall ghg", function(assert) {
            const outputs = new Map();
            outputs.set("china", new Map());

            const chinaGhg = new Map();
            chinaGhg.set("fullyDomesticProductGhg", 1);
            chinaGhg.set("fullyDomesticWasteGhg", 2);
            chinaGhg.set("productTradeGhg", 3);
            chinaGhg.set("eolTradeGhg", 4);
            chinaGhg.set("policyGhgReduction", 0);

            const ghg = new Map();
            ghg.set("china", chinaGhg);

            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);

            const finalizer = new GhgFinalizer();
            finalizer._addOverallGhg(state);

            assert.ok(isWithinTollerance(chinaGhg, "overallGhg", 10));
        });

        QUnit.test("add overall ghg offset", function(assert) {
            const outputs = new Map();
            outputs.set("china", new Map());

            const chinaGhg = new Map();
            chinaGhg.set("fullyDomesticProductGhg", 1);
            chinaGhg.set("fullyDomesticWasteGhg", 2);
            chinaGhg.set("productTradeGhg", 3);
            chinaGhg.set("eolTradeGhg", 4);
            chinaGhg.set("policyGhgReduction", 1);

            const ghg = new Map();
            ghg.set("china", chinaGhg);

            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);

            const finalizer = new GhgFinalizer();
            finalizer._addOverallGhg(state);

            assert.ok(isWithinTollerance(chinaGhg, "overallGhg", 9));
        });

        QUnit.test("add global ghg", function(assert) {
            const outputs = new Map();
            outputs.set("china", new Map());
            outputs.set("eu30", new Map());

            const chinaGhg = new Map();
            chinaGhg.set("overallGhg", 1);

            const euGhg = new Map();
            euGhg.set("overallGhg", 2);

            const ghg = new Map();
            ghg.set("china", chinaGhg);
            ghg.set("eu30", euGhg);

            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);

            const finalizer = new GhgFinalizer();
            finalizer._addGlobalGhg(state);

            assert.ok(isWithinTollerance(ghg.get("global"), "overallGhg", 3));
        });

        QUnit.test("create ledger", function(assert) {
            const chinaOutputs = new Map();
            chinaOutputs.set("eolRecyclingMT", 1);
            chinaOutputs.set("eolLandfillMT", 2);
            chinaOutputs.set("eolIncinerationMT", 3);
            chinaOutputs.set("eolMismanagedMT", 4);
            chinaOutputs.set("netWasteExportMT", 0);
            chinaOutputs.set("netWasteImportMT", 1);
            
            const outputs = new Map();
            outputs.set("china", chinaOutputs);

            const chinaGhg = new Map();
            chinaGhg.set("overallGhg", 1);

            const ghg = new Map();
            ghg.set("china", chinaGhg);

            const chinaPolymers = new Map();
            const goodsTradePolymers = new Map();
            const resinTradePolymers = new Map();
            RESIN_SUBTYPES.forEach((subtype, i) => {
                goodsTradePolymers.set(subtype, 0);
                resinTradePolymers.set(subtype, 0);
            });
            goodsTradePolymers.set("pet", -2);
            chinaPolymers.set("goodsTrade", goodsTradePolymers);
            chinaPolymers.set("resinTrade", resinTradePolymers);

            const polymers = new Map();
            polymers.set("china", chinaPolymers);

            const inputs = new Map();
            const addEmissions = (key, value) => {
                inputs.set(key + "Production", value * 0.9);
                inputs.set(key + "Conversion", value * 0.1);
            };
            GHGS.forEach((info, i) => {
                addEmissions("china" + info["leverName"] + "Emissions", 0);
            });
            addEmissions("chinaPETEmissions", 5);
            inputs.set("chinaLandfillEmissions", 1);
            inputs.set("chinaRecyclingEmissions", 2);
            inputs.set("chinaIncinerationEmissions", 3);
            inputs.set("chinaMismanagedEmissions", 4);

            const state = new Map();
            state.set("out", outputs);
            state.set("ghg", ghg);
            state.set("polymers", polymers);
            state.set("in", inputs);

            const finalizer = new GhgFinalizer();
            const ledger = finalizer._buildLedger(state);

            assert.ok(isWithinTollerance(
                ledger._importVolumes,
                "china\tRecycling",
                1 / 10
            ));
            assert.ok(isWithinTollerance(
                ledger._exportVolumes,
                "china\tpet",
                2
            ));
            assert.ok(isWithinTollerance(
                ledger._ghgToDistribute,
                "Recycling",
                1 / 10 * 2 * 0.001
            ));
            assert.ok(isWithinTollerance(
                ledger._ghgToDistribute,
                "pet",
                2 * 5 * 0.001
            ));
            assert.ok(isWithinTollerance(
                ledger._actualGhg,
                "china\tRecycling",
                1 / 10 * 2 * 0.001
            ));
            assert.ok(isWithinTollerance(
                ledger._actualGhg,
                "china\tpet",
                2 * 5 * 0.001
            ));
        });

        QUnit.test("get percent packaging ps remaining", function(assert) {
            const done = assert.async();
    
            const inputs = new Map();
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);
            inputs.set("chinaPercentReducePs", 80);
    
            const state = new Map();
            state.set("in", inputs);
    
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const before = modifier._getPercentPackagingPsRemaining(state, 2010, "china");
                assert.ok(Math.abs(before - 1) < 0.0001);
    
                const mid = modifier._getPercentPackagingPsRemaining(state, 2025, "china");
                assert.ok(Math.abs(mid - 0.6) < 0.0001);
    
                const after = modifier._getPercentPackagingPsRemaining(state, 2040, "china");
                assert.ok(Math.abs(after - 0.2) < 0.0001);
                done();
            });
        });

        QUnit.test("make polymer overrides noop", function(assert) {
            const done = assert.async();
    
            const inputs = new Map();
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);
            inputs.set("chinaPercentReducePs", 0);
            inputs.set("eu30PercentReducePs", 0);
            inputs.set("naftaPercentReducePs", 0);
            inputs.set("rowPercentReducePs", 0);

            const outputs = new Map();
            outputs.set("china", new Map());
            outputs.set("eu30", new Map());
            outputs.set("nafta", new Map());
            outputs.set("row", new Map());
    
            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);

            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const priorPS = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "ps"
                );
                const priorPP = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "pp"
                );

                modifier._addOverrides(state, 2040);
                assert.ok(state.has("polymerOverrides"));
                
                const newPS = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "ps"
                );
                const newPP = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "pp"
                );

                assert.ok(Math.abs(newPS - priorPS) < 0.0001);
                assert.ok(Math.abs(newPP - priorPP) < 0.0001);

                done();
            });
        });

        QUnit.test("make polymer overrides", function(assert) {
            const done = assert.async();
    
            const inputs = new Map();
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);
            inputs.set("chinaPercentReducePs", 80);
            inputs.set("eu30PercentReducePs", 0);
            inputs.set("naftaPercentReducePs", 0);
            inputs.set("rowPercentReducePs", 0);

            const outputs = new Map();
            outputs.set("china", new Map());
            outputs.set("eu30", new Map());
            outputs.set("nafta", new Map());
            outputs.set("row", new Map());
    
            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);

            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const priorPS = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "ps"
                );
                const priorPP = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "pp"
                );

                modifier._addOverrides(state, 2040);
                assert.ok(state.has("polymerOverrides"));
                
                const newPS = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "ps"
                );
                const newPP = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "pp"
                );

                assert.ok(newPS < priorPS);
                assert.ok(newPP > priorPP);

                done();
            });
        });

        QUnit.test("use polymer overrides", function(assert) {
            const done = assert.async();
    
            const inputs = new Map();
            inputs.set("startYear", 2020);
            inputs.set("endYearImmediate", 2030);
            inputs.set("chinaPercentReducePs", 100);
            inputs.set("eu30PercentReducePs", 0);
            inputs.set("naftaPercentReducePs", 0);
            inputs.set("rowPercentReducePs", 0);

            const outputs = new Map();
            outputs.set("china", new Map());
            outputs.set("eu30", new Map());
            outputs.set("nafta", new Map());
            outputs.set("row", new Map());
    
            const state = new Map();
            state.set("in", inputs);
            state.set("out", outputs);

            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                modifier._addOverrides(state, 2040);
                const newPSChina = modifier._getPolymerPercent(
                    state,
                    2050,
                    "china",
                    "packaging",
                    "ps"
                );
                assert.ok(Math.abs(newPSChina) < 0.0001);
                const newPSNafta = modifier._getPolymerPercent(
                    state,
                    2050,
                    "nafta",
                    "packaging",
                    "ps"
                );
                assert.ok(Math.abs(newPSNafta) > 0.0001);
                done();
            });
        });
    });
}


export {buildPolymerTest};
