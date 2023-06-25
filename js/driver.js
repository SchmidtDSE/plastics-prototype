const toolkit = PlasticsLang.getToolkit();
let editor = null;


function attachListeners() {
    const nextButton = document.getElementById("next-button");
    nextButton.addEventListener("click", onNextStep);

    buildProjector().then((projector) => {
        let timeoutId = null;
        const exampleInput = document.getElementById("example-input");
        exampleInput.addEventListener("change", () => {
            if (timeoutId !== null) {
                clearTimeout(timeoutId);
            }

            timeoutId = setTimeout(
                () => {
                    onInputChange(projector);
                    timeoutId = null;
                },
                250
            );
        });
        onInputChange(projector);
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


function compileProgram() {
    const input = editor.getValue();

    if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
        showStatusText("Ready!");
        return null;
    }

    const errors = [];

    const chars = new toolkit.antlr4.InputStream(input);
    const lexer = new toolkit.PlasticsLangLexer(chars);
    lexer.removeErrorListeners();
    lexer.addErrorListener({
        syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
            const result = `(line ${line}, col ${column}): ${msg}`;
            errors.push(result);
        }
    });

    const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
    const parser = new toolkit.PlasticsLangParser(tokens);

    parser.buildParsePlastics = true;
    parser.removeErrorListeners();
    parser.addErrorListener({
        syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
          const result = `(line ${line}, col ${column}): ${msg}`;
          errors.push(result);
        }
    });

    const program = parser.program();

    if (errors.length > 0) {
        const errorsStr = errors.join("\n\n");
        showStatusText(errorsStr);
        return null;
    } else {
        return program.accept(new CompileVisitor());
    }
}


function applyTransformation(projection) {
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

    const program = compileProgram();
    if (program !== null) {
        program(state);
    }

    return state.get("out");
}


function onInputChange(projector) {
    const value = parseFloat(document.getElementById("example-input").value);

    const updateLabel = () => {
        const units = " " + document.getElementById("example-units").value;
        const valueStr = value >= 0 ? ("+" + value + units) : (value + units);
        document.getElementById("delta-display").innerHTML = valueStr;
    };

    const updateBar = (prefix, value) => {
        const valueRounded = Math.round(value * 100);
        document.getElementById(prefix + "-label").innerHTML = valueRounded;
        
        const width = valueRounded + "%";
        document.getElementById(prefix + "-bar").style.width = width;
    };

    const updateDisplay = () => {
        const projection = applyTransformation(projector.project(YEAR));

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

    updateLabel();
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

    editor.setTheme("ace/theme/monokai");

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
