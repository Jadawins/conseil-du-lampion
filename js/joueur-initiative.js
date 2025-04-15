const urlParams = new URLSearchParams(window.location.search);
const sessionId = urlParams.get('sessionId');
const pseudo = localStorage.getItem("pseudo");

const form = document.getElementById('initiative-form');
const title = document.getElementById('initiative-title');
const confirmation = document.getElementById('confirmation-message');

window.addEventListener("DOMContentLoaded", async () => {
  if (!sessionId || !pseudo) return;

  try {
    const response = await fetch(`https://lampion-api.azurewebsites.net/api/GetSession/${sessionId}`);
    if (response.ok) {
      const data = await response.json();
      const joueur = data?.joueurs?.find(j => j.pseudo === pseudo);

      if (joueur && typeof joueur.initiative === "number" && joueur.initiative > 0) {
        form.style.display = "none";
        title.style.display = "none";
        confirmation.style.display = "block";
      }
    }
  } catch (err) {
    console.error("Erreur récupération initiative:", err);
  }
});

form.addEventListener('submit', async (e) => {
  e.preventDefault();

  const initiative = parseInt(document.getElementById('initiative-input').value);
  const pv = parseInt(document.getElementById('pv-input').value);

  if (isNaN(initiative) || isNaN(pv)) return;

  try {
    await fetch(`https://lampion-api.azurewebsites.net/api/SetInitiative`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, pseudo, initiative, pv })
    });

    form.style.display = 'none';
    title.style.display = 'none';
    confirmation.style.display = 'block';
  } catch (err) {
    alert("Erreur lors de l'enregistrement de l'initiative.");
  }
});
