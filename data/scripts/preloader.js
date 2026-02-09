var toPreload = new Set();
var preloadIter;
const assetBaseUrl = "https://raw.githubusercontent.com/random197854/t35t_P3r1/branch1/";
var preload = {
	paths: new Set(),
	files: new Set(),
	temp: {

	},
	perm: {

	},
	canvas: {

	},
	currentSpine: null,
	spines: {},
	failed: false,
	failedPaths: [],
	loaded: 0,
	audio: {
		voice: new Audio(),
		bgm: new Audio(),
		se: new Audio(),
	}
}

//make scene uninteractable until load

function initPreload() {
	preload.permElem = document.getElementById("preload-perm-elem");
	preload.tempElem = document.getElementById("preload-temp-elem");
}

function preloadSceneResources(script) {
	for (let command of script) {
		let fn;
		let src;
		switch (command.substr(1, command.lastIndexOf(">") - 1)) {
			case "EV":
				fn = command.substr(command.lastIndexOf(">") + 1, command.indexOf(",") - (command.lastIndexOf(">") + 1)).trim();
				if (fn == "black" || fn == "white") {
					continue;
				}
				src = createImagePath(fn, ".png");
				break;
			case "BG":
				fn = command.substr(command.lastIndexOf(">") + 1, command.indexOf(",") - (command.lastIndexOf(">") + 1)).trim();
				if (fn == "black" || fn == "white") {
					continue;
				}
				src = createImagePath(fn, ".png");
				break;
			case "ACTOR":
				fn = command.substr(command.indexOf(",") + 1, command.substr(command.indexOf(",") + 1).indexOf(",")).trim();
				//My addition, used when you just whant to show an actor, or hide it, but not change it's image
				if (fn == "none") {
					continue;
				}
				src = createImagePath(fn);
				break;
			case "VOICE_PLAY":
				// src = constructVoiceAudioPath(command.substr(command.lastIndexOf(">") +1).trim(), scene.id);
				break;
			case "BGM_PLAY":
				// src = constructBGMAudioPath(command.substr(command.lastIndexOf(">") +1, command.indexOf(",") - (command.lastIndexOf(">") +1)).trim());
				break;
			case "SE_PLAY":
				// src = constructSEAudioPath(command.substr(command.lastIndexOf(">") +1).trim());
				break;
			default:
				break;
		}
		preload.paths.add(src);
	}

	//Preloads canvases, that are used by ex: "EV" and "SPINE_IMAGE" events
	createCanvases(scene.script, function callback() {

		//When done preloading all spine players, continue preloading of other resources
		preloadSpinePlayers(script, function callback() {

			preload.paths.delete(undefined);
			preload.iter = preload.paths.values();
			fileLoader(loadSceneResources);
		});

	});
}

//Preload spine players used in the current scene
//Calls: callback() when done preloading
function preloadSpinePlayers(script, callback) {
	//Get all spine actor commands in the scene
	var spineData = getCommandData(script, "<SPINE_ACTOR>", null);

	//If there are no spine players, call the callback immediately
	if (spineData.length === 0) {
		callback();
		return;
	}

	var preloadedSpineViewers = 0;
	var spineDataSet = new Set();

	var spineDataInfo = {};

	for (let i = 0; i < spineData.length; i++) {
		var arguments1 = spineData[i].split(",");

		//<SPINE_ACTOR>0,char_00001501_01,6,CENTER, CENTER, IN, linear, 1000
		//<SPINE>r18_spine_100011_000,3,0,5,0.26

		let actorIdx = arguments1[0];
		let actorFilename = arguments1[1];
		let actorAnimationName = arguments1[2];

		//let _actorPos = arguments1[3];
		//let _actorPos2 = arguments1[4];
		//let _actorMoving = arguments1[5];
		//let _actorTiming = arguments1[6];
		//let _actorDur = arguments1[7];

		//let imagefile1=arguments1[0];
		//let nrOfSpriteFiles1=arguments1[1];
		//let arg2=arguments1[2];
		//let spineAnimType1=arguments1[3]; //"0", "5" or "-4"

		if (spineDataInfo[actorFilename] === undefined) {
			spineDataInfo[actorFilename] = {
				"animations": {}
			};
		}
		spineDataInfo[actorFilename]['animations'][actorAnimationName] = 1;

		spineDataSet.add(actorFilename);
	}

	//Loop through all unique spine commands and create a spine player for each
	for (let imagefile of spineDataSet) {
		//let spineAnimType=spineDataInfo[imagefile]['spineAnimType'];

		//console.log("Animation type: "+spineAnimType);

		preload.spines[imagefile] = document.createElement("div");
		preload.spines[imagefile].classList = "spine-player-item";
		preload.spines[imagefile].id = "spine-player_" + imagefile;

		//Add the spine viewer element the preload wrapper element
		main.elements.spineViewersHoldElem.appendChild(preload.spines[imagefile]);

		let spinesPath = assetBaseUrl + "spine/" + imagefile + "/";
		let skeletonJsonPath = spinesPath + "character.json";
		let atlasPath = spinesPath + "character.atlas";

		//Documentation
		//https://github.com/EsotericSoftware/spine-runtimes/tree/3.6/spine-ts
		//https://esotericsoftware.com/spine-player
		//https://esotericsoftware.com/spine-api-reference

		preload.spines[imagefile].spineWidget = new spine.SpineWidget("spine-player_" + imagefile, {
			json: skeletonJsonPath,
			atlas: atlasPath,
			atlasPages: ["character.png"],
			animation: "Em00", //This animation always exist, according to testing
			premultipliedAlpha: true,
			fitToCanvas: true,
			//scale: 0.5,
			backgroundColor: "#00000000",
			debug: false,
			//alpha: false,
			//defaultMix: 0,
			//viewport: viewports[spineAnimType],
			success: function (widget) {
				/*
				var animIndex = 0;
				widget.canvas.onclick = function () {
						animIndex++;
						var animations = widget.skeleton.data.animations;
						if (animIndex >= animations.length) animIndex = 0;
						widget.setAnimation(animations[animIndex].name);
				}
				*/

				//Pause the animation initially
				//Must be unpaused before when calling setAnimation() later
				//player.paused=true;
				widget.pause();

				//scene.spinePlayer.setAnimation("Wait", true);
				preloadedSpineViewers++;
				if (preloadedSpineViewers >= spineDataSet.size) {
					callback();
				}
			}
		});
	}
}

function preloadTABAResources() {
	for (let part in sceneData[scene.id].SCRIPTS) {
		let curPart = sceneData[scene.id].SCRIPTS[part];
		let folder = curPart.FOLDER;
		let script;
		if (scene.translated) {
			for (let tl of curPart.TRANSLATIONS) {
				if (tl.LANGUAGE == scene.language && tl.TRANSLATOR == scene.translator) {
					script = tl.SCRIPT;
					break;
				}
			}
		} else {
			script = curPart.SCRIPT
		}
		let path = "./TABAScenes/" + folder;
		for (let cmd of script) {
			let src = cmd.src;
			let type = cmd.type;
			let id = cmd.id;
			let fullPath;

			switch (type) {
				case "BG":
				case "EV":
				case "OV":
					if (src) {
						fullPath = assetBaseUrl + "imagenes/" + src.split("/")[src.split("/").length - 1];
					}
					break;
				case "TXT":
					if (src) {
						// fullPath = path + "/sounds/" + src.split("/")[src.split("/").length -1];
					}
					break;
				default:
					break;
			}
			if (fullPath != undefined && !fullPath.includes("non_resource")) {
				preload.files.add(fullPath.split("/")[fullPath.split("/").length - 1]);
				preload.paths.add(fullPath);
			}
		}
		preload.paths.delete(undefined);
		preload.iter = preload.paths.values();
		fileLoader(loadSceneResources);
	}
}

function preloadNecroResources(script) {
	let path = `./NecroScenes/${scene.id}`;
	for (let command of script) {
		let src;
		let cmd = command.split(",");
		switch (cmd[0]) {
			case "bg":
				src = assetBaseUrl + "imagenes/" + cmd[1] + ".png";
				break;
			case "bgmplay":
				src = constructBGMAudioPath(cmd[1].trim());
				break;
			case "msgvoicesync":
				src = constructVoiceAudioPath(cmd[5].trim());
				break;
			case "playmovie":
				src = `${path}/videos/${cmd[1]}.webm`;
				break;
			case "seplay":
				src = constructSEAudioPath(cmd[1].trim());
				break;
			case "voice":
				if (!cmd[1].includes("_i_men")) {
					src = constructVoiceAudioPath(cmd[1].trim());
				}
				break;
			default:
				break;
		}
		preload.paths.add(src);
	}
	preload.paths.delete(undefined);
	preload.iter = preload.paths.values();
	fileLoader(loadSceneResources);
}

function preloadOtogiResources(script) {
	let path = `./OtogiScenes/${scene.id.split("_")[1]}`;
	for (let cmd of script) {
		if (cmd.Voice != "") {
			preload.paths.add(constructVoiceAudioPath(cmd.Voice));
		}
		if (cmd.BGM != null) {
			preload.paths.add(constructBGMAudioPath(cmd.BGM));
		}
		if (cmd.SE != "") {
			preload.paths.add(constructSEAudioPath(cmd.SE));
		}
	}
	for (let img of sceneData[scene.id].SCRIPTS.PART1.images) {
		preload.paths.add(img);
	}
	preload.paths.delete(undefined);
	preload.iter = preload.paths.values();
	fileLoader(loadSceneResources);
}

function loadSceneResources() {
	let path = preload.iter.next().value;
	if (path == null || path == undefined) {
		if (preload.failed) {
			fileErrorPopup();
			return;
		}
		if (scene.type == H_TABA) {
			// Multi-part scenes may use the same files so using paths
			// doesn't always work.
			if (preload.files.size == Object.keys(preload.temp).length) {
				cleanupPreload();
				startScene();
				return;
			}
		} else {
			// I don't know why filenames doesn't work and paths does
			// for RPGX but I also don't care enough to find out.
			if (preload.paths.size == Object.keys(preload.temp).length) {
				cleanupPreload();
				startScene();
				return;
			}
		}
		//console.log("Error code: Some shit's not fucking loading");
		//console.log(loadSceneResources.caller);
		return;
	}
	main.elements.loadingFile.innerText = path;
	let fn = path.substr(path.lastIndexOf("/") + 1, path.lastIndexOf(".") - path.lastIndexOf("/") - 1);
	if (preload.temp[fn]) {
		loadSceneResources();
		return;
	}
	let ext = path.substr(path.lastIndexOf(".") + 1);
	if (ext == "png" || ext == "jpg" || ext == "webp") {
		loadImage(path, "tempPreloadImage", false, loadSceneResources);
	} else if (ext == "ogg" || ext == "m4a") {
		loadAudio(path, false, loadSceneResources);
	} else if (ext == "webm") {
		loadVideo(path, "tempPreloadImage", false, loadSceneResources);
	} else {
		console.error("Error, unexpected file extension: " + ext);
	}
}

function cleanupPreload() {
	preload.paths = new Set();
	preload.files = new Set();
	preload.failed = false;
	preload.failedPaths = [];
	preload.loaded = 0;
	main.elements.loadingWrap.style.visibility = "hidden";
}

function createCanvases(script, callback) {
	let evData = getCommandData(script, "<EV>", 0);
	evData = [...new Set(evData)];

	let totalItems = evData.length;
	let totalDone = 0;

	if (totalItems === 0) {
		callback();
		return;
	}

	for (let ev of evData) {
		createCanvas([ev], function callback2() {

			totalDone++;

			//Preloading finished
			if (totalItems === totalDone) {
				callback();
			}
		});
	}
}

/*
function createCGCanvases(ev, pairList=null){
	//console.log(ev + ", " + pairList)
	let prevParent;
	if(!preload.canvas.hasOwnProperty(ev) && pairList != null){
		let foundMatch = false;
		for(let pair of pairList){
			prevParent = pair.parent;
			if(ev == pair.parent){
				foundMatch = true;
				createCanvas([pair.parent]);
				break;
			} else if(ev == pair.child){
				foundMatch = true;
				createCanvas([pair.parent, pair.child]);
				break;	
			}
		}
		if(!foundMatch){
			// Sometimes EVs aren't listed in the pair list.
			if(prevParent == null){
				createCanvas([ev])
			} else {
				createCanvas([prevParent, ev]);
			}
		}
	} else {
		createCanvas([ev]);
	}
}
*/

function createCanvas(files, callback) {
	let name = files[files.length - 1];
	let canvas = document.createElement("canvas");
	canvas.id = name
	canvas.height = 720;
	canvas.width = 1280;
	main.elements.canvasHoldElem.append(canvas);

	drawImage(canvas, files[0], callback);

	canvas.classList.add("tempPreloadImage");
	preload.canvas[name] = canvas;
}

function drawImage(canvas, file, callback = null) {

	let ctx = canvas.getContext("2d");

	//If the special name "black" is used, just draw a black background instead of using any files
	if (file === "black") {
		ctx.fillStyle = "black";
		ctx.fillRect(0, 0, 1280, 720);

		if (callback != null) {
			callback();
		}
	}
	else {
		/*
		let image = new Image();
		image.onload = function() {
			
			ctx.drawImage(image, 0, 0, 1280, 720, 0, 0, 1280, 720);
			if(callback != null){
				callback();
			}
		}
		image.src = createImagePath(file);
		*/
		let path = createImagePath(file, ".png");

		let image = new Image();
		image.onload = function () {

			//The height and width of the scene image
			ctx.drawImage(image, 0, 0, image.naturalWidth, image.naturalHeight, 0, 0, 1280, 720);

			//When done call callback, if any
			if (callback != null) {
				callback();
			}
		}
		image.src = path;
	}
}

function createImagePath(file, ext = ".png") {
	return assetBaseUrl + "imagenes/" + file.toLowerCase() + ext;
}

function getCommandData(script, tag, idx = null) {
	let data = []
	for (let cmd of script) {
		if (cmd.startsWith(tag)) {
			if (idx != null) {
				data.push(cmd.substr(cmd.lastIndexOf(">") + 1).split(",")[idx]);
			} else {
				data.push(cmd.substr(cmd.lastIndexOf(">") + 1));
			}
		}
	}
	return data
}

// var trans = new Set();
// for(let key in sceneData){
// 	console.log(getCommandData(sceneData[key].script, "<TRANSITION>", 0));
// }

function constructImagePath(src, id, ext = ".png") {
	return assetBaseUrl + "imagenes/" + src.toLowerCase() + ext;
}
function constructVoiceAudioPath(src, id) {
	return assetBaseUrl + "audio/voices/" + src.toLowerCase() + ".ogg";
}

function constructBGMAudioPath(src) {
	return assetBaseUrl + "audio/bgm/" + src.toLowerCase() + ".ogg";
}

function constructSEAudioPath(src) {
	return assetBaseUrl + "audio/sfx/" + src.toLowerCase() + ".ogg";
}

function emptyTempPreload() {
	// Kill children causes some weird shit in CG mode for the canvas holder
	// for(let key in preload.canvas){
	// 	let child = preload.canvas[key];
	// 	child.parentElement.removeChild(child)
	// }
	preload.canvas = {};
	preload.temp = {};
	preload.paths = new Set();
	preload.files = new Set();
	killChildren(document.getElementById("preload-temp-elem"));
	killChildren(main.elements.canvasHoldElem);
}

function emptySpinePreload() {
	preload.currentSpine = null;
	//preload.spinesPaths=new Set();
	preload.spines = {};

	killChildren(main.elements.spineViewersHoldElem);
}

// var names = new Set();
// for(let key in sceneData){
// 	let curScene = sceneData[key];
// 	for(let cmd of curScene.script){
// 		if(cmd.startsWith("<NAME_PLATE>")){
// 			let name = cmd.substr(cmd.lastIndexOf(">") + 1);
// 			if(/[ａ-ｚＡ-Ｚ０-９？]/.test(name)){
// 				names.add(name.substr(0, /[ａ-ｚＡ-Ｚ０-９？]/.exec(name).index).trim());
// 			} else {
// 				names.add(name.trim());
// 			}
// 		}
// 	}
// }

function permPreload(paths) {
	preload.paths = new Set(paths);
	preload.paths.delete(undefined);
	preload.iter = preload.paths.values();
	displayLoadScreen();
	loadPermFiles();
}

function loadPermFiles() {
	let path = preload.iter.next().value;
	if (path == null || path == undefined) {
		if (preload.failed) {
			fileErrorPopup();
			return;
		} else {
			cleanupPreload();
			return;
		}
	}
	main.elements.loadingFile.innerText = path;
	let fn = path.substr(path.lastIndexOf("/") + 1, path.lastIndexOf(".") - path.lastIndexOf("/") - 1);
	if (preload.temp[fn]) {
		loadPermFiles();
		return;
	}
	loadImage(path, "permPreloadImage", true, loadPermFiles);
}

function errorLoading(path) {
	preload.failed = true;
	preload.failedPaths.push(path);
}

function fileErrorPopup() {
	main.elements.loadingError.style.visibility = "initial";
	main.elements.loadingErrorMsg.value = "The following files could not be loaded:\n"
	for (let error of preload.failedPaths) {
		main.elements.loadingErrorMsg.value += "    " + error + "\n";
	}
}

function closeError() {
	main.elements.loadingError.style.visibility = "hidden";
	main.elements.loadingErrorMsg.value = "";
	cleanupPreload();
	endScene();
}

function fileLoader(loadFunction) {
	for (let i = 0; i < prefs.viewer.fileLoaders; i++) {
		loadFunction();
	}
}

function updateProgress() {
	main.elements.loadingProgress.style.width = ((preload.loaded / preload.paths.size) * 100) + "%";
}

function loadImage(path, className, perm, callback) {
	let img = new Image();
	let fn = path.substr(path.lastIndexOf("/") + 1, path.lastIndexOf(".") - path.lastIndexOf("/") - 1);
	img.className = className;
	img.addEventListener("load", function () {
		if (perm) {
			preload.perm[fn] = img;
			preload.permElem.append(img);
		} else {
			preload.temp[fn] = img;
			preload.tempElem.append(img);
		}
		preload.loaded++;
		updateProgress();
		callback();
	}, { once: true });
	img.addEventListener("error", function () {
		errorLoading(path);
		callback();
	}, { once: true })
	img.src = path;
}

function loadVideo(path, className, perm, callback) {
	let vid = document.createElement("video");
	let fn = path.substr(path.lastIndexOf("/") + 1, path.lastIndexOf(".") - path.lastIndexOf("/") - 1);
	vid.className = className;
	vid.addEventListener("canplay", function () {
		if (perm) {
			preload.perm[fn] = vid;
			preload.permElem.append(vid);
		} else {
			preload.temp[fn] = vid;
			preload.tempElem.append(vid);
		}
		preload.loaded++;
		updateProgress();
		callback();
	}, { once: true });
	vid.addEventListener("error", function () {
		errorLoading(path);
		callback();
	}, { once: true })
	vid.src = path;
}

function loadAudio(path, perm, callback) {
	let audio = new Audio();
	let fn = path.substr(path.lastIndexOf("/") + 1, path.lastIndexOf(".") - path.lastIndexOf("/") - 1);
	audio.addEventListener("canplay", function () {
		if (perm) {
			preload.perm[fn] = audio;
		} else {
			preload.temp[fn] = audio;
		}
		preload.loaded++;
		updateProgress();
		callback();
	}, { once: true });
	audio.addEventListener("error", function () {
		errorLoading(path);
		callback();
	}, { once: true });
	audio.src = path;
}

async function loadAudioNow(path, type) {
	let o = preload.audio[type.toLowerCase()];
	o.src = "";
	try {
		await promiseFile(path, o);
	} catch (e) {
		console.log("Audio Load Error");
	}

	function promiseFile(path, obj) {
		return new Promise((resolve, reject) => {
			let audio = obj;
			audio.oncanplaythrough = () => resolve();
			audio.onerror = (e) => {
				//deleteElement(elem);
				errorLoading(path)
				reject()
			};
			audio.src = path;
		});
	}
}

async function loadBacklogVoice(path) {
	scene.current.backlogVoice.src = "";
	try {
		await promiseFile(path);
	} catch (e) {
		console.log("Backlog Audio Load Error");
	}

	function promiseFile(path) {
		return new Promise((resolve, reject) => {
			let audio = scene.current.backlogVoice;
			audio.oncanplaythrough = () => resolve();
			audio.onerror = () => {
				//deleteElement(elem);
				reject()
			};
			audio.src = path;
		});
	}
}