       // Canvas principal des pommes (gameplay).
const canvasPommes = document.getElementById("canva-pommes");

if (canvasPommes instanceof HTMLCanvasElement) {
	// Contexte 2D pour dessiner les pommes.
	const ctx = canvasPommes.getContext("2d");
	// Overlay fin de partie + bouton recommencer.
	const overlayFinPartie = document.getElementById("game-over-overlay");
	const boutonRecommencer = document.getElementById("restart-button");
	// Images des trois types de pommes.
	const imagesPommes = {
		jaune: new Image(),
		verte: new Image(),
		rouge: new Image()
	};
	// Chemins des images.
	imagesPommes.jaune.src = "img/apple_golden_60x60px.webp";
	imagesPommes.verte.src = "img/apple_rotten_60x60px.webp";
	imagesPommes.rouge.src = "img/apple_regular_60x60px.webp";

	const sonPommeClassique = new Audio("img/sfx/Impact-Plum.wav");
	const sonComboDoree = new Audio("img/sfx/combo-1.wav");
	const sonPommePourrie = new Audio("img/sfx/freesound_community-small-explosion-106769.mp3");
	const sonMort = new Audio("img/sfx/freesound_community-videogame-death-sound-43894.mp3");
	const sonImpact = new Audio("img/sfx/Impact.wav");
	const sonThrowFruit = new Audio("img/sfx/Throw-fruit.wav");
	sonThrowFruit.volume = 0.45;
	const sonsJeu = [sonPommeClassique, sonComboDoree, sonPommePourrie, sonMort, sonImpact, sonThrowFruit];
	let sonsInitialises = false;

	const initialiserSons = () => {
		if (sonsInitialises) {
			return;
		}

		for (let i = 0; i < sonsJeu.length; i = i + 1) {
			sonsJeu[i].preload = "auto";
			sonsJeu[i].load();
		}

		sonsInitialises = true;
	};

	const jouerSon = (audio) => {
		audio.currentTime = 0;
		audio.play().catch(() => {
			// Ignore les blocages navigateur si aucun geste utilisateur.
		});
	};

	// Variables principales de la boucle du jeu.
	let identifiantAnimation = null;
	let dernierTemps = 0;
	const pommesActives = [];
	let jeuActif = true;
	let cumulApparitionMs = 0;
	let prochainDelaiApparitionMs = 800;
	// Position pointeur (souris/doigt).
	let positionSourisX = -1000;
	let positionSourisY = -1000;
	// Affichage de la zone de contact tactile.
	let afficherZoneTactile = false;
	let zoneTactileX = -1000;
	let zoneTactileY = -1000;
	const rayonZoneTactile = 9;
	// Evite de declencher fin de partie plusieurs fois.
	let finPartieDeclenchee = false;
	let points = 0;

	const affichagePoints = document.createElement("div");
	affichagePoints.textContent = points + " pts";
	affichagePoints.style.position = "fixed";
	affichagePoints.style.top = "10px";
	affichagePoints.style.right = "10px";
	affichagePoints.style.zIndex = "1000";
	affichagePoints.style.fontSize = "36px";
	affichagePoints.style.fontWeight = "700";
	affichagePoints.style.fontFamily = "'Trebuchet MS', 'Segoe UI', sans-serif";
	affichagePoints.style.color = "#ffffff";
	document.body.appendChild(affichagePoints);

	const mettreAJourAffichagePoints = () => {
		affichagePoints.textContent = points + " pts";
	};

	// Nombre aleatoire entre min et max.
	const aleatoireEntre = (min, max) => min + Math.random() * (max - min);

	// Nombre entier aleatoire entre min et max inclus.
	const entierAleatoireEntre = (min, max) => {
		return Math.floor(aleatoireEntre(min, max + 1));
	};

	// Choisit le type de pomme selon les probabilites.
	const choisirTypePomme = () => {
		const tirage = Math.random();

		if (tirage < 0.1) {
			return "jaune";
		}

		if (tirage < 0.25) {
			return "verte";
		}

		return "rouge";
	};

	// Redimensionne le canvas des pommes.
	const redimensionnerCanvasPommes = () => {
		const largeurVue = window.innerWidth;
		const hauteurVue = window.innerHeight;
		const ratioPixels = window.devicePixelRatio || 1;

		canvasPommes.width = Math.floor(largeurVue * ratioPixels);
		canvasPommes.height = Math.floor(hauteurVue * ratioPixels);
		canvasPommes.style.width = largeurVue + "px";
		canvasPommes.style.height = hauteurVue + "px";

		if (ctx) {
			ctx.setTransform(ratioPixels, 0, 0, ratioPixels, 0, 0);
		}
	};

	// Dessine toutes les pommes et la zone tactile.
	const dessinerMonde = () => {
		if (!ctx) {
			return;
		}

		const largeurVue = canvasPommes.clientWidth;
		const hauteurVue = canvasPommes.clientHeight;

		ctx.clearRect(0, 0, largeurVue, hauteurVue);

		for (let i = 0; i < pommesActives.length; i = i + 1) {
			const pomme = pommesActives[i];
			// Image selon le type de pomme.
			const image = imagesPommes[pomme.type];
			const xDessin = pomme.posX - pomme.largeur / 2;
			const yDessin = pomme.posY - pomme.hauteur / 2;

			if (image.complete && image.naturalWidth > 0) {
				ctx.drawImage(image, xDessin, yDessin, pomme.largeur, pomme.hauteur);
			} else {
				ctx.fillStyle = "#e32626";
				ctx.fillRect(xDessin, yDessin, pomme.largeur, pomme.hauteur);
			}
		}

		// Cercle qui montre la zone du doigt.
		if (afficherZoneTactile) {
			ctx.save();
			ctx.strokeStyle = "#00cc00";
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.arc(zoneTactileX, zoneTactileY, rayonZoneTactile, 0, Math.PI * 2);
			ctx.stroke();
			ctx.restore();
		}
	};

	// Cree une nouvelle pomme avec physique initiale.
	const apparaitrePomme = () => {
		const largeurVue = canvasPommes.clientWidth;
		const hauteurVue = canvasPommes.clientHeight;
		// Taille fixe des pommes.
		const taillePomme = 52;
		const demiHauteur = taillePomme / 2;
		// Position de depart en bas de l'ecran.
		const posX = aleatoireEntre(largeurVue * 0.08, largeurVue * 0.92);
		const posY = hauteurVue + demiHauteur + aleatoireEntre(140, 260);

		// Point vise en hauteur pour la trajectoire.
		const cibleX = aleatoireEntre(largeurVue * 0.04, largeurVue * 0.96);
		const apexViseY = aleatoireEntre(hauteurVue * 0.18, hauteurVue * 0.45);
		// Gravite et vitesses de depart.
		const accelerationY = Math.max(1450, hauteurVue * 2.05);
		const vitesseY = -Math.sqrt(Math.max(2 * accelerationY * (posY - apexViseY), 1));
		const tempsVersApex = Math.abs(vitesseY) / accelerationY;
		const vitesseX = ((cibleX - posX) / tempsVersApex) * 1.4;
		const type = choisirTypePomme();

		// Ajoute la pomme dans le tableau.
		pommesActives.push({
			posX,
			posY,
			vitesseX,
			vitesseY,
			accelerationX: 0,
			accelerationY,
			largeur: taillePomme,
			hauteur: taillePomme,
			type
		});
		jouerSon(sonThrowFruit);
	};

	// Fait apparaitre 1 ou 2 pommes d'un coup.
	const apparaitreRafale = () => {
		const nombre = entierAleatoireEntre(1, 2);

		for (let i = 0; i < nombre; i = i + 1) {
			apparaitrePomme();
		}
	};

	// Met a jour la physique et les collisions.
	const mettreAJourMonde = (deltaTemps) => {
		const largeurMonde = canvasPommes.clientWidth;
		const hauteurMonde = canvasPommes.clientHeight;

		// 1) Deplacement + rebond sur les bords + suppression hors ecran bas.
		for (let i = pommesActives.length - 1; i >= 0; i = i - 1) {
			const pomme = pommesActives[i];
			const demiLargeur = pomme.largeur / 2;
			const demiHauteur = pomme.hauteur / 2;

			pomme.vitesseX = pomme.vitesseX + pomme.accelerationX * deltaTemps;
			pomme.vitesseY = pomme.vitesseY + pomme.accelerationY * deltaTemps;
			pomme.posX = pomme.posX + pomme.vitesseX * deltaTemps;
			pomme.posY = pomme.posY + pomme.vitesseY * deltaTemps;

			if (pomme.posX - demiLargeur <= 0) {
				// Mur gauche.
				pomme.posX = demiLargeur;
				pomme.vitesseX = -pomme.vitesseX;
				jouerSon(sonImpact);
			}

			if (pomme.posX + demiLargeur >= largeurMonde) {
				// Mur droit.
				pomme.posX = largeurMonde - demiLargeur;
				pomme.vitesseX = -pomme.vitesseX;
				jouerSon(sonImpact);
			}

			if (pomme.posY - demiHauteur <= 0) {
				// Mur haut.
				pomme.posY = demiHauteur;
				pomme.vitesseY = -pomme.vitesseY;
				jouerSon(sonImpact);
			}

			if (pomme.posY - demiHauteur > hauteurMonde + 160 && pomme.vitesseY > 0) {
				// Supprime si la pomme sort en bas.
				pommesActives.splice(i, 1);
			}
		}

		// 2) Collision simple entre pommes.
		for (let i = 0; i < pommesActives.length; i = i + 1) {
			const pommeA = pommesActives[i];
			const rayonA = pommeA.largeur / 2;

			for (let j = i + 1; j < pommesActives.length; j = j + 1) {
				const pommeB = pommesActives[j];
				const rayonB = pommeB.largeur / 2;
				const ecartX = pommeB.posX - pommeA.posX;
				const ecartY = pommeB.posY - pommeA.posY;
				const distanceMinimum = rayonA + rayonB;
				const distanceCarree = ecartX * ecartX + ecartY * ecartY;

				// Si elles se touchent, separation + echange de vitesse.
				if (distanceCarree > 0 && distanceCarree <= distanceMinimum * distanceMinimum) {
					const distance = Math.sqrt(distanceCarree);
					const chevauchement = distanceMinimum - distance;
					const normaleX = ecartX / distance;
					const normaleY = ecartY / distance;

					pommeA.posX = pommeA.posX - normaleX * chevauchement * 0.5;
					pommeA.posY = pommeA.posY - normaleY * chevauchement * 0.5;
					pommeB.posX = pommeB.posX + normaleX * chevauchement * 0.5;
					pommeB.posY = pommeB.posY + normaleY * chevauchement * 0.5;

					const ancienneVitesseX = pommeA.vitesseX;
					const ancienneVitesseY = pommeA.vitesseY;
					pommeA.vitesseX = pommeB.vitesseX;
					pommeA.vitesseY = pommeB.vitesseY;
					pommeB.vitesseX = ancienneVitesseX;
					pommeB.vitesseY = ancienneVitesseY;
					jouerSon(sonImpact);
				}
			}
		}

		// 3) Apparition des nouvelles pommes selon un delai aleatoire.
		cumulApparitionMs = cumulApparitionMs + deltaTemps * 1000;
		if (cumulApparitionMs >= prochainDelaiApparitionMs) {
			apparaitreRafale();
			cumulApparitionMs = 0;
			prochainDelaiApparitionMs = aleatoireEntre(520, 1100);
		}
	};

	// Boucle d'animation (appelee a chaque frame).
	const animer = (tempsActuel) => {
		if (!jeuActif) {
			return;
		}

		if (!dernierTemps) {
			dernierTemps = tempsActuel;
		}

		const deltaTemps = Math.min((tempsActuel - dernierTemps) / 1000, 0.032);
		dernierTemps = tempsActuel;

		// Mise a jour puis dessin.
		mettreAJourMonde(deltaTemps);
		dessinerMonde();
		identifiantAnimation = window.requestAnimationFrame(animer);
	};

	// Arrete la partie et vide les pommes.
	const arreterJeu = () => {
		jeuActif = false;

		if (identifiantAnimation !== null) {
			cancelAnimationFrame(identifiantAnimation);
			identifiantAnimation = null;
		}

		pommesActives.length = 0;
		dessinerMonde();
	};

	// Affiche l'overlay GAME OVER.
	const afficherFinPartie = () => {
		if (finPartieDeclenchee) {
			return;
		}

		finPartieDeclenchee = true;
		jouerSon(sonMort);
		arreterJeu();
		window.dispatchEvent(new Event("fin-de-partie"));

		if (overlayFinPartie instanceof HTMLElement) {
			overlayFinPartie.classList.add("is-visible");
			overlayFinPartie.setAttribute("aria-hidden", "false");
		}
	};

	// Detecte les pommes touchees par souris/doigt.
	const supprimerPommesTouchees = (rayonContact = 0) => {
		let pommePourrieTouchee = false;
		const ajouterPoints = (typePomme) => {
			if (typePomme === "rouge") {
				points = points + 2;
				mettreAJourAffichagePoints();
				jouerSon(sonPommeClassique);
			}

			if (typePomme === "jaune") {
				points = points + 10;
				mettreAJourAffichagePoints();
				jouerSon(sonPommeClassique);
				jouerSon(sonComboDoree);
			}
		};

		for (let i = pommesActives.length - 1; i >= 0; i = i - 1) {
			const pomme = pommesActives[i];
			// Rectangle de la pomme.
			const gauche = pomme.posX - pomme.largeur / 2;
			const droite = pomme.posX + pomme.largeur / 2;
			const haut = pomme.posY - pomme.hauteur / 2;
			const bas = pomme.posY + pomme.hauteur / 2;
			// Collision point (souris/doigt).
			const estDansRectangle =
				positionSourisX >= gauche &&
				positionSourisX <= droite &&
				positionSourisY >= haut &&
				positionSourisY <= bas;

			if (estDansRectangle) {
				// Pomme verte = fin de partie.
				if (pomme.type === "verte") {
					pommePourrieTouchee = true;
					jouerSon(sonPommePourrie);
				}
				ajouterPoints(pomme.type);
				pommesActives.splice(i, 1);
				continue;
			}

			if (rayonContact > 0) {
				// Collision cercle (zone tactile) contre rectangle.
				const plusProcheX = Math.max(gauche, Math.min(positionSourisX, droite));
				const plusProcheY = Math.max(haut, Math.min(positionSourisY, bas));
				const ecartX = positionSourisX - plusProcheX;
				const ecartY = positionSourisY - plusProcheY;
				if (ecartX * ecartX + ecartY * ecartY <= rayonContact * rayonContact) {
					if (pomme.type === "verte") {
						pommePourrieTouchee = true;
						jouerSon(sonPommePourrie);
					}
					ajouterPoints(pomme.type);
					pommesActives.splice(i, 1);
				}
			}
		}

		// Fin de partie si une pomme pourrie est touchee.
		if (pommePourrieTouchee) {
			afficherFinPartie();
		}
	};

	// Redessine si l'ecran change.
	window.addEventListener("resize", () => {
		redimensionnerCanvasPommes();
		dessinerMonde();
	});
	window.addEventListener("orientationchange", () => {
		redimensionnerCanvasPommes();
		dessinerMonde();
	});
	// Arret si le minuteur est termine.
	window.addEventListener("minuteur-termine", arreterJeu);
	// Souris: met a jour la position de coupe.
	canvasPommes.addEventListener("mousemove", (event) => {
		initialiserSons();

		const rectangle = canvasPommes.getBoundingClientRect();
		positionSourisX = event.clientX - rectangle.left;
		positionSourisY = event.clientY - rectangle.top;
		afficherZoneTactile = false;
		supprimerPommesTouchees();
	});
	// Debut du contact tactile.
	canvasPommes.addEventListener("pointerdown", (event) => {
		initialiserSons();

		if (event.pointerType !== "touch") {
			return;
		}
		const rectangle = canvasPommes.getBoundingClientRect();
		zoneTactileX = event.clientX - rectangle.left;
		zoneTactileY = event.clientY - rectangle.top;
		positionSourisX = zoneTactileX;
		positionSourisY = zoneTactileY;
		afficherZoneTactile = true;
		supprimerPommesTouchees(rayonZoneTactile);
	});
	// Deplacement souris/doigt.
	canvasPommes.addEventListener("pointermove", (event) => {
		initialiserSons();

		const rectangle = canvasPommes.getBoundingClientRect();
		positionSourisX = event.clientX - rectangle.left;
		positionSourisY = event.clientY - rectangle.top;

		// Si tactile, active la zone ronde autour du doigt.
		if (event.pointerType === "touch") {
			zoneTactileX = positionSourisX;
			zoneTactileY = positionSourisY;
			afficherZoneTactile = true;
			supprimerPommesTouchees(rayonZoneTactile);
			return;
		}

		afficherZoneTactile = false;
		supprimerPommesTouchees();
	});
	// Cache la zone tactile quand le contact se termine.
	canvasPommes.addEventListener("pointerup", () => {
		afficherZoneTactile = false;
	});
	canvasPommes.addEventListener("pointercancel", () => {
		afficherZoneTactile = false;
	});
	canvasPommes.addEventListener("pointerleave", () => {
		afficherZoneTactile = false;
	});
	// Evite le scroll de la page pendant le glisse tactile sur le canvas.
	document.addEventListener("touchmove", (event) => {
		if (event.target === canvasPommes) {
			event.preventDefault();
		}
	}, { passive: false });

	// Bouton recommencer: recharge la page.
	if (boutonRecommencer instanceof HTMLButtonElement) {
		boutonRecommencer.addEventListener("click", () => {
			window.location.reload();
		});
	}

	// Initialisation du jeu.
	redimensionnerCanvasPommes();
	apparaitreRafale();
	identifiantAnimation = window.requestAnimationFrame(animer);
}
