interface Stage {
  
  public float get(String group);
  public float get(String group, String connection);
  
}


class MutableStage implements Stage {
  
  private final Map<String, Float> totals;
  private final Map<String, Map<String, Float>> connections;
  
  public MutableStage() {
    totals = new HashMap<>();
    connections = new HashMap<>();
  }
  
  public float get(String group) {
    return totals.get(group);
  }
  
  public float get(String group, String connection) {
    return connections.get(group).get(connection);
  }
  
  public void add(String group, String connection, float value) {
    if (!totals.containsKey(group)) {
      totals.put(group, 0.0);
    }
    
    if (!connections.containsKey(group)) {
      connections.put(group, new HashMap<>());
    }
    
    if (!connections.get(group).containsKey(connection)) {
      connections.get(group).put(connection, 0.0);
    }
    
    totals.put(group, totals.get(group) + value);
    
    Map<String, Float> connectionGroup = connections.get(group);
    connectionGroup.put(connection, connectionGroup.get(connection) + value);
  }
  
}


class Region {
  
  private final String name;
  private final float consumption;
  private final float waste;
  
  public Region(String newName, float newConsumption, float newWaste) {
    name = newName;
    consumption = newConsumption;
    waste = newWaste;
  }
  
  public String getName() {
    return name;
  }
  
  public float getConsumption() {
    return consumption;
  }
  
  public float getWaste() {
    return waste;
  }
  
}


Stage buildConsumptionStage(List<Record> records) {
  MutableStage newStage = new MutableStage();
  
  records.stream()
    .filter((x) -> !x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("businessAsUsual"))
    .forEach((x) -> {
      for (String sector : SECTORS) {
        newStage.add(sector, x.getRegion(), x.getConsumption(sector));
      }
    });
  
  return newStage;
}


Map<String, Region> getRegions(List<Record> records) {
  return records.stream()
    .filter((x) -> !x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("businessAsUsual"))
    .map((record) -> {
      float totalConsumption = SECTORS.stream()
        .map((sector) -> record.getConsumption(sector))
        .reduce((a, b) -> a + b)
        .get();
      
      float totalWaste = EOL_FATES.stream()
        .map((sector) -> record.getWaste(sector))
        .reduce((a, b) -> a + b)
        .get();
      
      return new Region(record.getRegion(), totalConsumption, totalWaste);
    })
    .collect(Collectors.toMap(x -> x.getName(), x -> x));
}


Stage buildWasteStage(List<Record> records) {
  MutableStage newStage = new MutableStage();
  
  records.stream()
    .filter((x) -> !x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("businessAsUsual"))
    .forEach((x) -> {
      for (String fate : EOL_FATES) {
        newStage.add(fate, x.getRegion(), x.getWaste(fate));
      }
    });
  
  return newStage;
}


Stage buildPolicyStage(List<Record> records) {
  List<Record> globalBaus = records.stream()
    .filter((x) -> x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("businessAsUsual"))
    .collect(Collectors.toList());
  
  assert globalBaus.size() == 1;
  Record globalBau = globalBaus.get(0);
  float totalMismanagedBau = globalBau.getWaste("Mismanaged");
  
  List<Record> globalHighAmbitions = records.stream()
    .filter((x) -> x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("highAmbition"))
    .collect(Collectors.toList());
  
  assert globalHighAmbitions.size() == 1;
  Record globalHighAmbition = globalHighAmbitions.get(0);
  float highAmbitionBau = globalHighAmbition.getWaste("Mismanaged");
  
  float expectedReduction = totalMismanagedBau - highAmbitionBau;
  
  Map<String, Float> rawImpacts = records.stream()
    .filter((x) -> x.getRegion().equals("global"))
    .filter((x) -> !x.getScenario().equals("businessAsUsual"))
    .filter((x) -> !LONGITUDINAL_PATTERN.matcher(x.getScenario()).matches())
    .collect(Collectors.toMap(x -> x.getScenario(), x -> x.getWaste("Mismanaged")));
  
  float totalRaw = rawImpacts.values().stream().reduce((a, b) -> a + b).get();
  
  MutableStage newStage = new MutableStage();
  
  for (String policy : rawImpacts.keySet()) {
    float scaledValue = rawImpacts.get(policy) / totalRaw * expectedReduction;
    newStage.add("Mismanaged", policy, scaledValue);
  }
  
  return newStage;
}
