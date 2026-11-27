// Roda antes da pintura para não piscar tema nem nível. Espelha src/lib/preferencias/modelo.ts.
(function () {
  var html = document.documentElement;
  var p = {};
  try {
    p = JSON.parse(localStorage.getItem("ecf:preferencias:v1") || "{}") || {};
  } catch {
    p = {};
  }
  html.dataset.nivel = p.nivel === "profissional" ? "profissional" : "iniciante";
  html.dataset.theme = p.tema === "light" ? "light" : "dark";
  // Perfil já respondido ou pulado: o cartão da home some antes de aparecer.
  if (p.perfil === "respondido" || p.perfil === "pulado") html.dataset.perfil = "ok";
})();
