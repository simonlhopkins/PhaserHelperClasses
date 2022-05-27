/**
 *
 */


WordleBoard.RowData = function(_line){
	this.cells = [];
	this.currentLetter = 0;
	this.builtWord = [];
	this.rowLine = _line;
};

WordleBoard.RowData.prototype.clear = function(){
	this.builtWord = [];
	this.currentLetter = 0;
};
WordleBoard.RowData.prototype.getActiveCell = function(){
	return this.cells[this.currentLetter];
};

/**
 * This is a class that inherits from Phaser.Group where all of the logic for adding, animating, and resolving rows is done. All of the WordleLetterCells are also children of this object.
 * Each row of letters is stored as a WordleBoard.RowData object. If you want to access the cells in a row, I would use the WordleBoard.getCell method.
 * 
 * @param _game {Phaser.Game} - a reference to the game
 * @param _backingSprite {Phaser.Sprite} - a sprite that you want to want to render the keyboard within the bounds. This is usually just a white rectangle that you can lay out in the scene to visualize where the board will appear
 * @param _parent {Phaser.Group} - what you want the parent of the keyboard to be. The parent should be positioned at 0,0, because the WordleBoard will be positioned to the x and y coordinates of the backing sprite you pass.
 * @param _wordLength {int} - the length of the word
 * @param _numRows {int} - the number of rows you want
 * @param _font {Phaser.BitmapFont} - the bitmap font you want the WordleBoard to use
 */
function WordleBoard (_game, _backingSprite, _parent, _wordLength, _numRows, _font) {
	this.game = _game;
	Phaser.Group.call(this, this.game, _parent);
	this.backingSprite = _backingSprite;
	this.wordLength = _wordLength;
	this.numRows = _numRows;
	this.font = _font;
	this.onRowFull = new Phaser.Signal();
	this.onRowEvaluated = new Phaser.Signal();
	
	this.targetWord = "think";
	//this.targetWord = this.generateWord();
	this.boundsRect = new Phaser.Rectangle().copyFrom(this.backingSprite).centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	
	
	this.position.setTo(this.backingSprite.centerX, this.backingSprite.centerY);
	this.backingSprite.destroy();
	
	
	var rowLines = this.boundsRect.divideRect(this.numRows);
	this.dc = this.game.add.graphics(0,0, this, true);
	this.dc.alpha = 0;
	this.currentRow = 0;
	this.rowData = {};
	
	for(var row = 0; row< rowLines.length; row++){
		this.rowData[row] = new WordleBoard.RowData(rowLines[row]);
		
		for(var col = 0; col < this.wordLength; col++){
			//make a cell but don't adjust any size, all that should be in remake board for simplicities sake
			var newCell = new WordleLetterCell(this.game, this);
			newCell.initialize(new Phaser.Rectangle(), this.font);
			newCell.index = col;
			this.rowData[row].cells.push(newCell);
		}
		
	};
	this.remakeBoard(this.boundsRect, Global.orientation);
};

WordleBoard.prototype = Phaser.Group.prototype;
WordleBoard.constuctor = WordleBoard;


/**
 * This repositions all of the wordle board cells bound within a rectangle you pass into it. Within this, the array rowLines determines where the rows of the board will be rendered. The lines in row lines
 * should be in Local Space, meaning where you want them positioned within the group of the WordleBoard object. The group will automatically be set to the center of the rectangle you pass.
 * 
 * @param newBounds {Phaser.Rectangle} - a rectangle that is positioned in World Space that the new board will be rendered in
 * @param orientation {string} - the orientation you want to remake the board for
 */
WordleBoard.prototype.remakeBoard = function(newBounds, orientation){
	this.boundsRect = newBounds.clone();
	this.position.setTo(this.boundsRect.centerX, this.boundsRect.centerY);
	this.boundsRect.centerOn(0,0);
	
	var rowLines = this.boundsRect.divideRect(this.numRows);
	var cellBounds = new Phaser.Rectangle(0,0, this.boundsRect.width/this.wordLength, this.boundsRect.height/rowLines.length);
	
	//divides the rows into 2 columns by remaking the rowlines array, the board is rendered based on the lines
	if(orientation == "l"){
		var leftRect = new Phaser.Rectangle(this.boundsRect.left, this.boundsRect.top, this.boundsRect.width/2, this.boundsRect.height).inflate(-30, 0);
		var rightRect = new Phaser.Rectangle(this.boundsRect.centerX, this.boundsRect.top, this.boundsRect.width/2, this.boundsRect.height).inflate(-30, 0);
		rowLines = [];
		rowLines = rowLines.concat(leftRect.divideRect(Math.floor(this.numRows/2)));
		rowLines = rowLines.concat(rightRect.divideRect(Math.floor(this.numRows/2)));
		cellBounds.resize(leftRect.width/this.wordLength, leftRect.height/(rowLines.length/2));
	}
	this.dc.clear();
	this.dc.lineStyle(10, 0xff0000);
	this.dc.drawShape(this.boundsRect);
	rowLines.forEach(function(line){
		this.dc.lineStyle(10, 0x00ff00);
		this.dc.drawLine(line);
	}, this);
	for(var row = 0; row< rowLines.length; row++){
		for(var col = 0; col< this.wordLength; col++){
			var pos = rowLines[row].interpolate((col+0.5)/this.wordLength);
			this.rowData[row].cells[col].position.setTo(pos.x, pos.y);
			this.dc.lineStyle(10, 0x0000ff);
			this.dc.drawCircle(pos.x, pos.y, 10);
			this.rowData[row].cells[col].bounds = cellBounds.clone().centerOn(pos.x, pos.y);
			this.rowData[row].cells[col].updateSize();
		}
		
	};
	
	
	
	
};

/**
 * helpful function to get the row you are actively typing in 
 * @return {WordleBoard.RowData} - a WordleBoard.RowData object of the active row
 */
WordleBoard.prototype.getActiveRow = function(){
	return this.rowData[this.currentRow];
};

/**
 * 
 * @param letter {char} - the letter you want to add to to the active row
 * @param doAnimate {bool} - do you want the letter to animate, or immedietly appear
 * @returns {WordleBoard.RowData} - the active row
 */

WordleBoard.prototype.addLetter = function(letter, doAnimate){
	doAnimate = doAnimate==undefined?true:doAnimate;
	letter= letter.toLowerCase();
	if(this.getActiveRow().currentLetter>=this.wordLength){
		return this.getActiveRow();
	}
	var cell = this.getActiveRow().getActiveCell();
	cell.populateLetter(letter, doAnimate);
	cell.SM.changeState("LIGHT_GRAY");
	this.getActiveRow().builtWord.push(letter);
	this.getActiveRow().currentLetter++;
	if(this.getActiveRow().currentLetter>=this.wordLength){
		this.onRowFull.dispatch(this.rowData[this.currentRow]);
	}
	
	return this.getActiveRow();
};

/**
 * this deletes the current letter in the active row
 * 
 * @returns {WordleBoard.RowData} - the active row
 */
WordleBoard.prototype.deleteLetter = function(){
	if(this.getActiveRow().currentLetter<=0){
		return this.getActiveRow();
	}
	this.getActiveRow().currentLetter--;
	this.getActiveRow().builtWord.pop();
	var cell = this.getActiveRow().getActiveCell();
	cell.SM.changeState("DEFAULT");
	cell.hideLetter();
	return this.getActiveRow();
	
}

/**
 * 
 * @param rowData {WordleBoard.RowData} - the WordleBoard.RowData Object you want to check, for example, you can pass WordleBoard.getActiveRow().
 * @returns {Object} - object containing 3 WordleLetterCell[], one for the letters you got correct (green), one for the letters you got partially correct (yellow), and one for the letters that do not
 * exist in the target word (gray)
 */
WordleBoard.prototype.evaluateRowData = function(rowData){
	var correctLetters = [];
	var partialLetters = [];
	var grayLetters = [];
	
	var i = 0;
	var checkLetters = this.targetWord.split('');
	rowData.cells.forEach(function(cell){
		if(cell.letter == this.targetWord.charAt(i)){
			correctLetters.push(cell);
			checkLetters.splice(checkLetters.indexOf(cell.letter), 1);
		}
		else if(checkLetters.includes(cell.letter)){
			partialLetters.push(cell);
		}else{
			grayLetters.push(cell);
		}
		i++;
	}, this);
	
	
	return {
		correctLetters: correctLetters,
		partialLetters: partialLetters,
		grayLetters: grayLetters,
	};
	
};

/**
 * 
 * @param rowData {WordleBoard.RowData} - the WordleBoard.RowData Object you want to to resolve
 * @param doAnimate {bool} - do you want to animate the letters as they come in, or do you want them to immedietly appear?
 * @param onComplete {function} - a callback function once, all the letters have appeared on the board
 @returns {Object} - object containing 3 WordleLetterCell[], one for the letters you got correct (green), one for the letters you got partially correct (yellow), and one for the letters that do not
 * exist in the target word (gray)
 */

WordleBoard.prototype.resolveRowData = function(rowData, doAnimate, onComplete){
	
	doAnimate = doAnimate==undefined?true:doAnimate;
	var evalData = this.evaluateRowData(rowData);

	var cellsEvaluated = 0;
	var onTweenFinished = function(){
		cellsEvaluated++;
		if(cellsEvaluated == rowData.cells.length){
			if(onComplete){
				onComplete.call(this, evalData);
			}
		}
	}.bind(this);
	evalData.correctLetters.forEach(function(cell){
		cell.SM.changeState("GREEN", {doAnimate: doAnimate, tweenFinished: onTweenFinished});
	}, this);
	evalData.partialLetters.forEach(function(cell){
		cell.SM.changeState("YELLOW", {doAnimate: doAnimate, tweenFinished: onTweenFinished});
	}, this);
	evalData.grayLetters.forEach(function(cell){
		cell.SM.changeState("GRAY", {doAnimate: doAnimate, tweenFinished: onTweenFinished});
	}, this);
	
	this.onRowEvaluated.dispatch(evalData);
	
	return evalData;
};


/**
 * 
 * @param rowData {WordleBoard.RowData} - the row you want to animate as invalid
 * @param onComplete {function} - a callback once all of the cells are finished
 */
WordleBoard.prototype.invalidWordAnim = function(rowData, onComplete){
	
	var cellsComplete = 0;
	var cellDelay = rowData.cells.length * 100;
	rowData.cells.forEach(function(cell){
		cellDelay -=100;
		this.game.time.events.add(cellDelay, function(){
			cell.SM.changeState("RED");
		}, this);
		
		cell.SM.states.DEFAULT.onEnter.addOnce(function(){
			cellsComplete++;
			if(cellsComplete == rowData.cells.length){
				if(onComplete){
					onComplete.call(this);
				}
			}
		}, this);
		
	}, this);
	rowData.clear();
};

/**
 * this function allows you to add words to the board that you do not type in, useful for starting, or animating the correct word when the game finished
 * 
 * @param word {string} - the word you want top add to the board
 * @param doAnimate {bool} - do you want the words to animate when they appear
 * @param onComplete {function} - callback once the word is manually populated
 */
WordleBoard.prototype.manualPopulate = function(word, doAnimate, onComplete){
	if(this.currentRow>=this.numRows){
		return;
	}
	var wordArr = word.split('');
	
	wordArr.forEach(function(letter){
		this.addLetter(letter, false);
	}, this);
	
	this.resolveRowData(this.getActiveRow(), doAnimate, onComplete);
	this.currentRow++;
	
};

/**
 * this function animates the board resetting. You could loop through all the cells and change their state to default, destroy them, whatever you want
 * @param doAnimate {bool} - do you want to animate their disappearing
 * @param onComplete {function} - callback once the animation finishes
 */
WordleBoard.prototype.resetBoard = function(doAnimate, onComplete){
	var delay = 0;
	var rowsDestroyed = 0;
	for(var row = this.currentRow-1; row>=0; row--){
		
		this.rowData[row].cells.forEach(function(cell){
			cell.resetCell(doAnimate, delay, function(_numRows){
				if(cell.index == 0){
					rowsDestroyed++;
					
					if(rowsDestroyed == _numRows){
						if(onComplete){
							onComplete.call(this);
						}
					}
				}
				cell.hideLetter();
				cell.SM.changeState("DEFAULT");
				
				
			}.bind(this, this.currentRow));
		}, this);
		
		this.rowData[row].clear();
		delay+=100;
	}
	this.currentRow = 0;
};

/**
 * 
 * @param row {int} - the row you want to get the cell in
 * @param index {int} - the index of the letter within the row
 * @returns {WordleLetterCell} - the cell in the slot specified
 */
WordleBoard.prototype.getCell = function(row, index){
	return this.rowData[row].cells[index];
};



/**
 * This is the class for the keyboard in the game. it inherits from Phaser.Group, so you can scale, move, rotate etc the same way you would any other group
 * @param _game {Phaser.Game} - reference to the game
 * @param _backingSprite {Phaser.Sprite} - a sprite that you want to want to render the keyboard within the bounds. This is usually just a white rectangle that you can lay out in the scene to visualize where the keyboard will appear
 * @param _parent {Phaser.Group} - what you want the parent of the keyboard to be. The parent should be positioned at 0,0, because the TapKeyboard will be positioned to the x and y coordinates of the backing sprite you pass.
 * @param _font {Phaser.BitmapFont} - the bitmap font you want the keyboard to use
 * @param _keyGenCallback - a callback function once the position, letter, and bounds of the key is set. This is where you would set the callback if it is clicked, what it looks like visually, etc.
 * 							In Wordle, I create a state machine for each key that is useful for changing color.
 */

function TapKeyboard(_game, _backingSprite, _parent, _font, _keyGenCallback){
	this.game = _game;
	Phaser.Group.call(this, this.game, _parent);
	this.backingSprite = _backingSprite;
	this.font = _font;
	this.keyGenCallback = _keyGenCallback;
	
	
	this.onDeletePressed = new Phaser.Signal();
	this.onLetterPressed = new Phaser.Signal();
	this.onGuessPressed = new Phaser.Signal();

	this.keyMap = new Map();
	
	this.dc = this.game.add.graphics(0,0);
	//this.dc.alpha = 0;
	this.boundsRect = new Phaser.Rectangle().copyFrom(this.backingSprite).centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	
	this.position.setTo(this.backingSprite.centerX, this.backingSprite.centerY);
	this.backingSprite.destroy();
	this.padding = -2;
	var rowLines = this.boundsRect.divideRect(3, false, false);
	var letterOrder = "qwertyuiopasdfghjklzxcvbnm".split("");
	var lettersPerRow = [10, 9, 7];
	
	
	for(var row = 0; row< rowLines.length; row++){
		rowLines[row].setLength(rowLines[row].length * (lettersPerRow[row]/10));
		
		if(row == rowLines.length - 1){
			//calculate offset of last row, same diagonal step from row 0 to 1
			var rowXOffset = rowLines[1].left-rowLines[0].left;
			rowLines[row].fromAngle(rowLines[1].left + rowXOffset, rowLines[row].y, rowLines[row].angle, rowLines[row].length);
		}
		
		for(var letterIndex = 0; letterIndex< lettersPerRow[row]; letterIndex++){
			var newLetter = new TapKeyboard.Letter(this.game, letterOrder.shift(), this.font, new Phaser.Rectangle(), this);
			this.add(newLetter);
			if(this.keyGenCallback){
				this.keyGenCallback.call(this, newLetter);
			}
			this.keyMap.set(newLetter.char, newLetter);
		}
	}
	
	//deleteKey
	var deleteKey = new TapKeyboard.Letter(this.game, "DELETE", this.font, new Phaser.Rectangle(), this);
	this.keyMap.set("DELETE", deleteKey);
	deleteKey.isDelete = true;
	if(this.keyGenCallback){
		this.keyGenCallback.call(this, deleteKey);
	}
	this.add(deleteKey);
	
	//this is how you would add another key to the keyboard:)
	
	//guessKey
	var guessKey = new TapKeyboard.Letter(this.game, "GUESS", this.font, new Phaser.Rectangle(), this);
	this.keyMap.set("GUESS", guessKey);
	guessKey.isGuess = true;
	if(this.keyGenCallback){
		this.keyGenCallback.call(this, guessKey);
	}
	this.add(guessKey);
	this.remakeKeyboard(this.boundsRect);
}

TapKeyboard.prototype = Phaser.Group.prototype;
TapKeyboard.constructor = TapKeyboard;


/**
 * 
 * @param newBounds {Phaser.Rectangle} - a rectangle positioned in World Space that you want the keyboard to be rendered inside of
 * 
 * if you want to move around where the lines of keys are positioned, simply modified the Phaser.Line Objects created in rowLines
 */
TapKeyboard.prototype.remakeKeyboard = function(newBounds){
	this.boundsRect = newBounds.clone();
	this.position.setTo(newBounds.centerX, newBounds.centerY);
	this.updateTransform();
	this.boundsRect.centerOn(0,0);
	var rowLines = this.boundsRect.divideRect(3, false, false);
	var lettersPerRow = [10, 9, 7];
	var letterBoundsRect = new Phaser.Rectangle(0,0, this.boundsRect.width/10, this.boundsRect.height/3);
	var letterOrder = "qwertyuiopasdfghjklzxcvbnm".split("");
	
	
	//the lines will default to center in the middle of the bounds you render them in, if you want to move one of the rows left or right, do this
	//rowLines[2].centerOn(rowLines[2].midPoint().x-15, rowLines[2].midPoint().y);
	
	for(var row = 0; row< rowLines.length; row++){
		rowLines[row].setLength(rowLines[row].length * (lettersPerRow[row]/10));
		
		
		for(var letterIndex = 0; letterIndex< lettersPerRow[row]; letterIndex++){
			var pos = rowLines[row].interpolate((letterIndex + 0.5)/lettersPerRow[row]);
			var assocKey = this.keyMap.get(letterOrder.shift());
			assocKey.position.setTo(pos.x, pos.y);
			assocKey.boundsRect = letterBoundsRect.clone().centerOn(pos.x, pos.y);
			
			//this loads the correct sprite
			assocKey.SM.currentState.onEnter.dispatch();
			var paddedRect = assocKey.boundsRect.clone().inflate(this.padding, this.padding);
			assocKey.pressedSprite.y = 0;
			assocKey.baseSprite.resizeInRect(paddedRect);
			assocKey.pressedSprite.resizeInRect(paddedRect);
			
			assocKey.pressedSprite.y += assocKey.baseSprite.bottom - assocKey.pressedSprite.bottom;
			
			assocKey.bmLetter.scale.setTo(assocKey.baseSprite.scale.x * 0.5);
			assocKey.updateTransform();
			
		}
	}
	
	//if you want it to follow some of the same spacing of the keyboard, you can use variables from the other keys like this
	
	var spacingInBetweenKeys = this.keyMap.get("m").left - this.keyMap.get("n").right;
	
	//custom positioning of the keys not on a grid
	
	var guessKey = this.keyMap.get("GUESS");
	guessKey.SM.currentState.onEnter.dispatch();
	if(guessKey.SM.checkState("GRAY")){
		guessKey.SM.states.DEFAULT.onEnter.dispatch();
	}
	guessKey.baseSprite.resizeWithHeight(this.keyMap.get("z").baseSprite.height);
	guessKey.pressedSprite.resizeWithHeight(this.keyMap.get("z").baseSprite.height);
	guessKey.bmLetter.scale.setTo(0);
	guessKey.position.setTo(this.keyMap.get("z").left - guessKey.width/2 - spacingInBetweenKeys, this.keyMap.get("z").y);
	guessKey.boundsRect = new Phaser.Rectangle().copyFrom(guessKey).centerOn(guessKey.centerX, guessKey.centerY);
	guessKey.bmLetter.resizeInRect(guessKey.boundsRect.clone().inflate(-10, 0));
	//delete key logic
	
	
	
	var deleteKey = this.keyMap.get("DELETE");
	
	deleteKey.baseSprite.resizeWithHeight(this.keyMap.get("m").baseSprite.height);
	deleteKey.pressedSprite.resizeWithHeight(this.keyMap.get("m").baseSprite.height);
	deleteKey.position.setTo(this.keyMap.get("m").right + deleteKey.width/2 + spacingInBetweenKeys, this.keyMap.get("m").y);
	deleteKey.boundsRect = new Phaser.Rectangle().copyFrom(deleteKey.baseSprite).centerOn(deleteKey.baseSprite.centerX, deleteKey.baseSprite.centerY);
	
	this.keyMap.forEach(function(value, key){
		value.baseScale = value.scale.clone();
	}, this);
	
};


/**
 * 
 * @param _game {Phaser.Game} - a reference to the game
 * @param _char {String} - the word you want to appear on the key you are creating
 * @param _font {Phaser.BitmapFont} - the font you want the letters to use
 * @param _boundsRect {Phaser.Rectangle} - the rectangle you want this key to be restricted to, this is what is modified in the TapKeyboard.remakeKeyboard function. You can then position/resize the keys
 * 											based on this rectangle.
 */
TapKeyboard.Letter = function(_game, _char, _font, _boundsRect, _assocTapKeyboard){
	this.game = _game;
	Phaser.Group.call(this, this.game);
	this.char = _char;
	this.font = _font;
	this.boundsRect = _boundsRect;
	this.assocTapKeyboard = _assocTapKeyboard;
	this.position.setTo(this.boundsRect.centerX, this.boundsRect.centerY);
	this.bmLetter = this.game.add.bitmapText(0, 0, this.font, this.char.toUpperCase(), 64, this);
	this.bmLetter.anchor.setTo(0.5);
	this.bmLetter.tint = 0x5b556d;
	this.baseScale = this.scale.clone();
};



TapKeyboard.Letter.prototype = Phaser.Group.prototype;
TapKeyboard.Letter.constructor = TapKeyboard.Letter;














