// ✅ joueur-bagarre.js – gestion du tour du joueur

const sessionId = localStorage.getItem("sessionId");
const pseudo = localStorage.getItem("pseudo");

const messageTour = document.getElementById("message-tour");
const actionSection = document.getElementById("action-section");
const attenteSection = document.getElementById("attente-section");
const pvAffichage = document.getElementById("pv-affichage");

async function recupererSession() {
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (response.ok) {
      return await response.json();
    }
  } catch (err) {
    console.error("Erreur GetSession:", err);
  }
  return null;
}

function afficherEtat(pv, pvMax, joueurActif) {
  pvAffichage.textContent = `❤️ ${pv} / ${pvMax} PV`;
  if ((joueurActif?.pseudo || joueurActif?.nom) === pseudo) {
    messageTour.textContent = "🗡️ C’est votre tour !";
    actionSection.style.display = "block";
    attenteSection.style.display = "none";
  } else {
    messageTour.textContent = `⏳ En attente du tour de ${joueurActif?.pseudo || joueurActif?.nom || "..."}`;
    actionSection.style.display = "none";
    attenteSection.style.display = "block";
  }
}

async function verifierTour() {
  const data = await recupererSession();
  if (!data) return;

  const joueur = data.joueurs?.find(j => j.pseudo === pseudo);
  const ordre = data.ordreTour || [];
  const indexTour = data.indexTour ?? 0;
  const joueurActif = ordre[indexTour];

  if (joueur) {
    afficherEtat(joueur.pv, joueur.pvMax || joueur.pv, joueurActif);
  }
}

async function afficherOrdreDuTour() {
  const data = await recupererSession();
  const ordre = data?.ordreTour || [];
  const indexTour = data?.indexTour ?? 0;

  const conteneur = document.getElementById("ordre-tour");
  if (!conteneur) return;
  conteneur.innerHTML = "";

  const table = document.createElement("table");
  table.className = "table-monstres";

  const thead = document.createElement("thead");
  thead.innerHTML = `<tr><th>Nom</th><th>Initiative</th></tr>`;
  table.appendChild(thead);

  const tbody = document.createElement("tbody");

  ordre.forEach((perso, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `<td>${perso.pseudo || perso.nom}</td><td>${perso.initiative}</td>`;
    if (index === indexTour) tr.classList.add("highlight-row");
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  conteneur.appendChild(table);
}

// 🔁 Rafraîchissement toutes les 3 sec
setInterval(verifierTour, 3000);
setInterval(afficherOrdreDuTour, 3000);
window.addEventListener("DOMContentLoaded", afficherOrdreDuTour);
