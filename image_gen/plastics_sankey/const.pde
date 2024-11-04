final float COLUMN_BODY_WIDTH = 170;

final boolean SHOW_WARNING_TEXT = false;

List<String> EOL_FATES;
List<String> SECTORS;
Map<String, Integer> FILL_COLORS;
Map<String, Integer> CONNECT_COLORS;
Map<String, Integer> FONT_COLORS;

Map<String, String> STRINGS;
Map<String, Float> VAL_OVERRIDES;

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
  FILL_COLORS.put("Electronic", #cab2d6);
  FILL_COLORS.put("HouseholdLeisureSports", #6a3d9a);
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
  CONNECT_COLORS.put("Electronic", #50cab2d6);
  CONNECT_COLORS.put("HouseholdLeisureSports", #506a3d9a);
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
  
  HEADER_FONT = loadFont("PublicSans-Regular-20.vlw");
  SUBHEADER_FONT = loadFont("PublicSans-Regular-20.vlw");
  BODY_FONT = loadFont("PublicSans-Regular-18.vlw");
  DETAIL_FONT = loadFont("PublicSans-Regular-15.vlw");
  
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
  STRINGS.put("ghg", "GHG");
  
  STRINGS.put("banPsPackaging", "Ban polystyrene packaging");
  STRINGS.put("banWasteTrade", "Ban waste trade");
  STRINGS.put("reducedAdditives", "Ban additives");
  STRINGS.put("taxVirgin", "Packaging consumption tax");
  STRINGS.put("minimumRecyclingRate", "40% recycled rate");
  STRINGS.put("banSingleUse", "Reduce single use");
  STRINGS.put("capVirgin", "Cap virgin to 2020");
  STRINGS.put("recyclingInvestment", "$100B recycling invest");
  STRINGS.put("minimumRecycledContent", "40% recycled content");
  STRINGS.put("minimumPackagingReuse", "80% packaging reuse");
  STRINGS.put("wasteInvestment", "$50B waste invest");

  VAL_OVERRIDES = new HashMap<>();
  VAL_OVERRIDES.put("minimumRecycledContent", 8.0);
  VAL_OVERRIDES.put("wasteInvestment", 7.0);
  VAL_OVERRIDES.put("capVirgin", 6.0);
  VAL_OVERRIDES.put("recyclingInvestment", 5.0);
  VAL_OVERRIDES.put("minimumRecyclingRate", 4.0);
  VAL_OVERRIDES.put("taxVirgin", 3.0);
  VAL_OVERRIDES.put("banSingleUse", 2.0);
  VAL_OVERRIDES.put("minimumPackagingReuse", 1.0);
}
