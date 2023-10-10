JS Source
================================================================================
This directory contains the JS code needed by the browser-based tool and is distinct from the [standalone engine](https://github.com/SchmidtDSE/plastics-prototype/tree/main/js_standalone) executable from outside the browser via Node. Note that this directory, after CI / CD, includes machine-generated code.

<br>

Architecture
--------------------------------------------------------------------------------
This project uses model-view-presenter with `driver.js` coordinating among various other components. Note that D3 is used to render the charts but vanilla JS should be preferred otherwise. D3's dispatch is not used.

<br>

Machine-generated code
--------------------------------------------------------------------------------
There are two sources of machine generated code. First, the plastics language is written in ANTLR. There is also some preprocessor assembly of sources to integrate with both browser and Node package management. See `support/make.sh` for more details. Altogether, the following files are machine generated:

 - `plastics_lang.js`
 - `visitors.js`

Other files within this directory are not machine generated.
