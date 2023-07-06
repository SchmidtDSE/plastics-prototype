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
    "eolIncinerationMT",
    "eolLandfillMT",
    "eolMismanagedMT"
];

const ALL_ATTRS = INPUT_ATTRS.concat(CONSUMPTION_ATTRS, EOL_ATTRS);

const YEAR = 2050;

const CACHE_BUSTER = Date.now();
