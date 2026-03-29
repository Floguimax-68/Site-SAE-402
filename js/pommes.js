// Element canvas principal utilise pour le gameplay des pommes.
const canvasPommes = document.getElementById("canva-pommes");

if (canvasPommes instanceof HTMLCanvasElement) {
	// Contexte 2D qui permet de dessiner les pommes et effets.
	const ctx = canvasPommes.getContext("2d");
	// Element overlay affiche quand la partie est perdue.
	const overlayFinPartie = document.getElementById("game-over-overlay");
	// Bouton qui relance une partie apres game over.
	const boutonRecommencer = document.getElementById("restart-button");
	// Dictionnaire des images associees a chaque type de pomme.
	const imagesPommes = {
		jaune: new Image(),
		verte: new Image(),
		rouge: new Image()
	};
	// Chemins des images.
	imagesPommes.jaune.src = "img/apple_golden_60x60px.webp";
	imagesPommes.verte.src = "img/apple_rotten_60x60px.webp";
	imagesPommes.rouge.src = "img/apple_regular_60x60px.webp";

	// Son joue quand une pomme rouge est tranchee.
	const sonPommeClassique = new Audio("img/sfx/Impact-Plum.wav");
	// Son bonus joue pour une pomme jaune.
	const sonComboDoree = new Audio("img/sfx/combo-1.wav");
	// Son joue quand une pomme pourrie est touchee.
	const sonPommePourrie = new Audio("img/sfx/freesound_community-small-explosion-106769.mp3");
	// Son de mort joue lors de la fin de partie.
	const sonMort = new Audio("img/sfx/freesound_community-videogame-death-sound-43894.mp3");
	// Son d'impact joue sur collision avec bords ou autres pommes.
	const sonImpact = new Audio("img/sfx/Impact.wav");
	// Son joue lors de l'apparition/lancement d'une pomme.
	const sonThrowFruit = new Audio("img/sfx/Throw-fruit.wav");
	sonThrowFruit.volume = 0.45;
	// Tableau centralisant tous les sons du jeu pour les initialiser.
	const sonsJeu = [sonPommeClassique, sonComboDoree, sonPommePourrie, sonMort, sonImpact, sonThrowFruit];
	// Indique si les sons ont deja ete precharges.
	let sonsInitialises = false;

	// Fonction qui precharge les sons une seule fois apres interaction utilisateur.
	function initialiserSons() {
		if (sonsInitialises) {
			return;
		}

		// Index pour parcourir tous les sons du tableau.
		for (let i = 0; i < sonsJeu.length; i = i + 1) {
			sonsJeu[i].preload = "auto";
			sonsJeu[i].load();
		}

		sonsInitialises = true;
	}

	// Fonction utilitaire qui rejoue un son depuis le debut.
	function jouerSon(audio) {
		audio.currentTime = 0;
		audio.play().catch(function () {
			// Ignore les blocages navigateur si aucun geste utilisateur.
		});
	}

	// Variables principales de la boucle du jeu.
	// Identifiant requestAnimationFrame de la boucle de jeu.
	let identifiantAnimation = null;
	// Horodatage de la frame precedente pour calculer le delta temps.
	let dernierTemps = 0;
	// Tableau contenant toutes les pommes actuellement presentes.
	const pommesActives = [];
	// Etat global indiquant si la partie est encore en cours.
	let jeuActif = true;
	// Temps cumule depuis la derniere vague d'apparition (en ms).
	let cumulApparitionMs = 0;
	// Delai cible avant la prochaine apparition de pommes.
	let prochainDelaiApparitionMs = 800;
	// Position pointeur (souris/doigt).
	// Coordonnee X de la souris/doigt dans le canvas.
	let positionSourisX = -1000;
	// Coordonnee Y de la souris/doigt dans le canvas.
	let positionSourisY = -1000;
	// Affichage de la zone de contact tactile.
	// Active ou masque le cercle visuel du doigt en tactile.
	let afficherZoneTactile = false;
	// Centre X de la zone tactile autour du doigt.
	let zoneTactileX = -1000;
	// Centre Y de la zone tactile autour du doigt.
	let zoneTactileY = -1000;
	// Rayon de la zone de coupe tactile.
	const rayonZoneTactile = 9;
	// Evite de declencher fin de partie plusieurs fois.
	// Verrou qui evite plusieurs executions de la fin de partie.
	let finPartieDeclenchee = false;
	// Score courant du joueur.
	let points = 0;

	// Element DOM qui affiche le score en haut a droite.
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

	// Fonction qui synchronise l'affichage du score avec la variable points.
	function mettreAJourAffichagePoints() {
		affichagePoints.textContent = points + " pts";
	}

	// Nombre aleatoire entre min et max.
	function aleatoireEntre(min, max) {
		return min + Math.random() * (max - min);
	}

	// Nombre entier aleatoire entre min et max inclus.
	function entierAleatoireEntre(min, max) {
		return Math.floor(aleatoireEntre(min, max + 1));
	}

	// Choisit le type de pomme selon les probabilites.
	function choisirTypePomme() {
		// Tirage aleatoire en pourcentage entre 0 et 100.
		const tirage = Math.random() * 100;

		if (tirage < 10) {
			return "jaune";
		}

		if (tirage < 25) {
			return "verte";
		}

		return "rouge";
	}

	// Redimensionne le canvas des pommes.
	function redimensionnerCanvasPommes() {
		// Largeur de la fenetre pour la taille visible du canvas.
		const largeurVue = window.innerWidth;
		// Hauteur de la fenetre pour la taille visible du canvas.
		const hauteurVue = window.innerHeight;
		// Ratio de pixels pour conserver un rendu net sur tous les ecrans.
		const ratioPixels = window.devicePixelRatio || 1;

		canvasPommes.width = Math.floor(largeurVue * ratioPixels);
		canvasPommes.height = Math.floor(hauteurVue * ratioPixels);
		canvasPommes.style.width = largeurVue + "px";
		canvasPommes.style.height = hauteurVue + "px";

		if (ctx) {
			ctx.setTransform(ratioPixels, 0, 0, ratioPixels, 0, 0);
		}
	}

	// Dessine toutes les pommes et la zone tactile.
	function dessinerMonde() {
		if (!ctx) {
			return;
		}

		// Largeur courante du monde de jeu visible.
		const largeurVue = canvasPommes.clientWidth;
		// Hauteur courante du monde de jeu visible.
		const hauteurVue = canvasPommes.clientHeight;

		ctx.clearRect(0, 0, largeurVue, hauteurVue);

		// Index pour parcourir toutes les pommes actives.
		for (let i = 0; i < pommesActives.length; i = i + 1) {
			// Pomme courante en cours de dessin.
			const pomme = pommesActives[i];
			// Image selon le type de pomme.
			const image = imagesPommes[pomme.type];
			// Position X du coin haut gauche pour dessiner la pomme centree.
			const xDessin = pomme.posX - pomme.largeur / 2;
			// Position Y du coin haut gauche pour dessiner la pomme centree.
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
	}

	// Cree une nouvelle pomme avec physique initiale.
	function apparaitrePomme() {
		// Largeur disponible pour calculer la trajectoire de la pomme.
		const largeurVue = canvasPommes.clientWidth;
		// Hauteur disponible pour calculer la trajectoire de la pomme.
		const hauteurVue = canvasPommes.clientHeight;
		// Taille fixe des pommes.
		const taillePomme = 52;
		// Demi-hauteur utile pour placer correctement la pomme hors ecran.
		const demiHauteur = taillePomme / 2;
		// Position de depart en bas de l'ecran.
		// Position X initiale de la pomme.
		const posX = aleatoireEntre(largeurVue * 0.08, largeurVue * 0.92);
		// Position Y initiale sous l'ecran pour simuler un lancer.
		const posY = hauteurVue + demiHauteur + aleatoireEntre(140, 260);

		// Point vise en hauteur pour la trajectoire.
		// Position X de la cible vers laquelle la pomme se dirige.
		const cibleX = aleatoireEntre(largeurVue * 0.04, largeurVue * 0.96);
		// Altitude visee pour le sommet de la trajectoire.
		const apexViseY = aleatoireEntre(hauteurVue * 0.18, hauteurVue * 0.45);
		// Gravite et vitesses de depart.
		// Acceleration verticale appliquee en permanence (gravite).
		const accelerationY = Math.max(1450, hauteurVue * 2.05);
		// Vitesse verticale initiale necessaire pour atteindre l'apex vise.
		const vitesseY = -Math.sqrt(Math.max(2 * accelerationY * (posY - apexViseY), 1));
		// Temps necessaire pour atteindre l'apex avec cette gravite.
		const tempsVersApex = Math.abs(vitesseY) / accelerationY;
		// Vitesse horizontale initiale pour rejoindre la cible X.
		const vitesseX = ((cibleX - posX) / tempsVersApex) * 1.4;
		// Type de pomme tire aleatoirement (rouge/jaune/verte).
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
	}

	// Fait apparaitre 1 ou 2 pommes d'un coup.
	function apparaitreRafale() {
		// Nombre de pommes a creer pour cette vague.
		const nombre = entierAleatoireEntre(1, 2);

		// Index de boucle pour creer le bon nombre de pommes.
		for (let i = 0; i < nombre; i = i + 1) {
			apparaitrePomme();
		}
	}

	// Met a jour la physique et les collisions.
	function mettreAJourMonde(deltaTemps) {
		// Largeur actuelle de la zone de jeu.
		const largeurMonde = canvasPommes.clientWidth;
		// Hauteur actuelle de la zone de jeu.
		const hauteurMonde = canvasPommes.clientHeight;

		// 1) Deplacement + rebond sur les bords + suppression hors ecran bas.
		// Index inverse pour supprimer facilement des pommes sans casser la boucle.
		for (let i = pommesActives.length - 1; i >= 0; i = i - 1) {
			// Pomme courante mise a jour dans cette iteration.
			const pomme = pommesActives[i];
			// Demi-largeur de la pomme pour les tests de bord.
			const demiLargeur = pomme.largeur / 2;
			// Demi-hauteur de la pomme pour les tests de bord.
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
		// Index externe pour selectionner la premiere pomme du couple.
		for (let i = 0; i < pommesActives.length; i = i + 1) {
			// Premiere pomme du couple en cours de collision.
			const pommeA = pommesActives[i];
			// Rayon de collision de la pomme A.
			const rayonA = pommeA.largeur / 2;

			// Index interne pour comparer la pomme A aux suivantes.
			for (let j = i + 1; j < pommesActives.length; j = j + 1) {
				// Deuxieme pomme du couple en cours de collision.
				const pommeB = pommesActives[j];
				// Rayon de collision de la pomme B.
				const rayonB = pommeB.largeur / 2;
				// Ecart horizontal entre les centres des deux pommes.
				const ecartX = pommeB.posX - pommeA.posX;
				// Ecart vertical entre les centres des deux pommes.
				const ecartY = pommeB.posY - pommeA.posY;
				// Distance minimale entre centres pour qu'elles ne se chevauchent pas.
				const distanceMinimum = rayonA + rayonB;
				// Distance au carre entre les centres (evite une racine pour le test).
				const distanceCarree = ecartX * ecartX + ecartY * ecartY;

				// Si elles se touchent, separation + echange de vitesse.
				if (distanceCarree > 0 && distanceCarree <= distanceMinimum * distanceMinimum) {
					// Distance reelle entre les centres des deux pommes.
					const distance = Math.sqrt(distanceCarree);
					// Quantite de penetration a corriger pour les separer.
					const chevauchement = distanceMinimum - distance;
					// Composante X de la normale de collision.
					const normaleX = ecartX / distance;
					// Composante Y de la normale de collision.
					const normaleY = ecartY / distance;

					pommeA.posX = pommeA.posX - normaleX * chevauchement * 0.5;
					pommeA.posY = pommeA.posY - normaleY * chevauchement * 0.5;
					pommeB.posX = pommeB.posX + normaleX * chevauchement * 0.5;
					pommeB.posY = pommeB.posY + normaleY * chevauchement * 0.5;

					// Sauvegarde de la vitesse X de la pomme A avant echange.
					const ancienneVitesseX = pommeA.vitesseX;
					// Sauvegarde de la vitesse Y de la pomme A avant echange.
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
	}

	// Boucle d'animation (appelee a chaque frame).
	function animer(tempsActuel) {
		if (!jeuActif) {
			return;
		}

		if (!dernierTemps) {
			dernierTemps = tempsActuel;
		}

		// Delta temps en secondes entre deux frames, limite pour stabiliser la simulation.
		const deltaTemps = Math.min((tempsActuel - dernierTemps) / 1000, 0.032);
		dernierTemps = tempsActuel;

		// Mise a jour puis dessin.
		mettreAJourMonde(deltaTemps);
		dessinerMonde();
		identifiantAnimation = window.requestAnimationFrame(animer);
	}

	// Arrete la partie et vide les pommes.
	function arreterJeu() {
		jeuActif = false;

		if (identifiantAnimation !== null) {
			cancelAnimationFrame(identifiantAnimation);
			identifiantAnimation = null;
		}

		pommesActives.length = 0;
		dessinerMonde();
	}

	// Affiche l'overlay GAME OVER.
	function afficherFinPartie() {
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
	}

	// Detecte les pommes touchees par souris/doigt.
	function supprimerPommesTouchees(rayonContact = 0) {
		// Indique si une pomme verte a ete touchee pendant ce passage.
		let pommePourrieTouchee = false;
		// Fonction locale qui applique les points selon le type de pomme tranchee.
		function ajouterPoints(typePomme) {
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
		}

		// Index inverse pour supprimer une pomme touchee sans sauter d'element.
		for (let i = pommesActives.length - 1; i >= 0; i = i - 1) {
			// Pomme actuellement testee contre la position du curseur/doigt.
			const pomme = pommesActives[i];
			// Rectangle de la pomme.
			// Bord gauche du rectangle englobant la pomme.
			const gauche = pomme.posX - pomme.largeur / 2;
			// Bord droit du rectangle englobant la pomme.
			const droite = pomme.posX + pomme.largeur / 2;
			// Bord haut du rectangle englobant la pomme.
			const haut = pomme.posY - pomme.hauteur / 2;
			// Bord bas du rectangle englobant la pomme.
			const bas = pomme.posY + pomme.hauteur / 2;
			// Collision point (souris/doigt).
			// Indique si le pointeur est dans le rectangle de la pomme.
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
				// Coordonnee X du point du rectangle le plus proche du contact.
				const plusProcheX = Math.max(gauche, Math.min(positionSourisX, droite));
				// Coordonnee Y du point du rectangle le plus proche du contact.
				const plusProcheY = Math.max(haut, Math.min(positionSourisY, bas));
				// Ecart horizontal entre le centre du contact et ce point proche.
				const ecartX = positionSourisX - plusProcheX;
				// Ecart vertical entre le centre du contact et ce point proche.
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
	}

	// Redessine si l'ecran change.
	window.addEventListener("resize", function () {
		redimensionnerCanvasPommes();
		dessinerMonde();
	});
	window.addEventListener("orientationchange", function () {
		redimensionnerCanvasPommes();
		dessinerMonde();
	});
	// Arret si le minuteur est termine.
	window.addEventListener("minuteur-termine", arreterJeu);
	// Souris: met a jour la position de coupe.
	canvasPommes.addEventListener("mousemove", function (event) {
		initialiserSons();

		// Rectangle du canvas pour convertir les coordonnees ecran en coordonnees locales.
		const rectangle = canvasPommes.getBoundingClientRect();
		positionSourisX = event.clientX - rectangle.left;
		positionSourisY = event.clientY - rectangle.top;
		afficherZoneTactile = false;
		supprimerPommesTouchees();
	});
	// Debut du contact tactile.
	canvasPommes.addEventListener("pointerdown", function (event) {
		initialiserSons();

		if (event.pointerType !== "touch") {
			return;
		}
		// Rectangle du canvas pour convertir les coordonnees ecran en coordonnees locales.
		const rectangle = canvasPommes.getBoundingClientRect();
		zoneTactileX = event.clientX - rectangle.left;
		zoneTactileY = event.clientY - rectangle.top;
		positionSourisX = zoneTactileX;
		positionSourisY = zoneTactileY;
		afficherZoneTactile = true;
		supprimerPommesTouchees(rayonZoneTactile);
	});
	// Deplacement souris/doigt.
	canvasPommes.addEventListener("pointermove", function (event) {
		initialiserSons();

		// Rectangle du canvas pour convertir les coordonnees ecran en coordonnees locales.
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
	canvasPommes.addEventListener("pointerup", function () {
		afficherZoneTactile = false;
	});
	canvasPommes.addEventListener("pointercancel", function () {
		afficherZoneTactile = false;
	});
	canvasPommes.addEventListener("pointerleave", function () {
		afficherZoneTactile = false;
	});
	// Evite le scroll de la page pendant le glisse tactile sur le canvas.
	document.addEventListener("touchmove", function (event) {
		if (event.target === canvasPommes) {
			event.preventDefault();
		}
	}, { passive: false });

	// Bouton recommencer: recharge la page.
	if (boutonRecommencer instanceof HTMLButtonElement) {
		boutonRecommencer.addEventListener("click", function () {
			window.location.reload();
		});
	}

	// Initialisation du jeu.
	redimensionnerCanvasPommes();
	apparaitreRafale();
	identifiantAnimation = window.requestAnimationFrame(animer);
}
