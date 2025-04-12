const btnCreerSession = document.getElementById("btn-creer-session");

btnCreerSession.addEventListener("click", async () => {
  const nomAventure = document.getElementById("nom-aventure").value.trim();

  if (!nomAventure) {
    alert("⚠️ Merci d’entrer un nom pour l’aventure.");
    return;
  }

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/CreateSession", {
      method: "POST"
    });

    if (!response.ok) throw new Error("Erreur lors de la création de la session");

    const data = await response.json();

    // Sauvegarder les infos localement
    localStorage.setItem("sessionId", data.sessionId);
    localStorage.setItem("nomAventure", nomAventure);

    // Rediriger vers la page intermédiaire mj-session.html
    window.location.href = `mj-session.html?sessionId=${data.sessionId}&nomAventure=${encodeURIComponent(nomAventure)}`;
  } catch (error) {
    console.error("❌ Erreur de communication avec l’API :", error);
    alert("❌ Impossible de créer la session. Vérifie ta connexion ou l’API.");
  }
});
