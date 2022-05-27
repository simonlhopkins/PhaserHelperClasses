/**
 *
 */
function WaterSortBoard (_game, _rowThetas, _gameBounds, rowWidth, _bottleData, _bottleParent) {
	
	this.game = _game;
	this.rowThetas = _rowThetas;
	this.bottleData = _bottleData;
	this.gameBounds = _gameBounds;
	this.bottleParent = _bottleParent;
	this.rows = this.rowThetas.length;
	this.cols = Math.ceil(this.bottleData.length/this.rowThetas.length);
	this.allVials = [];
	
	var bottleNum = 0;
	console.log(this.bottleData.length, this.cols, this.rows);
	for(var row = 0; row < this.rows; row++){
		var rowLine = new Phaser.Line(0,0, rowWidth, 0);
		rowLine.centerOn(this.gameBounds.centerX, Phaser.Math.linear(this.gameBounds.top, this.gameBounds.bottom, this.rowThetas[row]));
		for(var col = 0; col < this.cols; col++){
			console.log(bottleNum);
			var spawnPos = Util.linearInterpolateLine(rowLine, col/this.cols + 1/(2*this.cols));
			var newVial = new WaterSortVial(this.game);
			this.bottleParent.add(newVial);
			
			
			newVial.initialize(this.bottleData[bottleNum], 4, {
					upright: {
						top: 50,
					},
					pour: {
						bottom: 10,
					}
				}, this, col%4==0);
			
			newVial.position.setTo(spawnPos.x, spawnPos.y);
			newVial.basePos = newVial.position.clone();
			this.allVials.push(newVial);
			bottleNum++;
		}
	}
	
	
};





WaterSortBoard.prototype.getBestMove = function(){
	
	
	var optionsPQ = new PriorityQueue();
	
	
	//this prob mad inefficient
	for(var i = 0; i< this.allVials.length; i++){
		
		if(this.allVials[i].isComplete){
			continue;
		}
		
		if(this.allVials[i].isFilling){
			continue;
		}
		if(this.allVials[i].isPouring){
			continue;
		}
		if(this.allVials[i].topIndex == -1){
			continue;
		}
		if(this.allVials[i].hasFlower){
			continue;
		}
		for(var j = 0; j< this.allVials.length; j++){
			if(i==j){
				continue;
			}
			if(this.allVials[j].isComplete){
				continue;
			}
			
			if(this.allVials[j].topIndex == this.allVials[j].maxColors - 1){
				continue;
			}
			
			if(this.allVials[j].topIndex == -1 || (this.allVials[j].getTopColorBlock() != null && this.allVials[i].getTopColorBlock().color == this.allVials[j].getTopColorBlock().color)){
				if(this.allVials[i].getTopColorBlock() == null){
					continue;
				}
				var score = 0;
				if(this.allVials[j].hasFlower){
					score+=10;
				}
				var targetColor = this.allVials[i].getTopColorBlock().color;
				for(var p = this.allVials[i].topIndex; p>=0; p--){
					if(this.allVials[i].colorBlockStack[p].color== targetColor){
						score++;
					}else{
						break;
					}
				}
				for(var p = this.allVials[j].topIndex; p>=0; p--){
					if( this.allVials[j].colorBlockStack[p].color== targetColor){
						score++;
					}else{
						break;
					}
				}
				score*=-1;
				optionsPQ.enqueue({first: this.allVials[i], second: this.allVials[j]}, score);
			}
			
		}
	}
	
	var bestChoice = optionsPQ.dequeue();
	return bestChoice.element;
	
};

