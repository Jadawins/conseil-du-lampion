// Sélectionne les éléments de l'interface
const btnCreerSession = document.getElementById("btn-creer-session");
const sessionIdParagraph = document.getElementById("session-id");
const ordreUl = document.getElementById("ordre");
const form = document.getElementById("form-combat");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

if (btnCreerSession) {
    console.log("Bouton 'Créer une session' trouvé");
    btnCreerSession.addEventListener("click", creerSession);
} else {
    console.log("Bouton 'Créer une session' introuvable");
}

let monstres = [];

// 📥 Charger les monstres enregistrés au démarrage
const monstresSauvegardes = localStorage.getItem("monstresLampion");
if (monstresSauvegardes) {
  monstres = JSON.parse(monstresSauvegardes);
}
afficherOrdre();

// 🔁 Affiche la liste complète triée (monstres + joueurs)
function afficherOrdre() {
  ordreUl.innerHTML = "";

  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs];
  total.sort((a, b) => b.initiative - a.initiative);

  total.forEach((p) => {
    const li = document.createElement("li");
    li.textContent = `${p.nom} - Initiative : ${p.initiative}`;
    ordreUl.appendChild(li);
  });
}

// ➕ Ajouter un monstre
form.addEventListener("submit", (e) => {
  e.preventDefault();
  const nom = document.getElementById("nom").value;
  const initiative = parseInt(document.getElementById("initiative").value);

  monstres.push({ nom, initiative });
  localStorage.setItem("monstresLampion", JSON.stringify(monstres));
  afficherOrdre();
  form.reset();
});

// 🔄 Réinitialiser la session
resetBtn.addEventListener("click", () => {
  if (confirm("Es-tu sûr de vouloir tout effacer ?")) {
    monstres = [];
    localStorage.removeItem("monstresLampion");
    localStorage.removeItem("joueursLampion");
    localStorage.removeItem("ordreFinal");
    afficherOrdre();
  }
});

// 🔥 Lancer le combat → publier l'ordre final
lancerBtn.addEventListener("click", () => {
  const joueurs = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  const total = [...monstres, ...joueurs];
  total.sort((a, b) => b.initiative - a.initiative);

  localStorage.setItem("ordreFinal", JSON.stringify(total));
  alert("🔥 L'ordre de tour a été validé et envoyé aux joueurs !");
});

// 🌐 Fonction pour créer une session (via API Azure)
async function creerSession() {
  console.log("Demande d'une session en cours...");

  try {
      const response = await fetch("https://lampion-api.azurewebsites.net/api/CreateSession", {
          method: "POST"
      });

      if (response.ok) {
          const data = await response.json();
          console.log("Réponse de CreateSession : ", data);
          sessionIdParagraph.textContent = `🆔 Code à partager : ${data.sessionId}`;
      } else {
          console.log("Erreur API : ", response.status);
          sessionIdParagraph.textContent = "❌ Erreur lors de la création de la session.";
      }
  } catch (error) {
      console.log("Erreur lors de l'appel de fetch : ", error);
      sessionIdParagraph.textContent = "❌ Impossible de communiquer avec l'API.";
  }
}
