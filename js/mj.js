// Sélectionne le bouton "Créer une session" et l'élément pour afficher l'ID de session
const btnCreerSession = document.getElementById("btn-creer-session");
const sessionIdParagraph = document.getElementById("session-id");
const ordreUl = document.getElementById("ordre");  // Sélectionner l'élément <ul> pour afficher l'ordre
const form = document.getElementById("form-combat");  // Assure-toi que le formulaire est sélectionné
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

if (btnCreerSession) {
    console.log("Bouton 'Créer une session' trouvé"); // Message de débogage
    btnCreerSession.addEventListener("click", creerSession);
} else {
    console.log("Bouton 'Créer une session' introuvable"); // Message de débogage
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

// Fonction pour créer une session et afficher l'ID
async function creerSession() {
  console.log("Demande d'une session en cours..."); // Message pour vérifier que la fonction est bien appelée

  try {
      const response = await fetch("http://localhost:7071/api/CreateSession", {
          method: "POST"
      });

      if (response.ok) {
          const data = await response.json();
          console.log("Réponse de CreateSession : ", data); // Afficher la réponse complète
          sessionIdParagraph.textContent = `🆔 Code à partager : ${data.sessionId}`;
      } else {
          console.log("Erreur API : ", response.status); // Afficher une erreur si la réponse est différente de 200
          sessionIdParagraph.textContent = "❌ Erreur lors de la création de la session.";
      }
  } catch (error) {
      console.log("Erreur lors de l'appel de fetch : ", error); // Afficher une erreur si fetch échoue
      sessionIdParagraph.textContent = "❌ Impossible de communiquer avec l'API.";
  }
}
