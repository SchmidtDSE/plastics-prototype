import {CONSUMPTION_ATTRS, EOL_ATTRS} from "const";

// eslint-disable-next-line no-undef
const toolkit = PlasticsLang.getToolkit();


/**
 * Visitor which compiles the PT program to JS functions.
 *
 * Visitor which compiles the PT program to JS functions, returning a list of
 * functions which take in a State object and can be run in series one per
 * program frame render.
 */
class CompileVisitor extends toolkit.PlasticsLangVisitor {
    /**
     * Visit a number node with interpretation of number modifiers.
     *
     * @return Function which takes in a State object and returns a float
     *     corresponding to number value (literal) intended by the user.
     */
    visitNumber(ctx) {
        const self = this;

        const raw = ctx.getText();

        const signMultiplier = raw.includes("-") ? -1 : 1;

        const bodyRawText = ctx.getChild(ctx.getChildCount() - 1).getText();
        const bodyParsed = signMultiplier * parseFloat(bodyRawText);

        return (state) => {
            const retVal = bodyParsed;
            return retVal;
        };
    }

    /**
     * Visit expression which adds or subtracts two other expressions.
     *
     * @return Function which takes in a State object and returns a float.
     */
    visitAdditionExpression(ctx) {
        const self = this;

        const priorExpression = ctx.getChild(0).accept(self);
        const opFunc = ctx.op.text === "+" ? (a, b) => a + b : (a, b) => a - b;
        const afterExpression = ctx.getChild(2).accept(self);

        return (state) => {
            return opFunc(priorExpression(state), afterExpression(state));
        };
    }

    /**
     * Visit expression which resolves to a single number.
     *
     * @return Function which takes in a State object and returns a float.
     */
    visitSimpleExpression(ctx) {
        const self = this;
        return ctx.getChild(0).accept(self);
    }

    /**
     * Visit expression which is inside parantheses.
     *
     * @return Function which takes in a State object and returns a float.
     */
    visitParenExpression(ctx) {
        const self = this;
        return ctx.getChild(1).accept(self);
    }

    /**
     * Visit expression which raises to a power.
     *
     * @return Function which takes in a State object and returns a float.
     */
    visitPowExpression(ctx) {
        const self = this;

        const priorExpression = ctx.getChild(0).accept(self);
        const opFunc = (a, b) => Math.pow(a, b);
        const afterExpression = ctx.getChild(2).accept(self);

        return (state) => {
            return opFunc(priorExpression(state), afterExpression(state));
        };
    }

    /**
     * Visit expression which multiplies or divides two other expressions.
     *
     * @return Function which takes in a State object and returns a float.
     */
    visitMultiplyExpression(ctx) {
        const self = this;

        const priorExpression = ctx.getChild(0).accept(self);
        let opFunc = null;
        if (ctx.op.text === "*") {
            opFunc = (a, b) => a * b;
        } else if (ctx.op.text === "/") {
            opFunc = (a, b) => a / b;
        }
        const afterExpression = ctx.getChild(2).accept(self);

        return (state) => {
            return opFunc(priorExpression(state), afterExpression(state));
        };
    }

    visitSimpleIdentifier(ctx) {
        const self = this;

        const raw = ctx.getText();

        return (state) => {
            return self._getValue(raw, state);
        };
    }

    visitLifecycleExpression(ctx) {
        const self = this;

        return ctx.getChild(0).accept(self);
    }

    visitLifecycle(ctx) {
        const self = this;

        const numIdentifiers = Math.ceil((ctx.getChildCount() - 4) / 2.0);
        const identifiers = [];
        for (let i = 0; i < numIdentifiers; i++) {
            const childIndex = i * 2 + 3;
            const identifier = ctx.getChild(childIndex).getText();
            if (!identifier.startsWith("out.")) {
                throw "Identifier for lifecycle must be in out.";
            }
            identifiers.push(identifier);
        }

        const getVarName = (varFullName) => {
            const varPieces = varFullName.split(".");
            const varName = varPieces[varPieces.length - 1];
            return varName;
        };

        const makeHas = (target) => {
            return (varFullName) => {
                const varName = getVarName(varFullName);
                return target.includes(varName);
            };
        };
        const wasteIdentifiers = identifiers.filter(makeHas(EOL_ATTRS));
        const consumptionIdentifiers = identifiers.filter(makeHas(CONSUMPTION_ATTRS));

        if (wasteIdentifiers.length > 0 && consumptionIdentifiers.length > 0) {
            throw "Cannot mix lifetimes of waste and consumption";
        }

        const nonMatched = identifiers.filter((x) => !wasteIdentifiers.includes(x))
            .filter((x) => !consumptionIdentifiers.includes(x));

        if (nonMatched.length > 0) {
            throw "Could not find lifetimes for " + nonMatched[0];
        }

        const getLifecycleForWaste = (state) => {
            return self._getValue("in.recyclingDelay", state);
        };

        const getLifecycleForConsumption = (state) => {
            const getLeverName = (identifier) => {
                return getVarName(identifier).replace("MT", "Lifecycle");
            };

            const lifetimes = consumptionIdentifiers.map(getLeverName)
                .map((x) => "in." + x)
                .map((x) => self._getValue(x, state));

            const weights = consumptionIdentifiers.map((x) => {
                return self._getValue(x, state);
            });

            const numIdentifiers = consumptionIdentifiers.length;
            let runningTotal = 0;
            let totalWeights = 0;
            for (let i = 0; i < numIdentifiers; i++) {
                runningTotal += lifetimes[i] * weights[i];
                totalWeights += weights[i];
            }
            return runningTotal / totalWeights;
        };

        return (state) => {
            if (wasteIdentifiers.length > 0) {
                return getLifecycleForWaste(state);
            } else {
                return getLifecycleForConsumption(state);
            }
        };
    }

    visitDefinition(ctx) {
        const self = this;

        const name = ctx.getChild(1).getText();
        if (name.indexOf(".") != -1) {
            throw "Cannot make new variables with periods in the name.";
        }

        const expression = ctx.getChild(3).accept(self);

        return (state) => {
            const result = expression(state);
            const localVars = state.get("local");
            if (localVars.has(name)) {
                throw name + " was defined multiple times.";
            }
            localVars.set(name, result);
        };
    }

    visitAssignment(ctx) {
        const self = this;

        const name = ctx.getChild(0).getText();
        const expression = ctx.getChild(2).accept(self);

        return (state) => {
            const result = expression(state);
            self._setValue(name, result, state);
        };
    }

    /**
     * Visit a command node.
     *
     * @return Array with functions which execute the user's command.
     */
    visitCommand(ctx) {
        const self = this;
        const instructions = ctx.getChild(0).accept(self);

        return instructions;
    }

    /**
     * Visit a program node and all children.
     *
     * @return Array with functions which execute the user's commands.
     */
    visitProgram(ctx) {
        const self = this;

        const instructions = [];

        const numCommands = ctx.getChildCount() / 2;
        for (let i = 0; i < numCommands; i++) {
            const newInstructions = ctx.getChild(i * 2).accept(self);
            instructions.push(newInstructions);
        }

        return (state) => {
            instructions.forEach((instruction) => instruction(state));
        };
    }

    visitCondition(ctx) {
        const self = this;

        const priorExpression = ctx.getChild(0).accept(self);
        let opFunc = null;
        if (ctx.op.text === "==") {
            opFunc = (a, b) => a == b;
        } else if (ctx.op.text === "!=") {
            opFunc = (a, b) => a != b;
        } else if (ctx.op.text === "<") {
            opFunc = (a, b) => a < b;
        } else if (ctx.op.text === ">") {
            opFunc = (a, b) => a > b;
        } else if (ctx.op.text === ">=") {
            opFunc = (a, b) => a >= b;
        } else if (ctx.op.text === "<=") {
            opFunc = (a, b) => a <= b;
        }
        const afterExpression = ctx.getChild(2).accept(self);

        return (state) => {
            return opFunc(priorExpression(state), afterExpression(state));
        };
    }

    visitConditional(ctx) {
        const self = this;

        const condition = ctx.cond.accept(self);
        const positive = ctx.pos.accept(self);
        const negative = ctx.neg.accept(self);

        return (state) => {
            if (condition(state)) {
                return positive(state);
            } else {
                return negative(state);
            }
        };
    }

    visitCallCap(ctx, opFunc) {
        const self = this;

        const identifier = ctx.operand.getText();
        const limitExpression = ctx.limit.accept(self);

        return (state) => {
            const val = opFunc(
                self._getValue(identifier, state),
                limitExpression(state),
            );
            self._setValue(identifier, val, state);
        };
    }

    visitCallMin(ctx) {
        const self = this;
        return self.visitCallCap(ctx, (a, b) => a < b ? a : b);
    }

    visitCallMax(ctx) {
        const self = this;
        return self.visitCallCap(ctx, (a, b) => a > b ? a : b);
    }

    visitCallBound(ctx) {
        const self = this;

        const identifier = ctx.operand.getText();
        const lowerExpression = ctx.lower.accept(self);
        const upperExpression = ctx.upper.accept(self);

        return (state) => {
            const getBoundValue = () => {
                const operand = self._getValue(identifier, state);
                const lower = lowerExpression(state);
                const upper = upperExpression(state);

                if (operand > upper) {
                    return upper;
                } else if (operand < lower) {
                    return lower;
                } else {
                    return operand;
                }
            };

            const newValue = getBoundValue();
            self._setValue(identifier, newValue, state);
        };
    }

    visitDistribute(ctx) {
        const self = this;

        const valueExpression = ctx.value.accept(self);
        const methodName = ctx.method.text;

        const numIdentifiers = Math.ceil((ctx.getChildCount() - 6) / 2.0);
        const identifiers = [];
        for (let i = 0; i < numIdentifiers; i++) {
            const childIndex = i * 2 + 4;
            identifiers.push(ctx.getChild(childIndex).getText());
        }

        const isLinear = methodName === "linearly";

        return (state) => {
            const valueToDistribute = valueExpression(state);

            if (Math.abs(valueToDistribute) < 1e-7) {
                return;
            }

            const totalTargetsValue = identifiers.map((identifier) => {
                return self._getValue(identifier, state);
            }).reduce((a, b) => a + b);

            const getChangeProportional = (beforeValue) => {
                return beforeValue / totalTargetsValue * valueToDistribute;
            };

            const getChangeLinear = (beforeValue) => {
                return 1 / identifiers.length * valueToDistribute;
            };

            const getChange = isLinear ? getChangeLinear : getChangeProportional;

            identifiers.forEach((identifier) => {
                const beforeValue = self._getValue(identifier, state);
                const change = getChange(beforeValue);
                const newValue = beforeValue + change;
                if (beforeValue != 0) {
                    self._setValue(identifier, newValue, state);
                }
            });
        };
    }

    visitInspect(ctx) {
        const self = this;

        const valueText = ctx.value.getText();
        const valueExpression = ctx.value.accept(self);

        return (state) => {
            const value = valueExpression(state);
            state.get("inspect").push({"name": valueText, "value": value});
        };
    }

    visitTarget(ctx) {
        const self = this;

        const subject = ctx.subject.getText();
        const valueExpression = ctx.value.accept(self);
        const startYear = ctx.startyear.accept(self);
        const endYear = ctx.endyear.accept(self);

        return (state) => {
            const value = valueExpression(state);

            const startYearRealized = startYear(state);
            const endYearRealized = endYear(state);

            if (startYearRealized >= endYearRealized) {
                throw "Start year must be earlier than end year for change.";
            }

            const currentYear = state.get("meta").get("year");

            const pastEnd = currentYear > endYearRealized;
            const effectiveCurrentYear = pastEnd ? endYearRealized : currentYear;

            const slope = value / (endYearRealized - startYearRealized);
            const change = slope * (effectiveCurrentYear - startYearRealized);
            const oldValue = self._getValue(subject, state);
            const newValue = oldValue + change;

            self._setValue(subject, newValue, state);
        };
    }

    _getValue(raw, state) {
        const resolved = raw.indexOf(".") == -1 ? "local." + raw : raw;
        const pieces = resolved.split(".");
        let value = state;
        pieces.forEach((piece) => {
            if (!value.has(piece)) {
                throw "Could not find " + piece + " (" + raw + ")";
            }
            value = value.get(piece);
        });
        return value;
    }

    _setValue(name, result, state) {
        const self = this;


        const resolved = name.indexOf(".") == -1 ? "local." + name : name;
        const pieces = resolved.split(".");

        let container = state;
        pieces.slice(0, -1).forEach((piece) => {
            if (!container.has(piece)) {
                throw "Could not find " + piece + " (" + name + ")";
            }
            container = container.get(piece);
        });

        const finalPiece = pieces[pieces.length - 1];
        if (!container.has(finalPiece)) {
            throw "Could not find " + finalPiece + " (" + name + ")";
        }

        container.set(finalPiece, result);
    }
}



export {toolkit, CompileVisitor};
