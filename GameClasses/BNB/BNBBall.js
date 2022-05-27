
// -- user code here --

/* --- start generated code --- */

// Generated by  1.5.4 (Phaser v2.6.2)


/**
 * BNBBall.
 * @param {Phaser.Game} aGame A reference to the currently running game.
 * @param {Phaser.Group} aParent The parent Group (or other {@link DisplayObject}) that this group will be added to.    If undefined/unspecified the Group will be added to the {@link Phaser.Game#world Game World}; if null the Group will not be added to any parent.
 * @param {string} aName A name for this group. Not used internally but useful for debugging.
 * @param {boolean} aAddToStage If true this group will be added directly to the Game.Stage instead of Game.World.
 * @param {boolean} aEnableBody If true all Sprites created with {@link #create} or {@link #createMulitple} will have a physics body created on them. Change the body type with {@link #physicsBodyType}.
 * @param {number} aPhysicsBodyType The physics body type to use when physics bodies are automatically added. See {@link #physicsBodyType} for values.
 */
function BNBBall(aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType) {
	
	Phaser.Group.call(this, aGame, aParent, aName, aAddToStage, aEnableBody, aPhysicsBodyType);
	var __visual = this.game.add.sprite(0.0, 0.0, 'helperClassAtlas', 'ball.png', this);
	__visual.anchor.set(0.5, 0.5);
	
	
	
	// fields
	
	this.f_visual = __visual;
	
	this.afterCreate();
	
}

/** @type Phaser.Group */
var BNBBall_proto = Object.create(Phaser.Group.prototype);
BNBBall.prototype = BNBBall_proto;
BNBBall.prototype.constructor = BNBBall;

/* --- end generated code --- */
// -- user code here --


BNBBall.prototype.afterCreate = function(){
	this.doMove = true;
	this.isDummy = false;
	this.onHitBottom = new Phaser.Signal();
	this._2DPosition = new Phaser.Point();
};


BNBBall.prototype.initialize = function(radius, xPos, yPos){
	
	this.position.setTo(xPos, yPos);
	this.collider = new Phaser.Circle(this.x, this.y, radius);
	this.velocity = new Phaser.Point(0,0);
	this.f_visual.width = radius*2;
	this.f_visual.height = radius*2;
	this.moveHistory = [];
	
};

BNBBall.prototype.launch = function(velocity){
	this.velocity.setTo(velocity.x, velocity.y);
}

BNBBall.prototype.getModVelocityVector = function(deltaTime){
	return new Phaser.Point(this.velocity.x * deltaTime, this.velocity.y * deltaTime);
}

BNBBall.prototype.updatePosition = function(simX, simY, visX, visY){
	
	this._2DPosition.setTo(simX, simY);
	this.position.x = visX || simX;
	this.position.y = visY || simY;
	
	
	this.collider.x = this.position.x;
	this.collider.y = this.position.y;
};