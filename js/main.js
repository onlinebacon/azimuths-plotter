import { calcAzmAlt } from './math.js';
import projections from './projections.js';

const canvas = document.querySelector('canvas');
const ctx = canvas.getContext('2d');

let [ projection ] = projections;

let observer = [ NaN, NaN ];
let target = [ NaN, NaN ];

const arrowLen = 50;
const arrowTipLen = 10;
const zoom = {
	scale: 1,
	cx: canvas.width/2,
	cy: canvas.height/2,
};

const applyZoom = ([ x, y ]) => {
	const { width, height } = canvas;
	const { scale, cx, cy } = zoom;
	return [
		width/2 + (x - cx)*scale,
		height/2 + (y - cy)*scale,
	];
};

const reverseZoom = ([ x, y ]) => {
	const { width, height } = canvas;
	const { scale, cx, cy } = zoom;
	return [
		cx + (x - width/2)/scale,
		cy + (y - height/2)/scale,
	];
};

const toDeg = (rad) => rad*(180/Math.PI);

const coordIsValid = ([ lat, lon ]) => {
	return !isNaN(lat) && !isNaN(lon);
};

const stirngifyCoord = (coord) => {
	return coord.map(toDeg).map(val => Number(val.toFixed(6))).join(', ');
};

const projectCoord = (coord) => {
	const { width, height } = canvas;
	const [ nx, ny ] = projection.toNormal(coord);
	const pos = [ width*(1 + nx)/2, height*(1 - ny)/2 ];
	return applyZoom(pos);
};

const pixelToCoord = (pos) => {
	const { width, height } = canvas;
	const [ x, y ] = reverseZoom(pos);
	const coord = projection.toCoord([ x/width*2 - 1, 1 - y/height*2 ]);
	return coord;
};

const markCoord = (coord) => {
	const [ x, y ] = projectCoord(coord);
	ctx.fillStyle = '#000'
	ctx.beginPath();
	ctx.arc(x, y, 2, 0, Math.PI*2);
	ctx.fill();
	ctx.lineWidth = 1;
	ctx.strokeStyle = '#fff'
	ctx.beginPath();
	ctx.arc(x, y, 4, 0, Math.PI*2);
	ctx.stroke();
};

const plotAzmAlt = (coord, azm, alt) => {
	const [ ax, ay ] = projectCoord(coord);
	const dir = (projection.calcNorthDir(coord) + azm);
	const d1 = dir + Math.PI/8*7;
	const d2 = dir + Math.PI/8*9;
	const bx = ax + Math.sin(dir)*arrowLen;
	const by = ay - Math.cos(dir)*arrowLen;
	if (alt >= 0) {
		ctx.strokeStyle = '#fff';
	} else {
		ctx.strokeStyle = '#000';
	}
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(ax, ay);
	ctx.lineTo(bx, by);
	ctx.moveTo(bx + Math.sin(d1)*arrowTipLen, by - Math.cos(d1)*arrowTipLen);
	ctx.lineTo(bx, by);
	ctx.lineTo(bx + Math.sin(d2)*arrowTipLen, by - Math.cos(d2)*arrowTipLen);
	ctx.stroke();
};

const stirngifyAngle = (rad) => {
	return Number(toDeg(rad).toFixed(6)).toString();
};

const drawMap = () => {
	const { width, height } = canvas;
	const [ ax, ay ] = applyZoom([ 0, 0 ]);
	const [ bx, by ] = applyZoom([ width, height ]);
	ctx.drawImage(projection.img, ax, ay, bx - ax, by - ay);
};

const render = async () => {
	await projection.loadPromise;
	const { width, height } = canvas;
	ctx.fillStyle = '#888';
	ctx.fillRect(0, 0, width, height);
	drawMap();
	const lines = [];
	if (coordIsValid(target)) {
		lines.push('Target: ' + stirngifyCoord(target));
		markCoord(target);
	}
	if (coordIsValid(observer)) {
		lines.push('Observer: ' + stirngifyCoord(observer));
	}
	if (coordIsValid(target) && coordIsValid(observer)) {
		const [ azm, alt ] = calcAzmAlt(observer, target);
		plotAzmAlt(observer, azm, alt);
		lines.push('Azm: ' + stirngifyAngle(azm));
		lines.push('Alt: ' + stirngifyAngle(alt));
	}
	const lineHeight = 10;
	const lineSpace = 10;
	ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
	ctx.fillRect(0, 0, 280, lines.length*(lineHeight + lineSpace) + lineSpace);
	ctx.textBaseline = 'top';
	ctx.textAlign = 'left';
	ctx.font = 'bold 14px monospace';
	ctx.fillStyle = '#000';
	for (let i=0; i<lines.length; ++i) {
		const x = lineSpace;
		const y = lineSpace + (lineSpace + lineHeight)*i;
		ctx.fillText(lines[i], x, y);
	}
};

canvas.addEventListener('click', (e) => {
	const x = e.offsetX;
	const y = e.offsetY;
	target = pixelToCoord([ x, y ]);
	render();
});

canvas.addEventListener('mousemove', (e) => {
	const x = e.offsetX;
	const y = e.offsetY;
	observer = pixelToCoord([ x, y ]);
	render();
});

canvas.addEventListener('wheel', e => {
	const { width, height } = canvas;
	const { deltaY } = e;
	const sign = deltaY < 0 ? -1 : 1;
	const m = 1 - sign/10;
	const [ ax, ay ] = reverseZoom([ e.offsetX, e.offsetY ]);
	const [ bx, by ] = reverseZoom([ width/2, height/2 ]);
	const dx = bx - ax;
	const dy = by - ay;
	const cx = ax + dx/m;
	const cy = ay + dy/m;
	zoom.scale *= m;
	zoom.cx = cx;
	zoom.cy = cy;
	render();
});

render();
