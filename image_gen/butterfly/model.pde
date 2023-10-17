/**
 * Logic to manage dataset access and structure.
 * 
 * @license BSD, see LICENSE.md
 */


/**
 * Interface describing a dataset which can be queried to build the butterfly / stacked bar plot.
 */
interface Dataset {
  
  /**
   * Get a waste or consumption amount.
   * 
   * @param region The name of the region like row.
   * @param year The year for which the data are needed.
   * @param group The group name like the sector (Construction) or fate (Recycling) to be requested.
   * @return The observed or predicted value.
   */
  public float getValue(String region, int year, String group);
  
}


/**
 * Dataset structure which pre-indexes values by region, year, and group.
 */
class KeyedDataset implements Dataset {

  private final Map<String, Float> keyedValues;
  
  /**
   * Create a new dataset with pre-indexing.
   * 
   * @param filename The name of the CSV file containing the datset.
   */
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
  
  /**
   * Get the key which indexes a predicted or observed value.
   * 
   * @param region The name of the region like row.
   * @param year The year for which the data are needed.
   * @param group The group name like the sector (Construction) or fate (Recycling) to be requested.
   * @return The key at which the value can be found or should be written.
   */
  private String getKey(String region, int year, String group) {
    StringJoiner joiner = new StringJoiner("\t");
    joiner.add(region);
    joiner.add(year + "");
    joiner.add(group);
    return joiner.toString();
  }

}
