/**
 * Utilities to run the introduction sequence / dialogs which orient the user to the tool.
 *
 * @license BSD, see LICENSE.md
 */


/**
 * Run the tutorial sequence / animation which advances the tool from default state to next step.
 *
 * @param targetId The ID that contains the tutorial elements to manage.
 * @param focus Flag indicating if focus needs to be manipulated afterwards. True if focus should be
 *      set and false otherwise.
 */
function runIntro(targetId, focus) {
    const d3Selection = getD3().select("#" + targetId);
    d3Selection.select(".tutorial").html("See below...");
    d3Selection.select(".tutorial").style("display", "none");
}


/**
 * Get the d3 library entrypoint.
 *
 * @returns The D3 entrypoint.
 */
function getD3() {
    // eslint-disable-next-line no-undef
    return d3;
}


export {runIntro};
