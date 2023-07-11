class Driver {

    constructor() {
        const self = this;

        self._compiler = null;
        self._dataLayer = null;
        self._reportPresenter = null;
        self._levers = null;

        self._historicYears = [];
        for (let year = HISTORY_START_YEAR; year < START_YEAR; year++) {
            self._historicYears.push(year);
        }

        self._projectionYears = [];
        for (let year = START_YEAR; year <= MAX_YEAR; year++) {
            self._projectionYears.push(year);
        }
    }

    init() {
        const self = this;

        const promises = [
            buildCompiler(),
            buildDataLayer(() => self._getLevers()),
            buildReportPresenter(
                () => self._onInputChange()
            ),
            buildSliders(
                () => self._buildState(),
                (x) => self._compileProgram(x),
                () => self._onInputChange()
            )
        ];

        Promise.all(promises).then((values) => {
            self._compiler = values[0];
            self._dataLayer = values[1];
            self._reportPresenter = values[2];
            self._levers = values[3];

            self._onInputChange();
        });
    }

    _getLevers() {
        const self = this;
        return self._levers;
    }

    _buildState(year) {
        const self = this;

        const meta = new Map();
        meta.set("year", year);

        const state = self._dataLayer.buildState(year);
        state.set("meta", meta);

        return state;
    }

    _compileProgram(code) {
        const self = this;
        return self._compiler.compile(code);
    }

    _getStates(runPrograms) {
        const self = this;

        const states = new Map();

        const getPrograms = () => {
            return self._getLevers()
                .map((lever) => {
                    return {
                        "lever": lever,
                        "program": lever.getProgram()
                    };
                })
                .filter((leverInfo) => leverInfo["program"] !== null);
        }

        const programs = runPrograms ? getPrograms() : [];

        self._historicYears.forEach((year) => {
            const state = self._buildState(year);
            states.set(year, state);
        });

        self._projectionYears.forEach((year) => {
            const state = self._buildState(year);

            programs.forEach((programInfo) => {
                const program = programInfo["program"];
                const lever = programInfo["lever"];
                
                state.set("local", new Map());
                state.set("inspect", []);
                program(state);

                const inspects = state.get("inspect");
                lever.showInspects(inspects);
            });

            states.set(year, state);
        });

        return states;
    }

    _onInputChange() {
        const self = this;

        const businessAsUsual = self._getStates(false);
        const withInterventions = self._getStates(true);

        self._updateOutputs(businessAsUsual, withInterventions);
    }

    _updateOutputs(businessAsUsual, withInterventions) {
        const self = this;
        self._reportPresenter.render(businessAsUsual, withInterventions);
    }

}


function main() {
    const driver = new Driver();
    driver.init();
}


main();
