let editor = null;


function getData() {
    return new Promise((resolve) => {
        Papa.parse("/data/web.csv", {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true
        });
    });
}


function attachListeners() {
    const nextButton = document.getElementById("next-button");
    nextButton.addEventListener("click", onNextStep);

    getData().then((data) => {
        let timeoutId = null;
        const exampleInput = document.getElementById("example-input");
        exampleInput.addEventListener("change", () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
                onInputChangeInProgress();
            }

            timeoutId = setTimeout(
                () => {
                    onInputChange(data);
                    timeoutId = null;
                },
                250
            );
        });
        
        exampleInput.addEventListener("input", () => {
            onInputChangeInProgress();
        });

        onInputChange(data);
    });
}


function onNextStep() {
    const exampleName = document.getElementById("example-name").value;
    const exampleMin = document.getElementById("example-min").value;
    const exampleMax = document.getElementById("example-max").value;
    const exampleStart = document.getElementById("example-start").value;
    const exampleUnits = document.getElementById("example-units").value;

    document.getElementById("example-title").innerHTML = exampleName;
    const exampleInput = document.getElementById("example-input");
    exampleInput.min = exampleMin;
    exampleInput.max = exampleMax;
    exampleInput.value = exampleStart;

    document.getElementById("step-1").style.display = "none";
    document.getElementById("step-2").style.display = "grid";
}


function showStatusText(text) {
    document.getElementById("status-display").textContent = text;
}


function compileLiveProgram() {
    const input = editor.getValue();
    const compileResult = compileProgram(input);

    const hasErrors = compileResult.getErrors().length > 0;
    const hasProgram = compileResult.getProgram() !== null;

    if (hasErrors) {
        const errorsStr = compileResult.getErrors().join("\n\n");
        showStatusText(errorsStr);
        return null;
    } else if (hasProgram) {
        return compileResult.getProgram();
    } else {
        showStatusText("Ready!");
        return null;
    }
}


function applyTransformation(projectionRaw) {
    const naftaData = projectionRaw.filter((x) => x["region"] === "nafta");
    const targetData = naftaData.filter((x) => x["year"] == 2050);
    const targetDatum = targetData[0];

    const naftaProjection = new Map();
    naftaProjection.set("eolIncinerationPercent", targetDatum["eolIncinerationPercent"]);
    naftaProjection.set("eolLandfillPercent", targetDatum["eolLandfillPercent"]);
    naftaProjection.set("inputProduceResinMTt", targetDatum["inputProduceResinMTt"]);
    naftaProjection.set("eolMismanagedPercent", targetDatum["eolMismanagedPercent"]);
    naftaProjection.set("inputImportFiberMT", targetDatum["inputImportFiberMT"]);
    naftaProjection.set("inputProduceResinMT", targetDatum["inputProduceResinMT"]);
    naftaProjection.set("inputImportResinMT", targetDatum["inputImportResinMT"]);
    naftaProjection.set("inputAdditivesMT", targetDatum["inputAdditivesMT"]);
    naftaProjection.set("inputImportGoodsMT", targetDatum["inputImportGoodsMT"]);
    naftaProjection.set("inputImportArticlesMT", targetDatum["inputImportArticlesMT"]);
    naftaProjection.set("eolRecyclingPercent", targetDatum["eolRecyclingPercent"]);
    naftaProjection.set("inputProduceFiberMT", targetDatum["inputProduceFiberMT"]);

    const projection = new Map();
    projection.set("nafta", naftaProjection);

    const exampleVariable = document.getElementById("example-variable").value;
    const exampleValue = parseFloat(
        document.getElementById("example-input").value
    );

    const state = new Map();
    state.set("local", new Map());
    state.set("out", projection);

    const inputs = new Map();
    inputs.set(exampleVariable, exampleValue);
    state.set("in", inputs);

    const program = compileLiveProgram();
    if (program !== null) {
        program(state);
    }

    return state.get("out");
}


function onInputChangeInProgress() {
    const value = parseFloat(document.getElementById("example-input").value);

    const updateLabel = () => {
        const units = " " + document.getElementById("example-units").value;
        const valueStr = value >= 0 ? ("+" + value + units) : (value + units);
        document.getElementById("delta-display").innerHTML = valueStr;
    };

    updateLabel();
}


function onInputChange(data) {
    onInputChangeInProgress();

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
}


/**
 * Enable and disable Ace editor commands.
 *
 * To better support accessibility, turn editor commands on and off like for
 * tab support. Thanks stackoverflow.com/questions/24963246/ace-editor-simply-re-enable-command-after-disabled-it.
 *
 * @param editor The Ace editor to modify.
 * @param name The name of the command to modify.
 * @param enabled Flag indicating if the command should be enabled.
 */
function setCommandEnabled(editor, name, enabled) {
  var command = editor.commands.byName[name]
  if (!command.bindKeyOriginal)
    command.bindKeyOriginal = command.bindKey
  command.bindKey = enabled ? command.bindKeyOriginal : null;
  editor.commands.addCommand(command);
  // special case for backspace and delete which will be called from
  // textarea if not handled by main commandb binding
  if (!enabled) {
    var key = command.bindKeyOriginal;
    if (key && typeof key == "object")
      key = key[editor.commands.platform];
    if (/backspace|delete/i.test(key))
      editor.commands.bindKey(key, "null")
  }
}


/**
 * Initalize the editor.
 */
function initEditor() {
    editor = ace.edit("editor");
    editor.getSession().setUseWorker(false);

    editor.session.setOptions({
        tabSize: 2,
        useSoftTabs: true
    });

    editor.setOption("printMarginColumn", 100);

    editor.setTheme("ace/theme/textmate");

    // Support keyboard escape for better accessibility
    const setTabsEnabled = (target) => {
        setCommandEnabled(editor, "indent", target);
        setCommandEnabled(editor, "outdent", target);
    };

    editor.on("focus", () => { setTabsEnabled(true); });

    editor.commands.addCommand({
        name: "escape",
        bindKey: {win: "Esc", mac: "Esc"},
        exec: () => {
          setTabsEnabled(false);
        }
    });
}


function main() {
    document.getElementById("step-1").style.display = "block";
    document.getElementById("step-2").style.display = "none";

    attachListeners();
    initEditor();
}


main();
