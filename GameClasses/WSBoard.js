/**
 *
 */
function WSBoard (_game, _backingSprite, _boardData, _tileParent, _FXParent) {
	
	this.game = _game;
	this.backingSprite = _backingSprite;
	this.backingRect = new Phaser.Rectangle().copyFrom(this.backingSprite).centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	this.backingSprite.alpha = 0;
	this.boardArr = _boardData.boardArr;
	this.bonusWords = new Set(_boardData.bonusWords);
	this.tileParent = _tileParent;
	this.FXParent = _FXParent;
	
	this.particleQueue = new ParticleQueue(this.game, this.FXParent);
	this.particleQueue.initParticles(["ui_sparkle1", "ui_sparkle2"], 50);
	
	this.dc = this.game.add.graphics(0,0);
	this.dc.beginFill(0xff0000);
	
	this.cellMap = new Map();
	this.wordMap = new Map();
	this.foundWords = new Set();
	
	//SIGNALS YAY:)
	this.onHintSignal = new Phaser.Signal();
	
	this.backingRect.forEachGridPoint(this.boardArr.length, this.boardArr[0].length, true, function(x, y, row, col, cellBounds){
		if(this.boardArr[row][col] == ' '){
			return;
		}
		
		//you could just as easily replace this with a prefab, just look at the member variables defined in the constructor, and make sure that your prefab also has all of those defined in some initialization function
		var newCell = new WSBoard.Cell(this.game, this.boardArr[row][col], row, col, cellBounds, this.particleQueue);
		//initialize prefab here if you want
		this.cellMap.set(newCell.id, newCell);
		newCell.position.setTo(x, y);
		this.tileParent.add(newCell);
	}.bind(this));
	//populate the word data
	//check to see if it doesn't have a neighbor above/below or left/right
	//then recurse to find the built word
	
	this.cellMap.forEach(function(cell){
		
		//check up and down
		var hasVertNeighbors = this.getCell(cell.row -1, cell.col) && this.getCell(cell.row + 1, cell.col);
		var hasHorNeighbors = this.getCell(cell.row, cell.col-1) && this.getCell(cell.row, cell.col+1);
		
		if(!hasVertNeighbors){
			var currentCell = cell;
			var cellsInWord = [];
			var builtWord = "";
			while(currentCell){
				cellsInWord.push(currentCell);
				builtWord += currentCell.letter;
				currentCell = this.getCell(currentCell.row+1, currentCell.col);
				
			}
			if(cellsInWord.length>1){
				this.wordMap.set(builtWord, cellsInWord);
			}
		}
		if(!hasHorNeighbors){
			var currentCell = cell;
			var cellsInWord = [];
			var builtWord = "";
			while(currentCell){
				cellsInWord.push(currentCell);
				builtWord += currentCell.letter;
				currentCell = this.getCell(currentCell.row, currentCell.col+1);
			}
			if(cellsInWord.length>1){
				this.wordMap.set(builtWord, cellsInWord);
			}
		}
		
	}, this);
		
	
}



WSBoard.prototype.getCell = function(row, col){
	return this.cellMap.get(Util.cantorPairSigned(row, col)); 
};


WSBoard.prototype.checkWord = function(word){
	
	if(this.wordMap.has(word)){
		if(this.foundWords.has(word)){
			return;
		}
		this.wordMap.get(word).forEach(function(cell){
			cell.filledSprite.alpha = 1;
			this.wordMap.get(word).found = true;
		}, this);
		
		this.foundWords.add(word);
	}
}



WSBoard.Cell = function(_game, _letter, _row, _col, _bounds, _particleQueue){
	
	this.game = _game;
	this.letter = _letter;
	this.row = _row;
	this.col = _col;
	this.bounds = _bounds;
	this.particleQueue = _particleQueue;
	this.id = Util.cantorPairSigned(this.row, this.col);
	this.isShowing = false;
	Phaser.Group.call(this, this.game);
	
	this.emptySprite = this.game.add.sprite(0,0, "tile_emptyholder", null, this).setAnchor(0.5);
	
	this.filledSprite = this.game.add.sprite(0,0, "tile_board_" + this.letter.toLowerCase(), null, this).setAnchor(0.5);
	//in this particular playable, I added these in Shared.js after I made the board, since I wanted the parent to be different
	this.hintSprite = null;
	this.filledSprite.alpha = 0;
	//I scale here since the glow sprite makes it seem like the group takes up more space than it should
	this.resizeInRect(this.bounds);
	
};

WSBoard.Cell.prototype = Phaser.Group.prototype;
WSBoard.Cell.contructor = WSBoard.Cell;


WSBoard.Cell.prototype.fillLetter = function(){
	if(this.isShowing){
		return;
	}
	
	this.isShowing = true;
	this.filledSprite.alpha = 1;
	this.filledSprite.scale.setTo(0);
	this.filledSprite.scaleTween = this.game.add.tween(this.filledSprite.scale).to({x: 1, y: 1}, 300, Phaser.Easing.Back.Out, true);
	
	var spawnParticle = function(p){
		if(!p){
			return;
		}
		console.log("ss");
		var pos = this.bounds.random();
		p.alpha = 1;
		p.position.setTo(pos.x, pos.y);
		p.scale.setTo(0);
		var endScale = this.game.rnd.realInRange(0.4, 1);
		var delay = this.game.rnd.realInRange(0, 500);
		p.scaleTween = this.game.add.tween(p.scale).to({x: endScale, y: endScale}, 300, Phaser.Easing.Sinusoidal.InOut, true, delay, 0, true);
		p.scaleTween.onComplete.add(function(){
			this.particleQueue.pushBack(p);
		}, this);
	};
	
	for(var i = 0; i< 10; i++){
		spawnParticle.call(this, this.particleQueue.popFront());
	}
}




























