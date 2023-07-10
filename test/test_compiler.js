QUnit.module("compiler", function() {

    function compileProgram(target) {
        const compiler = new Compiler();
        return compiler.compile(target);
    }

    function buildWorkspace() {
        const workspace = new Map();
        
        workspace.set("in", new Map());
        workspace.get("in").set("test", 5);

        workspace.set("out", new Map());
        workspace.get("out").set("test", -1);
        workspace.get("out").set("testA", -2);
        workspace.get("out").set("testB", -3);

        workspace.set("local", new Map());

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

});