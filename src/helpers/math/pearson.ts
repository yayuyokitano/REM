import isNumber from 'is-number';

export default function calculatePearson(arr1:number[], arr2:number[]) {
	if (arr1.length !== arr2.length) {
		throw "Lengths are not equal.";
	}

	let epsilonX = 0;
	let epsilonY = 0;
	let epsilonXY = 0;
	let SSX = 0;
	let SSY = 0;
	let n = arr1.length;

	for (let i = 0; i < arr1.length; i++) {

		let x = arr1[i];
		let y = arr2[i];

		if (!isNumber(x) || !isNumber(y)) {
			throw "Arrays are not exclusively numbers";
		}

		x = Number(x);
		y = Number(y);

		epsilonX += x;
		epsilonY += y;
		epsilonXY += x * y;
		SSX += x ** 2;
		SSY += y ** 2;

	}

	return (n * epsilonXY - epsilonX * epsilonY) / Math.sqrt((n * SSX - epsilonX ** 2) * (n * SSY - epsilonY ** 2));

}