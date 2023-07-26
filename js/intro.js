function runIntro(targetId) {
    const d3Selection = getD3().select("#" + targetId);
    d3Selection.select(".tutorial").html("See below...");

    d3Selection.selectAll(".post-intro-early")
        .transition()
        .delay(500)
        .duration(500)
        .style("opacity", 1);

    d3Selection.selectAll(".post-intro")
        .transition()
        .delay(1250)
        .duration(500)
        .style("opacity", 1);


    setTimeout(
        () => d3Selection.select(".tutorial").style("display", "none"),
        1750
    );
}


function getD3() {
    // eslint-disable-next-line no-undef
    return d3;
}


export {runIntro};
