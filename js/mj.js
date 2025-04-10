const form = document.getElementById("form-combat");
const ordreUl = document.getElementById("ordre");
const resetBtn = document.getElementById("reset");
const lancerBtn = document.getElementById("lancer");

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
