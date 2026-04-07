// Verrouille le lancement du jeu tant que la cible GPS n'est pas atteinte.
(function () {
    const cible = {
        latitude: 47.729134,
        longitude: 7.301284
    };
    const rayonValidationMetres = 14;
    const optionsGeo = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 1000
    };

    const overlayGps = document.getElementById("surcouche-gps");
    const overlayRegles = document.getElementById("surcouche-regles");
    const messageGps = document.getElementById("message-gps");
    const mapContainer = document.getElementById("map");

    let identifiantWatch = null;
    let carte = null;
    let marqueurJoueur = null;
    let cercleCible = null;
    let ligneDirection = null;
    let jeuDebloque = false;

    function mettreMessage(texte) {
        if (messageGps instanceof HTMLElement) {
            messageGps.textContent = texte;
        }
    }

    function initialiserCarte() {
        if (!(mapContainer instanceof HTMLElement) || carte || typeof L === "undefined") {
            return;
        }

        const positionCible = [cible.latitude, cible.longitude];
        carte = L.map("map", {
            zoomControl: true,
            attributionControl: true
        }).setView(positionCible, 16);

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            maxZoom: 19,
            attribution: "&copy; <a href=\"http://www.openstreetmap.org/copyright\">OpenStreetMap</a>"
        }).addTo(carte);

        cercleCible = L.circle(positionCible, {
            radius: rayonValidationMetres,
            color: "#0d8a2d",
            fillColor: "#22b34a",
            fillOpacity: 0.3,
            weight: 2
        }).addTo(carte);

        L.marker(positionCible).addTo(carte).bindPopup("Position cible");
    }

    function mettreAJourTraces(positionActuelle) {
        if (!carte) {
            return;
        }

        if (!marqueurJoueur) {
            marqueurJoueur = L.marker(positionActuelle).addTo(carte).bindPopup("Votre position");
        } else {
            marqueurJoueur.setLatLng(positionActuelle);
        }

        if (!ligneDirection) {
            ligneDirection = L.polyline([positionActuelle, [cible.latitude, cible.longitude]], {
                color: "#d22525",
                weight: 4,
                opacity: 0.85
            }).addTo(carte);
        } else {
            ligneDirection.setLatLngs([positionActuelle, [cible.latitude, cible.longitude]]);
        }

        carte.setView(positionActuelle, 16, { animate: true });
    }

    function lancerJeu() {
        if (jeuDebloque) {
            return;
        }

        jeuDebloque = true;
        if (identifiantWatch !== null) {
            navigator.geolocation.clearWatch(identifiantWatch);
            identifiantWatch = null;
        }

        if (overlayGps instanceof HTMLElement) {
            overlayGps.classList.remove("est-visible");
        }
        if (overlayRegles instanceof HTMLElement) {
            overlayRegles.classList.remove("est-visible");
        }

        window.dispatchEvent(new Event("jeu-demarre"));
    }

    function succes(position) {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;
        const positionActuelle = [latitude, longitude];

        initialiserCarte();
        mettreAJourTraces(positionActuelle);

        if (typeof L === "undefined") {
            mettreMessage("Bibliotheque carte non chargee. Impossible d'afficher la carte.");
            return;
        }

        const distance = L.latLng(latitude, longitude).distanceTo(L.latLng(cible.latitude, cible.longitude));
        if (distance <= rayonValidationMetres) {
            mettreMessage("Bravo, vous etes arrive. Lancement du jeu...");
            lancerJeu();
            return;
        }

        mettreMessage("Distance restante: " + Math.round(distance) + " m. Rejoignez le cercle vert.");
    }

    function erreur(positionErreur) {
        let details = "Impossible de recuperer votre position GPS.";
        if (positionErreur && typeof positionErreur.message === "string" && positionErreur.message.length > 0) {
            details = details + " " + positionErreur.message;
        }
        mettreMessage(details);
    }

    function demarrerSuiviGps() {
        if (!(overlayGps instanceof HTMLElement)) {
            return;
        }

        overlayGps.classList.add("est-visible");
        if (overlayRegles instanceof HTMLElement) {
            overlayRegles.classList.remove("est-visible");
        }

        if (!navigator.geolocation) {
            mettreMessage("Geolocalisation non supportee sur ce navigateur.");
            return;
        }

        if (typeof L === "undefined") {
            mettreMessage("Chargement de la carte impossible. Verifiez la connexion internet.");
            return;
        }

        initialiserCarte();
        mettreMessage("Autorisez la geolocalisation puis marchez jusqu'au cercle vert.");
        identifiantWatch = navigator.geolocation.watchPosition(succes, erreur, optionsGeo);
    }

    demarrerSuiviGps();
})();