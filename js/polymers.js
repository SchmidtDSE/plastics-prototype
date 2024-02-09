import {CACHE_BUSTER} from "const";


class PolymerInfo {

    constructor(subtype, region, polymer, percent, series) {
        const self = this;
        self._subtype = subtype;
        self._region = region;
        self._polymer = polymer;
        self._percent = percent;
        self._series = series;
    }

    getSubtype() {
        const self = this;
        return self._subtype;
    }
    
    getRegion() {
        const self = this;
        return self._region;
    }
    
    getPolymer() {
        const self = this;
        return self._polymer;
    }
    
    getPercent() {
        const self = this;
        return self._percent;
    }
    
    getSeries() {
        const self = this;
        return self._series;
    }

    getKey() {
        const self = this;
        return getPolymerKey(self._region, self._subtype, self._polymer);
    }

}


function getPolymerKey(region, subtype, polymer) {
    return region + "\t" + subtype + "\t" + polymer;
}


class SubtypeInfo {

    constructor(year, region, subtype, ratio) {
        const self = this;
        self._year = year;
        self._region = region;
        self._subtype = subtype;
        self._ratio = ratio;
    }
    
    getYear() {
        const self = this;
        return self._year;
    }
    
    getRegion() {
        const self = this;
        return self._region;
    }
    
    getSubtype() {
        const self = this;
        return self._subtype;
    }
    
    getRatio() {
        const self = this;
        return self._ratio;
    }

    getKey() {
        const self = this;
        return getSubtypeKey(self._year, self._region, self._subtype);
    }

}


function getSubtypeKey(year, region, subtype) {
    return year + "\t" + region + "\t" + subtype;
}


class PolymerMatricies {

    constructor() {
        const self = this;
        self._polymerInfos = new Map();
        self._subtypeInfos = new Map();
        
        self._subtypes = new Set();
        self._years = new Set();
        self._regions = new Set();
        self._polymers = new Set();
        self._series = new Set();
    }

    addPolymer(target) {
        const self = this;
        self._polymerInfos.set(target.getKey(), target);
        self._subtypes.add(subtype);
        self._regions.add(region);
        self._polymers.add(polymer);
        self._series.add(series);
    }

    getPolymer(region, subtype, polymer) {
        const self = this;
        const key = getPolymerKey(region, subtype, polymer);
        return self._polymerInfos.get(key);
    }

    addSubtype(target) {
        const self = this;
        self._subtypeInfos.set(target.getKey(), target);
        self._years.add(target.getYear());
        self._regions.add(target.getRegion());
        self._subtypes.add(target.getSubtype());
    }

    getSubtype(year, region, subtype) {
        const self = this;
        const key = getSubtypeKey(year, region, subtype);
        return self._subtypeInfos.get(key);
    }

    getSubtypes() {
        const self = this;
        return self._subtypes;
    }

    getRegions() {
        const self = this;
        return self._regions;
    }

    getPolymers() {
        const self = this;
        return self._polymers;
    }

    getSeries() {
        const self = this;
        return self._series;
    }

}


class TradeAdder {

    constructor(matricies) {
        const self = this;
        self._matricies = matricies;
    }

    getPolymers(state) {
        const self = this;
        
    }

}


function getPolymerMatricies() {
    const subtypeRawFuture = new Promise((resolve) => {
        Papa.parse("/data/production_trade_subtype_ratios.csv.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const subtypeFuture = subtypeRatiosRawFuture.then((rows) => {
        return rows.map((row) => {
            return new SubtypeInfo(
                row['year'],
                row['region'],
                row['subtype'],
                row['ratio']
            );
        });
    });

    const polymerRawFuture = new Promise((resolve) => {
        Papa.parse("/data/polymer_ratios.csv?v=" + CACHE_BUSTER, {
            download: true,
            header: true,
            complete: (results) => resolve(results["data"]),
            dynamicTyping: true,
        });
    });

    const polymerFuture = polymerRatiosRawFuture.then((rows) => {
        return rows.map((row) => {
            return new PolymerInfo(
                row['subtype'],
                row['region'],
                row['polymer'],
                row['percent'],
                row['series']
            );
        });
    });

    return Promise.all([subtypeFuture, polymerFuture]).then((results) => {
        const subtypeInfos = results[0];
        const polymerInfos = results[1];
        
        const retMatricies = new PolymerMatricies();
        subtypeInfos.forEach((record) => retMatricies.addSubtype(record));
        polymerInfos.forEach((record) => retMatricies.addPolymer(record));

        return retMatricies;
    });
}
