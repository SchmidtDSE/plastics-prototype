import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

List<Record> rawRecords;
Stage consumptionStage;
Map<String, Region> regions;
Stage wasteStage;
Stage policyStage;
LayoutManager layoutManager;


void setup() {
  size(1600, 800);
  try {
    runSketch();
  } catch (Exception e) {
    println("Error: " + e);
  }
}


void draw() {
  exit();
}


void runSketch() {
  loadSemiconstants();

  if (args == null || args.length != 2) {
    println("USAGE: processing-java --sketch=plastics_sankey --output=/tmp/sankeybuild --force --run [CSV] [output directory]");
    exit();
    return;
  }
  
  background(#FFFFFF);
  drawUnsafe();

  String csvLoc = args[0];
  String outputDirectory = args[1];

  loadState(csvLoc);
  
  save(outputDirectory + "/sankey.png");
}


void loadState(String csvLoc) {
  rawRecords = loadRecords(csvLoc);
  consumptionStage = buildConsumptionStage(rawRecords);
  regions = getRegions(rawRecords);
  policyStage = buildPolicyStage(rawRecords);
  wasteStage = buildWasteStage(rawRecords, policyStage);
  
  layoutManager = new LayoutManager(60, width - 10, 70, height - 50);
  layoutManager.add("consumption", consumptionStage, 2);
  layoutManager.add("regions", regions, 2);
  layoutManager.add("waste", wasteStage, 2);
  layoutManager.add("policy", policyStage, 50);
}
