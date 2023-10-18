/**
 * Structures describing the configuration with which a butterfly plot should be drawn.
 * 
 * @license BSD, see LICENSE.md
 */

/**
 * Task or set of configuration options with which a butterfly plot should be drawn.
 */
interface Task {
  
  /**
   * Get the title that should be displayed at the top of the butterfly plot.
   * 
   * @return Text to appear at the top of the plot.
   */
  public String getTitle();
  
  /**
   * Get the label for the horizontal axis.
   * 
   * @return Text to appear on the x axis of the plot.
   */
  public String getXLabel();
  
  /**
   * Get the label for the vertical axis.
   * 
   * @return Text to appear on the y axis of the plot.
   */
  public String getYLabel();
  
  /**
   * Get the region for which the butterfly plot is being rendered.
   * 
   * @return Region like nafta.
   */
  public String getRegion();
  
  /**
   * Get the list of groups to appear on the bar chart going upwards.
   * 
   * @return Groups with names like "Construction" to appear on the top component of the butterfly
   *    plot.
   */
  public List<String> getTopGroups();
  
  /**
   * Get the list of groups to appear on the bar chart going downwards.
   * 
   * @return Groups with names like "Construction" to appear on the bottom component of the
   *    butterfly plot.
   */
  public String getBottomGroup();
  
  /**
   * Get the color in which glyphs belonging to a group should be drawn.
   * 
   * @param groupName The name of the group like "Construction" for which a color is needed.
   */
  public color getColor(String groupName);
  
  /**
   * Get the earliest year to be included in the plot.
   * 
   * @return The minimum year in the plot.
   */
  public int getMinYear();
  
  /**
   * Get the latest year to be included in the plot.
   * 
   * @return The maximum year in the plot.
   */
  public int getMaxYear();
  
  /**
   * Get the value at which the butterfly plot should split.
   * 
   * @return Get the value at which the butterfly plot should start the top and bottom components.
   */
  public int getCenterValue();
  
  /**
   * Get the max value to show on the upwards axis.
   * 
   * @return Maximum value to draw in the axis labels for the top buttefly component.
   */
  public int getMaxValueTop();
  
  /**
   * Get the max value to show on the downwards axis.
   * 
   * @return Maximum value to draw in the axis labels for the bottom buttefly component.
   */
  public int getMaxValueBottom();
  
  /**
   * Get the increments between years.
   * 
   * @return Increment on the horizontal axis labels.
   */
  public int getXStep();
  
  /**
   * Get the increments between values.
   * 
   * @return Increment on the vertical axis labels.
   */
  public int getYStep();
  
  /**
   * Get the minimum x coordinate at which the plot should be drawn.
   * 
   * @return Starting horizontal coordinate in pixels.
   */
  public int getMinX();
  
  /**
   * Get the maximum x coordinate at which the plot should be drawn.
   * 
   * @return Ending horizontal coordinate in pixels.
   */
  public int getMaxX();
  
  /**
   * Get the minimum y coordinate at which the plot should be drawn.
   * 
   * @return Starting vertical coordinate in pixels.
   */
  public int getMinY();
  
  /**
   * Get the maximum y coordinate at which the plot should be drawn.
   * 
   * @return Ending vertical coordinate in pixels.
   */
  public int getMaxY();
  
  /**
   * Determine if this is the "hero" or highlighted image.
   * 
   * @return True if this is the hero image and false if a small multiple.
   */
  public boolean isHero();
  
  /**
   * Determine if this graphic is showing consumption.
   * 
   * @return True if showing consumption and false if showing waste.
   */
  public boolean isConsumption();
  
}


/**
 * Standard butterfly task with parameters for flexible drawing.
 */
class TemplateTask implements Task {
  
  private final String metric;
  private final int groupNumber;
  private final String region;
  
  /**
   * Fill in a template for a task.
   * 
   * @param newMetric The metric like "waste" to be drawn.
   * @param newGroupNumber The index or order of this plot within the bigger image. May be
   *    HERO_GROUP.
   * @param newRegion The region for which a butterfly plot is needed.
   */
  public TemplateTask(String newMetric, int newGroupNumber, String newRegion) {
    metric = newMetric;
    groupNumber = newGroupNumber;
    region = newRegion;
  }
  
  public String getTitle() {
    if (isHero()) {
      if (isConsumption()) {
        return "Global Yearly Plastic Consumption";
      } else {
        return "Global Yearly Plastic Waste";
      }
    } else {
      return REGION_LABELS.get(region);
    }
  }
  
  public String getXLabel() {
    return "Year";
  }
  
  public String getYLabel() {
    if (isHero()) {
      return "Million Metric Tons";
    } else {
      return "MMT";
    }
  }
  
  public String getRegion() {
    return region;
  }
  
  public List<String> getTopGroups() {
    if (isConsumption()) {
      return CONSUMPTION_TOP_GROUPS;
    } else {
      return WASTE_TOP_GROUPS;
    }
  }
  
  public String getBottomGroup() {
    if (isConsumption()) {
      return CONSUMPTION_BOTTOM_GROUP;
    } else {
      return WASTE_BOTTOM_GROUP;
    }
  }
  
  public color getColor(String groupName) {
    Map<String, Integer> colorSet = isConsumption() ? CONSUMPTION_COLORS : WASTE_COLORS;
    return colorSet.get(groupName);
  }
  
  public int getMinYear() {
    return MIN_YEAR;
  }
  
  public int getMaxYear() {
    return MAX_YEAR;
  }
  
  public int getCenterValue() {
    return 0;
  }
  
  public int getMaxValueTop() {
    if (isConsumption()) {
      if (isHero()) {
        return MAX_CONSUMPTION_TOP_GLOBAL;
      } else {
        return MAX_CONSUMPTION_TOP_REGION;
      }
    } else {
      if (isHero()) {
        return MAX_WASTE_TOP_GLOBAL;
      } else {
        return MAX_WASTE_TOP_REGION;
      }
    }
  }
  
  public int getMaxValueBottom() {
    if (isConsumption()) {
      if (isHero()) {
        return MAX_CONSUMPTION_BOTTOM_GLOBAL;
      } else {
        return MAX_CONSUMPTION_BOTTOM_REGION;
      }
    } else {
      if (isHero()) {
        return MAX_WASTE_BOTTOM_GLOBAL;
      } else {
        return MAX_WASTE_BOTTOM_REGION;
      }
    }
  }
  
  public int getMinX() {
    if (isHero() || groupNumber == 1) {
      return LEFT_GUTTER;
    } else {
      int groupNumberZero = groupNumber - 1;
      float widthPerGroup = getWidthPerGroup();
      return round(widthPerGroup * groupNumberZero + SUBPLOT_HORIZ_PAD * groupNumberZero + LEFT_GUTTER);
    }
  }
  
  public int getMaxX() {
    if (isHero()) {
      return width - RIGHT_GUTTER - LEGEND_WIDTH - SUBPLOT_HORIZ_PAD;
    } else {
      float unpaddedWidth = getMinX() + getWidthPerGroup();
      float paddedWidth = unpaddedWidth - SUBPLOT_HORIZ_PAD;
      return round(paddedWidth);
    }
  }
  
  public int getMinY() {
    if (isHero()) {
      return TOP_GUTTER;
    } else {
      return HERO_HEIGHT + SUBPLOT_VERT_PAD;
    }
  }
  
  public int getMaxY() {
    if (isHero()) {
      return HERO_HEIGHT;
    } else {
      return height - BOTTOM_GUTTER;
    }
  }
  
  public int getXStep() {
    return isHero() ? HERO_YEAR_TICK : REGION_YEAR_TICK;
  }
  
  public int getYStep() {
    return isConsumption() ? STEP_CONSUMPTION : STEP_WASTE;
  }
  
  public boolean isHero() {
    return groupNumber == HERO_GROUP;
  }
  
  public boolean isConsumption() {
    return metric.equals("consumption");
  }
  
  private float getWidthPerGroup() {
    float reservedSpace = LEFT_GUTTER + RIGHT_GUTTER + LEGEND_WIDTH + 3 * SUBPLOT_HORIZ_PAD;
    float totalWidthAvailable = width - reservedSpace;
    float widthPerGroup = totalWidthAvailable / 4;
    return widthPerGroup;
  }
  
}
