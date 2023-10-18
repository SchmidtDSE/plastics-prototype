/**
 * Utilities to compile plastics language interventions.
 *
 * @license BSD, see LICENSE.md.
 */

import {CompileVisitor, toolkit} from "visitors";


/**
 * Structure contianing the result of attempting to compile a plastics language script.
 */
class CompileResult {
    /**
     * Create a new record of a compilation attempt.
     *
     * @param program The compiled program as a lambda if successful or null if unsuccessful.
     * @param errors Any errors enountered or empty list if no errors.
     */
    constructor(program, errors) {
        const self = this;
        self._program = program;
        self._errors = errors;
    }

    /**
     * Get the program as a lambda.
     *
     * @returns The compiled program as a lambda or null if compilation failed.
     */
    getProgram() {
        const self = this;
        return self._program;
    }

    /**
     * Get errors encountered in compiling the plastics language script.
     *
     * @returns Errors or empty list if no errors.
     */
    getErrors() {
        const self = this;
        return self._errors;
    }
}


/**
 * Utility to facilitate the compilation of plastics language scripts.
 */
class Compiler {
    /**
     * Compile a script.
     *
     * @param input The plastics language code to compile.
     * @returns CompileResult describing the outcome of the compilation attempt and, if applicable,
     *      the built lambda.
     */
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
            },
        });

        const tokens = new toolkit.antlr4.CommonTokenStream(lexer);
        const parser = new toolkit.PlasticsLangParser(tokens);

        parser.buildParsePlastics = true;
        parser.removeErrorListeners();
        parser.addErrorListener({
            syntaxError: (recognizer, offendingSymbol, line, column, msg, err) => {
                const result = `(line ${line}, col ${column}): ${msg}`;
                errors.push(result);
            },
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


/**
 * Build a new compiler.
 *
 * @returns Promise resolving to a new compiler utility.
 */
function buildCompiler() {
    return new Promise((resolve) => resolve(new Compiler()));
}


export {buildCompiler, Compiler};

