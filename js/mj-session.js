// 🔄 mj-session.js – récupération du nom de l'aventure depuis GetSession
const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId") || localStorage.getItem("sessionId");

const titreAventure = document.getElementById("titre-aventure");
const sessionIdDisplay = document.getElementById("session-id-display");
if (sessionIdDisplay && sessionId) {
  sessionIdDisplay.textContent = `Session ID : ${sessionId}`;
}

const logJoueursUl = document.getElementById("log-joueurs");
const joueursAffiches = new Set();

async function recupererSessionDepuisAPI(sessionId) {
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (e) {
    console.error("Erreur API:", e);
  }
  return null;
}

(async () => {
  const data = await recupererSessionDepuisAPI(sessionId);
  const nomAventure = data?.nomAventure || "(Aventure mystère)";
  if (titreAventure) {
    titreAventure.textContent = nomAventure;
  }
})();

async function verifierJoueurs() {
  if (!sessionId || !logJoueursUl) return;
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    const data = await response.json();
    if (data?.joueurs) {
      data.joueurs.forEach((joueur) => {
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
    console.error("Erreur lors de la récupération des joueurs :", err);
  }
}

setInterval(verifierJoueurs, 3000);

const btnDemarrerCombat = document.getElementById("btn-demarrer-combat");

if (btnDemarrerCombat && sessionId) {
  btnDemarrerCombat.addEventListener("click", () => {
    window.location.href = `mj-combat.html?sessionId=${sessionId}`;
  });
}