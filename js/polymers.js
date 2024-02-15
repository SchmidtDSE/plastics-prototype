/**
 * Worker logic which calculates output metrics after running lever scripts.
 *
 * Worker logic which calculates output metrics after running lever scripts, including calculation
 * of polymers and GHG.
 *
 * @license BSD, see LICENSE.md
 */


// Create a separate cache buster for the worker
const CACHE_BUSTER = Date.now();

// Define expected attributes of final products and their associated polymer pipeline types
const GOODS = [
    {"attr": "consumptionTransportationMT", "subtype": "transportation"},
    {"attr": "consumptionPackagingMT", "subtype": "packaging"},
    {"attr": "consumptionConstructionMT", "subtype": "building_construction"},
    {"attr": "consumptionElectronicMT", "subtype": "electrical_electronic"},
    {"attr": "consumptionHouseholdLeisureSportsMT", "subtype": "household_leisure_sports"},
    {"attr": "consumptionAgricultureMT", "subtype": "agriculture"},
    {"attr": "consumptionOtherMT", "subtype": "others"},
];

// Define mapping to levers which indicate the amount of additives
const ADDITIVES_KEYS = {
    "transportation": "PercentTransportationAdditives",
    "packaging": "PercentPackagingAdditives",
    "building_construction": "PercentConstructionAdditives",
    "electrical_electronic": "PercentElectronicAdditives",
    "household_leisure_sports": "PercentHouseholdLeisureSportsAdditives",
    "agriculture": "PercentAgricultureAdditives",
    "textiles": "PercentTextileAdditives",
    "others": "PercentOtherAdditives",
};

// Define expected resin subtypes which may contain multiple polymers.
const RESIN_SUBTYPES = [
    "pp",
    "ps",
    "pvc",
    "100% otp",
    "50% otp, 50% ots",
    "pet",
    "pur",
];

// Make mapping between polymers and the levers' names for those polymers with GHG intensities.
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

const POLYMER_NAMES = GHGS.map((x) => x["polymerName"]);

// Make mapping between the levers' names for EOL fates and the output attributes for those volumes.
const EOLS = [
    {"leverName": "Landfill", "attr": "eolLandfillMT"},
    {"leverName": "Incineration", "attr": "eolIncinerationMT"},
    {"leverName": "Recycling", "attr": "eolRecyclingMT"},
    {"leverName": "Mismanaged", "attr": "eolMismanagedMT"},
];

const EOL_LEVERS = EOLS.map((x) => x["leverName"]);

// Set max number of iterations for back-propagation to meet constraints.
const MAX_NORM_ITERATIONS = 20;

// Define expected polymer names and subtypes along with output attribute for textiles.
const TEXTILE_POLYMER = "pp&a fibers";
const TEXTILE_ATTR = "consumptionTextileMT";
const TEXTILES_SUBTYPE = "textiles";

// Expected additives polymer name
const ADDITIVES_POLYMER = "additives";


/**
 * Make a string key representing the identity of an object.
 * 
 * @param pieces Pieces of the identity which are case insensitive. 
 * @returns Uniquely identifying string.
 */
function makeKey(pieces) {
    const piecesStr = pieces.map((x) => x + "");
    const piecesLower = piecesStr.map((x) => x.toLowerCase());
    return "\t".join(piecesLower);
}


/**
 * Information about a polymer (like ps) in a subtype (like transportation).
 */
class PolymerInfo {
    /**
     * Create a new polymer information record.
     *
     * @param subtype The type in which this polymer is found like packaging.
     * @param region The region for which this polymer record is provided like china.
     * @param polymer The name of the polymer that this record represents like pet.
     * @param percent The percent of plastic mass in this subtype in this region that this polymer
     *      represents.
     * @param series The subtype's series like goods.
     */
    constructor(subtype, region, polymer, percent, series) {
        const self = this;
        self._subtype = subtype;
        self._region = region;
        self._polymer = polymer;
        self._percent = percent;
        self._series = series;
    }

    /**
     * Get the subtype in which this polymer is found.
     *
     * @returns Subtype like "50% otp, 50% ots" or packaging.
     */
    getSubtype() {
        const self = this;
        return self._subtype;
    }

    /**
     * Get the name of the region for which this record is made.
     *
     * @returns Region name like china or nafta.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the name of the polymer that this record describes.
     *
     * @returns The polymer name like "pp" or "pet".
     */
    getPolymer() {
        const self = this;
        return self._polymer;
    }

    /**
     * Get the percent by mass that this record's polymer represents in this region and subtype.
     *
     * @returns The percent of plastic mass in this subtype in this region that this polymer
     *      represents.
     */
    getPercent() {
        const self = this;
        return self._percent;
    }

    /**
     * Get the series that this record is part of.
     *
     * @returns The series name like "goods" or "resin".
     */
    getSeries() {
        const self = this;
        return self._series;
    }

    /**
     * Get a string key uniquely identifying this record.
     *
     * @returns Key identifying the combination of region, subtype, and polymer.
     */
    getKey() {
        const self = this;
        return getPolymerKey(self._region, self._subtype, self._polymer);
    }
}


/**
 * Get the string key describing a combination of region, subtype, and polymer.
 *
 * @param region The region like china case insensitive.
 * @param subtype The subtype like packaging case insensitive.
 * @param polymer The polymer like pet case insensitive.
 * @returns String identifying a PolymerInfo.
 */
function getPolymerKey(region, subtype, polymer) {
    const pieces = [region, subtype, polymer];
    return makeKey(pieces);
}


/**
 * Information about a subtype of material to track.
 * 
 * Information about a subtype of material to track including the volume ratio like between a type
 * of trade and overall trade within a region and year.
 */
class SubtypeInfo {

    /**
     * Create a new record of material subtype.
     * 
     * @param year The year in which subtype information are available like 2050.
     * @param region The region like china in which the subtype information are available.
     * @param subtype The name of the subtype like transportation.
     * @param ratio The ratio of the subtype volume to the overall volume.
     */
    constructor(year, region, subtype, ratio) {
        const self = this;
        self._year = year;
        self._region = region;
        self._subtype = subtype;
        self._ratio = ratio;
    }

    /**
     * Get the year for which this information is available.
     * 
     * @returns The year in which subtype information are available like 2050.
     */
    getYear() {
        const self = this;
        return self._year;
    }

    /**
     * Get the location for which this information is avilable.
     * 
     * @returns The region like china in which the subtype information are available.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the type of volume described by this record.
     * 
     * @returns The name of the subtype like transportation.
     */
    getSubtype() {
        const self = this;
        return self._subtype;
    }

    /**
     * Get the volume ratio for this subtype in this year / region.
     * 
     * @returns The ratio of the subtype volume to the overall volume such as subtype trade ratio to
     *      overall net trade ratio.
     */
    getRatio() {
        const self = this;
        return self._ratio;
    }

    /**
     * Get a string uniquely identifying this record.
     * 
     * @returns String uniquely identifying this combination of year, region, and subtype.
     */
    getKey() {
        const self = this;
        return getSubtypeKey(self._year, self._region, self._subtype);
    }
}


/**
 * Get a string uniquely identifying a subtype information record.
 * 
 * @returns String uniquely identifying this combination of year, region, and subtype.
 */
function getSubtypeKey(year, region, subtype) {
    return year + "\t" + region + "\t" + subtype;
}


/**
 * Object describing an observed or predicted resin trade volume.
 */
class ResinTrade {

    /**
     * Create a new resin trade record.
     * 
     * @param year The year for which this volume is provided like 2050.
     * @param region The region for which this volume is provided like eu30.
     * @param netImportResin The net amount of resin imported across all polymers.
     */
    constructor(year, region, netImportResin) {
        const self = this;
        self._year = year;
        self._region = region;
        self._netImportResin = netImportResin;
    }

    /**
     * Get the year for which this information is available.
     * 
     * @returns The year for which this volume is provided like 2050.
     */
    getYear() {
        const self = this;
        return self._year;
    }

    /**
     * Get the location of this volume.
     * 
     * @returns The region for which this volume is provided like eu30.
     */
    getRegion() {
        const self = this;
        return self._region;
    }

    /**
     * Get the net import of resin for this region / year as a sum across all polymers.
     * 
     * @returns The net amount of resin imported across all polymers.
     */
    getNetImportResin() {
        const self = this;
        return self._netImportResin;
    }

    /**
     * Get a string uniquely identifying this resin trade record.
     * 
     * @returns String describing this combination of year and region.
     */
    getKey() {
        const self = this;
        return getResinTradeKey(self._year, self._region);
    }
}


/**
 * Get a string uniquely describing this resin trade volume.
 * 
 * @param year The year of the record.
 * @param region The region of the record.
 * @returns String uniquely describing the combination of year and region.
 */
function getResinTradeKey(year, region) {
    const pieces = [year, region];
    return makeKey(pieces);
}


/**
 * Collection of matricies for subtypes and their polymers.
 */
class PolymerMatricies {

    /**
     * Create a new empty set of matricies.
     */
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

    /**
     * Add information about a polymer within a subtype.
     * 
     * @param target New PolymerInfo object to register.
     */
    addPolymer(target) {
        const self = this;
        self._polymerInfos.set(target.getKey(), target);
        self._subtypes.add(target.getSubtype());
        self._regions.add(target.getRegion());
        self._polymers.add(target.getPolymer());
        self._series.add(target.getSeries());
    }

    /**
     * Get information on an individual polymer like ps within a subtype like packaging.
     * 
     * @param region The region like eu30 case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @param polymer The name of the polymer like pur case insensitive.
     * @returns Corresponding PolymerInfo object.
     */
    getPolymer(region, subtype, polymer) {
        const self = this;
        const key = getPolymerKey(region, subtype, polymer);
        return self._polymerInfos.get(key);
    }

    /**
     * Add information about a subtype.
     * 
     * @param target New SubtypeInfo object to register.
     */
    addSubtype(target) {
        const self = this;
        self._subtypeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
        self._subtypes.add(target.getSubtype());
    }

    /**
     * Get information about a subtype.
     * 
     * @param year The year for which subtype info is requested like 2050.
     * @param region The region in which subtype info is requested like nafta case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @returns SubtypeInfo object.
     */
    getSubtype(year, region, subtype) {
        const self = this;
        const key = getSubtypeKey(year, region, subtype);
        return self._subtypeInfos.get(key);
    }

    /**
     * Add information about resin trade.
     * 
     * @param target New ResinTrade object to register.
     */
    addResinTrade(target) {
        const self = this;
        self._resinTradeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
    }

    /**
     * Get information about resin trade.
     * 
     * @param year The year for which net resin trade is desired like 2050.
     * @param region The region for which net resin trade is desired like row case insensitive.
     * @returns New ResinTrade object.
     */
    getResinTrade(year, region) {
        const self = this;
        const key = getResinTradeKey(year, region);
        return self._resinTradeInfos.get(key);
    }

    /**
     * Get the set of unique subtypes observed across matricies like packaging.
     * 
     * @returns Set of strings representing unique subtypes observed. No order guaranteed.
     */
    getSubtypes() {
        const self = this;
        return self._subtypes;
    }

    /**
     * Get unique regions found within these matricies like eu30.
     * 
     * @returns Set of strings representing unique regions observed. No order guaranteed.
     */
    getRegions() {
        const self = this;
        return self._regions;
    }

    /**
     * Get unique polymers found within these matricies like pur.
     * 
     * @returns Set of strings representing unique polymers observed. No order guaranteed.
     */
    getPolymers() {
        const self = this;
        return self._polymers;
    }

    /**
     * Get unique series found within these matricies like goods or resin.
     * 
     * @returns Set of strings representing unique series observed. No order guaranteed.
     */
    getSeries() {
        const self = this;
        return self._series;
    }
}


/**
 * A decorator for PolymerMatricies which makes it immutable.
 */
class ImmutablePolymerMatricies {

    /**
     * Decorate a polymer matricies set to make it immutable.
     * 
     * @param inner The matricies to make immutable.
     */
    constructor(inner) {
        const self = this;
        self._inner = inner;
    }

    /**
     * Get information on an individual polymer like ps within a subtype like packaging.
     * 
     * @param region The region like eu30 case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @param polymer The name of the polymer like pur case insensitive.
     * @returns Corresponding PolymerInfo object.
     */
    getPolymer(region, subtype, polymer) {
        const self = this;
        return self._inner.getPolymer(region, subtype, polymer);
    }

    /**
     * Get information about a subtype.
     * 
     * @param year The year for which subtype info is requested like 2050.
     * @param region The region in which subtype info is requested like nafta case insensitive.
     * @param subtype The subtype like transportation case insensitive.
     * @returns SubtypeInfo object.
     */
    getSubtype(year, region, subtype) {
        const self = this;
        return self._inner.getSubtype(year, region, subtype);
    }

    /**
     * Get information about resin trade.
     * 
     * @param year The year for which net resin trade is desired like 2050.
     * @param region The region for which net resin trade is desired like row case insensitive.
     * @returns New ResinTrade object.
     */
    getResinTrade(year, region) {
        const self = this;
        return self._inner.getResinTrade(year, region);
    }

    /**
     * Get the set of unique subtypes observed across matricies like packaging.
     * 
     * @returns Set of strings representing unique subtypes observed. No order guaranteed.
     */
    getSubtypes() {
        const self = this;
        return self._inner.getSubtypes();
    }

    /**
     * Get unique regions found within these matricies like eu30.
     * 
     * @returns Set of strings representing unique regions observed. No order guaranteed.
     */
    getRegions() {
        const self = this;
        return self._inner.getRegions();
    }

    /**
     * Get unique polymers found within these matricies like pur.
     * 
     * @returns Set of strings representing unique polymers observed. No order guaranteed.
     */
    getPolymers() {
        const self = this;
        return self._inner.getPolymers();
    }

    /**
     * Get unique series found within these matricies like goods or resin.
     * 
     * @returns Set of strings representing unique series observed. No order guaranteed.
     */
    getSeries() {
        const self = this;
        return self._inner.getSeries();
    }
}


/**
 * Facade which modifies states to include polymers, ghg, and global values.
 */
class StateModifier {

    /**
     * Create a new modifier.
     * 
     * @param matricies The matricies to use in modifying states.
     */
    constructor(matricies) {
        const self = this;
        self._matricies = matricies;
    }

    /**
     * Modify a state to include polymers, ghg, and global values.
     * 
     * @param year The year that the state object represents.
     * @param state The state object (Map) to modify. This will be modified in place.
     * @param attrs The attributes to include in global calculation.
     * @returns Modified state object which is the input state modified in place.
     */
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

    /**
     * Add polymer ratio overrides specific to this state / year.
     * 
     * @param state The state object (Map) in which to add the overrides. Modified in place.
     * @param year The year that the state object represents.
     * @returns Modified state object (Map).
     */
    _addOverrides(state, year) {
        const self = this;
        const overrides = new Map();

        // Deal with PS in packaging
        const regions = Array.of(...state.get("out").keys());
        regions.forEach((region) => {
            const packagingPolymers = new Map();

            POLYMER_NAMES.forEach((polymer) => {
                const polymerPercent = self._getPolymerPercent(
                    state,
                    year,
                    region,
                    "packaging",
                    polymer,
                );
                packagingPolymers.set(polymer, polymerPercent);
            });

            const percentRemaining = self._getPercentPackagingPsRemaining(state, year, region);
            const newPs = packagingPolymers.get("ps") * percentRemaining;
            const changePs = packagingPolymers.get("ps") * (1 - percentRemaining);
            packagingPolymers.set("ps", newPs);

            const otherPolymers = POLYMER_NAMES.filter((x) => x !== "ps");
            const individualAdjValues = otherPolymers.map((x) => packagingPolymers.get(x));
            const otherTotal = individualAdjValues.reduce((a, b) => a + b);

            otherPolymers.forEach((x) => {
                const currentValue = packagingPolymers.get(x);
                const percentOfOther = currentValue / otherTotal;
                const offset = percentOfOther * changePs;
                packagingPolymers.set(x, offset + currentValue);
            });

            POLYMER_NAMES.forEach((polymer) => {
                const key = self._getOverrideKey(region, "packaging", polymer);
                overrides.set(key, packagingPolymers.get(polymer));
            });
        });

        state.set("polymerOverrides", overrides);

        return state;
    }

    /**
     * Get the percent of polystyrene remaining in packaging relative to BAU.
     * 
     * Get the percent of polystyrene remaining in packaging relative to business as usual where
     * this percentage is modified by policies.
     * 
     * @param state The state object (Map) from which the percentage should be derived.
     * @param year The year represented by the state object.
     * @param region The region like nafta for which the percentage is desired.
     * @returns Percentage (0 - 1) of the amount of polystyrene still in packaging relative to BAU.
     */
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

    /**
     * Get the percent of additives remaining in all sectors relative to BAU.
     * 
     * Get the percent of additives remaining in all sectors relative to business as usual where
     * this percentage is changed through policies.
     * 
     * @param state The state object (Map) from which this percentage should be derived.
     * @param year The year represented by the state object.
     * @param region The region for which the percentage should be generated.
     * @returns Percentage of additives remaining as a number between 0 and 1.
     */
    _getAdditivesRemaining(state, year, region) {
        const self = this;
        const inputs = state.get("in");

        const startYear = inputs.get("startYear");
        const endYear = inputs.get("endYearImmediate");
        if (year < startYear) {
            return 1;
        }

        const key = region + "AdditivesPercentReduction";
        const testing = !inputs.has(key);
        if (testing) {
            return 1;
        }

        const percentReductionTarget = inputs.get(key) / 100;
        const done = year >= endYear;
        const duration = endYear - startYear;
        const yearsEllapsed = year - startYear;
        const percentReductionInterpolate = yearsEllapsed / duration * percentReductionTarget;
        const percentReduction = done ? percentReductionTarget : percentReductionInterpolate;

        return 1 - percentReduction;
    }

    /**
     * Create a new empty GHG record in the state object (Map).
     * 
     * @param state The state in which to make the empty GHG record to be filled in further at later
     *      steps.
     */
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

    /**
     * Add net trade at the subtype level into a state object.
     * 
     * @param year The year represented by the given state object.
     * @param state The state object (Map) to modify in place to include detailed trade.
     * @returns The provided state object which was modified in place.
     */
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

    /**
     * Calculate polymer levels (polymer-level volume by region) and put them in a state object.
     * 
     * @param year The year for which the state object is provided.
     * @param state The state object (Map) in which to create the polymer counts. Modified in place.
     * @returns The input state object after in-place modification.
     */
    _calculatePolymers(year, state) {
        const self = this;

        const regions = Array.of(...state.get("out").keys());
        const polymerMap = new Map();
        regions.forEach((region) => {
            const goodsPolymers = self._getGoodsPolymers(region, state, year);
            const textilePolymers = self._getTextilePolymers(region, state, year);
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

    /**
     * Get all of the unique polymers like pur expected.
     * 
     * @returns Set of unique polymers without order guarantee.
     */
    _getAllPolymers() {
        const self = this;
        const nativePolymers = self._matricies.getPolymers();
        return new Set([...nativePolymers, TEXTILE_POLYMER, ADDITIVES_POLYMER]);
    }

    /**
     * Get all of the unique subtypes like transportation expected.
     * 
     * @returns Set of unique subtypes without order guarantee.
     */
    _getAllSubtypes() {
        const self = this;
        const nativeSubtypes = self._matricies.getSubtypes();
        return new Set([...nativeSubtypes, TEXTILES_SUBTYPE]);
    }

    /**
     * Get a vector describing the volume of polymers in goods based on consumption.
     * 
     * Get a vector describing the volume of polymers in goods based on consumption excluding
     * textiles.
     * 
     * @param region The region like row for which the polymer vector is desired.
     * @param state The state object (Map) from which the polymer vector should be derived.
     * @param year The year like 2040.
     * @returns Vector of polymer 
     */
    _getGoodsPolymers(region, state, year) {
        const self = this;
        const out = state.get("out").get(region);
        const polymers = self._getAllPolymers();

        const vectors = GOODS.map((info) => {
            const vector = self._makeEmptyPolymersVector();
            const volume = out.get(info["attr"]);
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(
                    state,
                    year,
                    region,
                    info["subtype"],
                    polymer,
                );
                const polymerVolume = percent * volume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });
            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    /**
     * Get a polymer vector describing textiles. 
     * 
     * @param region The region like china for which textile polymers are desired.
     * @param state The state object (Map) from which the vector should be derived.
     * @param year The year that the state object is for.
     * @returns Polymer vector describing textiles.
     */
    _getTextilePolymers(region, state, year) {
        const self = this;
        const out = state.get("out").get(region);
        const vector = self._makeEmptyPolymersVector();
        const volume = out.get(TEXTILE_ATTR);
        const newTotal = vector.get(TEXTILE_POLYMER) + volume;

        const additivesPercent = self._getPolymerPercent(
            state,
            year,
            region,
            TEXTILES_SUBTYPE,
            ADDITIVES_POLYMER,
        );
        const newAdditives = additivesPercent * volume;
        vector.set(ADDITIVES_POLYMER, vector.get(ADDITIVES_POLYMER) + newAdditives);

        vector.set(TEXTILE_POLYMER, newTotal - newAdditives);

        return vector;
    }

    /**
     * Get a polymer vector for trade.
     * 
     * @param year The year like 2050 for which the polymer vector is requested.
     * @param region The region like china for which the vector is requested.
     * @param state The state object (Map) from which it should be derived.
     * @param subtypes The subtypes to include.
     * @returns Polymer vector describing trade where numbers are net trade per polymer.
     */
    _getTradePolymers(year, region, state, subtypes) {
        const self = this;
        const polymers = self._getAllPolymers();
        const tradeVolumes = state.get("trade").get(region);

        const vectors = subtypes.map((subtype) => {
            const subtypeVolume = tradeVolumes.get(subtype);

            const vector = self._makeEmptyPolymersVector();
            polymers.forEach((polymer) => {
                const percent = self._getPolymerPercent(state, year, region, subtype, polymer);
                const polymerVolume = percent * subtypeVolume;
                const newTotal = vector.get(polymer) + polymerVolume;
                vector.set(polymer, newTotal);
            });

            return vector;
        });
        return vectors.reduce((a, b) => self._combinePolymerVectors(a, b));
    }

    /**
     * Get net trade from a region's outputs.
     * 
     * @param regionOutputs The regions outputs (state.get("out").get(region)).
     * @returns The net trade.
     */
    _getNetTrade(regionOutputs) {
        const self = this;
        return regionOutputs.get("netImportsMT") - regionOutputs.get("netExportsMT");
    }

    /**
     * Make an empty polymer vector with all polymers set to zero.
     * 
     * @returns Map representing a polymer vector. 
     */
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
        vector.set("additives", 0);
        vector.set("other thermoplastics", 0);
        vector.set("other thermosets", 0);
        return vector;
    }

    /**
     * Add two polymer vectors together.
     * 
     * @param a The first vector to add. 
     * @param b The second vector to add.
     * @returns The result of pairwise (polymer to same polymer) addition.
     */
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
        add("additives");
        add("other thermoplastics");
        add("other thermosets");
        return vector;
    }

    /**
     * Get the percent of subtype mass that is a specific polymer.
     * 
     * @param state The state from which the percentage should be found.
     * @param year The year like 2050 for which the state is provided.
     * @param region The region for which the percentage is desired like row.
     * @param subtype The subtype like transportation.
     * @param polymer The polymer like PS.
     * @returns Percent by mass of subtype that is the given polymer.
     */
    _getPolymerPercent(state, year, region, subtype, polymer) {
        const self = this;

        const requestedAdditives = polymer === ADDITIVES_POLYMER;

        const getAdditivesPercent = () => {
            const testing = !state.has("in");
            if (testing) {
                return 0;
            }

            const additivesKey = region + ADDITIVES_KEYS[subtype];
            const inputs = state.get("in");
            if (!inputs.has(additivesKey)) {
                return 0;
            }

            const additivesTotalPercent = inputs.get(additivesKey) / 100;
            const additivesPercentRemain = self._getAdditivesRemaining(state, year, region);
            return additivesTotalPercent * additivesPercentRemain;
        };

        const getNonAdditivesPercent = () => {
            if (requestedAdditives) {
                return 0;
            }

            // Check for polymer overrides
            if (state.has("polymerOverrides")) {
                const overrides = state.get("polymerOverrides");
                const overrideKey = self._getOverrideKey(region, subtype, polymer);
                if (overrides.has(overrideKey)) {
                    return overrides.get(overrideKey);
                }
            }

            // Override for textiles
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
        };

        if (requestedAdditives) {
            return getAdditivesPercent();
        } else {
            const additivesPercent = getAdditivesPercent();
            const nonAdditivesPercentTotal = 1 - additivesPercent;
            const nonAdditivesPercentQuery = getNonAdditivesPercent();
            return nonAdditivesPercentTotal * nonAdditivesPercentQuery;
        }
    }

    /**
     * Normalize through back propagation the trade data to meet mass balance constraints.
     * 
     * @param year The year for which the state object is provided.
     * @param state The state object (Map) in which to normalize. Modified in place.
     */
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

    /**
     * Normalize trade for a specific subset (series) like resin or goods trade.
     * 
     * Normalize trade for a specific subset (series) like resin or goods trade through back
     * propagation to meet mass balance constriants.
     * 
     * @param state The state object in which to perform back propagation.
     * @param seriesSubtypes The subtypes to normalize together.
     * @param seriesTotals The total volumes (sum) to try to meet per subtype.
     * @param regions The region in which to perform the normalization.
     */
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

    /**
     * Calculate the GHG associated with production.
     * 
     * @param state The state in which to calculate the start of life GHG emissions.
     * @returns The provided state object after in-place modification.
     */
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

    /**
     * Calculate the GHG associated with waste management fate.
     * 
     * @param state The state in which to calculate the end of life GHG emissions.
     * @returns The provided state object after in-place modification.
     */
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
                const volume = regionOutputs.get(eolInfo["attr"]);
                const emissions = getGhg(state, region, volume, eolInfo["leverName"]);
                return emissions;
            });
            const totalGhg = individualGhg.reduce((a, b) => a + b);
            regionGhgMap.set("eol", totalGhg);
        });

        return state;
    }

    /**
     * Create global output values as the sum of regional values.
     * 
     * @param state The state object (Map) to modify in place.
     * @param attrs The attributes to sum across regions.
     * @returns The state object after in-place modification.
     */
    _addOutputGlobalToStateAttrs(state, attrs) {
        const self = this;
        addGlobalToStateAttrs(state, attrs);
        return state;
    }

    /**
     * Calculate the global GHG levels.
     * 
     * @param year The year for which a state object is provided.
     * @param state The state object (Map) in which to calculate global GHG emissions.
     * @returns The state object having been modified in place.
     */
    _calculateOverallGhg(year, state) {
        const self = this;

        const finalizer = new GhgFinalizer();
        finalizer.finalize(state);

        return state;
    }

    /**
     * Get the key for a polymer ratio override.
     * 
     * Get the string that would be present in the overrides Map if a polymer ratio override is
     * present.
     * 
     * @param region The region like china.
     * @param subtype The subtype like transportation.
     * @param polymer The polymer like PUR.
     * @returns The string key for the polymer ratio override.
     */
    _getOverrideKey(region, subtype, polymer) {
        const self = this;
        return [region, subtype, polymer].join("\t");
    }
}


/**
 * Get the GHG emissions for a polymer in a region.
 * 
 * @param state The state object (Map) from which to derive the GHG emissions.
 * @param region The region like china.
 * @param volume The volume of material of the polymer in MT.
 * @param leverName The name of the lever associated with the polymer.
 * @returns GHG emissions in metric megatons CO2 equivalent.
 */
function getGhg(state, region, volume, leverName) {
    const inputNameBase = region + leverName + "Emissions";
    const regionOut = state.get("out").get(region);
    const isTesting = !regionOut.has("primaryProductionMT");

    const getPrimaryPercent = () => {
        if (isTesting) {
            return 1;
        }

        const primaryProduction = regionOut.get("primaryProductionMT");
        const secondaryProduction = regionOut.get("secondaryProductionMT");
        const naiveSecondary = secondaryProduction / (primaryProduction + secondaryProduction);
        return 1 - naiveSecondary;
    };

    const getIntensity = () => {
        const isEol = EOL_LEVERS.indexOf(leverName) != -1;
        if (isEol) {
            return state.get("in").get(inputNameBase);
        } else {
            const inputNameProduction = inputNameBase + "Production";
            const intensityProduction = state.get("in").get(inputNameProduction);

            const inputNameConversion = inputNameBase + "Conversion";
            const intensityConversion = state.get("in").get(inputNameConversion);

            const productionPercent = getPrimaryPercent();

            return intensityProduction * productionPercent + intensityConversion;
        }
    };

    const intensity = getIntensity();

    // metric kiloton
    const emissionsKt = intensity * volume;

    // metric megatons
    const emissionsMt = emissionsKt * 0.001;

    return emissionsMt;
}


/**
 * Tool which transits GHG through trade.
 */
class GhgFinalizer {

    /**
     * Finalize GHG emissions by applying trade.
     */
    finalize(state) {
        const self = this;
        self._getFullyDomesticGhg(state);
        const tradeLedger = self._buildLedger(state);
        self._addTradeGhg(state, tradeLedger);
        self._addOverallGhg(state);
        self._addGlobalGhg(state);
    }

    /**
     * Calculate fully domestic GHG emissions within a state.
     * 
     * Determine how much GHG emissions is associated with activity that stays entirelly within a
     * region.
     * 
     * @param state The state object (Map) in which to determine GHG from fully domestic activity. 
     */
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

    /**
     * Build a trade ledger which tracks the exchange of volumes across regions.
     * 
     * @param state The state object (Map) from which to derive the trade ledger.
     * @returns The ledger loaded with data from the state object. 
     */
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

    /**
     * Calculate GHG for trade attributed according to application configuration.
     * 
     * @param state The state object (Map) from which to calculate GHG and in which to place trade
     *      GHG.
     * @param tradeLedger The ledger with trade information to use in determing how to attribute
     *      GHG. 
     */
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

    /**
     * Calculate the overall GHG emissions for a region.
     * 
     * @param state The state object (Map) from which to find GHG values and in which to place
     *      region totals, modifying in place.
     */
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

    /**
     * Calculate global GHG emissions.
     * 
     * @param state The state object (Map) from which to get regional GHG and in which to put global
     *      GHG, modifying in place.
     */
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


/**
 * Ledger tracking regional trade volumes and GHG.
 * 
 * Ledger which tracks the imports and export of plastic at material type level (like  polymer or
 * EOL fate) along with the associated GHG emissions.
 */
class GhgTradeLedger {

    /**
     * Create a new empty trade ledger.
     */
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

    /**
     * Report imports.
     * 
     * @param region The region like china into which this volume was imported.
     * @param materialType The type of material like polymer or EOL fate.
     * @param newVolume The size of the volume in MMT.
     * @param newGhg The GHG in eCO2 megatons.
     */
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

    /**
     * Report an export of a volume.
     * 
     * @param region The region from which the volume was exported.
     * @param materialType The type of material like polymer or EOL fate.
     * @param newVolume The size of the volume in MMT.
     * @param newGhg The GHG in eCO2 megatons.
     */
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

    /**
     * Get the GHG emissions to be attributed to a region.
     * 
     * @param region The region like china.
     * @param materialType The type of material like polymer or EOL fate.
     * @param percentAttributeImporter The percent (0 - 1) of the GHG emissions to attribute to the
     *      importer of the volume. The remainder will be attributed to the exporter.
     */
    getGhg(region, materialType, percentAttributeImporter) {
        const self = this;
        if (self._exportIsActualGhgSource(materialType)) {
            return self._getGhgWithExporterOrigin(region, materialType, percentAttributeImporter);
        } else {
            return self._getGhgWithImporterOrigin(region, materialType, percentAttributeImporter);
        }
    }

    /**
     * Get the regions reported in this ledger.
     * 
     * @returns Set of regions like eu30 not in a particular order.
     */
    getRegions() {
        const self = this;
        return self._regions;
    }

    /**
     * Get the material types reported in this ledger.
     * 
     * @returns Set of material types like pur or landfill not in a particular order.
     */
    getMaterialTypes() {
        const self = this;
        return self._materialTypes;
    }

    /**
     * Get the key which can be used to determine how to combine volumes.
     * 
     * @param region The region for which the key is generated like china.
     * @param materialType The type of material like a polymer or EOL fate.
     * @returns String key where volumes with the same key can be combined.
     */
    _getCombineKey(region, materialType) {
        const self = this;
        return [region, materialType].join("\t");
    }

    /**
     * Add a value to a vector element.
     * 
     * @param target The vector as a Map.
     * @param key The key in which to add a value.
     * @param addValue The value to add. This will be added to the value currently at the key before
     *      being set with the same key.
     */
    _addToMap(target, key, addValue) {
        const self = this;
        const original = self._getIfAvailable(target, key);
        const newVal = original + addValue;
        target.set(key, newVal);
    }

    /**
     * Validate that the volume and GHG are valid.
     */
    _checkVolumeAndGhg(volume, ghg) {
        const self = this;
        if (volume < 0 || isNaN(volume)) {
            throw "Encountered invalid or negative volume.";
        }

        if (ghg < 0 || isNaN(volume)) {
            throw "Encountered invalid or negative ghg.";
        }
    }

    /**
     * Get a value from a Map if available or zero if the key is not present.
     * 
     * @param target The Map from which to get the value.
     * @param key The key for the value to look for.
     * @returns The value from the Map if found or zero if not.
     */
    _getIfAvailable(target, key) {
        const self = this;
        if (target.has(key)) {
            return target.get(key);
        } else {
            return 0;
        }
    }

    /**
     * Get the exporter-associated GHG for a volume.
     * 
     * @param region The region of the volume / the exporter to find the GHG for.
     * @param materialType The material type to get the GHG for like polymer or EOL fate.
     * @param percentAttributeImporter The percent to attribute to the importer between 0 and 1. The
     *      remainder is attributed to the exporter.
     * @returns The amount of GHG that should be associated with this region as exporter. 
     */
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

    /**
     * Get the importer-associated GHG for a volume.
     * 
     * @param region The region of the volume / the importer to find the GHG for.
     * @param materialType The material type to get the GHG for like polymer or EOL fate.
     * @param percentAttributeImporter The percent to attribute to the importer between 0 and 1. The
     *      remainder is attributed to the importer.
     * @returns The amount of GHG that should be associated with this region as importer. 
     */
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

    /**
     * Determine if the actual GHG is emitted at the importer or exporter.
     * 
     * @param materialType The type of material like polymer or EOL fate.
     * @returns True if the GHG is actually emitted by the exporter and false if emitted by
     *      importer.
     */
    _exportIsActualGhgSource(materialType) {
        const self = this;
        return self._typesWithImporterSource.indexOf(materialType) == -1;
    }
}


/**
 * Create a promise for a set of matricies required to calculate polymer and ghg level info.
 * 
 * @returns Promise resolving to the matricies set.
 */
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


/**
 * Build a promise for a StateModifier pre-loaded with matricies.
 * 
 * @returns Promise resolving to the preloaded modifier.
 */
function buildModifier() {
    const matrixFuture = buildMatricies();
    const stateModifierFuture = matrixFuture.then((matricies) => new StateModifier(matricies));
    return stateModifierFuture;
}


/**
 * Initialize the web worker.
 */
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
