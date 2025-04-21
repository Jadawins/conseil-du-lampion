// ✅ mj-bagarre.js – journal amélioré avec affichage overheal

const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId") || localStorage.getItem("sessionId");

const ordreUl = document.getElementById("liste-initiative");
const messageTour = document.getElementById("info-tour");
const zoneActions = document.getElementById("actions-mj");
const boutonAttaquer = document.getElementById("btn-attaquer");
const boutonSoigner = document.getElementById("btn-soigner");
const boutonPasser = document.getElementById("btn-passer");
const sectionFinCombat = document.getElementById("fin-combat");
const messageFinCombat = document.getElementById("message-fin-combat");
const boutonFinManuelle = document.getElementById("btn-fin-combat");
let joueursAnnoncesKO = [];

let currentTurnIndex = 0;
let ordreCombat = [];

function formatPV(entite, data) {
  const nom = entite.pseudo || entite.nom;
  const ref = [...(data.joueurs || []), ...(data.monstres || [])]
    .find(e => (e.pseudo || e.nom) === nom);

  const pv = ref?.pv ?? entite.pv ?? "?";
  const pvMax = ref?.pvMax ?? entite.pvMax ?? pv ?? "?";

  return `${pv} / ${pvMax}`;
}

function afficherOrdreCombat(data, ordre, indexTour) {
  const tbody = document.getElementById("liste-initiative");
  if (!tbody) return;
  tbody.innerHTML = "";

  ordre.forEach((entite, index) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index === currentTurnIndex ? "🎯 " : ""}${entite.pseudo || entite.nom}</td>
      <td>${entite.initiative}</td>
      <td>${formatPV(entite, data)}</td>
    `;
    if (entite.pv && entite.pvMax && entite.pv / entite.pvMax < 0.3) tr.classList.add("low-hp");
    if (index === indexTour) tr.classList.add("highlight-row");
    tbody.appendChild(tr);
  });
}

function afficherTourActuel(ordre, indexTour) {
  const entite = ordre[indexTour];
  if (!entite) return;

  const estMonstre = !entite.id;

  const messageTour = document.getElementById("info-tour");
  
  messageTour.textContent = `🎯 C'est au tour de ${entite.pseudo || entite.nom} de jouer.`;

  console.log("🔍 MJ - estMonstre =", estMonstre); // DEBUG

  // ✅ Affiche ou masque les boutons MJ
  zoneActions.style.display = estMonstre ? "block" : "none";
}

boutonPasser.addEventListener("click", async () => {
  masquerFormulairesMJ();

  try {
    const sessionId = localStorage.getItem("sessionId");

    const response = await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sessionId }),
    });

    if (!response.ok) throw new Error("Erreur API");

    const result = await response.json();
    console.log("✅ Tour passé :", result);

    await refreshCombat();
  } catch (err) {
    console.error("❌ Erreur PasserTour côté MJ :", err);
    alert("Impossible de passer le tour.");
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
    const time = new Date(entry.timestamp).toLocaleTimeString("fr-FR", {
      hour: "2-digit", minute: "2-digit"
    });

    let texte = "";
    let classe = "";

    if (entry.type === "soin") {
      texte = `🩹 [${time}] ${entry.auteur} soigne ${entry.cible} de ${entry.valeur} PV`;
      if (entry.overheal && entry.overheal > 0) {
        texte += ` dont ${entry.overheal} en trop`;
      }
      classe = "log-soin";
    } else if (entry.type === "attaque") {
      texte = `⚔️ [${time}] ${entry.auteur} attaque ${entry.cible} pour ${entry.degats} dégâts`;
      classe = "log-attaque";
    } else if (entry.type === "mort") {
      texte = `☠️ [${time}] ${entry.cible} est mort (par ${entry.auteur})`;
      classe = "log-mort";
    } else if (entry.type === "sortie_combat") {
      texte = `🚪 [${time}] ${entry.cible} quitte le combat (PV à 0)`;
      classe = "log-sortie";
    } else if (entry.type === "fin_combat") {
      texte = `🏁 [${time}] Fin du combat – ${entry.resultat === "victoire" ? "Victoire !" : "Défaite..."}`;
      classe = "log-victoire";
    } else {
      texte = `📌 [${time}] ${entry.auteur || "?"} fait une action inconnue.`;
      classe = "log-inconnu";
    }

    li.textContent = texte;
    li.classList.add(classe);
    ul.appendChild(li);
  });
}

boutonSoigner.addEventListener("click", async () => {
  masquerFormulairesMJ(); // ✅ cache l'autre formulaire
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

  const soignant = ordreCombat[currentTurnIndex]?.pseudo || ordreCombat[currentTurnIndex]?.nom || "inconnu";

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/SoinJoueur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, auteur: soignant, cible, soin: valeur })
    });

    if (!response.ok) {
      const erreurTexte = await response.text();
      console.error("🛑 Erreur API :", erreurTexte);
      throw new Error("Erreur API");
    }

    await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const feedback = document.getElementById("feedback-message");
    if (feedback) {
      feedback.textContent = `✅ ${soignant} a soigné ${cible} de ${valeur} PV.`;
      clearTimeout(feedback._timeout);
      feedback._timeout = setTimeout(() => (feedback.textContent = ""), 4000);
    }

    document.getElementById("formulaire-soin").classList.add("hidden");
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("tour-actuel").style.display = "block";
    document.getElementById("valeur-soin").value = "";

    await refreshCombat();
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


// 🎯 Gestion ATTAQUE MJ

boutonAttaquer.addEventListener("click", async () => {
  masquerFormulairesMJ(); // ✅ on cache d'abord tout
    document.getElementById("ordre-combat").style.display = "none";
    document.getElementById("tour-actuel").style.display = "none";
    document.getElementById("formulaire-attaque").classList.remove("hidden");
  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (!response.ok) return;
    const data = await response.json();

    const joueurs = data.joueurs || [];
    const monstres = data.monstres || [];
    const select = document.getElementById("cible-attaque");
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
  } catch (err) {
    console.error("❌ Erreur chargement cibles attaque :", err);
  }
});

document.getElementById("valider-attaque").addEventListener("click", async () => {
  const cible = document.getElementById("cible-attaque").value;
  const valeur = parseInt(document.getElementById("valeur-attaque").value);
  if (!cible || isNaN(valeur) || valeur <= 0) {
    alert("Veuillez sélectionner une cible et entrer une valeur de dégâts valide.");
    return;
  }

  const attaquant = ordreCombat[currentTurnIndex]?.pseudo || ordreCombat[currentTurnIndex]?.nom || "inconnu";

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/AttaqueJoueur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId, auteur: attaquant, cible, degats: valeur })
    });

    if (!response.ok) {
      const texte = await response.text();
      console.error("🛑 Erreur API Attaque :", texte);
      throw new Error("Erreur API Attaque");
    }

    await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const feedback = document.getElementById("feedback-message");
    if (feedback) {
      feedback.textContent = `⚔️ ${attaquant} a infligé ${valeur} dégâts à ${cible}`;
      clearTimeout(feedback._timeout);
      feedback._timeout = setTimeout(() => (feedback.textContent = ""), 4000);
    }

    document.getElementById("formulaire-attaque").classList.add("hidden");
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("tour-actuel").style.display = "block";
    document.getElementById("valeur-attaque").value = "";

    await refreshCombat();
    await afficherJournalCombat();

  } catch (err) {
    console.error("❌ Erreur lors de l'attaque :", err);
    alert("Erreur lors de l’envoi de l’attaque. Veuillez réessayer.");
  }
});

document.getElementById("annuler-attaque").addEventListener("click", () => {
  document.getElementById("formulaire-attaque").classList.add("hidden");
  document.getElementById("ordre-combat").style.display = "block";
  document.getElementById("tour-actuel").style.display = "block";
  document.getElementById("valeur-attaque").value = "";
});

function verifierFinCombat(data) {
  const joueurs = data.joueurs || [];
  const monstres = data.monstres || [];

  // Message quand un joueur tombe à 0 PV
  joueurs.forEach(j => {
    if (j.pv === 0 && !joueursAnnoncesKO.includes(j.pseudo)) {
      const ul = document.getElementById("log-combat");
      const li = document.createElement("li");
      li.textContent = `☠️ ${j.pseudo} est à terre !`;
      ul.appendChild(li);
      joueursAnnoncesKO.push(j.pseudo);
    }
  });

  const tousJoueursMorts = joueurs.length > 0 && joueurs.every(j => j.pv === 0);
  const tousMonstresMorts = monstres.length === 0;

  if (tousJoueursMorts) {
    messageFinCombat.textContent = "☠️ Défaite... Tous les joueurs sont à terre.";
    sectionFinCombat.classList.remove("hidden");
    zoneActions.style.display = "none";
      } else if (tousMonstresMorts) {
    messageFinCombat.textContent = "🎉 Victoire ! Tous les monstres ont été vaincus.";
    sectionFinCombat.classList.remove("hidden");
    zoneActions.style.display = "none";
      }
}

boutonFinManuelle?.addEventListener("click", async () => {
  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/FinCombat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });
    const result = await response.text();
    console.log("🔚 Fin de combat déclenchée manuellement:", result);

    // Redirection avec sessionId
    window.location.href = `mj-combat.html?sessionId=${sessionId}`;
  } catch (err) {
    console.error("❌ Erreur FinCombat:", err);
  }
});


async function refreshCombat() {
  try {
    console.log("🔁 MJ - refreshCombat appelé");

    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    console.log("📡 MJ - fetch exécuté");

    if (!response.ok) throw new Error("Erreur réseau");

    const data = await response.json();

    if (!data.combatEnCours) {
      clearInterval(intervalRefresh);
      window.location.href = `mj-combat.html?sessionId=${sessionId}`;
      return;
    }

    const ordre = data?.ordreTour || [];
    const indexTour = data?.indexTour ?? 0;

    ordreCombat = ordre;
    currentTurnIndex = indexTour;

    afficherOrdreCombat(data, ordre, indexTour);
    afficherTourActuel(data.ordreTour, data.indexTour);
    verifierFinCombat(data);
    afficherJournalCombat(data.logCombat || []);
  } catch (error) {
    console.error("❌ MJ - Erreur dans refreshCombat:", error);
  }
  }

  function masquerFormulairesMJ() {
    const formSoin = document.getElementById("formulaire-soin");
    const formAttaque = document.getElementById("formulaire-attaque");
  
    if (formSoin) formSoin.classList.add("hidden");
    if (formAttaque) formAttaque.classList.add("hidden");
  }
  
  document.getElementById("btn-attaquer").addEventListener("click", () => {
    masquerFormulairesMJ();
    const formulaire = document.getElementById("formulaire-attaque");
    if (formulaire) formulaire.classList.remove("hidden");
  });
  
  document.getElementById("btn-soigner").addEventListener("click", () => {
    masquerFormulairesMJ();
    const formulaire = document.getElementById("formulaire-soin");
    if (formulaire) formulaire.classList.remove("hidden");
  });
  document.getElementById("ordre-combat").style.display = "block";
  document.getElementById("tour-actuel").style.display = "block";
  document.getElementById("annuler-attaque").addEventListener("click", masquerFormulairesMJ);
  document.getElementById("annuler-soin").addEventListener("click", masquerFormulairesMJ);

  const intervalRefresh = setInterval(refreshCombat, 3000);
refreshCombat();
