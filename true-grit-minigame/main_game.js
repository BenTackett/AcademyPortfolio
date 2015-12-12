var start = function() {
	
	var Q = window.Q = Quintus({ development: true })
              .include("Sprites, Scenes, Input, 2D, Touch, UI")
              .setup({ maximize: true }).touch();

      Q.input.keyboardControls({
      	UP: "up",
      	DOWN: "down",
      	LEFT: "left",
      	RIGHT: "right",
      	32: "action"
      });
      Q.input.joypadControls();

      Q.gravityX = 0;
      Q.gravityY = 0;
      
      //entities
      Q.Sprite.extend("Player", {
      	init: function(p) {
      		this._super(p, {
      			//physics
      			acceleration: 2000,
      			reverseAccelerationMult: 0.33,
      			omegaDelta: 2000,
      			minOmegaDelta: 500,
      			velForMinOmegaDelta: 1500,
      			omega: 0,
      			velForMaxOmega: 350,
      			drag: 3,
      			minDrag: 1.3,
      			velForMinDrag: 1000,
      			omegaDrag: 12,
      			brakeForce: 6,
      			z: 100,
      			//assets
      			asset: "bike.png"
      		});
      		var p = this.p;
      		this.add("2d");
      	},
      	
      	step: function(dt) {
      		var p = this.p;
      		
      		//drag
      		var minDragMult = Math.min(1, (Math.max(Math.abs(p.vx), Math.abs(p.vy)) / p.velForMinDrag));
      		var drag = Math.lerp(p.drag, p.minDrag, minDragMult);
      		p.vx *= (1 - dt * drag);
      		p.vy *= (1 - dt * drag);
      		
      		//rotational velocity and drag
      		p.angle += p.omega * dt * Math.min(1, (Math.max(Math.abs(p.vx), Math.abs(p.vy)) / p.velForMaxOmega));
      		if(p.angle > 360) { p.angle -= 360; }
      		if(p.angle < 0) { p.angle += 360; }
      		p.omega *= (1 - dt * p.omegaDrag);
      		
      		//acceleration
      		var thrustX = 0;
      		var thrustY = 0;
      		
      		var omegaDeltaMult = 1;
      		
      		if(Q.inputs["action"]) {
      			var brakeForce = p.brakeForce - (minDragMult * p.brakeForce);
      			p.vx *= (1 - dt * brakeForce);
      			p.vy *= (1 - dt * brakeForce);
      		}
      		else if(Q.inputs["up"]) {
      			thrustX = Math.sin(p.angle * Math.PI / 180);
      			thrustY = -Math.cos(p.angle * Math.PI / 180);
      		}
      		else if(Q.inputs["down"]) {
      			thrustX = -Math.sin(p.angle * Math.PI / 180) * p.reverseAccelerationMult;
      			thrustY = Math.cos(p.angle * Math.PI / 180) * p.reverseAccelerationMult;
      			omegaDeltaMult = -0.75;
      		}
      		p.vx += thrustX * p.acceleration * dt;
      		p.vy += thrustY * p.acceleration * dt;
      		
      		//steering
      		var minOmegaDeltaMult = Math.min(1, (Math.max(Math.abs(p.vx), Math.abs(p.vy)) / p.velForMinOmegaDelta));
      		var omegaDelta = Math.lerp(p.omegaDelta, p.minOmegaDelta, minOmegaDeltaMult)
      		
      		if(Q.inputs["left"]) {
      			p.omega -= omegaDelta * dt * omegaDeltaMult;
      		}
      		if(Q.inputs["right"]) {
      			p.omega += omegaDelta * dt * omegaDeltaMult;
      		}
      	}
      });
      
      Q.Sprite.extend("Background", {
      	init: function(p) {
      		this._super(p, {
      			img: "backgroundImg",
      			imgElm: null,
      			img2: "backgroundImg2",
      			img2Elm: null,
      			img2Noise: null,
      			x: 0,
      			y: 0,
      			z: -100,
      			sizeX: 64,
      			sizeY: 64
      		});
      		var p = this.p;
      		p.imgElm = document.getElementById(p.img);
      		p.img2Elm = document.getElementById(p.img2);
      		
      		img2Noise = new PerlinNoise();
      	},
      	
      	draw: function(ctx) {
      		var p = this.p;
      		var stage = Q.stage();
      		var offsetX = Math.floor(stage.viewport.x / p.sizeX);
      		var offsetY = Math.floor(stage.viewport.y / p.sizeY);
      		var screenWidthInTiles = Math.floor(Q.width / p.sizeX);
      		var screenHeightInTiles = Math.floor(Q.height / p.sizeY);
      		var rand = Math.random();
      		for(var x = offsetX - 8; x < offsetX + screenWidthInTiles + 10; x++) {
      			for(var y = offsetY - 8; y < offsetY + screenHeightInTiles + 10; y++) {
      				var sizeX = (x * p.sizeX);
      				var sizeY = (y * p.sizeY);
      				var img = p.imgElm;
      				var noise = img2Noise.noise(x * 0.06, y * 0.06, 0);
      				if(noise <= -0.1) {
      					img = p.img2Elm;
      				}
      				ctx.drawImage(img, sizeX + offsetX, sizeY + offsetY, p.sizeX, p.sizeY);
      			}
      		}
      	}
      });
      
      //scenes
      Q.scene("level1",function(stage) {
      	//background
        stage.insert(new Q.Background());
      	
      	//player
        var player = stage.insert(new Q.Player({ x: Q.width/2, y: Q.height/2}));
        stage.add("viewport").follow(player, {x: true, y: true});
      });
      
      //loading assets
      Q.load("bike.png",function() {
    	Q.stageScene("level1");
      });
}

window.addEventListener("load", start);

//utility functions

//linearly interpolates between two values
Math.lerp = function(from, to, t) {
	return (1 - t) * from + t * to;
}

// Ported from Stefan Gustavson's java implementation
// http://staffwww.itn.liu.se/~stegu/simplexnoise/simplexnoise.pdf
// Read Stefan's excellent paper for details on how this code works.
//
// Sean McCullough banksean@gmail.com

/**
 * You can pass in a random number generator object if you like.
 * It is assumed to have a random() method.
 */
var PerlinNoise = function(r) { // Classic Perlin noise in 3D, for comparison
	if (r == undefined) r = Math;
  this.grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],
                                 [1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],
                                 [0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
  this.p = [];
  for (var i=0; i<256; i++) {
	  this.p[i] = Math.floor(r.random()*256);
  }
  // To remove the need for index wrapping, double the permutation table length
  this.perm = [];
  for(var i=0; i<512; i++) {
		this.perm[i]=this.p[i & 255];
  }
};

PerlinNoise.prototype.dot = function(g, x, y, z) {
    return g[0]*x + g[1]*y + g[2]*z;
};

PerlinNoise.prototype.mix = function(a, b, t) {
    return (1.0-t)*a + t*b;
};

PerlinNoise.prototype.fade = function(t) {
    return t*t*t*(t*(t*6.0-15.0)+10.0);
};

  // Classic Perlin noise, 3D version
PerlinNoise.prototype.noise = function(x, y, z) {
  // Find unit grid cell containing point
  var X = Math.floor(x);
  var Y = Math.floor(y);
  var Z = Math.floor(z);
  
  // Get relative xyz coordinates of point within that cell
  x = x - X;
  y = y - Y;
  z = z - Z;
  
  // Wrap the integer cells at 255 (smaller integer period can be introduced here)
  X = X & 255;
  Y = Y & 255;
  Z = Z & 255;
  
  // Calculate a set of eight hashed gradient indices
  var gi000 = this.perm[X+this.perm[Y+this.perm[Z]]] % 12;
  var gi001 = this.perm[X+this.perm[Y+this.perm[Z+1]]] % 12;
  var gi010 = this.perm[X+this.perm[Y+1+this.perm[Z]]] % 12;
  var gi011 = this.perm[X+this.perm[Y+1+this.perm[Z+1]]] % 12;
  var gi100 = this.perm[X+1+this.perm[Y+this.perm[Z]]] % 12;
  var gi101 = this.perm[X+1+this.perm[Y+this.perm[Z+1]]] % 12;
  var gi110 = this.perm[X+1+this.perm[Y+1+this.perm[Z]]] % 12;
  var gi111 = this.perm[X+1+this.perm[Y+1+this.perm[Z+1]]] % 12;
  
  // The gradients of each corner are now:
  // g000 = grad3[gi000];
  // g001 = grad3[gi001];
  // g010 = grad3[gi010];
  // g011 = grad3[gi011];
  // g100 = grad3[gi100];
  // g101 = grad3[gi101];
  // g110 = grad3[gi110];
  // g111 = grad3[gi111];
  // Calculate noise contributions from each of the eight corners
  var n000= this.dot(this.grad3[gi000], x, y, z);
  var n100= this.dot(this.grad3[gi100], x-1, y, z);
  var n010= this.dot(this.grad3[gi010], x, y-1, z);
  var n110= this.dot(this.grad3[gi110], x-1, y-1, z);
  var n001= this.dot(this.grad3[gi001], x, y, z-1);
  var n101= this.dot(this.grad3[gi101], x-1, y, z-1);
  var n011= this.dot(this.grad3[gi011], x, y-1, z-1);
  var n111= this.dot(this.grad3[gi111], x-1, y-1, z-1);
  // Compute the fade curve value for each of x, y, z
  var u = this.fade(x);
  var v = this.fade(y);
  var w = this.fade(z);
   // Interpolate along x the contributions from each of the corners
  var nx00 = this.mix(n000, n100, u);
  var nx01 = this.mix(n001, n101, u);
  var nx10 = this.mix(n010, n110, u);
  var nx11 = this.mix(n011, n111, u);
  // Interpolate the four results along y
  var nxy0 = this.mix(nx00, nx10, v);
  var nxy1 = this.mix(nx01, nx11, v);
  // Interpolate the two last results along z
  var nxyz = this.mix(nxy0, nxy1, w);

  return nxyz;
};