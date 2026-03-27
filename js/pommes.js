const pommesCanvas = document.getElementById("canva-pommes");

if (pommesCanvas instanceof HTMLCanvasElement) {
	const ctx = pommesCanvas.getContext("2d");
	const appleImages = {
		yellow: new Image(),
		green: new Image(),
		red: new Image()
	};
	appleImages.yellow.src = "img/apple_golden_60x60px.png";
	appleImages.green.src = "img/apple_rotten_60x60px.png";
	appleImages.red.src = "img/apple_regular_60x60px.png";

	let animationId = null;
	let lastTime = 0;
	const balls = [];
	let isRunning = true;
	let spawnAccumulatorMs = 0;
	let nextBurstDelayMs = 800;
	let pxSouris = -1000;
	let pySouris = -1000;

	const randomRange = (min, max) => min + Math.random() * (max - min);

	const randomInt = (min, max) => {
		return Math.floor(randomRange(min, max + 1));
	};

	const pickBallType = () => {
		const roll = Math.random();

		if (roll < 0.1) {
			return "yellow";
		}

		if (roll < 0.25) {
			return "green";
		}

		return "red";
	};

	const resizePommesCanvas = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;

		pommesCanvas.width = Math.floor(viewportWidth * dpr);
		pommesCanvas.height = Math.floor(viewportHeight * dpr);
		pommesCanvas.style.width = viewportWidth + "px";
		pommesCanvas.style.height = viewportHeight + "px";

		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
	};

	const drawWorld = () => {
		if (!ctx) {
			return;
		}

		const viewportWidth = pommesCanvas.clientWidth;
		const viewportHeight = pommesCanvas.clientHeight;

		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		for (let i = 0; i < balls.length; i = i + 1) {
			const ball = balls[i];
			const img = appleImages[ball.type];
			const drawX = ball.px - ball.width / 2;
			const drawY = ball.py - ball.height / 2;

			if (img.complete && img.naturalWidth > 0) {
				ctx.drawImage(img, drawX, drawY, ball.width, ball.height);
			} else {
				ctx.fillStyle = "#e32626";
				ctx.fillRect(drawX, drawY, ball.width, ball.height);
			}
		}
	};

	const spawnBall = () => {
		const viewportWidth = pommesCanvas.clientWidth;
		const viewportHeight = pommesCanvas.clientHeight;
		const spriteSize = Math.max(50, Math.round(Math.min(viewportWidth, viewportHeight) * 0.07));
		const halfHeight = spriteSize / 2;
		const px = randomRange(viewportWidth * 0.15, viewportWidth * 0.85);
		const py = viewportHeight + halfHeight + randomRange(140, 260);

		const targetX = randomRange(viewportWidth * 0.25, viewportWidth * 0.75);
		const desiredApexY = randomRange(viewportHeight * 0.18, viewportHeight * 0.45);
		const ay = Math.max(1450, viewportHeight * 2.05);
		const vy = -Math.sqrt(Math.max(2 * ay * (py - desiredApexY), 1));
		const timeToApex = Math.abs(vy) / ay;
		const vx = (targetX - px) / timeToApex;
		const type = pickBallType();

		balls.push({
			px,
			py,
			vx,
			vy,
			ax: 0,
			ay,
			width: spriteSize,
			height: spriteSize,
			type
		});
	};

	const spawnBurst = () => {
		const count = randomInt(1, 2);

		for (let i = 0; i < count; i = i + 1) {
			spawnBall();
		}
	};

	const updateWorld = (dt) => {
		for (let i = balls.length - 1; i >= 0; i = i - 1) {
			const ball = balls[i];

			ball.vx = ball.vx + ball.ax * dt;
			ball.vy = ball.vy + ball.ay * dt;
			ball.px = ball.px + ball.vx * dt;
			ball.py = ball.py + ball.vy * dt;

			if (ball.py - ball.height / 2 > pommesCanvas.clientHeight + 160 && ball.vy > 0) {
				balls.splice(i, 1);
			}
		}

		spawnAccumulatorMs = spawnAccumulatorMs + dt * 1000;
		if (spawnAccumulatorMs >= nextBurstDelayMs) {
			spawnBurst();
			spawnAccumulatorMs = 0;
			nextBurstDelayMs = randomRange(520, 1100);
		}
	};

	const step = (timestamp) => {
		if (!isRunning) {
			return;
		}

		if (!lastTime) {
			lastTime = timestamp;
		}

		const dt = Math.min((timestamp - lastTime) / 1000, 0.032);
		lastTime = timestamp;

		updateWorld(dt);
		drawWorld();
		animationId = window.requestAnimationFrame(step);
	};

	const stopGame = () => {
		isRunning = false;

		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}

		balls.length = 0;
		drawWorld();
	};

	const removeTouchedBalls = () => {
		for (let i = balls.length - 1; i >= 0; i = i - 1) {
			const ball = balls[i];
			const left = ball.px - ball.width / 2;
			const right = ball.px + ball.width / 2;
			const top = ball.py - ball.height / 2;
			const bottom = ball.py + ball.height / 2;

			if (pxSouris >= left && pxSouris <= right && pySouris >= top && pySouris <= bottom) {
				balls.splice(i, 1);
			}
		}
	};

	window.addEventListener("resize", () => {
		resizePommesCanvas();
		drawWorld();
	});
	window.addEventListener("orientationchange", () => {
		resizePommesCanvas();
		drawWorld();
	});
	window.addEventListener("timer-ended", stopGame);
	pommesCanvas.addEventListener("mousemove", (event) => {
		const rect = pommesCanvas.getBoundingClientRect();
		pxSouris = event.clientX - rect.left;
		pySouris = event.clientY - rect.top;
		removeTouchedBalls();
	});
	pommesCanvas.addEventListener("touchmove", (event) => {
		const rect = pommesCanvas.getBoundingClientRect();
		const touch = event.touches[0];
		pxSouris = touch.clientX - rect.left;
		pySouris = touch.clientY - rect.top;
		removeTouchedBalls();
	});
	pommesCanvas.addEventListener("touchstart", (event) => {
		const rect = pommesCanvas.getBoundingClientRect();
		const touch = event.touches[0];
		pxSouris = touch.clientX - rect.left;
		pySouris = touch.clientY - rect.top;
		removeTouchedBalls();
	});

	resizePommesCanvas();
	spawnBurst();
	animationId = window.requestAnimationFrame(step);
}
