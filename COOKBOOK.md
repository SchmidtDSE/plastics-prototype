# Cookbook
This document describes common developer operations to supplement the README and inline documentation.

<br>

## Running via Docker
The web application can run from a container:

 - [Install Docker](https://www.digitalocean.com/community/tutorials/how-to-install-and-use-docker-on-ubuntu-20-04)
 - Build the environment: `docker compose up --build`
 - Navigate to localhost:8080 in your browser
 - Stop the container: `docker compose down`

This will start a server which will listen at port 8080.

<br>

## Updating Data
The web application uses data from both a [base model pipeline](https://github.com/SchmidtDSE/plastics-pipeline) and a [supplemental polymer / GHG pipeline](https://github.com/SchmidtDSE/plastics-ghg-pipeline). These come as two main files which can be placed inside the `data` directory (`/workspace/data` in the Docker container).

 - `web.csv`: This is a rename of `overview_ml.csv` from the [base model pipeline](https://github.com/SchmidtDSE/plastics-pipeline) output.
 - `production_trade_subtype_ratios.csv`: This comes from outputs in the [supplemental polymer / GHG pipeline](https://github.com/SchmidtDSE/plastics-ghg-pipeline).

These can be replaced and the web application reloaded.

<br>

## Adding regions
The web application can incorporate new regions if they are in the underlying data (see Updating Data) by modifying `regions.json`. This involves adding the following constants:

 - `productionPetEmissions`: GHG emissions associated with PET production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPetEmissions`: GHG emissions associated with PET at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionHdpeEmissions`: GHG emissions associated with HDPE production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionHdpeEmissions`: GHG emissions associated with HDPE at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionPvcEmissions`: GHG emissions associated with PVC production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPvcEmissions`: GHG emissions associated with PVC at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `proudctionLldpeEmissions`: GHG emissions associated with (L)LDPE production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionLldpeEmissions`: GHG emissions associated with (L)LDPE at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionPpEmissions`: GHG emissions associated with PP production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPpEmissions`: GHG emissions associated with PP at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionPsEmissions`: GHG emissions associated with PS production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPsEmissions`: GHG emissions associated with PS at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionPurEmissions`: GHG emissions associated with PUR production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPurEmissions`: GHG emissions associated with PUR at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionPpaEmissions`: GHG emissions associated with PP&A fibers production at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionPpaEmissions`: GHG emissions associated with PP&A fibers at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionAdditivesEmissions`: GHG emissions associated with additives at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionAdditivesEmissions`: GHG emissions associated with additives at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionOtherThermosetsEmissions`: GHG emissions associated with other thermosets at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionOtherThermosetsEmissions`: GHG emissions associated with other thermosets at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `productionOtherThermoplasticsEmissions`: GHG emissions associated with other thermoplastics at start of life. This should be CO2 equivalent (kg CO2e/ton).
 - `conversionOtherThremoplasticsEmissions`: GHG emissions associated with other thermoplastics at conversion step, applying to both primary and secondary production. This should be CO2 equivalent (kg CO2e/ton).
 - `landfillEmissions`: GHG emissions associated with material reaching end of life and then being landfilled. This should be CO2 equivalent (kg CO2e/ton).
 - `incinerationEmissions`: GHG emissions associated with material reaching end of life and then being incinerated. This should be CO2 equivalent (kg CO2e/ton).
 - `recyclingEmissions`: GHG emissions associated with material reaching end of life and then being recycled. This should be CO2 equivalent (kg CO2e/ton).
 - `mismanagedEmissions`: GHG emissions associated with material reaching end of life and then being mismanaged. This should be CO2 equivalent (kg CO2e/ton).
 - `percentTransportationAdditives`: Percent of volume in transportation sector that is additives. Should be between 0 and 100.
 - `percentPackagingAdditives`: Percent of volume in packaging sector that is additives. Should be between 0 and 100.
 - `percentConstructionAdditives`: Percent of volume in construction sector that is additives. Should be between 0 and 100.
 - `percentElectronicAdditivies`: Percent of volume in electronic sector that is additives. Should be between 0 and 100.
 - `percentHlsAdditives`: Percent of volume in household, leisure, sports sector that is additives. Should be between 0 and 100.
 - `percentAgricultureAdditives`: Percent of volume in agriculture sector that is additives. Should be between 0 and 100.
 - `percentTextileAdditives`: Percent of volume in textiles sector that is additives. Should be between 0 and 100.
 - `percentOtherAdditives`: Percent of volume for goods / products not in the above sectors that is additives. Should be between 0 and 100.
 - `recyclingCost`: Cost (USD) to recycle per ton within this region.
 - `incerationCost`: Cost (USD) to incinerate per ton within this region.
 - `landfillCost`: Cost (USD) to landfill per ton within this region.
 - `packagingTaxPower`: Power constant for the packging tax as described in the [consumption tax intervention documentation](https://global-plastics-tool.org/pdf/consumption_tax.pdf).
 - `packagingTaxMultiplier`: Multiplier for the packging tax as described in the [consumption tax intervention documentation](https://global-plastics-tool.org/pdf/consumption_tax.pdf).
 - `percentRecyclingYieldLoss`: Number between 0 and 100 indicating the percent of material lost in recycling in region.
 - `percentReuseExhaustion`: Number between 0 and 100 indicating the percent of reusable goods that are "exhausted" per lifecycle (see sector lifecycles).
 - `percentIncinerationPlastic`: Number between 0 and 100 indicating the percent of incineration within the region that is plastics waste.
 - `percentLandfillPlastic`: Number between 0 and 100 indicating the percent of landfill within the region that is plastics waste.
 - `percentPackagingPs`: Percent of the packaging sector in the region that is polystyrene. This is a future facing assumption unlike the polymer actuals or region wide polymer predictions. Number between 0 and 100.
 - `percentPackagingSingleUse`: Percent of the packaging sector in the region that is single use. This is a a future facing assumption. Number between 0 and 100.

Note that, at time of writing, the supplemental graphs do not change automatically due to layout constraints but the web application does not require these static images to update. Finally, developers must also update the region specific values in `pt/scenarios.json` which control the defaults used in the "simplified" checkboxes on the overview tab.
