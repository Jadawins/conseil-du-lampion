// ✅ joueur-bagarre.js – gestion du tour du joueur avec confirmation de soin

window.addEventListener("DOMContentLoaded", () => {
  const sessionId = localStorage.getItem("sessionId");
  const pseudo = localStorage.getItem("pseudo");

  const messageTour = document.getElementById("message-tour");
  const actionSection = document.getElementById("actions-joueur");
  const attenteSection = document.getElementById("attente-section");
  const pvAffichage = document.getElementById("pv-affichage");
  const feedback = document.getElementById("feedback-message");

  let soinEnCours = null;
  let joueursAnnoncesKO = [];

  function formatPV(joueur) {
    const pv = joueur?.pv ?? "?";
    const pvMax = joueur?.pvMax ?? "?";
    return `${pv} / ${pvMax}`;
  }

  async function recupererSession() {
    try {
      const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
      if (response.ok) return await response.json();
    } catch (err) {
      console.error("Erreur GetSession:", err);
    }
    return null;
  }

  function afficherEtat(pv, pvMax, joueurActif) {
    pvAffichage.textContent = `❤️ ${formatPV({ pv, pvMax })} PV`;
    const estMonTour = joueurActif?.pseudo === pseudo;
    const estKO = pv === 0;
  
    if (estKO) {
      messageTour.textContent = "☠️ Vous êtes à terre...";
      actionSection.style.display = "none";
      attenteSection.style.display = "none";
    } else {
      if (estMonTour) {
        messageTour.textContent = "🗡️ C’est votre tour !";
        actionSection.style.display = "block";
        attenteSection.style.display = "none";
      } else {
        messageTour.textContent = `🌟 C'est au tour de ${joueurActif?.pseudo || joueurActif?.nom || "..."} de jouer.`;
        actionSection.style.display = "none";
        attenteSection.style.display = "block";
      }
    }
  }
  

  function verifierFinCombat(data) {
    const joueurs = data.joueurs || [];
    const monstres = data.monstres || [];
  
    const moi = joueurs.find(j => j.pseudo === pseudo);
    if (!moi) return;
  
    const sectionFin = document.getElementById("fin-combat-joueur");
    const messageFin = document.getElementById("message-fin-combat-joueur");
  
    const tousJoueursMorts = joueurs.every(j => j.pv === 0);
    const tousMonstresMorts = monstres.length === 0;
  
    if (tousJoueursMorts) {
      messageFin.textContent = "☠️ Défaite... Tous les joueurs sont à terre.";
      sectionFin.classList.remove("hidden");
    } else if (tousMonstresMorts && moi.pv > 0) {
      messageFin.textContent = "🎉 Victoire ! Tous les monstres ont été vaincus.";
      sectionFin.classList.remove("hidden");
    }
  }

  function afficherOrdreCombat(data, ordre, indexTour) {
    const tbody = document.getElementById("liste-initiative");
    if (!tbody) return;
    tbody.innerHTML = "";
  
    ordre.forEach((entite, index) => {
      const nom = entite.pseudo || entite.nom;
      const estJoueur = !!entite.pseudo;
      const joueurData = data.joueurs?.find(j => j.pseudo === entite.pseudo);
  
      const tr = document.createElement("tr");
  
      const pvText = estJoueur && joueurData ? formatPV(joueurData) : "-";
      const pv = joueurData?.pv;
      const pvMax = joueurData?.pvMax;
  
      tr.innerHTML = `
        <td>${index === indexTour ? "🌟 " : ""}${nom}</td>
        <td>${entite.initiative ?? "-"}</td>
        <td>${pvText}</td>
      `;
  
      if (estJoueur && pv !== undefined && pvMax !== undefined && pv / pvMax < 0.3) {
        tr.classList.add("low-hp");
      }
  
      if (index === indexTour) {
        tr.classList.add("highlight-row");
      }
  
      tbody.appendChild(tr);
    });
  }

  async function refreshCombat() {
    const data = await recupererSession();
    if (!data) return;

    const joueur = data.joueurs?.find(j => j.pseudo === pseudo);

    if (!data.combatEnCours && joueur && typeof joueur.pv === "number" && typeof joueur.pvMax === "number") {
      localStorage.setItem("dernierPV", joueur.pv);
      localStorage.setItem("pvMax", joueur.pvMax);
      console.log(`💾 Stockage PV avant redirection : ${joueur.pv} / ${joueur.pvMax}`);
      // ⏳ Laisse 50ms avant redirection
      setTimeout(() => {
      window.location.href = `joueur-initiative.html?sessionId=${sessionId}`;
      }, 50);
      return;
    }

      

    const ordre = data.ordreTour || [];
    const indexTour = data.indexTour ?? 0;
    const joueurActif = ordre[indexTour];

    // 🔁 Si c’est le tour du joueur ET qu’il est à terre, passer automatiquement
if (joueurActif?.pseudo === pseudo && joueur?.pv === 0) {
  console.log(`⏭️ ${pseudo} est à terre. Passage automatique du tour.`);
  await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId })
  });
  return;
}

    if (joueur) afficherEtat(joueur.pv, joueur.pvMax || joueur.pv, joueurActif);

// ✅ Ces deux lignes doivent être ici AVANT le return
verifierFinCombat(data);

afficherOrdreCombat(data, ordre, indexTour);

if (joueur.pv === 0) return;

    // ✅ Affiche "☠️ Gandalf est à terre !" une seule fois
const log = document.getElementById("log-combat");
if (!log) return;
(data.joueurs || []).forEach(joueur => {
  if (joueur.pv === 0 && !joueursAnnoncesKO.includes(joueur.pseudo)) {
    const li = document.createElement("li");
    li.textContent = `☠️ ${joueur.pseudo} est à terre !`;
    log.appendChild(li);
    joueursAnnoncesKO.push(joueur.pseudo);
  }
});

const tbody = document.getElementById("liste-initiative");
tbody.innerHTML = "";

ordre.forEach((entite, index) => {
  const nom = entite.pseudo || entite.nom;
  const estJoueur = !!entite.pseudo;
  const joueurData = data.joueurs?.find(j => j.pseudo === entite.pseudo);

  const tr = document.createElement("tr");

  const pvText = estJoueur && joueurData ? formatPV(joueurData) : "-";
  const pv = joueurData?.pv;
  const pvMax = joueurData?.pvMax;

  tr.innerHTML = `
  <td>${index === indexTour ? "🌟 " : ""}${nom}</td>
  <td>${entite.initiative ?? "-"}</td>
  <td>${pvText}</td>
`;

  if (estJoueur && pv !== undefined && pvMax !== undefined && pv / pvMax < 0.3) {
    tr.classList.add("low-hp");
  }

  if (index === indexTour) {
    tr.classList.add("highlight-row");
  }

  tbody.appendChild(tr);
});
  }

  refreshCombat();
  setInterval(refreshCombat, 3000);

  document.getElementById("btn-soigner").addEventListener("click", async () => {
    document.getElementById("formulaire-soin").classList.remove("hidden");
    document.getElementById("message-tour").style.display = "none";
    document.getElementById("ordre-combat").style.display = "none";

    const data = await recupererSession();
    if (!data) return;

    const select = document.getElementById("cible-soin");
    select.innerHTML = "";

    [...data.joueurs, ...data.monstres].forEach(entite => {
      const option = document.createElement("option");
      option.value = entite.pseudo || entite.nom;
      option.textContent = `${entite.pseudo ? "🧝" : "👹"} ${entite.pseudo || entite.nom}`;
      select.appendChild(option);
    });
  });

  document.getElementById("valider-soin").addEventListener("click", async () => {
    const cible = document.getElementById("cible-soin").value;
    const valeur = parseInt(document.getElementById("valeur-soin").value);

    if (!cible || isNaN(valeur) || valeur <= 0) {
      alert("Veuillez entrer une valeur de soin valide.");
      return;
    }

    const data = await recupererSession();
    if (!data) return;

    const cibleData = [...data.joueurs, ...data.monstres].find(e => (e.pseudo || e.nom) === cible);
    const pvActuels = cibleData?.pv ?? 0;
    const pvMax = cibleData?.pvMax ?? pvActuels;

    const soinEffectif = Math.min(pvMax - pvActuels, valeur);
    const estOverheal = valeur > soinEffectif;

    const recap = document.getElementById("confirmation-soin");
    recap.classList.remove("hidden");
    recap.innerHTML = `
      <p>Soigner <strong>${cible}</strong> de <strong>${valeur} PV</strong> ?</p>
      ${estOverheal ? `<p style="color: #ffcc00;">⚠️ Overheal détecté : ${valeur - soinEffectif} PV perdus</p>` : ""}
      <div class="modal-buttons">
        <button id="confirmer-soin" class="btn-style">✅ Valider</button>
        <button id="annuler-confirmation" class="btn-style btn-rouge">❌ Annuler</button>
      </div>
    `;

    document.getElementById("confirmer-soin").addEventListener("click", () => envoyerSoin(cible, valeur));
    document.getElementById("annuler-confirmation").addEventListener("click", () => {
      recap.classList.add("hidden");
    });
  });

  async function envoyerSoin(cible, valeur) {
    try {
      const res = await fetch("https://lampion-api.azurewebsites.net/api/SoinJoueur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, auteur: pseudo, cible, soin: valeur })
      });

      if (!res.ok) throw new Error("Erreur API soin");

      await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });

      document.getElementById("formulaire-soin").classList.add("hidden");
      document.getElementById("confirmation-soin").classList.add("hidden");
      document.getElementById("valeur-soin").value = "";
      document.getElementById("message-tour").style.display = "block";
      document.getElementById("ordre-combat").style.display = "block";

      if (feedback) {
        feedback.textContent = `✅ ${pseudo} a soigné ${cible} de ${valeur} PV.`;
        clearTimeout(feedback._timeout);
        feedback._timeout = setTimeout(() => (feedback.textContent = ""), 4000);
      }

      await refreshCombat();

    } catch (err) {
      console.error("❌ Erreur lors de l'envoi du soin :", err);
    }
  }

  document.getElementById("annuler-soin").addEventListener("click", () => {
    document.getElementById("formulaire-soin").classList.add("hidden");
    document.getElementById("confirmation-soin").classList.add("hidden");
    document.getElementById("message-tour").style.display = "block";
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("valeur-soin").value = "";
  });

  document.getElementById("btn-attaquer").addEventListener("click", async () => {
    document.getElementById("formulaire-attaque").classList.remove("hidden");
    document.getElementById("message-tour").style.display = "none";
    document.getElementById("ordre-combat").style.display = "none";
  
    const data = await recupererSession();
    if (!data) return;
  
    const select = document.getElementById("cible-attaque");
    select.innerHTML = "";
  
    [...data.joueurs, ...data.monstres].forEach(entite => {
      const nom = entite.pseudo || entite.nom;
      if (nom === pseudo) return; // le joueur ne peut pas se cibler lui-même
      const option = document.createElement("option");
      option.value = nom;
      option.textContent = `${entite.pseudo ? "🧝" : "👹"} ${nom}`;
      select.appendChild(option);
    });
  });
  
  document.getElementById("valider-attaque").addEventListener("click", async () => {
    const cible = document.getElementById("cible-attaque").value;
    const valeur = parseInt(document.getElementById("valeur-attaque").value);
  
    if (!cible || isNaN(valeur) || valeur <= 0) {
      alert("Veuillez entrer une valeur de dégâts valide.");
      return;
    }
  
    try {
      const res = await fetch("https://lampion-api.azurewebsites.net/api/AttaqueJoueur", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, auteur: pseudo, cible, degats: valeur })
      });
  
      if (!res.ok) throw new Error("Erreur API attaque");
  
      await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId })
      });
  
      document.getElementById("formulaire-attaque").classList.add("hidden");
      document.getElementById("valeur-attaque").value = "";
      document.getElementById("message-tour").style.display = "block";
      document.getElementById("ordre-combat").style.display = "block";
  
      if (feedback) {
        feedback.textContent = `⚔️ ${pseudo} a attaqué ${cible} pour ${valeur} PV.`;
        clearTimeout(feedback._timeout);
        feedback._timeout = setTimeout(() => (feedback.textContent = ""), 4000);
      }
  
      await refreshCombat();
  
    } catch (err) {
      console.error("❌ Erreur lors de l'attaque :", err);
      alert("Erreur lors de l’envoi de l’attaque. Veuillez réessayer.");
    }
  });
  
  document.getElementById("annuler-attaque").addEventListener("click", () => {
    document.getElementById("formulaire-attaque").classList.add("hidden");
    document.getElementById("message-tour").style.display = "block";
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("valeur-attaque").value = "";
  });  
});
