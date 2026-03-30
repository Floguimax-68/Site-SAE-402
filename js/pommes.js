// Element canvas principal utilise pour le gameplay des pommes.
const canvasPommes = document.getElementById("canva-pommes");

if (canvasPommes instanceof HTMLCanvasElement) {
	// Contexte 2D qui permet de dessiner les pommes et effets.
	const ctx = canvasPommes.getContext("2d");
	// Element overlay affiche quand la partie est perdue.
	const overlayFinPartie = document.getElementById("game-over-overlay");
	// Element overlay affiche quand le joueur gagne.
	const overlayVictoire = document.getElementById("win-overlay");
	// Element overlay affiche les regles avant le debut de partie.
	const overlayRegles = document.getElementById("rules-overlay");
	// Bouton qui relance une partie apres game over.
	const boutonRecommencer = document.getElementById("restart-button");
	// Bouton pour continuer apres victoire (relance le jeu pour l'instant).
	const boutonContinuer = document.getElementById("continue-button");
	// Bouton qui lance la partie depuis l'overlay des regles.
	const boutonDemarrer = document.getElementById("start-button");
	// Texte dynamique qui affiche le score final dans l'overlay victoire.
	const messageVictoire = document.getElementById("win-message");
	// Texte dynamique qui affiche le score final dans l'overlay game over.
	const messageFinPartie = document.getElementById("game-over-message");
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
	sonPommeClassique.volume = 0.5;
	// Son bonus joue pour une pomme jaune.
	const sonComboDoree = new Audio("img/sfx/combo-1.wav");
	sonComboDoree.volume = 0.125;
	// Son joue quand une pomme pourrie est touchee.
	const sonPommePourrie = new Audio("img/sfx/freesound_community-small-explosion-106769.mp3");
	sonPommePourrie.volume = 0.5;
	// Son de mort joue lors de la fin de partie.
	const sonMort = new Audio("img/sfx/freesound_community-videogame-death-sound-43894.mp3");
	// Le volume HTML est limite a 1, donc on ajoute +15% via un gain audio dedie.
	const ClasseAudioContextEffets = window.AudioContext || window.webkitAudioContext;
	let contexteAudioEffets = null;
	if (ClasseAudioContextEffets) {
		try {
			contexteAudioEffets = new ClasseAudioContextEffets();
			const sourceSonMort = contexteAudioEffets.createMediaElementSource(sonMort);
			const gainSonMort = contexteAudioEffets.createGain();
			gainSonMort.gain.value = 1.15;
			sourceSonMort.connect(gainSonMort);
			gainSonMort.connect(contexteAudioEffets.destination);
		} catch (erreurAudio) {
			contexteAudioEffets = null;
		}
	}
	// Son d'impact joue sur collision avec bords ou autres pommes.
	const sonImpact = new Audio("img/sfx/Impact.wav");
	sonImpact.volume = 0.25;
	// Son joue lors de l'apparition/lancement d'une pomme.
	const sonThrowFruit = new Audio("img/sfx/Throw-fruit.wav");
	sonThrowFruit.volume = 0.36;
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
		if (audio === sonMort && contexteAudioEffets && contexteAudioEffets.state === "suspended") {
			contexteAudioEffets.resume().catch(function () {
				// Ignore si le navigateur bloque encore le contexte audio.
			});
		}

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
	// Verrou pour demarrer la boucle de jeu une seule fois.
	let jeuDemarre = false;
	// Score minimum a atteindre pour valider la victoire.
	const scoreVictoire = 125;
	// Score courant du joueur.
	let points = 0;
	// Compteurs de pommes coupees, utilises pour l'easter egg.
	let pommesDoreesCoupees = 0;
	let pommesRougesCoupees = 0;
	let pommesPourriesCoupees = 0;
	// Verrou qui evite de declencher l'easter egg plusieurs fois.
	let easterEggDoreDeclenche = false;
	// Active un mode special ou seules des pommes dorees apparaissent.
	let modeEasterEggDoreActif = false;
	// Intervalle de pluie continue pendant l'easter egg.
	let identifiantPluieDoree = null;

	// Fonction qui envoie le score au canvas timer pour affichage sur la pancarte.
	function mettreAJourAffichagePoints() {
		window.dispatchEvent(new CustomEvent("points-mis-a-jour", {
			detail: { points: points }
		}));
	}
	mettreAJourAffichagePoints();

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
	function apparaitrePomme(typeForce = null, jouerSonLancer = true) {
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
		// Type de pomme tire aleatoirement (rouge/jaune/verte) ou impose.
		const type = typeForce || choisirTypePomme();

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
		if (jouerSonLancer) {
			jouerSon(sonThrowFruit);
		}
	}

	// Fait apparaitre 1 ou 2 pommes d'un coup.
	function apparaitreRafale() {
		// Tirage pondere: 1-2 tres frequents, 3 rare, 4 tres rare.
		const tirageRafale = Math.random() * 100;
		// Nombre de pommes a creer pour cette vague.
		let nombre = entierAleatoireEntre(1, 2);

		if (tirageRafale >= 93 && tirageRafale < 98) {
			nombre = 3;
		}

		if (tirageRafale >= 98) {
			nombre = 4;
		}

		// Index de boucle pour creer le bon nombre de pommes.
		for (let i = 0; i < nombre; i = i + 1) {
			apparaitrePomme();
		}
	}

	// Lance une pluie massive de pommes dorees pour l'easter egg.
	function declencherEasterEggDore() {
		if (easterEggDoreDeclenche || !jeuActif) {
			return;
		}

		easterEggDoreDeclenche = true;
		modeEasterEggDoreActif = true;

		// Toutes les pommes deja presentes deviennent dorees.
		for (let i = 0; i < pommesActives.length; i = i + 1) {
			pommesActives[i].type = "jaune";
		}

		const pommesParSalve = 12;

		if (identifiantPluieDoree !== null) {
			clearInterval(identifiantPluieDoree);
		}

		identifiantPluieDoree = setInterval(function () {
			if (!jeuActif) {
				clearInterval(identifiantPluieDoree);
				identifiantPluieDoree = null;
				return;
			}

			for (let i = 0; i < pommesParSalve; i = i + 1) {
				apparaitrePomme("jaune", false);
			}
		}, 500);
	}

	// Verifie si la condition speciale des 5 dorees uniquement est atteinte.
	function verifierEasterEggDore() {
		if (easterEggDoreDeclenche) {
			return;
		}

		if (pommesDoreesCoupees === 5 && pommesRougesCoupees === 0 && pommesPourriesCoupees === 0) {
			declencherEasterEggDore();
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
		if (!modeEasterEggDoreActif) {
			cumulApparitionMs = cumulApparitionMs + deltaTemps * 1000;
			if (cumulApparitionMs >= prochainDelaiApparitionMs) {
				apparaitreRafale();
				cumulApparitionMs = 0;
				prochainDelaiApparitionMs = aleatoireEntre(520, 1100);
			}
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

		if (identifiantPluieDoree !== null) {
			clearInterval(identifiantPluieDoree);
			identifiantPluieDoree = null;
		}

		pommesActives.length = 0;
		dessinerMonde();
	}

	// Affiche l'overlay GAME OVER avec un message adapte a la cause.
	function afficherFinPartie(causeDefaite) {
		if (finPartieDeclenchee) {
			return;
		}

		finPartieDeclenchee = true;
		jouerSon(sonMort);
		arreterJeu();
		window.dispatchEvent(new Event("fin-de-partie"));

		if (messageFinPartie instanceof HTMLElement) {
			if (causeDefaite === "pomme-pourrie") {
				messageFinPartie.textContent = "Aïe, vous avez coupé une pomme pourrie.";
			} else {
				messageFinPartie.textContent = "Vous avez marqué moins de 125 points.";
			}
		}

		if (overlayFinPartie instanceof HTMLElement) {
			overlayFinPartie.classList.add("is-visible");
		}
	}

	// Affiche l'overlay de victoire avec le score final.
	function afficherVictoire() {
		if (finPartieDeclenchee) {
			return;
		}

		finPartieDeclenchee = true;
		arreterJeu();
		window.dispatchEvent(new Event("fin-de-partie"));

		if (messageVictoire instanceof HTMLElement) {
			messageVictoire.textContent = "Bravo, vous avez marqué " + points + " points.";
		}

		if (overlayVictoire instanceof HTMLElement) {
			overlayVictoire.classList.add("is-visible");
		}
	}

	// Gere la fin du minuteur: victoire si score atteint, sinon game over.
	function gererFinMinuteur() {
		if (points >= scoreVictoire) {
			afficherVictoire();
			return;
		}

		afficherFinPartie("score-insuffisant");
	}

	// Lance la boucle du jeu (pommes) une seule fois.
	function demarrerJeuPommes() {
		if (jeuDemarre) {
			return;
		}

		jeuDemarre = true;
		redimensionnerCanvasPommes();
		apparaitreRafale();
		identifiantAnimation = window.requestAnimationFrame(animer);
	}

	// Detecte les pommes touchees par souris/doigt.
	function supprimerPommesTouchees(rayonContact = 0) {
		// Indique si une pomme verte a ete touchee pendant ce passage.
		let pommePourrieTouchee = false;
		// Fonction locale qui applique les points selon le type de pomme tranchee.
		function ajouterPoints(typePomme) {
			if (typePomme === "rouge") {
				pommesRougesCoupees = pommesRougesCoupees + 1;
				points = points + 2;
				mettreAJourAffichagePoints();
				jouerSon(sonPommeClassique);
				return;
			}

			if (typePomme === "jaune") {
				pommesDoreesCoupees = pommesDoreesCoupees + 1;
				points = points + 10;
				mettreAJourAffichagePoints();
				jouerSon(sonPommeClassique);
				jouerSon(sonComboDoree);
				verifierEasterEggDore();
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
					pommesPourriesCoupees = pommesPourriesCoupees + 1;
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
						pommesPourriesCoupees = pommesPourriesCoupees + 1;
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
			afficherFinPartie("pomme-pourrie");
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
	window.addEventListener("minuteur-termine", gererFinMinuteur);
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

	// Bouton continuer: recharge la page pour relancer une partie.
	if (boutonContinuer instanceof HTMLButtonElement) {
		boutonContinuer.addEventListener("click", function () {
			window.location.reload();
		});
	}

	// Bouton GO: masque les regles puis lance le jeu.
	if (boutonDemarrer instanceof HTMLButtonElement) {
		boutonDemarrer.addEventListener("click", function () {
			if (overlayRegles instanceof HTMLElement) {
				overlayRegles.classList.remove("is-visible");
			}

			window.dispatchEvent(new Event("jeu-demarre"));
			demarrerJeuPommes();
		});
	}

	// Lancement possible du gameplay via evenement global.
	window.addEventListener("jeu-demarre", demarrerJeuPommes);
}
