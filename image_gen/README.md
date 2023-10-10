Image Generation
================================================================================
To supplement the interactive visualizations offered by this tool, this project also offers support for some static visualizations.

<br>

Purpose
--------------------------------------------------------------------------------
These scripts generate static graphics which both supplemental text to the tool including the paper and text-based walkthrough.

<br>

Usage
--------------------------------------------------------------------------------
The easiest way to use these graphics is via CI / CD. Each web release includes these graphics at the following links:

 - [Consumption under business as usual](https://global-plastics-tool.org/img/consumption.png)
 - [Waste under business as usual](https://global-plastics-tool.org/img/waste.png)
 - [Line graph summary contextualizing consumption](https://global-plastics-tool.org/img/line.png)

In addition to using these automatically built charts, see below for local execution.

<br>

Local Environment
--------------------------------------------------------------------------------
To execute these graphics locally, some software is required:

 - [Python](https://docs.python-guide.org/starting/installation/) acts as automation scripting.
 - [Processing](https://processing.org/download) for highly customized visualization.

To run these locally:

 - Install Python requirements from the repository root directory: `pip install -r requirements.txt`.
 - Get a copy of the latest output database from the [project's modeling pipeline](https://github.com/SchmidtDSE/plastics-pipeline).
 - Execute the line graph script: `python image_gen/line.py data/combined.db img/line.png` where `combined.db` comes from the pipeline.
 - Build the butterfly visualization for waste and consumption: `processing-4.3/processing-java --sketch=butterfly --output=/tmp/butteflybuild --force --run data/overview_ml.csv $ROOT_DIR/img`. Note that `overview_ml.csv` comes from the pipeline.

<br>

Testing
--------------------------------------------------------------------------------
The CI / CD pipeline asserts successful generation of the plots with `bash support/check_image_outputs.sh`.

<br>

Deployment
--------------------------------------------------------------------------------
Deployment is handled by CI / CD systems. Simply open a pull request against the repository and, upon merging to `main` the results will be included in the build of the website.

<br>

Development Standards
--------------------------------------------------------------------------------
Where possible, please conform to the [Java Style Guide](https://google.github.io/styleguide/javaguide.html) and [Python Style Guide](https://google.github.io/styleguide/pyguide.html). Explicit testing requirements are not enforced on this subdirectory.

<br>

Open Source
--------------------------------------------------------------------------------
Please see central listing of open source libraries used in the [project root](https://github.com/SchmidtDSE/plastics-prototype).
