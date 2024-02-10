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
            const allTradeSubtypes = [goodsSubtypes, RESIN_SUBTYPES, [TEXTILES_SUBTYPE]];
            const tradePolymersSeparate = allTradeSubtypes.map(getTrade);
            const tradePolymers = tradePolymersSeparate.reduce(
                (a, b) => self._combinePolymerVectors(a, b),
            );

            const polymerSubmap = new Map();
            polymerSubmap.set("consumption", new Map(Object.entries(consumptionPolymers)));
            polymerSubmap.set("trade", new Map(Object.entries(tradePolymers)));

            polymerMap.set(region, polymerSubmap);
        });
        state.set("polymers", polymerMap);

        addGlobalToStateAttrs(state, attrs);
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
                vector[polymer] += polymerVolume;
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
        vector[TEXTILE_POLYMER] = volume;
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
                vector[polymer] += polymerVolume;
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
        return {
            "ldpe": 0,
            "hdpe": 0,
            "pp": 0,
            "ps": 0,
            "pvc": 0,
            "pet": 0,
            "pur": 0,
            "pp&a fibers": 0,
            "other thermoplastics": 0,
            "other thermosets": 0,
        };
    }

    _combinePolymerVectors(a, b) {
        const self = this;
        return {
            "ldpe": a["ldpe"] + b["ldpe"],
            "hdpe": a["hdpe"] + b["hdpe"],
            "pp": a["pp"] + b["pp"],
            "ps": a["ps"] + b["ps"],
            "pvc": a["pvc"] + b["pvc"],
            "pet": a["pet"] + b["pet"],
            "pur": a["pur"] + b["pur"],
            "pp&a fibers": a["pp&a fibers"] + b["pp&a fibers"],
            "other thermoplastics": a["other thermoplastics"] + b["other thermoplastics"],
            "other thermosets": a["other thermosets"] + b["other thermosets"],
        };
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

    const adderFuture = buildModifier();

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


if (typeof importScripts === "function") {
    init();
}
