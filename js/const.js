/**
 * Common constants for the plastics decision support tool.
 *
 * @license BSD, see LICENSE.md.
 */

// Attributes
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
    "consumptionTextileMT",
    "consumptionHouseholdLeisureSportsMT",
    "consumptionElectronicMT",
    "consumptionTransportationMT",
    "consumptionAgricultureMT",
    "consumptionOtherMT",
];

const EOL_ATTRS = [
    "eolLandfillMT",
    "eolIncinerationMT",
    "eolRecyclingMT",
    "eolMismanagedMT",
    "netWasteImportMT",
    "netWasteExportMT",
];

const PRODUCTION_ATTRS = [
    "netImportsMT",
    "netExportsMT",
    "primaryProductionMT",
    "secondaryProductionMT",
];

const ALL_ATTRS = CONSUMPTION_ATTRS.concat(EOL_ATTRS).concat(PRODUCTION_ATTRS);

// Colors
const COLORS = [
    "#a6cee3",
    "#1f78b4",
    "#33a02c",
    "#b2df8a",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00",
];

const TEXT_COLORS = [
    "#333333",
    "#F0F0F0",
    "#F0F0F0",
    "#333333",
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
];

const HIGH_CONTRAST_COLORS = [
    "#1b9e77",
    "#d95f02",
    "#7570b3",
    "#e7298a",
    "#66a61e",
    "#e6ab02",
    "#a6761d",
    "#666666",
];

const HIGH_CONTRAST_TEXT_COLORS = [
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
    "#F0F0F0",
];

const isHighContrast = () => {
    return document.getElementById("high-contrast-radio").checked;
};

const getGlobalColors = () => {
    return isHighContrast() ? HIGH_CONTRAST_COLORS : COLORS;
};

const getGlobalTextColors = () => {
    return isHighContrast() ? HIGH_CONTRAST_TEXT_COLORS : TEXT_COLORS;
};

// Separate primary and secondary
const PIPELINE_EXPORT_START_YEAR = 2010;
const RECYCLING_DELAY_ASSUMPTION = 1;

// Years
const DEFAULT_YEAR = 2050;
const DEFAULT_REGION = ALL_REGIONS[0];
const HISTORY_START_YEAR = PIPELINE_EXPORT_START_YEAR + RECYCLING_DELAY_ASSUMPTION;
const START_YEAR = 2024;
const MAX_YEAR = 2050;

// Cache management
const CACHE_BUSTER = Date.now();

// Displays
const DISPLAY_TYPES = {amount: 1, percent: 2, cumulative: 3};
const DISPLAY_STAGES = {consumption: 4, eol: 5, production: 6};
const GOALS = {
    productionEmissions: "productionEmissions",
    consumptionEmissions: "consumptionEmissions",
    landfillWaste: "landfillWaste",
    mismanagedWaste: "mismanagedWaste",
    recycling: "recycling",
    incineratedWaste: "incineratedWaste",
    totalConsumption: "totalConsumption",
    totalWaste: "totalWaste",
    ghg: "ghg",
};

const STANDARD_ATTR_NAMES = new Map();
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.eol, EOL_ATTRS);
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.consumption, CONSUMPTION_ATTRS);
STANDARD_ATTR_NAMES.set(DISPLAY_STAGES.production, PRODUCTION_ATTRS);

const FLAG_DEFAULT_GHG = true;
const FLAG_DEFAULT_THREADS = false;
const FLAG_DEFAULT_GHG_EXPORT = true;


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
    FLAG_DEFAULT_GHG,
    FLAG_DEFAULT_GHG_EXPORT,
    FLAG_DEFAULT_THREADS,
    getGlobalColors,
    getGlobalTextColors,
};
