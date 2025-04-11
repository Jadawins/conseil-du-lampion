// 🔁 Rafraîchir l’ordre de combat toutes les 2 secondes
setInterval(afficherOrdre, 2000);

// ▶️ Fonction pour rejoindre une session
async function rejoindreSession() {
  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionName = document.getElementById("sessionName").value.trim();

  if (!pseudo || !sessionName) {
    document.getElementById("confirmation").textContent = "Merci de remplir les deux champs.";
    return;
  }

  const response = await fetch("http://localhost:7071/api/JoinSession", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ pseudo, sessionName })
  });

  const data = await response.json();

  if (response.ok) {
    // ✅ Message côté joueur
    document.getElementById("confirmation").textContent = data.message;

    // ✅ Sauvegarder le pseudo et la session localement
    localStorage.setItem("pseudoLampion", pseudo);
    localStorage.setItem("sessionLampion", sessionName);

    // ✅ Cacher le bloc de connexion et afficher la suite
    document.getElementById("rejoindre-session").style.display = "none";
    document.getElementById("initiative-section").style.display = "block";
  } else {
    document.getElementById("confirmation").textContent = data.message || "Erreur lors de l'inscription.";
  }
}

// 📤 Gestion de l’envoi d’initiative (en local pour l’instant)
const formJoueur = document.getElementById("form-joueur");
const ordreJoueurUl = document.getElementById("ordre-joueur");

formJoueur.addEventListener("submit", (e) => {
  e.preventDefault();
  const initiative = parseInt(document.getElementById("init-joueur").value);

  const pseudo = localStorage.getItem("pseudoLampion") || "Joueur inconnu";

  const joueur = {
    nom: pseudo,
    initiative: initiative
  };

  const joueursActuels = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  joueursActuels.push(joueur);
  localStorage.setItem("joueursLampion", JSON.stringify(joueursActuels));

  ordreJoueurUl.innerHTML = "<li>Initiative envoyée ! Attendez le MJ.</li>";
  formJoueur.reset();
});

// 📜 Afficher l’ordre reçu depuis le localStorage
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
