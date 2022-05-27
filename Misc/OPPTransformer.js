/**
 *
 */
function OPPTransformer (_game, _sourceRect, _destPolygon) {
	this.sourceRect = _sourceRect;
	this.destPolygon = _destPolygon;
	
	this.game = _game;
	this.dc = this.game.add.graphics(0,0);
	var srcCorners = [this.sourceRect.left, this.sourceRect.top, this.sourceRect.right, this.sourceRect.top, 
	                   this.sourceRect.right, this.sourceRect.bottom, this.sourceRect.left, this.sourceRect.bottom];
	var dstCorners = this.destPolygon.toNumberArray();
	this.perspT = PerspT(srcCorners, dstCorners);
	
}


OPPTransformer.prototype.transform = function(x, y){
	
	if(x instanceof Phaser.Point){
		y = x.y;
		x = x.x;
		
	}
	var pointArr = this.perspT.transform(x, y);
	return new Phaser.Point(pointArr[0], pointArr[1]);
};


OPPTransformer.prototype.transformInverse = function(x, y){
	if(x instanceof Phaser.Point){
		y = x.y;
		x = x.x;
	}
	var pointArr = this.perspT.transformInverse(x, y);
	return new Phaser.Point(pointArr[0], pointArr[1]);
};

