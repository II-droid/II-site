document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();

  const list = document.getElementById("stock-list");
  const form = document.getElementById("stock-form");

  async function loadStocks() {
    const { data, error } = await supabaseClient
      .from("stocks")
      .select("*")
      .order("name");

    if (error) {
      console.error(error);
      return;
    }

    list.innerHTML = "";

    data.forEach(p => {
      const li = document.createElement("li");

      li.innerHTML = `
        <strong>${p.name}</strong> — ${p.quantity} unité(s) — ${p.price} €
        <button data-id="${p.id}" class="delete">❌</button>
        <input type="number" step="0.01" min="0" placeholder="Modifier prix" class="edit-price">
        <button data-id="${p.id}" class="update-price">💾</button>
      `;

      list.appendChild(li);
    });

    // Supprimer un produit
    list.querySelectorAll(".delete").forEach(btn => {
      btn.onclick = async () => {
        if (!confirm("Supprimer ce produit ?")) return;
        await supabaseClient.from("stocks").delete().eq("id", btn.dataset.id);
        loadStocks();
      };
    });

    // Modifier le prix
    list.querySelectorAll(".update-price").forEach(btn => {
      btn.onclick = async () => {
        const input = btn.previousElementSibling;
        const newPrice = parseFloat(input.value);
        if (isNaN(newPrice) || newPrice < 0) {
          alert("Prix invalide");
          return;
        }

        await supabaseClient
          .from("stocks")
          .update({ price: newPrice })
          .eq("id", btn.dataset.id);

        alert("Prix mis à jour ✅");
        loadStocks();
      };
    });
  }

  form.onsubmit = async e => {
    e.preventDefault();

    const name = form.name.value.trim();
    const price = parseFloat(form.price.value);
    const quantity = parseInt(form.quantity.value);

    if (!name || price <= 0 || quantity < 0) {
      alert("Valeurs invalides");
      return;
    }

    // Vérifier si le produit existe
    const { data: existing } = await supabaseClient
      .from("stocks")
      .select("id")
      .eq("name", name)
      .single();

    if (existing) {
      // Remplacer les valeurs existantes
      await supabaseClient
        .from("stocks")
        .update({ price, quantity })
        .eq("id", existing.id);
    } else {
      await supabaseClient
        .from("stocks")
        .insert([{ name, price, quantity }]);
    }

    form.reset();
    loadStocks();
  };

  loadStocks();
});
