// ============================================================
//  Owner dashboard
// ============================================================
(async function () {
  const CFG = window.HC_CONFIG, f = HC.fmt;
  const app = document.getElementById("app");
  document.getElementById("adm-brand").innerHTML = HC.ui.brand();
  if (!HC.live) document.getElementById("demo-bar").innerHTML = `<div class="demo-bar"><b>Demo mode.</b> Changes save only in this browser. Connect Supabase in <code>assets/js/config.js</code> to go live (see SETUP.md).</div>`;

  const toast = m => { const t = document.getElementById("toast"); t.textContent = m; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2200); };
  const slugify = s => String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const drawer = document.getElementById("drawer"), bg = document.getElementById("drawer-bg"), inner = document.getElementById("drawer-inner");
  bg.onclick = () => closeEditor();

  // ---------- auth ----------
  let props = [], inquiries = [], tab = "homes";
  let session = await HC.getSession();
  if (!session) return renderLogin();
  return renderApp();

  function renderLogin() {
    app.innerHTML = `<div class="login panel">
      <span class="script">owner login</span>
      <h2>Dashboard</h2>
      <p class="muted" style="font-size:.95rem">${HC.live ? "Sign in with your owner account." : "Demo mode: press Sign in to explore the dashboard."}</p>
      <form class="form" id="login">
        <div><label>Email</label><input type="email" name="email" ${HC.live ? "required" : ""} value="${HC.live ? "" : "demo@hillcreekproperties.com"}"></div>
        <div><label>Password</label><input type="password" name="password" ${HC.live ? "required" : ""} value="${HC.live ? "" : "demo"}"></div>
        <div id="login-msg"></div>
        <button class="btn" type="submit">Sign in</button>
      </form></div>`;
    document.getElementById("login").addEventListener("submit", async e => {
      e.preventDefault(); const fm = e.target; const b = fm.querySelector("button"); b.disabled = true;
      try { session = await HC.signIn(fm.email.value.trim(), fm.password.value); renderApp(); }
      catch (err) { document.getElementById("login-msg").innerHTML = `<div class="note err">${f.esc(err.message || "Sign-in failed")}</div>`; b.disabled = false; }
    });
  }

  // ---------- app shell ----------
  async function renderApp() {
    document.getElementById("who").textContent = session.user.email;
    const so = document.getElementById("signout"); so.style.display = "inline-block";
    so.onclick = async () => { await HC.signOut(); location.reload(); };
    await reload();
  }
  async function reload() {
    try { [props, inquiries] = await Promise.all([HC.getProperties(), HC.getInquiries()]); }
    catch (e) { app.innerHTML = `<div class="note err" style="margin-top:40px">Could not load data: ${f.esc(e.message)}</div>`; return; }
    draw();
  }
  function draw() {
    const availCount = props.filter(p => p.is_available).length;
    app.innerHTML = `
      <div class="tabs">
        <button class="tab ${tab === "homes" ? "active" : ""}" data-t="homes">Homes <span class="n">${props.length}</span></button>
        <button class="tab ${tab === "inbox" ? "active" : ""}" data-t="inbox">Inbox <span class="n">${inquiries.length}</span></button>
      </div>
      <div id="tabview"></div>`;
    app.querySelectorAll(".tab").forEach(b => b.onclick = () => { tab = b.dataset.t; draw(); });
    const v = document.getElementById("tabview");
    if (tab === "homes") {
      v.innerHTML = `<div class="toolbar">
          <div><h2>Your homes</h2><div class="summary">${availCount} available &middot; ${props.length - availCount} leased. Flip a switch to publish or unpublish a home.</div></div>
          <div style="display:flex;gap:10px">${HC.live ? "" : `<button class="icon-btn" id="reset-demo">Reset demo data</button>`}<button class="btn sm" id="add">+ Add a home</button></div>
        </div>
        <div class="plist">${props.map(row).join("")}</div>`;
      v.querySelectorAll(".switch input").forEach(sw => sw.onchange = async () => {
        sw.disabled = true;
        try { await HC.setAvailable(sw.dataset.id, sw.checked); const p = props.find(x => x.id === sw.dataset.id); p.is_available = sw.checked; toast(sw.checked ? `${p.name} is now live as Available` : `${p.name} marked Leased`); draw(); }
        catch (e) { sw.checked = !sw.checked; toast("Could not save: " + e.message); sw.disabled = false; }
      });
      v.querySelectorAll("[data-edit]").forEach(b => b.onclick = () => openEditor(props.find(x => x.id === b.dataset.edit)));
      v.querySelectorAll("[data-del]").forEach(b => b.onclick = async () => {
        const p = props.find(x => x.id === b.dataset.del);
        if (!confirm(`Delete ${p.name}? This removes it from the site permanently.`)) return;
        try { await HC.deleteProperty(p.id); toast("Deleted"); reload(); } catch (e) { toast("Could not delete: " + e.message); }
      });
      document.getElementById("add").onclick = () => openEditor(null);
      const rd = document.getElementById("reset-demo"); if (rd) rd.onclick = () => { if (confirm("Reset the demo data back to the sample homes?")) { HC.resetDemo(); location.reload(); } };
    } else {
      v.innerHTML = `<div class="toolbar"><div><h2>Inbox</h2><div class="summary">Applications, tour requests and waitlist sign-ups from the site.</div></div></div>
        ${inquiries.length ? inquiries.map(inqRow).join("") : `<div class="empty"><h3>No inquiries yet</h3><p class="muted">Applications and waitlist sign-ups will appear here.</p></div>`}`;
      v.querySelectorAll("[data-delinq]").forEach(b => b.onclick = async () => { if (!confirm("Delete this inquiry?")) return; await HC.deleteInquiry(b.dataset.delinq); reload(); });
    }
  }
  function row(p) {
    return `<div class="prow">
      ${p.cover_url ? `<img class="thumb" src="${f.esc(p.cover_url)}" alt="">` : `<div class="thumb" style="display:grid;place-items:center;font-family:var(--script);color:#fff;font-size:1rem;background:linear-gradient(160deg,var(--sand),#d9cdb9)">no photo</div>`}
      <div><div class="nm">${f.esc(p.name)}</div><div class="ad">${f.esc(f.addr(p))}, ${f.esc(f.cityLine(p))}</div>
        <div class="meta">${f.typeLabel(p.type)} &middot; ${f.num(p.beds)} bd / ${f.baths(p.baths)} ba &middot; ${f.money(p.rent) ? f.money(p.rent) + "/mo" : "No rent set"}</div></div>
      <div class="status ${p.is_available ? "on" : "off"}">${p.is_available ? "Available" : "Leased"}</div>
      <div class="actions">
        <label class="switch" title="Toggle availability"><input type="checkbox" data-id="${f.esc(p.id)}" ${p.is_available ? "checked" : ""}><span class="sl"></span></label>
        <button class="icon-btn" data-edit="${f.esc(p.id)}">Edit</button>
        <button class="icon-btn danger" data-del="${f.esc(p.id)}" title="Delete">&times;</button>
      </div>
    </div>`;
  }
  function inqRow(q) {
    const when = q.created_at ? new Date(q.created_at).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" }) : "";
    const extras = [q.move_in ? "Move-in: " + f.date(q.move_in) : null, q.occupants ? "Occupants: " + q.occupants : null, q.pets ? "Pets: " + q.pets : null].filter(Boolean).join(" · ");
    return `<div class="inq">
      <div>
        <div><span class="k ${q.kind}">${q.kind === "apply" ? "Application" : q.kind === "tour" ? "Tour request" : q.kind === "contact" ? "Message" : "Waitlist"}</span><span class="who">${f.esc(q.name)}</span> <span class="muted" style="font-size:.9rem">&middot; ${f.esc(q.property_name || "General inquiry")}</span></div>
        <div class="ct"><a href="mailto:${f.esc(q.email)}">${f.esc(q.email)}</a> &nbsp;&middot;&nbsp; <a href="tel:${f.esc(q.phone)}">${f.esc(q.phone)}</a>${extras ? "<br>" + f.esc(extras) : ""}</div>
        ${q.message ? `<div class="msg">${f.esc(q.message)}</div>` : ""}
        <div class="dt">${when}</div>
      </div>
      <div><button class="icon-btn danger" data-delinq="${f.esc(q.id)}">&times;</button></div>
    </div>`;
  }

  // ---------- editor drawer ----------
  function closeEditor() { drawer.classList.remove("open"); bg.classList.remove("open"); }
  async function openEditor(p) {
    const isNew = !p;
    p = p || { name: "", street: "", unit: "", city: "Columbus", state: "OH", zip: "", type: "single-family", beds: "", baths: "", sqft: "", rent: "", deposit: "", pets: "", available_date: "", lease_term: "12 months", description: "", features: [], is_available: false, cover_url: "", sort_order: props.length + 1 };
    let photos = isNew ? [] : await HC.getPhotos(p.id);
    const feat = Array.isArray(p.features) ? p.features.join("\n") : (p.features || "");
    const val = v => f.esc(v == null ? "" : v);
    inner.innerHTML = `
      <button class="x" id="dx">&times;</button>
      <span class="script">${isNew ? "new home" : "edit home"}</span>
      <h2>${isNew ? "Add a home" : f.esc(p.name)}</h2>
      <p class="muted" style="font-size:.9rem;margin-bottom:22px">${isNew ? "Save first, then add photos." : "Changes publish to the site as soon as you save."}</p>
      <form id="ed" class="form">
        <fieldset><legend>Basics</legend>
          <div class="form">
            <div class="row"><div><label>Display name</label><input name="name" value="${val(p.name)}" required placeholder="e.g. The Parkgate House"></div><div><label>Home type</label><select name="type"><option value="single-family" ${p.type === "single-family" ? "selected" : ""}>Single-family home</option><option value="duplex" ${p.type === "duplex" ? "selected" : ""}>Duplex</option></select></div></div>
            <div class="row"><div><label>Street address</label><input name="street" value="${val(p.street)}" required></div><div><label>Unit (optional)</label><input name="unit" value="${val(p.unit)}" placeholder="e.g. Unit A"></div></div>
            <div class="row3"><div><label>City</label><input name="city" value="${val(p.city)}" required></div><div><label>State</label><input name="state" value="${val(p.state || "OH")}"></div><div><label>ZIP</label><input name="zip" value="${val(p.zip)}"></div></div>
          </div>
        </fieldset>
        <fieldset><legend>Listing details</legend>
          <div class="form">
            <div class="row3"><div><label>Bedrooms</label><input type="number" step="1" min="0" name="beds" value="${val(p.beds)}"></div><div><label>Bathrooms</label><input type="number" step="0.5" min="0" name="baths" value="${val(p.baths)}"></div><div><label>Square feet</label><input type="number" step="1" min="0" name="sqft" value="${val(p.sqft)}"></div></div>
            <div class="row3"><div><label>Monthly rent ($)</label><input type="number" step="1" min="0" name="rent" value="${val(p.rent)}"></div><div><label>Deposit ($)</label><input type="number" step="1" min="0" name="deposit" value="${val(p.deposit)}"></div><div><label>Available date</label><input type="date" name="available_date" value="${val(p.available_date ? String(p.available_date).slice(0, 10) : "")}"></div></div>
            <div class="row"><div><label>Pet policy</label><input name="pets" value="${val(p.pets)}" placeholder="e.g. Cats OK, dogs under 30 lb"></div><div><label>Lease term</label><input name="lease_term" value="${val(p.lease_term)}"></div></div>
            <div><label>Description</label><textarea name="description" style="min-height:160px">${val(p.description)}</textarea><div class="field-hint">Blank line between paragraphs.</div></div>
            <div><label>Features &amp; amenities</label><textarea name="features" style="min-height:110px" placeholder="One per line">${val(feat)}</textarea><div class="field-hint">One per line, e.g. Washer &amp; dryer hookups.</div></div>
            <div class="row"><div><label>Display order</label><input type="number" name="sort_order" value="${val(p.sort_order)}"></div><div><label>Status</label><select name="is_available"><option value="false" ${!p.is_available ? "selected" : ""}>Leased (hidden from Available)</option><option value="true" ${p.is_available ? "selected" : ""}>Available (published)</option></select></div></div>
          </div>
        </fieldset>
        <fieldset><legend>Cover photo</legend>
          <img class="cover-prev" id="cover-prev" src="${val(p.cover_url)}" onerror="this.style.visibility='hidden'">
          <div class="upload">${isNew ? `<span class="muted" style="font-size:.9rem">Save the home first to upload photos.</span>` : `<input type="file" id="cover-file" accept="image/*"><span class="muted" style="font-size:.85rem">or paste an image URL:</span>`}</div>
          <div style="margin-top:8px"><input name="cover_url" value="${val(p.cover_url)}" placeholder="https://..."></div>
        </fieldset>
        <fieldset><legend>Gallery photos</legend>
          ${isNew ? `<span class="muted" style="font-size:.9rem">Save the home first to add gallery photos.</span>` : `
          <div class="upload"><input type="file" id="gal-files" accept="image/*" multiple><input type="url" id="gal-url" placeholder="or paste an image URL" style="max-width:280px"><button type="button" class="icon-btn" id="gal-add">Add URL</button></div>
          <div class="photos" id="photos">${photos.map(ph => `<div class="ph"><img src="${f.esc(ph.url)}"><button type="button" data-ph="${f.esc(ph.id)}" title="Remove">&times;</button></div>`).join("")}</div>`}
        </fieldset>
        <div class="save-bar"><button class="btn" type="submit">Save home</button><button type="button" class="btn ghost" id="cancel">Cancel</button><span id="ed-msg" class="muted" style="font-size:.85rem"></span></div>
      </form>`;
    drawer.classList.add("open"); bg.classList.add("open"); drawer.scrollTop = 0;
    document.getElementById("dx").onclick = closeEditor; document.getElementById("cancel").onclick = closeEditor;
    const fm = document.getElementById("ed");
    fm.cover_url.oninput = () => { const c = document.getElementById("cover-prev"); c.style.visibility = "visible"; c.src = fm.cover_url.value; };

    fm.onsubmit = async e => {
      e.preventDefault(); const b = fm.querySelector("button[type=submit]"); b.disabled = true;
      const num = v => (v === "" ? null : Number(v));
      const obj = {
        id: p.id, slug: p.slug || slugify(fm.name.value) || slugify(fm.street.value),
        name: fm.name.value.trim(), type: fm.type.value, street: fm.street.value.trim(), unit: fm.unit.value.trim(), city: fm.city.value.trim(), state: fm.state.value.trim() || "OH", zip: fm.zip.value.trim(),
        beds: num(fm.beds.value), baths: num(fm.baths.value), sqft: num(fm.sqft.value), rent: num(fm.rent.value), deposit: num(fm.deposit.value),
        available_date: fm.available_date.value || null, pets: fm.pets.value.trim(), lease_term: fm.lease_term.value.trim(),
        description: fm.description.value.trim(), features: fm.features.value.split("\n").map(s => s.trim()).filter(Boolean),
        is_available: fm.is_available.value === "true", cover_url: fm.cover_url.value.trim(), sort_order: num(fm.sort_order.value) || 0
      };
      // make sure slug is unique
      if (props.some(x => x.slug === obj.slug && x.id !== obj.id)) obj.slug += "-" + Math.random().toString(36).slice(2, 5);
      try { const saved = await HC.saveProperty(obj); toast("Saved"); await reload(); if (isNew) openEditor(props.find(x => x.id === saved.id) || saved); else closeEditor(); }
      catch (err) { document.getElementById("ed-msg").textContent = "Could not save: " + err.message; b.disabled = false; }
    };

    if (!isNew) {
      const cf = document.getElementById("cover-file");
      cf.onchange = async () => { if (!cf.files[0]) return; toast("Uploading cover..."); try { const url = await HC.uploadCover(p.id, cf.files[0]); fm.cover_url.value = url; document.getElementById("cover-prev").src = url; document.getElementById("cover-prev").style.visibility = "visible"; toast("Cover photo saved"); await reload(); } catch (e) { toast("Upload failed: " + e.message); } };
      const gf = document.getElementById("gal-files");
      gf.onchange = async () => { const files = [...gf.files]; if (!files.length) return; toast(`Uploading ${files.length} photo(s)...`); try { for (const file of files) await HC.uploadPhoto(p.id, file); toast("Photos added"); openEditor(p); } catch (e) { toast("Upload failed: " + e.message); } };
      document.getElementById("gal-add").onclick = async () => { const u = document.getElementById("gal-url").value.trim(); if (!u) return; await HC.addPhotoUrl(p.id, u); toast("Photo added"); openEditor(p); };
      document.querySelectorAll("[data-ph]").forEach(b => b.onclick = async () => { await HC.deletePhoto(b.dataset.ph); openEditor(p); });
    }
  }
})();
