// ⚙️ mj.js – version finale corrigée avec envoi JSON garanti
const btnCreerSession = document.getElementById("btn-creer-session");

btnCreerSession.addEventListener("click", async () => {
  const nomAventure = document.getElementById("nom-aventure").value.trim();
  const messageEl = document.getElementById("message");

  if (!nomAventure) {
    messageEl.textContent = "⚠️ Merci d’entrer un nom pour l’aventure.";
    return;
  }

  try {
    const response = await fetch("https://lampion-api.azurewebsites.net/api/CreateSession", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      mode: "cors", // ✅ pour s'assurer que les headers CORS sont respectés côté navigateur
      body: JSON.stringify({ nomAventure })
    });

    const rawText = await response.text();

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      throw new Error(rawText); // si ce n'est pas du JSON, on affiche le texte brut
    }

    if (!response.ok) {
      throw new Error(data.error || JSON.stringify(data));
    }

    if (!data.sessionId) {
      throw new Error("Erreur lors de la création de la session (sessionId manquant).");
    }

    localStorage.setItem("sessionId", data.sessionId);
    window.location.href = `mj-session.html?sessionId=${data.sessionId}`;
  } catch (error) {
    console.error("❌ Erreur API :", error);
    messageEl.textContent = "❌ " + error.message;
  }
});
