interface Record {
  
  public String getRegion();
  public String getScenario();
  public float getConsumption(String sector);
  public float getWaste(String eol);
  
}


class MutableRecord implements Record {

  private final String region;
  private final String scenario;
  private final Map<String, Float> consumption;
  private final Map<String, Float> waste;
  
  public MutableRecord(String newRegion, String newScenario) {
    region = newRegion;
    scenario = newScenario;
    
    consumption = new HashMap<>();
    waste = new HashMap<>();
  }
  
  public String getRegion() {
    return region;
  }
  
  public String getScenario() {
    return scenario;
  }
  
  public void addConsumption(String sector, float value) {
    consumption.put(sector, value);
  }
  
  public float getConsumption(String sector) {
    assert consumption.containsKey(sector); //<>//
    return consumption.get(sector);
  }
  
  public void addWaste(String eol, float value) {
    waste.put(eol, value);
  }
  
  public float getWaste(String eol) {
    assert waste.containsKey(eol);
    return waste.get(eol);
  }

}


List<Record> loadRecords(String csvLoc) {
  Table table = loadTable(csvLoc, "header");
  
  List<Record> retList = new ArrayList<>();
  for (TableRow row : table.rows()) {
    String region = row.getString("region");
    String scenario = row.getString("scenario");
    MutableRecord newRecord = new MutableRecord(region, scenario);
    
    for (String sector : SECTORS) {
      float value = row.getFloat("consumption" + sector + "MT");
      newRecord.addConsumption(sector, value);
    }
    
    for (String fate : EOL_FATES) {
      float value = row.getFloat("eol" + fate + "MT");
      newRecord.addWaste(fate, value);
    }
    
    retList.add(newRecord);
  }
  
  return retList;
}
