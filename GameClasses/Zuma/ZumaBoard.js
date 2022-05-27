/**

 *
 */
/**
 * _game - reference to the game object
 * _spiralPoints - an array of points that represent the spiral path
 * _spawnQueue - an array of objects in the form {letter: X, number: Y}, this can also be anything, just change how the balls initally spawn
 * _bubbleParent - a Phaser.Group where you want the balls to go when they are travelling on the path
 * _dragParent - a Phaser.Group where you want the ball to go when it is dragged
 */
function ZumaBoard (_game, _spiralPoints, _spawnQueue, _bubbleParent, _dragParent) {
	this.game = _game;
	
	this.spiralPoints = _spiralPoints;
	this.spawnQueue = _spawnQueue;
	this.bubbleParent = _bubbleParent;
	this.dragParent = _dragParent;
	this.spiralPoints.x = this.spiralPoints.map(function(e){return e.x;}, this);
	this.spiralPoints.y = this.spiralPoints.map(function(e){return e.y;}, this);
	
	this.dc = this.game.add.graphics(0,0);
	this.pathLength = 0;
	
	var currentPoint = this.spiralPoints[0];
	this.dc.beginFill(0xff0000);
	
	this.dc.beginFill(0x0000ff);
	//get notmalized points for constance velocity, this is an approximation
	//how many samples of the path you take.
	var pathFidelity = 300;
	//spacing of the points on the graph
	var pointSpacing = 50;
	var distToNextPoint = pointSpacing;
	var normalizedPointsOnPath = [];
	for(var i = 0; i<= pathFidelity; i++){
		
		var nextPoint = this.getPositionOnPathTheta(i/pathFidelity);
		var dist = Phaser.Point.distance(nextPoint, currentPoint);
		this.pathLength += dist;
		distToNextPoint -=dist;
		if(distToNextPoint<0){
			distToNextPoint = pointSpacing;
			normalizedPointsOnPath.push(nextPoint);
		}
		currentPoint = nextPoint;
	}
	this.spiralPoints = normalizedPointsOnPath.concat([this.spiralPoints[this.spiralPoints.length-1]]);
	
	this.spiralPoints.x = this.spiralPoints.map(function(e){return e.x;}, this);
	this.spiralPoints.y = this.spiralPoints.map(function(e){return e.y;}, this);

	this.pathSpeed = 125;

	
	this.nodeMap = new Map();
	
	this.minIndex = 0;
	this.maxIndex = 0;
	this.distanceTraveled = 0;
	this.dragNode = null;
	
	this.onMergeSignal = new Phaser.Signal();
	this.afterNodeCreateSignal = new Phaser.Signal();
	
	//initial spawning here
	while(this.spawnQueue.length>0){
		var ballData = this.spawnQueue.shift();
		var newNode = this.createNode(ballData.letter, ballData.number);
		newNode.ball.position.setTo(this.spiralPoints[0].x, this.spiralPoints[0].y);
		this.pushBack(newNode, true);
	}
	var itr = 0;
	while(this.nodeMap.size<80 && itr < 100){
		itr++;
		this.createChunk(8);
	}
	console.log("it took:", itr);
	
	
	
	this.SM = new StateMachine({
		RUNNING: new State(),
		PAUSED: new State(),
	});
	
	this.initRunningState();
	
	
	
	this.onMergeSignal.add(function(node1, node2){
		var sum = node1.ball.number + node2.ball.number;
		if(sum == 0 || Math.abs(sum) == 7){
			return;
		}
		if(Math.abs(sum)>7){
			
			var destroyNode = this.getNode(Math.min(node1.index, this.maxIndex-1));
			
			this.setNodeToDestroy(destroyNode);
			return;
		}
		
		var newNode = this.createNode(node1.ball.letter, sum);
		this.pushAtIndex(node1.index, newNode, false, false);
		console.log(this.minIndex, this.maxIndex);
	}, this);
	
	this.game.input.onUp.add(function(){
		if(!this.dragNode){
			return;
		}
		var mousePos = this.getMousePos();		
		var onPath = false;
		for(var i = this.minIndex; i< this.maxIndex; i++){
			var node = this.getNode(i);

			if(node.pendingDestroy){
				continue;
			}

			if(node.ball.collider.contains(mousePos.x, mousePos.y)){
				if(!node.interactive){
					continue;
				}
				
				if(this.dragNode.sameBall(node)){
					this.prepMergeSignal(node, this.dragNode);
					this.setNodeToDestroy(this.dragNode, false, true);
					this.setNodeToDestroy(node, false, false);
					
					node.SM.onUpdateSignal.add(function(dragNode, baseNode){
						var endLoc = new Phaser.Point(baseNode.ball.collider.x, baseNode.ball.collider.y);
						var targetLoc = Phaser.Point.interpolate(dragNode.ball.position, endLoc, this.game.time.physicsElapsed * 20);
						dragNode.ball.position.setTo(targetLoc.x, targetLoc.y);
					}.bind(this, this.dragNode, node), this);
					
				}else{
					this.game.add.sound("bad_match").play();
					for(var i = node.index; i< this.maxIndex; i++){

						if(!this.getNode(i).pendingDestroy){
							this.pushAtIndex(i, this.dragNode, true);
							break;
						}
						
					}
					if(i == this.maxIndex){
						this.pushFront(this.dragNode, true);
					}
					
				}
				onPath = true;
				break;
			}
		}
		
		if(!onPath){
			var targetIndex = Phaser.Math.clamp(this.dragNode.index, this.minIndex-1, this.maxIndex);
			for(var i = targetIndex; i< this.maxIndex; i++){
				
				if(!this.getNode(i).pendingDestroy){
					this.pushAtIndex(i, this.dragNode, true);
					break;
				}
				
			}
			if(i == this.maxIndex){
				this.pushFront(this.dragNode, true);
			}
		}
		this.dragNode = null;
	}, this);
	
	
		

}



ZumaBoard.Node = function(_index, _targetOffset, _ball){
	this.targetOffset = _targetOffset;
	this.currentOffset = this.targetOffset;
	this.ball = _ball;
	this.index = _index;
	this.velocity = 0;
	this.interactive = true;
	this.pendingDestroy = false;
	this.SM = new StateMachine({
		SEEKING: new State(),
		FOLLOWING: new State(),
		DRAGGING: new State(),
		RETURNING: new State(),
		DESTROYING: new State(),
		DEAD: new State()
	});
};


ZumaBoard.Node.prototype.sameBall = function(otherNode){
	
	
	if(Global.onlyColors){
		return this.ball.letter == otherNode.ball.letter;
	}
	return this.ball.letter == otherNode.ball.letter && this.ball.number == otherNode.ball.number;
};

ZumaBoard.Node.prototype.toString = function(){
	return this.ball.letter + ", " + this.ball.number;
}


ZumaBoard.prototype.createChunk = function(chunkSize){
	
	var letters = ["B", "I", "N", "G", "O"];
	var returnArr = [];
	for(var i = 0; i< chunkSize; i++){
		var letter = this.game.rnd.pick(letters);
		var number = this.game.rnd.frac()>0.5?this.game.rnd.integerInRange(1, 6):this.game.rnd.integerInRange(-1, -6);
		
		returnArr.push(this.createNode(letter, number));
		returnArr.push(this.createNode(letter, number));
	}
	returnArr = Phaser.ArrayUtils.shuffle(returnArr);
	
	//could delete them here if a pair
	returnArr.forEach(function(node){
		node.ball.position.setTo(this.spiralPoints[0].x, this.spiralPoints[0].y);
		this.pushBack(node, true);
	}, this);
	
};

ZumaBoard.prototype.createNode = function(_letter, _number){
	
	
	
	var newBall = new ZumaBall(this.game, this.bubbleParent);
	newBall.initialize(_letter, _number);
	var newNode = new ZumaBoard.Node(0,0, newBall);
	this.initNodeSM(newNode);
	return newNode;
};

ZumaBoard.prototype.pushFront = function(node, fromDrag){
	//could loop through the chain to get the actual offset (only if different sized balls)
	node.index = this.maxIndex;
	node.targetOffset = node.index*node.ball.collider.diameter;
	this.nodeMap.set(this.maxIndex, node);
	this.maxIndex++;
	node.SM.changeState(fromDrag?"RETURNING":"FOLLOWING");
	
	
	return node;
};

ZumaBoard.prototype.pushBack = function(node, init){
	
	if(this.nodeMap.size == 0){
		return this.pushFront(node, false);
		
	}
	this.minIndex--;
	node.index = this.minIndex;
	node.targetOffset = node.index*node.ball.collider.diameter;
	this.nodeMap.set(this.minIndex, node);
	node.SM.changeState("FOLLOWING", {init: init});
	return node;
};

ZumaBoard.prototype.pushAtIndex = function(index, node, fromDrag, immediate){
	immediate = immediate == undefined?false:immediate;
	for(var i = this.maxIndex-1; i>= index; i--){
		var moveNode = this.getNode(i);
		
		moveNode.index ++;
		this.nodeMap.set(moveNode.index, moveNode);
		moveNode.targetOffset = moveNode.index * moveNode.ball.collider.diameter;
		
		//maybe check if the node is already in a seeking state, don't change if so??
		if(!moveNode.SM.checkState("RETURNING")){
			moveNode.SM.changeState(immediate?"FOLLOWING":"SEEKING");
		}
		
		
	}
	
	node.index = index;
	node.targetOffset = node.index*node.ball.collider.diameter;
	this.nodeMap.set(index, node);
	this.maxIndex++;
	node.SM.changeState(fromDrag?"RETURNING":"FOLLOWING");
	
};


ZumaBoard.prototype.removeAt = function(index, immediate){
	
	immediate = immediate == undefined?false:immediate;
	//this.nodeMap.get(index).ball.destroy();
	var nodeRemoved = this.getNode(index);
	var nodeQueue = [];
	for(var i = index+1; i< this.maxIndex; i++){
		var node = this.getNode(i);

		node.index --;
		this.nodeMap.set(node.index, node);
		node.targetOffset = node.index * node.ball.collider.diameter;
		nodeQueue.push(node);
		
		
	}
	this.nodeMap["delete"](this.maxIndex-1);
	this.maxIndex--;
	nodeQueue.forEach(function(node){
		if(!node.SM.checkState("RETURNING")){
			if(immediate){
				node.SM.changeState("FOLLOWING");
				
			}else{
				node.SM.changeState("SEEKING");

				
			}
		}
		
	}, this);
	
	return nodeRemoved;
};

ZumaBoard.prototype.getNode = function(index){
	return this.nodeMap.get(index);
};

ZumaBoard.prototype.prepMergeSignal = function(node1, node2){
	node1.SM.states.DEAD.onEnter.add(function(){
		this.onMergeSignal.dispatch(node1, node2);
	}, this);

};


ZumaBoard.prototype.initNodeSM = function(node){

	
	//seeking
	var maxSeekVelocity = 600;
	var slowRadius = 100;
	node.SM.states.SEEKING.onEnter.add(function(){
		node.velocity = 0;
	}, this);
	node.SM.states.SEEKING.onUpdate.add(function(){
		//velocity setting (set depending on if it is to the left or right of the target)
		var distToTarget = Math.abs(node.currentOffset-node.targetOffset);
		node.velocity = Phaser.Math.linear(node.velocity, this.pathSpeed * 5, this.game.time.physicsElapsed*10);
		if(distToTarget<slowRadius){
			node.velocity = Phaser.Math.mapLinear(distToTarget, slowRadius, 0, this.pathSpeed * 5, this.pathSpeed*0.8);
		}
		
		node.currentOffset += Math.sign(node.targetOffset-node.currentOffset) * node.velocity * this.game.time.physicsElapsed;
		
		
		if(distToTarget<5){
			node.SM.changeState("FOLLOWING");
		}
		
		node.ball.f_debugText.setText(distToTarget);
		var targetLocation = this.getPositionOnPathDistance(this.distanceTraveled + node.currentOffset);
		node.ball.position.setTo(targetLocation.x, targetLocation.y);
	}.bind(this));
	
	//following
	
	
	
	node.SM.states.FOLLOWING.onEnter.add(function(data){
		node.prevState = data.prevState;
		node.currentOffset = node.targetOffset;
		var targetLocation = this.getPositionOnPathDistance(this.distanceTraveled + node.targetOffset);
		node.ball.position.setTo(targetLocation.x, targetLocation.y);
		
		
		if(node.pendingDestroy){
			return;
		}
		//same behind
		if(node.index-1 >= this.minIndex && this.nodeMap.get(node.index-1).sameBall(node) && !this.nodeMap.get(node.index-1).pendingDestroy){
			if(this.nodeMap.get(node.index-1).SM.checkState("FOLLOWING")){
				var destroyNeighbor = this.nodeMap.get(node.index-1);
				this.prepMergeSignal(node, this.nodeMap.get(node.index-1));
				
				this.setNodeToDestroy(node, data.init, false);
				this.setNodeToDestroy(destroyNeighbor, data.init, false);
			}
			
		}
		
		//same in front
		else if(node.index+1 < this.maxIndex && this.nodeMap.get(node.index+1).sameBall(node) && !this.nodeMap.get(node.index+1).pendingDestroy){
			if(this.nodeMap.get(node.index+1).SM.checkState("FOLLOWING")){
				var destroyNeighbor = this.nodeMap.get(node.index+1);
				this.prepMergeSignal(node, this.nodeMap.get(node.index+1));
				this.setNodeToDestroy(node, data.init, false);
				this.setNodeToDestroy(destroyNeighbor, data.init, false);
			}
			
		}
		
	}.bind(this));
	node.SM.states.FOLLOWING.onUpdate.add(function(){
		var targetLocation = this.getPositionOnPathDistance(this.distanceTraveled + node.targetOffset);
		node.ball.position.setTo(targetLocation.x, targetLocation.y);
		
	}.bind(this));
	
	
	//dragging
	node.ball.setClickCallback(function(){
		if(!node.interactive || Global.isSIP || node.pendingDestroy){
			return;
		}
		if(node.SM.checkState("FOLLOWING") || node.SM.checkState("SEEKING")){
			if(!this.dragNode){
				this.removeAt(node.index);
				node.SM.changeState("DRAGGING");
			}else{
				console.log("WHAT THE FUCK");
			}
			
		}
		
		
	}.bind(this));
	node.SM.states.DRAGGING.onEnter.add(function(){
		this.dragNode = node;
		this.dragParent.add(this.dragNode.ball);
		
	}.bind(this));
	node.SM.states.DRAGGING.onUpdate.add(function(){
		var targetLocation = this.getMousePos();
		targetLocation = Phaser.Point.interpolate(node.ball.position, targetLocation, this.game.time.physicsElapsed*20);
		node.ball.position.setTo(targetLocation.x, targetLocation.y);
		
	}.bind(this));
	
	//RETURNING
	node.SM.states.RETURNING.onEnter.add(function(){
		node.velocity = 0;
	}.bind(this));
	
	node.SM.states.RETURNING.onUpdate.add(function(){
		var endLoc = this.getPositionOnPathDistance(this.distanceTraveled + node.targetOffset);
		var distToTarget = Phaser.Point.distance(endLoc, node.ball.position);
		var moveVector = Phaser.Point.subtract(endLoc, node.ball.position).normalize();
		node.velocity = Phaser.Math.linear(node.velocity, maxSeekVelocity, this.game.time.physicsElapsed*10);
		if(distToTarget<slowRadius){
			
			node.velocity = Phaser.Math.mapLinear(distToTarget, slowRadius, 0, maxSeekVelocity, 10);
		}
		node.velocity = Math.min(node.velocity, Math.max(30, distToTarget));
		
		node.ball.position.x += moveVector.x * node.velocity * this.game.time.physicsElapsed*10;
		node.ball.position.y += moveVector.y * node.velocity *this.game.time.physicsElapsed*10;
		if(distToTarget<5){
			this.bubbleParent.add(node.ball);
			node.SM.changeState("FOLLOWING");
		}
		
	}.bind(this));
	
	
	node.SM.states.DEAD.onEnter.add(function(data){
		console.log("RIP");
		node.ball.destroy();
	}, this);
	
	
	this.afterNodeCreateSignal.dispatch(node);
	
	
};

ZumaBoard.prototype.setNodeToDestroy = function(node, immediate, fromDrag, inVortex){
	fromDrag = fromDrag==undefined?false:fromDrag;
	node.pendingDestroy = true;
	if(immediate){
		this.removeAt(node.index, true);
		
		node.SM.changeState("DEAD", {inVortex: inVortex});
		return;
	}
	node.ball.alpha =0.5;
	node.ball.destroyAnim(function(){
		if(!fromDrag){
			this.removeAt(node.index);
		}
		node.SM.changeState("DEAD", {inVortex: inVortex});
	}.bind(this), this);
	
}


ZumaBoard.prototype.getMousePos = function(){
	return new Phaser.Point(this.game.input.activePointer.x + Global.cameraOffsetX, this.game.input.activePointer.y + Global.cameraOffsetY);
};


ZumaBoard.prototype.initRunningState = function(){
	var RUNNING = this.SM.states.RUNNING;
	var dc = this.game.add.graphics(0,0);
	RUNNING.onUpdate.add(function(){
		dc.clear();
		this.distanceTraveled += this.pathSpeed*this.game.time.physicsElapsed;
		this.nodeMap.forEach(function(value, key){
			//saves a little runtime, don't update the balls that are not yet on the path
			if(value.currentOffset<-this.distanceTraveled){
				//i could instantiate the ball only when it is on the path??
				
				return;
			}
			if(value.currentOffset > -this.distanceTraveled + this.pathLength + 20 && !value.SM.checkState("RETURNING")){
				//it should be destroyed by this point
				value.ball.position.setTo(this.spiralPoints[this.spiralPoints.length-1].x, this.spiralPoints[this.spiralPoints.length-1].y);
				if(!value.pendingDestroy){
					this.setNodeToDestroy(value, true, false, true);
				}
				return;
			}			
			value.SM.onUpdate();
			//offset the collider to be a little behind. I found myself always clicking too far behind since the balls are moving
			var colliderPos = this.getPositionOnPathDistance(this.distanceTraveled + value.currentOffset - 10);
			value.ball.collider.x = colliderPos.x;
			value.ball.collider.y = colliderPos.y;
			if(!value.SM.checkState("SEEKING")){
				value.ball.f_debugText.setText(value.SM.currentState.name);

			}
			
		}, this);
		if(this.dragNode){
			this.dragNode.SM.onUpdate();
		}
	}, this);
};


ZumaBoard.prototype.getPositionOnPathTheta = function(theta){
	
	return new Phaser.Point(Phaser.Math.catmullRomInterpolation(this.spiralPoints.x, theta), Phaser.Math.catmullRomInterpolation(this.spiralPoints.y, theta));
};

ZumaBoard.prototype.getPositionOnPathDistance = function(distance){
	var theta = Phaser.Math.clamp(distance/this.pathLength, 0, 1);
	return this.getPositionOnPathTheta(theta);
};



