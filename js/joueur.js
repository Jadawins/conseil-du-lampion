// 🌙 Gestion du thème clair/sombre
if (localStorage.getItem("theme") === "light") {
  document.body.setAttribute("data-theme", "light");
} else {
  document.body.setAttribute("data-theme", "dark");
}

const formJoueur = document.getElementById("form-joueur");
const ordreJoueurUl = document.getElementById("ordre-joueur");

// ➕ Rejoindre une session via API
async function rejoindreSession() {
  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionId = document.getElementById("sessionName").value.trim(); // en réalité c'est bien l'ID

  if (!pseudo || !sessionId) {
    document.getElementById("confirmation").textContent = "❌ Pseudo et ID de session requis.";
    return;
  }

  try {
    const body = {
      sessionId,
      joueur: {
        pseudo,
        initiative: 0
      }
    };

    const response = await fetch("https://lampion-api.azurewebsites.net/api/JoinSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await response.json();

    if (response.ok) {
      // ✅ Stockage local pour utilisation ultérieure
      localStorage.setItem("pseudoLampion", pseudo);
      localStorage.setItem("sessionLampion", sessionId);

      // 🎉 Confirmation & passage à l'étape suivante
      document.getElementById("confirmation").textContent = `Bienvenue ${pseudo} !`;
      document.getElementById("rejoindre-session").style.display = "none";
      document.getElementById("initiative-section").style.display = "block";
    } else {
      document.getElementById("confirmation").textContent = data.message || "❌ Erreur lors de l'inscription.";
    }

  } catch (error) {
    console.error("Erreur d’envoi :", error);
    document.getElementById("confirmation").textContent = "❌ Impossible de contacter l’API.";
  }
}

// ➕ Envoyer son initiative
formJoueur.addEventListener("submit", async (e) => {
  e.preventDefault();

  const initiative = parseInt(document.getElementById("init-joueur").value);
  const pseudo = localStorage.getItem("pseudoLampion");
  const sessionId = localStorage.getItem("sessionLampion");

  if (!pseudo || !sessionId || isNaN(initiative)) {
    ordreJoueurUl.innerHTML = "<li>❌ Informations manquantes.</li>";
    return;
  }

  const body = {
    sessionId,
    joueur: {
      pseudo,
      initiative
    }
  };

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/JoinSession", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    if (response.ok) {
      ordreJoueurUl.innerHTML = `<li>🎲 Initiative enregistrée ! En attente du MJ...</li>`;
      formJoueur.reset();
    } else {
      ordreJoueurUl.innerHTML = "<li>❌ Erreur lors de l’envoi de l’initiative.</li>";
    }
  } catch (err) {
    console.error("Erreur lors de l’envoi :", err);
    ordreJoueurUl.innerHTML = "<li>❌ Erreur réseau.</li>";
  }
});

// 📜 Affichage régulier de l’ordre (quand disponible)
function afficherOrdre() {
  const ordre = JSON.parse(localStorage.getItem("ordreFinal"));
  ordreJoueurUl.innerHTML = "";

  if (!ordre) {
    ordreJoueurUl.innerHTML = "<li>⏳ En attente du MJ...</li>";
    return;
  }

  ordre.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} – Initiative : ${p.initiative}`;
    ordreJoueurUl.appendChild(li);
  });
}

// 🔁 Rafraîchissement toutes les 2 secondes
setInterval(afficherOrdre, 2000);
