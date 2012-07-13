/*jshint node:true jquery:true*/
"use strict";

$(function() {
	var applet = require('jsmm-applet');
	window.applet = applet;

	var dares = require('./dares');

	var $main = $('.example-game');

	var ui = new applet.UI($main, {hideTabs: true});
	window.ui = ui;

	var text = '// CANVAS EXAMPLE\n// Adapted from billmill.org/static/canvastutorial\nvar context = canvas.getContext("2d");\nvar paddleX = canvas.width/2;\nvar paddleDirection = 0;\nvar paddleWidth = 80;\nvar paddleHeight = 12;\nvar paddleSpeed = 5;\nvar ballX = 110;\nvar ballY = 150;\nvar ballVx = 7;\nvar ballVy = 12;\nvar gameOver = false;\nvar bricks = [];\nvar bricksNumX = 7;\nvar bricksNumY = 5;\nvar brickWidth = canvas.width / bricksNumX;\nvar brickHeight = 20;\nvar brickMargin = 4;\nvar brickCount = bricksNumX*bricksNumY;\n\nfunction clear() {\n  context.clearRect(0, 0, canvas.width, canvas.height);  \n}\n\nfunction circle(x, y) {\n  context.beginPath();\n  context.arc(x, y, 10, 0, 2*Math.PI);\n  context.fill();\n}\n\nfunction drawPaddle() {\n  var x = paddleX - paddleWidth/2;\n  var y = canvas.height - paddleHeight;\n  context.fillRect(x, y, paddleWidth, paddleHeight);\n}\n\nfunction mouseMove(event) {\n  paddleX = event.layerX;\n}\n\nfunction hitHorizontal() {\n  if (ballX < 0) {\n    ballVx = -ballVx;\n  } else if (ballX >= canvas.width) {\n    ballVx = -ballVx;\n  }\n}\n\nfunction hitVertical() {\n  if (ballY < 0) {\n    ballVy = -ballVy;\n  } else if (ballY < brickHeight*bricksNumY) {\n    var bx = Math.floor(ballX/brickWidth);\n    var by = Math.floor(ballY/brickHeight);\n    \n    if (bx >= 0 && bx < bricksNumX) {\n      if (bricks[by][bx]) {\n        bricks[by][bx] = false;\n        ballVy = -ballVy;\n        brickCount--;\n        if (brickCount <= 0) {\n          finish(true);\n        }\n      }\n    }\n  } else if (ballY >= canvas.height-paddleHeight) {\n    var paddleLeft = paddleX-paddleWidth/2;\n    var paddleRight = paddleX+paddleWidth/2;\n    if (ballX >= paddleLeft && ballX <= paddleRight) {\n      ballVy = -ballVy;\n    } else {\n      finish(false);\n    }\n  }\n}\n\nfunction initBricks() {\n  for (var y=0; y<bricksNumY; y++) {\n    bricks[y] = [];\n    for (var x=0; x<bricksNumX; x++) {\n      bricks[y][x] = true;\n    }\n  }\n}\n\nfunction drawBricks() {\n  for (var by=0; by<bricksNumY; by++) {\n    for (var bx=0; bx<bricksNumX; bx++) {\n      if (bricks[by][bx]) {\n        var x = bx * brickWidth + brickMargin/2;\n        var y = by * brickHeight + brickMargin/2;\n        var width = brickWidth - brickMargin;\n        var height = brickHeight - brickMargin;\n        context.fillRect(x, y, width, height);\n      }\n    }\n  }\n}\n\nfunction finish(won) {\n  gameOver = true;\n  context.font = "40pt Calibri";\n  if (won) {\n    context.strokeStyle = "#0a0";\n    context.strokeText("Well done!", 130, 200);\n  } else {\n    context.strokeStyle = "#a00";\n    context.strokeText("GAME OVER", 130, 200);\n  }\n}\n\nfunction tick() {\n  if (gameOver) {\n    return;\n  }\n  clear();\n  drawPaddle();\n  \n  ballX += ballVx;\n  ballY += ballVy;\n  hitHorizontal();\n  hitVertical();\n  \n  circle(ballX, ballY);\n  drawBricks();\n}\n\ninitBricks();\ncanvas.onmousemove = mouseMove;\nwindow.setInterval(tick, 30);';

	var editor = ui.addEditor({
			//hideToolbar: true,
			text: text
		});
	window.editor = editor;

	ui.loadOutputs({
			canvas: {},
			input: {mouseObjects: ['canvas']},
			Math: {}
		});

	ui.selectTab('canvas');

	$('.example-text-top').css('margin-left', -$('.example-text-top').width()/2);
	$('.example-text-bottom').css('margin-left', -$('.example-text-bottom').width()/2);

	var $dares = $('.intro-dares');

	var DaresManager = function() { return this.init.apply(this, arguments); };
	DaresManager.prototype = {
		init: function(content) {
			this.content = content;
			for (var i=0; i<this.content.dares.length; i++) {
				this.content.dares[i].user = JSON.parse(localStorage.getItem(this.content.title + '-' + i) || 'null') || {};
			}
		},

		getDare: function(index) {
			return this.content.dares[index];
		},

		updateDareUser: function(index, attr, value) {
			this.content.dares[index].user[attr] = value;
			localStorage.setItem(this.content.title + '-' + index, JSON.stringify(this.content.dares[index].user));
		},

		getContent: function() {
			return this.content;
		},

		open: function() {
			editor.disable();
		},

		close: function() {
			editor.enable();
		}
	};

	var rrDM = new DaresManager({
		title: "Rollin' Robots",
		difficulty: 1,
		dares: [
			{
				name: 'Knight Jump',
				description: '<p>Move the robot to the <strong>green square</strong>. In chess this is known as a <strong>knight jump</strong>.</p>',
				speed: 100,
				outputs: ['robot'],
				totalGoals: 3,
				minGoals: 1,
				goalReward: 50,
				maxLines: 5,
				lineReward: 10,
				original: 'robot.drive(2);\nrobot.turnLeft();\nrobot.drive(1);',
				infoCommandFilter: ['robot.drive', 'robot.turnLeft', 'robot.turnRight'],
				outputOptions: {
					robot: {readOnly: true, state: '{"columns":4,"rows":4,"initialX":2,"initialY":2,"initialAngle":90,"mazeObjects":1,"verticalActive":[[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]],"horizontalActive":[[false,false,false,false],[false,false,false,false],[false,false,false,false],[false,false,false,false]],"blockGoal":[[false,false,false,false],[true,false,false,false],[false,false,false,false],[false,false,false,false]],"numGoals":1}'},
					info: {commandFilter: ['robot.drive', 'robot.turnLeft', 'robot.turnRight'], scope: false}
				},
				type: 'RobotGoalDare',
				editor: {}
			},
			{
				name: 'Multiplication table',
				description: '<p>A multiplication table shows the result of multiplying any two numbers. Your task is to build a multiplication table of 10 rows and 5 columns, as seen below. For the spacing between the numbers, use the tab character, <var>"\\t"</var>.</p>',
				outputs: ['console'],
				minPercentage: 95,
				maxLines: 8,
				lineReward: 10,
				original: 'for (var l=1; l<=10; l++) {\n  var text = "";\n  for (var c=1; c<=5; c++) {\n    text += l*c + "\\t";\n  }\n  console.log(text);\n}',
				infoCommandFilter: ['robot.drive', 'robot.turnLeft', 'robot.turnRight'],
				outputOptions: {
					console: {},
					info: {commandFilter: ['jsmm', 'console.log']}
				},
				type: 'ConsoleMatchDare',
				editor: {}
			},
			{
				name: 'Gravity',
				description: '<p>A block is <strong>thrown</strong> in the air and then <strong>accelerates back down</strong>. The position of the block is drawn every few seconds, resulting in the image on the right. Your task is to <strong>copy</strong> this image as good as possible, in as <strong>few lines</strong> of code as you can.</p>',
				speed: 50,
				outputs: ['canvas'],
				minPercentage: 95,
				maxLines: 6,
				lineReward: 10,
				original: 'var context = canvas.getContext("2d");\nfor (var i=0; i<20; i++) {\n  context.fillRect(10+i*24, 270+i*-65+i*i*4, 50, 50);\n}',
				outputOptions: {
					canvas: {},
					info: {commandFilter: ['jsmm', 'canvas.getContext', 'context.fillRect']}
				},
				type: 'ImageMatchDare',
				editor: {}
			}
		]
	});

	var $rollinrobots = $('<div></div>');
	$dares.append($rollinrobots);
	var rrDares = new dares.Dares(rrDM, $rollinrobots);

	if (localStorage.getItem('initial-code') === null) {
		localStorage.setItem('initial-code', '// ROBOT EXAMPLE\nwhile(!robot.detectGoal()) {\n  robot.turnLeft();\n  while (robot.detectWall()) {\n    robot.turnRight();\n  }\n  robot.drive();\n}\n\n//CONSOLE EXAMPLE\nconsole.setColor("#fff");\nconsole.log("A colourful multiplication table:");\nconsole.log();\n\nfunction printLine(n) {\n  var text = "";\n  for (var i=1; i<=8; i++) {\n    text += (i*n) + "\\t";\n  }\n  console.log(text);\n}\n\nfor (var i=1; i<=20; i++) { \n  console.setColor("hsla(" + i*15 + ", 75%, 50%, 1)");\n  printLine(i);\n}\n\nconsole.setColor("#ed7032");\nconsole.log();\nconsole.log(":-D");');
	}

	if (localStorage.getItem('initial-robot') === null) {
		localStorage.setItem('initial-robot', '{"columns":8,"rows":8,"initialX":3,"initialY":4,"initialAngle":90,"mazeObjects":50,"verticalActive":[[false,false,false,false,false,false,false,false],[false,false,true,true,true,false,true,false],[false,true,false,false,true,false,false,true],[false,false,true,true,false,false,true,false],[false,true,true,false,false,false,false,false],[false,false,false,true,false,true,true,true],[false,false,true,false,true,true,false,false],[false,false,false,true,false,true,true,false]],"horizontalActive":[[false,true,false,false,true,false,false,true],[false,true,false,true,false,false,true,false],[false,true,true,false,true,false,true,false],[false,true,false,false,true,true,true,false],[false,false,true,true,false,true,false,true],[false,true,false,false,true,false,false,true],[false,true,true,true,false,false,false,true],[false,true,true,false,false,false,false,false]],"blockGoal":[[false,false,false,true,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false],[false,false,false,false,false,false,false,false]],"numGoals":1}');
	}

	var fullEditorUI = new applet.UI();
	$('#full-editor').on('click', function() {
		editor.disable();
		fullEditorUI.openModal();
		var ed = fullEditorUI.addEditor({text: localStorage.getItem('initial-code')});
		ed.setTextChangeCallback(function(text) {
			localStorage.setItem('initial-code', text);
		});
		fullEditorUI.loadOutputs({
			robot: {state: localStorage.getItem('initial-robot')}, canvas: {}, console: {}, info: {}, input: {mouseObjects: ['canvas']}, Math: {}
		});
		fullEditorUI.getOutput('robot').setStateChangeCallback(function(state) {
			localStorage.setItem('initial-robot', state);
		});
		fullEditorUI.selectTab('robot');
	});

	fullEditorUI.setCloseCallback(function() {
		editor.enable();
	});














	var stressTime = function(n, f) {
		var start = (new Date()).getTime();
		for (var i=0; i<n; i++) {
			f();
		}
		return ((new Date()).getTime() - start)/n;
	};

	var log = function(text) {
		console.log(text);
	};

	var clear = function() {

	};

	var tree, func;
	
	//$('#extra-stress').click(function(e) {
	window.stress = function() {
		clear();
		var parseAvg = stressTime(200, function() { tree = new window.ui.editor.language.Tree(window.ui.editor.code.text); });
		var parseGenAvg = stressTime(200, function() { func = window.ui.editor.tree.programNode.getRunFunction(); });
		var runAvg = stressTime(200, function() { window.ui.editor.run(); });
		clear();
		log('Program average parse time: ' + parseAvg + 'ms (out of 200 trials)');
		log('Program average code generation time: ' + parseGenAvg + 'ms (out of 200 trials)');
		log('Program average run time: ' + runAvg + 'ms (out of 200 trials)');
		log('');
		log('Note: the Javascript time function is not completely reliable...');
	};
});