Plastics Prototype
===============================================================================
Prototype for the plastics decision support tool with transparent intervention code / authoring. The tool is primarily available at [https://global-plastics-tool.org/](https://global-plastics-tool.org/). This tool is in pre-release (like preprint), feedback welcome!

<br>

Purpose
--------------------------------------------------------------------------------
This tool allows users to explore potential future plastic outcomes including waste and consumption under different policy scenarios. It does this primarily through an [interactive browser-based tool](https://global-plastics-tool.org/) but also offers some [static visualizations](https://github.com/SchmidtDSE/plastics-prototype/tree/main/image_gen) and the ability to run these policy scenarios through Node [outside the browser](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone). Altogther, this tool provides new perspective to policy makers and other stakeholders on how to address global plastic waste, hoping to help inform efforts such as [UN INC on Plastic Pollution](https://www.unep.org/inc-plastic-pollution).

<br>

Usage
--------------------------------------------------------------------------------
There are multiple ways to interact with the tool. Note that many of these require `pt/index.json` rendered via `support/render_index.py`.

### In-browser
The primary way to interact with the tool is through the browser. See https://global-plastics-tool.org/ for the publicly available hosted version. To host it yourself or run it on your own machine, see the instructions below.

### Command line
The policy simulation engine can also run externally to the browswer through Node. See [js_standlaone](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone) for more details.

### Writing new interventions
See the [pt subdirectory](https://github.com/SchmidtDSE/plastics-prototype/tree/main/pt) (`pt`) for more details on how to add new interventions.

<br>

Modeling
--------------------------------------------------------------------------------
Note that the model repository including data and source code is available at [https://github.com/SchmidtDSE/plastics-pipeline](https://github.com/SchmidtDSE/plastics-pipeline).

<br>

Container Environment
--------------------------------------------------------------------------------
A containerized environment is available for both local execution of the application as well as development.

### Containerized execution
The application can be run through a Docker container:

 - [Install Docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04)
 - Build the environment: `docker compose up --build`
 - Navigate to localhost:8080 in your browser
 - Stop the container: `docker compose down`

This will build the application as well as generate the static [supporting graphs](https://github.com/SchmidtDSE/plastics-prototype/tree/main/image_gen) and selected [static scenario outputs](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone).

### Containerized development
Note that a containerized cloud development environment is also available. See `.gitpod.yml` and [GitPod](https://gitpod.io/) for more details. After opening the repository, start running the application with `python -m http.server`.

<br>

Manual Environment
--------------------------------------------------------------------------------
To run the tool locally with a custom or manual environment setup, some prerequisites are required:

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
There are two options for deploying the application.

### CI / CD
CI / CD can deploy changes after they merge to `deploy`, releasing to the [public version](https://global-plastics-tool.org/). Note that this tool does not have a backend and the contents of this repository simply need to be hosted as static files after building (see `support/setup_local.sh` for a minimal build).

### Container
The Docker container can also be deployed to various different environments. By default, it will use [nginx](https://nginx.org/en/) to host the static files on port 8080 but this may require port forwarding in your hosting environment. Furthermore, it does not run in a daemon. Please adjust `Dockerfile` and `docker-compose.yml` to fit your desired secuirty profile and hosting environment before deployment.

<br>

Development standards
--------------------------------------------------------------------------------
This project uses the following:

 - Primarily, front-end tests are supported through Grunt (`grunt`) and QUnit. Meanwhile style is generally enforced eslint (`npx eslint ./js/*.js`).
 - Note that CI / CD may execute other tests and all pull requests should be passing all test and lint operations before merge.
 - When in doubt, please follow the [JavaScript Style Guide](https://google.github.io/styleguide/jsguide.html).
 - Try to provide docstrings / JSDoc for public members (note that the `support` directory is excluded from this requirement at this time).
 - Reviewers may also impose certain requirements around usability and accessibility as to be discussed during reviews.

Please be kind. Open source is an act of love.

<br>

Publication
--------------------------------------------------------------------------------
Papers are still in process. Please cite preprint at [10.48550/arXiv.2312.11359](https://arxiv.org/abs/2312.11359) for now. Thank you!

<br>

Related Repositories
--------------------------------------------------------------------------------
See also [source code for "main" pipeline](https://github.com/SchmidtDSE/plastics-pipeline) and [source code for the GHG pipeline](https://github.com/SchmidtDSE/plastics-ghg-pipeline).

<br>

Open source
--------------------------------------------------------------------------------
The project uses the following:

 - [ANTLR](https://www.antlr.org/index.html) under the [BSD License](https://www.antlr.org/license.html).
 - [Ace Editor](https://ace.c9.io/) under the [BSD License](https://github.com/ajaxorg/ace/blob/master/LICENSE).
 - [ColorBrewer](https://colorbrewer2.org) under the [Apache v2 License](https://github.com/axismaps/colorbrewer/blob/master/LICENCE.txt).
 - [d3](https://d3js.org/) under the [ISC License](https://github.com/d3/d3/blob/main/LICENSE).
 - [es-module-shims](https://www.npmjs.com/package/es-module-shims) under the [MIT License](https://github.com/guybedford/es-module-shims/blob/main/LICENSE).
 - [Handlebars](https://handlebarsjs.com/) under the [MIT License](https://github.com/handlebars-lang/handlebars.js/blob/master/LICENSE).
 - [League Spartan](https://www.theleagueofmoveabletype.com/league-spartan) under the [OFL License](https://opensource.org/license/ofl-1-1/).
 - [Matplotlib](https://matplotlib.org/) under the [PSF License](https://matplotlib.org/stable/users/project/license.html).
 - [Pandas](https://pandas.pydata.org/) under the [BSD License](https://github.com/pandas-dev/pandas/blob/main/LICENSE).
 - [Papa Parse](https://www.papaparse.com/) under the [MIT License](https://github.com/mholt/PapaParse/blob/master/LICENSE).
 - [Polyfill.io](https://polyfill.io/v3/) under the [MIT License](https://github.com/JakeChampion/polyfill-service/blob/main/LICENSE.md).
 - [Popper](https://popper.js.org/) under the [MIT License](https://github.com/floating-ui/floating-ui/blob/master/LICENSE).
 - [Pure CSS Custom Dropdown Arrow](https://codepen.io/code-boxx/pen/RwxbpOz) under the [MIT License](https://codepen.io/code-boxx/pen/RwxbpOz).
 - [Qunit](https://qunitjs.com/) under the [MIT License](https://github.com/qunitjs/qunit/blob/main/LICENSE.txt).
 - [Simplebar](https://grsmto.github.io/simplebar/) under the [MIT License](https://github.com/Grsmto/simplebar/blob/master/LICENSE).
 - [Tabby](https://github.com/cferdinandi/tabby) under the [MIT License](https://github.com/cferdinandi/tabby/blob/master/LICENSE.md).
 - [Tippy](https://atomiks.github.io/tippyjs/) under the [MIT License](https://github.com/atomiks/tippyjs/blob/master/LICENSE).
 - [ua-parser 1.0.36](https://uaparser.js.org/) under the [MIT License](https://www.npmjs.com/package/ua-parser-js).

Note that the following may be invoked as executables like via the command line through CI / CD or by users of this tool but are not statically linked with the tool (and are not used during the execution of the web-based interactive tool):

 - [Grunt](https://gruntjs.com/) under the [MIT License](https://github.com/gruntjs/grunt/blob/main/LICENSE).
 - [grunt-contrib-connect](https://github.com/gruntjs/grunt-contrib-connect) under the 
 - [grunt-contrib-qunit](https://github.com/gruntjs/grunt-contrib-connect) under the [MIT License](https://github.com/gruntjs/grunt-contrib-connect/blob/main/LICENSE-MIT).
 - [Node](https://nodejs.org/en) under an [open source set of licenses](https://github.com/nodejs/node/blob/main/LICENSE).
 - [npm](https://www.npmjs.com/) under [Artistic v2 License](https://docs.npmjs.com/policies/npm-license).
 - [OpenJDK](https://openjdk.org/) under the [GPL License](https://www.gnu.org/licenses/old-licenses/gpl-2.0.en.html).
 - [Processing](https://processing.org/) under the [GPL License](https://github.com/benfry/processing4/blob/main/LICENSE.md).
 - [Webpack](https://webpack.js.org/) under the [MIT License](https://github.com/webpack/webpack/blob/main/LICENSE).

Our CI / CD systems via [GitHub Actions](https://docs.github.com/en/actions) also use the following:

Meanwhile, the optional containerized environment uses the following:

 - [Docker](https://docs.docker.com/engine/) under the [Apache v2 License](https://github.com/moby/moby/blob/master/LICENSE).
 - [Docker Compose](https://docs.docker.com/compose/) under the [Apache v2 License](https://github.com/docker/compose/blob/main/LICENSE).
 - [Nginx](https://nginx.org/en/) under a [BSD-like License](https://nginx.org/LICENSE).

Finally, thanks to the following some basic boilerplates / inspiration:

 - [ANTLR Mega Tutorial](https://github.com/gabriele-tomassetti/antlr-mega-tutorial) by Gabriele Tomassetti under the [MIT License](https://github.com/gabriele-tomassetti/antlr-mega-tutorial/blob/master/LICENSE.md).
 - [AntlrCalc](https://snorristurluson.github.io/AntlrCalc/) (the article) by Snorri Sturluson under the [MIT License](https://github.com/snorristurluson/snorristurluson.github.io).
 - [arithmetic](https://github.com/antlr/grammars-v4/blob/master/arithmetic/arithmetic.g4) by Tom Everett under inline BSD License.
 - Bret Victor's [Inventing on Principle](https://www.youtube.com/watch?v=PUv66718DII).
 - Fernando Pérez's work on [reproducible research](https://www.youtube.com/watch?t=1521&v=GUyt_VXU8Aw&feature=youtu.be).
 - Maggie Appleton's [Programming Portals](https://maggieappleton.com/programming-portals).
 - [PlantLang](https://github.com/sampottinger/PlantLang) under the [MIT License](https://github.com/sampottinger/PlantLang/blob/main/LICENSE.txt).
 - [Pyafscgap](https://pyafscgap.org/) under the [BSD License](https://github.com/SchmidtDSE/afscgap/blob/main/LICENSE.md).
 - [Tiny ANTLR Language](https://github.com/bkiers/tiny-language-antlr4/tree/master) under the [Unlicense License](https://github.com/bkiers/tiny-language-antlr4/blob/master/UNLICENSE).

Note that additional open source libraries used by the model pipeline are discussed at [https://github.com/SchmidtDSE/plastics-pipeline](https://github.com/SchmidtDSE/plastics-pipeline).
