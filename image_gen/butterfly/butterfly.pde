/**
 * Simple sketch to draw a butterfly or stacked bar plot for consumption and waste by region.
 * 
 * @license BSD, see LICENSE.md
 */

import java.util.*;

Dataset dataset;


/**
 * Run the sketch.
 */
void setup() {
  size(1020, 700);
  try {
    runSketch();
  } catch (Exception e) {
    println("Error: " + e);
  }
}


/**
 * Run the sketch without error catching.
 */
void runSketch() {
  loadSemiconstants();

  if (args == null || args.length != 2) {
    println("USAGE: processing-java --sketch=butterfly --output=/tmp/butteflybuild --force --run [CSV] [output directory]");
    exit();
    return;
  }

  String csvLoc = args[0];
  String outputDirectory = args[1];

  dataset = new KeyedDataset(csvLoc);
  
  List<String> metrics = new ArrayList<>();
  metrics.add("waste");
  metrics.add("consumption");
  
  for (String metric : metrics) {
    background(#FFFFFF);
    
    TemplateTask globalTask = new TemplateTask(metric, HERO_GROUP, "global");
    Butterfly globalButterfly = new Butterfly(globalTask, dataset);
    globalButterfly.drawButterfly();
    
    TemplateTask euTask = new TemplateTask(metric, 1, "eu30");
    Butterfly euButterfly = new Butterfly(euTask, dataset);
    euButterfly.drawButterfly();
    
    TemplateTask naftaTask = new TemplateTask(metric, 2, "nafta");
    Butterfly naftaButterfly = new Butterfly(naftaTask, dataset);
    naftaButterfly.drawButterfly();
    
    TemplateTask chinaTask = new TemplateTask(metric, 3, "china");
    Butterfly chinaButterfly = new Butterfly(chinaTask, dataset);
    chinaButterfly.drawButterfly();
    
    TemplateTask rowTask = new TemplateTask(metric, 4, "row");
    Butterfly rowButterfly = new Butterfly(rowTask, dataset);
    rowButterfly.drawButterfly();
    
    Legend legend = new Legend(
      globalTask,
      width - RIGHT_GUTTER - LEGEND_WIDTH,
      TOP_GUTTER,
      dataset
    );
    legend.drawLegend();
    
    save(outputDirectory + "/" + metric + ".png");
  }
}


/**
 * Exit after having rendered the images.
 */
void draw() {
  exit();
}
