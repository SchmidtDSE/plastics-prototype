interface Task {
  
  public String getTitle();
  
  public String getXLabel();
  
  public String getYLabel();
  
  public String getRegion();
  
  public List<String> getTopGroups();
  
  public String getBottomGroup();
  
  public color getColor(String groupName);
  
  public int getMinYear();
  
  public int getMaxYear();
  
  public int getCenterValue();
  
  public int getMaxValueTop();
  
  public int getMaxValueBottom();
  
  public int getXStep();
  
  public int getYStep();
  
  public int getMinX();
  
  public int getMaxX();
  
  public int getMinY();
  
  public int getMaxY();
  
  public boolean isHero();
  
  public boolean isConsumption();
  
}


class TemplateTask implements Task {
  
  private final String metric;
  private final int groupNumber;
  private final String region;
  
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
