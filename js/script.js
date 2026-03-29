// Element canvas utilise pour afficher le decor de fond.
const canvasFond = document.getElementById("canva-background");

if (canvasFond instanceof HTMLCanvasElement) {
	// Contexte 2D qui permet de dessiner sur le canvas du fond.
	const ctx = canvasFond.getContext("2d");
	// Objet image qui contient le visuel de fond du jeu.
	const imageFond = new Image();
	imageFond.src = "img/Fond-canva-fruit-ninja-pommes.webp";

	// Dessine l'image en mode plein ecran sans deformation.
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
	// Premier affichage.
	redimensionnerCanvasFond();
}
