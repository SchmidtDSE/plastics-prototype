const CACHE_BUSTER = Date.now();

const GOODS = [
    {"attr": "consumptionTransporationMT", "subtype": "transportation"},
    {"attr": "consumptionPackagingMT", "subtype": "packaging"},
    {"attr": "consumptionConstructionMT", "subtype": "building_construction"},
    {"attr": "consumptionElectronicMT", "subtype": "electrical_electronic"},
    {"attr": "consumptionHouseholdLeisureSportsMT", "subtype": "household_leisure_sports"},
    {"attr": "consumptionAgricultureMT", "subtype": "agriculture"},
    {"attr": "consumptionOtherMT", "subtype": "others"},
];

const RESIN_SUBTYPES = [
    "pp",
    "ps",
    "pvc",
    "100% otp",
    "50% otp, 50% ots",
    "pet",
    "pur",
];

const GHGS = [
    {"leverName": "PET", "polymerName": "pet"},
    {"leverName": "HDPE", "polymerName": "hdpe"},
    {"leverName": "PVC", "polymerName": "pvc"},
    {"leverName": "LLDPE", "polymerName": "ldpe"},
    {"leverName": "PP", "polymerName": "pp"},
    {"leverName": "PS", "polymerName": "ps"},
    {"leverName": "PUR", "polymerName": "pur"},
    {"leverName": "PPA", "polymerName": "pp&a fibers"},
    {"leverName": "Additives", "polymerName": "additives"},
    {"leverName": "Others", "polymerName": "other thermoplastics"},
    {"leverName": "Others", "polymerName": "other thermosets"},
];

const EOLS = [
    {"leverName": "Landfill", "attr": "eolLandfillMT"},
    {"leverName": "Incineration", "attr": "eolIncinerationMT"},
    {"leverName": "Recycling", "attr": "eolRecyclingMT"},
    {"leverName": "Mismanaged", "attr": "eolMismanagedMT"},
];

const MAX_NORM_ITERATIONS = 20;

const TEXTILE_POLYMER = "pp&a fibers";
const TEXTILE_ATTR = "consumptionTextileMT";
const TEXTILES_SUBTYPE = "textiles";


class PolymerInfo {
    constructor(subtype, region, polymer, percent, series) {
        const self = this;
        self._subtype = subtype;
        self._region = region;
        self._polymer = polymer;
        self._percent = percent;
        self._series = series;
    }

    getSubtype() {
        const self = this;
        return self._subtype;
    }

    getRegion() {
        const self = this;
        return self._region;
    }

    getPolymer() {
        const self = this;
        return self._polymer;
    }

    getPercent() {
        const self = this;
        return self._percent;
    }

    getSeries() {
        const self = this;
        return self._series;
    }

    getKey() {
        const self = this;
        return getPolymerKey(self._region, self._subtype, self._polymer);
    }
}


function getPolymerKey(region, subtype, polymer) {
    return region + "\t" + subtype + "\t" + polymer;
}


class SubtypeInfo {
    constructor(year, region, subtype, ratio) {
        const self = this;
        self._year = year;
        self._region = region;
        self._subtype = subtype;
        self._ratio = ratio;
    }

    getYear() {
        const self = this;
        return self._year;
    }

    getRegion() {
        const self = this;
        return self._region;
    }

    getSubtype() {
        const self = this;
        return self._subtype;
    }

    getRatio() {
        const self = this;
        return self._ratio;
    }

    getKey() {
        const self = this;
        return getSubtypeKey(self._year, self._region, self._subtype);
    }
}


function getSubtypeKey(year, region, subtype) {
    return year + "\t" + region + "\t" + subtype;
}


class ResinTrade {
    constructor(year, region, netImportResin) {
        const self = this;
        self._year = year;
        self._region = region;
        self._netImportResin = netImportResin;
    }

    getYear() {
        const self = this;
        return self._year;
    }

    getRegion() {
        const self = this;
        return self._region;
    }

    getNetImportResin() {
        const self = this;
        return self._netImportResin;
    }

    getKey() {
        const self = this;
        return getResinTradeKey(self._year, self._region);
    }
}


function getResinTradeKey(year, region) {
    return year + "\t" + region;
}


class PolymerMatricies {
    constructor() {
        const self = this;
        self._polymerInfos = new Map();
        self._subtypeInfos = new Map();
        self._resinTradeInfos = new Map();

        self._subtypes = new Set();
        self._years = new Set();
        self._regions = new Set();
        self._polymers = new Set();
        self._series = new Set();
    }

    addPolymer(target) {
        const self = this;
        self._polymerInfos.set(target.getKey(), target);
        self._subtypes.add(target.getSubtype());
        self._regions.add(target.getRegion());
        self._polymers.add(target.getPolymer());
        self._series.add(target.getSeries());
    }

    getPolymer(region, subtype, polymer) {
        const self = this;
        const key = getPolymerKey(region, subtype, polymer);
        return self._polymerInfos.get(key);
    }

    addSubtype(target) {
        const self = this;
        self._subtypeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
        self._subtypes.add(target.getSubtype());
    }

    getSubtype(year, region, subtype) {
        const self = this;
        const key = getSubtypeKey(year, region, subtype);
        return self._subtypeInfos.get(key);
    }

    addResinTrade(target) {
        const self = this;
        self._resinTradeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
    }

    getResinTrade(year, region) {
        const self = this;
        const key = getResinTradeKey(year, region);
        return self._resinTradeInfos.get(key);
    }

    getSubtypes() {
        const self = this;
        return self._subtypes;
    }

    getRegions() {
        const self = this;
        return self._regions;
    }

    getPolymers() {
        const self = this;
        return self._polymers;
    }

    getSeries() {
        const self = this;
        return self._series;
    }
}

class ImmutablePolymerMatricies {
    constructor(inner) {
        const self = this;
        self._inner = inner;
    }

    getPolymer(region, subtype, polymer) {
        const self = this;
        return self._inner.getPolymer(region, subtype, polymer);
    }

    getSubtype(year, region, subtype) {
        const self = this;
        return self._inner.getSubtype(year, region, subtype);
    }

    getResinTrade(year, region) {
        const self = this;
        return self._inner.getResinTrade(year, region);
    }

    getSubtypes() {
        const self = this;
        return self._inner.getSubtypes();
    }

    getRegions() {
        const self = this;
        return self._inner.getRegions();
    }

    getPolymers() {
        const self = this;
        return self._inner.getPolymers();
    }

    getSeries() {
        const self = this;
        return self._inner.getSeries();
    }
}


class StateModifier {
    constructor(matricies) {
        const self = this;
        self._matricies = matricies;
    }

    modify(year, state, attrs) {
        const self = this;

        // Make override
        self._addOverrides(state, year);

        // Prepare polymers
        self._addDetailedTrade(year, state);
        self._normalizeDetailedTrade(year, state);
        self._calculatePolymers(year, state);

        // Prepare GHG
        self._makeGhgInState(state);
        self._calculateStartOfLifeGhg(state);
        self._calculateEndOfLifeGhg(state);

        // Create summation
        self._addOutputGlobalToStateAttrs(state, attrs);
        self._calculateOverallGhg(year, state);

        return state;
    }

    _addOverrides(state, year) {
        const self = this;
        const overrides = new Map();

        // Deal with PS in packaging
        const regions = Array.of(...state.get("out").keys());
        regions.forEach((region) => {
            const packagingPolymers = new Map();
            const polymerNames = GHGS.map((x) => x["polymerName"]);

            polymerNames.forEach((polymer) => {
                const polymerPercent = self._getPolymerPercent(state, region, "packaging", polymer);
                packagingPolymers.set(polymer, polymerPercent);
            });

            const percentRemaining = self._getPercentPackagingPsRemaining(state, year, region);
            const newPs = packagingPolymers.get("ps") * percentRemaining;
            const changePs = packagingPolymers.get("ps") * (1 - percentRemaining);
            packagingPolymers.set("ps", newPs);

            const otherPolymers = polymerNames.filter((x) => x !== "ps");
            const individualAdjValues = otherPolymers.map((x) => packagingPolymers.get(x));
            const otherTotal = individualAdjValues.reduce((a, b) => a + b);
            
            otherPolymers.forEach((x) => {
                const currentValue = packagingPolymers.get(x);
                const percentOfOther = currentValue / otherTotal;
                const offset = percentOfOther * changePs;
                packagingPolymers.set(x, offset + currentValue);
            });

            polymerNames.forEach((polymer) => {
                const key = self._getOverrideKey(region, "packaging", polymer);
                overrides.set(key, packagingPolymers.get(polymer));
            });
        });

        state.set("polymerOverrides", overrides);

        return state;
    }

    _getPercentPackagingPsRemaining(state, year, region) {
        const self = this;
        const inputs = state.get("in");

        const startYear = inputs.get("startYear");
        const endYear = inputs.get("endYearImmediate");
        if (year < startYear) {
            return 1;
        }

        const percentReductionTarget = inputs.get(region + "PercentReducePs") / 100;
        const done = year >= endYear;
        const duration = endYear - startYear;
        const yearsEllapsed = year - startYear;
        const percentReductionInterpolate = yearsEllapsed / duration * percentReductionTarget;
        const percentReduction = done ? percentReductionTarget : percentReductionInterpolate;

        return 1 - percentReduction;
    }

    _makeGhgInState(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const ghgMap = new Map();
        regions.forEach((region) => {
            ghgMap.set(region, new Map());
        });
        state.set("ghg", ghgMap);
        return state;
    }

    _addDetailedTrade(year, state) {
        const self = this;
        const subtypes = self._getAllSubtypes();
        const regions = Array.of(...state.get("out").keys());
        const tradeMap = new Map();
        regions.forEach((region) => {
            const out = state.get("out").get(region);
            const netTrade = self._getNetTrade(out);
            const regionMap = new Map();
            subtypes.forEach((subtype) => {
                const subtypeInfo = self._matricies.getSubtype(year, region, subtype);
                const ratio = subtypeInfo.getRatio();
                const subtypeVolume = ratio * netTrade;
                regionMap.set(subtype, subtypeVolume);
            });
            tradeMap.set(region, regionMap);
        });
        state.set("trade", tradeMap);
        return state;
    }

    _calculatePolymers(year, state) {
        const self = this;

        const regions = Array.of(...state.get("out").keys());
        const polymerMap = new Map();
        regions.forEach((region) => {
            const goodsPolymers = self._getGoodsPolymers(region, state);
            const textilePolymers = self._getTextilePolymers(region, state);
            const consumptionPolymers = self._combinePolymerVectors(goodsPolymers, textilePolymers);

            const goodsSubtypes = GOODS.map((x) => x["subtype"]);
            const getTrade = (subtypes) => {
                return self._getTradePolymers(year, region, state, subtypes);
            };

            const goodsTradeSubtypes = [goodsSubtypes, [TEXTILES_SUBTYPE]];
            const goodsTradePolymersSeparate = goodsTradeSubtypes.map(getTrade);
            const goodsTradePolymers = goodsTradePolymersSeparate.reduce(
                (a, b) => self._combinePolymerVectors(a, b),
            );

            const resinTradePolymers = getTrade(RESIN_SUBTYPES);

            const polymerSubmap = new Map();
            polymerSubmap.set("consumption", consumptionPolymers);
            polymerSubmap.set("goodsTrade", goodsTradePolymers);
            polymerSubmap.set("resinTrade", resinTradePolymers);

            polymerMap.set(region, polymerSubmap);
        });
        state.set("polymers", polymerMap);
        return state;
    }

    _getAllPolymers() {
        const self = this;
        const nativePolymers = self._matricies.getPolymers();
        return new Set([...nativePolymers, TEXTILE_POLYMER]);
    }

    _getAllSubtypes() {
        const self = this;
        const nativeSubtypes = self._matricies.getSubtypes();
        return new Set([...nativeSubtypes, TEXTILES_SUBTYPE]);
    }

    _getGoodsPolymers(region, state) {
        const self = this;
        const out = state.get("out").get(region);
        const polymers = self._getAllPolymers();

        const vectors = GOODS.map((info) => {
            const vector = self._makeEmptyPolymersVector();
            const volume = out.get(info["attr"]);
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(state, region, info["subtype"], polymer);
                const polymerVolume = percent * volume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });
            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    _getTextilePolymers(region, state) {
        const self = this;
        const out = state.get("out").get(region);
        const vector = self._makeEmptyPolymersVector();
        const volume = out.get(TEXTILE_ATTR);
        const newTotal = vector.get(TEXTILE_POLYMER) + volume;
        vector.set(TEXTILE_POLYMER, newTotal);
        return vector;
    }

    _getTradePolymers(year, region, state, subtypes) {
        const self = this;
        const polymers = self._getAllPolymers();
        const tradeVolumes = state.get("trade").get(region);

        const vectors = subtypes.map((subtype) => {
            const subtypeVolume = tradeVolumes.get(subtype);

            const vector = self._makeEmptyPolymersVector();
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(state, region, subtype, polymer);
                const polymerVolume = percent * subtypeVolume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });

            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    _getNetTrade(regionOutputs) {
        const self = this;
        return regionOutputs.get("netImportsMT") - regionOutputs.get("netExportsMT");
    }

    _makeEmptyPolymersVector() {
        const self = this;
        const vector = new Map();
        vector.set("ldpe", 0);
        vector.set("hdpe", 0);
        vector.set("pp", 0);
        vector.set("ps", 0);
        vector.set("pvc", 0);
        vector.set("pet", 0);
        vector.set("pur", 0);
        vector.set("pp&a fibers", 0);
        vector.set("other thermoplastics", 0);
        vector.set("other thermosets", 0);
        return vector;
    }

    _combinePolymerVectors(a, b) {
        const self = this;
        const vector = new Map();
        const add = (key) => {
            vector.set(key, a.get(key) + b.get(key));
        };
        add("ldpe");
        add("hdpe");
        add("pp");
        add("ps");
        add("pvc");
        add("pet");
        add("pur");
        add("pp&a fibers");
        add("other thermoplastics");
        add("other thermosets");
        return vector;
    }

    _getPolymerPercent(state, region, subtype, polymer) {
        const self = this;
        if (state.has("polymerOverrides")) {
            const overrides = state.get("polymerOverrides");
            const overrideKey = self._getOverrideKey(region, subtype, polymer);
            if (overrides.has(overrideKey)) {
                return overrides.get(overrideKey);
            }
        }
        if (subtype === TEXTILES_SUBTYPE) {
            if (polymer === TEXTILE_POLYMER) {
                return 1;
            } else {
                return 0;
            }
        } else {
            if (polymer === TEXTILE_POLYMER) {
                return 0;
            } else {
                const polymerInfo = self._matricies.getPolymer(region, subtype, polymer);
                if (polymerInfo === undefined) {
                    return 0;
                }
                const percent = polymerInfo.getPercent();
                return percent;
            }
        }
    }

    _normalizeDetailedTrade(year, state) {
        const self = this;
        const regions = Array.from(self._matricies.getRegions());
        regions.sort();

        const out = state.get("out");

        const goodsTradeSubtypes = GOODS.map((x) => x["subtype"]);
        const goodsTradeTotals = new Map();
        regions.forEach((region) => {
            goodsTradeTotals.set(region, self._getNetTrade(out.get(region)));
        });
        self._normalizeDetailedTradeSeries(state, goodsTradeSubtypes, goodsTradeTotals, regions);

        const resinTradeTotals = new Map();
        regions.forEach((region) => {
            resinTradeTotals.set(
                region,
                self._matricies.getResinTrade(year, region).getNetImportResin(),
            );
        });
        self._normalizeDetailedTradeSeries(state, RESIN_SUBTYPES, resinTradeTotals, regions);
    }

    _normalizeDetailedTradeSeries(state, seriesSubtypes, seriesTotals, regions) {
        const self = this;
        const tradeMap = state.get("trade");

        const getRegionTotal = (region) => {
            const regionTrade = tradeMap.get(region);
            const values = seriesSubtypes.map((subtype) => regionTrade.get(subtype));
            return values.reduce((a, b) => a + b);
        };

        const getSubtypeTotal = (subtype) => {
            const values = regions.map((region) => tradeMap.get(region).get(subtype));
            return values.reduce((a, b) => a + b);
        };

        const getScaling = (delta) => {
            const deltaAbs = Math.abs(delta);
            if (deltaAbs < 1) {
                return 0;
            } else if (deltaAbs < 10) {
                return deltaAbs / 10;
            } else {
                return 1;
            }
        };

        const smoothRegion = (region) => {
            const origTotal = seriesTotals.get(region);
            const newTotal = getRegionTotal(region);
            const delta = origTotal - newTotal;
            const scaling = getScaling(delta);

            if (scaling == 0) {
                return;
            }

            const values = seriesSubtypes.map((subtype) => tradeMap.get(region).get(subtype));
            const absTotal = values.map((x) => Math.abs(x)).reduce((a, b) => a + b);

            seriesSubtypes.forEach((subtype) => {
                const originalVal = tradeMap.get(region).get(subtype);
                const newVal = Math.abs(originalVal) / absTotal * delta * scaling + originalVal;
                tradeMap.get(region).set(subtype, newVal);
            });
        };

        const smoothSubtype = (subtype) => {
            const subtypeTotal = getSubtypeTotal(subtype);
            const scaling = getScaling(subtypeTotal);

            if (scaling == 0) {
                return;
            }

            const avg = subtypeTotal / seriesSubtypes.length;
            regions.forEach((region) => {
                const originalVal = tradeMap.get(region).get(subtype);
                const newVal = originalVal - avg * scaling;
                tradeMap.get(region).set(subtype, newVal);
            });
        };

        const getRegionError = (region) => {
            return Math.abs(getRegionTotal(region) - seriesTotals.get(region));
        };

        const getSubtypeError = (subtype) => {
            return Math.abs(getSubtypeTotal(subtype));
        };

        const getMaxError = () => {
            const regionErrors = regions.map(getRegionError);
            const maxRegionError = regionErrors.reduce((a, b) => a > b ? a : b);
            const subtypesErrors = seriesSubtypes.map(getSubtypeError);
            const maxSubtypesError = subtypesErrors.reduce((a, b) => a > b ? a : b);
            return maxSubtypesError > maxRegionError ? maxSubtypesError : maxRegionError;
        };

        const errors = [];
        for (let i = 0; i < MAX_NORM_ITERATIONS; i++) {
            const maxError = getMaxError();
            if (maxError <= 1) {
                return state;
            }
            errors.push(maxError);

            seriesSubtypes.forEach((subtype) => {
                smoothSubtype(subtype);
                regions.forEach((region) => {
                    smoothRegion(region);
                });
            });
        }

        return state;
    }

    _calculateStartOfLifeGhg(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const polymerVolumes = state.get("polymers");
        const ghgMap = state.get("ghg");

        const getEmissionsForPolymers = (region, polymers) => {
            const emissions = GHGS.map((ghgInfo) => {
                const polymerName = ghgInfo["polymerName"];
                if (polymers.has(polymerName)) {
                    const volume = polymers.get(ghgInfo["polymerName"]);
                    const leverName = ghgInfo["leverName"];
                    return getGhg(state, region, volume, leverName);
                } else {
                    return 0;
                }
            });
            return emissions.reduce((a, b) => a + b);
        };

        regions.forEach((region) => {
            const regionGhgMap = ghgMap.get(region);
            const regionPolymerVolumes = polymerVolumes.get(region);

            const calculateForKey = (key) => {
                const polymerVolumes = regionPolymerVolumes.get(key);
                const ghgEmissions = getEmissionsForPolymers(region, polymerVolumes);
                regionGhgMap.set(key, ghgEmissions);
            };

            calculateForKey("consumption");
            calculateForKey("goodsTrade");
            calculateForKey("resinTrade");
        });

        return state;
    }

    _calculateEndOfLifeGhg(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const inputs = state.get("in");
        const outputs = state.get("out");
        const ghgMap = state.get("ghg");

        regions.forEach((region) => {
            const regionGhgMap = ghgMap.get(region);
            const regionOutputs = outputs.get(region);
            const individualGhg = EOLS.map((eolInfo) => {
                const inputName = region + eolInfo["leverName"] + "Emissions";
                const intensity = inputs.get(inputName);
                const volume = regionOutputs.get(eolInfo["attr"]);
                const emissions = intensity * volume;
                return emissions;
            });
            const totalGhg = individualGhg.reduce((a, b) => a + b);
            regionGhgMap.set("eol", totalGhg);
        });

        return state;
    }

    _addOutputGlobalToStateAttrs(state, attrs) {
        const self = this;
        addGlobalToStateAttrs(state, attrs);
        return state;
    }

    _calculateOverallGhg(year, state) {
        const self = this;

        const finalizer = new GhgFinalizer();
        finalizer.finalize(state);

        return state;
    }

    _getOverrideKey(region, subtype, polymer) {
        const self = this;
        return [region, subtype, polymer].join("\t");
    }
}


function getGhg(state, region, volume, leverName) {
    const inputName = region + leverName + "Emissions";
    const intensity = state.get("in").get(inputName);

    // metric kiloton
    const emissionsKt = intensity * volume;

    // metric megatons
    const emissionsMt = emissionsKt * 0.001;

    return emissionsMt;
}


class GhgFinalizer {
    finalize(state) {
        const self = this;
        self._getFullyDomesticGhg(state);
        const tradeLedger = self._buildLedger(state);
        self._addTradeGhg(state, tradeLedger);
        self._addOverallGhg(state);
        self._addGlobalGhg(state);
    }

    _getFullyDomesticGhg(state) {
        const self = this;
        const ghgInfo = state.get("ghg");
        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);
            const regionOut = state.get("out").get(region);

            const goodsTradeGhg = regionGhg.get("goodsTrade");
            const goodsImportGhg = goodsTradeGhg > 0 ? goodsTradeGhg : 0;
            const resinTradeGhg = regionGhg.get("resinTrade");
            const resinImportGhg = resinTradeGhg > 0 ? resinTradeGhg : 0;
            const importedProductGhg = goodsImportGhg + resinImportGhg;
            const fullyDomesticProductGhg = regionGhg.get("consumption") - importedProductGhg;

            const wasteGhg = regionGhg.get("eol");
            const eolVolumes = EOLS.map((x) => x["attr"]).map((attr) => regionOut.get(attr));
            const regionTotalWaste = eolVolumes.reduce((a, b) => a + b);
            const percentImportedWaste = regionOut.get("netWasteImportMT") / regionTotalWaste;
            const percentDomesticWaste = 1 - percentImportedWaste;
            const fullyDomesticWasteGhg = percentDomesticWaste * wasteGhg;

            regionGhg.set("fullyDomesticProductGhg", fullyDomesticProductGhg);
            regionGhg.set("fullyDomesticWasteGhg", fullyDomesticWasteGhg);
        });
    }

    _buildLedger(state) {
        const self = this;
        const tradeLedger = new GhgTradeLedger();
        const out = state.get("out");
        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const regionOut = out.get(region);

            const regionPolymers = state.get("polymers").get(region);
            const productSeries = ["goodsTrade", "resinTrade"];
            productSeries.forEach((series) => {
                const seriesPolymers = regionPolymers.get(series);
                GHGS.forEach((ghgInfo) => {
                    const polymerName = ghgInfo["polymerName"];
                    const volume = seriesPolymers.get(polymerName);
                    const leverName = ghgInfo["leverName"];
                    const ghg = getGhg(state, region, volume, leverName);

                    if (volume > 0) {
                        tradeLedger.addImport(region, polymerName, volume, ghg);
                    } else if (volume < 0) {
                        tradeLedger.addExport(region, polymerName, volume * -1, ghg * -1);
                    }
                });
            });

            const totalWaste = EOLS.map((eolInfo) => eolInfo["attr"])
                .map((attr) => regionOut.get(attr))
                .reduce((a, b) => a + b);

            const totalExportVolume = regionOut.get("netWasteExportMT");
            const totalImportVolume = regionOut.get("netWasteImportMT");
            const hasExport = totalExportVolume > 0;
            const hasImport = totalImportVolume > 0;
            EOLS.forEach((eolInfo) => {
                const attr = eolInfo["attr"];
                const leverName = eolInfo["leverName"];

                const volumeFate = regionOut.get(attr);
                const fatePercent = volumeFate / totalWaste;

                const fateExportVolume = fatePercent * totalExportVolume;
                const fateImportVolume = fatePercent * totalImportVolume;

                const percentOfFateExported = hasExport ? fateExportVolume / totalExportVolume : 0;
                const percentOfFateImported = hasImport ? fateImportVolume / totalImportVolume : 0;

                const ghgFate = getGhg(state, region, volumeFate, leverName);
                const fateGhgExport = ghgFate * percentOfFateExported;
                const fateGhgImport = ghgFate * percentOfFateImported;

                if (hasExport) {
                    tradeLedger.addExport(region, leverName, fateExportVolume, fateGhgExport);
                }

                if (hasImport) {
                    tradeLedger.addImport(region, leverName, fateImportVolume, fateGhgImport);
                }
            });
        });

        return tradeLedger;
    }

    _addTradeGhg(state, tradeLedger) {
        const self = this;

        const ghgInfo = state.get("ghg");
        const regions = self._getRegions(state);
        const inputs = state.get("in");
        const percentAttributeProductImporter = inputs.get("emissionPercentProductImporter") / 100;
        const percentAttributeWasteImporter = 1 - inputs.get("emissionPercentWasteExporter") / 100;

        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);

            const productTradeGhg = GHGS.map((ghgInfo) => {
                const polymerName = ghgInfo["polymerName"];
                return tradeLedger.getGhg(region, polymerName, percentAttributeProductImporter);
            }).reduce((a, b) => a + b);

            const eolTradeGhg = EOLS.map((eolInfo) => {
                const name = eolInfo["leverName"];
                return tradeLedger.getGhg(region, name, percentAttributeWasteImporter);
            }).reduce((a, b) => a + b);

            regionGhg.set("productTradeGhg", productTradeGhg);
            regionGhg.set("eolTradeGhg", eolTradeGhg);
        });
    }

    _addOverallGhg(state) {
        const self = this;
        const regions = self._getRegions(state);
        const ghgInfo = state.get("ghg");
        regions.forEach((region) => {
            const regionGhg = ghgInfo.get(region);
            const ghgs = [
                regionGhg.get("fullyDomesticProductGhg"),
                regionGhg.get("fullyDomesticWasteGhg"),
                regionGhg.get("productTradeGhg"),
                regionGhg.get("eolTradeGhg"),
            ];
            const sumGhg = ghgs.reduce((a, b) => a + b);
            regionGhg.set("overallGhg", sumGhg);
        });
    }

    _addGlobalGhg(state) {
        const self = this;
        const ghgInfo = state.get("ghg");

        const globalGhg = new Map();
        globalGhg.set("overallGhg", 0);

        const regions = self._getRegions(state);
        regions.forEach((region) => {
            const ghgRegion = ghgInfo.get(region);

            const addAttr = (attr) => {
                globalGhg.set(attr, globalGhg.get(attr) + ghgRegion.get(attr));
            };

            addAttr("overallGhg");
        });

        ghgInfo.set("global", globalGhg);
    }

    _getRegions(state) {
        return Array.of(...state.get("ghg").keys());
    }
}


class GhgTradeLedger {
    constructor() {
        const self = this;

        self._importVolumes = new Map();
        self._exportVolumes = new Map();
        self._actualGhg = new Map();
        self._ghgToDistribute = new Map();

        self._regions = new Set();
        self._materialTypes = new Set();

        self._typesWithImporterSource = EOLS.map((x) => x["leverName"]);
    }

    addImport(region, materialType, newVolume, newGhg) {
        const self = this;
        self._regions.add(region);
        self._materialTypes.add(materialType);

        self._checkVolumeAndGhg(newVolume, newGhg);

        const key = self._getCombineKey(region, materialType);
        self._addToMap(self._importVolumes, key, newVolume);

        if (!self._exportIsActualGhgSource(materialType)) {
            self._addToMap(self._ghgToDistribute, materialType, newGhg);
            self._addToMap(self._actualGhg, key, newGhg);
        }
    }

    addExport(region, materialType, newVolume, newGhg) {
        const self = this;
        self._regions.add(region);
        self._materialTypes.add(materialType);

        const key = self._getCombineKey(region, materialType);

        self._checkVolumeAndGhg(newVolume, newGhg);

        self._addToMap(self._exportVolumes, key, newVolume);

        if (self._exportIsActualGhgSource(materialType)) {
            self._addToMap(self._ghgToDistribute, materialType, newGhg);
            self._addToMap(self._actualGhg, key, newGhg);
        }
    }

    getGhg(region, materialType, percentAttributeImporter) {
        const self = this;
        if (self._exportIsActualGhgSource(materialType)) {
            return self._getGhgWithExporterOrigin(region, materialType, percentAttributeImporter);
        } else {
            return self._getGhgWithImporterOrigin(region, materialType, percentAttributeImporter);
        }
    }

    getRegions() {
        const self = this;
        return self._regions;
    }

    getMaterialTypes() {
        const self = this;
        return self._materialTypes;
    }

    _getCombineKey(region, materialType) {
        const self = this;
        return [region, materialType].join("\t");
    }

    _addToMap(target, key, addValue) {
        const self = this;
        const original = self._getIfAvailable(target, key);
        const newVal = original + addValue;
        target.set(key, newVal);
    }

    _checkVolumeAndGhg(volume, ghg) {
        const self = this;
        if (volume < 0) {
            throw "Encountered negative volume.";
        }

        if (ghg < 0) {
            throw "Encountered negative ghg.";
        }
    }

    _getIfAvailable(target, key) {
        const self = this;
        if (target.has(key)) {
            return target.get(key);
        } else {
            return 0;
        }
    }

    _getGhgWithExporterOrigin(region, materialType, percentAttributeImporter) {
        const self = this;

        const regions = Array.of(...self._regions);
        const getTotalVolume = (target) => {
            const individual = regions.map((innerRegion) => {
                const key = self._getCombineKey(innerRegion, materialType);
                return self._getIfAvailable(target, key);
            });
            return individual.reduce((a, b) => a + b);
        };

        const key = self._getCombineKey(region, materialType);
        const percentAttributeExporter = 1 - percentAttributeImporter;

        const totalImportVolume = getTotalVolume(self._importVolumes);
        const importVolume = self._getIfAvailable(self._importVolumes, key);
        const percentImport = totalImportVolume == 0 ? 0 : importVolume / totalImportVolume;
        const materialTypeGhg = self._getIfAvailable(self._ghgToDistribute, materialType);
        const importGhgTotal = percentImport * materialTypeGhg;
        const importGhgToAttribute = importGhgTotal * percentAttributeImporter;

        const exportGhgTotal = self._getIfAvailable(self._actualGhg, key);
        const exportGhgToAttribute = exportGhgTotal * percentAttributeExporter;

        return importGhgToAttribute + exportGhgToAttribute;
    }

    _getGhgWithImporterOrigin(region, materialType, percentAttributeImporter) {
        const self = this;

        const regions = Array.of(...self._regions);
        const getTotalVolume = (target) => {
            const individual = regions.map((innerRegion) => {
                const key = self._getCombineKey(innerRegion, materialType);
                return self._getIfAvailable(target, key);
            });
            return individual.reduce((a, b) => a + b);
        };

        const key = self._getCombineKey(region, materialType);
        const percentAttributeExporter = 1 - percentAttributeImporter;

        const totalExportVolume = getTotalVolume(self._exportVolumes);
        const exportVolume = self._getIfAvailable(self._exportVolumes, key);
        const percentExport = totalExportVolume == 0 ? 0 : exportVolume / totalExportVolume;
        const materialTypeGhg = self._getIfAvailable(self._ghgToDistribute, materialType);
        const exportGhgTotal = percentExport * materialTypeGhg;
        const exportGhgToAttribute = exportGhgTotal * percentAttributeExporter;


        const importGhgTotal = self._getIfAvailable(self._actualGhg, key);
        const importGhgToAttribute = importGhgTotal * percentAttributeImporter;

        return importGhgToAttribute + exportGhgToAttribute;
    }

    _exportIsActualGhgSource(materialType) {
        const self = this;
        return self._typesWithImporterSource.indexOf(materialType) == -1;
    }
}


function buildMatricies() {
    const assertPresent = (row, key) => {
        const value = row[key];

        if (value === undefined) {
            throw "Could not find value for " + key;
        }

        if (value === null) {
            throw "Value null for " + key;
        }
    };

    const ignoreEmpty = (rows) => {
        return rows.filter((x) => x["region"] !== null).filter((x) => x["region"] !== undefined);
    };

    const subtypeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/live_production_trade_subtype_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const subtypeFuture = subtypeRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "year");
            assertPresent(row, "region");
            assertPresent(row, "subtype");
            assertPresent(row, "ratioSubtype");

            return new SubtypeInfo(
                row["year"],
                row["region"],
                row["subtype"],
                row["ratioSubtype"],
            );
        });
    });

    const polymerRawFuture = new Promise((resolve) => {
        Papa.parse("/data/live_polymer_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const polymerFuture = polymerRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "subtype");
            assertPresent(row, "region");
            assertPresent(row, "polymer");
            assertPresent(row, "percent");
            assertPresent(row, "series");

            return new PolymerInfo(
                row["subtype"],
                row["region"],
                row["polymer"],
                row["percent"],
                row["series"],
            );
        });
    });

    const resinTradeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/resin_trade_supplement.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const resinTradeFuture = resinTradeRawFuture.then((rows) => {
        return ignoreEmpty(rows).map((row) => {
            assertPresent(row, "year");
            assertPresent(row, "region");
            assertPresent(row, "netImportResin");
            assertPresent(row, "netExportResin");

            return new ResinTrade(
                row["year"],
                row["region"],
                row["netImportResin"] - row["netExportResin"],
            );
        });
    });

    const componentFutures = [subtypeFuture, polymerFuture, resinTradeFuture];
    const matrixFuture = Promise.all(componentFutures).then((results) => {
        const subtypeInfos = results[0];
        const polymerInfos = results[1];
        const resinTradeInfos = results[2];

        const retMatricies = new PolymerMatricies();
        subtypeInfos.forEach((record) => retMatricies.addSubtype(record));
        polymerInfos.forEach((record) => retMatricies.addPolymer(record));
        resinTradeInfos.forEach((record) => retMatricies.addResinTrade(record));

        return retMatricies;
    });

    const immutableMatrixFuture = matrixFuture.then((x) => new ImmutablePolymerMatricies(x));

    return immutableMatrixFuture;
}


function buildModifier() {
    const matrixFuture = buildMatricies();
    const stateModifierFuture = matrixFuture.then((matricies) => new StateModifier(matricies));
    return stateModifierFuture;
}


function init() {
    importScripts("/third_party/papaparse.min.js");
    importScripts("/js/add_global_util.js");

    const modifierFuture = buildModifier();

    const onmessage = (event) => {
        const stateInfo = event.data;
        const year = stateInfo["year"];
        const requestId = stateInfo["requestId"];
        const state = stateInfo["state"];
        const attrs = stateInfo["attrs"];

        modifierFuture.then((modifier) => {
            modifier.modify(year, state, attrs);
            postMessage({"requestId": requestId, "state": state, "error": null, "year": year});
        });
    };

    addEventListener("message", onmessage);
}


const runningInWorker = typeof importScripts === "function";
if (runningInWorker) {
    init();
}
