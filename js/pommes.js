// Canvas principal des pommes (gameplay).
const pommesCanvas = document.getElementById("canva-pommes");

if (pommesCanvas instanceof HTMLCanvasElement) {
	// Contexte 2D pour dessiner les pommes.
	const ctx = pommesCanvas.getContext("2d");
	// Overlay game over + bouton recommencer.
	const gameOverOverlay = document.getElementById("game-over-overlay");
	const restartButton = document.getElementById("restart-button");
	// Images des trois types de pommes.
	const appleImages = {
		yellow: new Image(),
		green: new Image(),
		red: new Image()
	};
	// Chemins des images.
	appleImages.yellow.src = "img/apple_golden_60x60px.png";
	appleImages.green.src = "img/apple_rotten_60x60px.png";
	appleImages.red.src = "img/apple_regular_60x60px.png";

	// Variables principales de la boucle du jeu.
	let animationId = null;
	let lastTime = 0;
	const balls = [];
	let isRunning = true;
	let spawnAccumulatorMs = 0;
	let nextBurstDelayMs = 800;
	// Position pointeur (souris/doigt).
	let pxSouris = -1000;
	let pySouris = -1000;
	// Affichage de la zone de contact tactile.
	let showTouchZone = false;
	let touchZoneX = -1000;
	let touchZoneY = -1000;
	const touchZoneRadius = 9;
	// Evite de declencher game over plusieurs fois.
	let hasGameOver = false;

	// Nombre aleatoire entre min et max.
	const randomRange = (min, max) => min + Math.random() * (max - min);

	// Nombre entier aleatoire entre min et max inclus.
	const randomInt = (min, max) => {
		return Math.floor(randomRange(min, max + 1));
	};

	// Choisit le type de pomme selon les probabilites.
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

	// Redimensionne le canvas des pommes.
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

	// Dessine toutes les pommes et la zone tactile.
	const drawWorld = () => {
		if (!ctx) {
			return;
		}

		const viewportWidth = pommesCanvas.clientWidth;
		const viewportHeight = pommesCanvas.clientHeight;

		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		for (let i = 0; i < balls.length; i = i + 1) {
			const ball = balls[i];
			// Image selon le type de pomme.
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

		// Cercle qui montre la zone du doigt.
		if (showTouchZone) {
			ctx.save();
			ctx.strokeStyle = "#00cc00";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(touchZoneX, touchZoneY, touchZoneRadius, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
	};

	// Cree une nouvelle pomme avec physique initiale.
	const spawnPommes = () => {
		const viewportWidth = pommesCanvas.clientWidth;
		const viewportHeight = pommesCanvas.clientHeight;
		// Taille fixe des pommes.
		const appleSize = 52;
		const halfHeight = appleSize / 2;
		// Position de depart en bas de l'ecran.
		const px = randomRange(viewportWidth * 0.15, viewportWidth * 0.85);
		const py = viewportHeight + halfHeight + randomRange(140, 260);

		// Point vise en hauteur pour la trajectoire.
		const targetX = randomRange(viewportWidth * 0.25, viewportWidth * 0.75);
		const desiredApexY = randomRange(viewportHeight * 0.18, viewportHeight * 0.45);
		// Gravite et vitesses de depart.
		const ay = Math.max(1450, viewportHeight * 2.05);
		const vy = -Math.sqrt(Math.max(2 * ay * (py - desiredApexY), 1));
		const timeToApex = Math.abs(vy) / ay;
		const vx = (targetX - px) / timeToApex;
		const type = pickBallType();

		// Ajoute la pomme dans le tableau.
		balls.push({
			px,
			py,
			vx,
			vy,
			ax: 0,
			ay,
			width: appleSize,
			height: appleSize,
			type
		});
	};

	// Fait apparaitre 1 ou 2 pommes d'un coup.
	const spawnBurst = () => {
		const count = randomInt(1, 2);

		for (let i = 0; i < count; i = i + 1) {
			spawnPommes();
		}
	};

	// Met a jour la physique et les collisions.
	const updateWorld = (dt) => {
		const worldWidth = pommesCanvas.clientWidth;
		const worldHeight = pommesCanvas.clientHeight;

		// 1) Deplacement + rebond sur les bords + suppression hors ecran bas.
		for (let i = balls.length - 1; i >= 0; i = i - 1) {
			const ball = balls[i];
			const halfWidth = ball.width / 2;
			const halfHeight = ball.height / 2;

			ball.vx = ball.vx + ball.ax * dt;
			ball.vy = ball.vy + ball.ay * dt;
			ball.px = ball.px + ball.vx * dt;
			ball.py = ball.py + ball.vy * dt;

			if (ball.px - halfWidth <= 0) {
				// Mur gauche.
				ball.px = halfWidth;
				ball.vx = -ball.vx;
			}

			if (ball.px + halfWidth >= worldWidth) {
				// Mur droit.
				ball.px = worldWidth - halfWidth;
				ball.vx = -ball.vx;
			}

			if (ball.py - halfHeight <= 0) {
				// Mur haut.
				ball.py = halfHeight;
				ball.vy = -ball.vy;
			}

			if (ball.py - halfHeight > worldHeight + 160 && ball.vy > 0) {
				// Supprime si la pomme sort en bas.
				balls.splice(i, 1);
			}
		}

		// 2) Collision simple entre pommes.
		for (let i = 0; i < balls.length; i = i + 1) {
			const ballA = balls[i];
			const radiusA = ballA.width / 2;

			for (let j = i + 1; j < balls.length; j = j + 1) {
				const ballB = balls[j];
				const radiusB = ballB.width / 2;
				const dx = ballB.px - ballA.px;
				const dy = ballB.py - ballA.py;
				const minDist = radiusA + radiusB;
				const distSq = dx * dx + dy * dy;

				// Si elles se touchent, separation + echange de vitesse.
				if (distSq > 0 && distSq <= minDist * minDist) {
					const dist = Math.sqrt(distSq);
					const overlap = minDist - dist;
					const nx = dx / dist;
					const ny = dy / dist;

					ballA.px = ballA.px - nx * overlap * 0.5;
					ballA.py = ballA.py - ny * overlap * 0.5;
					ballB.px = ballB.px + nx * overlap * 0.5;
					ballB.py = ballB.py + ny * overlap * 0.5;

					const tempVx = ballA.vx;
					const tempVy = ballA.vy;
					ballA.vx = ballB.vx;
					ballA.vy = ballB.vy;
					ballB.vx = tempVx;
					ballB.vy = tempVy;
				}
			}
		}

		// 3) Apparition des nouvelles pommes selon un delai aleatoire.
		spawnAccumulatorMs = spawnAccumulatorMs + dt * 1000;
		if (spawnAccumulatorMs >= nextBurstDelayMs) {
			spawnBurst();
			spawnAccumulatorMs = 0;
			nextBurstDelayMs = randomRange(520, 1100);
		}
	};

	// Boucle d'animation (appelee a chaque frame).
	const step = (timestamp) => {
		if (!isRunning) {
			return;
		}

		if (!lastTime) {
			lastTime = timestamp;
		}

		const dt = Math.min((timestamp - lastTime) / 1000, 0.032);
		lastTime = timestamp;

		// Mise a jour puis dessin.
		updateWorld(dt);
		drawWorld();
		animationId = window.requestAnimationFrame(step);
	};

	// Arrete la partie et vide les pommes.
	const stopGame = () => {
		isRunning = false;

		if (animationId !== null) {
			cancelAnimationFrame(animationId);
			animationId = null;
		}

		balls.length = 0;
		drawWorld();
	};

	// Affiche l'overlay GAME OVER.
	const showGameOver = () => {
		if (hasGameOver) {
			return;
		}

		hasGameOver = true;
		stopGame();
		window.dispatchEvent(new Event("game-over"));

		if (gameOverOverlay instanceof HTMLElement) {
			gameOverOverlay.classList.add("is-visible");
			gameOverOverlay.setAttribute("aria-hidden", "false");
		}
	};

	// Detecte les pommes touchees par souris/doigt.
	const removeTouchedBalls = (contactRadius = 0) => {
		let touchedRottenApple = false;

		for (let i = balls.length - 1; i >= 0; i = i - 1) {
			const ball = balls[i];
			// Rectangle de la pomme.
			const left = ball.px - ball.width / 2;
			const right = ball.px + ball.width / 2;
			const top = ball.py - ball.height / 2;
			const bottom = ball.py + ball.height / 2;
			// Collision point (souris/doigt).
			const insideRect = pxSouris >= left && pxSouris <= right && pySouris >= top && pySouris <= bottom;

			if (insideRect) {
				// Pomme verte = game over.
				if (ball.type === "green") {
					touchedRottenApple = true;
				}
				balls.splice(i, 1);
				continue;
			}

			if (contactRadius > 0) {
				// Collision cercle (zone tactile) contre rectangle.
				const nearestX = Math.max(left, Math.min(pxSouris, right));
				const nearestY = Math.max(top, Math.min(pySouris, bottom));
				const dx = pxSouris - nearestX;
				const dy = pySouris - nearestY;
				if (dx * dx + dy * dy <= contactRadius * contactRadius) {
					if (ball.type === "green") {
						touchedRottenApple = true;
					}
					balls.splice(i, 1);
				}
			}
		}

		// Fin de partie si une pomme pourrie est touchee.
		if (touchedRottenApple) {
			showGameOver();
		}
	};

	// Redessine si l'ecran change.
	window.addEventListener("resize", () => {
		resizePommesCanvas();
		drawWorld();
	});
	window.addEventListener("orientationchange", () => {
		resizePommesCanvas();
		drawWorld();
	});
	// Arret si le timer est termine.
	window.addEventListener("timer-ended", stopGame);
	// Souris: met a jour la position de coupe.
	pommesCanvas.addEventListener("mousemove", (event) => {
		const rect = pommesCanvas.getBoundingClientRect();
		pxSouris = event.clientX - rect.left;
		pySouris = event.clientY - rect.top;
		showTouchZone = false;
		removeTouchedBalls();
	});
	// Debut du contact tactile.
	pommesCanvas.addEventListener("pointerdown", (event) => {
		if (event.pointerType !== "touch") {
			return;
		}
		const rect = pommesCanvas.getBoundingClientRect();
		touchZoneX = event.clientX - rect.left;
		touchZoneY = event.clientY - rect.top;
		pxSouris = touchZoneX;
		pySouris = touchZoneY;
		showTouchZone = true;
		removeTouchedBalls(touchZoneRadius);
	});
	// Deplacement souris/doigt.
	pommesCanvas.addEventListener("pointermove", (event) => {
		const rect = pommesCanvas.getBoundingClientRect();
		pxSouris = event.clientX - rect.left;
		pySouris = event.clientY - rect.top;

		// Si tactile, active la zone ronde autour du doigt.
		if (event.pointerType === "touch") {
			touchZoneX = pxSouris;
			touchZoneY = pySouris;
			showTouchZone = true;
			removeTouchedBalls(touchZoneRadius);
			return;
		}

		showTouchZone = false;
		removeTouchedBalls();
	});
	// Cache la zone tactile quand le contact se termine.
	pommesCanvas.addEventListener("pointerup", () => {
		showTouchZone = false;
	});
	pommesCanvas.addEventListener("pointercancel", () => {
		showTouchZone = false;
	});
	pommesCanvas.addEventListener("pointerleave", () => {
		showTouchZone = false;
	});
	// Evite le scroll de la page pendant le glisse tactile sur le canvas.
	document.addEventListener("touchmove", (event) => {
		if (event.target === pommesCanvas) {
			event.preventDefault();
		}
	}, { passive: false });

	// Bouton recommencer: recharge la page.
	if (restartButton instanceof HTMLButtonElement) {
		restartButton.addEventListener("click", () => {
			window.location.reload();
		});
	}

	// Initialisation du jeu.
	resizePommesCanvas();
	spawnBurst();
	animationId = window.requestAnimationFrame(step);
}
