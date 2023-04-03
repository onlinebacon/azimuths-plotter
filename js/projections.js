const toNormalFn = ([ lat, lon ]) => [ NaN, NaN ];
const toCoordFn = ([ nx, ny ]) => [ NaN, NaN ];
const calcNorthDirFn = ([ lat, lon ]) => NaN;

class Projection {
	constructor({
		name,
		imgSrc,
		ratio = 1,
		toNormal = toNormalFn,
		toCoord = toCoordFn,
		calcNorthDir = calcNorthDirFn,
	}) {
		this.name = name;
		this.ratio = ratio;
		this.toNormal = toNormal;
		this.toCoord = toCoord;
		this.calcNorthDir = calcNorthDir;
		this.img = document.createElement('img');
		this.imgLoaded = false;
		this.loadPromise = new Promise((done, fail) => {
			this.img.onload = () => {
				this.imgLoaded = false;
				done();
			};
			this.img.onerror = fail;
			this.img.src = imgSrc;
		});
	}
}

const projections = [
	new Projection({
		name: 'Azimuthal equidistant',
		imgSrc: 'img/ae-map.png',
		ratio: 1,
		toCoord: ([ nx, ny ]) => {
			const rad = Math.sqrt(nx*nx + ny*ny);
			if (rad > 1) return [ NaN, NaN ];
			const lat = (0.5 - rad)*Math.PI;
			if (rad === 0) return [ lat, 0 ];
			const tmp = Math.acos(-ny/rad);
			const lon = nx >= 0 ? tmp : -tmp;
			return [ lat, lon ];
		},
		toNormal: ([ lat, lon ]) => {
			const rad = 0.5 - lat/Math.PI;
			const nx = Math.sin(lon)*rad;
			const ny = -Math.cos(lon)*rad;
			return [ nx, ny ];
		},
		calcNorthDir: ([ lat, lon ]) => (Math.PI*2 - lon)%(Math.PI*2),
	}),
];

export default projections;
