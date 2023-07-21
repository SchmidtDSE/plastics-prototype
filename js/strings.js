import {DISPLAY_TYPES, DISPLAY_STAGES, GOALS} from "const";


const STRINGS = new Map();

STRINGS.set("china", "China");
STRINGS.set("eu30", "EU 30");
STRINGS.set("nafta", "NAFTA");
STRINGS.set("row", "Rest of World");
STRINGS.set("global", "Global");

STRINGS.set("eolRecyclingMT", "Recycling");
STRINGS.set("eolIncinerationMT", "Incineration");
STRINGS.set("eolLandfillMT", "Landfill");
STRINGS.set("eolMismanagedMT", "Mismanaged");

STRINGS.set("consumptionAgricultureMT", "Agriculture");
STRINGS.set("consumptionConstructionMT", "Construction");
STRINGS.set("consumptionElectronicMT", "Electronic");
STRINGS.set("consumptionHouseholdLeisureSportsMT", "House, Leis, Sport");
STRINGS.set("consumptionPackagingMT", "Packaging");
STRINGS.set("consumptionTransporationMT", "Transporation");
STRINGS.set("consumptionTextitleMT", "Textitle");
STRINGS.set("consumptionOtherMT", "Other");

STRINGS.set("netImportsMT", "Net Imports");
STRINGS.set("netExportsMT", "Net Exports");
STRINGS.set("domesticProductionMT", "Domestic");

STRINGS.set(DISPLAY_TYPES.amount, "Million Metric Tons");
STRINGS.set(DISPLAY_TYPES.percent, "% of Region");
STRINGS.set(DISPLAY_STAGES.consumption, "Consumption");
STRINGS.set(DISPLAY_STAGES.eol, "Plastic Waste");
STRINGS.set(DISPLAY_STAGES.production, "Production");

STRINGS.set(GOALS.productionEmissions, "Production Emissions");
STRINGS.set(GOALS.consumptionEmissions, "Consumption Emissions");
STRINGS.set(GOALS.landfillWaste, "Landfill Waste");
STRINGS.set(GOALS.mismanagedWaste, "Mismanaged Waste");

export {STRINGS};
