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
        } else if (ctx.op.text === "^") {
            opFunc = (a, b) => Math.pow(a, b);
        }
        const afterExpression = ctx.getChild(2).accept(self);

        return (state) => {
            return opFunc(priorExpression(state), afterExpression(state));
        };
    }

    visitSimpleIdentifier(ctx) {
        const self = this;

        const raw = ctx.getText();
        const resolved = raw.indexOf(".") == -1 ? "local." + raw : raw;
        const pieces = resolved.split(".");

        return (state) => {
            let value = state;
            pieces.forEach((piece) => {
                if (!value.has(piece)) {
                    throw "Could not find " + piece + " in " + raw;
                }
                value = value.get(piece);
            });
            return value;
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
        const resolved = name.indexOf(".") == -1 ? "local." + name : name;
        const pieces = resolved.split(".");

        const expression = ctx.getChild(2).accept(self);

        return (state) => {
            const result = expression(state);
            
            let container = state;
            pieces.slice(0, -1).forEach((piece) => {
                if (!container.has(piece)) {
                    throw "Could not find " + piece + " in " + name;
                }
                container = container.get(piece);
            });
            
            const finalPiece = pieces[pieces.length - 1];
            if (!container.has(finalPiece)) {
                throw "Could not find " + finalPiece + " in " + name;
            }

            container.set(finalPiece, result);
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

        const operandExpression = ctx.operand.accept(self);
        const limitExpression = ctx.limit.accept(self);

        return (state) => {
            return opFunc(operandExpression(state), limitExpression(state));
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

        const operandExpression = ctx.operand.accept(self);
        const lowerExpression = ctx.lower.accept(self);
        const upperExpression = ctx.upper.accept(self);

        return (state) => {
            const operand = operandExpression(state);
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
    }

}
