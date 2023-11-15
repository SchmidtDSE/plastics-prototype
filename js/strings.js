/**
 * String constants with human readable text to explain visualization variables.
 *
 * @license BSD, see LICENSE.md
 */

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
STRINGS.set("consumptionTextileMT", "Textile");
STRINGS.set("consumptionOtherMT", "Other");

STRINGS.set("netImportsMT", "Net Import (Good/Mat)");
STRINGS.set("netExportsMT", "Net Export (Good/Mat)");
STRINGS.set("netWasteImportMT", "Net Import (Waste)");
STRINGS.set("netWasteExportMT", "Net Export (Waste)");
STRINGS.set("primaryProductionMT", "Virgin Prod");
STRINGS.set("secondaryProductionMT", "Secondary Prod");

STRINGS.set(DISPLAY_TYPES.amount, "Annual Million Metric Tons");
STRINGS.set(DISPLAY_TYPES.percent, "% of Region");
STRINGS.set(DISPLAY_TYPES.cumulative, "Cumulative Million Tons from 2010");
STRINGS.set(DISPLAY_STAGES.consumption, "Consumption");
STRINGS.set(DISPLAY_STAGES.eol, "Plastic Waste");
STRINGS.set(DISPLAY_STAGES.production, "Production");

STRINGS.set(GOALS.productionEmissions, "Production Emissions");
STRINGS.set(GOALS.consumptionEmissions, "Consumption Emissions");
STRINGS.set(GOALS.landfillWaste, "Landfill Waste");
STRINGS.set(GOALS.recycling, "Recycling");
STRINGS.set(GOALS.incineratedWaste, "Incinerated Waste");
STRINGS.set(GOALS.mismanagedWaste, "Mismanaged Waste");
STRINGS.set(GOALS.totalWaste, "Total Waste");

const UNITS = new Map();

UNITS.set(DISPLAY_TYPES.amount, "Million Metric Tons");
UNITS.set(DISPLAY_TYPES.percent, "% of Region");
UNITS.set(DISPLAY_TYPES.cumulative, "Million Metric Tons");

export {STRINGS, UNITS};
