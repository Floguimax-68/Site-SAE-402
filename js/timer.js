const timerCanvas = document.getElementById("canva-timer");

if (timerCanvas instanceof HTMLCanvasElement) {
	const ctx = timerCanvas.getContext("2d");
	const chronoPanelImage = new Image();
	chronoPanelImage.src = "img/pancarte-canva-chrono.png";
	let t = 60;

	const renderTimer = () => {
		if (!ctx) {
			return;
		}

		const viewportWidth = timerCanvas.clientWidth;
		const viewportHeight = timerCanvas.clientHeight;
		const topOffset = 0;
		const label = t + "s";
		const badgeWidth = Math.max(165, Math.min(viewportWidth * 0.31, 310));
		const panelRatio =
			chronoPanelImage.complete && chronoPanelImage.naturalWidth > 0
				? chronoPanelImage.naturalWidth / chronoPanelImage.naturalHeight
				: 1.75;
		const badgeHeight = badgeWidth / panelRatio;
		const badgeX = (viewportWidth - badgeWidth) / 2;
		const badgeY = topOffset;

		const textBoxX = badgeX + badgeWidth * 0.16;
		const textBoxY = badgeY + badgeHeight * 0.48;
		const textBoxWidth = badgeWidth * 0.68;
		const textBoxHeight = badgeHeight * 0.36;
		let fontSize = Math.max(18, Math.round(textBoxHeight * 0.7));

		ctx.clearRect(0, 0, viewportWidth, viewportHeight);

		if (chronoPanelImage.complete && chronoPanelImage.naturalWidth > 0) {
			ctx.drawImage(chronoPanelImage, badgeX, badgeY, badgeWidth, badgeHeight);
		}

		ctx.font = "700 " + fontSize + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		while (fontSize > 16 && ctx.measureText(label).width > textBoxWidth) {
			fontSize = fontSize - 1;
			ctx.font = "700 " + fontSize + "px 'Trebuchet MS', 'Segoe UI', sans-serif";
		}

		ctx.fillStyle = "#ffffff";
		ctx.textAlign = "center";
		ctx.textBaseline = "middle";
		ctx.fillText(label, textBoxX + textBoxWidth / 2, textBoxY + textBoxHeight / 2);
	};

	const resizeTimerCanvas = () => {
		const viewportWidth = window.innerWidth;
		const viewportHeight = window.innerHeight;
		const dpr = window.devicePixelRatio || 1;

		timerCanvas.width = Math.floor(viewportWidth * dpr);
		timerCanvas.height = Math.floor(viewportHeight * dpr);
		timerCanvas.style.width = viewportWidth + "px";
		timerCanvas.style.height = viewportHeight + "px";

		if (ctx) {
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
		}

		renderTimer();
	};

	window.addEventListener("resize", resizeTimerCanvas);
	window.addEventListener("orientationchange", resizeTimerCanvas);
	chronoPanelImage.addEventListener("load", renderTimer);
	resizeTimerCanvas();

	const intervalId = setInterval(() => {
		if (t > 0) {
			t = t - 1;
			renderTimer();
		}

		if (t === 0) {
			clearInterval(intervalId);
			renderTimer();
			window.dispatchEvent(new Event("timer-ended"));
		}
	}, 1000);
}
