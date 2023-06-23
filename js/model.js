class ProjectionModel {

    constructor(model) {
        const self = this;
        self._model = model;
    }

    project(year) {
        const self = this;
        return self._model.predict(year);
    }

}


class ProjectionModelSet {

    constructor() {
        const self = this;
        self._finished = false;
        self._models = new Map();
    }

    addModel(region, variable, model) {
        const self = this;

        if (self._finished) {
            throw "Already finished.";
        }
        
        self._models.set(self._getKey(region, variable), model);
    }

    finish() {
        const self = this;
        self._finished = true;
    }

    project(region, variable, year) {
        const self = this;

        if (!self._finished) {
            throw "Not finished.";
        }

        const model = self._models.get(self._getKey(region, variable));
        return model.predict(year);
    }

    _getKey(region, variable)  {
        const self = this;
        return region + "\t" + variable
    }

}


class Projector {

    constructor(modelSet) {
        const self = this;
        self._modelSet = modelSet;
    }

    project(year) {
        const self = this;
        const regions = self._projectRaw(year);
        self._correctScenario(regions);
        return regions;
    }

    _projectRaw(year) {
        const self = this;

        const retRegions = new Map();

        ALL_REGIONS.forEach((region) => {
            const retRegion = new Map();
            ALL_ATTRS.forEach((attr) => {
                retRegion.set(attr, self._modelSet.project(region, attr, year));
            });
            retRegions.set(region, retRegion);
        });

        return retRegions;
    }

    _correctScenario(regions) {
        const self = this;

        const rescale = (region, attrs) => {
            const named = attrs.map((x) => {
                return {"name": x, "value": region.get(x)};
            });
            const unnamed = named.map((x) => x["value"]);
            const total = unnamed.reduce((a, b) => a + b);
            const rescaled = named.map((x) => {
                return {"name": x["name"], "value": x["value"] / total};
            });
            
            rescaled.forEach((x) => {
                region.set(x["name"], x["value"]);
            });
        };

        ALL_REGIONS.forEach((regionName) => {
            const region = regions.get(regionName);
            rescale(region, CONSUMPTION_ATTRS);
            rescale(region, EOL_ATTRS);  
        });
    }

}


function buildProjector() {
    const getData = () => {
        return new Promise((resolve) => {
            Papa.parse("/data/full_frame.csv", {
                download: true,
                header: true,
                complete: (results) => resolve(results)
            });
        });
    };

    const buildProjector = (results) => {
        return new Promise((resolve) => {
            const projectorModelSet = new ProjectionModelSet();

            ALL_REGIONS.forEach((region) => {
                const regionRows = results["data"].filter(
                    (x) => x["region"] === region
                );
                ALL_ATTRS.forEach((attr) => {
                    const items = regionRows.map((x) => {
                        return {
                            "year": parseInt(x["year"]),
                            "value": parseFloat(x[attr])
                        };
                    });
                    const itemsValid = items.filter(
                        (x) => !isNaN(x["value"])
                    );
                    const years = itemsValid.map((x) => x["year"]);
                    const values = itemsValid.map((x) => x["value"]);
                    const model = new ML.SimpleLinearRegression(years, values);
                    projectorModelSet.addModel(region, attr, model);
                });
            });

            projectorModelSet.finish();

            const projector = new Projector(projectorModelSet);
            resolve(projector);
        });
    };

    return new Promise((resolve) => {
        getData().then(getData).then(buildProjector).then((projector) => {
            resolve(projector);
        });
    });
}
