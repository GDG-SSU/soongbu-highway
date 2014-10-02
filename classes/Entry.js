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

	var geometry = new THREE.BoxGeometry( 5, 5, 5 );
	var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
	var mesh = new THREE.Mesh( geometry, material );
	this._root.add( mesh );
	this._cube = mesh;
}

StateFirst.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);
}


var LINE_WIDTH = 10;

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

	var geometry = new THREE.BoxGeometry( 2, 4, 4 );
	var material = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.set( 0, 3, 0 );
	this._root.add( mesh );
	this._player = mesh;
	this._player.geometry.computeBoundingBox();
	this._player._speed = 20;

	var light = new THREE.PointLight( 0xFFFFFF, 2, 100 );
	light.position.set( 0, 20, 0 );
	this._player.add( light );


	camera = new THREE.PerspectiveCamera(
		75, 
		window.innerWidth / window.innerHeight, 
		1, 
		1000);
	this._player.add( camera );
	console.log( camera );
	var lookat = new THREE.Vector3( 0, -0.1, 1 );
	camera.lookAt( lookat );
	camera.position.set( 0, 5, 1 );


	// create floor
	var floor = new THREE.Object3D();
	this._root.add( floor );
	this._floor = floor;

	var floorTexture = new THREE.ImageUtils.loadTexture( 'resources/textures/floor_pattern.png' );
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 100, 100 );
	var planeGeometry = new THREE.PlaneGeometry( 1000, 1000 );
	var planeMaterial = new THREE.MeshPhongMaterial( { map: floorTexture, side: THREE.DoubleSide } );
	var planeMesh = new THREE.Mesh( planeGeometry, planeMaterial );
	planeMesh.rotateX( THREE.Math.degToRad( 90 ) );
	floor.add( planeMesh );


	var sidePlaneGeometry = new THREE.PlaneGeometry( 400, 1000 );
	var sidePlaneMaterial = new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide } );
	var sidePlaneMesh = new THREE.Mesh( sidePlaneGeometry, sidePlaneMaterial );
	sidePlaneMesh.position.y += 0.001;
	sidePlaneMesh.rotateX( THREE.Math.degToRad( 90 ) );
	var sidePlaneMesh2 = sidePlaneMesh.clone();
	sidePlaneMesh.position.x += -(200 + LINE_WIDTH * 1.5);
	sidePlaneMesh2.position.x += (200 + LINE_WIDTH * 1.5);
	floor.add( sidePlaneMesh );
	floor.add( sidePlaneMesh2 );
}

StateGame.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);

	var offset = this._player._speed * dt;
	this._player.position.z += offset;
	if( this._player.position.z - this._floor.position.z > 100 ) {
		this._floor.position.z += 100;
	}

	this._speedUpTimer += dt;
	if( this._speedUpTimer > 0.2 ) {
		this._speedUpTimer = 0;
		this._player._speed = Math.min( 40, this._player._speed * 1.001 );
	}

	this._genTimer += dt;
	if( this._genTimer > 1.0 ) {
		this._genTimer = 0;

		this.CreateEnemy();
	}

	if( keyboard.pressed('left') ) {
		this._player.position.x += 30 * dt;
		this._player.position.x = Math.min( LINE_WIDTH * 1.5, this._player.position.x );
	}
	if( keyboard.pressed('right') ) {
		this._player.position.x += -30 * dt;
		this._player.position.x = Math.max( -LINE_WIDTH * 1.5, this._player.position.x );
	}

	this.RemoveFarEnemy();
	this.CollisionCheck();
}

StateGame.prototype.CreateEnemy = function () {
	var line = [ 1, 1, 1 ];
	var blankLine = THREE.Math.randInt( 0, 2 );
	line[ blankLine ] = 0;

	for( var i = 0; i < line.length; i ++ ) {
		if( line[i] === 0 ) {
			continue;
		}

		var pos = this._player.position;
		var geometry = new THREE.BoxGeometry( LINE_WIDTH, 30, 1 );
		var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
		var mesh = new THREE.Mesh( geometry, material );
		mesh.position.set( (i - 1) * LINE_WIDTH, 15, pos.z + 200 );
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