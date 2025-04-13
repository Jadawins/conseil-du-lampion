// ✅ joueur.js – gestion de l'entrée joueur

// Récupération des éléments du DOM
const form = document.getElementById("join-form");
const messageAccueil = document.getElementById("message-accueil");
const instruction = document.querySelector(".instruction");
const titre = document.getElementById("titre-principal");

// Lors de la soumission du formulaire
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const pseudo = document.getElementById("pseudo").value.trim();
  const sessionId = document.getElementById("sessionId").value.trim();

  if (!pseudo || !sessionId) return;

  try {
    // Tentative avec une majuscule dans l'URL pour correspondre à la fonction Azure
    const url = `https://lampion-api.azurewebsites.net/api/JoinSession/${sessionId}?pseudo=${encodeURIComponent(pseudo)}`;
    const response = await fetch(url, { method: "POST" });

    if (response.ok) {
      // Récupérer les infos de la session pour afficher le nom de l'aventure
      const sessionUrl = `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`;
      const sessionRes = await fetch(sessionUrl);
      const sessionData = await sessionRes.json();
      const nomAventure = sessionData?.nomAventure || "(Nom inconnu)";

      // Affichage du message de bienvenue et masquage du formulaire
      form.style.display = "none";
      instruction.style.display = "none";
      titre.innerHTML = `<img src=\"assets/img/d20.png\" class=\"title-icon\" alt=\"d20\"> Bienvenue ${pseudo} <img src=\"assets/img/d20.png\" class=\"title-icon\" alt=\"d20\">`;

      messageAccueil.innerHTML = `⏳ Merci d'avoir rejoint l'aventure "${nomAventure}". Veuillez patienter jusqu'à ce que le MJ démarre la session...`;
      messageAccueil.style.display = "block";

      // Stockage en local pour la suite
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("sessionId", sessionId);
    } else {
      alert("Erreur lors de l'inscription à la session. Veuillez vérifier l'ID.");
    }
  } catch (err) {
    console.error("Erreur réseau :", err);
    alert("Impossible de rejoindre la session. Problème de connexion.");
  }
});
