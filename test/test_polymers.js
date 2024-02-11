function buildPolymerTest() {
    
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
                const error = Math.abs(polymerInfo.getPercent() - 0.01);
                assert.ok(error < 0.00001);
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
                const percent = modifier._getPolymerPercent("china", "transportation", "ldpe")
                const error = Math.abs(percent - 0.01);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("query for textile polymer match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent("china", "textiles", "pp&a fibers")
                const error = Math.abs(percent - 1);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("query for textile other polymer for match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent("china", "textiles", "other")
                const error = Math.abs(percent - 0);
                assert.ok(error < 0.00001);
                done();
            });
        });

        QUnit.test("query for textile textile polymer for non-match", function(assert) {
            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                const percent = modifier._getPolymerPercent("china", "other", "pp&a fibers")
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
                const result = modifier._getTextilePolymers("china", state);
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

        QUnit.test("get trade polymers", function(assert) {
            const outMap = new Map();

            ["china", "eu30", "nafta", "row"].forEach((region) => {
                const regionMap = new Map();
                regionMap.set("consumptionTextileMT", 1);
                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                outMap.set(region, regionMap);
            });

            const state = new Map();
            state.set("out", outMap);

            const done = assert.async();
            const modifierFuture = buildModifier();
            modifierFuture.then((modifier) => {
                modifier._addDetailedTrade(2050, state);
                const result = modifier._getTradePolymers(2050, "china", state, [TEXTILES_SUBTYPE]);
                assert.ok(isWithinTollerance(result, "pp", 0));
                assert.ok(result.get("pp&a fibers") < 0);
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

            const outMap = new Map();
            outMap.set("china", chinaMap);

            const state = new Map();
            state.set("out", outMap);

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
                const result = modifier._addGlobalToStateAttrs(state, ["consumptionTextileMT"]);
                assert.ok(result.get("out").has("global"));
                done();
            });
        });

        QUnit.test("modify state add ghg", function(assert) {
            const inMap = new Map();
            const outMap = new Map();

            ["china", "eu30", "nafta", "row"].forEach((region) => {
                const regionMap = new Map();

                GOODS.forEach((info, i) => {
                    regionMap.set(info["attr"], i + 1);
                });

                regionMap.set("netImportsMT", 0);
                regionMap.set("netExportsMT", 10);
                regionMap.set(TEXTILE_ATTR, 11);
                outMap.set(region, regionMap);

                GHGS.forEach((info, i) => {
                    inMap.set(region + info["leverName"] + "Emissions", i);
                });
            });

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
                    result.get("ghg").get("china").get("goodsTrade") < 0
                );
                assert.ok(
                    result.get("ghg").get("china").get("resinTrade") < 0
                );
                done();
            });
        });
    });
}


export {buildPolymerTest};
