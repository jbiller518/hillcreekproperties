// ============================================================
//  Home page behaviour
// ============================================================
(async function () {
  const CFG = window.HC_CONFIG, f = HC.fmt;
  document.getElementById("nav").innerHTML = HC.ui.nav();
  document.getElementById("footer").innerHTML = HC.ui.footer();
  document.getElementById("rr-message").href = CFG.RENTREADI_URL;
  document.getElementById("rr-maint").href = CFG.RENTREADI_URL;

  let all = [];
  try { all = await HC.getProperties(); }
  catch (e) { console.error(e); }

  const available = all.filter(p => p.is_available);
  const availGrid = document.getElementById("available-grid");
  const allGrid = document.getElementById("all-grid");

  function stats(p) {
    return `<div class="stats">
      <span><b>${f.num(p.beds)}</b> bd</span>
      <span><b>${f.baths(p.baths)}</b> ba</span>
      ${p.sqft ? `<span><b>${f.num(p.sqft)}</b> sq ft</span>` : ""}
    </div>`;
  }

  function card(p) {
    const avail = !!p.is_available;
    const href = `property.html?home=${encodeURIComponent(p.slug)}`;
    const img = `<img src="${f.esc(p.cover_url || "")}" alt="${f.esc(p.name)}" loading="lazy">`;
    const price = f.money(p.rent);
    if (avail) {
      return `<a class="card reveal" href="${href}">
        <span class="badge">Available</span>
        <div class="photo">${img}</div>
        <div class="body">
          <div class="name">${f.esc(p.name)}</div>
          <div class="addr">${f.esc(f.addr(p))} &middot; ${f.esc(p.city)}</div>
          ${stats(p)}
          <div class="foot">
            <div class="price">${price ? price + "<small>/mo</small>" : "<small>Contact for pricing</small>"}</div>
            <span class="link-arrow">View home</span>
          </div>
        </div>
      </a>`;
    }
    return `<div class="card leased reveal">
      <span class="ribbon">Leased</span>
      <div class="photo">${img}</div>
      <div class="body">
        <div class="name">${f.esc(p.name)}</div>
        <div class="addr">${f.esc(f.addr(p))} &middot; ${f.esc(p.city)}</div>
        ${stats(p)}
        <div class="foot">
          <span class="muted" style="font-size:.84rem">${f.typeLabel(p.type)}</span>
          <button class="btn ghost sm" onclick="openWaitlist('${f.esc(p.id)}','${f.esc(p.name).replace(/'/g, "\\'")}')">Join waitlist</button>
        </div>
      </div>
    </div>`;
  }

  // Available grid
  if (available.length) availGrid.innerHTML = available.map(card).join("");
  else availGrid.innerHTML = `<div class="empty reveal">
      <span class="script">nothing open just now</span>
      <h3>Every home is spoken for</h3>
      <p class="muted">Browse the collection below and join the waitlist for the one you love. We'll reach out as soon as it opens up.</p>
      <a class="btn ghost" href="#homes">Browse the collection</a>
    </div>`;

  // All homes grid (+ filters)
  const showLeased = CFG.SHOW_LEASED_HOMES !== false;
  function renderAll(filter) {
    let list = showLeased ? all : available;
    if (filter && filter !== "all") list = list.filter(p => p.type === filter);
    allGrid.innerHTML = list.length ? list.map(card).join("") : `<div class="empty"><h3>No homes in this category yet</h3></div>`;
    HC.ui.reveal();
  }
  renderAll("all");
  document.querySelectorAll(".chip").forEach(ch => ch.addEventListener("click", () => {
    document.querySelectorAll(".chip").forEach(c => c.classList.remove("active"));
    ch.classList.add("active"); renderAll(ch.dataset.filter);
  }));
  if (!showLeased) document.querySelector("#homes .section-head p").textContent = "Every home currently open in the Hillcreek family.";

  HC.ui.reveal();
  if (location.hash) { const t = document.querySelector(location.hash); if (t) setTimeout(() => t.scrollIntoView({ behavior: "instant" }), 50); }

  // ---- waitlist modal ----
  const modal = document.getElementById("waitlist-modal");
  const form = document.getElementById("wl-form");
  window.openWaitlist = (id, name) => {
    form.reset(); document.getElementById("wl-msg").innerHTML = "";
    form.property_id.value = id; form.property_name.value = name;
    document.getElementById("wl-title").textContent = name;
    modal.classList.add("open");
  };
  window.closeWaitlist = () => modal.classList.remove("open");
  modal.addEventListener("click", e => { if (e.target === modal) closeWaitlist(); });
  form.addEventListener("submit", async e => {
    e.preventDefault();
    if (form.botcheck.value) return;
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    const msg = document.getElementById("wl-msg");
    try {
      await HC.submitInquiry({
        kind: "waitlist", property_id: form.property_id.value, property_name: form.property_name.value,
        name: form.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(), message: form.message.value.trim()
      });
      form.querySelectorAll("div:not(#wl-msg), button").forEach(el => el.style.display = "none");
      msg.innerHTML = `<div class="note">You're on the list. We'll be in touch the moment ${f.esc(form.property_name.value)} opens up.</div>`;
    } catch (err) {
      console.error(err);
      msg.innerHTML = `<div class="note err">Something went wrong. Please email us at <a href="mailto:${CFG.CONTACT_EMAIL}">${CFG.CONTACT_EMAIL}</a>.</div>`;
      btn.disabled = false;
    }
  });
})();
