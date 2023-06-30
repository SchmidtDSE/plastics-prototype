const updateBar = (prefix, value) => {
    const valueRounded = Math.round(value * 100);
    document.getElementById(prefix + "-label").innerHTML = valueRounded;
    
    const width = valueRounded + "%";
    document.getElementById(prefix + "-bar").style.width = width;
};

const updateDisplay = () => {
    const projection = applyTransformation(data);

    const naftaProjection = projection.get("nafta");
    const recyclingPercent = naftaProjection.get("eolRecyclingPercent");
    const incinerationPercent = naftaProjection.get("eolIncinerationPercent");
    const landfillPercent = naftaProjection.get("eolLandfillPercent");
    const mismanagedPercent = naftaProjection.get("eolMismanagedPercent");

    updateBar("eol-nafta-recycling", recyclingPercent);
    updateBar("eol-nafta-incineration", incinerationPercent);
    updateBar("eol-nafta-landfill", landfillPercent);
    updateBar("eol-nafta-mismanaged", mismanagedPercent);
};

updateDisplay();