// Canvas place au-dessus du fond pour afficher le chrono.
const timerCanvas = document.getElementById("canva-timer");

if (timerCanvas instanceof HTMLCanvasElement) {
	// Contexte 2D du timer.
	const ctx = timerCanvas.getContext("2d");
	// Image de la pancarte du chrono.
	const chronoPanelImage = new Image();
	chronoPanelImage.src = "img/pancarte-canva-chrono.png";
	// Temps de depart en secondes.
	let t = 60;
	// Reference de l'interval pour pouvoir l'arreter.
	let intervalId = null;

	// Dessine la pancarte et la valeur du temps.
	const renderTimer = () => {
		// Si pas de contexte, on ne dessine rien.
		if (!ctx) {
			return;
		}

		// Taille actuelle du canvas visible.
		const viewportWidth = timerCanvas.clientWidth;
		const viewportHeight = timerCanvas.clientHeight;
		// Position en haut.
		const topOffset = 0;
		// Texte du chrono.
		const label = t + "s";
		// Largeur de la pancarte avec min/max.
		const badgeWidth = Math.max(165, Math.min(viewportWidth * 0.31, 310));
		// Ratio de la pancarte pour garder sa forme.
		const panelRatio =
			chronoPanelImage.complete && chronoPanelImage.naturalWidth > 0
				? chronoPanelImage.naturalWidth / chronoPanelImage.naturalHeight
				: 1.75;
		// Calcul de la hauteur et position de la pancarte.
		const badgeHeight = badgeWidth / panelRatio;
		const badgeX = (viewportWidth - badgeWidth) / 2;
		const badgeY = topOffset;

		// Zone interne ou on met le texte.
		const textBoxX = badgeX + badgeWidth * 0.16;
		const textBoxY = badgeY + badgeHeight * 0.48;
		const textBoxWidth = badgeWidth * 0.68;
		const textBoxHeight = badgeHeight * 0.36;
		// Taille initiale de police.
		let fontSize = Math.max(18, Math.round(textBoxHeight * 0.7));

		// Efface l'ancien rendu.
		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		// Dessine la pancarte si l'image est prete.
		if (chronoPanelImage.complete && chronoPanelImage.naturalWidth > 0) {
			ctx.drawImage(chronoPanelImage, badgeX, badgeY, badgeWidth, badgeHeight);
		}

		// Definit la police du texte.
		ctx.font = "700 " + fontSize + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		// Reduit la police si le texte depasse.
		while (fontSize > 16 && ctx.measureText(label).width > textBoxWidth) {
			fontSize = fontSize - 1;
			ctx.font = "700 " + fontSize + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		}

		// Style du texte puis dessin centre.
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, textBoxX + textBoxWidth / 2, textBoxY + textBoxHeight / 2);
	};

	// Ajuste le canvas du timer a l'ecran.
	const resizeTimerCanvas = () => {
		// Taille de la fenetre et ratio ecran.
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;

		// Taille interne du canvas.
		timerCanvas.width = Math.floor(viewportWidth * dpr);
		timerCanvas.height = Math.floor(viewportHeight * dpr);
		// Taille visuelle du canvas.
		timerCanvas.style.width = viewportWidth + "px";
		timerCanvas.style.height = viewportHeight + "px";

		// Conserve un rendu net sur tous les ecrans.
		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		// Redessine le timer apres resize.
		renderTimer();
	};

	// Reagit aux changements de taille/orientation.
	window.addEventListener("resize", resizeTimerCanvas);
	window.addEventListener("orientationchange", resizeTimerCanvas);
	// Reagit au chargement de la pancarte.
	chronoPanelImage.addEventListener("load", renderTimer);
	// Premier dessin.
	resizeTimerCanvas();

	// Decompte: toutes les 1 seconde.
	intervalId = setInterval(() => {
		// Tant qu'il reste du temps, on retire 1 seconde.
		if (t > 0) {
			t = t - 1;
			renderTimer();
		}

		// A 0, on arrete et on envoie l'evenement de fin.
		if (t === 0) {
			clearInterval(intervalId);
			renderTimer();
			window.dispatchEvent(new Event("timer-ended"));
		}
	}, 1000);

	// Si game over, on arrete aussi le chrono.
	window.addEventListener("game-over", () => {
		if (intervalId !== null) {
			clearInterval(intervalId);
			intervalId = null;
		}
	});
}
