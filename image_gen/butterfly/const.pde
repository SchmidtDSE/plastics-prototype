PFont TITLE_FONT;
PFont BODY_FONT;
PFont DETAIL_FONT;

final boolean BUTTERFLY_CONSUMPTION = false;

final int BAR_PADDING_HORIZ = 1;
final int BAR_PADDING_VERT_HERO = 1;
final int BAR_PADDING_VERT_REGION = 0;

final int HERO_GROUP = 0;

final int MIN_YEAR = 2011;
final int MAX_YEAR = 2050;

final int MAX_CONSUMPTION_BOTTOM_GLOBAL = BUTTERFLY_CONSUMPTION ? 300 : 0;
final int MAX_CONSUMPTION_TOP_GLOBAL = BUTTERFLY_CONSUMPTION ? 700 : 700;
final int MAX_WASTE_BOTTOM_GLOBAL = 200;
final int MAX_WASTE_TOP_GLOBAL = 600;

final int MAX_CONSUMPTION_BOTTOM_REGION = BUTTERFLY_CONSUMPTION ? 100 : 0;
final int MAX_CONSUMPTION_TOP_REGION = BUTTERFLY_CONSUMPTION ? 300 : 300;
final int MAX_WASTE_BOTTOM_REGION = 150;
final int MAX_WASTE_TOP_REGION = 200;

final int STEP_CONSUMPTION = 100;
final int STEP_WASTE = 100;

final int LEFT_GUTTER = 70;
final int RIGHT_GUTTER = 30;
final int TOP_GUTTER = 50;
final int BOTTOM_GUTTER = 50;
final int LEGEND_WIDTH = 100;
final int SUBPLOT_HORIZ_PAD = 60;
final int SUBPLOT_VERT_PAD = 100;
final int HERO_HEIGHT = 300;

final int HERO_YEAR_TICK = 13;
final int REGION_YEAR_TICK = 39;

final int AXIS_ITEM_HEIGHT = 50;

final color AXIS_COLOR = #333333;
Map<String, Integer> CONSUMPTION_COLORS;
Map<String, Integer> WASTE_COLORS;

Map<String, String> EOL_COLS;
Map<String, String> CONSUMPTION_COLS;

Map<String, String> REGION_LABELS;

List<String> CONSUMPTION_TOP_GROUPS;
List<String> WASTE_TOP_GROUPS;
String CONSUMPTION_BOTTOM_GROUP;
String WASTE_BOTTOM_GROUP;

/**
 * Load constants which need the sketch to be initalized first.
 * 
 * Load constants which need the sketch to be initalized first where these are pseudo-constants
 * that should not change but cannot be initalized statically.
 */
void loadSemiconstants() {
  TITLE_FONT = loadFont("Lato-Medium-20.vlw");
  BODY_FONT = loadFont("Lato-Medium-12.vlw");
  DETAIL_FONT = loadFont("Lato-Medium-10.vlw");
  
  CONSUMPTION_COLORS = new HashMap<>();
  CONSUMPTION_COLORS.put("Agriculture", #a6cee3);
  CONSUMPTION_COLORS.put("Construction", #1f78b4);
  CONSUMPTION_COLORS.put("Electronic", #33a02c);
  CONSUMPTION_COLORS.put("House Leisure Sport", #b2df8a);
  CONSUMPTION_COLORS.put("Packaging", #fb9a99);
  CONSUMPTION_COLORS.put("Transportation", #e31a1c);
  CONSUMPTION_COLORS.put("Textile", #fdbf6f);
  CONSUMPTION_COLORS.put("Other", #ff7f00);
  
  WASTE_COLORS = new HashMap<>();
  WASTE_COLORS.put("Landfill", #a6cee3);
  WASTE_COLORS.put("Incineration", #1f78b4);
  WASTE_COLORS.put("Mismanaged", #b2df8a);
  WASTE_COLORS.put("Recycling", #33a02c);
  
  EOL_COLS = new HashMap<>();
  EOL_COLS.put("eolRecyclingMT", "Recycling");
  EOL_COLS.put("eolLandfillMT", "Landfill");
  EOL_COLS.put("eolIncinerationMT", "Incineration");
  EOL_COLS.put("eolMismanagedMT", "Mismanaged");
  
  CONSUMPTION_COLS = new HashMap<>();
  CONSUMPTION_COLS.put("consumptionAgricultureMT", "Agriculture");
  CONSUMPTION_COLS.put("consumptionConstructionMT", "Construction");
  CONSUMPTION_COLS.put("consumptionElectronicMT", "Electronic");
  CONSUMPTION_COLS.put("consumptionHouseholdLeisureSportsMT", "House Leisure Sport");
  CONSUMPTION_COLS.put("consumptionPackagingMT", "Packaging");
  CONSUMPTION_COLS.put("consumptionTransportationMT", "Transportation");
  CONSUMPTION_COLS.put("consumptionTextileMT", "Textile");
  CONSUMPTION_COLS.put("consumptionOtherMT", "Other");
  
  REGION_LABELS = new HashMap<>();
  REGION_LABELS.put("china", "China");
  REGION_LABELS.put("eu30", "European Union");
  REGION_LABELS.put("nafta", "NAFTA");
  REGION_LABELS.put("row", "Rest of World");
  
  CONSUMPTION_TOP_GROUPS = new ArrayList<>();
  if (!BUTTERFLY_CONSUMPTION) {
    CONSUMPTION_TOP_GROUPS.add("Packaging");
  }
  CONSUMPTION_TOP_GROUPS.add("Construction");
  CONSUMPTION_TOP_GROUPS.add("Textile");
  CONSUMPTION_TOP_GROUPS.add("House Leisure Sport");
  CONSUMPTION_TOP_GROUPS.add("Electronic");
  CONSUMPTION_TOP_GROUPS.add("Transportation");
  CONSUMPTION_TOP_GROUPS.add("Agriculture");
  CONSUMPTION_TOP_GROUPS.add("Other");
  
  CONSUMPTION_BOTTOM_GROUP = BUTTERFLY_CONSUMPTION ? "Packaging" : null;;
  
  WASTE_TOP_GROUPS = new ArrayList<>();
  WASTE_TOP_GROUPS.add("Landfill");
  WASTE_TOP_GROUPS.add("Incineration");
  WASTE_TOP_GROUPS.add("Recycling");
  
  WASTE_BOTTOM_GROUP = "Mismanaged";
}
