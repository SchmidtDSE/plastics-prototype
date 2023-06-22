function attachListeners() {
    let nextButton = document.getElementById("next-button");
    nextButton.addEventListener("click", onNextStep);

    let exampleInput = document.getElementById("example-input");
    exampleInput.addEventListener("change", onInputChange);
}


function onNextStep() {
    let exampleName = document.getElementById("example-name").value;
    let exampleMin = document.getElementById("example-min").value;
    let exampleMax = document.getElementById("example-max").value;
    let exampleStart = document.getElementById("example-start").value;
    let exampleUnits = document.getElementById("example-units").value;

    document.getElementById("example-title").innerHTML = exampleName;
    let exampleInput = document.getElementById("example-input");
    exampleInput.min = exampleMin;
    exampleInput.max = exampleMax;
    exampleInput.value = exampleStart;

    document.getElementById("step-1").style.display = "none";
    document.getElementById("step-2").style.display = "grid";
}


function onInputChange() {
    let units = document.getElementById("example-units").value;
    let value = document.getElementById("example-input").value;
    let valueStr = value >= 0 ? ("+" + value + units) : (value + units);
    document.getElementById("delta-display").innerHTML = valueStr;
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
    onInputChange();
    initEditor();
}


main();
