// auth.js

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("login-form");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim();
    const password = document.getElementById("password").value;
    const errorEl = document.getElementById("error");

    errorEl.textContent = "Connexion en cours...";

    const { error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) {
      errorEl.textContent = "❌ " + error.message;
    } else {
      window.location.href = "app.html";
    }
  });
});

// Protection des pages privées
window.protectPage = async function () {
  const session = await window.getSession();
  if (!session) {
    window.location.href = "index.html";
  }
};
