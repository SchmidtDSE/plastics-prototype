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

    // TODO: distribute

});