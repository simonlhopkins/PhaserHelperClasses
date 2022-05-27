/**
 *
 */


//W X H
const BLOCKTYPE = {
	_1x1: ["X"],
	_2x1: ["XX"],
	_1x2: ["X",
	       "X"],
   _3x2T: ["XXX",
           " X "],
   _3x2T180: [" X ",
              "XXX"],
   _2x2L: ["X ",
           "XX"],
   _2x2L180: ["XX",
              "X "],
   _3x3: ["XXX",
          "XXX",
          "XXX"],
   _2x2: ["XX",
          "XX"],
   _4x1: ["XXXX"],
   _1x4: ["X",
          "X",
          "X",
          "X"],
   _2x2J: [" X",
           "XX"],
   _2x2J180: ["XX",
              " X"],
    _3x1: ["XXX"],
    _1x3: ["X",
           "X",
           "X"],
    _P_0: ["XX",
           "XX",
           "X "],
    _3x2: ["XXX",
           "XXX"],
    _2x3J180: ["XX",
               "X ",
               "X "],
    _3x2L: ["XXX",
            "X  "],
    _3x2Z: ["XX ",
            " XX"],
    _2x3L180: ["XX",
               " X",
               " X"],
                    
           
    
	
}

function BSBoard (_game, _boardBacking, _trayBacking) {
	
	this.game = _game;
	this.boardBacking = _boardBacking;
	this.trayBacking = _trayBacking;
	this.boardDC = this.game.add.graphics(0,0);
	this.trayDC = this.game.add.graphics(0,0);
	this.boardBacking.parent.add(this.boardDC);
	this.trayBacking.parent.add(this.trayDC);
	this.boardBounds = new Phaser.Rectangle().copyFrom(this.boardBacking);

	this.boardBounds.centerOn(this.boardBacking.x, this.boardBacking.y);
	
	this.trayBounds = new Phaser.Rectangle().copyFrom(this.trayBacking);

	this.trayBounds.centerOn(this.trayBacking.x, this.trayBacking.y);
	
	this.boardBacking.alpha = 0;
	this.trayBacking.alpha = 0;
	this.boardArr = [];
	//init vars
	this.trayBlocks = [];
}


BSBoard.prototype.initialize = function(rows, cols, _initTrayData, _blocksParent, _trayParent, _FXParent, _blockClickCallback){
	
	this.initTrayData = _initTrayData;
	this.blocksParent = _blocksParent;
	this.trayParent = _trayParent;
	this.FXParent = _FXParent;
	this.blockClickCallback = _blockClickCallback;
	this.glowSparkleQueue = new ParticleQueue(this.game, this.FXParent);
	this.glowSparkleQueue.initParticles(["particle_sparkle"], 100);
	
	this.chunkQueue = new ParticleQueue(this.game, this.FXParent);
	this.chunkQueue.initParticles(["block shard"], 100);
	
	for(var i = 0; i< this.initTrayData.maxSlots; i++){
		this.trayBlocks.push(null);
	}
	this.trayQueue = Util.deepCopyObject(this.initTrayData.queue);

	//render board
	this.rows = rows;
	this.cols = cols;
	
	this.cellSize = Math.min(this.boardBounds.width/this.cols, this.boardBounds.height/this.rows);
	
	
	this.boardArr = [];
	for(var row = 0; row< this.rows; row++){
		
		this.boardArr.push([]);
		for(var col = 0; col< this.cols; col++){
			var centerX = Phaser.Math.linear(this.boardBounds.left, this.boardBounds.right, (col+0.5)/this.cols);
			var centerY = Phaser.Math.linear(this.boardBounds.top, this.boardBounds.bottom, (row+0.5)/this.rows);
			
			var newCell = new Cell(this.game, row, col, true, this.cellSize, this.blocksParent, this.FXParent, new Phaser.Point(centerX, centerY), this.chunkQueue);
			
			var fxLocalPos = this.blocksParent.worldTransform.applyInverse(newCell.worldPos());
			fxLocalPos.subtract(Global.cameraOffsetX, Global.cameraOffsetY);
			newCell.showGlow = this.showGlow.bind(this, newCell, fxLocalPos, this.FXParent);
			newCell.hideGlow = this.hideGlow.bind(this, newCell);
			this.boardArr[row].push(newCell);

		}
	}
	this.blocksParent.sort('y', Phaser.Group.SORT_DESCENDING);
	
	//this.renderBoard(this.initBoardData, false);
	//render Tray
	
};

//only if a new puzzle has the same board dims, if not, just make another BS Board object
//this reuses the objects we initialized in BSBoard.prototype.initialize

BSBoard.prototype.renderBoard = function(_boardData, color, animate){
	
	var getColor = function(char){
		switch(char.toUpperCase()){
			case "Y":
				return "yellow";
			case "R":
				return "red";
			case "P":
				return "purple";
			case "O":
				return "orange";
			default:
				return "yellow";
		};
	}.bind(this);
	
	if(_boardData.blocks.length!= this.rows || _boardData.blocks[0].length!= this.cols){
		console.log("board data does not match existing dimensions");
		console.log(_boardData.blocks.length, _boardData.blocks[0].length, this.rows, this.cols);
		return;
	}
	this.initBoardData = _boardData;
	
	for(var row = 0; row< this.rows; row++){
		
		this.initBoardData.blocks[row] = this.initBoardData.blocks[row].split("");
		for(var col = 0; col< this.cols; col++){
			var cell = this.getCell(row, col);
			cell.baseSprite.loadTexture(getColor(this.initBoardData.blocks[row][col]) + " block");
			cell.graySprite.alpha = 0;
			cell.color = getColor(this.initBoardData.blocks[row][col]);
			cell.baseSprite.alpha = 1;
			cell.empty = false;
			if(this.initBoardData.blocks[row][col]== " "){
				this.setToEmpty(row, col);
			}else if(this.initBoardData.blocks[row][col]== "X"){
				this.setToEmpty(row, col);
				cell.blocked = true;
			}
			//this.boardArr[row].push(newCell);
			if(animate && !cell.empty){
				cell.appearAnim(0);
			}
		}
	}
	this.blocksParent.sort('y', Phaser.Group.SORT_DESCENDING);
}

BSBoard.prototype.getCell = function(row, col){
	return this.boardArr[row][col];
}

BSBoard.prototype.getNumTrayBlocks = function(){
	return this.trayBlocks.filter(function(e){
		return e!=null;
	}, this).length;
}

//kinda a twisted way to do it but I didn't wanna write this function multiple times :/
BSBoard.prototype.showGlow = function(obj, center, parent){
	if(obj.isGlowing){
		return;
	}
	obj.isGlowing = true;
	
	if(obj.glowSprite.alphaTween){
		obj.glowSprite.alphaTween.stop();
	}
	obj.glowSprite.alphaTween = this.game.add.tween(obj.glowSprite).to({alpha: 1}, 100, Phaser.Easing.Linear.None, true);
	
	var spawnGlowSparkle = function(){
		if(!obj.isGlowing){
			return;
		}
		var p = this.glowSparkleQueue.popFront();
		this.game.time.events.add(this.game.rnd.realInRange(50, 75), spawnGlowSparkle.bind(this), this);
		if(!p){
			return;
		}
		(parent?parent:obj.parent).add(p);
		
		var spawnCircle = new Phaser.Circle(center?center.x:obj.spawnCircle.x, center?center.y:obj.spawnCircle.y, obj.spawnCircle.diameter);
		var pos = spawnCircle.random();
		p.position.setTo(pos.x, pos.y);
		p.alpha = 1;
		p.scale.setTo(0);
		var endScale = this.game.rnd.realInRange(0.3, 0.7);
		p.scaleTween = this.game.add.tween(p.scale).to({x: endScale, y: endScale}, 300, Phaser.Easing.Sinusoidal.InOut, true, 0, 0, true);
		p.rotTween = this.game.add.tween(p).to({angle: "360"}, 600, Phaser.Easing.Linear.None, true);
		p.scaleTween.onComplete.add(function(){
			this.glowSparkleQueue.pushBack(p);
			//spawnGlowSparkle.call(this);
		}, this);
		
		
	};
	
	spawnGlowSparkle.call(this);
	
}

BSBoard.prototype.hideGlow = function(obj){
	if(!obj.isGlowing){
		return;
	}
	obj.isGlowing = false;
	if(obj.glowSprite.alphaTween){
		obj.glowSprite.alphaTween.stop();
	}
	obj.glowSprite.alphaTween = this.game.add.tween(obj.glowSprite).to({alpha: 0}, 100, Phaser.Easing.Linear.None, true);
	
};

const CHUNK_COLORS = {
	red: 0xff0810,
	yellow: 0xffe226,
	orange: 0xff9d1d,
	purple: 0xd035ff
};

function Cell(game, row, col, empty, cellSize, blockParent, fxParent, centerPos, chunkQueue){
	this.game = game;
	this.row = row;
	this.col = col;
	this.empty = empty;
	this.cellSize = cellSize;
	this.FXParent = fxParent;
	this.chunkQueue = chunkQueue;
	this.color = null;
	this.id = Util.cantorPair(row, col);
	this.blockParent = blockParent;
	this.parent = this.game.add.group(blockParent);
	this.blocked = false;
	this.isShaking = false;
	
	this.baseSprite = this.game.add.sprite(0,0, "singleBlock_bw", 0, this.parent, 0.5, 0.5);
	this.graySprite = this.game.add.sprite(0,0, "singleBlock_bw", 0, this.parent, 0.5, 0.5);
	this.blockScale = this.cellSize/this.baseSprite.width;
	
	
	this.highlightSprite = this.game.add.sprite(0,0, "singleBlock_w", 0, this.parent, 0.5, 0.5);
	this.glowSprite = this.game.add.sprite(centerPos.x,centerPos.y, "glow", 0, this.FXParent, 0.5, 0.5);
	this.glowSprite.blendMode = PIXI.blendModes.ADD;
	this.glowSprite.alpha = 0;
	this.isGlowing = false;
	this.highlightSprite.alpha = 0;
	this.graySprite.alpha = 0;
	this.baseSprite.alpha = empty?0:1;
	
	this.parent.position.setTo(centerPos.x, centerPos.y);

	this.baseSprite.scale.setTo(this.blockScale);
	this.graySprite.scale.setTo(this.blockScale);
	this.highlightSprite.scale.setTo(this.blockScale);
	this.glowSprite.scale.setTo(this.blockScale);
	
	this.spawnCircle = new Phaser.Circle(0, 0,this.cellSize);
	//ref to a particle queue it can use for explosions
}

Cell.prototype.worldPos = function(){
	var wp = this.blockParent.worldTransform.apply(this.parent.position);
	wp.x += Global.cameraOffsetX;
	wp.y += Global.cameraOffsetY;
	return wp;
}
Cell.prototype.grayAnim = function(delay){
	this.parent.bringToTop(this.graySprite);
	this.graySprite.alphaTween = this.game.add.tween(this.graySprite).to({alpha: 1}, 300, Phaser.Easing.Linear.Out, true, delay);
	this.graySprite.alphaTween.onComplete.add(function(){
		this.baseSprite.alpha = 0;
	}, this);
	
};

BSBoard.prototype.outOfMovesAnim = function(onComplete){
	this.iterateAllCells(function(cell){
		if(!cell.empty){
			cell.grayAnim(cell.row * 100);
		}
	}, this);
	this.game.time.events.add(this.rows * 100, function(){
		if(onComplete){
			onComplete.call(this);
		}
	}, this);
};
Cell.prototype.destroyAnim = function(delay, onComplete){
	
	if(this.empty){
		return;
	}
	delay = delay==undefined?0:delay;
	this.hideGlow();
	this.highlightSprite.scale.setTo(0);
	this.highlightSprite.alpha = 1;
	this.highlightSprite.scaleTween = this.game.add.tween(this.highlightSprite.scale).to({x: this.blockScale*1.1, y: this.blockScale*1.1}, 300, Phaser.Easing.Sinusoidal.Out, true, delay);
	this.highlightSprite.alphaTween = this.game.add.tween(this.highlightSprite).to({alpha: 0}, 100, Phaser.Easing.Linear.None, true, 200+ delay);
	
	this.baseSprite.scaleTween = this.game.add.tween(this.baseSprite.scale).to({x: 0, y: 0}, 300, Phaser.Easing.Sinusoidal.In, true, delay);
	this.baseSprite.scaleTween.onComplete.add(function(){
		this.highlightSprite.alpha = 0;
		this.baseSprite.alpha = 0;
		this.highlightSprite.scale.setTo(this.blockScale);
		this.baseSprite.scale.setTo(this.blockScale);
		if(onComplete){
			onComplete.call(this, this);
		}
	}, this);
	
	var launchObj = function(p, tweenTime){
		var dummy = {value:0};
		var dummyTween = this.game.add.tween(dummy).to({value: 1}, tweenTime, Phaser.Easing.Linear.None, true);
		var launchAngle = this.game.rnd.realInRange(Math.PI/2-0.3, Math.PI/2+0.3);
		var v0 = this.game.rnd.realInRange(750, 1000);
		var t = 0;
		var startPos = p.position.clone();
		
		p.scaleTween = this.game.add.tween(p.scale).to({x: 0, y: 0}, 200, Phaser.Easing.Sinusoidal.InOut, true, tweenTime-200);
		
		dummyTween.onUpdateCallback(function(){
			var x = v0* Math.cos(launchAngle)*t;
			
			var y = v0*Math.sin(launchAngle)*t - (0.5)*4000*Math.pow(t,2);
			t+= this.game.time.physicsElapsed;
			p.position.setTo(startPos.x + x, startPos.y-y);
		}, this);
		
		return dummyTween;
	}
	
	var spawnChunk = function(){
		
		var p = this.chunkQueue.popFront();
		if(!p){
			return;
		};
		p.alpha = 1;
		
		p.visual.tint = CHUNK_COLORS[this.color];
		p.position.setTo(this.parent.x, this.parent.y);
		p.rotTween = this.game.add.tween(p).to({angle: "360"}, 1000, Phaser.Easing.Linear.None, true);
		p.scale.setTo(this.blockScale);
		launchObj.call(this, p, 1000).onComplete.add(function(){
			this.chunkQueue.pushBack(p);
		}, this);

		
	}
	this.game.time.events.add(delay + 150, function(){
		
		for(var i = 0; i<10; i++){
			spawnChunk.call(this);
		}
	}, this);
	
	return this.baseSprite.scaleTween;
};

Cell.prototype.shakeAnim = function(){
	if(this.isShaking){
		return;
	}
	this.isShaking = true;
	var shakeCircle = new Phaser.Circle(this.parent.x, this.parent.y, 10);
	
	Util.shake.call(this, shakeCircle, this.parent, 8, null, function(){this.isShaking=false;}.bind(this));
}

Cell.prototype.appearAnim = function(delay){
	this.baseSprite.scale.setTo(0);
	this.baseSprite.scaleTween = this.game.add.tween(this.baseSprite.scale).to({x: this.blockScale, y: this.blockScale}, 200, Phaser.Easing.Back.Out, true, delay);
	return this.baseSprite.scaleTween;
};


BSBoard.prototype.isFull = function(){
	var isFull = true;
	this.iterateAllCells(function(cell){
		if(!isFull){
			return;
		}
		if(!cell.blocked){
			if(cell.empty){
				isFull = false;
			}
		}
	}.bind(this));
	return isFull;
}

BSBoard.prototype.getTrayIndexLoc = function(index){
	if(index>=this.initTrayData.maxSlots){
		return;
	}
	var x = Phaser.Math.linear(this.trayBacking.left, this.trayBacking.right, (index+0.5)/this.initTrayData.maxSlots);
	var y = Phaser.Math.linear(this.trayBacking.top, this.trayBacking.bottom, 0.5);
	return new Phaser.Point(x, y);
}
BSBoard.prototype.shiftTrayQueue = function(generateRandom, color, parent, onCreateCallback, doAnimate){
	
	doAnimate = doAnimate == undefined?true:doAnimate;
	var trayIndex = 0;
	for(trayIndex = 0; trayIndex<this.trayBlocks.length; trayIndex++){
		if(this.trayBlocks[trayIndex] == null){
			break;
		};
	}
	if(trayIndex == this.trayBlocks.length){
		console.log("FULL!!");
		return;
	}
	var blockArr = this.trayQueue.shift();
	if(blockArr == undefined){
		if(generateRandom){
			var keys = Object.keys(BLOCKTYPE);
			console.log("random chosen", keys);

			blockArr = BLOCKTYPE[this.game.rnd.pick(keys)];
		}else{
			console.log("No more shapes!!");
			return;
		};
		
	}
	
	var newBlock = new Block(this.game, blockArr, color, this.cellSize, 30/this.cellSize, parent);
	
	//diff if horizontal or vertical tray

	newBlock.basePos = this.trayParent.worldTransform.apply(this.getTrayIndexLoc(trayIndex));
	newBlock.basePos.x += Global.cameraOffsetX;
	newBlock.basePos.y += Global.cameraOffsetY;
	
	newBlock.parent.position.setTo(newBlock.basePos.x, newBlock.basePos.y);
	
	newBlock.initMouseDown(this.blockClickCallback.bind(this));
	newBlock.initShowGlow(this.showGlow, this.hideGlow, this);
	
	this.trayBlocks[trayIndex] = newBlock;
	newBlock.trayIndex = trayIndex;
	if(onCreateCallback){
		onCreateCallback.call(this, newBlock);
	}
	//anim
	newBlock.SM.changeState("SPAWNING");
	newBlock.parent.scale.setTo(0);
	if(doAnimate){
		newBlock.spawnTween = this.game.add.tween(newBlock.parent.scale).to({x: newBlock.trayScale.x, y: newBlock.trayScale.y}, 300, Phaser.Easing.Back.Out, true);
		newBlock.spawnTween.onComplete.add(function(){
			if(newBlock.SM.checkState("SPAWNING")){
				newBlock.SM.changeState("RESTING");
			}
		}, this);
	}else{
		newBlock.parent.scale.setTo(newBlock.trayScale.x, newBlock.trayScale.y);
		newBlock.SM.changeState("RESTING");
	}
	
	return newBlock;
};

BSBoard.prototype.validCoord = function(row, col){
	return row>=0 && row<this.rows && col>=0 && col< this.cols;
};

BSBoard.prototype.getCellFromWorldPos = function(worldPos){
	worldPos.x-=Global.cameraOffsetX;
	worldPos.y-=Global.cameraOffsetY;
	var localPos = this.boardBacking.parent.worldTransform.applyInverse(worldPos);


	var closestCol = Math.floor(Util.unlerp(this.boardBounds.left, this.boardBounds.right, localPos.x) * this.cols);
	var closestRow = Math.floor(Util.unlerp(this.boardBounds.top, this.boardBounds.bottom, localPos.y) * this.rows);
	
	
	return this.validCoord(closestRow, closestCol)?{row: closestRow, col: closestCol}: false;
}

BSBoard.prototype.getPieceFit = function(upperLeftRow, upperLeftCol, piece){
	if(!piece){
		return false;
	}
	var cellsToPopulate = [];
	for(var rowOffset = 0; rowOffset< piece.rows; rowOffset++){
		
		for(var colOffset = 0; colOffset< piece.cols; colOffset++){
			
			var coordToCheck = {row: upperLeftRow+ rowOffset, col: upperLeftCol+ colOffset};
			
			if(!this.validCoord(coordToCheck.row, coordToCheck.col)){
				return false;
			}
			if(piece.blockArr[rowOffset][colOffset]!="X"){
				continue;
			};
			
			if(!this.boardArr[coordToCheck.row][coordToCheck.col].empty){
				return false;
			}else if(this.boardArr[coordToCheck.row][coordToCheck.col].blocked){
				return false;
			}
			
			
			cellsToPopulate.push(this.boardArr[coordToCheck.row][coordToCheck.col]);
			
		}
	}
	return cellsToPopulate;
};


BSBoard.prototype.resetTray = function(newTrayQueue){
	this.trayBlocks.forEach(function(trayPiece){
		if(!trayPiece){
			return;
		}
		this.clearTrayOfPiece(trayPiece);
		trayPiece.parent.destroy();
	}, this);
	this.trayQueue = newTrayQueue || [];
};

BSBoard.prototype.clearTrayOfPiece = function(piece){
	var trayIndex = this.trayBlocks.indexOf(piece);
	this.trayBlocks[trayIndex] = null;
}
BSBoard.prototype.placePiece = function(piece, cellsToFill){
	this.clearTrayOfPiece(piece);
	cellsToFill.forEach(function(cell){
		cell.baseSprite.alpha = 1;
		cell.baseSprite.loadTexture(piece.color + " block");
		cell.color = piece.color;
		cell.empty = false;
	}, this);
	
};

BSBoard.prototype.setToEmpty = function(row, col){
	this.boardArr[row][col].empty = true;
	this.boardArr[row][col].baseSprite.alpha = 0;
}

BSBoard.prototype.resolveBoard = function(cellsFilled, notPlaced){
	
	notPlaced = notPlaced==undefined?false:notPlaced;
	var rowsToCheck = new Set();
	var colsToCheck = new Set();
	
	var propectCellIds = new Set();
	if(notPlaced){
		cellsFilled.forEach(function(cell){
			propectCellIds.add(cell.id);
		}, this);
	}
	
	cellsFilled.forEach(function(cell){
		rowsToCheck.add(cell.row);
		colsToCheck.add(cell.col);
	}, this);
		
	var rowsToDestroy = new Set();
	var colsToDestroy = new Set();
	//check rows
	
	rowsToCheck.forEach(function(row){
		for(var col = 0; col< this.cols; col++){
			if(this.getCell(row, col).empty && !(propectCellIds.has(this.getCell(row, col).id))){
				return false;
			};
		}
		rowsToDestroy.add(row);
	}, this);
	
	
	//check cols
	colsToCheck.forEach(function(col){
		for(var row = 0; row< this.rows; row++){
			if(this.getCell(row, col).empty && !(propectCellIds.has(this.getCell(row, col).id))){
				return false;
			}
		}
		colsToDestroy.add(col);
	}, this);
	
	return {
		rowsToDestroy: Array.from(rowsToDestroy).sort(),
		colsToDestroy: Array.from(colsToDestroy).sort(),
	};
};

BSBoard.prototype.iterateAllCells = function(callback){
	for(var row = 0; row < this.rows; row++){
		for(var col = 0; col < this.cols; col++){
			callback.call(this, this.getCell(row, col));
		};
	};
}

BSBoard.prototype.iterateDestroyData = function(destroyData, callback){
	var alreadyVisited = new Set();
	
	destroyData.rowsToDestroy.forEach(function(row){
		for(var col = 0; col < this.cols; col++){
			callback.call(this, this.getCell(row, col), true);
			alreadyVisited.add(Util.cantorPair(row, col));
		};
		
	}, this);
	
	destroyData.colsToDestroy.forEach(function(col){
		for(var row = 0; row < this.rows; row++){
			if(!alreadyVisited.has(Util.cantorPair(row, col))){
				callback.call(this, this.getCell(row, col), false);
			};
			
		};
	}, this);
	
}


//TODO
//make better priority score:)
BSBoard.prototype.getPieceFitCoord = function(){
	
	var hintPrioQueue = new PriorityQueue();
	this.trayBlocks.forEach(function(block){
		if(!block){
			return;
		}
		this.iterateAllCells(function(cell){
			var pieceFitData = this.getPieceFit(cell.row, cell.col, block);
			var score = Infinity;
			if(pieceFitData.length>0){
				var fillData = this.resolveBoard(pieceFitData, true);
				score = -1*(fillData.rowsToDestroy.length + fillData.colsToDestroy.length) * block.blockMap.size;
			}
			
			if(pieceFitData){
				hintPrioQueue.enqueue({trayBlock: block, boardCells: pieceFitData}, score);
			}
		}, this);
		if(block.endPos){
			var pieceFitData = this.getPieceFit(block.endPos.row, block.endPos.col, block);
			if(pieceFitData){
				hintPrioQueue.enqueue({trayBlock: block, boardCells: pieceFitData}, -Infinity);
			};
			
		};
		
	}, this);
	
	//
	
	
	return hintPrioQueue.dequeue();
}


function Block(_game, _blockArr, _color, _cellSize, _trayScale, _parent){
	this.game = _game;
	this.blockArr = Util.deepCopyObject(_blockArr);
	this.color = _color;
	this.cellSize = _cellSize;
	this.trayScale = new Phaser.Point(_trayScale, _trayScale);
	this.parent = this.game.add.group(_parent);
	this.rows = this.blockArr.length;
	this.cols = this.blockArr[0].length;
	this.bounds = new Phaser.Rectangle(0,0,this.cols*this.cellSize, this.rows*this.cellSize);
	this.bounds.centerOn(0,0);
	this.blockMap = new Map();
	this.blockScale = new Phaser.Point();
	this.SM = new StateMachine({
		SPAWNING: new State(),
		RESTING: new State(),
		DRAG: new State(),
		RETURNING: new State()
	});
	this.initBlockSM();
	
	for(var row = 0; row< this.rows; row++){
		this.blockArr[row] = this.blockArr[row].split('');
		for(var col = 0; col< this.blockArr[row].length; col++){
			if(this.blockArr[row][col]== " "){
				continue;
			}
			var cellData = {};
			var centerX = Phaser.Math.linear(this.bounds.left, this.bounds.right, (col+0.5)/this.cols);
			var centerY = Phaser.Math.linear(this.bounds.top, this.bounds.bottom, (row+0.5)/this.rows);
			cellData.baseSprite = this.game.add.sprite(centerX, centerY, this.color + " block", 0, this.parent, 0.5, 0.5);
			cellData.blockScale = this.cellSize/cellData.baseSprite.width;
			this.blockScale.setTo(cellData.blockScale);
			cellData.glowSprite = this.game.add.sprite(centerX, centerY, "glow", 0, this.parent, 0.5, 0.5);
			cellData.glowSprite.blendMode = PIXI.blendModes.ADD;
			cellData.glowSprite.alpha = 0;
			cellData.isGlowing = false;
			cellData.spawnCircle = new Phaser.Circle(centerX, centerY,this.cellSize);
			cellData.offset = {row: row, col: col};
			cellData.parent = this.parent;
			this.blockMap.set(Util.cantorPair(row, col), cellData);
			
			cellData.baseSprite.scale.setTo(cellData.blockScale);
			cellData.glowSprite.scale.setTo(cellData.blockScale);
			
			
		};
	}
	this.parent.scale.setTo(0.5);
	this.SM.changeState("RESTING");
	this.parent.sort('y', Phaser.Group.SORT_DESCENDING);
}

Block.prototype.initShowGlow = function(_showGlow, _hideGlow, context){
	
	this.blockMap.forEach(function(value, key){
		
		value.showGlow = _showGlow?_showGlow.bind(context, value, new Phaser.Point(value.baseSprite.x,value.baseSprite.y), value.parent):_showGlow;
		value.hideGlow =_hideGlow?_hideGlow.bind(context, value, new Phaser.Point(value.baseSprite.x,value.baseSprite.y), value.parent):_hideGlow;
	}, this);
	
}

Block.prototype.showGlow = function(){
	this.blockMap.forEach(function(value, key){
		if(value.showGlow){
			value.showGlow();
		}
		
	}, this);
}

Block.prototype.hideGlow = function(){
	this.blockMap.forEach(function(value, key){
		if(value.hideGlow){
			value.hideGlow();
		}
		
	}, this);
}
Block.prototype.bringToTop = function(){
	this.parent.parent.bringToTop(this.parent);

}
Block.prototype.initBlockSM = function(){
	
	var mouseOffset = new Phaser.Point();
	var targetScale = this.trayScale;
	var thetaMod = 5;
	var scalePosTheta = 1;
	var startScale = this.parent.scale.clone();
	var startPos = this.parent.position.clone();
	this.SM.states.RESTING.onEnter.add(function(data){
		
	}, this);
	
	var updateScale = function(tweenFunction){
		this.parent.scale = Phaser.Point.interpolate(startScale, targetScale, tweenFunction.call(this, scalePosTheta));
		
		
	};
	var updatePos = function(targetPos, tweenFunction){
		this.parent.position = Phaser.Point.interpolate(startPos, targetPos, tweenFunction.call(this, scalePosTheta));
		
	};
	//we want to update the scale in these two states;

	this.SM.states.RESTING.onEnter.add(function(data){
		
	
	}, this);
	
	
	this.SM.states.DRAG.onEnter.add(function(data){
		this.bringToTop();
		scalePosTheta = 0;
		mouseOffset = data.mouseOffset.clone();
		startScale = this.parent.scale.clone();
		startPos = this.parent.position.clone();
		targetScale = new Phaser.Point(1, 1);
	}, this);
	this.SM.states.DRAG.onUpdate.add(function(data){
		scalePosTheta+= this.game.time.physicsElapsed * thetaMod;
		scalePosTheta = Math.min(1,scalePosTheta);
		var mousePos = new Phaser.Point(this.game.input.activePointer.x + Global.cameraOffsetX, this.game.input.activePointer.y + Global.cameraOffsetY);
		var targetPos = new Phaser.Point(mousePos.x + mouseOffset.x, mousePos.y + mouseOffset.y);
		this.parent.position = Phaser.Point.interpolate(this.parent.position, targetPos, this.game.time.physicsElapsed*20);
		updateScale.call(this, Phaser.Easing.Back.Out);
		
	}, this);
	
	
	
	this.SM.states.RETURNING.onEnter.add(function(data){
		scalePosTheta = 0;
		targetScale = this.trayScale;

		startScale = this.parent.scale.clone();
		startPos = this.parent.position.clone();
	}, this);
	
	this.SM.states.RETURNING.onUpdate.add(function(data){
		scalePosTheta+= this.game.time.physicsElapsed * thetaMod;
		scalePosTheta = Math.min(1,scalePosTheta);
		
		updatePos.call(this, this.basePos, Phaser.Easing.Sinusoidal.InOut);
		updateScale.call(this, Phaser.Easing.Sinusoidal.InOut);
		
		if(scalePosTheta>=1){
			this.SM.changeState("RESTING");
		}
		
	}, this);

}

Block.prototype.initMouseDown = function(callback){
	this.blockMap.forEach(function(value, key){
		value.baseSprite.inputEnabled = true;
		value.baseSprite.events.onInputDown.add(function(){
			callback.call(this, this, value);
		}, this);
	}, this);
};

Block.prototype.getUpperLeft = function(){
	return new Phaser.Point(this.bounds.left + this.parent.x + this.cellSize/2, this.bounds.top + this.parent.y + this.cellSize/2);
};






