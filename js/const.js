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
    "consumptionAgriculturePercent",
    "consumptionConstructionPercent",
    "consumptionElectronicPercent",
    "consumptionHouseholdLeisureSportsPercent",
    "consumptionPackagingPercent",
    "consumptionTransporationPercent",
    "consumptionTextitlePercent",
    "consumptionOtherPercent"
];

const EOL_ATTRS = [
    "eolRecyclingPercent",
    "eolIncinerationPercent",
    "eolLandfillPercent",
    "eolMismanagedPercent"
];

const ALL_ATTRS = INPUT_ATTRS.concat(CONSUMPTION_ATTRS, EOL_ATTRS);

const YEAR = 2050;
