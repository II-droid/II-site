document.addEventListener("DOMContentLoaded", async () => {
  await protectPage();

  const userSelect = document.getElementById("user");
  const productsDiv = document.getElementById("products");
  const cartList = document.getElementById("cart");
  const confirmBtn = document.getElementById("confirm");

  let cart = [];

  // Charger utilisateurs et produits
  const { data: users } = await supabaseClient.from("users").select("id, nom, prenom, total");
  const { data: products } = await supabaseClient.from("stocks").select("*");

  // Remplir la sélection d'utilisateurs
  users.forEach(u => {
    userSelect.innerHTML += `<option value="${u.id}">${u.nom} ${u.prenom}</option>`;
  });

  // Créer les boutons produits
  function renderProducts() {
    productsDiv.innerHTML = "";
    products.forEach(p => {
      const btn = document.createElement("button");
      btn.textContent = `${p.name} (${p.price}€ | ${p.quantity})`;

      btn.onclick = () => {
        if (p.quantity <= 0) {
          alert("Stock épuisé");
          return;
        }
        cart.push(p);
        p.quantity--;
        renderCart();
        renderProducts();
      };

      productsDiv.appendChild(btn);
    });
  }

  function renderCart() {
    cartList.innerHTML = "";
    cart.forEach((p, index) => {
      const li = document.createElement("li");
      li.textContent = `${p.name} - ${p.price}€`;
      const removeBtn = document.createElement("button");
      removeBtn.textContent = "❌";
      removeBtn.onclick = () => {
        p.quantity++;
        cart.splice(index, 1);
        renderCart();
        renderProducts();
      };
      li.appendChild(removeBtn);
      cartList.appendChild(li);
    });
  }

  confirmBtn.onclick = async () => {
    if (!cart.length) {
      alert("Aucun produit sélectionné");
      return;
    }

    const userId = userSelect.value;

    // 1️⃣ Récupérer le total actuel de l’utilisateur
    const { data: userData, error: userError } = await supabaseClient
      .from("users")
      .select("total")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error(userError);
      alert("Impossible de récupérer les informations de l'utilisateur");
      return;
    }

    // 2️⃣ Calculer le total à ajouter
    const totalToAdd = cart.reduce((sum, p) => sum + p.price, 0);
    const newTotal = (userData.total || 0) + totalToAdd;

    // 3️⃣ Mettre à jour le total de l'utilisateur
    const { error: updateError } = await supabaseClient
      .from("users")
      .update({ total: newTotal })
      .eq("id", userId);

    if (updateError) {
      console.error(updateError);
      alert("Impossible de mettre à jour le total");
      return;
    }

    // 4️⃣ Mettre à jour les stocks
    for (const p of cart) {
      await supabaseClient
        .from("stocks")
        .update({ quantity: p.quantity })
        .eq("id", p.id);
    }

    // 5️⃣ Optionnel : enregistrer chaque consommation individuellement
    // si tu veux suivre le détail des produits consommés
    // await supabaseClient.from("consumptions").insert(
    //   cart.map(p => ({ user_id: userId, product_id: p.id, price: p.price }))
    // );

    alert(`Consommation validée ✅ Total ajouté : ${totalToAdd.toFixed(2)} €`);

    // 6️⃣ Vider le panier et mettre à jour l'affichage
    cart = [];
    renderCart();
    renderProducts();
  };

  renderProducts();
});

