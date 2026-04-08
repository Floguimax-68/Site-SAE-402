// Element canvas utilise pour afficher le decor de fond.
const canvasFond = document.getElementById("canva-fond");

if (canvasFond instanceof HTMLCanvasElement) {
	// Contexte 2D qui permet de dessiner sur le canvas du fond.
	const ctx = canvasFond.getContext("2d");
	// Objet image qui contient le visuel de fond du jeu.
	const imageFond = new Image();
	imageFond.src = "src/img/Fond-canva-fruit-ninja-pommes.webp";
	// Images decoratives placees sur le mur du fond.
	const imageBouclierMur = new Image();
	imageBouclierMur.src = "src/img/bouclier-eppee.png";

	// Classe AudioContext compatible selon le navigateur.
	const ClasseAudioContext = window.AudioContext || window.webkitAudioContext;

	if (ClasseAudioContext) {
		// Contexte audio pour generer une petite musique 8-bit en boucle.
		const contexteAudio = new ClasseAudioContext();
		// Ratio d'un demi-ton pour transposer facilement les motifs.
		const ratioDemiTon = Math.pow(2, 1 / 12);

		// Transpose une sequence en demi-tons (0 reste un silence).
		function transposerSequence(sequence, demiTons) {
			return sequence.map(function (frequence) {
				if (frequence <= 0) {
					return 0;
				}
				return frequence * Math.pow(ratioDemiTon, demiTons);
			});
		}

		// Motif principal arcade (0 represente un silence).
		const sequenceLeadBase = [
			523.25, 659.25, 783.99, 659.25,
			587.33, 659.25, 783.99, 880.0,
			783.99, 659.25, 587.33, 659.25,
			523.25, 587.33, 659.25, 0,
			659.25, 783.99, 987.77, 783.99,
			739.99, 783.99, 987.77, 1046.5,
			987.77, 783.99, 739.99, 783.99,
			659.25, 587.33, 523.25, 0
		];
		// Motif de contre-chant pour donner l'effet borne d'arcade.
		const sequenceContreChantBase = [
			1046.5, 987.77, 1046.5, 1174.66,
			987.77, 1046.5, 1174.66, 1318.51,
			1046.5, 987.77, 1046.5, 1174.66,
			987.77, 880.0, 783.99, 0,
			1174.66, 1046.5, 1174.66, 1318.51,
			1046.5, 1174.66, 1318.51, 1396.91,
			1174.66, 1046.5, 1174.66, 1318.51,
			987.77, 880.0, 783.99, 0
		];
		// Motif de basse simple et punchy pour garder l'energie du jeu.
		const sequenceBassesBase = [
			130.81, 130.81, 146.83, 130.81,
			146.83, 146.83, 164.81, 0,
			130.81, 130.81, 146.83, 130.81,
			146.83, 164.81, 174.61, 0,
			164.81, 164.81, 174.61, 164.81,
			174.61, 174.61, 196.0, 0,
			164.81, 164.81, 174.61, 164.81,
			146.83, 130.81, 123.47, 0
		];
		// Motif de dynamique pour accentuer certains temps.
		const sequenceAccentsBase = [
			1.0, 0.8, 0.95, 0.85,
			1.0, 0.8, 0.95, 0.0,
			1.0, 0.8, 0.95, 0.85,
			1.0, 0.9, 1.0, 0.0,
			1.0, 0.8, 0.95, 0.85,
			1.0, 0.8, 0.95, 0.0,
			1.0, 0.8, 0.95, 0.85,
			1.0, 0.9, 1.0, 0.0
		];

		// Section A: theme principal.
		const sequenceLeadA = sequenceLeadBase;
		const sequenceContreChantA = sequenceContreChantBase;
		const sequenceBassesA = sequenceBassesBase;
		const sequenceAccentsA = sequenceAccentsBase;

		// Section B: monte en energie (transposition legere vers l'aigu).
		const sequenceLeadB = transposerSequence(sequenceLeadBase, 2);
		const sequenceContreChantB = transposerSequence(sequenceContreChantBase, 2);
		const sequenceBassesB = transposerSequence(sequenceBassesBase, 2);
		const sequenceAccentsB = sequenceAccentsBase.map(function (accent, index) {
			return accent > 0 && index % 8 === 0 ? 1.1 : accent;
		});

		// Section C: break plus profond avec basse plus lourde et lead plus espacee.
		const sequenceLeadC = sequenceLeadBase.map(function (frequence, index) {
			if (frequence <= 0) {
				return 0;
			}
			if (index % 4 === 1 || index % 4 === 3) {
				return 0;
			}
			return frequence * 0.5;
		});
		const sequenceContreChantC = transposerSequence(sequenceContreChantBase, -5).map(function (frequence, index) {
			return index % 2 === 0 ? frequence : 0;
		});
		const sequenceBassesC = sequenceBassesBase.map(function (frequence) {
			if (frequence <= 0) {
				return 0;
			}
			return frequence * 0.75;
		});
		const sequenceAccentsC = sequenceAccentsBase.map(function (accent, index) {
			if (accent <= 0) {
				return 0;
			}
			return index % 4 === 0 ? 1.05 : 0.7;
		});

		// Section D: finale arcade plus brillante avant le retour en A.
		const sequenceLeadD = transposerSequence(sequenceLeadBase, 4);
		const sequenceContreChantD = transposerSequence(sequenceContreChantBase, 5);
		const sequenceBassesD = transposerSequence(sequenceBassesBase, 1);
		const sequenceAccentsD = sequenceAccentsBase.map(function (accent, index) {
			if (accent <= 0) {
				return 0;
			}
			return index % 2 === 0 ? 1.1 : 0.9;
		});

		// Forme complete A-B-C-D: 4 parties distinctes avant la boucle.
		const sequenceLead = sequenceLeadA.concat(sequenceLeadB, sequenceLeadC, sequenceLeadD);
		const sequenceContreChant = sequenceContreChantA.concat(
			sequenceContreChantB,
			sequenceContreChantC,
			sequenceContreChantD
		);
		const sequenceBasses = sequenceBassesA.concat(sequenceBassesB, sequenceBassesC, sequenceBassesD);
		const sequenceAccents = sequenceAccentsA.concat(sequenceAccentsB, sequenceAccentsC, sequenceAccentsD);
		// Position courante dans la sequence.
		let indexNote = 0;
		// Controle explicite de la lecture musicale.
		let musiqueActive = false;

		// Joue une note arcade avec une lead, un contre-chant et une basse.
		function jouerNoteArcade(frequenceLead, frequenceContreChant, frequenceBasse, accent) {
			// Si toutes les couches sont muettes ou l'audio est suspendu, ne rien jouer.
			if (
				contexteAudio.state !== "running" ||
				((frequenceLead <= 0 || Number.isNaN(frequenceLead)) &&
					(frequenceContreChant <= 0 || Number.isNaN(frequenceContreChant)) &&
					(frequenceBasse <= 0 || Number.isNaN(frequenceBasse)))
			) {
				return;
			}

			// Intensite de la pulsation sur le pas courant.
			const intensite = accent > 0 ? accent : 1;

			if (frequenceLead > 0) {
				// Oscillateur principal de la melodie.
				const oscillateurLead = contexteAudio.createOscillator();
				const gainLead = contexteAudio.createGain();

				oscillateurLead.type = "square";
				oscillateurLead.frequency.value = frequenceLead;

				gainLead.gain.setValueAtTime(0.0001, contexteAudio.currentTime);
				gainLead.gain.exponentialRampToValueAtTime(0.045 * intensite, contexteAudio.currentTime + 0.006);
				gainLead.gain.exponentialRampToValueAtTime(0.0001, contexteAudio.currentTime + 0.115);

				oscillateurLead.connect(gainLead);
				gainLead.connect(contexteAudio.destination);
				oscillateurLead.start();
				oscillateurLead.stop(contexteAudio.currentTime + 0.12);
			}

			if (frequenceContreChant > 0) {
				// Petit contre-chant aigu pour l'identite arcade.
				const oscillateurContreChant = contexteAudio.createOscillator();
				const gainContreChant = contexteAudio.createGain();
				const filtreContreChant = contexteAudio.createBiquadFilter();

				oscillateurContreChant.type = "sawtooth";
				oscillateurContreChant.frequency.value = frequenceContreChant;
				filtreContreChant.type = "bandpass";
				filtreContreChant.frequency.value = 1800;
				filtreContreChant.Q.value = 1.4;

				gainContreChant.gain.setValueAtTime(0.0001, contexteAudio.currentTime);
				gainContreChant.gain.exponentialRampToValueAtTime(0.016 * intensite, contexteAudio.currentTime + 0.006);
				gainContreChant.gain.exponentialRampToValueAtTime(0.0001, contexteAudio.currentTime + 0.095);

				oscillateurContreChant.connect(gainContreChant);
				gainContreChant.connect(filtreContreChant);
				filtreContreChant.connect(contexteAudio.destination);
				oscillateurContreChant.start();
				oscillateurContreChant.stop(contexteAudio.currentTime + 0.1);
			}

			if (frequenceBasse > 0) {
				// Basse rythmique propre et legere pour soutenir la boucle.
				const oscillateurBasse = contexteAudio.createOscillator();
				const gainBasse = contexteAudio.createGain();
				const filtreBasse = contexteAudio.createBiquadFilter();

				oscillateurBasse.type = "triangle";
				oscillateurBasse.frequency.value = frequenceBasse;
				filtreBasse.type = "lowpass";
				filtreBasse.frequency.value = 420;
				filtreBasse.Q.value = 0.7;

				gainBasse.gain.setValueAtTime(0.0001, contexteAudio.currentTime);
				gainBasse.gain.exponentialRampToValueAtTime(0.032 * intensite, contexteAudio.currentTime + 0.01);
				gainBasse.gain.exponentialRampToValueAtTime(0.0001, contexteAudio.currentTime + 0.13);

				oscillateurBasse.connect(gainBasse);
				gainBasse.connect(filtreBasse);
				filtreBasse.connect(contexteAudio.destination);
				oscillateurBasse.start();
				oscillateurBasse.stop(contexteAudio.currentTime + 0.14);
			}
		}

		// Demarre la musique depuis le debut apres clic sur un bouton overlay.
		function demarrerMusiqueDepuisDebut() {
			musiqueActive = true;
			indexNote = 0;

			if (contexteAudio.state === "suspended") {
				contexteAudio.resume().catch(function () {
					// Ignore si le navigateur bloque encore l'audio.
				});
			}
		}

		// Coupe la musique quand la page n'est plus visible.
		function couperMusique() {
			musiqueActive = false;

			if (contexteAudio.state === "running") {
				contexteAudio.suspend().catch(function () {
					// Ignore les erreurs de suspension audio.
				});
			}
		}

		// Horloge musicale qui parcourt la sequence en boucle.
		const identifiantIntervalleMusique = window.setInterval(function () {
			if (!musiqueActive || document.hidden) {
				return;
			}

			// Frequences de la boucle arcade sur le pas courant.
			const frequenceLead = sequenceLead[indexNote];
			const frequenceContreChant = sequenceContreChant[indexNote % sequenceContreChant.length];
			const frequenceBasse = sequenceBasses[indexNote % sequenceBasses.length];
			const accent = sequenceAccents[indexNote % sequenceAccents.length];
			jouerNoteArcade(frequenceLead, frequenceContreChant, frequenceBasse, accent);
			indexNote = (indexNote + 1) % sequenceLead.length;
		}, 140);

		// Relance la musique depuis le debut sur les boutons overlays.
		const identifiantsBoutonsOverlay = ["bouton-demarrer", "bouton-recommencer", "bouton-continuer"];
		for (let i = 0; i < identifiantsBoutonsOverlay.length; i = i + 1) {
			const boutonOverlay = document.getElementById(identifiantsBoutonsOverlay[i]);
			if (boutonOverlay instanceof HTMLButtonElement) {
				boutonOverlay.addEventListener("click", demarrerMusiqueDepuisDebut);
			}
		}

		// Coupe la musique si l'onglet/la fenetre n'est plus visible.
		document.addEventListener("visibilitychange", function () {
			if (document.hidden) {
				couperMusique();
			}
		});

		// Coupe la musique generee en JS au moment d'une victoire.
		window.addEventListener("victoire-obtenue", couperMusique);

		// Nettoie proprement l'intervalle si la page est quittee/rechargee.
		window.addEventListener("beforeunload", function () {
			couperMusique();
			clearInterval(identifiantIntervalleMusique);
		});
	}

	// Dessine les decorations PNG du theme chevalier sur le mur du fond.
	function dessinerDecorationMurChevalier(largeurVue, hauteurVue) {
		if (!ctx) {
			return;
		}

		const largeurObjet = Math.max(360, Math.round(largeurVue * 0.54));
		const ratioObjet =
			imageBouclierMur.complete && imageBouclierMur.naturalHeight > 0
				? imageBouclierMur.naturalWidth / imageBouclierMur.naturalHeight
				: 1;
		const hauteurObjet = largeurObjet / ratioObjet;
		const positionY = hauteurVue * 0.26;

		ctx.save();
		ctx.globalAlpha = 0.95;

		// Place le bouclier au centre du mur du fond.
		if (imageBouclierMur.complete && imageBouclierMur.naturalWidth > 0) {
			ctx.drawImage(
				imageBouclierMur,
				largeurVue * 0.5 - largeurObjet / 2,
				positionY,
				largeurObjet,
				hauteurObjet
			);
		}

		ctx.restore();
	}

	function dessinerFondPleinEcran() {
		// Si le contexte ou l'image ne sont pas prets, on sort.
		if (!ctx || !imageFond.complete || imageFond.naturalWidth === 0) {
			return;
		}

		// Largeur actuelle de la zone visible du navigateur.
		const largeurVue = window.innerWidth;
		// Hauteur actuelle de la zone visible du navigateur.
		const hauteurVue = window.innerHeight;
		// Largeur native du fichier image de fond.
		const largeurImage = imageFond.naturalWidth;
		// Hauteur native du fichier image de fond.
		const hauteurImage = imageFond.naturalHeight;
		// Ratio largeur/hauteur de l'image source pour conserver les proportions.
		const ratioImage = largeurImage / hauteurImage;
		// Ratio largeur/hauteur de la fenetre pour adapter le cadrage.
		const ratioVue = largeurVue / hauteurVue;

		// Largeur finale de l'image dessinee dans le canvas.
		let largeurDessin = largeurVue;
		// Hauteur finale de l'image dessinee dans le canvas.
		let hauteurDessin = hauteurVue;
		// Decalage horizontal applique pour centrer le visuel.
		let decalageX = 0;
		// Decalage vertical applique pour centrer le visuel.
		let decalageY = 0;

		// Si l'image est plus large que la vue, on centre en X.
		if (ratioImage > ratioVue) {
			hauteurDessin = hauteurVue;
			largeurDessin = hauteurDessin * ratioImage;
			decalageX = (largeurVue - largeurDessin) / 2;
		} else {
			// Sinon on centre en Y.
			largeurDessin = largeurVue;
			hauteurDessin = largeurDessin / ratioImage;
			decalageY = (hauteurVue - hauteurDessin) / 2;
		}

		// Nettoie puis dessine le fond.
		ctx.clearRect(0, 0, largeurVue, hauteurVue);
		ctx.drawImage(imageFond, decalageX, decalageY, largeurDessin, hauteurDessin);
		dessinerDecorationMurChevalier(largeurVue, hauteurVue);
	}

	// Fonction qui redimensionne le canvas de fond a la taille de l'ecran.
	function redimensionnerCanvasFond() {
		// Largeur visible a appliquer au canvas.
		const largeurVue = window.innerWidth;
		// Hauteur visible a appliquer au canvas.
		const hauteurVue = window.innerHeight;
		// Ratio de pixels pour eviter un rendu flou sur ecrans haute densité.
		const ratioPixels = window.devicePixelRatio || 1;

		// Taille interne du canvas (en pixels reels).
		canvasFond.width = Math.floor(largeurVue * ratioPixels);
		canvasFond.height = Math.floor(hauteurVue * ratioPixels);
		// Taille visuelle du canvas (en CSS).
		canvasFond.style.width = largeurVue + "px";
		canvasFond.style.height = hauteurVue + "px";

		// Applique le ratio pour garder un dessin net.
		if (ctx) {
			ctx.setTransform(ratioPixels, 0, 0, ratioPixels, 0, 0);
		}

		// Redessine le fond apres resize.
		dessinerFondPleinEcran();
	}

	// Redessine si la fenetre change de taille.
	window.addEventListener("resize", redimensionnerCanvasFond);
	window.addEventListener("orientationchange", redimensionnerCanvasFond);
	// Dessine aussi des que l'image est chargee.
	imageFond.addEventListener("load", redimensionnerCanvasFond);
	imageBouclierMur.addEventListener("load", redimensionnerCanvasFond);
	// Premier affichage.
	redimensionnerCanvasFond();
}
