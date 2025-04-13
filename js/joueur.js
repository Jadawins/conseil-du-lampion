// 🌙 Mode sombre / clair automatique avec data-theme
if (localStorage.getItem("theme") === "light") {
  document.body.setAttribute("data-theme", "light");
} else {
  document.body.setAttribute("data-theme", "dark");
}

const formJoueur = document.getElementById("form-joueur");
const ordreJoueurUl = document.getElementById("ordre-joueur");

// ➕ Rejoindre une session
async function rejoindreSession() {
  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionName = document.getElementById("sessionName").value.trim();

  if (!pseudo || !sessionName) {
    document.getElementById("confirmation").textContent = "❌ Pseudo et nom de session requis.";
    return;
  }

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/JoinSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ pseudo, sessionName })
    });

    const data = await response.json();

    if (response.ok) {
      document.getElementById("confirmation").textContent = data.message;
      localStorage.setItem("pseudoLampion", pseudo);
      localStorage.setItem("sessionLampion", sessionName);

      document.getElementById("rejoindre-session").style.display = "none";
      document.getElementById("initiative-section").style.display = "block";
    } else {
      document.getElementById("confirmation").textContent = data.message || "Erreur lors de l'inscription.";
    }
  } catch (error) {
    console.error(error);
    document.getElementById("confirmation").textContent = "❌ Impossible de contacter l’API.";
  }
}

// ➕ Envoyer son initiative
formJoueur.addEventListener("submit", async (e) => {
  e.preventDefault();
  const initiative = parseInt(document.getElementById("init-joueur").value);
  const pseudo = localStorage.getItem("pseudoLampion");
  const sessionName = localStorage.getItem("sessionLampion");

  if (!pseudo || !sessionName || isNaN(initiative)) {
    ordreJoueurUl.innerHTML = "<li>Erreur : informations incomplètes.</li>";
    return;
  }

  // Stockage local (sera utilisé uniquement côté joueur)
  const joueur = {
    nom: pseudo,
    initiative: initiative
  };

  const joueursActuels = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const index = joueursActuels.findIndex(j => j.nom === pseudo);
  if (index >= 0) {
    joueursActuels[index] = joueur; // mise à jour
  } else {
    joueursActuels.push(joueur);
  }

  localStorage.setItem("joueursLampion", JSON.stringify(joueursActuels));
  ordreJoueurUl.innerHTML = "<li>Initiative envoyée ! Attendez le MJ.</li>";
  formJoueur.reset();
});

// 🔄 Afficher l'ordre final dès que disponible
function afficherOrdre() {
  const ordre = JSON.parse(localStorage.getItem("ordreFinal"));
  ordreJoueurUl.innerHTML = "";

  if (!ordre) {
    ordreJoueurUl.innerHTML = "<li>En attente du MJ...</li>";
    return;
  }

  ordre.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} - Initiative : ${p.initiative}`;
    ordreJoueurUl.appendChild(li);
  });
}

// 🔁 Mise à jour régulière (toutes les 2 sec)
setInterval(afficherOrdre, 2000);
