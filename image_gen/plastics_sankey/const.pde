List<String> EOL_FATES;
List<String> SECTORS;

Pattern LONGITUDINAL_PATTERN = Pattern.compile("^[A-Za-z]+20[0-9]+$");


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
  SECTORS.add("Transporation");
  SECTORS.add("Textile");
  SECTORS.add("Other");
}
