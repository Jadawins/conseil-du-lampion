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
  
    const estMonTour = (joueurActif?.pseudo || joueurActif?.nom) === pseudo;
  
    if (estMonTour) {
      messageTour.textContent = "🗡️ C’est votre tour !";
      actionSection.style.display = "block";
      attenteSection.style.display = "none";
    } else {
      messageTour.textContent = `🎯 C'est au tour de ${joueurActif?.pseudo || joueurActif?.nom || "..." } de jouer.`;
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
  const ordreCombat = data?.ordreTour || [];
  const currentTurnIndex = data?.indexTour || 0;
  const tousLesJoueurs = data?.joueurs || [];

  const tbody = document.getElementById("liste-initiative");
  if (!tbody) return;

  tbody.innerHTML = "";

  ordreCombat.forEach((entite, index) => {
    const tr = document.createElement("tr");
    const estJoueur = !!entite.pseudo;

    // Si c’est un joueur, on cherche ses PV
    let pvText = "";
    if (estJoueur) {
      const joueur = tousLesJoueurs.find(j => j.pseudo === entite.pseudo);
      pvText = joueur ? `${joueur.pv ?? "-"} PV` : "-";
    }

    tr.innerHTML = `
      <td>${index === currentTurnIndex ? "🎯 " : ""}${entite.pseudo || entite.nom}</td>
      <td>${estJoueur ? pvText : ""}</td>
    `;

    if (index === currentTurnIndex) tr.classList.add("highlight-row");
    tbody.appendChild(tr);
  });
}

  

// 🔁 Rafraîchissement toutes les 3 sec
setInterval(verifierTour, 3000);
setInterval(afficherOrdreDuTour, 3000);
window.addEventListener("DOMContentLoaded", afficherOrdreDuTour);
