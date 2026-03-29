// Element canvas dedie a l'affichage du chronometre.
const canvasMinuteur = document.getElementById("canva-timer");

if (canvasMinuteur instanceof HTMLCanvasElement) {
	// Contexte 2D utilise pour dessiner le minuteur.
	const ctx = canvasMinuteur.getContext("2d");
	// Objet image contenant la pancarte visuelle du chrono.
	const imagePancarte = new Image();
	imagePancarte.src = "img/pancarte-canva-chrono.webp";
	// Son joue sur un battement du tic-tac.
	const sonTick = new Audio("img/sfx/Time-tick.wav");
	// Son joue sur l'autre battement du tic-tac.
	const sonTock = new Audio("img/sfx/Time-tock.wav");
	// Son d'alerte dans les dernieres secondes.
	const sonBeep = new Audio("img/sfx/time-beep.wav");
	// Son final joue quand le temps est ecoule.
	const sonTimeUp = new Audio("img/sfx/time-up.wav");
	// Tableau regroupant tous les sons du chrono pour les precharger.
	const sonsChrono = [sonTick, sonTock, sonBeep, sonTimeUp];
	// Indique si les sons du chrono ont deja ete initialises.
	let sonsChronoInitialises = false;
	// Alterne entre tick et tock pour l'effet sonore.
	let prochainTicTac = "tick";

	// Fonction utilitaire pour jouer un son en repartant du debut.
	function jouerSon(audio) {
		audio.currentTime = 0;
		audio.play().catch(function () {
			// Ignore les blocages navigateur si pas encore d'interaction.
		});
	}

	// Initialise et precharge les fichiers audio du chronometre.
	function initialiserSonsChrono() {
		if (sonsChronoInitialises) {
			return;
		}

		// Index de boucle pour parcourir chaque son du tableau.
		for (let i = 0; i < sonsChrono.length; i = i + 1) {
			sonsChrono[i].preload = "auto";
			sonsChrono[i].load();
		}

		sonsChronoInitialises = true;
	}
	// Valeur du compte a rebours en secondes.
	let tempsRestant = 60;
	// Identifiant de l'intervalle pour pouvoir l'arreter proprement.
	let identifiantIntervalle = null;

	// Dessine la pancarte et la valeur du temps.
	function afficherMinuteur() {
		// Si pas de contexte, on ne dessine rien.
		if (!ctx) {
			return;
		}

		// Largeur visible du canvas minuteur.
		const largeurVue = canvasMinuteur.clientWidth;
		// Hauteur visible du canvas minuteur.
		const hauteurVue = canvasMinuteur.clientHeight;
		// Decalage vertical global de la pancarte depuis le haut.
		const decalageHaut = 0;
		// Chaine affichee (ex: 57s) au centre de la pancarte.
		const texteChrono = tempsRestant + "s";
		// Largeur de rendu de la pancarte, limitee pour rester lisible.
		const largeurPancarte = Math.max(165, Math.min(largeurVue * 0.31, 310));
		// Ratio de l'image de pancarte pour conserver ses proportions.
		const ratioPancarte =
			imagePancarte.complete && imagePancarte.naturalWidth > 0
				? imagePancarte.naturalWidth / imagePancarte.naturalHeight
				: 1.75;
		// Hauteur calculee de la pancarte a partir du ratio.
		const hauteurPancarte = largeurPancarte / ratioPancarte;
		// Position X de la pancarte (centree horizontalement).
		const positionX = (largeurVue - largeurPancarte) / 2;
		// Position Y de la pancarte (decalee vers le haut).
		const positionY = decalageHaut;

		// Position X de la zone interne reservee au texte.
		const zoneTexteX = positionX + largeurPancarte * 0.16;
		// Position Y de la zone interne reservee au texte.
		const zoneTexteY = positionY + hauteurPancarte * 0.48;
		// Largeur disponible pour afficher le texte du chrono.
		const largeurZoneTexte = largeurPancarte * 0.68;
		// Hauteur disponible pour afficher le texte du chrono.
		const hauteurZoneTexte = hauteurPancarte * 0.36;
		// Taille de police initiale, ajustee ensuite si le texte deborde.
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
	}

	// Fonction qui ajuste le canvas minuteur a la taille de l'ecran.
	function redimensionnerCanvasMinuteur() {
		// Largeur de la fenetre pour la taille CSS du canvas.
		const largeurVue = window.innerWidth;
		// Hauteur de la fenetre pour la taille CSS du canvas.
		const hauteurVue = window.innerHeight;
		// Ratio de pixels de l'ecran pour un rendu net.
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
	}

	// Reagit aux changements de taille/orientation.
	window.addEventListener("resize", redimensionnerCanvasMinuteur);
	window.addEventListener("orientationchange", redimensionnerCanvasMinuteur);
	// Reagit au chargement de la pancarte.
	imagePancarte.addEventListener("load", afficherMinuteur);
	// Premier dessin.
	redimensionnerCanvasMinuteur();
	window.addEventListener("pointerdown", initialiserSonsChrono, { once: true });

	// Decompte: toutes les 1 seconde.
	identifiantIntervalle = setInterval(function () {
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
	window.addEventListener("fin-de-partie", function () {
		if (identifiantIntervalle !== null) {
			clearInterval(identifiantIntervalle);
			identifiantIntervalle = null;
		}
	});
}
