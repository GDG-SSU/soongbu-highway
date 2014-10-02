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
var ENEMY_BLANK = 0;
var ENEMY_WALL = 1;
var ENEMY_BURSTER = 2;

function StateGame () {
	this._stateName = "StateGame";

	this._speedUpTimer = 0;

	this._itemGenTimer = 0;
	this._genTimer = 0;
	this._player = undefined;

	this._enemies = [];
	this._items = [];
}

StateGame.prototype = new State();

StateGame.prototype.OnEnter = function () {
	State.prototype.OnEnter.call( this );

	this.CreateMap();
	this.CreatePlayer();
}

StateGame.prototype.Update = function (dt) {
	State.prototype.Update.call(this, dt);

	TWEEN.update();

	// move floor and adjust position of that
	var offset = this._player._speed * dt;
	this._player.position.z += offset;
	if( this._player.position.z - this._floor.position.z > 100 ) {
		this._floor.position.z += 100;
	}

	// leveling
	this._speedUpTimer += dt;
	if( this._speedUpTimer > 0.2 ) {
		this._speedUpTimer = 0;
		this._player._speed = Math.min( 60, this._player._speed * 1.001 );
	}

	// create enemy each time
	this._genTimer += dt;
	if( this._genTimer > 2.0 ) {
		this._genTimer = 0;

		this.CreateEnemy();
	}

	this._itemGenTimer += dt;
	if( this._itemGenTimer > 1.0 ) {
		this._itemGenTimer = 0;
		this.CreateItem();
	}

	this.ProcessInput(dt);
	this.RemoveFarObject();
	this.CollisionCheck();
}

StateGame.prototype.CreateMap = function () {
	// create floor
	var floor = new THREE.Object3D();
	this._root.add( floor );
	this._floor = floor;

	var floorTexture = new THREE.ImageUtils.loadTexture( 'resources/textures/floor_light.png' );
	floorTexture.wrapS = THREE.RepeatWrapping;
	floorTexture.wrapT = THREE.RepeatWrapping;
	floorTexture.repeat.set( 1, 10 );
	var geometry = new THREE.PlaneGeometry( 30, 1000 );
	var material = new THREE.MeshBasicMaterial( {map: floorTexture, side: THREE.DoubleSide, transparent: true, overdraw: true} );
	var plane = new THREE.Mesh( geometry, material );
	plane.rotateX(THREE.Math.degToRad(90));

	floor.add( plane );

	var sideTexture = new THREE.ImageUtils.loadTexture( 'resources/textures/wall_direction.png' );
	sideTexture.wrapS = THREE.RepeatWrapping;
	sideTexture.wrapT = THREE.RepeatWrapping;
	sideTexture.repeat.set( 1, 100 );
	geometry = new THREE.PlaneGeometry( 5, 1000 );
	material = new THREE.MeshPhongMaterial( { map: sideTexture, side: THREE.DoubleSide, transparent: true, overdraw: true } );
	side = new THREE.Mesh( geometry, material );
	side.rotateX(THREE.Math.degToRad(90));

	side.rotateY(THREE.Math.degToRad(90));
	side.position.y = 5;
	side.position.x = 15;
	floor.add(side);

	var side2 = side.clone();
	side2.position.x = -15;
	floor.add(side2);
}

StateGame.prototype.CreatePlayer = function () {
	var geometry = new THREE.BoxGeometry( 2, 4, 4 );
	var material = new THREE.MeshLambertMaterial( { color: 0x00FF00 } );
	var mesh = new THREE.Mesh( geometry, material );
	mesh.position.set( 0, 2, 0 );
	this._root.add( mesh );
	this._player = mesh;
	this._player.geometry.computeBoundingBox();
	this._player._speed = 40;

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
	camera.position.set( 0, 10, -20 );
}

StateGame.prototype.CreateEnemy = function () {
	// make sure that create enemy each type
	var lineArr = [ -1, -1, -1 ];
	var type = lineArr.length - 1;
	while (true) {
		var line = THREE.Math.randInt( 0, 2 );
		if( lineArr[line] === -1 ) {
			lineArr[line] = type;
			type--;
		}

		var count = 0;
		for( var i = 0; i < lineArr.length; i ++ ) {
			if( lineArr[i] === -1 ) {
				count ++;
			}
		}

		if( count === 0 ) {
			break;
		}
	}

	// now create enemy!
	for( var i = 0; i < lineArr.length; i ++ ) {
		if( lineArr[i] === 0 ) {
			continue;
		}

		var pos = this._player.position;
		var geometry = new THREE.BoxGeometry( LINE_WIDTH, 30, 1 );
		var material = new THREE.MeshLambertMaterial( { color: 0xFF0000 } );
		var enemy = new THREE.Mesh( geometry, material );
		enemy.position.set( (i - 1) * LINE_WIDTH, 15, pos.z + 200 );
		this._root.add( enemy );
		enemy._type = lineArr[i];

		if( lineArr[i] === ENEMY_BURSTER ) {
			// below code should be changed.... in later....
			enemy.position.y = -25;
			enemy.Burst = function (enemy) {
				var newPos = enemy.position.clone();
				newPos.y += 40;

				var tween = new TWEEN.Tween( enemy.position )
					.to( newPos, 1000 )
					.easing( TWEEN.Easing.Elastic.InOut )
					.start();

            	enemy._bursted = true;
			}
			enemy._bursted = false;
		}

		this._enemies.push( enemy );
		geometry.computeBoundingBox();
	}
}

StateGame.prototype.CreateItem = function () {
	var lineArr = [ 1, 1, 1 ];
	lineArr[ THREE.Math.randInt( 0, lineArr.length - 1 ) ] = 0;
	for( var i = 0; i < lineArr.length; i ++ ) {
		if( lineArr[i] === 0 ) {
			continue;
		}

		var newItemGeometry = new THREE.BoxGeometry( 2.5, 2.5, 2.5 );
		var newItemMat = new THREE.MeshPhongMaterial( { color: 0xd5d21e, side: THREE.DoubleSide, transparent: true, overdraw: true } );
		var newItemMesh = new THREE.Mesh( newItemGeometry, newItemMat );
		newItemMesh.position.set( (i - 1) * LINE_WIDTH, 3, this._player.position.z + 110 );
		this._root.add( newItemMesh );
		this._items.push( newItemMesh );

		var tween = new TWEEN.Tween( newItemMesh.rotation )
			.to( { x: 240, y: 180, z: 300 }, 100000 )
			.start();

		newItemMesh.geometry.computeBoundingBox();
		newItemMesh.OnCollide = function (item) {
			
		}
	}
}

StateGame.prototype.ProcessInput = function (dt) {
	if( keyboard.pressed('left') ) {
		this._player.position.x += 30 * dt;
		this._player.position.x = Math.min( LINE_WIDTH * 1.5, this._player.position.x );
	}
	if( keyboard.pressed('right') ) {
		this._player.position.x += -30 * dt;
		this._player.position.x = Math.max( -LINE_WIDTH * 1.5, this._player.position.x );
	}
}

StateGame.prototype.RemoveFarObject = function () {
	var removeList = [];

	var pz = this._player.position.z;
	for (var i = this._enemies.length - 1; i >= 0; i--) {
		var enemy = this._enemies[i];
		var ez = enemy.position.z;
		if( pz - ez > 50 ) {
			removeList.push( enemy );
			enemy._type = 0;
		}
	};
	for (var i = this._items.length - 1; i >= 0; i--) {
		var item = this._items[i];
		var ez = item.position.z;
		if( pz - ez > 50 ) {
			removeList.push( item );
			item._type = 1;
		}
	};

	for (var i = removeList.length - 1; i >= 0; i--) {
		var obj = removeList[i];
		if( obj._type === 0 ) {
			var index = this._enemies.indexOf( obj );
			this._enemies.splice( index, 1 );
		}
		else if( obj._type === 1 ) {
			var index = this._items.indexOf( obj );
			this._items.splice( index, 1 );
		}

		this._root.remove( obj );
	};
}

StateGame.prototype.CollisionCheck = function () {
	var playerBoundingBox = this._player.geometry.boundingBox.clone();
	playerBoundingBox.translate( this._player.position );


	//
	// with items
	//
	var removeItemList = [];
	for (var i = this._items.length - 1; i >= 0; i--) {
		var item = this._items[i];
		var boundingBox = item.geometry.boundingBox.clone();
		boundingBox.translate( item.position );
		if( playerBoundingBox.isIntersectionBox( boundingBox ) ) {
			item.OnCollide( item );
			removeItemList.push( item );
		}
	};

	for (var i = removeItemList.length - 1; i >= 0; i--) {
		var obj = removeItemList[i];
		var index = this._items.indexOf( obj );
		this._items.splice( index, 1 );
		this._root.remove( obj );
	};


	//
	// with enemies
	//
	for (var i = this._enemies.length - 1; i >= 0; i--) {
		var enemy = this._enemies[i];
		var boundingBox = enemy.geometry.boundingBox.clone();
		boundingBox.translate( enemy.position );
		if( playerBoundingBox.isIntersectionBox( boundingBox ) ) {
			this.GameOver();
			return;
		}
	};

	for (var i = this._enemies.length - 1; i >= 0; i--) {
		var enemy = this._enemies[i];
		if( enemy._type === 2 && ! enemy._bursted ) {
			if( enemy.position.z - this._player.position.z < 65 ) {
				enemy.Burst( enemy );
			}
		}
	};
}

StateGame.prototype.GameOver = function () {
	// stateManager.SetState("StateFirst");
	console.log( 'game over' );
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
	renderer.setClearColor( 0x000000, 1.0 ); // the default
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
// CreateAxis(scene);

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