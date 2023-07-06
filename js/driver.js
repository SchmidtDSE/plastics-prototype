class Driver {

    constructor() {
        const self = this;

        self._compiler = null;
        self._dataLayer = null;
        self._reportPresenter = null;
        self._levers = null;
    }

    init() {
        const self = this;

        const promises = [
            buildCompiler(),
            buildDataLayer(() => self._getLevers()),
            buildReportPresenter(),
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

    _buildState() {
        const self = this;
        return self._dataLayer.buildState(2050);
    }

    _compileProgram(code) {
        const self = this;
        return self._compiler.compile(code);
    }

    _onInputChange() {
        const self = this;

        const state = self._buildState();

        self._getLevers().forEach((lever) => {
            const program = lever.getProgram();
            if (program === null) {
                return;
            }
            
            state.set("local", new Map());
            state.set("inspect", []);
            program(state);

            const inspects = state.get("inspect");
            lever.showInspects(inspects);
        });

        self._updateOutputs(state);
    }

    _updateOutputs(state) {
        const self = this;
        self._reportPresenter.render(state);
    }

}


function main() {
    const driver = new Driver();
    driver.init();
}


main();
