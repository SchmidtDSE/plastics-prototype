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


class PolymerMatricies {
    constructor() {
        const self = this;
        self._polymerInfos = new Map();
        self._subtypeInfos = new Map();

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
        if (!self._polymerInfos.has(key)) {
            console.log(key);
        }
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


class StateModifier {
    constructor(matricies) {
        const self = this;
        self._matricies = matricies;
    }

    modify(year, state, attrs) {
        const self = this;

        self._calculatePolymers(year, state);
        self._normalizeTradePolymers(state);
        self._calculateGhg(state);
        self._addGlobalToStateAttrs(state, attrs);

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

    _getGoodsPolymers(region, state) {
        const self = this;
        const out = state.get("out").get(region);
        const polymers = self._getAllPolymers();

        const vectors = GOODS.map((info) => {
            const vector = self._makeEmptyPolymersVector();
            const volume = out.get(info["attr"]);
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(region, info["subtype"], polymer);
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
        const out = state.get("out").get(region);
        const polymers = self._getAllPolymers();
        const netTrade = self._getNetTrade(out);

        const vectors = subtypes.map((subtype) => {
            const subtypeInfo = self._matricies.getSubtype(year, region, subtype);
            const ratio = subtypeInfo.getRatio();
            const subtypeVolume = ratio * netTrade;

            const vector = self._makeEmptyPolymersVector();
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(region, subtype, polymer);
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
        return regionOutputs.get("netWasteImportMT") - regionOutputs.get("netWasteExportMT");
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

    _getPolymerPercent(region, subtype, polymer) {
        const self = this;
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
                const percent = polymerInfo.getPercent();
                return percent;
            }
        }
    }

    _normalizeTradePolymers(state) {
        const self = this;
    }

    _calculateGhg(state) {
        const self = this;
        const regions = Array.of(...state.get("out").keys());
        const inputs = state.get("in");
        const polymerVolumes = state.get("polymers");
        const ghgMap = new Map();

        const getEmissionsForPolymers = (region, polymers) => {
            const emissions = GHGS.map((ghgInfo) => {
                const polymerName = ghgInfo["polymerName"];
                if (polymers.has(polymerName)) {
                    const inputName = region + ghgInfo["leverName"] + "Emissions";
                    const intensity = inputs.get(inputName);
                    const emissions = intensity * polymers.get(ghgInfo["polymerName"]);
                    return emissions; // metric kiloton
                } else {
                    return 0;
                }
            });
            return emissions.reduce((a, b) => a + b);
        };

        regions.forEach((region) => {
            const regionGhgMap = new Map();
            const regionPolymerVolumes = polymerVolumes.get(region);

            const calculateForKey = (key) => {
                const polymerVolumes = regionPolymerVolumes.get(key);
                const ghgEmissions = getEmissionsForPolymers(region, polymerVolumes);
                regionGhgMap.set(key, ghgEmissions);
            };

            calculateForKey("consumption");
            calculateForKey("goodsTrade");
            calculateForKey("resinTrade");

            ghgMap.set(region, regionGhgMap);
        });

        state.set("ghg", ghgMap);
        return state;
    }

    _addGlobalToStateAttrs(state, attrs) {
        const self = this;
        addGlobalToStateAttrs(state, attrs);
        return state;
    }
}


function buildMatricies() {
    const subtypeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/live_production_trade_subtype_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const subtypeFuture = subtypeRawFuture.then((rows) => {
        return rows.map((row) => {
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
        return rows.map((row) => {
            return new PolymerInfo(
                row["subtype"],
                row["region"],
                row["polymer"],
                row["percent"],
                row["series"],
            );
        });
    });

    const matrixFuture = Promise.all([subtypeFuture, polymerFuture]).then((results) => {
        const subtypeInfos = results[0];
        const polymerInfos = results[1];

        const retMatricies = new PolymerMatricies();
        subtypeInfos.forEach((record) => retMatricies.addSubtype(record));
        polymerInfos.forEach((record) => retMatricies.addPolymer(record));

        return retMatricies;
    });

    return matrixFuture;
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
