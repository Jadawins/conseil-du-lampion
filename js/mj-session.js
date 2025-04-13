// 📜 Récupération des paramètres de l'URL depuis la query string
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

// 🔹 Mise à jour du titre de l'aventure avec l'icône du dé 20
const titreAventure = document.getElementById("titre-aventure");
if (titreAventure && nomAventure) {
  titreAventure.innerHTML = `<img src="assets/img/d20.png" class="title-icon" alt="d20"> ${nomAventure}`;
}

// 🏷️ Affichage de l'ID de session dans l'en-tête
const sessionIdDisplay = document.getElementById("session-id-display");
if (sessionIdDisplay && sessionId) {
  sessionIdDisplay.textContent = `🄐 Session ID : ${sessionId}`;
}

// 🧝‍♂️ Journal des joueurs connectés à la session
const logJoueursUl = document.getElementById("log-joueurs");
const joueursAffiches = new Set(); // pour éviter les doublons

// 🔁 Vérifie les nouveaux joueurs toutes les 3 secondes
async function verifierJoueurs() {
  // ⛔ Sécurité : sessionId ou élément manquant
  if (!sessionId || !logJoueursUl) return;

  try {
    // 🌐 Appel API pour récupérer les données de la session
    const response = await fetch(
      `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`
    );
    const data = await response.json();

    // ✅ Ajoute les nouveaux joueurs détectés
    if (data?.joueurs) {
      data.joueurs.forEach((joueur) => {
        console.log("👤 Nouveau joueur :", joueur.pseudo);

        if (!joueursAffiches.has(joueur.pseudo)) {
          const li = document.createElement("li");
          li.textContent = `👹 ${joueur.pseudo} a rejoint la partie.`;
          li.classList.add("log-joueur");
          logJoueursUl.appendChild(li);
          joueursAffiches.add(joueur.pseudo);
        }
      });
    }
  } catch (err) {
    // 🚨 Erreur dans la requête API
    console.error("Erreur lors de la récupération des joueurs :", err);
  }
}

// ⏱️ Démarre la vérification en boucle
setInterval(verifierJoueurs, 3000);