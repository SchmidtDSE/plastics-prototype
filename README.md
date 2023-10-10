Plastics Prototype
===============================================================================
Prototype for the plastics decision support tool with transparent intervention code / authoring.

<br>

Purpose
--------------------------------------------------------------------------------
This tool allows users to explore potential future plastic outcomes including waste and consumption under different policy scenarios. It does this primarily through an [interactive browser-based tool](https://global-plastics-tool.org/) but also offers some [static visualizations](https://github.com/SchmidtDSE/plastics-prototype/tree/main/image_gen) and the ability to run these policy scenarios through Node [outside the browser](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone). Altogther, this tool provides new perspective to policy makers and other stakeholders on how to address global plastic waste, hoping to help inform efforts such as [UN INC on Plastic Pollution](https://www.unep.org/inc-plastic-pollution).

<br>

Usage
--------------------------------------------------------------------------------
There are multiple ways to interact with the tool.

### In-browser
The primary way to interact with the tool is through the browser. See https://global-plastics-tool.org/ for the publicly available hosted version. To host it yourself or run it on your own machine, see the instructions below.

### Command line
The policy simulation engine can also run externally to the browswer through Node. See [js_standlaone](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone) for more details.

### Writing new interventions
See the [pt subdirectory](https://github.com/SchmidtDSE/plastics-prototype/tree/main/pt) (`pt`) for more details on how to add new interventions.

<br>

Local Environment
--------------------------------------------------------------------------------
To run the tool locally, some prerequisites are required:

 - [Java](https://adoptium.net/) allows for ANTLR source generation as required for the plastics intervention language.
 - [Node](https://nodejs.org/en) is required in order to run grunt and webpack, enabling preparation of the front-end.
 - [Python](https://docs.python-guide.org/starting/installation/) acts as automation scripting.

Having installed the above, execute the following to start the local server:

 - Install Python dependencies: `pip install -r requirements.txt`.
 - Setup the local environment with `bash support/setup_local.sh` which includes downloading a copy of the underlying data.
 - Execute a local web server for example `python -m http.server`.

Note that optional static visualizations are also available under [image_gen](https://github.com/SchmidtDSE/plastics-prototype/tree/main/image_gen). See that sub-directory's README for more details.

<br>

Deployment
--------------------------------------------------------------------------------
CI / CD can deploy changes after they merge to `main`, releasing to the [public version](https://global-plastics-tool.org/). Note that this tool does not have a backend and the contents of this repository simply need to be hosted as static files after building (see `support/setup_local.sh` for a minimal build).

<br>

Development standards
--------------------------------------------------------------------------------
Front-end tests are supported through Grunt (`grunt`) and eslint (`npx eslint ./js/*.js`). Note that CI / CD may execute other tests and all pull requests should be passing all test and lint operations before merge. When in doubt, please follow the [JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html). Reviewers may also impose certain requirements around usability and accessibility as to be discussed during reviews.

<br>

Open source
--------------------------------------------------------------------------------
The project uses the following:

 - [ANTLR](https://www.antlr.org/index.html) under the [BSD License](https://www.antlr.org/license.html).
 - [Ace Editor](https://ace.c9.io/) under the [BSD License](https://github.com/ajaxorg/ace/blob/master/LICENSE).
 - d3
 - es-module-shims
 - Grunt
 - grunt-contrib-connect
 - grunt-contrib-qunit
 - Handlebars
 - League Spartan
 - Matplotlib
 - Node
 - OpenJDK
 - Pandas
 - PapaParse
 - Polyfill
 - Popper
 - Processing
 - Qunit
 - [Select CSS](https://stackoverflow.com/questions/38788848) under [CC-BY-SA](https://stackoverflow.com/help/licensing).
 - Simplebar
 - Tabby
 - Tippy
 - ua-parser
 - Weback

Inspired by:

 - Maggie Appleton's [Programming Portals](https://maggieappleton.com/programming-portals)
 - Fernando Pérez's work on [reproducible research](https://www.youtube.com/watch?t=1521&v=GUyt_VXU8Aw&feature=youtu.be).
 - Bret Victor's [Inventing on Principle](https://www.youtube.com/watch?v=PUv66718DII)

Finally, thanks to the following some basic boilerplates:

 - [PlantLang](https://github.com/sampottinger/PlantLang) under the [MIT License](https://github.com/sampottinger/PlantLang/blob/main/LICENSE.txt) and, specifically, its linked resources ([arithmetic](https://github.com/antlr/grammars-v4/blob/master/arithmetic/arithmetic.g4) by Tom Everett under inline BSD License as well as the [ANTLR Mega Tutorial](https://github.com/gabriele-tomassetti/antlr-mega-tutorial) by Gabriele Tomassetti under the [MIT License](https://github.com/gabriele-tomassetti/antlr-mega-tutorial/blob/master/LICENSE.md)).
 - [Pyafscgap](https://pyafscgap.org/) under the [BSD License](https://github.com/SchmidtDSE/afscgap/blob/main/LICENSE.md).
