/**
 * Logic to render the butterfly plot.
 * 
 * @license BSD, see LICENSE.md
 */


/**
 * Horizontal butterfly plot.
 */
class Butterfly {
  
  private final Task task;
  private final Dataset dataset;
  
  /**
   * Create a new butterfly plot.
   * 
   * @param newTask Configuration with which the butterfly plot should be rendered.
   * @param newDataset The dataset from which the butterfly plot will be rendered.
   */
  public Butterfly(Task newTask, Dataset newDataset) {
    task = newTask;
    dataset = newDataset;
  }
  
  /**
   * Draw this plot.
   */
  public void drawButterfly() {
    pushMatrix();
    pushStyle();
    
    drawAxes();
    drawBody();
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the data content of this plot without the axes.
   */
  private void drawBody() {
    pushMatrix();
    pushStyle();
    
    drawTop();
    drawBottom();
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the bar chart going up.
   */
  private void drawTop() {
    pushMatrix();
    pushStyle();
    
    List<String> groups = task.getTopGroups();
    
    noStroke();
    rectMode(CORNERS);
    
    int startYear = task.getMinYear();
    int endYear = task.getMaxYear();
    for (int year = startYear; year <= endYear; year++) {
      float runningValue = 0;
      for (String group : groups) {
        float newValue = dataset.getValue(task.getRegion(), year, group);
        
        float x = getX(year);
        float padding = task.isHero() ? BAR_PADDING_HORIZ : 0;
        float xWidth = (getX(year + 1) - getX(year)) / 2 - padding;
        
        float vertPad = task.isHero() ? BAR_PADDING_VERT_HERO : BAR_PADDING_VERT_REGION;
        
        float startX = x - xWidth;
        float endX = x + xWidth;
        float startY = getY(runningValue, true);
        float endY = getY(runningValue + newValue, true) + vertPad;
        
        if (startY < endY) {
          endY = startY;
        }
        
        runningValue += newValue;
        
        fill(task.getColor(group));
        rect(startX, startY, endX, endY);
      }
    }
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the bar chart going down.
   */
  private void drawBottom() {
    pushMatrix();
    pushStyle();
    
    String group = task.getBottomGroup();
    if (group == null) {
      return;
    }
    
    noStroke();
    rectMode(CORNERS);
    
    int startYear = task.getMinYear();
    int endYear = task.getMaxYear();
    for (int year = startYear; year <= endYear; year++) {
      float newValue = dataset.getValue(task.getRegion(), year, group);
      
      float x = getX(year);
      float padding = task.isHero() ? BAR_PADDING_HORIZ : 0;
      float xWidth = (getX(year + 1) - getX(year)) / 2 - padding;
      
      float startX = x - xWidth;
      float endX = x + xWidth;
      float startY = getY(0, true) + 2;
      float endY = getY(newValue, false);
      
      if (startY > endY) {
        startY = endY;
      }
      
      fill(task.getColor(group));
      rect(startX, startY, endX, endY);
    }
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the axes and chart contextual elements.
   */
  private void drawAxes() {
    pushMatrix();
    pushStyle();
    
    drawXAxis();
    drawYAxis();
    drawTitle();
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the horizontal axis.
   */
  private void drawXAxis() {
    pushMatrix();
    pushStyle();
    
    fill(AXIS_COLOR);
    textFont(BODY_FONT);
    textAlign(CENTER, TOP);
    
    int startYear = task.getMinYear();
    int endYear = task.getMaxYear();
    int y = task.getMaxY() + 5;
    int stepSize = task.getXStep();
    for(int year = startYear; year <= endYear; year += stepSize) {
      text(year, getX(year), y);
    }
    
    textAlign(CENTER, CENTER);
    text(
      task.getXLabel(),
      (task.getMinX() + task.getMaxX()) / 2.0,
      task.getMaxY() + 25
    );
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the vertical axis.
   */
  private void drawYAxis() {
    pushMatrix();
    pushStyle();
    
    textFont(BODY_FONT);
    textAlign(RIGHT, CENTER);
    
    int x = task.getMinX() - 15;
    int stepSize = task.getYStep();
    
    int startBottomValue = 0;
    int endBottomValue = task.getMaxValueBottom();
    for(int value = startBottomValue; value <= endBottomValue; value += stepSize) {
      float y = getY(value, false);
      
      noStroke();
      fill(AXIS_COLOR);
      text(value, x, y);
      
      noFill();
      stroke(#E5E5E5);
      line(x + 5, y, task.getMaxX() + 15, y);
    }
    
    int startTopValue = task.getYStep();
    int endTopValue = task.getMaxValueTop();
    for(int value = startTopValue; value <= endTopValue; value += stepSize) {
      float y = getY(value, true);
      
      noStroke();
      fill(AXIS_COLOR);
      text(value, x, y);
      
      noFill();
      stroke(#E5E5E5);
      line(x + 5, y, task.getMaxX() + 15, y);
    }
    
    noFill();
    stroke(AXIS_COLOR);
    line(
      task.getMinX() - 10,
      getY(0, true) + 1,
      task.getMaxX() + 15,
      getY(0, true) + 1
    );
    
    noStroke();
    fill(AXIS_COLOR);
    
    pushMatrix();
    textAlign(CENTER, CENTER);
    translate(task.getMinX() - 50, (task.getMinY() + task.getMaxY()) / 2.0);
    rotate(-PI/2);
    text(task.getYLabel(), 0, 0);
    popMatrix();
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the title.
   */
  private void drawTitle() {
    pushMatrix();
    pushStyle();
    
    textAlign(CENTER, BOTTOM);
    textFont(TITLE_FONT);
    fill(AXIS_COLOR);
    
    float x = (task.getMinX() + task.getMaxX()) / 2.0;
    float y = task.getMinY() - 15;
    text(task.getTitle(), x, y);
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Get the x coordinate for a glyph like a bar.
   * 
   * @param year The year that the glyph represents.
   * @return Horizontal coordinate in pixels at which the glyph should be drawn.
   */
  private float getX(int year) {
    return map(
      year,
      task.getMinYear(),
      task.getMaxYear(),
      task.getMinX(),
      task.getMaxX()
    );
  }
  
  /**
   * Get the y coordinate for a glyph like height for a a bar.
   * 
   * @param value The value being rendered / represented by the glyph.
   * @param top Flag indicating if this is for the top or bottom chart component in the butterfly.
   *  True means the top chart and false means the bottom chart.
   * @return Vertical coordinate in pixels at which or to which the glyph should be drawn.
   */
  private float getY(float value, boolean top) {
    float valueMapped = top ? value : -1 * value;
    return map(
      valueMapped,
      task.getMaxValueBottom() * -1,
      task.getMaxValueTop(),
      task.getMaxY(),
      task.getMinY()
     );
  }
  
}


/**
 * Legend for a horizontal butterfly plot.
 */
class Legend {

  private final Task task;
  private final int x;
  private final int y;
  private final Dataset dataset;
  
  /**
   * Create a new legend.
   * 
   * @param newTask The configuration of the butterfly plot for which this legend is drawn.
   * @param newX The horizontal coordinate at which the legend should be drawn.
   * @param newY The vertical coordinate at which the legend should be drawn.
   * @param newDataset The dataset represented by the butterfly plot for which this legend is drawn.
   */
  public Legend(Task newTask, int newX, int newY, Dataset newDataset) {
    task = newTask;
    x = newX;
    y = newY;
    dataset = newDataset;
  }
  
  /**
   * Draw this legend.
   */
  public void drawLegend() {
    pushMatrix();
    pushStyle();
    
    translate(x, y);
    
    List<String> topGroupsOrig = task.isConsumption() ? CONSUMPTION_TOP_GROUPS : WASTE_TOP_GROUPS;
    
    List<String> topGroups = new ArrayList<>(topGroupsOrig);
    Collections.reverse(topGroups);
    float curY = 0;
    
    for (String group : topGroups) {
      drawGroup(group, curY);
      curY += AXIS_ITEM_HEIGHT;
    }
    
    String bottomGroup = task.isConsumption() ? CONSUMPTION_BOTTOM_GROUP : WASTE_BOTTOM_GROUP;
    
    if (bottomGroup != null) {
      drawGroup(bottomGroup, curY);
    }
    
    popStyle();
    popMatrix();
  }
  
  /**
   * Draw the label for single group with an embedded bar chart.
   */
  public void drawGroup(String group, float curY) {
    pushMatrix();
    pushStyle();
    
    textFont(BODY_FONT);
    fill(AXIS_COLOR);
    noStroke();
    textAlign(LEFT, BOTTOM);
    text(group, 0, curY);
    
    float value = dataset.getValue("global", 2050, group);
    
    fill(task.getColor(group));
    rectMode(CORNER);
    float barWidth = map(value, 0, 250, 0, LEGEND_WIDTH);
    rect(0, curY + 1, barWidth, 5);
    
    fill(AXIS_COLOR);
    textAlign(LEFT, TOP);
    textFont(DETAIL_FONT);
    text(nfc(value, 1) + " Global MMT in 2050", 0, curY + 8);
    
    popStyle();
    popMatrix();
  }

}
