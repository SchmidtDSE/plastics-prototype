const ALL_REGIONS = [
    "global",
    "china",
    "eu30",
    "nafta",
    "row",
];

const CONSUMPTION_ATTRS = [
    "consumptionPackagingMT",
    "consumptionConstructionMT",
    "consumptionTextitleMT",
    "consumptionHouseholdLeisureSportsMT",
    "consumptionElectronicMT",
    "consumptionTransporationMT",
    "consumptionAgricultureMT",
    "consumptionOtherMT",
];

const EOL_ATTRS = [
    "eolLandfillMT",
    "eolIncinerationMT",
    "eolMismanagedMT",
    "eolRecyclingMT",
];

const PRODUCTION_ATTRS = [
    "netImportsMT",
    "netExportsMT",
    "domesticProductionMT",
];

const COLORS = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
];

const TEXT_COLORS = [
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
];

const ALL_ATTRS = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS);

const DEFAULT_YEAR = 2049;
const DEFAULT_REGION = ALL_REGIONS[0];
const HISTORY_START_YEAR = 2010;
const START_YEAR = 2024;
const MAX_YEAR = 2049;

const CACHE_BUSTER = Date.now();

const DISPLAY_TYPES = {amount: 1, percent: 2, cumulative: 3};
const DISPLAY_STAGES = {consumption: 4, eol: 5, production: 6};
const GOALS = {
    productionEmissions: "productionEmissions",
    consumptionEmissions: "consumptionEmissions",
    landfillWaste: "landfillWaste",
    mismanagedWaste: "mismanagedWaste",
    incineratedWaste: "incineratedWaste",
    totalConsumption: "totalConsumption",
};

const STANDARD_ATTR_NAMES = new Map();
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.eol, EOL_ATTRS);
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.consumption, CONSUMPTION_ATTRS);
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.production, PRODUCTION_ATTRS);


export {
    ALL_REGIONS,
    CONSUMPTION_ATTRS,
    EOL_ATTRS,
    PRODUCTION_ATTRS,
    COLORS,
    TEXT_COLORS,
    ALL_ATTRS,
    DEFAULT_YEAR,
    DEFAULT_REGION,
    HISTORY_START_YEAR,
    START_YEAR,
    MAX_YEAR,
    CACHE_BUSTER,
    DISPLAY_TYPES,
    DISPLAY_STAGES,
    GOALS,
    STANDARD_ATTR_NAMES,
};
