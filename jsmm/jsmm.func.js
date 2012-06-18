/*jshint node:true*/
"use strict";

module.exports = function(jsmm) {
	var getValue = function(node, expression) {
		var value = expression;
		if (typeof value === 'object' && value.type === 'local') {
			value = value.value;
		}

		if (value === undefined) {
			throw new jsmm.msg.Error(node.id, '<var>' + node.getCode() + '</var> is <var>undefined</var>');
		} else if (value === null) {
			throw new jsmm.msg.Error(node.id, '<var>' + node.getCode() + '</var> is <var>null</var>');
		} else if (typeof value === 'number' && !isFinite(value)) {
			throw new jsmm.msg.Error(node.id, '<var>' + node.getCode() + '</var> is not a valid number');
		} else if (typeof value === 'object' && value.type === 'variable') {
			return value.get(value.name);
		} else if (typeof value === 'object' && value.type === 'newArrayValue') {
			throw new jsmm.msg.Error(node.id, '<var>' + node.getCode() + '</var> is <var>undefined</var>');
		} else {
			return value;
		}
	};

	var stringify = function(value) {
		if (typeof value === 'function') return '[function]';
		else if (typeof value === 'object' && value.type === 'function') return '[function]';
		else if (typeof value === 'object' && value.type === 'internalFunction') return '[function]';
		else if (Object.prototype.toString.call(value) === '[object Array]') return '[array]';
		else if (typeof value === 'object' && value.type === 'object') return '[object]';
		else if (value === undefined) return 'undefined';
		else return JSON.stringify(value);
	};

	var setVariable = function(context, node, variableNode, variable, value) {
		if (typeof variable === 'object' && variable.type === 'newArrayValue') {
			throw new jsmm.msg.Error(node.id, '<var>' + variableNode.getCode() + '</var> is <var>undefined</var>');
		} else if (typeof variable !== 'object' || ['variable', 'local'].indexOf(variable.type) < 0) {
			throw new jsmm.msg.Error(node.id, 'Cannot assign <var>' + stringify(value) + '</var> to <var>' + variableNode.getCode() + '</var>');
		} else if (variable.type === 'variable') {
			try {
				variable.set(context, variable.name, value);
			} catch (error) {
				// augmented variables should do their own error handling, so wrap the resulting strings in jsmm messages
				if (typeof error === 'string') {
					throw new jsmm.msg.Error(node.id, error);
				} else {
					throw error;
				}
			}
		} else {
			variable.value = value;
		}
	};

	jsmm.Array = function() { return this.init.apply(this, arguments); };
	jsmm.Array.prototype = {
		type: 'array',
		init: function(values) {
			this.values = [];
			for (var i=0; i<values.length; i++) {
				this.values[i] = {type: 'local', value: values[i]};
			}

			var that = this;
			this.methods = {
				length: {
					name: 'length',
					info: 'array.length',
					type: 'variable',
					example: 'length',
					get: function() { return that.getLength.apply(that, arguments); },
					set: function() { return that.setLength.apply(that, arguments); }
				}
			};
		},
		getLength: function(name) {
			return this.values.length;
		},
		setLength: function(context, name, value) {
			this.values.length = value;
		},
		getArrayValue: function(index) {
			if (index < this.values.length) {
				if (this.values[index] === undefined) {
					this.values[index] = {type: 'local', value: undefined};
				}
				return this.values[index];
			} else {
				return {type: 'newArrayValue', array: this, index: index};
			}
		},
		setArrayValue: function(index, value) {
			this.values[index] = {type: 'local', value: value};
		}
	};

	jsmm.nodes.PostfixStatement.prototype.runFunc = function(context, variable, symbol) {
		context.addCommand(this, '++');
		var value = getValue(this.identifier, variable);

		if (typeof value !== 'number') {
			throw new jsmm.msg.Error(this.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value) + '</var> is not a number');
		} else {
			if (symbol === '++') {
				value++;
			} else {
				value--;
			}
			setVariable(context, this, this.identifier, variable, value);
			context.addAssignment(this, this.identifier.getCode());
			context.newStep([new jsmm.msg.Inline(this.id, '<var>' + this.identifier.getCode() + '</var> = <var>' + stringify(value) + '</var>')]);
		}
	};

	var runBinaryExpression = function(context, node, value1, symbol, value2) {
		if ((symbol === '+' || symbol === '+=') && (typeof value1 === 'string' || typeof value2 === 'string')) {
			context.addCommand(node, '+s');
		} else if (['+', '-', '*', '/', '%'].indexOf(symbol) >= 0) {
			context.addCommand(node, '+');
		} else if (['+=', '-=', '*=', '/=', '%='].indexOf(symbol) >= 0) {
			context.addCommand(node, '+=');
		} else if (['>', '>=', '<', '<='].indexOf(symbol) >= 0) {
			context.addCommand(node, '>');
		} else if (['==', '!='].indexOf(symbol) >= 0) {
			context.addCommand(node, '==');
		} else if (['&&', '||'].indexOf(symbol) >= 0) {
			context.addCommand(node, '&&');
		}

		if (['-', '*', '/', '%', '-=', '*=', '/=', '%=', '>', '>=', '<', '<='].indexOf(symbol) >= 0) {
			if (typeof value1 !== 'number' || !isFinite(value1)) {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value1) + '</var> is not a number');
			} else if (typeof value2 !== 'number' || !isFinite(value2)) {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value2) + '</var> is not a number');
			} else if (['/', '/=', '%', '%='].indexOf(symbol) >= 0 && value2 === 0) {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since it is a division by zero');
			}
		} else if (['+', '+='].indexOf(symbol) >= 0) {
			if (['number', 'string'].indexOf(typeof value1) < 0) {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value1) + '</var> is not a number or string');
			} else if (['number', 'string'].indexOf(typeof value2) < 0) {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value2) + '</var> is not a number or string');
			}
		} else if (['&&', '||'].indexOf(symbol) >= 0) {
			if (typeof value1 !== 'boolean') {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value1) + '</var> is not a boolean');
			} else if (typeof value2 !== 'boolean') {
				throw new jsmm.msg.Error(node.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value2) + '</var> is not a boolean');
			}
		}
		
		switch(symbol) {
			case '+': case '+=': return value1 + value2;
			case '-': case '-=': return value1 - value2;
			case '*': case '*=': return value1 * value2;
			case '/': case '/=': return value1 / value2;
			case '%': case '%=': return value1 % value2;
			case '>': return value1 > value2;
			case '>=': return value1 >= value2;
			case '<': return value1 < value2;
			case '<=': return value1 <= value2;
			case '&&': return value1 && value2;
			case '||': return value1 || value2;
			case '==': return value1 == value2;
			case '!=': return value1 != value2;
		}
	};
	
	jsmm.nodes.AssignmentStatement.prototype.runFunc = function(context, variable, symbol, expression) {
		var value;
		if (symbol === '=') {
			context.addCommand(this, '=');
			value = getValue(this.expression, expression);
		} else {
			value = runBinaryExpression(context, this, getValue(this.identifier, variable), symbol, getValue(this.expression, expression));
		}

		if (variable.type === 'newArrayValue') {
			variable.array.setArrayValue(variable.index, value);
		} else {
			setVariable(context, this, this.identifier, variable, value);
		}
		context.addAssignment(this, this.identifier.getCode());
		context.newStep([new jsmm.msg.Inline(this.id, '<var>' + this.identifier.getCode() + '</var> = <var>' + stringify(value) + '</var>')]);
	};
	
	jsmm.nodes.VarItem.prototype.runFunc = function(context, name) {
		context.addCommand(this, 'var');
		context.scope.vars[name] = {type: 'local', value: undefined};

		if (this.assignment === null) {
			context.addAssignment(this, name);
			context.newStep([new jsmm.msg.Inline(this.id, '<var>' + this.name + '</var> = <var>undefined</var>')]);
		}
	};
	
	jsmm.nodes.BinaryExpression.prototype.runFunc = function(context, expression1, symbol, expression2) {
		var value1 = getValue(this.expression1, expression1);
		var value2 = getValue(this.expression2, expression2);
		var result = runBinaryExpression(context, this, value1, symbol, value2);
		context.newStep([new jsmm.msg.Inline(this.id, '<var>' + stringify(value1) + '</var> ' + symbol + ' <var>' + stringify(value2) + '</var> = <var>' + stringify(result) + '</var>')]);
		return result;
	};
	
	jsmm.nodes.UnaryExpression.prototype.runFunc = function(context, symbol, expression) {
		var value = getValue(this.expression, expression);
		var result;

		if (symbol === '!') {
			context.addCommand(this, '!');
			if (typeof value !== 'boolean') {
				throw new jsmm.msg.Error(this.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value) + '</var> is not a boolean');
			} else {
				result = !value;
			}
		} else {
			context.addCommand(this, '+');
			if (typeof value !== 'number') {
				throw new jsmm.msg.Error(this.id, '<var>' + symbol + '</var> not possible since <var>' + stringify(value) + '</var> is not a number');
			} else {
				result = (symbol === '+' ? value : -value);
			}
		}

		context.newStep([new jsmm.msg.Inline(this.id, '<var>' + symbol + stringify(value) + '</var> = <var>' + stringify(result) + '</var>')]);
		return result;
	};
	
	jsmm.nodes.NameIdentifier.prototype.runFunc = function(context, name) {
		var val = context.scope.find(name);
		if (val === undefined) {
			throw new jsmm.msg.Error(this.id, 'Variable <var>' + name + '</var> could not be found');
		} else {
			return val;
		}
	};
	
	jsmm.nodes.ObjectIdentifier.prototype.runFunc = function(context, identifier, property) {
		var identifierValue = getValue(this.identifier, identifier);
		if (typeof identifierValue !== 'object' || ['object', 'array'].indexOf(identifierValue.type) < 0) {
			throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.identifier.getCode() + '</var> is not an object</var>');
		} else if (identifierValue.methods[property] === undefined) {
			throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.identifier.getCode() + '</var> does not have property <var>' + property + '</var>');
		} else {
			return identifierValue.methods[property];
		}
	};
	
	jsmm.nodes.ArrayIdentifier.prototype.runFunc = function(context, identifier, expression) {
		var identifierValue = getValue(this.identifier, identifier);
		var expressionValue = getValue(this.expression, expression);

		if (typeof identifierValue !== 'object' || identifierValue.type !== 'array') {
			throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.identifier.getCode() + '</var> is not an array');
		} else if (typeof expressionValue !== 'number' && expressionValue % 1 !== 0) {
			throw new jsmm.msg.Error(this.id, 'Index <var>' + this.expression.getCode() + '</var> is not an integer');
		} else {
			return identifierValue.getArrayValue(expressionValue);
		}
	};
	
	jsmm.nodes.FunctionCall.prototype.runFunc = function(context, func, args) {
		var funcValue = getValue(this.identifier, func), funcArgs = [], msgFuncArgs = [], appFunc;

		for (var i=0; i<args.length; i++) {
			var value = getValue(this.expressionArgs[i], args[i]);
			funcArgs.push(value);
			msgFuncArgs.push(stringify(value));
		}

		context.newStep([new jsmm.msg.Inline(this.id, 'calling <var>' + this.identifier.getCode() + '(' + msgFuncArgs.join(', ') + ')' + '</var>')]);

		var retVal;
		context.enterCall(this);
		if (typeof funcValue === 'object' && funcValue.type === 'function') {
			context.addCommand(this, funcValue.info);
			retVal = context.externalCall(this, funcValue, funcArgs);
		} else if (typeof funcValue === 'object' && funcValue.type === 'internalFunction') {
			retVal = funcValue.func.call(null, context, funcArgs);
		} else {
			throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.identifier.getCode() + '</var> is not a function');
		}
		context.leaveCall(this);

		if (retVal === null) {
			retVal = undefined;
		} else if (retVal !== undefined) {
			context.newStep([new jsmm.msg.Inline(this.id, '<var>' + this.identifier.getCode() + '(' + msgFuncArgs.join(', ') + ')' + '</var> = <var>' + stringify(retVal) + '</var>')]);
		}

		return retVal;
	};

	jsmm.nodes.ArrayDefinition.prototype.runFunc = function(context, expressions) {
		var values = [];
		for (var i=0; i<this.expressions.length; i++) {
			values[i] = getValue(this.expressions[i], expressions[i]);
		}

		return new jsmm.Array(values);
	};
	
	jsmm.nodes.IfBlock.prototype.runFunc =
	jsmm.nodes.WhileBlock.prototype.runFunc =
	jsmm.nodes.ForBlock.prototype.runFunc = function(context, expression) {
		var type = (this.type === 'IfBlock' ? 'if' : (this.type === 'WhileBlock' ? 'while' : 'for'));
		context.addCommand(this, type);
		var value = getValue(this.expression, expression);
		if (typeof value !== 'boolean') {
			throw new jsmm.msg.Error(this.id, '<var>' + type + '</var> is not possible since <var>' + stringify(value) + '</var> is not a boolean');
		} else {
			return value;
		}
	};

	jsmm.nodes.ElseIfBlock.prototype.runFunc =
	jsmm.nodes.ElseBlock.prototype.runFunc = function(context) {
		context.addCommand(this, 'else');
	};
	
	jsmm.nodes.FunctionDeclaration.prototype.runFuncDecl = function(context, name, func) {
		context.addCommand(this, 'function');

		// only check local scope for conflicts
		if (context.scope.vars[name] !== undefined) {
			if (typeof context.scope.vars[name] === 'object' && ['function', 'internalFunction'].indexOf(context.scope.vars[name].type) >= 0) {
				throw new jsmm.msg.Error(this.id, 'Function <var>' + name + '</var> cannot be declared since there already is a function with that name');
			} else {
				throw new jsmm.msg.Error(this.id, 'Function <var>' + name + '</var> cannot be declared since there already is a variable with that name');
			}
		} else {
			context.scope.vars[name] = {type: 'local', value: {type: 'internalFunction', name: name, func: func}};
			context.addAssignment(this, name);
			context.newStep([new jsmm.msg.Inline(this.id, 'declaring <var>' + this.name + this.getArgList() + '</var>', 'blockLoc')]);
			return context.scope.vars[name];
		}
	};
	
	jsmm.nodes.FunctionDeclaration.prototype.runFuncEnter = function(context, args) {
		if (args.length < this.nameArgs.length) {
			throw new jsmm.msg.Error(this.id, 'Function expects <var>' + this.nameArgs.length + '</var> arguments, but got only <var>' + args.length + '</var> are given');
		}

		var scopeVars = {}, msgFuncArgs = [];
		for (var i=0; i<this.nameArgs.length; i++) {
			if (args[i] === undefined) {
				throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.nameArgs[i] + '</var> is <var>undefined</var>');
			} else if (args[i] === null) {
				throw new jsmm.msg.Error(this.id, 'Variable <var>' + this.nameArgs[i] + '</var> is <var>null</var>');
			} else {
				scopeVars[this.nameArgs[i]] = args[i];
				msgFuncArgs.push(stringify(args[i]));
			}
		}

		var fullName = this.name + '(' + msgFuncArgs.join(', ') + ')';
		context.newStep([new jsmm.msg.Inline(this.id, 'entering <var>' + fullName + '</var>')]);
		context.enterFunction(this, scopeVars, fullName);
	};
	
	jsmm.nodes.ReturnStatement.prototype.runFunc =
	jsmm.nodes.FunctionDeclaration.prototype.runFuncLeave = function(context, expression) {
		if (this.type === 'ReturnStatement') {
			context.addCommand(this, 'return');
			if (!context.inFunction()) {
				throw new jsmm.msg.Error(this.id, 'Cannot return if not inside a function');
			}
		}

		var retVal;
		if (this.expression !== undefined && expression !== undefined) {
			retVal = getValue(this.expression, expression);
			context.newStep([new jsmm.msg.Inline(this.id, 'returning <var>' + stringify(retVal) + '</var>')]);
		}

		context.leaveFunction(this);
		return retVal;
	};
};
