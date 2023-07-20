const ALL_REGIONS = [
    "global",
    "china",
    "eu30",
    "nafta",
    "row",
];

const CONSUMPTION_ATTRS = [
    "consumptionAgricultureMT",
    "consumptionConstructionMT",
    "consumptionElectronicMT",
    "consumptionHouseholdLeisureSportsMT",
    "consumptionPackagingMT",
    "consumptionTransporationMT",
    // "consumptionTextitleMT",
    "consumptionOtherMT",
];

const EOL_ATTRS = [
    "eolRecyclingMT",
    "eolLandfillMT",
    "eolIncinerationMT",
    "eolMismanagedMT",
];

const PRODUCTION_ATTRS = [
    "netImportsMT",
    "netExportsMT",
    "domesticProductionMT",
];

const COLORS = [
    "#b2df8a",
    "#33a02c",
    "#a6cee3",
    "#1f78b4",
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
const HISTORY_START_YEAR = 2000;
const START_YEAR = 2024;
const MAX_YEAR = 2049;

const CACHE_BUSTER = Date.now();

const DISPLAY_TYPES = {amount: 1, percent: 2};
const DISPLAY_STAGES = {consumption: 3, eol: 4, production: 5};
const GOALS = {
    productionEmissions: "productionEmissions",
    consumptionEmissions: "consumptionEmissions",
    nonRecycledWaste: "nonRecycledWaste",
    mismanagedWaste: "mismanagedWaste",
    incineratedWaste: "incineratedWaste",
    totalConsumption: "totalConsumption",
};


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
};
