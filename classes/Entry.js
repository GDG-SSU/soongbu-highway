console.log( window.innerWidth + " " + window.innerHeight );

CreateAxis = function (scene) {
	var colors = [ 0xff0000, 0x00ff00, 0x0000ff ];
	var vectors = [
		new THREE.Vector3(-1000, 0, 0),
		new THREE.Vector3(1000, 0, 0),
		new THREE.Vector3(0, -1000, 0),
		new THREE.Vector3(0, 1000, 0),
		new THREE.Vector3(0, 0, -1000),
		new THREE.Vector3(0, 0, 1000)
	];

	for( var i = 0; i < colors.length; i ++ ) {
		var axisMaterial = new THREE.LineBasicMaterial({
			color: colors[i]
		});

		var axisGeometry = new THREE.Geometry();
		axisGeometry.vertices.push(vectors[i*2]);
		axisGeometry.vertices.push(vectors[i*2 + 1]);

		var line = new THREE.Line( axisGeometry, axisMaterial );
		scene.add( line );
	};
}

CreateCube = function (scene) {
	var geometry = new THREE.CubeGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
	var mesh = new THREE.Mesh( geometry, material );
	scene.add( mesh );

	return mesh;
}

var scene = new THREE.Scene();
var camera = new THREE.PerspectiveCamera(
	75, 
	window.innerWidth / window.innerHeight, 
	0.1, 
	1000);
camera.position.set( -15, 10, 5 );
camera.lookAt( scene.position );

var renderer = new THREE.WebGLRenderer();
renderer.setClearColor( 0xeeeeee, 1.0 ); // the default
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var light = new THREE.PointLight( 0xFFFF00 );
light.position.set( 10, 10, 10 );
scene.add( light );

CreateAxis( scene );
cube = CreateCube( scene );

var render = function () {
	requestAnimationFrame(render);

	cube.rotation.x += 0.01;
	cube.rotation.y += 0.02;
	cube.rotation.z += 0.03;

	renderer.render(scene, camera);
};

render();