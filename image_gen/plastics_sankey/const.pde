final float COLUMN_BODY_WIDTH = 200;

final boolean SHOW_WARNING_TEXT = false;

List<String> EOL_FATES;
List<String> SECTORS;
Map<String, Integer> FILL_COLORS;
Map<String, Integer> CONNECT_COLORS;
Map<String, Integer> FONT_COLORS;

Map<String, String> STRINGS;

Pattern LONGITUDINAL_PATTERN = Pattern.compile("^[A-Za-z]+20[0-9]+$");

PFont BODY_FONT;
PFont DETAIL_FONT;
PFont SUBHEADER_FONT;
PFont HEADER_FONT;

void loadSemiconstants() {
  EOL_FATES = new ArrayList<>();
  EOL_FATES.add("Recycling");
  EOL_FATES.add("Landfill");
  EOL_FATES.add("Incineration");
  EOL_FATES.add("Mismanaged");
  
  SECTORS = new ArrayList<>();
  SECTORS.add("Agriculture");
  SECTORS.add("Construction");
  SECTORS.add("Electronic");
  SECTORS.add("HouseholdLeisureSports");
  SECTORS.add("Packaging");
  SECTORS.add("Transportation");
  SECTORS.add("Textile");
  SECTORS.add("Other");
  
  FILL_COLORS = new HashMap<>();
  FILL_COLORS.put("Recycling", #66c2a5);
  FILL_COLORS.put("Landfill", #fc8d62);
  FILL_COLORS.put("Incineration", #a6d854);
  FILL_COLORS.put("Mismanaged", #8da0cb);
  FILL_COLORS.put("Agriculture", #fdbf6f);
  FILL_COLORS.put("Construction", #1f78b4);
  FILL_COLORS.put("Electronic", #fb9a99);
  FILL_COLORS.put("HouseholdLeisureSports", #b2df8a);
  FILL_COLORS.put("Packaging", #a6cee3);
  FILL_COLORS.put("Transportation", #e31a1c);
  FILL_COLORS.put("Textile", #33a02c);
  FILL_COLORS.put("Other", #ff7f00);
  
  CONNECT_COLORS = new HashMap<>();
  CONNECT_COLORS.put("Recycling", #5066c2a5);
  CONNECT_COLORS.put("Landfill", #50fc8d62);
  CONNECT_COLORS.put("Incineration", #50a6d854);
  CONNECT_COLORS.put("Mismanaged", #508da0cb);
  CONNECT_COLORS.put("Agriculture", #50fdbf6f);
  CONNECT_COLORS.put("Construction", #501f78b4);
  CONNECT_COLORS.put("Electronic", #50fb9a99);
  CONNECT_COLORS.put("HouseholdLeisureSports", #50b2df8a);
  CONNECT_COLORS.put("Packaging", #50a6cee3);
  CONNECT_COLORS.put("Transportation", #50e31a1c);
  CONNECT_COLORS.put("Textile", #5033a02c);
  CONNECT_COLORS.put("Other", #50ff7f00);
  
  FONT_COLORS = new HashMap<>();
  FONT_COLORS.put("Recycling", #333333);
  FONT_COLORS.put("Landfill", #FFFFFF);
  FONT_COLORS.put("Incineration", #333333);
  FONT_COLORS.put("Mismanaged", #FFFFFF);
  FONT_COLORS.put("Agriculture", #333333);
  FONT_COLORS.put("Construction", #FFFFFF);
  FONT_COLORS.put("Electronic", #333333);
  FONT_COLORS.put("HouseholdLeisureSports", #333333);
  FONT_COLORS.put("Packaging", #333333);
  FONT_COLORS.put("Transportation", #FFFFFF);
  FONT_COLORS.put("Textile", #FFFFFF);
  FONT_COLORS.put("Other", #FFFFFF);
  
  HEADER_FONT = loadFont("Lato-Medium-20.vlw");
  SUBHEADER_FONT = loadFont("Lato-Medium-15.vlw");
  BODY_FONT = loadFont("Lato-Medium-13.vlw");
  DETAIL_FONT = loadFont("Lato-Medium-11.vlw");
  
  STRINGS = new HashMap<>();
  STRINGS.put("china", "China");
  STRINGS.put("eu30", "Europe (EU30)");
  STRINGS.put("nafta", "N America");
  STRINGS.put("row", "Majority World");
  STRINGS.put("Recycling", "Recycling");
  STRINGS.put("Landfill", "Landfill");
  STRINGS.put("Incineration", "Incineration");
  STRINGS.put("Mismanaged", "Mismanaged");
  STRINGS.put("Agriculture", "Agriculture");
  STRINGS.put("Construction", "Construction");
  STRINGS.put("Electronic", "Electronic");
  STRINGS.put("HouseholdLeisureSports", "House/Leis/Sprt");
  STRINGS.put("Packaging", "Packaging");
  STRINGS.put("Transportation", "Transportation");
  STRINGS.put("Textile", "Textile");
  STRINGS.put("Other", "Other");
  
  STRINGS.put("banPsPackaging", "Ban Polystyrene Packaging");
  STRINGS.put("banWasteTrade", "Ban Waste Trade");
  STRINGS.put("reducedAdditives", "90% Reduced Additives");
  STRINGS.put("taxVirgin", "Consumption Tax");
  STRINGS.put("minimumRecyclingRate", "40% Min Recycling Collection");
  STRINGS.put("banSingleUse", "90% Reduced Single Use");
  STRINGS.put("capVirgin", "Cap Virgin to 2020");
  STRINGS.put("recyclingInvestment", "100B Recycling Invest");
  STRINGS.put("minimumRecycledContent", "40% Min Recycled Content");
  STRINGS.put("minimumPackagingReuse", "40% Min Reuse Packaging");
  STRINGS.put("wasteInvestment", "50B Waste Invest");
}
