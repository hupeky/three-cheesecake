class createGeom {
	initGeom () {
		let geomToAdd = [];
		var sphereGeometry = new THREE.SphereGeometry(2.5, 20, 20);
		var sphereMaterial = new THREE.MeshLambertMaterial({color: 0x7777ff});
		var sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);

		sphere.position.x = 5;
		sphere.position.y = 0;

		sphere.position.z = 5;
		sphere.name = 'sphere';

		sphere.updateMatrixWorld(  ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave
		sphere.updateMatrix( ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave
		geomToAdd.push(sphere);
		//sphere.updateMatrixWorld(  ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave
		//sphere.updateMatrix( ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave

		// create a cube
		var cubeGeometry = new THREE.BoxGeometry(4, 4, 4);
		var cubeMaterial = new THREE.MeshLambertMaterial({color: 0xff0000});
		var cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
		cube.castShadow = true;

		// position the cube
		cube.position.x = -5;
		cube.position.y = 0;
		cube.position.z = -5;
		cube.name = 'cube';

		cube.updateMatrixWorld(  ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave
		cube.updateMatrix( ); // NOTE very important to call after any dynamic objects are loaded, otherwise they dont behave
		geomToAdd.push(cube);

		return geomToAdd;
	}
}
export default createGeom;