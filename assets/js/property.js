// ============================================================
//  Property detail page
// ============================================================
(async function () {
  const CFG = window.HC_CONFIG, f = HC.fmt;
  document.getElementById("nav").innerHTML = HC.ui.nav();
  document.getElementById("footer").innerHTML = HC.ui.footer();

  const slug = new URLSearchParams(location.search).get("home");
  const content = document.getElementById("content");
  let p = null, photos = [];
  try { p = slug ? await HC.getProperty(slug) : null; if (p) photos = await HC.getPhotos(p.id); } catch (e) { console.error(e); }

  if (!p) {
    content.innerHTML = `<div class="empty" style="margin:60px 0"><h3>We couldn't find that home</h3><p class="muted">It may have been removed. Browse the full collection instead.</p><a class="btn ghost" href="index.html#homes">Our Homes</a></div>`;
    return;
  }

  document.title = `${p.name} | ${CFG.SITE_NAME}`;
  document.getElementById("crumb-name").textContent = p.name;

  const avail = !!p.is_available;
  const gallery = [p.cover_url, ...photos.map(x => x.url)].filter(Boolean);
  const mapsQ = encodeURIComponent(`${p.street}, ${p.city}, ${p.state || "OH"} ${p.zip || ""}`);
  const price = f.money(p.rent);
  const features = Array.isArray(p.features) ? p.features : String(p.features || "").split(/\n|,/).map(s => s.trim()).filter(Boolean);
  const paragraphs = String(p.description || "").split(/\n{2,}|\n/).map(s => s.trim()).filter(Boolean);
  const applyHref = `apply.html?home=${encodeURIComponent(p.slug)}`;

  const tiles = gallery.length
    ? gallery.slice(0, 3).map((u, i) => `<div class="g" onclick="lbOpen(${i})"><img src="${f.esc(u)}" alt="${f.esc(p.name)} photo ${i + 1}">${i === 2 && gallery.length > 3 ? `<span class="more">+${gallery.length - 3} more photos</span>` : ""}</div>`).join("")
    : `<div class="g" style="grid-column:1/-1;grid-row:1/-1;cursor:default"><div class="photo-soon">photos coming soon</div></div>`;

  const detailRows = [
    ["Home type", f.typeLabel(p.type)],
    ["Available", avail ? (f.date(p.available_date) || "Now") : "Currently leased"],
    ["Lease term", p.lease_term || "12 months"],
    ["Security deposit", f.money(p.deposit) || (price ? "One month's rent" : null)],
    ["Pets", p.pets || "Ask us"],
    ["Address", `<a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">${f.esc(f.addr(p))}, ${f.esc(f.cityLine(p))}</a>`]
  ].filter(r => r[1]);

  content.innerHTML = `
    <div class="detail-head">
      <div>
        <span class="eyebrow">${f.typeLabel(p.type)} &middot; ${f.esc(p.city)}, Ohio</span>
        <h1>${f.esc(p.name)}</h1>
        <div class="addr"><a href="https://www.google.com/maps/search/?api=1&query=${mapsQ}" target="_blank" rel="noopener">${f.esc(f.addr(p))}, ${f.esc(f.cityLine(p))}</a></div>
      </div>
      <div class="detail-price">
        ${avail
          ? (price ? `<div class="price">${price}<span style="font-size:1rem;font-weight:400">/mo</span></div><small>${f.date(p.available_date) ? "Available " + f.date(p.available_date) : "Available now"}</small>`
                   : `<div class="price" style="font-size:1.6rem">Contact for pricing</div><small>Available now</small>`)
          : `<span class="leased-note">Currently leased</span>`}
      </div>
    </div>

    <div class="gallery">${tiles}</div>

    <div class="detail-grid">
      <div>
        <div class="statrow">
          <div class="stat"><div class="v">${f.num(p.beds)}</div><div class="l">Bedrooms</div></div>
          <div class="stat"><div class="v">${f.baths(p.baths)}</div><div class="l">Bathrooms</div></div>
          <div class="stat"><div class="v">${f.num(p.sqft)}</div><div class="l">Sq ft</div></div>
          <div class="stat"><div class="v" style="font-size:1.3rem;padding-top:4px">${price || "&mdash;"}</div><div class="l">Per month</div></div>
        </div>

        <span class="script">about this home</span>
        <div class="prose">${paragraphs.map(t => `<p>${f.esc(t)}</p>`).join("") || "<p class='muted'>Details coming soon.</p>"}</div>

        ${features.length ? `<h2 class="sub">Features &amp; amenities</h2><ul class="features">${features.map(x => `<li>${f.esc(x)}</li>`).join("")}</ul>` : ""}

        <h2 class="sub">The details</h2>
        <dl class="dl">${detailRows.map(r => `<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join("")}</dl>
      </div>

      <aside class="side">
        ${avail ? `
        <div class="panel">
          <span class="script">love it?</span>
          <h3>Apply for this home</h3>
          <p>Takes about five minutes. We'll follow up within one business day.</p>
          <a class="btn" href="${applyHref}">Start application</a>
        </div>
        <div class="panel navy">
          <h3>Want to see it first?</h3>
          <p>Send us a note and we'll set up a time to walk through together.</p>
          <a class="btn light" href="${applyHref}&tour=1">Request a tour</a>
        </div>` : `
        <div class="panel">
          <span class="script">join the waitlist</span>
          <h3>This home is leased</h3>
          <p>Leave your details and you'll be the first to hear when it opens up.</p>
          <form class="form" id="wl-form">
            <input class="hp" type="text" name="botcheck" tabindex="-1" autocomplete="off">
            <div><label>Your name</label><input name="name" required></div>
            <div><label>Email</label><input type="email" name="email" required></div>
            <div><label>Phone</label><input type="tel" name="phone" required></div>
            <div id="wl-msg"></div>
            <button class="btn sage" type="submit">Add me to the list</button>
          </form>
        </div>`}
      </aside>
    </div>`;

  // waitlist (leased homes)
  const wl = document.getElementById("wl-form");
  if (wl) wl.addEventListener("submit", async e => {
    e.preventDefault(); if (wl.botcheck.value) return;
    const btn = wl.querySelector("button"); btn.disabled = true;
    try {
      await HC.submitInquiry({ kind: "waitlist", property_id: p.id, property_name: p.name, name: wl.name.value.trim(), email: wl.email.value.trim(), phone: wl.phone.value.trim() });
      wl.innerHTML = `<div class="note">You're on the list for ${f.esc(p.name)}. We'll be in touch.</div>`;
    } catch (err) { console.error(err); document.getElementById("wl-msg").innerHTML = `<div class="note err">Something went wrong. Email <a href="mailto:${CFG.CONTACT_EMAIL}">${CFG.CONTACT_EMAIL}</a>.</div>`; btn.disabled = false; }
  });

  // lightbox
  let idx = 0;
  const lb = document.getElementById("lightbox"), lbImg = document.getElementById("lb-img"), lbCount = document.getElementById("lb-count");
  function show() { lbImg.src = gallery[idx]; lbCount.textContent = `${idx + 1} / ${gallery.length}`; }
  window.lbOpen = i => { idx = i; show(); lb.classList.add("open"); };
  window.lbClose = () => lb.classList.remove("open");
  window.lbStep = d => { idx = (idx + d + gallery.length) % gallery.length; show(); };
  lb.addEventListener("click", e => { if (e.target === lb) lbClose(); });
  document.addEventListener("keydown", e => { if (!lb.classList.contains("open")) return; if (e.key === "Escape") lbClose(); if (e.key === "ArrowRight") lbStep(1); if (e.key === "ArrowLeft") lbStep(-1); });
})();
