class CompileResult {

    constructor(program, errors) {
        const self = this;
        self._program = program;
        self._errors = errors;
    }

    getProgram() {
        const self = this;
        return self._program;
    }

    getErrors() {
        const self = this;
        return self._errors;
    }

}


class Compiler {

    compile(input) {
        const self = this;
        
        if (input.replaceAll("\n", "").replaceAll(" ", "") === "") {
            return new CompileResult(null, []);
        }

        const errors = [];

        const chars = new toolkit.antlr4.InputStream(input);
        const lexer = new toolkit.PlasticsLangLexer(chars);
        lexer.removeErrorListeners();
        lexer.addErrorListener({
            syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
                const result = `(line ${line}, col ${column}): ${msg}`;
                errors.push(result);
            }
        });

        const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
        const parser = new toolkit.PlasticsLangParser(tokens);

        parser.buildParsePlastics = true;
        parser.removeErrorListeners();
        parser.addErrorListener({
            syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
              const result = `(line ${line}, col ${column}): ${msg}`;
              errors.push(result);
            }
        });

        const programUncompiled = parser.program();

        if (errors.length > 0) {
            return new CompileResult(null, errors);
        }
        
        const program = programUncompiled.accept(new CompileVisitor());
        if (errors.length > 0) {
            return new CompileResult(null, errors);
        }

        return new CompileResult(program, errors);
    }

}


function buildCompiler() {
    return new Promise((resolve) => resolve(new Compiler()));
}

