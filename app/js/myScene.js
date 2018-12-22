THREE = require('three');
/* ****************  myScene HOLDS THE SCENE DATA FOR MANIPULATION IN AN ARRAY OF OBJECTS **************** */
class myScene {
	constructor() {
		this.fileToLoad = '../exports/auto-export-three.dae';
		let scene = new THREE.Scene();
		let loaded = false;
		let clock = new THREE.Clock(); // instantiates a clock to use for getting the time delta between frames to calculate animations
		let bboxMat = new THREE.MeshLambertMaterial(); // Bbox material  
		let initialColor = new THREE.Color().setRGB( 0.0, 0.0, 0.0 );
		let hoverColor = new THREE.Color().setRGB( 0.2, 0.2, 0.2 );
		let clickColor = new THREE.Color().setRGB( 0.15, 0.15, 0.2 ); 
	
		let camToLoad = ['cam0'];//  null or array of strings ['nameofobject3d']
		//fileToLoad: 'maya2017/exports/multimeter2017-meter2018.dae',

		let texturePath = 'maya2017/sourceimages/';
		let boundedList = ['car','seats','engine','mainBoot','tableTop','mySphere','innerTableTop','mySphere2','mySphere3']; // null or array of strings ['nameofobject3d']
	
		let raycaster =  new THREE.Raycaster();
		let maps = [  
			//{name:'lightmap',type:'lightmap',format:'.jpg',recursion:2,image: null,path:''} 
			// recursion 0 = object only 
			// recursion 1 = object plus direct chidren only
			// recursion 2 = object plus all descendants (full recursion)
			// add as many more textures and types here: {name:'multimeter',type:'lightmap',format:'jpg',recursion:2} 
		];
	  }




	changePolyColor()  {
		obj.geometry.faces[4].color.setRGB (0.5,0.3,1);
		obj.geometry.faces[ 5 ].color.setRGB(color); // or use set()
		obj.geometry.colorsNeedUpdate = true;
		//console.log (obj);
	};
	buildMenu() {
		/*var bboxDataEngineSub3 = {name:'bboxGroup_engineSub2',parent:'bboxGroup_engine',hasChildren:false,ownGeom:['geom7','geom8','geom9'],children:[]};            

		
		var bboxDataEngineSub1 = {name:'bboxGroup_engineSub1',parent:'bboxGroup_engine',hasChildren:false,ownGeom:['geom4','geom5','geom6'],children:[]};
		var bboxDataEngineSub2 = {name:'bboxGroup_engineSub2',parent:'bboxGroup_engine',hasChildren:false,ownGeom:['geom7','geom8','geom9'],children:[]};
		var bboxDataEngine = {name:'bboxGroup_engine',parent:'root',hasChildren:true,ownGeom:['geom1','geom2','geom3'],children:[bboxDataEngineSub1,bboxDataEngineSub2]};

		var root = {children:[bboxDataEngine]};
		root.linkNotHereYet['bboxDataEngineSub3']  = bboxDataEngineSub3;
		console.log(root);*/
	};
	sceneInitTraverse()  {
		//bboxMatParams =  {color:'rgb(255,0,255)',emissive:'rgb(255,0,255)',wireframe:true}; // initialise the parameters of the bounding box material
		var bboxMatParams = { color: 0xffffff, flatShading : THREE.FlatShading, vertexColors: THREE.VertexColors,wireframe:true } ;
		myScene.bboxMat = new THREE.MeshBasicMaterial(bboxMatParams); // create the bbox material to be used for bounding box
		console.log(myScene.scene);
		myScene.loaded = true;
		myScene.scene.updateMatrixWorld(  ); // **** NOTE: very important, needs to be called after files
		var color = new THREE.Color( 1, 0, 0 );
		myScene.scene.traverse(function (obj) {
			if (obj instanceof THREE.Mesh){
				obj.geometry.computeBoundingBox (); // calculate the bounding box dimensions (min/max as vec3s) for all meshes
			}

		});
	};
	calculateBoundingBox(obj, name) {
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
		obj.name = 'bboxGroup' + name.charAt(0).toUpperCase() + name.slice(1); // capatilises first letter and adds the rest after first letter
	 
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
	};
	raycast(pos, fromMouse)
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
	};
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
	applyMap (obj3d, map){ // passes in the object to be textured and the type of texture to assign
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
	};
};

export default myScene;