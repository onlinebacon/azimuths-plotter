export const normalize = ([ x, y, z ]) => {
	const len = Math.sqrt(x*x + y*y + z*z);
	return [ x/len, y/len, z/len ];
};

export const rotateVecX = ([ x, y, z ], angle) => {
	const s = Math.sin(angle);
	const c = Math.cos(angle);
	return [ x, y*c + z*s, z*c - y*s ];
};

export const rotateVecY = ([ x, y, z ], angle) => {
	const s = Math.sin(angle);
	const c = Math.cos(angle);
	return [ x*c - z*s, y, z*c + x*s ];
};

export const coordToVec = ([ lat, lon ]) => {
	const coslat = Math.cos(lat);
	return [
		Math.sin(lon)*coslat,
		Math.sin(lat),
		Math.cos(lon)*coslat,
	];
};

export const calcUnsignedAngle = (a, o) => {
	const len = Math.sqrt(a*a + o*o);
	if (len === 0) return 0;
	const temp = Math.acos(a/len);
	return o >= 0 ? temp : Math.PI*2 - temp;
};

export const calcAzmAlt = ([ aLat, aLon ], b) => {
	let vec = coordToVec(b);
	vec = rotateVecY(vec, aLon);
	vec = rotateVecX(vec, -aLat);
	vec = normalize(vec);
	const [ x, y, z ] = vec;
	const azm = calcUnsignedAngle(y, x);
	const alt = Math.asin(z);
	return [ azm, alt ];
};
