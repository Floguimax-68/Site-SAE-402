const canvas = document.getElementById("canva-background");

if (canvas instanceof HTMLCanvasElement) {
	const ctx = canvas.getContext("2d");
	const backgroundImage = new Image();
	backgroundImage.src = "img/Fond-canva-fruit-ninja-pommes.jpg";

	const drawBackgroundFull = () => {
		if (!ctx || !backgroundImage.complete || backgroundImage.naturalWidth === 0) {
			return;
		}

		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const imageWidth = backgroundImage.naturalWidth;
		const imageHeight = backgroundImage.naturalHeight;
		const imageRatio = imageWidth / imageHeight;
		const viewportRatio = viewportWidth / viewportHeight;

		let drawWidth = viewportWidth;
		let drawHeight = viewportHeight;
		let offsetX = 0;
		let offsetY = 0;

		if (imageRatio > viewportRatio) {
			drawHeight = viewportHeight;
			drawWidth = drawHeight * imageRatio;
			offsetX = (viewportWidth - drawWidth) / 2;
		} else {
			drawWidth = viewportWidth;
			drawHeight = drawWidth / imageRatio;
			offsetY = (viewportHeight - drawHeight) / 2;
		}

		ctx.clearRect(0, 0, viewportWidth, viewportHeight);
		ctx.drawImage(backgroundImage, offsetX, offsetY, drawWidth, drawHeight);
	};

	const resizeCanvas = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;

		canvas.width = Math.floor(viewportWidth * dpr);
		canvas.height = Math.floor(viewportHeight * dpr);
		canvas.style.width = viewportWidth + "px";
		canvas.style.height = viewportHeight + "px";

		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		drawBackgroundFull();
	};

	window.addEventListener("resize", resizeCanvas);
	window.addEventListener("orientationchange", resizeCanvas);
	backgroundImage.addEventListener("load", resizeCanvas);
	resizeCanvas();
}
