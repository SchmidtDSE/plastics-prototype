interface ColorGetter {
  
  public color get(String name);
  
}


void drawUnsafe() {
  pushMatrix();
  pushStyle();
  
  drawConnections("consumption", "regions", consumptionStage);
  drawConnections("regions", "waste", wasteStage);
  drawConnections("waste", "policy", wasteStage, policyStage);
  
  drawStage("consumption", consumptionStage);
  drawStage("waste", wasteStage);
  drawStage("policy", policyStage, (x) -> FILL_COLORS.get("Mismanaged"), true);
  drawRegions("regions", regions);
  
  drawAxis();
  drawSubheaders();
  //drawHeader();
  drawCaption();
  
  popStyle();
  popMatrix();
}


void drawStage(String column, Stage stage) {
  drawStage(column, stage, (x) -> FILL_COLORS.get(x), false);
}


void drawStage(String column, Stage stage, ColorGetter colorGetter, boolean thin) {
  pushMatrix();
  pushStyle();
  
  rectMode(CORNERS);
  noStroke();
  
  translate(layoutManager.getXStart(column), 0);
  stage.getGroups().forEach((groupName) -> {
    float startY = layoutManager.getYStart(column, groupName);
    float endY = layoutManager.getYEnd(column, groupName) - 2;
    float midY = (startY + endY) / 2;
    float barHeight = endY - startY;
    float barWidth = thin ? 10 : COLUMN_BODY_WIDTH;
    
    fill(colorGetter.get(groupName));
    rect(0, startY, barWidth, endY);
    
    textAlign(thin ? LEFT : CENTER, CENTER);
    fill(FONT_COLORS.getOrDefault(groupName, #333333));
    
    String roundedStr = "" + round(stage.get(groupName));
    
    if (thin) {
      textFont(BODY_FONT);
      text(STRINGS.getOrDefault(groupName, groupName), thin ? 12 : COLUMN_BODY_WIDTH / 2, midY - 12);
      
      textFont(DETAIL_FONT);
      text(roundedStr + " Mt Plastic", thin ? 12 : COLUMN_BODY_WIDTH / 2, midY + 6);
    } else if (barHeight < 25) {
      textFont(DETAIL_FONT);
      text(STRINGS.getOrDefault(groupName, groupName) + ": " + roundedStr + " Mt", thin ? 12 : COLUMN_BODY_WIDTH / 2, midY);
    } else {
      textFont(BODY_FONT);
      text(STRINGS.getOrDefault(groupName, groupName), thin ? 12 : COLUMN_BODY_WIDTH / 2, midY - 10);
      
      textFont(DETAIL_FONT);
      text(roundedStr + " Mt", thin ? 12 : COLUMN_BODY_WIDTH / 2, midY + 12);
    }

    if (thin) {
      float ghgDelta = stage.getGhgDelta(groupName);
      String ghgStr = "" + round(ghgDelta / 10) * 10;
      String ghgValueStr = (ghgDelta > 0 ? "+" : "") + ghgStr + " Mt CO2e";

      fill(#757575);
      textFont(DETAIL_FONT);
      text(ghgValueStr, thin ? 12 : COLUMN_BODY_WIDTH / 2, midY + 22);

      noFill();
      stroke(#757575);
      strokeWeight(2);
      float startX = map(0, -400, 400, 12, COLUMN_BODY_WIDTH - 10);
      line(startX, midY + 30, startX, midY + 39);

      rectMode(CORNERS);
      noStroke();
      fill(#757575);
      float endX = map(ghgDelta, -400, 400, 12, COLUMN_BODY_WIDTH - 10);
      rect(startX, midY + 32, endX, midY + 37);
    }
  });
  
  popStyle();
  popMatrix();
}


void drawRegions(String column, Map<String, Region> regions) {
  pushMatrix();
  pushStyle();
  
  rectMode(CORNER);
  
  translate(layoutManager.getXStart(column), 0);
  for (String regionName : regions.keySet()) {
    Region region = regions.get(regionName);
    float startY = layoutManager.getYStart(column, regionName);
    float endY = layoutManager.getYEnd(column, regionName);
    float midY = (startY + endY) / 2;
    float sectionHeight = endY - startY;
    noFill();
    stroke(#C0C0C0);
    
    strokeWeight(1);
    line(0, startY, COLUMN_BODY_WIDTH, startY);
    
    noStroke();
    fill(#FFFFFF);
    rectMode(CORNER);
    rect(0, startY + 1, COLUMN_BODY_WIDTH, sectionHeight - 2);
    
    textAlign(CENTER, CENTER);
    fill(#333333);
    
    textFont(BODY_FONT);
    text(STRINGS.get(regionName), COLUMN_BODY_WIDTH / 2, midY - 13);
    
    textFont(DETAIL_FONT);
    text(round(region.getConsumption()) + " Mt consumption", COLUMN_BODY_WIDTH / 2, midY + 4);
    text(round(region.getWaste()) + " Mt waste", COLUMN_BODY_WIDTH / 2, midY + 21);
    
    for (String sector : SECTORS) {
      fill(FILL_COLORS.get(sector));
      rect(
        0,
        layoutManager.getYStart(column, regionName, sector),
        10,
        layoutManager.getHeight(consumptionStage.get(sector, regionName)) - 1
      );
    }
    
    for (String fate : EOL_FATES) {
      fill(FILL_COLORS.get(fate));
      rect(
        COLUMN_BODY_WIDTH - 10,
        layoutManager.getYStart(column, regionName, fate),
        10,
        layoutManager.getHeight(wasteStage.get(fate, regionName)) - 1
      );
    }
  }
  
  popStyle();
  popMatrix();
}


void drawConnections(String startColumn, String endColumn, Stage stage) {
  float startX = layoutManager.getXEnd(startColumn) + 2;
  float endX = layoutManager.getXStart(endColumn) - 2;
  float controlX1 = map(4, 0, 8, startX, endX);
  float controlX2 = map(5, 0, 8, startX, endX);
  
  noFill();
  strokeCap(SQUARE);
  
  stage.getGroups().forEach((groupName) -> {
    for (String regionName : regions.keySet()) {
      stroke(CONNECT_COLORS.get(groupName));
      
      float startYNative;
      float endYNative;
      
      if (startColumn.equals("regions")) {
        startYNative = layoutManager.getYStart(startColumn, regionName, groupName);
        endYNative = layoutManager.getYStart(endColumn, groupName, regionName);
      } else {
        startYNative = layoutManager.getYStart(startColumn, groupName, regionName);
        endYNative = layoutManager.getYStart(endColumn, regionName, groupName);
      }
      
      float overlap = stage.get(groupName, regionName);
      float overlapWidth = overlap > 0 ? layoutManager.getHeight(overlap) : 0;
      strokeWeight(overlapWidth > 1 ? overlapWidth - 1 : overlapWidth);
      
      float startY = startYNative + overlapWidth / 2;
      float endY = endYNative + overlapWidth / 2;
      
      bezier(startX, startY, controlX1, startY, controlX2, endY, endX, endY);
    }
  });
}


void drawConnections(String startColumn, String endColumn, Stage startStage, Stage endStage) {
  float startX = layoutManager.getXEnd(startColumn) + 2;
  float endX = layoutManager.getXStart(endColumn) - 2;
  float controlX1 = map(3, 0, 8, startX, endX);
  float controlX2 = map(5, 0, 8, startX, endX);
  
  noFill();
  strokeCap(SQUARE);
  
  startStage.getGroups().forEach((startGroupName) -> {
    endStage.getGroups().forEach((endGroupName) -> {
      stroke(CONNECT_COLORS.get(startGroupName));
      
      float startYNative = layoutManager.getYStart(startColumn, startGroupName, endGroupName);
      float endYNative = layoutManager.getYStart(endColumn, endGroupName, startGroupName);
      
      float overlap = endStage.get(endGroupName, startGroupName);
      float overlapWidth = overlap > 0 ? layoutManager.getHeight(overlap) : 0;
      if (overlapWidth > 3) {
        overlapWidth = overlapWidth - 1;
      } else if (overlapWidth < 1.5 && overlapWidth > 0) {
        overlapWidth = 1.5;
      }
      strokeWeight(overlapWidth);
      
      float startY = startYNative + overlapWidth / 2;
      float endY = endYNative + overlapWidth / 2;
      
      if (overlapWidth > 0) {
        bezier(startX, startY, controlX1, startY, controlX2, endY, endX, endY);
      }
    });
  });
}


void drawAxis() {
  pushMatrix();
  pushStyle();
  
  fill(#505050);
  textAlign(RIGHT, CENTER);
  textFont(DETAIL_FONT);
  
  translate(57, 70);
  
  for (int value = 0; value < layoutManager.getMaxValue() + 50; value += 50) {
    text(value + " Mt", 0, layoutManager.getHeight(value));
  }
  
  popStyle();
  popMatrix();
}


void drawSubheaders() {
  pushMatrix();
  pushStyle();

  fill(#333333);
  textFont(SUBHEADER_FONT);
  
  textAlign(CENTER, CENTER);
  text(
    "(A) Consumption",
    (layoutManager.getXStart("consumption") + layoutManager.getXEnd("consumption")) / 2,
    22
  );
  text(
    "(B) Regions",
    (layoutManager.getXStart("regions") + layoutManager.getXEnd("regions")) / 2,
    22
  );
  text(
    "(C) End of Life",
    (layoutManager.getXStart("waste") + layoutManager.getXEnd("waste")) / 2,
    22
  );
  
  textAlign(LEFT, CENTER);
  text("(D) Policy", layoutManager.getXStart("policy") + 12, 22);
  
  popStyle();
  popMatrix();
}


void drawHeader() {
  pushMatrix();
  pushStyle();
  
  noStroke();
  fill(#E0E0E0);
  rectMode(CORNER);
  rect(0, 0, width, 34);
  
  fill(#333333);
  textFont(HEADER_FONT);
  
  textAlign(LEFT, CENTER);
  text(
    "2050 Global Plastics Projections",
    10,
    17
  );
  
  popStyle();
  popMatrix();
}


void drawCaption() {
  pushMatrix();
  pushStyle();
  
  fill(#505050);
  textFont(DETAIL_FONT);
  
  textAlign(LEFT, TOP);
  if (SHOW_WARNING_TEXT) {
    text(
      "Showing policy effect if all enabled but each policy's effect will change both in absolute and relative size depending on what other policies are included.",
      layoutManager.getXStart("waste"),
      height - 85,
      layoutManager.getXEnd("waste") - layoutManager.getXStart("waste") - 12,
      85
    );
  }

  fill(#757575);
  textFont(DETAIL_FONT);
  
  textAlign(LEFT, CENTER);
  text(
    "-400 Mt",
    layoutManager.getXStart("policy") + 12,
    height - 70 - 200
  );

  textAlign(RIGHT, CENTER);
  text(
    "+400 Mt",
    layoutManager.getXEnd("policy") - 10,
    height - 70 - 200
  );

  textAlign(CENTER, TOP);
  text(
    "Plastics GHG Impact",
    (layoutManager.getXStart("policy") + layoutManager.getXEnd("policy")) / 2,
    height - 60 - 200
  );

  noFill();
  stroke(#757575);
  strokeWeight(1);
  line(
    layoutManager.getXStart("policy") + 12,
    height - 78 - 200,
    layoutManager.getXEnd("policy") - 10,
    height - 78 - 200
  );
  line(
    layoutManager.getXStart("policy") + 12,
    height - 62 - 200,
    layoutManager.getXEnd("policy") - 10,
    height - 62 - 200
  );
  
  popStyle();
  popMatrix();
}
