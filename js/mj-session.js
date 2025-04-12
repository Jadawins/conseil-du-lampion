const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const nomAventure = urlParams.get("nomAventure");

const titreEl = document.getElementById("titre-aventure");
const sessionIdEl = document.getElementById("session-id-display");
const logJoueursUl = document.getElementById("log-joueurs");
const btnDemarrer = document.getElementById("btn-demarrer");

const joueursAffiches = new Set();

// 🎯 Initialisation
function init() {
  if (titreEl) titreEl.textContent = `⚔️ ${nomAventure}`;
  if (sessionIdEl) sessionIdEl.textContent = `🆔 Session ID : ${sessionId}`;

  if (btnDemarrer) {
    btnDemarrer.addEventListener("click", () => {
      const url = `mj-combat.html?sessionId=${sessionId}&nomAventure=${encodeURIComponent(nomAventure)}`;
      window.location.href = url;
    });
  }

  // ⏱️ Rafraîchit toutes les 3 secondes
  setInterval(verifierJoueurs, 3000);
}

// 🧙 Vérifie les joueurs ayant rejoint
async function verifierJoueurs() {
  if (!sessionId) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (!response.ok) throw new Error("Réponse non valide de l'API");

    const data = await response.json();
    if (data?.joueurs) {
      data.joueurs.forEach((joueur) => {
        if (!joueursAffiches.has(joueur.pseudo)) {
          const li = document.createElement("li");
          li.textContent = `🧝 ${joueur.pseudo} a rejoint la partie.`;
          li.classList.add("log-joueur");
          logJoueursUl.appendChild(li);
          joueursAffiches.add(joueur.pseudo);
        }
      });
    }
  } catch (err) {
    console.error("Erreur lors de la récupération des joueurs :", err);
  }
}

init();
