import {Compiler} from "compiler";


function buildCompilerTest() {
    QUnit.module("compiler", function() {

        function compileProgram(target) {
            const compiler = new Compiler();
            return compiler.compile(target);
        }

        function buildWorkspace(year) {
            const workspace = new Map();
            
            workspace.set("in", new Map());
            workspace.get("in").set("test", 5);

            workspace.set("out", new Map());
            workspace.get("out").set("test", -1);
            workspace.get("out").set("testA", -2);
            workspace.get("out").set("testB", -3);

            workspace.set("local", new Map());

            workspace.set("meta", new Map());
            year = year === undefined ? 2050: year;
            workspace.get("meta").set("year", year);

            return workspace;
        }

        QUnit.test("arithmetic", function(assert) {
            const workspace = buildWorkspace();
            const code = "out.test = (in.test + 5) * 5;";

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 50);
        });

        QUnit.test("variable", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = in.test + 5;",
                "out.test = inner * 5;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 50);
        });

        QUnit.test("variable draw uniform", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = draw uniformly from 5 to 10;",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") >= 5);
            assert.ok(workspace.get("out").get("test") <= 10);
        });

        QUnit.test("variable draw normal", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = draw normally from mean of 5 std of 1;",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") >= 0);
            assert.ok(workspace.get("out").get("test") <= 10);
        });

        QUnit.test("repeat sum", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = sum 5 repeats of 3 + 1;",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 20);
        });

        QUnit.test("repeat product", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = product 2 repeats of 3 + 1;",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 16);
        });

        QUnit.test("repeat average", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = average 7 repeats of 3 + 1;",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 4);
        });

        QUnit.test("repeat draw", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = sum 2 repeats of (draw normally from mean of 5 std of 1);",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") >= 0);
            assert.ok(workspace.get("out").get("test") <= 20);
        });

        QUnit.test("repeat nested", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = product 2 repeats of (sum 2 repeats of 3 + 1);",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 64);
        });

        QUnit.test("limit both apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = (in.test + 5) * 5;",
                "limit inner to [10, 40];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 40);
        });

        QUnit.test("limit both no apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = (in.test + 5) * 5;",
                "limit inner to [10, 70];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 50);
        });

        QUnit.test("limit max apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = 100;",
                "limit inner to [, 70];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 70);
        });

        QUnit.test("limit max no apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = 100;",
                "limit inner to [, 120];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 100);
        });

        QUnit.test("limit min apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = 100;",
                "limit inner to [200, ];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 200);
        });

        QUnit.test("limit min no apply", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var inner = 100;",
                "limit inner to [0, ];",
                "out.test = inner;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 100);
        });

        QUnit.test("conditional without equal", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 1;",
                "var b = 2;",
                "var c = 3 if a < b else 4;",
                "var d = 5 if a > b else 6;",
                "out.testA = c;",
                "out.testB = d;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 3);
            assert.ok(workspace.get("out").get("testB") == 6);
        });

        QUnit.test("conditional with equal", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 1;",
                "var b = 1;",
                "var c = 3 if a <= b else 4;",
                "var d = 5 if a >= b else 6;",
                "out.testA = c;",
                "out.testB = d;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 3);
            assert.ok(workspace.get("out").get("testB") == 5);
        });

        QUnit.test("distribute linearly", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 10;",
                "var b = 20;",
                "var c = 6;",
                "distribute c across [a, b] linearly;",
                "out.testA = a;",
                "out.testB = b;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 13);
            assert.ok(workspace.get("out").get("testB") == 23);
        });

        QUnit.test("distribute proportionally", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 10;",
                "var b = 20;",
                "var c = 6;",
                "distribute c across [a, b] proportionally;",
                "out.testA = a;",
                "out.testB = b;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 12);
            assert.ok(workspace.get("out").get("testB") == 24);
        });

        QUnit.test("distribute proportionally zero", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 0;",
                "var b = 0;",
                "var c = 6;",
                "distribute c across [a, b] proportionally;",
                "out.testA = a;",
                "out.testB = b;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 3);
            assert.ok(workspace.get("out").get("testB") == 3);
        });

        QUnit.test("distribute proportionally indirect", function(assert) {
            const workspace = buildWorkspace();
            const code = [
                "var a = 10;",
                "var b = 20;",
                "var c = 6;",
                "distribute c across [a by 100, b by 200] proportionally;",
                "out.testA = a;",
                "out.testB = b;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("testA") == 12);
            assert.ok(workspace.get("out").get("testB") == 24);
        });

        QUnit.test("lifecycle waste", function(assert) {
            const workspace = buildWorkspace();
            workspace.get("in").set("recyclingDelay", 1);
            const code = [
                "out.test = lifecycle of [ out.china.eolRecyclingMT ];"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(workspace.get("out").get("test") == 1);
        });

        QUnit.test("lifecycle consumption", function(assert) {
            const workspace = buildWorkspace();

            workspace.get("out").set("china", new Map());
            workspace.get("out").get("china").set("consumptionPackagingMT", 2);
            workspace.get("out").get("china").set("consumptionConstructionMT", 3);

            workspace.get("in").set("consumptionPackagingLifecycle", 1);
            workspace.get("in").set("consumptionConstructionLifecycle", 10);

            const code = [
                "out.test = lifecycle of [",
                "out.china.consumptionPackagingMT,",
                "out.china.consumptionConstructionMT",
                "];"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            const expected = (1 * 2 + 10 * 3) / (2 + 3);
            const delta = Math.abs(workspace.get("out").get("test") - expected);
            assert.ok(delta < 0.0001);
        });

        QUnit.test("target before end", function(assert) {
            const workspace = buildWorkspace(2035);
            const code = [
                "var a = 10;",
                "change a by +10 over 2025 to 2045;",
                "out.test = a;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(Math.abs(workspace.get("out").get("test") - 15) < 0.0001);
        });

        QUnit.test("target at end", function(assert) {
            const workspace = buildWorkspace(2045);
            const code = [
                "var a = 10;",
                "change a by +10 over 2025 to 2045;",
                "out.test = a;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(Math.abs(workspace.get("out").get("test") - 20) < 0.0001);
        });

        QUnit.test("target after end", function(assert) {
            const workspace = buildWorkspace(2050);
            const code = [
                "var a = 10;",
                "change a by +10 over 2025 to 2045;",
                "out.test = a;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            program(workspace);
            assert.ok(Math.abs(workspace.get("out").get("test") - 20) < 0.0001);
        });

        QUnit.test("target mix up years", function(assert) {
            const workspace = buildWorkspace(2050);
            const code = [
                "var a = 10;",
                "change a by +10 over 2045 to 2025;",
                "out.test = a;"
            ].join("\n");

            const compileResult = compileProgram(code);
            assert.ok(compileResult.getErrors().length == 0);

            const program = compileResult.getProgram();
            try {
                program(workspace);
                assert.ok(false);
            } catch {
                assert.ok(true);
            }
            
        });

    });
}


export {buildCompilerTest};
