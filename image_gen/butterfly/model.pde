interface Dataset {
  
  public float getValue(String region, int year, String group);
  
}


class KeyedDataset implements Dataset {

  private final Map<String, Float> keyedValues;
  
  public KeyedDataset(String filename) {
    keyedValues = new HashMap<>();
    
    Table target = loadTable(filename, "header");
    for (TableRow row : target.rows()) {
      String region = row.getString("region");
      int year = row.getInt("year");
      
      List<Map<String, String>> colSets = new ArrayList<>();
      colSets.add(EOL_COLS);
      colSets.add(CONSUMPTION_COLS);
      
      for (Map<String, String> colSet : colSets) {
        for (String col : colSet.keySet()) {
          String group = colSet.get(col);
          
          String regionKey = getKey(region, year, group);
          String globalKey = getKey("global", year, group);
          
          float regionValue = row.getFloat(col);
          float globalValue = keyedValues.getOrDefault(globalKey, 0.0) + regionValue;
          
          keyedValues.put(regionKey, regionValue);
          keyedValues.put(globalKey, globalValue);
        }
      }
    }
  }
  
  public float getValue(String region, int year, String group) {
    return keyedValues.get(getKey(region, year, group));
  }
  
  private String getKey(String region, int year, String group) {
    StringJoiner joiner = new StringJoiner("\t");
    joiner.add(region);
    joiner.add(year + "");
    joiner.add(group);
    return joiner.toString();
  }

}
