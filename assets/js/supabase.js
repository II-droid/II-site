// supabase.js

const SUPABASE_URL = "https://xllftuthsbcrjvpbxngn.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_qetFv6e07ceSWS5C79ueNA_ObSnPy-K";

// Initialisation Supabase
window.supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_ANON_KEY
);

// Session utilisateur
window.getSession = async function () {
  const {
    data: { session }
  } = await window.supabaseClient.auth.getSession();
  return session;
};

// Déconnexion
window.logout = async function () {
  await window.supabaseClient.auth.signOut();
  window.location.href = "index.html";
};
