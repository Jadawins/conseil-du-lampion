const formJoueur = document.getElementById("form-joueur");
const ordreJoueurUl = document.getElementById("ordre-joueur");

// ➕ Envoyer son initiative
formJoueur.addEventListener("submit", (e) => {
  e.preventDefault();
  const initiative = parseInt(document.getElementById("init-joueur").value);

  const joueur = {
    nom: "Joueur inconnu", // Nom temporaire (sera remplacé plus tard)
    initiative: initiative
  };

  const joueursActuels = JSON.parse(localStorage.getItem("joueursLampion")) || [];
  joueursActuels.push(joueur);
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
