function runIntro(targetId) {
    const d3Selection = getD3().select("#" + targetId);
    d3Selection.select(".tutorial").html("See below...");

    d3Selection.selectAll(".post-intro-early")
        .transition()
        .delay(250)
        .duration(500)
        .style("opacity", 1);

    d3Selection.selectAll(".post-intro")
        .transition()
        .delay(1000)
        .duration(500)
        .style("opacity", 1);


    setTimeout(
        () => d3Selection.select(".tutorial").style("display", "none"),
        1500,
    );
}


function getD3() {
    // eslint-disable-next-line no-undef
    return d3;
}


export {runIntro};
