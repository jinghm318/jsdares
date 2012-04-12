/*jshint node:true jquery:true*/
"use strict";

var clayer = require('../clayer');

module.exports = function(editor) {
	editor.Box = function() { return this.init.apply(this, arguments); };
	editor.Message = function() { return this.init.apply(this, arguments); };
	editor.Surface = function() { return this.init.apply(this, arguments); };
	
	editor.Box.prototype = {
		init: function($marking, surface) {
			this.$marking = $marking;
			this.surface = surface;
			this.$element = $('<div class="based-messagebox"></div>');
			this.surface.addElement(this.$element);
			this.$element.hide();
			this.$element.append('<div class="arrow"></div>');
			this.$message = $('<div class="based-message"></div>');
			this.$element.append(this.$message);
		},
		updatePosition: function() {
			//console.log(this.$marking.offset().left);
			this.surface.setElementCenterPosition(this.$element, this.$marking.position().left+this.$marking.outerWidth()/2, this.$marking.position().top+this.$marking.outerHeight());
		},
		html: function(html) {
			this.$message.html(html);
			this.updatePosition();
		},
		remove: function() {
			this.$element.remove();
		}
	};

	editor.Message.prototype = {
		init: function(type, surface) {
			this.surface = surface;
			this.$marginIcon = $('<div class="based-margin-message-icon-' + type + '"><img src="img/margin-message-icon-' + type + '.png"/></div>');
			this.surface.addElementToMargin(this.$marginIcon);
			this.$marginIcon.hide();
			this.$marking = $('<div class="based-marking"></div>');
			this.surface.addElement(this.$marking);
			this.$marking.hide();
			this.box = new editor.Box(this.$marking, this.surface);
			this.$marginIcon.on('click', $.proxy(this.toggleMesssage, this));
			this.$marking.on('click', $.proxy(this.toggleMesssage, this));
			this.box.$element.on('click', $.proxy(this.toggleMesssage, this));
			this.visible = false;
			this.messageOpen = false;
			this.message = null;
		},
		showAtLocation: function(msg) {
			this.$marginIcon.css('top', this.surface.lineToY(msg.line));
			this.$marginIcon.fadeIn(150);
			this.message = msg;
			this.visible = true;
			this.updateMessage();
		},
		openMessage: function() {
			this.messageOpen = true;
			this.updateMessage();
		},
		closeMessage: function() {
			this.messageOpen = false;
			this.updateMessage();
		},
		hide: function() {
			this.visible = false;
			this.$marginIcon.fadeOut(150);
			this.updateMessage();
		},
		/// INTERNAL FUNCTIONS ///
		toggleMesssage: function() {
			this.messageOpen = !this.messageOpen;
			this.updateMessage();
		},
		updateMessage: function() {
			if (this.visible && this.messageOpen && this.message !== null) {
				this.$marking.fadeIn(150);
				this.box.$element.fadeIn(150);
				this.surface.setElementLocationRange(this.$marking, this.message.line, this.message.column, this.message.line+1, this.message.column2);
				this.box.html(this.message.html);
			} else {
				this.$marking.fadeOut(150);
				this.box.$element.fadeOut(150);
			}
		}
	};

	editor.Surface.prototype = {
		init: function($div, delegate) {
			this.delegate = delegate;
			$div.addClass('based-editor');

			// setting up textarea
			this.$textarea = $('<textarea class="based-code" autocorrect="off" autocapitalize="off" spellcheck="false" wrap="off"></textarea>');
			$div.append(this.$textarea);

			this.$textarea.on('keydown', $.proxy(this.keyDown, this));
			this.$textarea.on('keyup', $.proxy(this.keyUp, this));
			this.$textarea.on('paste', $.proxy(this.paste, this));

			// setting up surface
			this.$surface = $('<div class="based-surface"></div>');
			$div.append(this.$surface);

			// setting up margin
			this.$margin = $('<div class="based-margin"></div>');
			$div.append(this.$margin);
			
			// setting up messages
			this.errorMessage = new editor.Message('error', this);
			this.stepMessage = new editor.Message('step', this);

			// highlights
			this.$highlightMarking = $('<div class="based-marking based-highlight"></div>');
			this.addElement(this.$highlightMarking);
			this.$highlightMarking.hide();

			this.initOffsets($div);

			this.text = '';
			this.userChangedText = false;
		},

		getText: function() {
			return this.text;
		},

		setText: function(newText) {
			this.$textarea.val(newText);
			this.text = newText;
			this.userChangedText = false;
			this.updateSize();
		},

		columnToX: function(column) {
			return column*this.charWidth;
		},

		lineToY: function(line) {
			return (line-1)*this.lineHeight;
		},

		addElement: function($element) {
			this.$surface.append($element);
		},

		addElementToMargin: function($element) {
			this.$margin.append($element);
		},

		enableMouseMove: function() {
			this.$textarea.on('mousemove', $.proxy(this.mouseMove, this));
		},

		disableMouseMove: function() {
			this.$textarea.off('mousemove');
		},

		showErrorMessage: function(message) {
			this.errorMessage.showAtLocation(message);
			this.$textarea.addClass('based-error');
		},

		hideErrorMessage: function() {
			this.$textarea.removeClass('based-error');
			this.errorMessage.closeMessage();
			this.errorMessage.hide();
		},

		openStepMessage: function() {
			this.stepMessage.openMessage();
		},

		showStepMessage: function(message) {
			this.$textarea.addClass('based-step');
			this.stepMessage.showAtLocation(message);
		},

		hideStepMessage: function() {
			this.$textarea.removeClass('based-step');
			this.stepMessage.hide();
		},

		showHighlight: function(line, column, line2, column2) {
			this.$highlightMarking.fadeIn(150);
			this.setElementLocationRange(this.$highlightMarking, line, column, line2, column2);
		},

		hideHighlight: function() {
			this.$highlightMarking.fadeOut(150);
		},

		setElementLocation: function($element, line, column) {
			$element.css('left', this.columnToX(column));
			$element.css('top', this.lineToY(line));
		},

		setElementLocationRange: function($element, line, column, line2, column2) {
			var x = this.columnToX(column), y = this.lineToY(line);
			$element.css('left', x);
			$element.css('top', y);
			$element.width(this.columnToX(column2) - x);
			$element.height(this.lineToY(line2) - y);
		},

		setElementCenterPosition: function($element, x, y) {
			$element.css('left', x-$element.outerWidth()/2);
			$element.css('top', y);
		},

		setElementCenterLocation: function($element, line, column) {
			$element.css('left', this.columnToX(column)-$element.outerWidth()/2);
			$element.css('top', this.lineToY(line));
		},

		/// INTERNAL FUNCTIONS ///
		initOffsets: function($div) {
			// setting up mirror
			this.$mirror = $('<div class="based-mirror"></div>');
			var $mirrorContainer = $('<div class="based-mirror-container"></div>');
			$mirrorContainer.append(this.$mirror);
			$div.append($mirrorContainer);

			this.$mirror.text('a');
			this.textOffset = {x: this.$mirror.outerWidth(), y: this.$mirror.outerHeight()};

			this.$mirror.text('aa');
			this.charWidth = this.$mirror.outerWidth() - this.textOffset.x;

			this.$mirror.text('a\na');
			this.lineHeight = this.$mirror.outerHeight() - this.textOffset.y;
			
			// this works assuming there is no padding on the right or bottom
			this.textOffset.x -= this.charWidth;
			this.textOffset.y -= this.lineHeight;

			// the offset is weird since .position().top changes when scrolling
			var textAreaOffset = {
				x: (this.$textarea.position().left + $div.scrollLeft()),
				y: (this.$textarea.position().top + $div.scrollTop())
			};

			console.log(textAreaOffset.x, this.textOffset.x);

			this.$surface.css('left', textAreaOffset.x + this.textOffset.x);
			this.$surface.css('top', textAreaOffset.y + this.textOffset.y);
			this.$margin.css('top', textAreaOffset.y + this.textOffset.y);
		},

		updateSize: function() {
			this.$mirror.text(this.text);
			this.$textarea.width(this.$mirror.outerWidth() + 100);
			this.$textarea.height(this.$mirror.outerHeight() + 100);
			this.$surface.width(this.$mirror.outerWidth());
		},

		showElements: function() {
			this.$surface.show();
			this.$margin.show();
		},

		hideElements: function() {
			this.$surface.hide();
			this.$margin.hide();
		},

		pageXToColumn: function(x) {
			return Math.floor((x-this.$textarea.offset().left-this.textOffset.x)/this.charWidth);
		},

		pageYToLine: function(y) {
			return 1+Math.floor((y-this.$textarea.offset().top-this.textOffset.y)/this.lineHeight);
		},

		keyDown: function(event) {
			if (this.$textarea.val() !== this.text) {
				this.text = this.$textarea.val();
				this.updateSize();

				if (!this.userChangedText) {
					this.delegate.userStartedChangingText();
					this.userChangedText = true;
					this.hideElements();
				}
			}
			// TODO: include offset vars and update UI elements
		},

		keyUp: function(event) {
			if (this.$textarea.val() !== this.text) {
				this.text = this.$textarea.val();
				this.updateSize();
				this.userChangedText = true;
			}

			if (this.userChangedText) {
				this.userChangedText = false;
				this.showElements();
				this.delegate.userChangedText();
			}
		},

		paste: function(event) {
			if (this.$textarea.val() !== this.text) {
				this.text = this.$textarea.val();
				this.updateSize();
				//this.autoindent(e);
				this.userChangedText = false;
				this.delegate.userChangedText();
			}
		},

		mouseMove: function(event) {
			this.delegate.mouseMove(event, this.pageYToLine(event.pageY), this.pageXToColumn(event.pageX));
		}
	};
};


	// TODO: use http://archive.plugins.jquery.com/project/fieldselection
	// autoindent: function(e) {
	// 	// 13 = enter, 221 = ] or }
	// 	if (e.keyCode === 13 || e.keyCode === 221) {
	// 		var code = this.code;
	// 		var offset = this.$textarea[0].selectionStart;
	// 		var pos = code.offsetToLoc(offset);
	// 		if (pos.line > 1) {
	// 			var prevLine = code.getLine(pos.line-1);
	// 			var curLine = code.getLine(pos.line);
	// 			var spaces = prevLine.match(/^ */)[0].length;
	// 			var spacesAlready = curLine.match(/^ */)[0].length;
	// 			spaces += prevLine.match(/\{ *$/) !== null ? 2 : 0;
	// 			spaces -= spacesAlready;
	// 			spaces -= curLine.match(/^ *\}/) !== null ? 2 : 0;

	// 			var startOffset, endOffset;
	// 			if (spaces > 0) {
	// 				startOffset = code.lineColumnToOffset(pos.line, 0);
	// 				this.$textarea.val(code.insertAtOffset(startOffset, new Array(spaces+1).join(' ')));
	// 				this.$textarea[0].selectionStart = offset + spaces;
	// 				this.$textarea[0].selectionEnd = this.$textarea[0].selectionStart;
	// 				this.updateCode();
	// 			} else if (spaces < 0 && spacesAlready >= -spaces) {
	// 				startOffset = code.lineColumnToOffset(pos.line, 0);
	// 				endOffset = startOffset-spaces;
	// 				this.$textarea.val(code.removeOffsetRange(startOffset, endOffset));
	// 				this.$textarea[0].selectionStart = offset + spaces;
	// 				this.$textarea[0].selectionEnd = this.$textarea[0].selectionStart;
	// 				this.updateCode();
	// 			}
	// 		}
	// 	}
	// },
	

