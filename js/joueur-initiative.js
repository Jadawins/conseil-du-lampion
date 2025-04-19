const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get("sessionId");
const pseudo = localStorage.getItem("pseudo");

const form = document.getElementById("initiative-form");
const title = document.getElementById("initiative-title");
const confirmation = document.getElementById("confirmation-message");
const pvMaxGroup = document.getElementById("pv-max-group"); // le conteneur du champ PV Max

window.addEventListener("DOMContentLoaded", async () => {
  if (!sessionId || !pseudo) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (response.ok) {
      const data = await response.json();
      const joueur = data?.joueurs?.find(j => j.pseudo === pseudo);

      if (joueur) {
        // 🧠 Ajouter un message si ce n'est pas le premier combat
        if ((data.combats?.length || 0) > 0 && typeof joueur.pv === "number") {
          const message = document.createElement("p");
          message.textContent = `💬 Il vous reste ${joueur.pv} PV après le dernier combat.`;
          message.style.marginTop = "1rem";
          message.style.fontStyle = "italic";
          message.style.color = "var(--text-faded)";
          form.prepend(message);
        }

        // 💬 Afficher le message \"il vous restait X PV sur Y\"
          const dernierPV = localStorage.getItem("dernierPV");
          const pvMax = localStorage.getItem("pvMax");

          if (dernierPV && pvMax) {
        const message = document.createElement("p");
        message.textContent = `💬 À la fin du dernier combat, il vous restait ${dernierPV} PV sur ${pvMax}.`;
        message.style.marginTop = "1rem";
        message.style.fontStyle = "italic";
        message.style.color = "var(--text-faded)";
        form.prepend(message);
          }


        // ✅ Préremplir les champs s'ils existent
        if (typeof joueur.pv === "number") {
          document.getElementById("pv-input").value = joueur.pv;
        }

        const pvMaxInput = document.getElementById("pv-max-input");
        if (typeof joueur.pvMax === "number") {
          if (pvMaxInput) {
            pvMaxInput.value = joueur.pvMax;
            console.log(`🧠 PV Max prérempli : ${joueur.pvMax}`);
          }
          pvMaxGroup.style.display = "none";
        } else {
          pvMaxGroup.style.display = "block";
        }

        if (typeof joueur.initiative === "number") {
          document.getElementById("initiative-input").value = joueur.initiative;
        }

        // ✅ Ajouter bouton "Valider les infos précédentes"
        if (typeof joueur.pv === "number" && typeof joueur.initiative === "number") {
          const btnAuto = document.createElement("button");
          btnAuto.textContent = "✅ Reprendre les mêmes valeurs";
          btnAuto.type = "button";
          btnAuto.className = "btn-style";
          btnAuto.style.marginTop = "1rem";
          btnAuto.addEventListener("click", () => form.requestSubmit());
          form.appendChild(btnAuto);
        }

        // Cacher le formulaire si déjà envoyé
        if (typeof joueur.initiative === "number" && joueur.initiative > 0) {
          form.style.display = "none";
          title.style.display = "none";
          confirmation.style.display = "block";
        }
      }

    }
  } catch (err) {
    console.error("Erreur récupération initiative:", err);
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const initiative = parseInt(document.getElementById("initiative-input").value);
  const pv = parseInt(document.getElementById("pv-input").value);
  const pvMaxInput = document.getElementById("pv-max-input");
  const pvMax = pvMaxInput ? parseInt(pvMaxInput.value) : null;

  if (isNaN(initiative) || isNaN(pv)) {
    alert("Veuillez remplir correctement tous les champs obligatoires.");
    return;
  }

  if (!isNaN(pvMax) && pv > pvMax) {
    alert(`Les points de vie ne peuvent pas dépasser les PV Max (${pvMax}).`);
    return;
  }

  const payload = {
    sessionId,
    pseudo,
    initiative,
    pv
  };

  if (!isNaN(pvMax)) {
    payload.pvMax = pvMax;
  }

  try {
    await fetch(`https://lampion-api.azurewebsites.net/api/SetInitiative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    form.style.display = "none";
    title.style.display = "none";
    confirmation.style.display = "block";
  } catch (err) {
    alert("Erreur lors de l'enregistrement de l'initiative.");
  }
});

async function verifierDebutCombat() {
  const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
  if (response.ok) {
    const data = await response.json();
    if (data.combatEnCours) {
      window.location.href = `joueur-bagarre.html?sessionId=${sessionId}`;
    }
  }
}

setInterval(verifierDebutCombat, 3000);
