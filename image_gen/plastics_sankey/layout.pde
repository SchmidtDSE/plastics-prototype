class LayoutManager {
  
  private final Map<String, Integer> columnIndicies;
  private final Map<String, Stage> stages;
  private final Map<String, Map<String, Region>> regions;
  private final Map<String, Integer> minSpacings;
  
  private final float minX;
  private final float maxX;
  private final float minY;
  private final float maxY;
  
  private float maxValue;
  
  public LayoutManager(float newMinX, float newMaxX, float newMinY, float newMaxY) {
    columnIndicies = new HashMap<>();
    stages = new HashMap<>();
    regions = new HashMap<>();
    minSpacings = new HashMap<>();
    
    minX = newMinX;
    maxX = newMaxX;
    minY = newMinY;
    maxY = newMaxY;
    
    maxValue = 0;
  }
  
  public void add(String name, Stage stage, int minHeight) {
    columnIndicies.put(name, columnIndicies.size());
    stages.put(name, stage);
    
    float newMaxCandidate = stage.getGroups()
      .map((group) -> stage.get(group))
      .reduce((a, b) -> a + b)
      .get();
    
    maxValue = max(newMaxCandidate, maxValue);
    minSpacings.put(name, minHeight);
  }
  
  public void add(String name, Map<String, Region> newRegions, int minHeight) {
    columnIndicies.put(name, columnIndicies.size());
    
    regions.put(name, newRegions);
    
    float newMaxCandidate = newRegions.keySet()
      .stream()
      .map((key) -> newRegions.get(key))
      .map((region) -> region.getMaxValue())
      .reduce((a, b) -> a + b)
      .get();
    
    maxValue = max(newMaxCandidate, maxValue);
    minSpacings.put(name, minHeight);
  }
  
  public float getXStart(String column) {
    int index = columnIndicies.get(column);
    return map(index, 0, columnIndicies.size() - 1, minX, maxX - COLUMN_BODY_WIDTH);
  }
  
  public float getXEnd(String column) {
    return getXStart(column) + COLUMN_BODY_WIDTH;
  }
  
  public float getHeight(float value) {
     return map(value, 0, maxValue, 0, maxY - minY);
  }
  
  public float getMaxValue() {
    return maxValue;
  }
  
  public float getYStart(String column, String name) {
    if (stages.containsKey(column)) {
      return getYStart(column, stages.get(column), name);
    } else if (regions.containsKey(column)) {
      return getYStart(column, regions.get(column), name);
    } else {
      throw new RuntimeException("Unknown column: " + column);
    }
  }
  
  public float getYStart(String column, String name, String connection) {
    if (stages.containsKey(column)) {
      return getYStart(column, stages.get(column), name, connection);
    } else if (regions.containsKey(column)) {
      return getYStart(column, regions.get(column), name, connection);
    } else {
      throw new RuntimeException("Unknown column: " + column);
    }
  }
  
  public float getYEnd(String column, String name) {
    if (stages.containsKey(column)) {
      return getYEnd(column, stages.get(column), name);
    } else if (regions.containsKey(column)) {
      return getYEnd(column, regions.get(column), name);
    } else {
      throw new RuntimeException("Unknown column: " + column);
    }
  }
  
  private float getYStart(String column, Stage stage, String group) {
    float groupValue = stage.get(group);
    
    float priorY = stage.getGroups()
      .filter((x) -> stage.get(x) > groupValue)
      .map((x) -> stage.get(x))
      .map((x) -> {
        float naturalHeight = getHeight(x);
        int minHeight = minSpacings.get(column);
        return naturalHeight < minHeight ? minHeight : naturalHeight;
      })
      .reduce((a, b) -> a + b)
      .orElse(0.0);
    
    return priorY + minY;
  }
  
  private float getYStart(String column, Stage stage, String group, String connection) {
    float overallStartY = getYStart(column, stage, group);
    boolean isShadow = stage.getIsShadow(group, connection);
    float targetValue = stage.get(group, connection);
    
    Stream<String> connections = isShadow ? stage.getShadowConnections(group) : stage.getConnections(group); 
    float priorY = connections
      .filter((x) -> stage.get(group, x) > targetValue)
      .map((x) -> stage.get(group, x))
      .map((x) -> {
        float naturalHeight = getHeight(x);
        int minHeight = minSpacings.get(column);
        return naturalHeight < minHeight ? minHeight : naturalHeight;
      })
      .reduce((a, b) -> a + b)
      .orElse(0.0);
    
    return priorY + overallStartY;
  }
  
  private float getYStart(String column, Map<String, Region> regions, String name) {
    float regionValue = regions.get(name).getMaxValue();
    
    float priorValue = regions.keySet()
      .stream()
      .sorted((a, b) -> {
        Float aValue = regions.get(a).getMaxValue();
        Float bValue = regions.get(b).getMaxValue();
        int nativeComparison = aValue.compareTo(bValue);
        int reverseComparison = -1 * nativeComparison;
        return reverseComparison;
      })
      .filter((x) -> regions.get(x).getMaxValue() > regionValue)
      .map((x) -> regions.get(x).getMaxValue())
      .map((x) -> {
        float naturalHeight = getHeight(x);
        int minHeight = minSpacings.get(column);
        return naturalHeight < minHeight ? minHeight : naturalHeight;
      })
      .reduce((a, b) -> a + b)
      .orElse(0.0);
    
    return getHeight(priorValue) + minY;
  }
  
  private float getYStart(String column, Map<String, Region> regions, String name, String connection) {
    float overallStartY = getYStart(column, regions, name);
    
    String targetStageName = stages.keySet()
      .stream()
      .filter((stageName) -> {
        Stage stage = stages.get(stageName);
        return stage.has(connection);
      })
      .reduce((a, b) -> a.compareTo(b) < 0 ? a : b)
      .get();
    
    Stage sourceStage = stages.get(targetStageName);
    float targetValue = sourceStage.get(connection, name);
    float priorValue = sourceStage.getGroups()
      .sorted((a, b) -> {
        Float aValue = sourceStage.get(a, name);
        Float bValue = sourceStage.get(b, name);
        int nativeComparison = aValue.compareTo(bValue);
        int reverseComparison = -1 * nativeComparison;
        return reverseComparison;
      })
      .map((x) -> sourceStage.get(x, name))
      .filter((x) -> x > targetValue)
      .reduce((a, b) -> a + b)
      .orElse(0.0);
    
    float priorY = getHeight(priorValue);
    return priorY + overallStartY;
  }
  
  private float getYEnd(String column, Stage stage, String group) {
    float groupValue = stage.get(group);
    return getYStart(column, stage, group) + getHeight(groupValue);
  }
  
  private float getYEnd(String column, Map<String, Region> regions, String name) {
    float regionValue = regions.get(name).getMaxValue();
    return getYStart(column, regions, name) + getHeight(regionValue);
  }
  
}
