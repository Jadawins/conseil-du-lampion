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
        if (typeof joueur.initiative === "number" && joueur.initiative > 0) {
          form.style.display = "none";
          title.style.display = "none";
          confirmation.style.display = "block";
        }

        // 🎯 Afficher PV Max seulement si non défini
        if (typeof joueur.pvMax === "number") {
          pvMaxGroup.style.display = "none"; // Cacher champ PV Max
        } else {
          pvMaxGroup.style.display = "block";
        }

        // Pré-remplir champ PV si déjà existant
        if (typeof joueur.pv === "number") {
          document.getElementById("pv-input").value = joueur.pv;
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

  if (isNaN(initiative) || isNaN(pv)) return;

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
