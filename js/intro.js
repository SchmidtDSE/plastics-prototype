function runIntro(targetId, focus) {
    const d3Selection = getD3().select("#" + targetId);
    d3Selection.select(".tutorial").html("See below...");
    d3Selection.select(".tutorial").style("display", "none");
}


function getD3() {
    // eslint-disable-next-line no-undef
    return d3;
}


export {runIntro};
