const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId") || localStorage.getItem("sessionId");

const ordreUl = document.getElementById("liste-initiative");
const messageTour = document.getElementById("info-tour");
const zoneActions = document.getElementById("actions-mj");
const boutonAttaquer = document.getElementById("btn-attaquer");
const boutonSoigner = document.getElementById("btn-soigner");
const boutonPasser = document.getElementById("btn-passer");

let currentTurnIndex = 0;
let ordreCombat = [];

async function fetchOrdreCombat() {
    try {
      const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
      if (response.ok) {
        const data = await response.json();
        ordreCombat = data?.ordreTour || [];
        currentTurnIndex = data?.indexTour || 0;
        afficherOrdreCombat();
        afficherTourActuel();
      } else {
        console.error("Erreur récupération session combat");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
    }
  }

  function formatPV(entite) {
    const pv = entite?.pv ?? "?";
    const pvMax = entite?.pvMax ?? entite?.pv ?? "?"; // Si pvMax absent, on suppose égal à pv
    return `${pv} / ${pvMax}`;
  }
  
  function afficherOrdreCombat() {
    ordreUl.innerHTML = "";
  
    const table = document.createElement("table");
    table.className = "table-ordre";
  
    const thead = document.createElement("thead");
    thead.innerHTML = `<tr><th>Nom</th><th>Initiative</th><th>PV</th></tr>`;
    table.appendChild(thead);
  
    const tbody = document.createElement("tbody");
    ordreCombat.forEach((entite, index) => {
      const tr = document.createElement("tr");
  
      tr.innerHTML = `
        <td>${index === currentTurnIndex ? "🎯 " : ""}${entite.pseudo || entite.nom}</td>
        <td>${entite.initiative}</td>
        <td>${formatPV(entite)}</td>
      `;

      if (entite.pv && entite.pvMax && entite.pv / entite.pvMax < 0.3) {
        tr.classList.add("low-hp");
      }
  
      if (index === currentTurnIndex) tr.classList.add("highlight-row");
      tbody.appendChild(tr);
    });
  
    table.appendChild(tbody);
    ordreUl.appendChild(table);
  }
  

function afficherTourActuel() {
  const entite = ordreCombat[currentTurnIndex];
  if (entite) {
    messageTour.textContent = `🎯 C'est au tour de ${entite.pseudo || entite.nom} de jouer.`;

    // Si c'est un monstre → MJ peut agir
    const estMonstre = !entite.id; // Si pas d'ID, c'est un monstre
    zoneActions.style.display = estMonstre ? "block" : "none";
  }
}

// 🎯 Passer le tour (MAJ dans Azure)
boutonPasser.addEventListener("click", async () => {
  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    console.log("✔️ Tour passé :", data);
    await fetchOrdreCombat(); // recharge la session depuis Azure pour mettre à jour l’interface
  } catch (err) {
    console.error("❌ Erreur lors du passage du tour :", err);
  }
});

async function afficherJournalCombat() {
  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (!response.ok) return;

  const data = await response.json();
  const log = data.logCombat || [];
  const ul = document.getElementById("log-combat");

  ul.innerHTML = ""; // Nettoyer

  log.slice(-10).reverse().forEach(entry => {
    const li = document.createElement("li");
    let texte = "";

    const time = new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });

    if (entry.type === "soin") {
      texte = `🩹 [${time}] ${entry.auteur} soigne ${entry.cible} de ${entry.valeur} PV`;
    } else if (entry.type === "attaque") {
      texte = `⚔️ [${time}] ${entry.auteur} attaque ${entry.cible} pour ${entry.valeur} dégâts`;
    } else {
      texte = `📌 [${time}] ${entry.auteur} fait une action inconnue.`;
    }

    li.textContent = texte;
    ul.appendChild(li);
  });
}

boutonSoigner.addEventListener("click", async () => {
  // Masquer les éléments non nécessaires pendant l'action
  document.getElementById("ordre-combat").style.display = "none";
  document.getElementById("tour-actuel").style.display = "none";

  // Afficher le formulaire de soin
  document.getElementById("formulaire-soin").classList.remove("hidden");

  // Récupérer les données de la session
  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (!response.ok) return;
  const data = await response.json();

  const joueurs = data.joueurs || [];
  const monstres = data.monstres || [];

  const select = document.getElementById("cible-soin");
  select.innerHTML = ""; // Nettoyer la liste

  // Ajouter les joueurs
  joueurs.forEach(joueur => {
    const option = document.createElement("option");
    option.value = joueur.pseudo;
    option.textContent = `🧝 ${joueur.pseudo}`;
    select.appendChild(option);
  });

  // Ajouter les monstres
  monstres.forEach(monstre => {
    const option = document.createElement("option");
    option.value = monstre.nom;
    option.textContent = `👹 ${monstre.nom}`;
    select.appendChild(option);
  });
});

document.getElementById("valider-soin").addEventListener("click", async () => {
  const cible = document.getElementById("cible-soin").value;
  const valeur = parseInt(document.getElementById("valeur-soin").value);

  if (!cible || isNaN(valeur) || valeur <= 0) {
    alert("Veuillez sélectionner une cible et entrer une valeur de soin valide.");
    return;
  }

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/SoinJoueur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        auteur: "MJ",
        cible,
        soin: valeur
      })
    });

    if (!response.ok) throw new Error("Erreur API");

    // Réinitialiser l'UI
    document.getElementById("formulaire-soin").classList.add("hidden");
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("tour-actuel").style.display = "block";
    document.getElementById("valeur-soin").value = "";

    // Mettre à jour l'affichage
    await fetchOrdreCombat();
    await afficherJournalCombat();
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi du soin :", err);
    alert("Erreur lors de l’envoi du soin. Veuillez réessayer.");
  }
});


fetchOrdreCombat();
// 🔁 Rafraîchissement du journal toutes les 3 sec
setInterval(fetchOrdreCombat, 3000);
window.addEventListener("DOMContentLoaded", afficherJournalCombat);

setInterval(afficherJournalCombat, 3000);