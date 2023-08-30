Plastics Prototype
===============================================================================
Prototype for the plastics decision support tool with transparent intervention code / authoring.

<br>

## Variables
Built-in variables for the interventions scripts take the following form:

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

<br>

## Open source
Uses the following:

 - [ANTLR](https://www.antlr.org/index.html) under the [BSD License](https://www.antlr.org/license.html).
 - [Ace Editor](https://ace.c9.io/) under the [BSD License](https://github.com/ajaxorg/ace/blob/master/LICENSE).
 - [Select CSS](https://stackoverflow.com/questions/38788848) under [CC-BY-SA](https://stackoverflow.com/help/licensing).

Inspired by:

 - Maggie Appleton's [Programming Portals](https://maggieappleton.com/programming-portals)
 - Fernando Pérez's work on [reproducible research](https://www.youtube.com/watch?t=1521&v=GUyt_VXU8Aw&feature=youtu.be).
 - Bret Victor's [Inventing on Principle](https://www.youtube.com/watch?v=PUv66718DII)

Finally, thanks to the following some basic boilerplates:

 - [PlantLang](https://github.com/sampottinger/PlantLang) under the [MIT License](https://github.com/sampottinger/PlantLang/blob/main/LICENSE.txt) and its linked resources ([arithmetic](https://github.com/antlr/grammars-v4/blob/master/arithmetic/arithmetic.g4) by Tom Everett under inline BSD License and the [ANTLR Mega Tutorial](https://github.com/gabriele-tomassetti/antlr-mega-tutorial) by Gabriele Tomassetti under the [MIT License](https://github.com/gabriele-tomassetti/antlr-mega-tutorial/blob/master/LICENSE.md)).
 - [Pyafscgap](https://pyafscgap.org/) under the [BSD License](https://github.com/SchmidtDSE/afscgap/blob/main/LICENSE.md).
