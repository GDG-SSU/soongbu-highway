// define State class
function State () {
	this._stateName = "";
}

State.prototype = {
	OnEnter: function() {
		this._root = new THREE.Object3D();
		scene.add( this._root );
	},

	OnExit: function() {
		scene.remove( this._root );
	},

	Update: function(dt) {

	}
};


function StateFirst () {
	this._stateName = "StateFirst";
}

StateFirst.prototype = new State();

StateFirst.prototype.OnEnter = function () {
	State.prototype.OnEnter.call( this );

	var geometry = new THREE.CubeGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
	var mesh = new THREE.Mesh( geometry, material );
	this._root.add( mesh );
	this._cube = mesh;
}

StateFirst.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);
}


function StateGame () {
	this._stateName = "StateGame";

	this._genTimer = 0;
	this._player = undefined;
}

StateGame.prototype = new State();

StateGame.prototype.OnEnter = function () {
	State.prototype.OnEnter.call( this );

	var geometry = new THREE.CubeGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.set( 0, 3, 0 );
	this._root.add( mesh );
	this._player = mesh;

	var light = new THREE.PointLight( 0xFFFFFF );
	light.position.set( 0, 10, 0 );
	this._player.add( light );


	camera = new THREE.PerspectiveCamera(
		75, 
		window.innerWidth / window.innerHeight, 
		0.1, 
		1000);
	camera.position.set( 0, 5, -15 );
	camera.lookAt( this._player.position );
	this._player.add( camera );

	// create plane
	var planeGeometry = new THREE.CubeGeometry( 100, 1, 100 );
	var planeMaterial = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
	var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
	this._root.add( planeMesh );
}

StateGame.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);

	this._player.position.z += 5 * dt;

	this._genTimer += dt;
	if( this._genTimer > 3.0 ) {
		this._genTimer = 0;

		var pos = this._player.position;

		var geometry = new THREE.CubeGeometry( 3, 3, 3 );
		var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( pos.x + THREE.Math.randFloat( -10, 10 ), pos.y, pos.z + 20 );
		this._root.add( mesh );
	}
}



function StateManager() {
	var _curr = undefined;
}

StateManager.prototype = {
	SetState: function (state) {
		if( this._curr === undefined ) {
			var inst = this.InstantiateState(state);
			inst.OnEnter();

			this._curr = inst;
			return;
		}

		if( this._curr.stateName === state ) {
			return;
		}

		this._curr.OnExit();

		var inst = this.InstantiateState(state);
		inst.OnEnter();

		this._curr = inst;
	},

	InstantiateState: function (stateName) {
		var state;
		if( stateName === "StateFirst" ) {
			state = new StateFirst();
		}
		else if( stateName === "StateGame" ) {
			state = new StateGame();
		}

		return state;
	},

	Update: function (dt) {
		this._curr.Update( dt );
	}
};


var scene, camera, clock, renderer;

function Init () {
	scene = new THREE.Scene();
	camera = new THREE.PerspectiveCamera(
		75, 
		window.innerWidth / window.innerHeight, 
		0.1, 
		1000);
	camera.position.set( 15, 15, 15 );
	camera.lookAt( scene.position );

	renderer = new THREE.WebGLRenderer();
	renderer.setClearColor( 0xeeeeee, 1.0 ); // the default
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.body.appendChild(renderer.domElement);

	var light = new THREE.PointLight( 0xFFFF00 );
	light.position.set( 10, 10, 10 );
	scene.add( light );

	var light2 = new THREE.PointLight( 0xFFFF00 );
	light2.position.set( 0, 0, 0 );
	scene.add( light2 );


	clock = new THREE.Clock();
}

console.log( window.innerWidth + " " + window.innerHeight );

CreateAxis = function (scene) {
	scene.add( new THREE.AxisHelper(1000) );
}

ProcessKeyInput = function (keyboard) {
	if( keyboard.pressed("1") ) {
		stateManager.SetState("StateFirst");
	}
	else if( keyboard.pressed("2") ) {
		stateManager.SetState("StateGame");
	}
}


Init();
CreateAxis(scene);

var keyboard = new THREEx.KeyboardState();
var stateManager = new StateManager();
stateManager.SetState("StateGame");

var render = function () {
	requestAnimationFrame(render);

	ProcessKeyInput(keyboard);

	var dt = clock.getDelta();
	stateManager.Update( dt );

	renderer.render(scene, camera);
};

render();