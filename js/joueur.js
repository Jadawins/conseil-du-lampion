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
    // Envoi de la demande d'inscription à la session (POST)
    const url = `https://lampion-api.azurewebsites.net/api/JoinSession/${sessionId}?pseudo=${encodeURIComponent(pseudo)}`;
    const response = await fetch(url, { method: "POST" });

    if (response.ok) {
      // Stockage en local pour la suite
      localStorage.setItem("pseudo", pseudo);
      localStorage.setItem("sessionId", sessionId);

      // Attendre un court délai pour s'assurer que le fichier est bien dispo
      await new Promise(resolve => setTimeout(resolve, 800)); // 800ms

      // Requête GET pour récupérer le nom de l’aventure
      const sessionUrl = `https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`;
      const sessionRes = await fetch(sessionUrl);
      let nomAventure = "(Nom inconnu)";
      if (sessionRes.ok) {
        const sessionData = await sessionRes.json();
        nomAventure = sessionData?.nomAventure || nomAventure;
      }

      // Affichage du message et mise à jour UI
      form.style.display = "none";
      instruction.style.display = "none";
      titre.innerHTML = `<img src="assets/img/d20.png" class="title-icon" alt="d20"> Bienvenue ${pseudo} <img src="assets/img/d20.png" class="title-icon" alt="d20">`;

      messageAccueil.innerHTML = `⏳ Merci d'avoir rejoint l'aventure "<strong>${nomAventure}</strong>". Veuillez patienter jusqu'à ce que le MJ démarre la session...`;
      messageAccueil.style.display = "block";
    } else {
      alert("Erreur lors de l'inscription à la session. Veuillez vérifier l'ID.");
    }
  } catch (err) {
    console.error("Erreur réseau :", err);
    alert("Impossible de rejoindre la session. Problème de connexion.");
  }
});
