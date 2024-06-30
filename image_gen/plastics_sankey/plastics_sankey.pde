import java.util.*;
import java.util.regex.*;
import java.util.stream.*;

// import processing.svg.*;

List<Record> rawRecords;
Stage consumptionStage;
Map<String, Region> regions;
Stage wasteStage;
Stage policyStage;
LayoutManager layoutManager;


void setup() {
  size(1550, 900); // size(1550, 900, SVG, "sankey.svg");
  try {
    runSketch();
  } catch (Exception e) {
    println("Error: " + e);
  }
}


void draw() {
  //runSketch();
  exit();
}


void runSketch() {
  loadSemiconstants();
  
  String csvLoc;
  String outputDirectory;

  if (args == null || args.length != 2) {
    csvLoc = "scenarios_overview.csv";
    outputDirectory = "";
  } else {
    csvLoc = args[0];
    outputDirectory = args[1] + "/";
  }
  
  background(#FFFFFF);

  loadState(csvLoc);
  drawUnsafe();
  
  save(outputDirectory + "sankey.png");
}


void loadState(String csvLoc) {
  rawRecords = loadRecords(csvLoc);
  consumptionStage = buildConsumptionStage(rawRecords);
  regions = getRegions(rawRecords);
  policyStage = buildPolicyStage(rawRecords);
  wasteStage = buildWasteStage(rawRecords, policyStage);
  
  layoutManager = new LayoutManager(60, width - 100, 50, height - 70);
  layoutManager.add("consumption", consumptionStage, 2);
  layoutManager.add("regions", regions, 2);
  layoutManager.add("waste", wasteStage, 2);
  layoutManager.add("policy", policyStage, 70);
}
