interface Stage {
  
  public boolean has(String group);
  public boolean getIsShadow(String group, String connection);
  public float get(String group);
  public float get(String group, String connection);
  public Stream<String> getGroups();
  public Stream<String> getConnections(String group);
  public Stream<String> getShadowConnections(String group);
  public float getGhgDelta(String group);
  
}


class MutableStage implements Stage {
  
  private final Map<String, Float> totals;
  private final Map<String, Map<String, Float>> connections;
  private final Map<String, Map<String, Float>> shadowConnections;
  private final Map<String, Float> ghgDeltas;
  
  public MutableStage() {
    totals = new HashMap<>();
    connections = new HashMap<>();
    shadowConnections = new HashMap<>();
    ghgDeltas = new HashMap<>();
  }
  
  public boolean has(String group) {
    return totals.containsKey(group);
  }
  
  public boolean getIsShadow(String group, String connection) {
    if (!shadowConnections.containsKey(group)) {
      return false;
    }
    
    return shadowConnections.get(group).containsKey(connection);
  }
  
  public float get(String group) {
    return totals.get(group);
  }
  
  public float get(String group, String connection) {
    if (!connections.containsKey(group)) {
      return 0;
    } else if (!connections.get(group).containsKey(connection)) {
      return getShadow(group, connection);
    }
    return connections.get(group).get(connection);
  }
  
  public Stream<String> getGroups() {
    return totals.keySet()
      .stream()
      .sorted((a, b) -> {
        Float aValue = get(a);
        Float bValue = get(b);
        int nativeComparison = aValue.compareTo(bValue);
        int reverseComparison = -1 * nativeComparison;
        return reverseComparison;
      });
  }
  
  public Stream<String> getConnections(String group) {
    return getConnections(connections, group);
  }
  
  public Stream<String> getShadowConnections(String group) {
    return getConnections(shadowConnections, group);
  }
  
  public void add(String group, String connection, float value) {
    if (!totals.containsKey(group)) {
      totals.put(group, 0.0);
    }
    
    totals.put(group, totals.get(group) + value);
    
    addConnectionOnly(group, connection, value, connections);
  }

  public void addGhgDelta(String group, float value) {
    ghgDeltas.put(group, value);
  }

  public float getGhgDelta(String group) {
    return ghgDeltas.getOrDefault(group, 0.0);
  }
  
  private Stream<String> getConnections(Map<String, Map<String, Float>> connections, String group) {
    Map<String, Float> targetConnections = connections.get(group);
    return targetConnections.keySet()
      .stream()
      .sorted((a, b) -> {
        Float aValue = targetConnections.get(a);
        Float bValue = targetConnections.get(b);
        int nativeComparison = aValue.compareTo(bValue);
        int reverseComparison = -1 * nativeComparison;
        return reverseComparison;
      });
  }
  
  private float getShadow(String group, String connection) {
    if (!shadowConnections.containsKey(group)) {
      return 0;
    } else if (!shadowConnections.get(group).containsKey(connection)) {
      return 0;
    }
    return shadowConnections.get(group).get(connection);
  }
  
  private void addShadowConnection(String group, String connection, float value) {
    addConnectionOnly(group, connection, value, shadowConnections);
  }
  
  private void addConnectionOnly(String group, String connection, float value, Map<String, Map<String, Float>> connections) {
    if (!connections.containsKey(group)) {
      connections.put(group, new HashMap<>());
    }
    
    if (!connections.get(group).containsKey(connection)) {
      connections.get(group).put(connection, 0.0);
    }
    
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
  
  public float getMaxValue() {
    return max(getConsumption(), getWaste());
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


Stage buildWasteStage(List<Record> records, Stage policyStage) {
  MutableStage newStage = new MutableStage();
  
  records.stream()
    .filter((x) -> !x.getRegion().equals("global"))
    .filter((x) -> x.getScenario().equals("businessAsUsual"))
    .forEach((x) -> {
      for (String fate : EOL_FATES) {
        newStage.add(fate, x.getRegion(), x.getWaste(fate));
        if (fate.equals("Mismanaged") && x.getRegion().equals("row")) {
          policyStage.getGroups().forEach((policy) -> {
            newStage.addShadowConnection("Mismanaged", policy, policyStage.get(policy, "Mismanaged"));
          });
        } else {
          policyStage.getGroups().forEach((policy) -> {
            newStage.addShadowConnection("Mismanaged", policy, 0);
          });
        }
      }
    });
  
  return newStage;
}


Stage buildPolicyStage(List<Record> records) {
  Map<String, Float> ghgImpacts = getGhgImpacts();

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
    .filter((x) -> !x.getScenario().equals("lowAmbition"))
    .filter((x) -> !x.getScenario().equals("highAmbition"))
    .filter((x) -> !LONGITUDINAL_PATTERN.matcher(x.getScenario()).matches())
    .collect(Collectors.toMap(x -> x.getScenario(), x -> totalMismanagedBau - x.getWaste("Mismanaged")));
  
  float totalRaw = rawImpacts.values().stream().reduce((a, b) -> a + b).get();
  
  MutableStage newStage = new MutableStage();
  
  for (String policy : rawImpacts.keySet()) {
    float scaledValue = rawImpacts.get(policy) / totalRaw * expectedReduction;
    newStage.add(policy, "Mismanaged", scaledValue);
    newStage.addGhgDelta(policy, ghgImpacts.getOrDefault(policy, 0.0));
  }
  
  return newStage;
}
