import WindowManager from './WindowManager.js';

const t = THREE;
let camera, scene, renderer, world;
let near, far;
let pixR = window.devicePixelRatio ? window.devicePixelRatio : 1;
let cubes = [];
let sceneOffsetTarget = { x: 0, y: 0 };
let sceneOffset = { x: 0, y: 0 };

let today = new Date();
today.setHours(0);
today.setMinutes(0);
today.setSeconds(0);
today.setMilliseconds(0);
today = today.getTime();

let internalTime = getTime();
let windowManager;
let initialized = false;

let dodecahedronSizeFactor = 1.0; // Initial size factor

// get time in seconds since the beginning of the day (so that all windows use the same time)
function getTime() {
	return (new Date().getTime() - today) / 1000.0;
}

if (new URLSearchParams(window.location.search).get("clear")) {
	localStorage.clear();
} else {
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState != 'hidden' && !initialized) {
			init();
		}
	});

	window.onload = () => {
		if (document.visibilityState != 'hidden') {
			init();
		}
	};

	function init() {
		initialized = true;

		setTimeout(() => {
			setupScene();
			setupWindowManager();
			resize();
			updateWindowShape(false);
			render();
			window.addEventListener('resize', resize);
		}, 500)
	}

	function setupScene() {
		camera = new t.OrthographicCamera(0, 0, window.innerWidth, window.innerHeight, -10000, 10000);

		camera.position.z = 2.5;
		near = camera.position.z - .5;
		far = camera.position.z + 0.5;

		scene = new t.Scene();
		scene.background = new t.Color(0.0);
		scene.add(camera);

		renderer = new t.WebGLRenderer({ antialias: true, depthBuffer: true });
		renderer.setPixelRatio(pixR);

		world = new t.Object3D();
		scene.add(world);

		renderer.domElement.setAttribute("id", "scene");
		document.body.appendChild(renderer.domElement);
	}

	function setupWindowManager() {
		windowManager = new WindowManager();
		windowManager.setWinShapeChangeCallback(updateWindowShape);
		windowManager.setWinChangeCallback(windowsUpdated);

		let metaData = { foo: "bar" };

		windowManager.init(metaData);

		windowsUpdated();
	}

	function windowsUpdated() {
		updateNumberOfCubes();
	}

	function updateNumberOfCubes() {
		let wins = windowManager.getWindows();

		cubes.forEach((cube) => {
			world.remove(cube);
		})

		cubes = [];

		for (let i = 0; i < wins.length; i++) {
			let win = wins[i];

			let c = new t.Color();
			c.setHSL(i * .1, 1.0, .5);

			let s = 100 + i * 50 * dodecahedronSizeFactor; // Adjust the size based on the factor
			let cube = new t.Mesh(new t.DodecahedronGeometry(s, 0), new t.MeshBasicMaterial({ color: c, wireframe: true }));
			cube.position.x = win.shape.x + (win.shape.w * .5);
			cube.position.y = win.shape.y + (win.shape.h * .5);

			world.add(cube);
			cubes.push(cube);
		}
	}

	function updateWindowShape(easing = true) {
		sceneOffsetTarget = { x: -window.screenX, y: -window.screenY };
		if (!easing) sceneOffset = sceneOffsetTarget;
	}

	function updateDodecahedronColors() {
		let wins = windowManager.getWindows();

		for (let i = 0; i < cubes.length; i++) {
			let cube = cubes[i];
			let win = wins[i];

			let hue = (getTime() * 0.1 + i * 0.1) % 1.0; // Adjust the speed of color change here
			let c = new t.Color();
			c.setHSL(hue, 1.0, 0.5);

			cube.material.color = c;
		}
	}


	function render() {
		let currentTime = getTime();

		windowManager.update();

		let falloff = 0.05;
		sceneOffset.x = sceneOffset.x + ((sceneOffsetTarget.x - sceneOffset.x) * falloff);
		sceneOffset.y = sceneOffset.y + ((sceneOffsetTarget.y - sceneOffset.y) * falloff);

		world.position.x = sceneOffset.x;
		world.position.y = sceneOffset.y;

		updateDodecahedronColors();

		dodecahedronSizeFactor = 1.0 + Math.sin(currentTime * 0.5) * 0.5; // Example size factor modulation
		updateNumberOfCubes();

		let wins = windowManager.getWindows();

		for (let i = 0; i < cubes.length; i++) {
			let cube = cubes[i];
			let win = wins[i];

			let posTarget = { x: win.shape.x + (win.shape.w * 0.5), y: win.shape.y + (win.shape.h * 0.5) }

			cube.position.x = cube.position.x + (posTarget.x - cube.position.x) * falloff;
			cube.position.y = cube.position.y + (posTarget.y - cube.position.y) * falloff;
			cube.rotation.x = currentTime * 0.5;
			cube.rotation.y = currentTime * 0.3;
		}

		renderer.render(scene, camera);
		requestAnimationFrame(render);
	}

	function resize() {
		let width = window.innerWidth;
		let height = window.innerHeight

		camera = new t.OrthographicCamera(0, width, 0, height, -10000, 10000);
		camera.updateProjectionMatrix();
		renderer.setSize(width, height);
	}


	// Start the animation loop
	render();
}
