import {main} from 'driver';


import {Compiler} from "compiler";


function buildPageTest() {
    QUnit.module("compiler", function() {

        function bootstrapPage() {
            return fetch("harness.html")
                .then((x) => x.text())
                .then((x) => {
                    document.getElementById("ui-harness").innerHTML = x;
                    return x;
                })
                .then((text) => {
                    return main(false, true);
                });
        }

        QUnit.test("renders tabs", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                assert.ok(document.getElementById("overview").innerHTML !== "");
                done();
            });
        });

        QUnit.test("renders cards", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const insideText = document.querySelector(".incinerated-waste-card")
                    .querySelector(".body")
                    .innerHTML;

                assert.ok(insideText !== "");
                assert.ok(insideText !== "123");
                done();
            });
        });

        QUnit.test("renders first tab timeseries", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                assert.ok(document.querySelector(".current-intervention-value-display") !== null);
                done();
            });
        });

        QUnit.test("renders top bars", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const width = document.getElementById("mismanaged-waste-goal-container")
                    .querySelector(".glyph")
                    .width;
                assert.ok(width !== undefined);
                done();
            });
        });

        QUnit.test("renders stages", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const width = document.getElementById("eol-container")
                    .querySelector(".glyph")
                    .width;
                assert.ok(width !== undefined);
                done();
            });
        });

        QUnit.test("renders detailed timeseries", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const width = document.getElementById("timeseries")
                    .querySelector(".bar")
                    .width;
                assert.ok(width !== undefined);
                done();
            });
        });

        QUnit.test("renders sparklines", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const path = document.getElementById("sparkline-container-eolLandfillMT")
                    .querySelector(".sparkline-glyph");
                assert.ok(path !== null);
                done();
            });
        });

        QUnit.test("renders bubblegraph", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const path = document.getElementById("bubblegraph")
                    .querySelector(".bubble");
                assert.ok(path !== null);
                done();
            });
        });

        QUnit.test("renders levers", function(assert) {
            const done = assert.async();
            bootstrapPage().then(() => {
                const lever = document.getElementById("input-chinaMinimumRecyclingRate");
                assert.ok(lever !== null);
                done();
            });
        });

    });
}


export {buildPageTest};
