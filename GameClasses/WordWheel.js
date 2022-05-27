/**
 * 
 * 
    var fontSizeConfig = {
		option: 100,
		builtWord: 64
	};
	
	var visualsConfig = {
		highlightColor: 0xffffff,
		strokeColor: 0xffffff,
		strokeThickness: 15,
		selectionRadius: 115,
		optionRadius: 80
	}
	
	var builtWordConfig = {
		
	}
 */

function WordWheel(_game, _backingSprite, _optionArray, _bitmapFont, _fontSizeConfig, _visualsConfig, _builtWordConfig){
	this.game = _game;
	this.backingSprite = _backingSprite;
	Phaser.Group.call(this, this.game, this.backingSprite.parent);

	this.backingSpriteBounds = new Phaser.Rectangle().copyFrom(this.backingSprite);
	this.backingSpriteBounds.centerOn(this.backingSprite.centerX, this.backingSprite.centerY);
	this.dc = this.game.add.graphics(0,0);
	this.dc.lineStyle(5, 0xff0000);
	
	this.optionArray = _optionArray;
	this.bitmapFont = _bitmapFont;
	//visuals
	this.highlightColor = _visualsConfig.highlightColor;
	this.stokeColor = _visualsConfig.strokeColor;
	this.strokeThickness = _visualsConfig.strokeThickness;
	this.selectionRadius = _visualsConfig.selectionRadius;
	this.optionRadius = _visualsConfig.optionRadius;
	
	this.optionFontSize = _fontSizeConfig.option;
	this.builtWordFontSize = _fontSizeConfig.builtWord;
	
	this.maxQueueSize = 5;
	
	
	
	this.backingSprite.parent.add(this);
	this.optionParent = this.game.add.group();
	this.graphicsParent = this.game.add.group();
	this.wheelGraphics = this.game.add.graphics(0,0);
	this.graphicsParent.add(this.wheelGraphics);
	
	this.add(this.backingSprite);
	this.add(this.graphicsParent);
	this.add(this.optionParent);
	console.log(this);
	
	this.add(this.dc);
	
	this.onWordSubmit = new Phaser.Signal();
	this.onSuccessfulClick = new Phaser.Signal();
	this.onWordSubmit.add(function(text){

	}, this);
	
	var createHalfCircle = function(isLeft){
		var g = this.game.add.graphics();
		g.beginFill(this.highlightColor);
	    g.arc(0, 0, this.builtWordFontSize + 20, isLeft?Math.PI/2:3*Math.PI/2, isLeft?3*Math.PI/2:Math.PI/2, false);
	    g.endFill();
		g.lineStyle(5, this.stokeColor);

		g.arc(0, 0, this.builtWordFontSize + 20, isLeft?Math.PI/2:3*Math.PI/2, isLeft?3*Math.PI/2:Math.PI/2, false);
	    
	    var t = g.generateTexture();

	    g.destroy();
	    return t;
	};
	var createCenter = function(){
		var g = this.game.add.graphics();
		g.beginFill(this.highlightColor);
		var helperRect = new Phaser.Rectangle(0,0, (this.builtWordFontSize + 20)*2, (this.builtWordFontSize + 20)*2);
		helperRect.centerOn(0,0);
	    g.drawShape(helperRect);
	    g.endFill();
		g.lineStyle(5, this.stokeColor);
		g.drawLine(new Phaser.Line(helperRect.topLeft.x, helperRect.topLeft.y, helperRect.topRight.x, helperRect.topRight.y));
		g.drawLine(new Phaser.Line(helperRect.bottomLeft.x, helperRect.bottomLeft.y, helperRect.bottomRight.x, helperRect.bottomRight.y));
	    var t = g.generateTexture();
	    g.destroy();
	    return t;
	};
	
	
	
	_builtWordConfig = _builtWordConfig==undefined?{}:_builtWordConfig;
	this.leftBuiltWordSprite = _builtWordConfig.left==undefined?createHalfCircle.call(this, true):_builtWordConfig.left;
	this.centerBuiltWordSprite = _builtWordConfig.center==undefined?createCenter.call(this):_builtWordConfig.center;
	this.rightBuiltWordSprite = _builtWordConfig.right==undefined?createHalfCircle.call(this, false):_builtWordConfig.right;
	
	
	this.builtWordObj = new WordWheelBuiltWord(this.game, this.leftBuiltWordSprite, this.centerBuiltWordSprite, this.rightBuiltWordSprite,
						this.bitmapFont, this.builtWordFontSize, 0xffffff, 
						new Phaser.Point(this.backingSpriteBounds.centerX, this.backingSpriteBounds.top - 50));
	
	this.SM = new StateMachine({
		IDLE: new State(),
		MOUSEDOWN: new State(),
		FEEDBACK: new State(),
		SHUFFLE: new State(),
	});
	
	this.selectionCircles = [];
	this.selectionCircleMap = new Map();
	
	this.initVisuals();
	this.initIdleState();
	this.initMouseDownState();
	this.initFeedbackState();
	this.initShuffleState();
	this.SM.changeState("IDLE");
	
	
	//this.shuffle();
	
}

WordWheel.prototype = Phaser.Group.prototype;
WordWheel.constructor = WordWheel;


WordWheel.prototype.onMouseDown = function(mousePos){
	if(this.SM.checkState("IDLE")){
		if(!this.getSelectionCircle(mousePos)){
			return;
		}
		
		this.SM.changeState("MOUSEDOWN");
	}
};

WordWheel.prototype.onMouseUp = function(){
	if(this.SM.checkState("MOUSEDOWN")){
		this.SM.changeState("FEEDBACK");
	}
};

function WordWheelOption(_game, _text, _bitmapFont, _fontSize, _fontColor, _parent, _collider, _backingColor){
	this.game = _game;
	this.text = _text;
	this.collider = _collider;
	this.backingColor = _backingColor;
	this.center = new Phaser.Point(this.collider.x, this.collider.y);
	this.selected = false;
	this.blockTouch = false;
	this.onAppear = new Phaser.Signal();
	this.onRemove = new Phaser.Signal();
	this.bitmapFont = _bitmapFont;
	this.fontSize = _fontSize;
	this.fontColor = _fontColor;
	this.group = this.game.add.group();
	this.bitmapText = new Phaser.BitmapText(this.game, 0, 0, this.bitmapFont, this.text, this.fontSize);
	this.bitmapText.anchor.setTo(0.5);
	this.bitmapText.tint = this.fontColor;
	this.parent = _parent;
	this.parent.add(this.group);
	this.visualBacking = this.game.add.sprite(0,0,"tile_" + this.text.toLowerCase());
	this.visualBacking.width = this.collider.diameter;
	this.visualBacking.height = this.collider.diameter;
	this.visualBacking.tint = this.backingColor;
	this.visualBacking.anchor.setTo(0.5);
	this.visualBacking.alpha= 0;
	//this.bitmapText.alpha = 0;
	this.group.add(this.visualBacking);
	this.group.position.setTo(this.center.x, this.center.y);
	this.group.add(this.bitmapText);
	
	this.group.resizeWithWidth(this.collider.diameter);
	
	this.onAppear.add(function(sc, queue){
		this.selected = true;
		//this.visualBacking.alpha = 1;
		this.bitmapText.tint = this.fontColor;
		
	}, this);
	this.onRemove.add(function(sc, queue){
		this.selected = false;
		//this.visualBacking.alpha = 0;
		this.bitmapText.tint = this.fontColor;
		
	}, this);
}

WordWheelOption.prototype.resetLetter = function(newLetter){
	this.bitmapText.text = newLetter;
	this.text = newLetter;
};

function WordWheelBuiltWord(_game, _leftSprite, _centerSprite, _rightSprite, _bitmapFont, _fontSize, _fontColor, _centerPos){
	this.game = _game;
	Phaser.Group.call(this, this.game);
	this.leftSprite = this.game.add.sprite(0,0, _leftSprite);
	this.leftSprite.anchor.setTo(1, 0.5);
	this.rightSprite = this.game.add.sprite(0,0, _rightSprite);
	this.rightSprite.anchor.setTo(0, 0.5);
	this.centerSprite = this.game.add.tileSprite(0,0, 0, this.leftSprite.height, _centerSprite);
	this.centerSprite.anchor.setTo(0.5);
	this.leftSprite.alpha = 0;
	this.rightSprite.alpha = 0;
	this.centerSprite.alpha = 0;
	this.centerPos = _centerPos;
	this.bitmapFont = _bitmapFont;
	this.fontSize = _fontSize;
	this.fontColor = _fontColor;
	this.position.setTo(this.centerPos.x, this.centerPos.y);
	this.add(this.leftSprite);
	this.add(this.rightSprite);
	this.add(this.centerSprite);
	
	
	this.textStack = [];
	this.builtWordText = new Phaser.BitmapText(this.game, 0, 0, this.bitmapFont, "", this.fontSize);
	this.builtWordText.tint = this.fontColor;
	this.builtWordText.anchor.setTo(0.5);
	this.add(this.builtWordText);
	
	this.dc = this.game.add.graphics(0,0);
	this.add(this.dc);
}

WordWheelBuiltWord.prototype = Phaser.Group.prototype;
WordWheelBuiltWord.constructor = WordWheelBuiltWord;

WordWheelBuiltWord.prototype.pushText = function(newText){
	this.textStack.push(newText);
	//this.game.add.sound("letter_select_0"+this.textStack.length.toString()).play();	
	if(this.textStack.length == 0){
		this.leftSprite.alpha = 1;
		this.rightSprite.alpha = 1;
		this.centerSprite.alpha = 1;
		this.centerSprite.width = 25;

	}
	
	
	this.updateVisual(this.textStack.join(''));
	
}
WordWheelBuiltWord.prototype.popText = function(newText){
	
	this.textStack.pop();
//	if(this.textStack.length==0){
//		return;
//	}
	
	if(this.textStack.length == 0){
		this.leftSprite.alpha = 0;
		this.rightSprite.alpha = 0;
		this.centerSprite.alpha = 0;
	}
	this.updateVisual(this.textStack.join(''));
};

WordWheelBuiltWord.prototype.updateVisual = function(text){
	
	this.dc.clear();
	this.dc.beginFill(0x00ffff);
	this.position.setTo(this.centerPos.x, this.centerPos.y);
	this.builtWordText.setText(text);
	
	this.leftSprite.position.setTo(this.builtWordText.left, 0);
	this.rightSprite.position.setTo(this.builtWordText.right, 0);
	this.centerSprite.width = (this.rightSprite.left - this.leftSprite.right);
};
WordWheelBuiltWord.prototype.getCurrentText = function(){
	var positions = [];
	var letters = [];
	var dc = this.game.add.graphics(0,0);
	dc.beginFill(0xff00ff);
	
	this.builtWordText.children.forEach(function(letter){
		var letterCenter = new Phaser.Point(letter.position.x + letter.width/2, letter.position.y+ letter.height/2);
		var worldPos = this.worldTransform.apply(letterCenter);
		worldPos.x+=Global.cameraOffsetX;
		worldPos.y+=Global.cameraOffsetY;
		positions.push(worldPos);
		letters.push(letter);
	}, this);
	
	return {text: this.textStack.join(''), positions: positions, letters: letters};
};

WordWheel.prototype.initVisuals = function(){
	
	//indexed based on radian
	for(var i = 0; i< this.optionArray.length; i++){
		var centerPos = new Phaser.Point(this.backingSpriteBounds.centerX + this.selectionRadius, this.backingSpriteBounds.centerY)
							.rotate(this.backingSpriteBounds.centerX, this.backingSpriteBounds.centerY, Phaser.Math.linear(0, Math.PI*2, i/this.optionArray.length) - Math.PI/2);
		
		var collider = new Phaser.Circle(centerPos.x, centerPos.y, this.optionArray[i] == "PO"?this.optionRadius/2:this.optionRadius);
		var newOption = new WordWheelOption(this.game, this.optionArray[i], this.bitmapFont, this.optionFontSize, 0x000000, this, collider, this.highlightColor);
		this.selectionCircles.push(newOption);
		this.selectionCircleMap.set(this.optionArray[i], newOption);
		this.optionParent.add(newOption.group);
		//this.dc.drawShape(collider);
	}
	
};




WordWheel.prototype.initIdleState = function(){

	
	this.SM.states.IDLE.onEnter.add(function(data){

	}, this);
	this.SM.states.IDLE.onExit.add(function(data){
		
	}, this);
	
};

WordWheel.prototype.getSelectionCircle = function(pos){
	for(var i = 0; i< this.selectionCircles.length; i++){
		if(this.selectionCircles[i].collider.contains(pos.x, pos.y)){
			if(!this.selectionCircles[i].blockTouch){
				return this.selectionCircles[i];
			}
			
		}
	}
	return false;
};

WordWheel.prototype.initMouseDownState = function(){
	
	this.selectionStack = [];
	this.lineStack = [];
	var currentLine = new Phaser.Line();
	

	this.selectionCircles.forEach(function(circle){
		circle.onAppear.add(function(_circle){
			this.builtWordObj.pushText(_circle.text);
		}, this);
		circle.onRemove.add(function(_circle){
			this.builtWordObj.popText();
		}, this);
	}, this);
	
	var proxyMouse = null;
	
	this.SM.states.MOUSEDOWN.onEnter.add(function(data){
		proxyMouse = data.proxyMouse;
		this.selectionStack = [];
		this.lineStack = [];
		this.builtWordObj.builtWordText.alpha = 1;
		this.builtWordObj.scale.setTo(1);
		this.builtWordObj.alpha=1;
		this.graphicsParent.alpha = 1;
		var mousePos = proxyMouse || new Phaser.Point(this.game.input.x + Global.cameraOffsetX, this.game.input.y + Global.cameraOffsetY);
		
		if(!this.getSelectionCircle(mousePos)){
			this.SM.changeState("IDLE");
			return;
		}
		this.onSuccessfulClick.dispatch();
	}, this);
	
	var playSound = function(){
		
		if(this.SM.checkState("HINT_MOUSEDOWN")){
			return;
		}
		if(this.selectionStack.length == 1){
			this.game.add.sound("match_1", 0.5).play();
		}else if(this.selectionStack.length == 2){
			this.game.add.sound("match_2", 0.5).play();
		}
		else{
			this.game.add.sound("match_3", 0.5).play();
		}
	};
	
	
	this.SM.states.MOUSEDOWN.onUpdate.add(function(data){
		
		var mousePos = proxyMouse || new Phaser.Point(this.game.input.x + Global.cameraOffsetX, this.game.input.y + Global.cameraOffsetY);
		var currentSelectionCircle = this.getSelectionCircle.call(this, mousePos);
		
		if(currentSelectionCircle){
			//new one
			if(!currentSelectionCircle.selected && this.selectionStack.length<this.maxQueueSize){
				
				this.selectionStack.push(currentSelectionCircle);
				if(this.selectionStack.length>1){
					this.lineStack.push(new Phaser.Line(this.selectionStack[this.selectionStack.length-2].center.x, this.selectionStack[this.selectionStack.length-2].center.y,
													this.selectionStack[this.selectionStack.length-1].center.x, this.selectionStack[this.selectionStack.length-1].center.y));
				};
				currentSelectionCircle.onAppear.dispatch(currentSelectionCircle, this.selectionStack);
				playSound.call(this);
			}
			//previous one
			else if(this.selectionStack.length>1 && this.selectionStack[this.selectionStack.length-2] == currentSelectionCircle){
				this.removePrevious();
			}
			
			
		}
		if(this.selectionStack.length<1){
			return;
		}
		currentLine.start = this.selectionStack[this.selectionStack.length-1].center;
		currentLine.end = mousePos;
		
		this.wheelGraphics.clear();
		this.wheelGraphics.lineStyle(this.strokeThickness, this.stokeColor);
		this.lineStack.forEach(function(line){
			this.wheelGraphics.drawLine(line);
		}, this);
		if(this.selectionStack.length<this.maxQueueSize){
			this.wheelGraphics.drawLine(currentLine);
		}
		

		
	}, this);
	
	this.SM.states.MOUSEDOWN.onExit.add(function(data){
		this.wheelGraphics.clear();
		
		
	}, this);
	
	
	
};

WordWheel.prototype.removePrevious = function(){
	this.lineStack.pop();
	var optionRemoved = this.selectionStack.pop();
	optionRemoved.onRemove.dispatch(optionRemoved, this.selectionStack);
	return optionRemoved;
};

WordWheel.prototype.initFeedbackState = function(){
	
	
	
	this.SM.states.FEEDBACK.onEnter.add(function(data){
		this.onWordSubmit.dispatch(this.builtWordObj.getCurrentText());
		this.SM.changeState("IDLE");
	}, this);
	
	this.SM.states.FEEDBACK.onUpdate.add(function(){
		this.wheelGraphics.clear();
		this.wheelGraphics.lineStyle(this.strokeThickness, this.stokeColor);
		this.lineStack.forEach(function(line){
			this.wheelGraphics.drawLine(line);
		}, this);
	}, this);
	
	this.SM.states.FEEDBACK.onExit.add(function(data){
		this.wheelGraphics.clear();
		this.selectionStack.forEach(function(circle){
			circle.onRemove.dispatch(circle, this.selectionStack);
		}, this);

	}, this);
	
};

WordWheel.prototype.shuffle = function(){
	
	if(this.SM.checkState("IDLE")){
		this.SM.changeState("SHUFFLE");
	}
};

WordWheel.prototype.initShuffleState = function(){

	
	this.SM.states.SHUFFLE.onEnter.add(function(data){
		console.log("shuffle entered");
		var availablePositions = [];
		for(var i = 0; i< this.selectionCircles.length; i++){
			availablePositions.push(this.selectionCircles[i].center.clone());
			if(this.selectionCircles[i].moveTween){
				this.selectionCircles[i].moveTween.stop();
			}
		}
		availablePositions = Phaser.ArrayUtils.shuffle(availablePositions);
		var moveTweens = [];
		for(var i = 0; i< this.selectionCircles.length; i++){
			var chosenCenter =availablePositions[i];
			this.selectionCircles[i].center = chosenCenter;
			this.selectionCircles[i].collider.setTo(chosenCenter.x, chosenCenter.y, this.selectionCircles[i].collider.diameter);
			
			this.selectionCircles[i].moveTween = this.game.add.tween(this.selectionCircles[i].group).to({x: chosenCenter.x, y: chosenCenter.y}, 200, Phaser.Easing.Sinusoidal.InOut, true);
			
			moveTweens.push(this.selectionCircles[i].moveTween);
		}
		
		
		
		
		moveTweens[moveTweens.length-1].onComplete.add(function(){
			this.SM.changeState("IDLE");
		}, this);
		
		
		
	}, this);
	this.SM.states.SHUFFLE.onExit.add(function(data){
		
	}, this);
	
};
