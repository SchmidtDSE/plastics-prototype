import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

List<Record> rawRecords;
Stage consumptionStage;
Map<String, Region> regions;
Stage wasteStage;
Stage policyStage;


void setup() {
  loadSemiconstants();
  
  rawRecords = loadRecords();
  consumptionStage = buildConsumptionStage(rawRecords);
  regions = getRegions(rawRecords);
  wasteStage = buildWasteStage(rawRecords);
  policyStage = buildPolicyStage(rawRecords);
}


void draw() {
}
