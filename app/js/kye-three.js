
//require('bootstrap');
var THREE = require('three');

var isWebglEnabled = require('detector-webgl');
//var ColladaLoader = require('three-collada-loader'); // isnt using the most up to date loader !
import "./three/js-libs/loaders/ColladaLoader.js";
import "./three/js-libs/shaders/CopyShader.js";
import "./three/js-libs/shaders/FXAAShader.js";
import "./three/js-libs/postprocessing/EffectComposer.js";
import "./three/js-libs/postprocessing/RenderPass.js";
import "./three/js-libs/postprocessing/ShaderPass.js";
import "./three/js-libs/postprocessing/OutlinePass.js";	
import "./three/js-libs/controls/OrbitControls.js";	

import {TweenLight} from "gsap";

import createGeom from "./initGeom.js";

var traverseJS = require('traverse');
var _ = require('lodash');

if ( ! isWebglEnabled ) Detector.addGetWebGLMessage();
var mesh, decal;
var raycaster = new THREE.Raycaster();
var composer, effectFXAA, outlinePass;    


var params = {
	edgeStrength: 3.0,
	edgeGlow: 0.0,
	edgeThickness: 2.0,
	pulsePeriod: 0,
	rotate: false,
	usePatternTexture: false
};
/*
	boundedList: [
		{name:'home', parent:{}, directChildren:[{}], allChildren:[{}], ancestors:[{}], selfFade:false, parentFade:false},
*/

var barButtons = document.getElementById("barButtons");
barButtons.innerHTML = "<button id='button'>Carousel</button>";
var button = document.getElementById("button");

var carousel = {
	current: 1,
	currentlyHovering: 1,
	whichOneIn: function (carousels) {
		var camInCarousel = [];
		for (var i = 0; i < carousels.children.length; i++){
			if (carousels.children[i].geometry.boundingBox.containsPoint ( myView.controls.object.position ))
				camInCarousel.push(parseInt(carousels.children[i].name.split ('_')[1]))
		}
		return camInCarousel;
	},
	filter: function (carArray) {
		var filteredCar = [];
		filteredCar = carArray.filter(function(x) {return x != carousel.current});
		return filteredCar;
	},
	complete: function (param,param2) {
		myView.controls.enabled = true;
		myView.controls.update();
	}
};

var heirarchySystem = {
	scene:{},
	boundedList:[],
	sceneHierarchy: {},
	buildHiearchy:function (scenePassed,blPassed) {
		this.scene = scenePassed;
		this.boundedList = blPassed;

		for (var i=0; i < this.boundedList.length; i++)
		{
			this.buildBoundingData(this.scene.getObjectByName(this.boundedList[i].name), this.boundedList[i]); // build object data
		}
		for (var i=0; i < this.boundedList.length; i++)
		{
			this.boundedList[i].path = this.getPath(this.scene.getObjectByName(this.boundedList[i].name)); // build paths
			this.constructHeirarchy (this.sceneHierarchy,  this.boundedList[i]); // build the hierarchy
			this.buildMyObjList (this.boundedList[i]);
		}

		this.recurseMenu(this.sceneHierarchy.bboxGroup_home); 
		
		/*var diff = _.differenceBy(this.boundedList[0].allChildren, this.boundedList[1].allChildren, 'name');
		console.log ('diff',diff);*/
		console.log (this.sceneHierarchy);
	}, 
	buildMyObjList: function (boundList){
	
		var objList = [];
		var path = {};
		var startLevel;

		path = heirarchySystem.getPath(boundList.sceneRef);
		startLevel = path.level;

		boundList.sceneRef.traverse(function (obj) {
			if (obj instanceof THREE.Mesh){
				//console.log('obj mesh',obj);
				path = heirarchySystem.getPath(obj);
				//console.log('called outside obj.uuid',obj.uuid);
				if (path.level == startLevel){
					var objData = {};	
					objData.name = obj.name;
					objData.id = obj.id;
					objData.meshRef = obj;
					objList.push(objData)
				}
			}
		});
		boundList.myMeshes = objList;
		//console.log('objList',objList);
	},
	recurseMenu: function (){

	},
	getPath:function (childObj) {
		var path = {};
		var pathArray = [];
		var count = 0;
		var obj = childObj;

		do {
			if (obj.name.split('_',1) == 'bboxGroup'){

				pathArray.push(obj.name);
				if (obj.name != 'bboxGroup_home'){
					var currentBoundedList = _.find(heirarchySystem.boundedList, {'name':obj.name});
					console.log ('currentBoundedList.childPosition',currentBoundedList.childPosition);
					pathArray.push(currentBoundedList.childPosition);
					pathArray.push('children');
				}
				count++;
			}
			if (obj.parent.name.length){
				parent = this.scene.getObjectByName(obj.parent.name);
				obj = this.scene.getObjectByName(obj.parent.name);
			}			
		}
		while (obj.parent.name.length);

		path.level = count-1;
		pathArray.reverse();
		path.array = pathArray;
		//path.string = pathArray.join('.');
		return (path);

	},
	buildBoundingData:function (childObj,childBoundedList) {
		var count = 0;
		var obj = childObj;

		var childData = {};
		var ancestorData = {};
		var parentData = {};

		childData.SceneRef = childObj;
		childData.name = childObj.name;
		childData.link = childBoundedList;
		do {
			if (obj.name.split('_',1) == 'bboxGroup'){
				if (count == 0){ // obj is the starting child
					childBoundedList.sceneRef = childObj;
				}
				if (count == 1){// obj is the parent
					parentData.SceneRef = obj;
					parentData.name = obj.name;
					var parentBoundedList = _.find(this.boundedList, {'name':obj.name});
					parentData.link = parentBoundedList;
					childBoundedList.childPosition = parentBoundedList.directChildren.length
					parentBoundedList.directChildren.push(childData);
					parentBoundedList.allChildren.push(childData);
					childBoundedList.parent = parentData;		
				}
				if (count > 1){// obj is an ancestor
					ancestorData.SceneRef = obj; // set ancestor object ready to push to child ancestor array
					ancestorData.name = obj.name;

					var ancestorBoundedList = _.find(this.boundedList, {'name':obj.name});
					ancestorBoundedList.allChildren.push(childData);
					childBoundedList.ancestors.push(ancestorData);
				}
				count++;
			}
			if (obj.parent.name.length){
				parent = this.scene.getObjectByName(obj.parent.name);
				obj = this.scene.getObjectByName(obj.parent.name);
			}			
		}
		while (obj.parent.name.length);
	},
	constructHeirarchy: function( base, objHierarchyInfo, value ) {
		// If a value is given, remove the last name and keep it for later:
		var lastName = arguments.length === 3 ? objHierarchyInfo.path.array.pop() : false;

		// Walk the hierarchy, creating new objects where needed.
		// If the lastName was removed, then the last object is not set yet:
		for( var i = 0; i < objHierarchyInfo.path.array.length; i++ ) {
			base = base[ objHierarchyInfo.path.array[i] ] = base[ objHierarchyInfo.path.array[i] ] || {};
		}

		// If a value was given, set it to the last name:
		if( lastName ) {
			objHierarchyInfo.path.array.push(lastName); // put the last name back on the array as im using it
			console.log ('base is:',base);
			base = base[ lastName ] = value;

		}

		// Return the last object in the hierarchy:
		return base;
	}
}



/* ****************  myScene HOLDS THE SCENE DATA FOR MANIPULATION IN AN ARRAY OF OBJECTS **************** */
var myScene = {
	camLevel: 0,
	scene: new THREE.Scene(),
	carousels: null,
	loaded: false,
	clock: new THREE.Clock(), // instantiates a clock to use for getting the time delta between frames to calculate animations
	bboxMat: new THREE.MeshLambertMaterial(), // Bbox material  
	initialColor: new THREE.Color().setRGB( 0.0, 0.0, 0.0 ),
	hoverColor: new THREE.Color().setRGB( 0.2, 0.2, 0.2 ),
	clickColor: new THREE.Color().setRGB( 0.15, 0.15, 0.2 ),

	camToLoad: ['cam0'],//  null or array of strings ['nameofobject3d']
	fileToLoad: '../exports/auto-export-three.dae',
	texturePath: 'maya2017/sourceimages/',
	boundedList: [
		{name:'home', childPosition:100, parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'car',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:true, parentFade:false},
		{name:'seats',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'engine',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'mainBoot',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'tableTop',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'mySphere',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'innerTableTop',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'mySphere2',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'mySphere3',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false},
		{name:'pSphere2',  parent:null, directChildren:[], allChildren:[], ancestors:[], selfFade:false, parentFade:false}
	], // null or array of strings ['nameofobject3d']

	raycaster: new THREE.Raycaster(),

	maps: [  
		//{name:'lightmap',type:'lightmap',format:'.jpg',recursion:2,image: null,path:''} 
		// recursion 0 = object only 
		// recursion 1 = object plus direct chidren only
		// recursion 2 = object plus all descendants (full recursion)
		// add as many more textures and types here: {name:'multimeter',type:'lightmap',format:'jpg',recursion:2}
	], 
	setMatertialInvisible: function (obj) {
		obj.material.visible = false; 
	},
	changePolyColor: function ()  {
		obj.geometry.faces[4].color.setRGB (0.5,0.3,1);
		obj.geometry.faces[ 5 ].color.setRGB(color); // or use set()
		obj.geometry.colorsNeedUpdate = true;
		//console.log (obj);
	},
	sceneInitTraverse: function ()  {
		//bboxMatParams =  {color:'rgb(255,0,255)',emissive:'rgb(255,0,255)',wireframe:true}; // initialise the parameters of the bounding box material
		var bboxMatParams = { color: 0xffffff, flatShading : THREE.FlatShading, vertexColors: THREE.VertexColors,wireframe:true } ;
		myScene.bboxMat = new THREE.MeshBasicMaterial(bboxMatParams); // create the bbox material to be used for bounding box
		myScene.loaded = true;
		myScene.scene.updateMatrixWorld(  ); // **** NOTE: very important, needs to be called after files
		var color = new THREE.Color( 1, 0, 0 );
		myScene.scene.traverse(function (obj) {
			if (obj instanceof THREE.Mesh){
				obj.geometry.computeBoundingBox (); // calculate the bounding box dimensions (min/max as vec3s) for all meshes
			}

		});
	},
	offsetBox3: function  (bbox3, obj) {
		bbox3.applyMatrix4 ( obj.matrixWorld )
		console.log('bbox3',bbox3,'obj',obj)
	},
	calculateBoundingBox: function (obj, name) {
		/********* get inverse and send to origin *************/
		var originalMatrix = new THREE.Matrix4(); // stores the original transformations of object
		var invertedMatrix = new THREE.Matrix4(); // stores the original transformations of object

		var Box3 = new THREE.Box3(); // box utlity, getsize and getcenter
		var BoxHelper = new THREE.BoxHelper(); // for displaying bounding box, wireframe, 
		var center = new THREE.Vector3(); 
		var dimensions = new THREE.Vector3();
		var bboxGeom = new THREE.BoxGeometry(); // geometry for holding bounding box, needed for ray collision

		originalMatrix.copy (obj.matrixWorld); // Get copy of original Matrix
		obj.applyMatrix(invertedMatrix.getInverse ( obj.matrixWorld )); // apply the inverse / removal of all transforms
		obj.updateMatrix(); // update the matrix
		obj.name = 'bboxGroup_' + name; // name.charAt(0).toUpperCase() + name.slice(1);capatilises first letter and adds the rest after first letter
	 
		Box3.setFromObject ( obj); // set box dimensions from object
		Box3.getCenter(center); 
		Box3.getSize(dimensions); // save the dimensions into a vec3 for later

		bboxGeom = new THREE.BoxGeometry( dimensions.x,dimensions.y,dimensions.z); // init geometry NOTE: default world space 0,0,0
		var bbox = new THREE.Mesh( bboxGeom, myScene.bboxMat ); // apply defulat material from myscene object
		bbox.name = 'bboxMesh_' + name;
		myScene.scene.add( bbox ); // add the bounding box to the scene ready to attach to object later

		bbox.scale.set (1.02,1.02,1.02); // scale box a bit bigger than the object for collision 
		BoxHelper = new THREE.BoxHelper(bbox, 0xffff00); // create the box helper for displaying bounding volume (line segments)
		bbox.position.set (center.x,center.y,center.z); // now offset the box, important to do this afterboxhelper creation

		BoxHelper.scale.set(0.99,0.99,0.99); // Boxhelper is 1% larger than object but 1% less than bbox

		bbox.updateMatrix();
		BoxHelper.updateMatrix();

		THREE.SceneUtils.attach ( bbox, myScene.scene, obj );
		THREE.SceneUtils.attach ( BoxHelper, myScene.scene, bbox );
		
		//re-aapply all transformations
		obj.applyMatrix(originalMatrix);
		obj.updateMatrix(); //update
		return obj.name;
	
		/********* copy any matrix4 and stick it in a matrix4 object array *************/
		//myScene.identityMatrix4.copy (obj.matrixWorld); // copy the matrix position 

		/********* Send any object to the position, rotation and scale of any other (absolute or relative to local offset) *************/
		/*var rootPos = new THREE.Vector3(0,0,0);  
		cube.position.set (rootPos.x,rootPos.y,rootPos.z); // absolute position, leave out for relative positioning
		cube.updateMatrix();
		cube.applyMatrix (someObj.matrix); //or could be matrixWorld
		cube.updateMatrix(); // or could be updateMatrixWorld
		console.log('cube', cube);*/    
	},
	raycast: function  (pos, fromMouse)
	{
		var final = new THREE.Vector2();
		var offsetOfPageScroll = new THREE.Vector2();
		var finalOffset = new THREE.Vector2();
		var offsetOfDiv = $('#vp0').offset();
		var isIE11 = !!window.MSInputMethodContext && !!document.documentMode;

		offsetOfPageScroll.y = $('html').scrollTop();
		offsetOfPageScroll.x = $('html').scrollLeft();

		finalOffset.x = offsetOfDiv.left - offsetOfPageScroll.x;
		finalOffset.y = offsetOfDiv.top - offsetOfPageScroll.y;
/*
		if (!fromMouse){
			offsetOfDiv.left = 0; offsetOfDiv.top = 0;
		}
		
		if (isIE11)
		offsetOfDiv.left = 0; // a nasty hack for ie11 mouse odffset does not need to be offset for some weird reason that I cant work out
	*/
		final.x = ( (pos.x - finalOffset.x) / myView.dimensions.x ) * 2 - 1;
		final.y = -( (pos.y - finalOffset.y) / myView.dimensions.y ) * 2 + 1;
	
		// update the picking ray with the camera and mouse position
		if (pos.x != null && myScene.loaded == true) { // id there is a valid mouse position and the scene has loaded
			myScene.raycaster.setFromCamera(final, myView.camera);
	
			// calculate objects intersecting the picking ray
			var objArray = myScene.raycaster.intersectObjects(myScene.scene.children, true);
	
			if (objArray.length > 0){
				return objArray;
			}
			else{
				return false;
			}
		}
	},
/*
	setHighlight: function  (obj, color){
		
		if (obj.material instanceof THREE.MultiMaterial) {
			for (i = 0; i < obj.material.materials.length; i++) {
				obj.material.materials[i].emissive.r = color.r;
				obj.material.materials[i].emissive.g = color.g;
				obj.material.materials[i].emissive.b = color.b;
			}
		}
		else {
			obj.material.emissive.r = color.r;
			obj.material.emissive.g = color.g;
			obj.material.emissive.b = color.b;
		}
	},
	*/
	applyMap: function (obj3d, map){ // passes in the object to be textured and the type of texture to assign
		var type = map.type;
		var recursion = map.recursion;
		var didAssign = false;
		if (type=='lightmap'){
			switch(recursion) {
				case 0: // no recursion just apply direct to mesh in there is one
				if (obj3d.children[0] instanceof THREE.Mesh){
					obj3d.children[0].material.lightMap = map.image;
				}
				else{
					console.log ('Note: there is no mesh in root of object to apply lightmap');
				}
					break;
				case 1: // 1 level of recursion apply to direct mesh 1 level of children
					if (obj3d.children[0] instanceof THREE.Mesh){
						obj3d.children[0].material.lightMap = map.image;
						didAssign = true;
					}
					for (var i = 0, len = obj3d.children.length; i < len; i++) { 
						if (obj3d.children[i].children[0] instanceof THREE.Mesh) {
							obj3d.children[i].children[0].material.lightMap = map.image; // creates the correct name of the lightmap from the file name
							didAssign = true;
						}
					}
					if (didAssign == false){console.log ('Note: there is no mesh in root of object to apply lightmap');}
				break;
				case 2:
				obj3d.traverse(function(child) { // traverse the object and all its chidren 
					if (child instanceof THREE.Mesh) {
						child.material.lightMap = map.image; // creates the correct name of the lightmap from the file name
					}
				});
				if (didAssign == false){console.log ('Note: there is no mesh in root of object to apply lightmap');}
				break;
			}
		}
	}
};
var myView =
{
	mouseButtonPressed: {left:false,middle:false,right:false},
	levelSwitch: 0,
	vpDiv: null, // viewport div for instantiating the area to be rendered in to
	sceneCamStart: new THREE.Vector3(0, 0, 0),
	dimensions: new THREE.Vector2( 0, 0 ),
	background: new THREE.Color().setRGB( 0, 0, 0 ),
	up: [ 0, 1, 0 ],
	fov: 120,
	defaultFov:65,
	controls: null,
	camera: null,
	renderer: null,
	yaw: 0, // look left and right
	pitch: 0, // look up down angle
	look: false,
	setCamBehavior: function (camControls, level) {
		switch(level) {
			case 0:
				console.log ('set to level 0');
				camControls.level = 0;
				camControls.mouseButtons = { PAN: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, ORBIT: THREE.MOUSE.RIGHT};
				button.innerHTML = "Orbit";
				camControls.minPolarAngle = 0.3; // radians
				camControls.maxPolarAngle = 1.3; // radians
				camControls.minAzimuthAngle = - 0; // radians
				camControls.maxAzimuthAngle = 0; // radians

				camControls.minDistance = 3;
				camControls.maxDistance = 8;

				camControls.rotateSpeed = 0.3;
				this.levelSwitch = 1;
				break;
			case 1: 
				camControls.level = 1;
				button.innerHTML = "Carousel";
				console.log ('set to level 1');
				camControls.minPolarAngle = 0.0; // radians
				camControls.maxPolarAngle = 1.5; // radians
			
				camControls.minAzimuthAngle = - Infinity; // radians
				camControls.maxAzimuthAngle = Infinity; // radians

				camControls.minDistance = 3;
				camControls.maxDistance = 7;

				camControls.mouseButtons = { ORBIT: THREE.MOUSE.LEFT, ZOOM: THREE.MOUSE.MIDDLE, PAN: THREE.MOUSE.RIGHT};
				this.levelSwitch = 0;
				break;
		}
},
	setCamToOrbitControls: function (cam,div){
		var camTarget = new THREE.Vector3 (0,0,-1); // set a camera vector looking down z (toward scene)
		if (this.look == true){
			cam.localToWorld(camTarget); //set the vector coordinates to local vector space from camera.
		}
		//this.controls = new THREE.OrbitControls(this.camera,this.renderer.domElement,this.look,camRotation); // set the orbit controls
		this.controls = new THREE.OrbitControls(cam,div); // set the orbit controls
		this.controls.enableDamping = true;
		this.controls.dampingFactor = 0.2;
		this.controls.object.setViewOffset ( myView.dimensions.x, myView.dimensions.y, 0, 0, myView.dimensions.x, myView.dimensions.y )
		
		if (this.look == true){
			this.controls._target.set(camTarget.x,camTarget.y,camTarget.z);
			this.controls._targetEnd.set(camTarget.x,camTarget.y,camTarget.z);
		}
		this.controls.enabled = true;
		console.log(this.controls);
		
		this.controls.update();
		
	},
	setmyViewDimensions: function  (){
		this.dimensions.x = this.vpDiv.clientWidth;
		this.dimensions.y = this.vpDiv.clientHeight;
	}
};



/* ****************  LOADER **************** */

var manager = new THREE.LoadingManager();
manager.onLoad = function ( ) {
	myScene.sceneInitTraverse();
	$('.load-bar').css({'width':'100%'});
	$('#enter').stop().fadeToggle(200, "linear" );
	$('#enter').click(function() {
	$('.title-screen').stop(false).fadeToggle(500, "linear" );
	});
	init(); // call the initialisation function to setup the rest of the scene
	animate(); // render scene to screen and call the animation loop

};
manager.onProgress = function ( url, itemsLoaded, itemsTotal ) {
	console.log( 'Loading file: ' + url + '.\nLoaded ' + itemsLoaded + ' of ' + itemsTotal + ' files.' );
 };
manager.onError = function ( url ) {
	console.log( 'There was an error loading ' + url );
};

var onProgress = function( xhr,num ) {
	var percentComplete = xhr.loaded / xhr.total * 100;
	console.log( Math.round( percentComplete, 2 ) + '% downloaded' );
};

var onError = function( xhr ) {
	console.error( xhr );
};
//var loader = new THREE.ObjectLoader();
var loader = new THREE.ColladaLoader( manager );
//var loader = new THREE.FBXLoader( manager ); // create a new loader to load collada files and use the download manager
loader.load( myScene.fileToLoad , 
function( object ) {
	console.log(object);
	myScene.scene.add( object.scene ); //object for FBX, object.scene for dae / open collada																															
	myScene.scene.updateMatrixWorld(); // needs to be called to correctly compute world coords from local
},onProgress,onError
);

var loader1 = new THREE.TextureLoader(manager); // Usually it would not be nesseccary to call this loader inside another loader, but becuase colladaLoader does not yet support the loaderManager it breaks the correct way
for (var i = 0, len = myScene.maps.length; i < len; i++) { // for each texture in the array that needs loading
	myScene.maps[i].path = myScene.texturePath + myScene.maps[i].name + '_' +  myScene.maps[i].type +  myScene.maps[i].format; // create and save the full path to the texture
	myScene.maps[i].image = loader1.load(myScene.maps[i].path); // load the texture in to the object at the position in the array
};

var loader2 = new THREE.CubeTextureLoader(manager);
loader2.setPath( '../app/imgs/cube/' );

var textureCube = loader2.load( [
	'envmap_left.jpg', 'envmap_right.jpg',
	'envmap_top.jpg', 'envmap_bottom.jpg',
	'envmap_front.jpg', 'envmap_back.jpg'
] );

/* ****************  INITIALISE **************** */
function init() {

	
	myView.vpDiv = document.getElementById("vp0"); // assign a div to an object in the myViews array

	myView.setmyViewDimensions (); // calculate the view dimentions for various calculations

	myView.renderer = new THREE.WebGLRenderer({ antialias: true });
	myView.renderer.setClearColor(new THREE.Color(0,0,0));
	myView.renderer.setPixelRatio( 1 );
	myView.renderer.setSize(myView.dimensions.x, myView.dimensions.y);

	myView.vpDiv.appendChild(myView.renderer.domElement);
	
/* ****************  ASSIGN MAPS **************** */

	var reflectionObj = myScene.scene.getObjectByName('final_box_mesh');
	reflectionObj.material.envMap = textureCube;
	reflectionObj.material.combine = THREE.AddOperation;
	reflectionObj.material.reflectivity = 0.6;

	var reflectionObj = myScene.scene.getObjectByName("polySurface2");
	reflectionObj.material.envMap = textureCube;
	reflectionObj.material.combine = THREE.AddOperation;

	for (var i = 0, len = myScene.maps.length; i < len; i++) { // for each map that exists that needs applying to the scene
		var objectToMap = myScene.scene.getObjectByName(myScene.maps[i].name);// get object from scene that has same name as map
		if (objectToMap) { // if the object exists
			myScene.applyMap (objectToMap,myScene.maps[i]); // Pass the 3dobject and map to function to deal with 
		 }
		 else { // it cant find the object named by the texture
			 console.log ('object: '+ myScene.maps[i].name + 'doesnt exist in the scene');
		 }
	}
	
	if (myScene.camToLoad){ // if a camera name is defined as
		var tempCam = myScene.scene.getObjectByName('cam0'); // load the camera into a temp object
		tempCam.traverse(function (child) { // traverse the whole camera structure to find the actual camera node
			if (child instanceof THREE.PerspectiveCamera) {
				myView.camera = child;
				//myView.camera.applyMatrix (myScene.scene.getObjectByName('cam0').matrix);
				//myView.camera.updateProjectionMatrix();
				// myView.camera.fov = 120;
				myView.camera.rotation.order = "YXZ";
				myView.camera.aspect = (myView.dimensions.x / myView.dimensions.y);
				
			}
		});
	}
	else{
		myView.camera = new THREE.PerspectiveCamera(100, myView.dimensions.x / myView.dimensions.y, 0.1, 100000);
		myView.camera.position.x = 25;myView.camera.position.y = 30;myView.camera.position.z = -25;
		myView.camera.fov = myView.defaultFov; // sets to the defaultFov of 65
	}

	myView.setCamToOrbitControls (myView.camera,myView.vpDiv); // set the camera to the orbit controls as declared in the source file. Pass in the camera rotation for look function
	myView.setCamBehavior (myView.controls,0);
	myView.camera.updateProjectionMatrix();
	myScene.scene.add(myView.camera);

	/********** SET CAROUSEL ************** */
    myScene.carousels = myScene.scene.getObjectByName("carousels"); // get the carousel group and save it to myscene
    console.log ('myScene.carousels',myScene.carousels);
	myScene.setMatertialInvisible (myScene.carousels.children[0]); 
	
	
	for (var i = 0; i < myScene.carousels.children.length;i++){ 
		myScene.offsetBox3 (myScene.carousels.children[i].geometry.boundingBox, myScene.carousels.children[i]);
	}
	

	var inCarousels = carousel.whichOneIn (myScene.carousels); // detect which carousels camera is in. retruenms array of possibiolities as carousels overall
	console.log ('inCarousels',inCarousels);
	var filtered = carousel.filter (inCarousels); 
	console.log ('filtered',filtered);

	button.onclick = function(event) { myView.setCamBehavior(myView.controls,myView.levelSwitch) };

	function complete(param,param2) {
		myView.controls.enabled = true;
		myView.controls.update();
	}

	
	function update() {
		myView.controls.object.setViewOffset ( myView.dimensions.x, myView.dimensions.y, myView.controls.object.view.offsetX, 0, myView.dimensions.x, myView.dimensions.y )

	}

	var animate = document.getElementById("animate");
	var cube = myScene.scene.getObjectByName('pCube1');
/* 	animate.onclick = function(event) { 
		//myView.controls.enabled = false;
		TweenLite.to(myView.controls.target, 0.6, {x:1.5,ease:Power2.easeOut,onComplete:complete,onCompleteParams:[1,2]}); 

	};

	var offsetCam = document.getElementById("offsetcam");
	offsetCam.onclick = function (event) {
		
		TweenLite.to(myView.controls.object.view,0.6, {offsetX:-450,ease:Power2.easeOut,onUpdate:update });
	} */

	/* ------------  postprocessing -------------- */
	composer = new THREE.EffectComposer( myView.renderer );

	var renderPass = new THREE.RenderPass( myScene.scene, myView.camera );
	composer.addPass( renderPass );

	var outlinePass = new THREE.OutlinePass( new THREE.Vector2(myView.dimensions.x, myView.dimensions.y), myScene.scene, myView.camera);
	outlinePass.edgeStrength = 2.0;
	outlinePass.edgeGlow = 0.0;
	outlinePass.edgeThickness = 1.0;
	//outlinePass.pulsePeriod = 3;
	outlinePass.usePatternTexture = false;
	
	outlinePass.visibleEdgeColor.set( 'gold' );
	outlinePass.hiddenEdgeColor.set( 'gold'  );

	var outlinePassRollover = new THREE.OutlinePass( new THREE.Vector2(myView.dimensions.x, myView.dimensions.y), myScene.scene, myView.camera);
	outlinePassRollover.edgeStrength = 2.0;
	outlinePassRollover.edgeGlow = 0.0;
	outlinePassRollover.edgeThickness = 1.0;
	//outlinePassRollover.pulsePeriod = 3;
	outlinePassRollover.usePatternTexture = false;
	
	outlinePassRollover.visibleEdgeColor.set( 'white' );
	outlinePassRollover.hiddenEdgeColor.set( 'white'  );

	var onLoad = function ( texture ) {
		outlinePass.patternTexture = texture;
		outlinePassRollover.patternTexture = texture;
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;
	};

	var loader = new THREE.TextureLoader();

	// load a resource
	loader.load(
		// resource URL
		'exports/tri_pattern.jpg',
		// Function when resource is loaded
		onLoad
	);

	composer.addPass( outlinePass );
	composer.addPass( outlinePassRollover );

	effectFXAA = new THREE.ShaderPass(THREE.FXAAShader);
	effectFXAA.uniforms['resolution'].value.set(1 / myView.dimensions.x, 1 / myView.dimensions.y );
	effectFXAA.renderToScreen = true;
	composer.addPass( effectFXAA );

	
	var transPlastic1 = myScene.scene.getObjectByName('polySurface2'); 
	var transPlastic2 = myScene.scene.getObjectByName('polySurface3'); 
	var transPlastic3 = myScene.scene.getObjectByName('polySurface4'); 
	var plane = myScene.scene.getObjectByName('plane1'); 

	transPlastic1.material.opacity = 0.4;
	transPlastic2.material.opacity = 0.4;
	transPlastic3.material.opacity = 0.4;
	plane.material.opacity = 0.9;

	/* ****************  Outlines **************** */
/* 	var selectedObjects = [];
	function addSelectedObject( object ) {
		
		selectedObjects.push( object );
	}
	var selectedObject = [];
	selectedObject.push (myScene.scene.getObjectByName('middleSet')); 
	//selectedObject.push (myScene.scene.getObjectByName('bboxGroup_seats')); 
	//selectedObject.push (myScene.scene.getObjectByName('bboxGroup_mainBoot')); 

	console.log(selectedObject);
	selectedObject.forEach(outlineTraverse);
	function outlineTraverse(item){
		item.traverse(function (child) {
			var firstPartName = child.name.split('_',1);
			if (child instanceof THREE.Mesh &&  firstPartName != 'bboxMesh'){
				addSelectedObject( child );
			}
		});
	}
	 */
	
	//outlinePass.selectedObjects = selectedObjects;
	//outlinePassRollover.selectedObjects = selectedObjects;  	

	/* ****************  Outlines **************** */
	//heirarchySystem.buildHiearchy(myScene.scene, myScene.boundedList);
}

/* ****************  ANIMATE **************** */
function animate() {
	myView.setmyViewDimensions ();
	var delta = myScene.clock.getDelta();
	composer.render();  
	myView.controls.update(delta);
	requestAnimationFrame(animate); // render using requestAnimationFrame
}


/* ****************  INPUT **************** */
function mousemove( event ) {
	if (myView.mouseButtonPressed.left == true){

		if (myView.controls.level == 0){
			var bartitle = document.getElementById("barTitle");
			//console.log ('i am dragging my left mouse button');
			var inCarousels = carousel.whichOneIn (myScene.carousels); // detect which carousels camera is in. retruenms array of possibiolities as carousels overall
			var filtered = carousel.filter (inCarousels); 
	
			if (filtered.length == 0){
				carousel.currentlyHovering = carousel.current;
				//bartitle.innerHTML = 'current: ' + carousel.current + 'hovering: ' + carousel.currentlyHovering;
			}
			else {
				carousel.currentlyHovering = filtered[0];
				//bartitle.innerHTML = 'current: ' + carousel.current + 'hovering: ' + carousel.currentlyHovering;
			}
		}


	}
	 
	var intersects = myScene.raycast(event, true);
	if (intersects && intersects[0].object instanceof THREE.BoxHelper ) { // if your mouse moves over a product, mouse buttons not pressed and found a bounding box
		intersects[0].object.traverse(function (child) {
			if (child instanceof THREE.Mesh && !(child instanceof THREE.BoxHelper  )) {
				myScene.setHighlight(child, myScene.hoverColor);
				document.body.style.cursor = 'pointer';
			}
		});
	}
	else {
		myScene.scene.traverse(function (child) {
			if (child instanceof THREE.Mesh && !(child instanceof THREE.BoxHelper  )) {
				//myScene.setHighlight(child, myScene.initialColor);
				document.body.style.cursor = 'initial';
			}
		});
	}        
}

function mousedown( event ) {
	//console.log ('i poressed down button', event.button);      
	switch (event.button) {
		case 0 :
			myView.mouseButtonPressed.left = true;
			break;
		case 1 :
		myView.mouseButtonPressed.middle = true;
		break;	
		case 2 :
			myView.mouseButtonPressed.right = true;
			break;		
	}
}

function mouseup( event ) {
	
	switch (event.button) {
		case 0  :
		if (myView.controls.level == 0){
			var bartitle = document.getElementById("barTitle");
			var carouselToMoveBackto = null;
			console.log ('i released my left button', event.button);   
			myView.mouseButtonPressed.left = false;
			carousel.current = carousel.currentlyHovering;
            //bartitle.innerHTML = 'current: ' + carousel.current + 'hovering: ' + carousel.currentlyHovering;
			carouselToMoveBackto = myScene.scene.getObjectByName('carousel_' + carousel.current);
			TweenLite.to(myView.controls.target, 0.4, {x:carouselToMoveBackto.position.x,ease:Power2.easeOut,overwrite:'all'}); 
		}
			break;
		case 1 :
		myView.mouseButtonPressed.middle = false;
		break;	
		case 2 :
			myView.mouseButtonPressed.right = false;
			break;		
	}
}

function onResize() {
	myView.setmyViewDimensions ();

	myView.camera.aspect = (myView.dimensions.x / myView.dimensions.y);
	myView.camera.updateProjectionMatrix();
	//myView.renderer.setSize(myView.dimensions.x, myView.dimensions.y);
	//myView.renderer.render( myScene.scene, myView.camera );
	

	myView.renderer.setSize( myView.dimensions.x, myView.dimensions.y );
	composer.setSize( myView.dimensions.x, myView.dimensions.y );
	effectFXAA.uniforms[ 'resolution' ].value.set( 1 / myView.dimensions.x, 1 / myView.dimensions.y );
	composer.render();  
}



window.addEventListener('resize', onResize, true);
window.addEventListener('mousemove',mousemove); 
window.addEventListener('mousedown', mousedown);
window.addEventListener('mouseup', mouseup);