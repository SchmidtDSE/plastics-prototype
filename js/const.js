const ALL_REGIONS = [
    "china",
    "eu30",
    "nafta",
    "row"
];

const INPUT_ATTRS = [
    "inputProduceFiberMT",
    "inputProduceResinMT",
    "inputImportResinMT",
    "inputImportArticlesMT",
    "inputImportGoodsMT",
    "inputImportFiberMT",
    "inputAdditivesMT"
];

const CONSUMPTION_ATTRS = [
    "consumptionAgricultureMT",
    "consumptionConstructionMT",
    "consumptionElectronicMT",
    "consumptionHouseholdLeisureSportsMT",
    "consumptionPackagingMT",
    "consumptionTransporationMT",
    "consumptionTextitleMT",
    "consumptionOtherMT"
];

const EOL_ATTRS = [
    "eolRecyclingMT",
    "eolLandfillMT",
    "eolIncinerationMT",
    "eolMismanagedMT"
];

const COLORS = [
    "#a6cee3",
    "#1f78b4",
    "#b2df8a",
    "#33a02c",
    "#fb9a99",
    "#e31a1c",
    "#fdbf6f",
    "#ff7f00"
];

const TEXT_COLORS = [
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0",
    "#333333",
    "#F0F0F0"
];

const ALL_ATTRS = INPUT_ATTRS.concat(CONSUMPTION_ATTRS, EOL_ATTRS);

const DEFAULT_YEAR = 2050;
const DEFAULT_REGION = ALL_REGIONS[0];
const START_YEAR = 2025;

const CACHE_BUSTER = Date.now();

const DISPLAY_TYPES = {amount: 1, percent: 2};
const DISPLAY_STAGES = {consumption: 3, eol: 4};
