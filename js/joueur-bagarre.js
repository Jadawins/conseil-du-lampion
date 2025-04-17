// ✅ joueur-bagarre.js – gestion du tour du joueur

const sessionId = localStorage.getItem("sessionId");
const pseudo = localStorage.getItem("pseudo");

const messageTour = document.getElementById("message-tour");
const actionSection = document.getElementById("actions-joueur");
const attenteSection = document.getElementById("attente-section");
const pvAffichage = document.getElementById("pv-affichage");

function formatPV(joueur) {
  const pv = joueur?.pv ?? "?";
  const pvMax = joueur?.pvMax ?? "?";
  return `${pv} / ${pvMax}`;
}

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
  pvAffichage.textContent = `❤️ ${formatPV({ pv, pvMax })} PV`;
  
    const estMonTour = joueurActif?.pseudo === pseudo;
  
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

    // 👇 Déclaration ici pour qu'elle soit visible dans le scope
    let pvText = "-";

    if (estJoueur) {
      const joueur = tousLesJoueurs.find(j => j.pseudo === entite.pseudo);
      pvText = joueur ? formatPV(joueur) : "-";
    }

    tr.innerHTML = `
      <td>${index === currentTurnIndex ? "🎯 " : ""}${entite.pseudo || entite.nom}</td>
      <td>${pvText}</td>
    `;

    if (typeof entite.pv === "number" && typeof entite.pvMax === "number" && entite.pvMax > 0 && entite.pv / entite.pvMax < 0.3) {
      tr.classList.add("low-hp");
    }

    if (index === currentTurnIndex) tr.classList.add("highlight-row");
    tbody.appendChild(tr);
  });
}


// 🔁 Rafraîchissement toutes les 3 sec
setInterval(verifierTour, 3000);
setInterval(afficherOrdreDuTour, 3000);
window.addEventListener("DOMContentLoaded", afficherOrdreDuTour);
document.getElementById("btn-passer").addEventListener("click", async () => {
  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/PasserTour", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId })
    });

    const data = await response.json();
    console.log("✔️ Tour passé :", data);

    // ✅ Affichage du feedback uniquement après clic
    const feedback = document.getElementById("feedback-message");
    if (feedback) {
      feedback.textContent = "⏭️ Tour passé !";
      clearTimeout(feedback._timeout);
      feedback._timeout = setTimeout(() => (feedback.textContent = ""), 3000);
    }
  } catch (err) {
    console.error("❌ Erreur lors du passage du tour :", err);
  }
});

document.getElementById("btn-soigner").addEventListener("click", async () => {
  // Masquer les éléments non nécessaires pendant l'action
  document.getElementById("message-tour").style.display = "none";
  document.getElementById("ordre-combat").style.display = "none";

  // Afficher le formulaire de soin
  document.getElementById("formulaire-soin").classList.remove("hidden");

  // Récupérer les données centralisées de la session
  const data = await recupererSession();
  if (!data) return;

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
  const boutonValider = document.getElementById("valider-soin");

  if (!cible || isNaN(valeur) || valeur <= 0) {
    alert("Veuillez sélectionner une cible et entrer une valeur de soin valide.");
    return;
  }

  boutonValider.disabled = true;

  try {
    // ✅ AJOUTE ICI :
  console.log("📤 Envoi du soin :", {
    sessionId,
    auteur: pseudo,
    cible,
    soin: valeur
  });
  
    const response = await fetch("https://lampion-api.azurewebsites.net/api/SoinJoueur", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        auteur: pseudo,
        cible,
        soin: valeur
      })
    });

    if (!response.ok) throw new Error("Erreur API");

    // Réinitialiser l'UI
    document.getElementById("formulaire-soin").classList.add("hidden");
    document.getElementById("message-tour").style.display = "block";
    document.getElementById("ordre-combat").style.display = "block";
    document.getElementById("valeur-soin").value = "";

    // Feedback utilisateur
    const feedback = document.getElementById("feedback-message");
    if (feedback) {
      feedback.textContent = `🩹 Soin de ${valeur} PV appliqué à ${cible}`;
      clearTimeout(feedback._timeout);
      feedback._timeout = setTimeout(() => (feedback.textContent = ""), 4000);
    }

  } catch (err) {
    console.error("❌ Erreur lors de l'envoi du soin :", err);
    alert("Erreur lors de l’envoi du soin. Veuillez réessayer.");
  } finally {
    boutonValider.disabled = false;
  }
});


document.getElementById("annuler-soin").addEventListener("click", () => {
document.getElementById("formulaire-soin").classList.add("hidden");
document.getElementById("message-tour").style.display = "block";
document.getElementById("ordre-combat").style.display = "block";
document.getElementById("valeur-soin").value = "";

});

