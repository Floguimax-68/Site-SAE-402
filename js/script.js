// On recupere le canvas du fond.
const canvasFond = document.getElementById("canva-background");

if (canvasFond instanceof HTMLCanvasElement) {
	// Contexte 2D pour dessiner.
	const ctx = canvasFond.getContext("2d");
	// Image de fond du jeu.
	const imageFond = new Image();
	imageFond.src = "img/Fond-canva-fruit-ninja-pommes.jpg";

	// Dessine l'image en mode plein ecran sans deformation.
	const dessinerFondPleinEcran = () => {
		// Si le contexte ou l'image ne sont pas prets, on sort.
		if (!ctx || !imageFond.complete || imageFond.naturalWidth === 0) {
			return;
		}

		// Taille de la fenetre.
		const largeurVue = window.innerWidth;
		const hauteurVue = window.innerHeight;
		// Taille originale de l'image.
		const largeurImage = imageFond.naturalWidth;
		const hauteurImage = imageFond.naturalHeight;
		// Ratios pour garder les proportions.
		const ratioImage = largeurImage / hauteurImage;
		const ratioVue = largeurVue / hauteurVue;

		// Valeurs de dessin par defaut.
		let largeurDessin = largeurVue;
		let hauteurDessin = hauteurVue;
		let decalageX = 0;
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
	};

	// Adapte le canvas a la taille de l'ecran.
	const redimensionnerCanvasFond = () => {
		// Nouvelle taille de la fenetre.
		const largeurVue = window.innerWidth;
		const hauteurVue = window.innerHeight;
		// Ratio ecran (retina, etc.).
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
	};

	// Redessine si la fenetre change de taille.
	window.addEventListener("resize", redimensionnerCanvasFond);
	window.addEventListener("orientationchange", redimensionnerCanvasFond);
	// Dessine aussi des que l'image est chargee.
	imageFond.addEventListener("load", redimensionnerCanvasFond);
	// Premier affichage.
	redimensionnerCanvasFond();
}
