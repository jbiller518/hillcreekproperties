// ============================================================
//  Data layer. Talks to Supabase when configured, otherwise
//  runs in DEMO MODE using the sample data + localStorage.
// ============================================================
(function () {
  const CFG = window.HC_CONFIG || {};
  const LIVE = !!(CFG.SUPABASE_URL && CFG.SUPABASE_ANON_KEY && window.supabase);
  const sb = LIVE ? window.supabase.createClient(CFG.SUPABASE_URL, CFG.SUPABASE_ANON_KEY) : null;
  const DEMO_KEY = "hc_demo_v1";

  // ---------- demo store ----------
  function demoLoad() {
    try {
      const raw = localStorage.getItem(DEMO_KEY);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    const seed = (window.HC_SEED || []).map(p => ({ ...p }));
    const photos = [];
    seed.forEach(p => { (p.photos || []).forEach(ph => photos.push({ ...ph, property_id: p.id })); delete p.photos; });
    const store = { properties: seed, photos, inquiries: [] };
    demoSave(store);
    return store;
  }
  function demoSave(store) { try { localStorage.setItem(DEMO_KEY, JSON.stringify(store)); } catch (e) {} }
  const uid = () => "id-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);

  const sortProps = (a, b) => (a.sort_order || 0) - (b.sort_order || 0) || (a.name || "").localeCompare(b.name || "");

  const HC = {
    live: LIVE,
    sb,

    // ===== public reads =====
    async getProperties() {
      if (!LIVE) return demoLoad().properties.slice().sort(sortProps);
      const { data, error } = await sb.from("properties").select("*").order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    async getProperty(slug) {
      if (!LIVE) return demoLoad().properties.find(p => p.slug === slug) || null;
      const { data, error } = await sb.from("properties").select("*").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data;
    },
    async getPhotos(propertyId) {
      if (!LIVE) return demoLoad().photos.filter(p => p.property_id === propertyId).sort((a, b) => a.sort_order - b.sort_order);
      const { data, error } = await sb.from("property_photos").select("*").eq("property_id", propertyId).order("sort_order");
      if (error) throw error;
      return data;
    },

    // ===== inquiries (apply / waitlist) =====
    async submitInquiry(inq) {
      let emailed = false;
      if (CFG.FORMSPREE_FORM_ID) {
        const label = { apply: "Rental application", tour: "Tour request", waitlist: "Waitlist request", contact: "Message" }[inq.kind] || "Inquiry";
        try {
          const res = await fetch("https://formspree.io/f/" + CFG.FORMSPREE_FORM_ID, {
            method: "POST",
            headers: { "Content-Type": "application/json", Accept: "application/json" },
            body: JSON.stringify({
              _subject: `${label} - ${inq.property_name || "General"} - ${inq.name}`,
              name: inq.name, email: inq.email, phone: inq.phone || "",
              property: inq.property_name || "General inquiry",
              move_in: inq.move_in || "", occupants: inq.occupants || "", pets: inq.pets || "",
              message: inq.message || "", type: label
            })
          });
          emailed = res.ok;
        } catch (e) { emailed = false; }
      }
      const row = {
        property_id: inq.property_id || null, property_name: inq.property_name || null, kind: inq.kind,
        name: inq.name, email: inq.email, phone: inq.phone, move_in: inq.move_in || null,
        occupants: inq.occupants || null, pets: inq.pets || null, message: inq.message || null
      };
      if (!LIVE) {
        const s = demoLoad(); s.inquiries.unshift({ id: uid(), created_at: new Date().toISOString(), ...row }); demoSave(s);
      } else {
        const { error } = await sb.from("inquiries").insert(row);
        if (error) throw error;
      }
      return { emailed };
    },

    // ===== auth (admin) =====
    async getSession() {
      if (!LIVE) return sessionStorage.getItem("hc_demo_admin") ? { user: { email: "demo@hillcreekproperties.com" } } : null;
      const { data } = await sb.auth.getSession(); return data.session;
    },
    async signIn(email, password) {
      if (!LIVE) { sessionStorage.setItem("hc_demo_admin", "1"); return { user: { email: "demo@hillcreekproperties.com" } }; }
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) throw error; return data.session;
    },
    async signOut() {
      if (!LIVE) { sessionStorage.removeItem("hc_demo_admin"); return; }
      await sb.auth.signOut();
    },

    // ===== admin writes =====
    async setAvailable(id, isAvailable) {
      if (!LIVE) { const s = demoLoad(); const p = s.properties.find(x => x.id === id); if (p) p.is_available = isAvailable; demoSave(s); return; }
      const { error } = await sb.from("properties").update({ is_available: isAvailable }).eq("id", id);
      if (error) throw error;
    },
    async saveProperty(p) {
      const clean = { ...p }; delete clean.photos;
      if (!LIVE) {
        const s = demoLoad();
        if (!clean.id) { clean.id = uid(); s.properties.push(clean); }
        else { const i = s.properties.findIndex(x => x.id === clean.id); if (i >= 0) s.properties[i] = { ...s.properties[i], ...clean }; else s.properties.push(clean); }
        demoSave(s); return clean;
      }
      if (!clean.id) delete clean.id;
      const { data, error } = await sb.from("properties").upsert(clean).select().single();
      if (error) throw error; return data;
    },
    async deleteProperty(id) {
      if (!LIVE) { const s = demoLoad(); s.properties = s.properties.filter(x => x.id !== id); s.photos = s.photos.filter(x => x.property_id !== id); demoSave(s); return; }
      const { error } = await sb.from("properties").delete().eq("id", id); if (error) throw error;
    },
    async addPhotoUrl(propertyId, url) {
      if (!LIVE) { const s = demoLoad(); const n = s.photos.filter(p => p.property_id === propertyId).length; s.photos.push({ id: uid(), property_id: propertyId, url, caption: "", sort_order: n + 1 }); demoSave(s); return; }
      const { count } = await sb.from("property_photos").select("*", { count: "exact", head: true }).eq("property_id", propertyId);
      const { error } = await sb.from("property_photos").insert({ property_id: propertyId, url, sort_order: (count || 0) + 1 }); if (error) throw error;
    },
    async uploadPhoto(propertyId, file) {
      if (!LIVE) {
        const url = await shrinkImage(file, 1400, 0.8);
        return HC.addPhotoUrl(propertyId, url);
      }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${propertyId}/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.${ext}`;
      const { error } = await sb.storage.from("property-photos").upload(path, file, { cacheControl: "31536000", upsert: false });
      if (error) throw error;
      const { data } = sb.storage.from("property-photos").getPublicUrl(path);
      return HC.addPhotoUrl(propertyId, data.publicUrl);
    },
    async uploadCover(propertyId, file) {
      if (!LIVE) { const url = await shrinkImage(file, 1200, 0.8); const s = demoLoad(); const p = s.properties.find(x => x.id === propertyId); if (p) p.cover_url = url; demoSave(s); return url; }
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${propertyId}/cover-${Date.now()}.${ext}`;
      const { error } = await sb.storage.from("property-photos").upload(path, file, { cacheControl: "31536000" });
      if (error) throw error;
      const { data } = sb.storage.from("property-photos").getPublicUrl(path);
      const { error: e2 } = await sb.from("properties").update({ cover_url: data.publicUrl }).eq("id", propertyId);
      if (e2) throw e2; return data.publicUrl;
    },
    async deletePhoto(photoId) {
      if (!LIVE) { const s = demoLoad(); s.photos = s.photos.filter(x => x.id !== photoId); demoSave(s); return; }
      const { error } = await sb.from("property_photos").delete().eq("id", photoId); if (error) throw error;
    },
    async getInquiries() {
      if (!LIVE) return demoLoad().inquiries;
      const { data, error } = await sb.from("inquiries").select("*").order("created_at", { ascending: false });
      if (error) throw error; return data;
    },
    async deleteInquiry(id) {
      if (!LIVE) { const s = demoLoad(); s.inquiries = s.inquiries.filter(x => x.id !== id); demoSave(s); return; }
      const { error } = await sb.from("inquiries").delete().eq("id", id); if (error) throw error;
    },
    resetDemo() { localStorage.removeItem(DEMO_KEY); }
  };

  function shrinkImage(file, maxW, q) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const scale = Math.min(1, maxW / img.width);
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
        c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
        resolve(c.toDataURL("image/jpeg", q));
      };
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  }

  // ---------- shared formatting helpers ----------
  HC.fmt = {
    money: v => (v == null || v === "" ? null : "$" + Number(v).toLocaleString("en-US")),
    num: v => (v == null || v === "" ? "—" : Number(v).toLocaleString("en-US")),
    baths: v => (v == null || v === "" ? "—" : Number(v) % 1 === 0 ? String(Number(v)) : Number(v).toFixed(1)),
    date: v => { if (!v) return null; const d = new Date(v + (String(v).length === 10 ? "T12:00:00" : "")); return isNaN(d) ? v : d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }); },
    addr: p => [p.street, p.unit].filter(Boolean).join(", "),
    cityLine: p => `${p.city}, ${p.state || "OH"} ${p.zip || ""}`.trim(),
    typeLabel: t => (t === "duplex" ? "Duplex" : "Single-family home"),
    esc: s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]))
  };

  // ---------- shared UI bits (nav, footer, logo fallback) ----------
  HC.ui = {
    brand(cls) {
      return `<a class="brand ${cls || ""}" href="index.html">
        <img src="assets/img/logo.png" alt="${HC.fmt.esc(CFG.SITE_NAME)}" onerror="this.style.display='none';this.nextElementSibling.style.display='block'">
        <span class="wordmark" style="display:none">Hillcreek<small>Properties</small></span>
      </a>`;
    },
    nav() {
      return `<header class="nav"><div class="wrap">
        ${HC.ui.brand()}
        <button class="nav-toggle" aria-label="Menu" onclick="document.querySelector('.nav-links').classList.toggle('open')">&#9776;</button>
        <nav class="nav-links">
          <a href="index.html#available">Available Homes</a>
          <a href="index.html#homes">Our Homes</a>
          <a href="index.html#about">About</a>
          <a href="contact.html">Contact</a>
          <a href="${CFG.RENTREADI_URL}" target="_blank" rel="noopener">Tenant Portal</a>
          <a class="btn sm" href="apply.html">Apply</a>
        </nav>
      </div></header>`;
    },
    footer() {
      const y = new Date().getFullYear();
      return `<footer><div class="wrap">
        <div class="foot-grid">
          <div>${HC.ui.brand()}<p style="margin-top:16px;max-width:320px">Well-kept rental homes across ${HC.fmt.esc(CFG.REGION)}. We take care of the house so you can make it a home.</p></div>
          <div><h4>Explore</h4><a href="index.html#available">Available Homes</a><a href="index.html#homes">Our Homes</a><a href="index.html#about">About Us</a><a href="apply.html">Apply</a><a href="contact.html">Contact Us</a></div>
          <div><h4>Tenants</h4><a href="${CFG.RENTREADI_URL}" target="_blank" rel="noopener">Tenant Portal (RentReadi)</a><a href="${CFG.RENTREADI_URL}" target="_blank" rel="noopener">Maintenance Requests</a><a href="mailto:${CFG.CONTACT_EMAIL}">${CFG.CONTACT_EMAIL}</a></div>
        </div>
        <div class="foot-bottom"><span>&copy; ${y} ${HC.fmt.esc(CFG.SITE_NAME)}. All rights reserved. Equal Housing Opportunity.</span><span><a href="admin.html">Owner login</a></span></div>
      </div></footer>`;
    },
    reveal() {
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: .12 });
      document.querySelectorAll(".reveal").forEach(el => io.observe(el));
    }
  };

  window.HC = HC;
})();
