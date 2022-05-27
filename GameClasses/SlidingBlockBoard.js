/**
 *
 */
function SlidingBlockBoard (_game, _scene) {
	this.game = _game;
	this.scene = _scene;

}

SlidingBlockBoard.prototype.getSquareFromWorldPos = function(worldPos){
	var localPos = this.tileParent.worldTransform.applyInverse(worldPos);
	
	return this.getSquareFromLocalPos(localPos);
	 
	
};

SlidingBlockBoard.prototype.getSquareFromLocalPos = function(localPos){
	var boardCoord = new Phaser.Point(localPos.x- this.boundsRect.left, localPos.y - this.boundsRect.top);
	if(boardCoord.x<0 || boardCoord.x > this.boundsRect.width || boardCoord.y<0 || boardCoord.y >this.boundsRect.height){
		return false;
	};
	
	var boardIndex=  {row: Math.floor(boardCoord.y/this.boundsRect.height * this.rows), col: Math.floor(boardCoord.x/this.boundsRect.width * this.cols)};
	
	return this.boardArr[boardIndex.row][boardIndex.col];
};

SlidingBlockBoard.prototype.validSquare = function(row, col){
	return row>=0 && row<this.rows && col>=0 && col <this.cols;
};

SlidingBlockBoard.prototype.getSquare = function(row, col){
	if(this.validSquare(row, col)){
		return this.boardArr[row][col];
	}
	return null;
	
};

SlidingBlockBoard.prototype.zSort = function(){
	this.scene.f_slidingTiles.sort('y', Phaser.Group.SORT_ASCENDING);
}

SlidingBlockBoard.prototype.getHighestBlock = function(){
	
	for(var row =0; row< this.rows; row++){
		for(var col =0; col< this.cols; col++){
			if(this.boardArr[row][col].assocBlock){
				return this.boardArr[row][col].assocBlock;
			}
		}
	}
}

SlidingBlockBoard.prototype.generateBoard = function(_boardData, _backingBoard){
	this.boardData = _boardData;
	this.backingBoard = _backingBoard;
	this.tileParent = this.backingBoard.parent;
	this.backingBoard.alpha = 0;
	this.dc = this.game.add.graphics(0,0);
	this.score = 0;
	this.maxScore = 0;
	this.rows = this.boardData.boardArr.length + this.boardData.emptyAbove;
	this.cols = this.boardData.boardArr[0].length;
		
	this.blockSize = Math.min(this.backingBoard.width/this.cols, this.backingBoard.height/this.rows);
	this.boundsRect = new Phaser.Rectangle(0,0, this.blockSize*this.cols, this.blockSize*this.rows);
	this.boundsRect.centerOn(this.backingBoard.centerX, this.backingBoard.centerY);
	

	
	this.boardArr = [];
	
	//variables for spawning shapes
	var currentBlock = null;
	var gridSpacesCovered = 0;
	var positionsCovered = [];
	var textureOptions = {1: 6, 2: 3, 3: 3, 4: 1};
	for(var row = 0; row < this.rows; row++){
		
		//makes sure that we have a valid row array
		var rowArr;
		if(row>=this.boardData.emptyAbove){
			rowArr = this.boardData.boardArr[row-this.boardData.emptyAbove].split("");
		}else{
			rowArr = [];
			for(var i = 0; i< this.cols; i++){
				rowArr.push("0");
			}
		}
		
		this.dc.beginFill(0x00ff00);
		this.boardArr.push([]);
		for(var col = 0; col< this.cols; col++){
			
			var gridData = {};
			gridData.offset = new Phaser.Point(col * this.blockSize + this.blockSize/2, row*this.blockSize + this.blockSize/2);
			gridData.position = new Phaser.Point(this.boundsRect.left+gridData.offset.x, this.boundsRect.top+gridData.offset.y);
			gridData.bounds = new Phaser.Rectangle(0,0, this.blockSize, this.blockSize);
			gridData.bounds.centerOn(gridData.position.x, gridData.position.y);
			gridData.backingSquare = this.game.add.sprite(0,0, "board-square");
			gridData.backingSquare.width = this.blockSize*1.2;
			gridData.backingSquare.height = this.blockSize*1.2;
			gridData.backingSquare.anchor.setTo(0.45);
			gridData.backingSquare.position.setTo(gridData.position.x, gridData.position.y);
			this.scene.f_backingTiles.add(gridData.backingSquare);
			var boardNum = parseInt(rowArr[col]);
			if(boardNum>0){
				this.maxScore+=1;
				if(currentBlock == null){
					var textureID = this.game.rnd.integerInRange(1, textureOptions[boardNum]);
					currentBlock = this.game.add.sprite(0,0, "block_"+boardNum.toString()+"_" + textureID.toString());
					var prevH = currentBlock.height;
					currentBlock.height = this.blockSize*1.1;
					currentBlock.width = this.blockSize * boardNum;
					
					currentBlock.size = boardNum;
					currentBlock.textureID = textureID;
					currentBlock.getOriginPos = function(_block){
						return new Phaser.Point(_block.left + this.blockSize/2, _block.y);
					}.bind(this, currentBlock);
					
					
					currentBlock.anchor.setTo(0.5);
					currentBlock.grayBlock = this.game.add.sprite(0,0, "greyblock_"+boardNum.toString()+"_" + textureID.toString());
					currentBlock.grayBlock.anchor.setTo(0.5);
					currentBlock.grayBlock.width = currentBlock.width;
					currentBlock.grayBlock.height = currentBlock.height;
					currentBlock.grayBlock.alpha = 0;
					currentBlock.grayFade = function(grayBlock, parentBlock, delay){
						grayBlock.position.setTo(parentBlock.position.x, parentBlock.position.y);
						
						this.scene.f_slidingTiles.bringToTop(grayBlock);
						var grayTween = this.game.add.tween(grayBlock).to({alpha: 1}, 300, Phaser.Easing.Linear.None, true, delay);
						return grayTween;
					}.bind(this, currentBlock.grayBlock, currentBlock);
//					currentBlock.grayFilter = this.game.add.filter('Gray');
//					currentBlock.filters = [currentBlock.grayFilter];
//					currentBlock.grayFilter.gray = 0;
					
					this.scene.f_slidingTiles.add(currentBlock);
					this.scene.f_slidingTiles.add(currentBlock.grayBlock);
					gridSpacesCovered = boardNum;
				}
				gridData.assocBlock = currentBlock;
				positionsCovered.push(gridData);
				gridSpacesCovered --;
				if(gridSpacesCovered == 0){
					var centerPos = Phaser.Point.centroid([positionsCovered[0].position, positionsCovered[positionsCovered.length-1].position]);
					currentBlock.position.setTo(centerPos.x, centerPos.y);
					
					currentBlock.positionsCovered = positionsCovered;
					
					positionsCovered = positionsCovered.sort(function(a, b){
						return a.position.x - b.position.x;
					}, this);
					positionsCovered = [];
					currentBlock = null;
				}
			}else{
				gridData.assocBlock = null;
			}
			gridData.row = row;
			gridData.col = col;
			gridData.id = Util.cantorPair(row, col);
			this.boardArr[row].push(gridData);
			
		}
	}

	
};
//TODO
//make it so that it takes into account the width of the piece if trying to find a path for a piece
SlidingBlockBoard.prototype.getAStarPath = function(startSquare, endSquare, block){
	var frontier = new PriorityQueue();
	var frontierSet = new Set();
	
	var debugText = function(text, square){
		var t = this.game.add.text(0,0,text);
		t.anchor.setTo(0.5);
		this.scene.f_tilesParent.add(t);
		t.position.setTo(square.position.x, square.position.y);
		return t;
	}.bind(this);
	var addToOpenSet = function(square, priority){
		if(!square){

		}
		frontier.enqueue(square, priority);
		frontierSet.add(square.id);
	}.bind(this);
	var getMinOpenSet = function(){
		var chosen = frontier.dequeue();
		frontierSet['delete'](chosen.element.id);
		return chosen;
	}.bind(this);
	
	var D = 1;
	var D2 = 1;
	
	var heuristic = function(currentSquare){
		var dx = Math.abs(currentSquare.position.x - endSquare.position.x);
	    var dy = Math.abs(currentSquare.position.y - endSquare.position.y);
	    return D * (dx + dy);
	};

	
	addToOpenSet(startSquare, 0);
	
	var came_from = new Map();
	//gscore
	var cost_so_far = new Map();
	came_from.set(startSquare, null);
	cost_so_far.set(startSquare.id, 0);
	

	while(frontier.items.length> 0){
		var current = getMinOpenSet().element;
		
		if(current.row == endSquare.row && current.col == endSquare.col){
			var prev = came_from.get(endSquare);
			var path = [endSquare];
			while(prev){
				
				if(prev){
					path.push(prev);
				}
				prev = came_from.get(prev);
				
			}
			
			path = path.reverse();
			return path;
		}
	  
	   //row + col == -1 || row+col == 1
	   for(var col = -1; col<2; col++){
			for(var row = -1; row<2; row++){
				if(Math.abs(row + col) == 1){
					
					var nextCoordToCheck = {row: current.row + row, col: current.col + col};
					var next = this.getSquare(nextCoordToCheck.row, nextCoordToCheck.col);
					
					var newCost = -Infinity;
					var allCoordsValid = true;
					for(var i = 0; i< block.size; i++){
						next = this.getSquare(nextCoordToCheck.row, nextCoordToCheck.col+i);
						if(next){
							var costOfNext = (next.assocBlock?Infinity:1);
							if(next == block){
								costOfNext = 1;	
								
							}
							newCost = Math.max(newCost, cost_so_far.get(current.id) + costOfNext);
	
							
						}else{
							allCoordsValid = false;
							break;
						}
					}
					
					
					if(!allCoordsValid){
						continue;
					}
					
					
					next = this.getSquare(nextCoordToCheck.row, nextCoordToCheck.col);
					//debugText(cost_so_far.get(next.id)==undefined, next);
					if(newCost<(cost_so_far.get(next.id)==undefined?Infinity:cost_so_far.get(next.id))){
						
						cost_so_far.set(next.id, newCost);
						var priority = newCost + heuristic.call(this, next);
						came_from.set(next, current);
						if(!frontierSet.has(Util.cantorPairSigned(next.row, next.col))){
							
							addToOpenSet(next, priority);
						}

					}
					

				}
			}
		}
	}
	
	return false;

	   
};


