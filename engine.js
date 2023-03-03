// logic ////////////////////////////////////////////////////////

/*
	x, y, lx, ly,
	onDown, onUp, onMove
*/

var mouse = {
	down: false,
	x: 0, y: 0, lx: 0, ly: 0,
	offset: {x: 0, y: 0},
	
	onDown: null,
	_onMouseDown: function(e) {
		mouse.down = true;
		if (mouse.onDown) mouse.onDown(e);
	},
	
	onUp: null,
	_onMouseUp: function(e) {
		mouse.down = false;
		if (mouse.onUp) mouse.onUp(e);
	},
	
	onMove: null,
	_onMouseMove: function(e) {
		mouse.lx = mouse.x;
		mouse.ly = mouse.y;
		mouse.x = e.clientX + mouse.offset.x;
		mouse.y = e.clientY + mouse.offset.y;
		
		if (mouse.onMove) mouse.onMove(e);
	}
}

document.body.onmousedown = mouse._onMouseDown;
document.body.onmouseup = mouse._onMouseUp;
document.body.onmousemove = mouse._onMouseMove;

/*
	down[...],
	onDown, onUp
*/

var keys = {
	down: {},
	sayKey: false,
	
	onDown: null,
	_onKeyDown: function(e) {
		if (!keys.down[e.keyCode]) {
			if (keys.sayKey) console.log("pressed key:", e.keyCode);
			
			keys.down[e.keyCode] = true;
			if (keys.onDown) keys.onDown(e);
		} else {
			keys.down[e.keyCode] = true;
		}
	},
	
	onUp: null,
	_onKeyUp: function(e) {
		keys.down[e.keyCode] = false;
		if (keys.onUp) keys.onUp(e);
	}
}

document.body.onkeydown = keys._onKeyDown;
document.body.onkeyup = keys._onKeyUp;

// touch ////////////////////////////////////////////////////////

//touch events
document.body.addEventListener("touchstart", touchDown, false);
document.body.addEventListener("touchend", touchUp, false);
document.body.addEventListener("touchcancel", touchCancel, false);
document.body.addEventListener("touchmove", touchMove, false);

var ongoingTouches = [];

function touchDown(evt) {
	evt.preventDefault();
	
	var el = document.getElementsByTagName("canvas")[0];
	var ctx = el.getContext("2d");
	var touches = evt.changedTouches;
	
	for (var i = 0; i < touches.length; i++) {
		ongoingTouches.push(copyTouch(touches[i]));
	}
	
	mouse._onMouseMove({clientX: ongoingTouches[0].pageX, clientY: ongoingTouches[0].pageY});
	mouse._onMouseDown();
}

function touchMove(evt) {
	evt.preventDefault();
	
	var el = document.getElementsByTagName("canvas")[0];
	var ctx = el.getContext("2d");
	var touches = evt.changedTouches;

	for (var i=0; i<touches.length; i++) {
		var idx = ongoingTouchIndexById(touches[i].identifier);

		if (idx >= 0) ongoingTouches.splice(idx, 1, copyTouch(touches[i]));  // swap in the new touch record
		else log("can't figure out which touch to continue");
	}
	
	mouse._onMouseMove({clientX: ongoingTouches[0].pageX, clientY: ongoingTouches[0].pageY});
}

function touchUp(evt) {
	evt.preventDefault();
	
	mouse._onMouseMove({clientX: ongoingTouches[0].pageX, clientY: ongoingTouches[0].pageY});
	mouse._onMouseUp();
	mouse._onMouseMove({clientX: 0, clientY: 0});
	
	var el = document.getElementsByTagName("canvas")[0];
	var ctx = el.getContext("2d");
	var touches = evt.changedTouches;

	for (var i=0; i<touches.length; i++) {
		var idx = ongoingTouchIndexById(touches[i].identifier);

		if (idx >= 0) ongoingTouches.splice(idx, 1);  // remove it; we're done
		else log("can't figure out which touch to end");
	}
}

function touchCancel(evt) {
	evt.preventDefault();
	var touches = evt.changedTouches;

	for (var i = 0; i < touches.length; i++) {
		var idx = ongoingTouchIndexById(touches[i].identifier);
		ongoingTouches.splice(idx, 1);  // remove it; we're done
	}
	
	mouse._onMouseMove({clientX: ongoingTouches[0].pageX, clientY: ongoingTouches[0].pageY});
	mouse._onMouseUp();
	mouse._onMouseMove({clientX: 0, clientY: 0});
}

function copyTouch(touch) {
	return { identifier: touch.identifier, pageX: touch.pageX, pageY: touch.pageY };
}

function ongoingTouchIndexById(idToFind) {
	for (var i = 0; i < ongoingTouches.length; i++) {
		var id = ongoingTouches[i].identifier;
		if (id == idToFind) return i;
	}
	
	return -1;    // not found
}

var isMobile = false;
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
	isMobile = true;
}

// graphics /////////////////////////////////////////////////////

/*
	setCanvas,
	onFrame,
	
	clear,
	text,
	line,
	curve
	rect,
	circle,
	ring,
	poly,
	shape
*/

var draw = {
	backgroundColor: "#ffffff",
	canvas: null,
	ctx: null,
	SW: 0, SH: 0,
	x: 0, y: 0,
	
	setCanvas: function(_canvas, color="#ffffff", fillWindow=true) {
		draw.canvas = _canvas;
		draw.ctx = draw.canvas.getContext('2d');
		
		draw.backgroundColor = color;
		
		if (fillWindow) {
			draw.SW = draw.canvas.width = window.innerWidth;
			draw.SH = draw.canvas.height = window.innerHeight;
		} else {
			draw.SW = draw.canvas.width;
			draw.SH = draw.canvas.height;
		}
		
		draw.clear();
		requestAnimationFrame(draw._onFrame);
	},
	
	setSize: function(width, height) {
		draw.SW = draw.canvas.width = width;
		draw.SH = draw.canvas.height = height;
	},
	
	onFrame: null,
	_onFrame: function() {
		requestAnimationFrame(draw._onFrame);
		
		if (draw.onFrame) draw.onFrame();
	},
	
	clear: function() {
		draw.ctx.beginPath();
		draw.ctx.rect(0, 0, draw.SW, draw.SH);
		draw.ctx.fillStyle = draw.backgroundColor;
		draw.ctx.fill();
	},
	
	lastTextWidth: 0,
	text: function(x, y, str, clr="#000000", alnX=0, alnY=0, font="16px Monospace", rotation=0) {
		draw.ctx.save();
		draw.ctx.translate(draw.x + x, draw.y + y);
		draw.ctx.rotate(rotation*Math.PI/180);
		
		draw.ctx.font = font;
		draw.ctx.textAlign = ["right","center","left"][alnX+1];
		draw.ctx.textBaseline = ["bottom","middle","top"][alnY+1];
		draw.ctx.fillStyle = clr;
		draw.lastTextWidth = draw.ctx.measureText(str).width;
		draw.ctx.fillText(str, 0, 0);
		
		draw.ctx.restore();
	},
	
	getTextWidth: function(text, style="16px Monospace") {
		draw.ctx.font = style;
		return draw.ctx.measureText(text).width;
	},
	
	line: function(x1, y1, x2, y2, clr="#000000", sz=1) {
		draw.ctx.beginPath();
		draw.ctx.moveTo(draw.x + x1, draw.y + y1);
		draw.ctx.lineTo(draw.x + x2, draw.y + y2);
		draw.ctx.strokeStyle = clr;
		draw.ctx.lineWidth = sz;
		draw.ctx.stroke();
		draw.ctx.lineWidth = 1;
	},
	
	curve: function(x1, y1, x2, y2, x3, y3, clr, sz=1) {
		draw.ctx.beginPath();
		draw.ctx.moveTo(draw.x + x1, draw.y + y1);
		draw.ctx.quadraticCurveTo(draw.x + x2, draw.y + y2, draw.x + x3, draw.y + y3);
		draw.ctx.strokeStyle = clr;
		draw.ctx.lineWidth = sz;
		draw.ctx.stroke();
		draw.ctx.lineWidth = 1;
	},
	
	rect: function(x, y, w, h, c="#000000") {
		draw.ctx.beginPath();
		draw.ctx.rect(draw.x + x, draw.y + y, w, h);
		draw.ctx.fillStyle = c;
		draw.ctx.fill();
	},
	
	circle: function(x, y, r, clr="#000000") {
		draw.ctx.beginPath();
		draw.ctx.arc(draw.x + x, draw.y + y, r, 0, 2*Math.PI, false);
		draw.ctx.fillStyle = clr;
		draw.ctx.fill();
	},
	
	ring: function(x, y, r, clr="#000000", sz=1) {
		draw.ctx.beginPath();
		draw.ctx.arc(draw.x + x, draw.y + y, r, 0, 2*Math.PI, false);
		draw.ctx.strokeStyle = clr;
		draw.ctx.lineWidth = sz;
		draw.ctx.stroke();
		draw.ctx.lineWidth = 1;
	},
	
	poly: function(poly, clr="#000000") {
		draw.ctx.beginPath();
		
		var p = poly[poly.length-1];
		draw.ctx.moveTo(draw.x + p.x, draw.y + p.y);
		for (var n=0; n<poly.length; n++) {
			p = poly[n];
			draw.ctx.lineTo(draw.x + p.x, draw.y + p.y);
		}
		
		draw.ctx.fillStyle = clr;
		draw.ctx.fill();
	},
	
	shape: function(x, y, sz, p, clr="#000000", thickness=1, drawpoints=true) {
		var pts = [];
		
		var off = (p%2)*.25;
		for (var n=0; n<p; n++) {
			pts.push(vec.new(
				x + sz*Math.cos(Math.PI*2*(off + n/p)),
				y + sz*Math.sin(Math.PI*2*(off + n/p))
			));
		}
		
		var ln = p-1;
		for (var n=0; n<p; n++) {
			if (drawpoints) {
				var xd = pts[n].x - pts[ln].x;
				var yd = pts[n].y - pts[ln].y;
				var pt = vec.new(
					pts[ln].x + xd*.5 + yd*Math.sqrt(3)*.5,
					pts[ln].y + yd*.5 - xd*Math.sqrt(3)*.5
				);
				
				drawLine(pt.x, pt.y, pts[ln].x, pts[ln].y, clr, thickness);
				drawLine(pts[n].x, pts[n].y, pt.x, pt.y, clr, thickness);
			} else {
				drawLine(pts[n].x, pts[n].y, pts[ln].x, pts[ln].y, clr, thickness);
			}
			
			ln = n;
		}
	},
	
	image: function(img) {
		draw.ctx.drawImage(img, 0, 0);
	},
	
	saveCanvas: function(filename="untitled.png") {
		var link = document.createElement("a");
	    document.body.appendChild(link); // for Firefox
	    link.setAttribute("href", canvas.toDataURL());
	    link.setAttribute("download", fileName);
	    link.click();
	}
}

// bitmaps //////////////////////////////////////////////////////

function Bitmap(target, w=-1, h=-1) {
	if (w == -1) w = target.width;
	if (h == -1) h = target.height;
	
	var ctx = target.getContext('2d');
	
	this.width = w;
	this.height = w;
	this.target = target.getContext('2d');
	this.src = this.target.getImageData(0, 0, w, h);
	this.data = this.src.data;
	
	this.getData = function() {
		this.src = this.target.getImageData(0, 0, this.width, this.height);
		this.data = this.src.data;
	}
	
	this.update = function() {
		this.target.putImageData(this.src, 0, 0);
	}
	
	this.getPixel = function(x, y) {
		var i = (y*this.width + x) << 2;
		return {
			r: this.data[i] / 255,
			g: this.data[i+1] / 255,
			b: this.data[i+2] / 255,
			a: this.data[i+3] / 255
		};
	}
	
	this.setPixel = function(x, y, r, g, b, a) {
		var i = (y*this.width + x) << 2;
		
		this.data[i] = r*255;
		this.data[i+1] = g*255;
		this.data[i+2] = b*255;
		this.data[i+3] = a*255;
	}
	
	this.setPixelR = function(x, y, r) { this.data[((y*this.width + x) << 2)] = r*255; }
	this.setPixelG = function(x, y, g) { this.data[((y*this.width + x) << 2) + 1] = g*255; }
	this.setPixelB = function(x, y, b) { this.data[((y*this.width + x) << 2) + 2] = b*255; }
	this.setPixelA = function(x, y, a) { this.data[((y*this.width + x) << 2) + 3] = a*255; }
}

// vector math //////////////////////////////////////////////////

var vec = {
	new: function(_x=0, _y=0) {
		return {x: _x, y: _y};
	},
	
	fromPoints: function(p1, p2) {
		return {x: p2.x - p1.x, y: p2.y - p1.y};
	},
	
	random: function(w=1, h=1) {
		return vec.new(Math.random()*w, Math.random()*h);
	},
	
	dot: function(v1, v2) {
		return v1.x*v2.x + v1.y*v2.y;
	},
	
	perpLeft: function(v) {
		return {x: -v.y, y: v.x};
	},
	
	perpRight: function(v) {
		return {x: v.y, y: -v.x};
	},
	
	dist: function(v1, v2) {
		var xd = v2.x - v1.x;
		var yd = v2.y - v1.y;
		return Math.sqrt(xd*xd + yd*yd);
	},
	
	distSQ: function(v1, v2) {
		var xd = v2.x - v1.x;
		var yd = v2.y - v1.y;
		return xd*xd + yd*yd;
	},
	
	magnitude: function(v) {
		return Math.sqrt(v.x*v.x + v.y*v.y);
	},
	
	normalize: function(v) {
		var m = 1 / vec.magnitude(v);
		return {x: v.x*m, y: v.y*m};
	},
	
	perpOnLine: function(p, l1, l2, segment=true) {
		var oDir = vec.fromPoints(l1, l2);
		var dir = vec.normalize(oDir);
		var d = vec.dot(vec.fromPoints(l1, p), dir);
		var p0 = {
			x: l1.x + d*dir.x,
			y: l1.y + d*dir.y
		};
		
		if (!segment) return p0;
		
		var t = Math.abs(oDir.x) > Math.abs(oDir.y) ? (p0.x - l1.x) / oDir.x : (p0.y - l1.y) / oDir.y;
		if (t < 0) return l1;
		if (t > 1) return l2;
		return p0;
	},
	
	lineSect: function(p1, p2, p3, p4) {
		if (p1.x == p2.x) p1.x += .00001;
		if (p3.x == p4.x) p3.x += .00001;
		
		var a1 = p2.y - p1.y;
		var b1 = p1.x - p2.x;
		var c1 = a1*p1.x + b1*p1.y;
		
		var a2 = p4.y - p3.y;
		var b2 = p3.x - p4.x;
		var c2 = a2*p3.x + b2*p3.y;
		
		var d = a1*b2 - a2*b1;
		if (d == 0) return null;
		
		var x = (b2*c1 - b1*c2) / d;
		var y = (a1*c2 - a2*c1) / d;
		var t = (x - p1.x) / -b1;
		var s = (x - p3.x) / -b2;
		
		if (t > 0 && t < 1 && s > 0 && s < 1) return vec.new(p1.x + a1*t, p1.y - b1*t);
		else return null;
	},
	
	inPoly: function(p, poly) {
		var c = 0;
		var op = points[poly[poly.length - 1]];
		for (var n=0; n<poly.length; n++) {
			var np = points[poly[n]];
			
			if ((p.y < np.y) != (p.y < op.y)) {
				var xa = op.x + (np.x - op.x)*(p.y - op.y)/(np.y - op.y);
				if (xa < p.x) c++;
			}
			
			op = np;
		}
		
		return (c % 2) == 1;
	}
}

// math /////////////////////////////////////////////////////////

var rand = {
	bool: function(p=.5) {
		return Math.random() < p;
	},
	
	int: function(low=0, high=Number.MAX_SAFE_INTEGER) {
		return Math.floor(low + Math.random()*(high-low));
	},
	
	float: function(low=0, high=Number.MAX_VALUE) {
		var a = Math.random();
		return low*a + high*(1-a);
	},
	
	direction: function() {
		var a = rand.float(0, Math.PI*2);
		return vec.new(Math.cos(a), Math.sin(a));
	},
	
	vector: function(w=1, h=1) {
		return vec.random(w, h);
	},
	
	letter: function(str="qwertyuioplkjhgfdsazxcvbnmQWERTYUIOPLKJHGFDSAZXCVBNM") {
		return c = str[rand.int(0, str.length)];
	},
	
	color: function() {
		var str = "#";
		while (str.length < 7) str += rand.letter("0123456789abcdef");
		return str
	}
}

var fqBase = 2**(1/12);

var calc = {
	noteFQ: function(n) {
		return 440*(fqBase**n);
	}
}

// color ////////////////////////////////////////////////////////

function Color(R=1, G=1, B=1) {
	if (R*0 == 0) {
		this.r = R;
		this.g = G;
		this.b = B;
	} else if (isString(R)) {
		var clr = parseInt(R.substring(1), 16);
		this.r = ((clr >> 16) & 255) / 255;
		this.g = ((clr >> 8) & 255) / 255;
		this.b = (clr & 255) / 255;
	} else {
		this.r = 1;
		this.g = 1;
		this.b = 1;
	}
	
	this.setRGB = function(_R, _G, _B) {
		r = _R;
		g = _G;
		b = _B;
	};
	
	this.mix = function(C2, p=.5) {
		var C1 = this.getHSL();
		C2 = C2.getHSL();
		
		C1.h = C1.h*(1 - p) + C2.h*p;
		C1.s = C1.s*(1 - p) + C2.s*p;
		C1.l = C1.l*(1 - p) + C2.l*p;
		
		this.setHSL(C1.h, C1.s, C1.l);
	}
	
	this.bezierMix = function(C2, C3, p=.5) {
		var C1 = this.getHSL();
		C2 = C2.getHSL();
		C3 = C3.getHSL();
		
		var ip = 1 - p;
		C1.h = (C1.h*ip + C2.h*p)*ip + (C2.h*ip + C3.h*p)*p;
		C1.s = (C1.s*ip + C2.s*p)*ip + (C2.s*ip + C3.s*p)*p;
		C1.l = (C1.l*ip + C2.l*p)*ip + (C2.l*ip + C3.l*p)*p;
		
		this.setHSL(C1.h, C1.s, C1.l);
	}
	
	this.getHex = function() {
		var clr = (((this.r*255)|0) << 16) | (((this.g*255)|0) << 8) | ((this.b*255)|0);
		clr = clr.toString(16);
		while (clr.length < 6) clr = "0" + clr;
		return "#" + clr;
	};
	
	this.setHex = function(hex) {
		var clr = parseInt(hex, 16);
		this.r = ((clr >> 16) & 255) / 255;
		this.g = ((clr >> 8) & 255) / 255;
		this.b = (clr & 255) / 255;
	};
	
	this.getHSL = function() {
		let cmin = Math.min(this.r, this.g, this.b),
			cmax = Math.max(this.r, this.g, this.b),
			delta = cmax - cmin,
			_h = 0,
			_s = 0,
			_l = 0;
		
		if (delta == 0) _h = 0;
		else if (cmax == r) _h = ((g - b) / delta) % 6;
		else if (cmax == g) _h = (b - r) / delta + 2;
		else _h = (r - g) / delta + 4;
		
		_h = Math.round(_h*60);
		
		if (_h < 0) _h += 360;
		
		_l = (cmax + cmin) / 2;
		_s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * _l - 1));

		return {h: _h, s: _s, l: _l};
	};
	
	this.setHSL = function(H, S, L) {
		let c = (1 - Math.abs(2 * L - 1)) * S,
			x = c * (1 - Math.abs((H / 60) % 2 - 1)),
			m = L - c/2,
			R = 0,
			G = 0,
			B = 0;
		
		if (0 <= H && H < 60) { R = c; G = x; B = 0; }
		else if (60 <= H && H < 120) { R = x; G = c; B = 0; }
		else if (120 <= H && H < 180) { R = 0; G = c; B = x; }
		else if (180 <= H && H < 240) { R = 0; G = x; B = c; }
		else if (240 <= H && H < 300) { R = x; G = 0; B = c; }
		else if (300 <= H && H < 360) { R = c; G = 0; B = x; }
		
		this.r = (R + m);
		this.g = (G + m);
		this.b = (B + m);
	}
}

function isString(x) {
	return Object.prototype.toString.call(x) === "[object String]";
}

Color.prototype.toString = function () { return this.getHex(); };
Color.prototype.valueOf = function () { return this.getHex(); };