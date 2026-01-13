document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();

  const userList = document.getElementById("user-list");
  if (!userList) return;
  const userForm = document.getElementById("user-form");
  if (!userForm) return;

  async function loadUsers() {
    const { data, error } = await supabaseClient
      .from("users")
      .select("*")
      .order("priority");

    if (error) {
      console.error(error);
      return;
    }

    userList.innerHTML = "";

    data.forEach(u => {
      const restant = (u.total || 0) - (u.paid || 0);

      const li = document.createElement("li");

      li.innerHTML = `
        ${u.prenom} ${u.nom} (${u.priority}) - Montant restant: ${restant.toFixed(2)} €
        <button data-id="${u.id}" class="delete">❌</button>
        <input type="number" step="0.01" min="0" max="${restant}" placeholder="Paiement effectué" class="edit-total" value="0">
        <button data-id="${u.id}" class="update-total">💾</button>
      `;

      userList.appendChild(li);
    });

    // Supprimer utilisateur
    userList.querySelectorAll(".delete").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Supprimer cet utilisateur ?")) return;
        await supabaseClient.from("users").delete().eq("id", btn.dataset.id);
        loadUsers();
      };
    });

    // Ajouter un paiement (mettre à jour paid)
    userList.querySelectorAll(".update-total").forEach(btn => {
      btn.onclick = async () => {
        const input = btn.previousElementSibling;
        const paiement = parseFloat(input.value);
        if (isNaN(paiement) || paiement < 0) {
          alert("Valeur invalide");
          return;
        }

        // Récupérer les données actuelles de l'utilisateur
        const { data: userData } = await supabaseClient
          .from("users")
          .select("paid, total")
          .eq("id", btn.dataset.id)
          .single();

        const restant = (userData.total || 0) - (userData.paid || 0);

        if (paiement > restant) {
          alert("Le paiement ne peut pas dépasser le montant restant !");
          return;
        }

        const newPaid = (userData.paid || 0) + paiement;

        await supabaseClient
          .from("users")
          .update({ paid: newPaid })
          .eq("id", btn.dataset.id);

        alert(`Paiement enregistré ✅ Montant payé : ${newPaid.toFixed(2)} €`);
        loadUsers();
      };
    });
  }

  // Ajouter un utilisateur
  userForm.onsubmit = async e => {
    e.preventDefault();

    const prenom = userForm.prenom.value.trim();
    const nom = userForm.nom.value.trim();
    const priority = userForm.priority.value;
    const total = parseFloat(userForm.total.value) || 0;

    if (!prenom || !nom || !["P1", "P2", "P3"].includes(priority)) {
      alert("Valeurs invalides");
      return;
    }

    await supabaseClient.from("users").insert([{
      prenom,
      nom,
      priority,
      total,
      paid: 0
    }]);

    userForm.reset();
    loadUsers();
  };

  loadUsers();
});
