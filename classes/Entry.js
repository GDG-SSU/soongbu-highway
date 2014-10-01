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

	this._speedUpTimer = 0;

	this._genTimer = 0;
	this._player = undefined;

	this._enemies = [];
}

StateGame.prototype = new State();

StateGame.prototype.OnEnter = function () {
	State.prototype.OnEnter.call( this );

	var geometry = new THREE.CubeGeometry( 2, 4, 4 );
	var material = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.set( 0, 3, 0 );
	this._root.add( mesh );
	this._player = mesh;
	this._player.geometry.computeBoundingBox();
	this._player._speed = 10;

	var light = new THREE.PointLight( 0xFFFFFF );
	light.position.set( 0, 20, 0 );
	this._player.add( light );


	camera = new THREE.PerspectiveCamera(
		60, 
		window.innerWidth / window.innerHeight, 
		0.1, 
		1000);
	camera.position.set( 0, 6, -15 );
	camera.lookAt( this._player.position );
	this._player.add( camera );

	// create plane
	var planeGeometry = new THREE.CubeGeometry( 1000, 1, 1000 );
	var planeMaterial = new THREE.MeshLambertMaterial( { color: 0xaaaaaa } );
	var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
	this._player.add( planeMesh );
	planeMesh.position.y -= 5;
}

StateGame.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);

	this._player.position.z += this._player._speed * dt;

	this._speedUpTimer += dt;
	if( this._speedUpTimer > 0.2 ) {
		this._speedUpTimer = 0;
		this._player._speed = Math.max( 40, this._player._speed * 1.001 );
	}

	this._genTimer += dt;
	if( this._genTimer > 1.0 ) {
		this._genTimer = 0;

		this.CreateEnemy();
	}

	if( keyboard.pressed('left') ) {
		this._player.position.x += 10 * dt;
		this._player.position.x = Math.min( 30, this._player.position.x );
	}
	if( keyboard.pressed('right') ) {
		this._player.position.x += -10 * dt;
		this._player.position.x = Math.max( -30, this._player.position.x );
	}

	this.RemoveFarEnemy();
	this.CollisionCheck();
}

StateGame.prototype.CreateEnemy = function () {
	for( var i = 1; i <= 8; i ++ ) {
		var pos = this._player.position;
		var geometry = new THREE.CubeGeometry( THREE.Math.randFloat( 5, 10 ), 30, 1 );
		var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( pos.x + THREE.Math.randFloat( -20, 20 ), pos.y, pos.z + 150 );
		this._root.add( mesh );

		this._enemies.push( mesh );
		geometry.computeBoundingBox();
	}
}

StateGame.prototype.RemoveFarEnemy = function () {
	var removeList = [];

	var pz = this._player.position.z;
	for (var i = this._enemies.length - 1; i >= 0; i--) {
		var enemy = this._enemies[i];
		var ez = enemy.position.z;
		if( pz - ez > 100 ) {
			removeList.push( enemy );
		}
	};

	for (var i = removeList.length - 1; i >= 0; i--) {
		var obj = removeList[i];
		var index = this._enemies.indexOf( obj );
		this._enemies.splice( index, index );
	};
}

StateGame.prototype.CollisionCheck = function () {
	var playerBoundingBox = this._player.geometry.boundingBox.clone();
	playerBoundingBox.translate( this._player.position );
	for (var i = this._enemies.length - 1; i >= 0; i--) {
		var enemy = this._enemies[i];
		var boundingBox = enemy.geometry.boundingBox.clone();
		boundingBox.translate( enemy.position )
		if( playerBoundingBox.isIntersectionBox( boundingBox ) ) {
			this.GameOver();
		}
	};
}

StateGame.prototype.GameOver = function () {
	// stateManager.SetState("StateFirst");
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
	renderer.setSize(window.innerWidth - 10, window.innerHeight);
	document.body.appendChild(renderer.domElement);


	scene.add( new THREE.AmbientLight( 0x222222 ) );

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