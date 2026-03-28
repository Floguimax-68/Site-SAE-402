// Canvas place au-dessus du fond pour afficher le chrono.
const canvasMinuteur = document.getElementById("canva-timer");

if (canvasMinuteur instanceof HTMLCanvasElement) {
	// Contexte 2D du minuteur.
	const ctx = canvasMinuteur.getContext("2d");
	// Image de la pancarte du chrono.
	const imagePancarte = new Image();
	imagePancarte.src = "img/pancarte-canva-chrono.webp";
	const sonTick = new Audio("img/sfx/Time-tick.wav");
	const sonTock = new Audio("img/sfx/Time-tock.wav");
	const sonBeep = new Audio("img/sfx/time-beep.wav");
	const sonTimeUp = new Audio("img/sfx/time-up.wav");
	const sonsChrono = [sonTick, sonTock, sonBeep, sonTimeUp];
	let sonsChronoInitialises = false;
	let prochainTicTac = "tick";

	const jouerSon = (audio) => {
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Ignore les blocages navigateur si pas encore d'interaction.
		});
	};

	const initialiserSonsChrono = () => {
		if (sonsChronoInitialises) {
			return;
		}

		for (let i = 0; i < sonsChrono.length; i = i + 1) {
			sonsChrono[i].preload = "auto";
			sonsChrono[i].load();
		}

		sonsChronoInitialises = true;
	};
	// Temps de depart en secondes.
	let tempsRestant = 60;
	// Reference de l'interval pour pouvoir l'arreter.
	let identifiantIntervalle = null;

	// Dessine la pancarte et la valeur du temps.
	const afficherMinuteur = () => {
		// Si pas de contexte, on ne dessine rien.
		if (!ctx) {
			return;
		}

		// Taille actuelle du canvas visible.
		const largeurVue = canvasMinuteur.clientWidth;
		const hauteurVue = canvasMinuteur.clientHeight;
		// Position en haut.
		const decalageHaut = 0;
		// Texte du chrono.
		const texteChrono = tempsRestant + "s";
		// Largeur de la pancarte avec min/max.
		const largeurPancarte = Math.max(165, Math.min(largeurVue * 0.31, 310));
		// Ratio de la pancarte pour garder sa forme.
		const ratioPancarte =
			imagePancarte.complete && imagePancarte.naturalWidth > 0
				? imagePancarte.naturalWidth / imagePancarte.naturalHeight
				: 1.75;
		// Calcul de la hauteur et position de la pancarte.
		const hauteurPancarte = largeurPancarte / ratioPancarte;
		const positionX = (largeurVue - largeurPancarte) / 2;
		const positionY = decalageHaut;

		// Zone interne ou on met le texte.
		const zoneTexteX = positionX + largeurPancarte * 0.16;
		const zoneTexteY = positionY + hauteurPancarte * 0.48;
		const largeurZoneTexte = largeurPancarte * 0.68;
		const hauteurZoneTexte = hauteurPancarte * 0.36;
		// Taille initiale de police.
		let taillePolice = Math.max(18, Math.round(hauteurZoneTexte * 0.7));

		// Efface l'ancien rendu.
		ctx.clearRect(0, 0, largeurVue, hauteurVue);

		// Dessine la pancarte si l'image est prete.
		if (imagePancarte.complete && imagePancarte.naturalWidth > 0) {
			ctx.drawImage(imagePancarte, positionX, positionY, largeurPancarte, hauteurPancarte);
		}

		// Definit la police du texte.
		ctx.font = "700 " + taillePolice + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		// Reduit la police si le texte depasse.
		while (taillePolice > 16 && ctx.measureText(texteChrono).width > largeurZoneTexte) {
			taillePolice = taillePolice - 1;
			ctx.font = "700 " + taillePolice + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		}

		// Style du texte puis dessin centre.
		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(texteChrono, zoneTexteX + largeurZoneTexte / 2, zoneTexteY + hauteurZoneTexte / 2);
	};

	// Ajuste le canvas du minuteur a l'ecran.
	const redimensionnerCanvasMinuteur = () => {
		// Taille de la fenetre et ratio ecran.
		const largeurVue = window.innerWidth;
		const hauteurVue = window.innerHeight;
		const ratioPixels = window.devicePixelRatio || 1;

		// Taille interne du canvas.
		canvasMinuteur.width = Math.floor(largeurVue * ratioPixels);
		canvasMinuteur.height = Math.floor(hauteurVue * ratioPixels);
		// Taille visuelle du canvas.
		canvasMinuteur.style.width = largeurVue + "px";
		canvasMinuteur.style.height = hauteurVue + "px";

		// Conserve un rendu net sur tous les ecrans.
		if (ctx) {
			ctx.setTransform(ratioPixels, 0, 0, ratioPixels, 0, 0);
		}

		// Redessine le minuteur apres resize.
		afficherMinuteur();
	};

	// Reagit aux changements de taille/orientation.
	window.addEventListener("resize", redimensionnerCanvasMinuteur);
	window.addEventListener("orientationchange", redimensionnerCanvasMinuteur);
	// Reagit au chargement de la pancarte.
	imagePancarte.addEventListener("load", afficherMinuteur);
	// Premier dessin.
	redimensionnerCanvasMinuteur();
	window.addEventListener("pointerdown", initialiserSonsChrono, { once: true });

	// Decompte: toutes les 1 seconde.
	identifiantIntervalle = setInterval(() => {
		// Tant qu'il reste du temps, on retire 1 seconde.
		if (tempsRestant > 0) {
			tempsRestant = tempsRestant - 1;

			if (tempsRestant <= 10 && tempsRestant > 3) {
				if (prochainTicTac === "tick") {
					jouerSon(sonTick);
					prochainTicTac = "tock";
				} else {
					jouerSon(sonTock);
					prochainTicTac = "tick";
				}
			}

			if (tempsRestant <= 3 && tempsRestant > 0) {
				jouerSon(sonBeep);
			}

			afficherMinuteur();
		}

		// A 0, on arrete et on envoie l'evenement de fin.
		if (tempsRestant === 0) {
			clearInterval(identifiantIntervalle);
			jouerSon(sonTimeUp);
			afficherMinuteur();
			window.dispatchEvent(new Event("minuteur-termine"));
		}
	}, 1000);

	// Si fin de partie, on arrete aussi le chrono.
	window.addEventListener("fin-de-partie", () => {
		if (identifiantIntervalle !== null) {
			clearInterval(identifiantIntervalle);
			identifiantIntervalle = null;
		}
	});
}
