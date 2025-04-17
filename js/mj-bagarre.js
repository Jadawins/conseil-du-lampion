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
  const pvMax = entite?.pvMax ?? entite?.pv ?? "?";
  return `${pv} / ${pvMax}`;
}

function afficherOrdreCombat() {
  const tbody = document.getElementById("liste-initiative");
  if (!tbody) return;

  tbody.innerHTML = "";

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
}

function afficherTourActuel() {
  const entite = ordreCombat[currentTurnIndex];
  if (!entite) return;

  messageTour.textContent = `🎯 C'est au tour de ${entite.pseudo || entite.nom} de jouer.`;

  const estMonstre = !entite.id;
  zoneActions.style.display = estMonstre ? "block" : "none";
}

// 🎯 Passer le tour
boutonPasser.addEventListener("click", async () => {
  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    console.log("✔️ Tour passé :", data);
    await fetchOrdreCombat();
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

  ul.innerHTML = "";

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
  document.getElementById("ordre-combat").style.display = "none";
  document.getElementById("tour-actuel").style.display = "none";
  document.getElementById("formulaire-soin").classList.remove("hidden");

  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (!response.ok) return;
  const data = await response.json();

  const joueurs = data.joueurs || [];
  const monstres = data.monstres || [];
  const select = document.getElementById("cible-soin");
  select.innerHTML = "";

  joueurs.forEach(joueur => {
    const option = document.createElement("option");
    option.value = joueur.pseudo;
    option.textContent = `🧝 ${joueur.pseudo}`;
    select.appendChild(option);
  });

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
    console.log("📤 Données envoyées :", {
      sessionId,
      auteur: "MJ",
      cible,
      soin: valeur
    });

    if (!response.ok) {
      const erreurTexte = await response.text();
      console.error("🛑 Erreur API (brute) :", erreurTexte);
      throw new Error("Erreur API");
    }
    
    document.getElementById("formulaire-soin").classList.add("hidden");
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("tour-actuel").style.display = "block";
    document.getElementById("valeur-soin").value = "";

    await fetchOrdreCombat();
    await afficherJournalCombat();
  } catch (err) {
    console.error("❌ Erreur lors de l'envoi du soin :", err);
    alert("Erreur lors de l’envoi du soin. Veuillez réessayer.");
  }
});

document.getElementById("annuler-soin").addEventListener("click", () => {
  document.getElementById("formulaire-soin").classList.add("hidden");
  document.getElementById("ordre-combat").style.display = "block";
  document.getElementById("tour-actuel").style.display = "block";
  document.getElementById("valeur-soin").value = "";
});

fetchOrdreCombat();
setInterval(fetchOrdreCombat, 3000);
window.addEventListener("DOMContentLoaded", afficherJournalCombat);
setInterval(afficherJournalCombat, 3000);
