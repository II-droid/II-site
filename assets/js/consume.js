document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();

  const userSelect = document.getElementById("user");
  const productsDiv = document.getElementById("products");
  const cartList = document.getElementById("cart");
  const confirmBtn = document.getElementById("confirm");

  let cart = {};
  let products = [];

  // Charger utilisateurs
  const { data: users } = await supabaseClient
    .from("users")
    .select("id, prenom, nom");

  users.forEach(u => {
    userSelect.innerHTML += `<option value="${u.id}">${u.prenom} ${u.nom}</option>`;
  });

  // Charger produits
  const res = await supabaseClient.from("stocks").select("*");
  products = res.data || [];

  function renderProducts() {
    productsDiv.innerHTML = "";
    products.forEach(p => {
      const btn = document.createElement("button");
      btn.className = "product-btn";
      btn.textContent = `${p.name} (${p.price}€)`;

      btn.onclick = () => {
        if (p.quantity <= 0) {
          alert("Stock épuisé");
          return;
        }

        cart[p.id] = cart[p.id] || { ...p, qty: 0 };
        cart[p.id].qty++;
        p.quantity--;

        renderCart();
      };

      productsDiv.appendChild(btn);
    });
  }

  function renderCart() {
    cartList.innerHTML = "";

    Object.values(cart).forEach(p => {
      const li = document.createElement("li");
      li.innerHTML = `
        ${p.name} × ${p.qty}
        <button>❌</button>
      `;

      li.querySelector("button").onclick = () => {
        p.qty--;
        p.quantity++;
        if (p.qty <= 0) delete cart[p.id];
        renderCart();
      };

      cartList.appendChild(li);
    });
  }

  confirmBtn.onclick = async () => {
    const userId = userSelect.value;
    if (!userId) return alert("Choisissez une personne");
    if (!Object.keys(cart).length) return alert("Aucun produit sélectionné");

    const total = Object.values(cart)
      .reduce((sum, p) => sum + p.qty * p.price, 0);

    // MAJ utilisateur
    const { data: user } = await supabaseClient
      .from("users")
      .select("total")
      .eq("id", userId)
      .single();

    await supabaseClient
      .from("users")
      .update({ total: (user.total || 0) + total })
      .eq("id", userId);

    // MAJ stocks
    for (const p of Object.values(cart)) {
      await supabaseClient
        .from("stocks")
        .update({ quantity: p.quantity })
        .eq("id", p.id);
    }

    alert(`Consommation validée ✅ (${total.toFixed(2)} €)`);
    cart = {};
    renderCart();
    renderProducts();
  };

  renderProducts();
});
