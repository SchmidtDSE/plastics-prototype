Plastics Language
================================================================================
Scripts written in a small domain-specific language for building policy interventions within the global plastics tool. These can be run through the [standalone engine](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone) or through the [live web application](https://global-plastics-tool.org/).

<br>

Purpose
--------------------------------------------------------------------------------
This tool offers a "plastics language" domain specific language for expressing policy interventions. This improves readability and coding agility by providing language constructs to take care of commonly needed tasks when writing these policy interventions.

<br>

Usage
--------------------------------------------------------------------------------
Scripts included in the tool are codified in the `pt` subdirectory where `*.pt` files are the scripts themselves and `index.json` adds those scripts to levers within the tool. Meanwhile, `scenarios.json` controls the checkboxes on the overview tab. These scripts primarily run through the [live web application](https://global-plastics-tool.org/) but can also operate through the [standalone engine](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone) (see the `js_standalone` directory).

### Language
Scripts generally follow mixture of Python and JavaScript-like syntax. It also provides the following language features which have been crafted given the needs of typical policy interventions:

 - **Change**: Have a variable change linerally from a start year to an end year, using the current year in the simulation. Example: `change x by 5 over 2020 to 2050;`
 - **Comments**: Single line comments are available like so: `var x = 5; # single comment`.
 - **Distribute**: It is common to distribute some value across multiple variables either linearlly (each variable offset by the same amount such that the sum of changes equals the overall effect) or proportionally (each variable is offset by the offset * the original value / sum of variables in the distribute statement). An example includes `var x = 3; var a = 1; var b = 2; distribute x across [a, b] proportionally;` which results in a equaling 2.
 - **If**: Conditionals are inline Python-style like `var x = 1 if y > 0 else -1;`.
 - **Inspect**: Similar to a print statement, this adds the value to a debug inspection table at the bottom of the text editor for a lever. Example includes `inspect a + 5;`. Any expression can be specified in the inspect target.
 - **Limit**: Limit ensures that a value is within a range. If it is above the range, it is set to the max value. If it is below the range, it is set to the min value.  An example is like `var x = 100; limit x to [0, 10]`; which results in x equaling 10. Note that the range can be unbounded such as `[0,]` for greater than or equal to 0 and `[,0]` for less than or equal to zero.
 - **Lifecycle**: Determine how long a collection of goods will take to become waste. Specifically, this determines average ton's lifetime within the provided collection having used a weighting of mass of each category included. This takes in variables which must be of the form `out.consumption.*MT` like `var timeToWaste = lifecycle of [consumptionPackagingMT, consumptionConstructionMT];`.
 - **Variables**: In addition to the built-in variables below, local variables can be created through the `var` keyword like `var x = 5;`.

For more information, review some of the pre-built scripts in the `pt` directory.

### Variables
All this in mind, built-in variables for the interventions scripts take the following form:

- **in.**: Variables like `in.chinaMinimumRecyclingRate` refer to the levers that a user can manipulate in the sliders.
- **out.**: Variables like `out.china.consumptionPackagingMT` refer to the outputs from the model. These should be modified by the interventions to change the visualizations.

The regions for `out.region` are as follows:

 - global
 - china
 - eu30
 - nafta
 - row

The sectorial consumption amounts are as follows (like `out.china.consumptionPackagingMT`):

 - consumptionPackagingMT
 - consumptionConstructionMT
 - consumptionTextileMT
 - consumptionHouseholdLeisureSportsMT
 - consumptionElectronicMT
 - consumptionTransporationMT
 - consumptionAgricultureMT
 - consumptionOtherMT

The end of life attributes are as follows (like `out.eu30.eolLandfillMT`):

 - eolLandfillMT
 - eolIncinerationMT
 - eolMismanagedMT
 - eolRecyclingMT

Finally, production are as follows (like `out.nafta.netImportsMT`):

 - netImportsMT
 - netExportsMT
 - domesticProductionMT

### Execution
The easiest way to execute plastic language scripts is through [the web tool](). See the prototype section of the details tab or modify any existing script by clicking on the more information link for that lever.

<br>

Local environment
--------------------------------------------------------------------------------
To execute these scripts through a locally hosted version of the browser-based tool, see the [project root](https://github.com/SchmidtDSE/plastics-prototype/tree/main). For information on how to exeucte these scripts outside the browser using Node, see [js_standalone](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone).

<br>

Deployment
--------------------------------------------------------------------------------
This directory is automatically processed during CI / CD operations. To add new scripts to deployment, define new levers to bind those scripts by modifying `index.json`. Furthermore, to add new interventions to the policy checkboxes offered on the overview tab, edit `scenarios.json`. Note that plastics language uses [Handlebars](https://handlebarsjs.com/) as a preprocessor. You can take advantage of this feature by adding values to the `attrs` field of a lever definition in `index.json`.

<br>

Development standards
--------------------------------------------------------------------------------
Please try to respect the following:

 - Limit lines to 100 characters.
 - Variables should follow camelCase convention.
 - Writing to variables should be limited to local scope (`var`) unless saving an output. Do not pollute the `in` and `out` namespaces with new variable definitions.

In addition to the above, long line continuations should use either parantheses or brackets like follows:

```
var totalWaste = (
  out.eu30.eolMismanagedMT +
  out.eu30.eolIncinerationMT +
  out.eu30.eolLandfillMT +
  out.eu30.eolRecyclingMT
);
```

Note that this project uses [Handlebars](https://handlebarsjs.com/) as a preprocessor and its general guidelines should also be followed where appropriate.

Changes to `pt` should run through the regular pull request process.

<br>

Open source
--------------------------------------------------------------------------------
Please see central listing of open source libraries used in the [project root](https://github.com/SchmidtDSE/plastics-prototype).
