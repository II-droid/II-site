// app.js

document.addEventListener("DOMContentLoaded", async () => {

  await window.protectPage();

  const tableBody = document.querySelector("#consumption-table tbody");
  const logoutBtn = document.getElementById("logout-btn");
  const exportBtn = document.getElementById("export-btn");

  logoutBtn.addEventListener("click", async () => {
    await window.logout();
  });

  try {
    const { data: users, error } = await window.supabaseClient
      .from("users")
      .select("*");

    if (error) throw error;

    tableBody.innerHTML = "";

    users.forEach(user => {
      const total = user.total || 0;
      const paid = user.paid || 0;
      const restant = total - paid;

      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${user.priority}</td>
        <td>${user.nom}</td>
        <td>${user.prenom}</td>
        <td>${restant.toFixed(2)} €</td>
        <td>${total.toFixed(2)} €</td>
      `;
      tableBody.appendChild(tr);
    });

  } catch (err) {
    console.error("Erreur dashboard:", err);
  }

 exportBtn.addEventListener("click", () => {
  let csv = `"Priorité","Nom","Prénom","Restant","Total"\n`;

  tableBody.querySelectorAll("tr").forEach(row => {
    const rowData = [...row.children].map(td => {
      // Retirer le symbole € et entourer de guillemets
      return `"${td.textContent.replace("€","").trim()}"`;
    });
    csv += rowData.join(",") + "\n";
  });

  const link = document.createElement("a");
  link.href = encodeURI("data:text/csv;charset=utf-8," + csv);
  link.download = "consommations.csv";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});
})