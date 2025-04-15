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

function estMonTour(ordre, joueurActif) {
  return joueurActif?.nom === pseudo;
}

function afficherEtat(pv, pvMax, joueurActif) {
  pvAffichage.textContent = `❤️ ${pv} / ${pvMax} PV`;
  if (joueurActif?.nom === pseudo) {
    messageTour.textContent = "🗡️ C’est votre tour !";
    actionSection.style.display = "block";
    attenteSection.style.display = "none";
  } else {
    messageTour.textContent = `⏳ En attente du tour de ${joueurActif?.nom || "..."}`;
    actionSection.style.display = "none";
    attenteSection.style.display = "block";
  }
}

async function verifierTour() {
  const data = await recupererSession();
  if (!data) return;

  const joueur = data.joueurs?.find(j => j.pseudo === pseudo);
  const ordre = JSON.parse(localStorage.getItem(`ordreFinal-${sessionId}`)) || [];
  const indexTour = parseInt(localStorage.getItem(`indexTour-${sessionId}`)) || 0;
  const joueurActif = ordre[indexTour];

  if (joueur) {
    afficherEtat(joueur.pv, joueur.pvMax || joueur.pv, joueurActif);
  }
}

function afficherOrdreDuTour() {
    const ordreKey = `ordreFinal-${sessionId}`;
    const indexKey = `indexTour-${sessionId}`;
    const ordre = JSON.parse(localStorage.getItem(ordreKey)) || [];
    const indexTour = parseInt(localStorage.getItem(indexKey)) || 0;
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
  
  // 🔁 Mettre à jour l'ordre toutes les 3 secondes
  setInterval(afficherOrdreDuTour, 3000);
  window.addEventListener("DOMContentLoaded", afficherOrdreDuTour);

setInterval(verifierTour, 3000);
