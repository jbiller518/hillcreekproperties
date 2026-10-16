// ============================================================
//  Sample data used in DEMO MODE (no Supabase configured).
//  Addresses are real; beds/baths/sqft/rent/descriptions are
//  PLACEHOLDERS — edit them in the admin dashboard.
// ============================================================
(function () {
  const U = (id, w) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w || 1400}&q=72`;

  // Cover photos (cozy exteriors + warm living spaces), one per home
  const EXT = [
    "photo-1572120360610-d971b9d7767c",
    "photo-1583608205776-bfd35f0d9f83",
    "photo-1570129477492-45c003edd2be",
    "photo-1616046229478-9901c5536a45",
    "photo-1505691938895-1758d7feb511",
    "photo-1522708323590-d24dbb6b0267",
    "photo-1600210492486-724fe5c67fb0",
    "photo-1583847268964-b28dc8f51f92",
    "photo-1502672260266-1c1ef2d93688",
    "photo-1586023492125-27b2c045efd7",
    "photo-1513694203232-719a280e022f",
    "photo-1616486338812-3dadae4b4ace",
    "photo-1560448204-e02f11c3d0e2"
  ];
  // Gallery interiors (kitchens, bedrooms, baths, living rooms)
  const INT = [
    "photo-1484154218962-a197022b5858",
    "photo-1556912172-45b7abe8b7e1",
    "photo-1565538810643-b5bdb714032a",
    "photo-1615874959474-d609969a20ed",
    "photo-1595526114035-0d45ed16cfbf",
    "photo-1600573472591-ee6b68d14c68",
    "photo-1588854337115-1c67d9247e4d",
    "photo-1600121848594-d8644e57abab",
    "photo-1598928506311-c55ded91a20c",
    "photo-1507652313519-d4e9174996dd",
    "photo-1540518614846-7eded433c457",
    "photo-1600607687939-ce8a6c25118c",
    "photo-1567767292278-a4f21aa2d36e",
    "photo-1568605114967-8130f3a36994"
  ];

  const base = [
    // ---------- Single-family homes ----------
    { slug: "parkgate",      name: "The Parkgate House",     street: "1760 Parkgate Road",      city: "Columbus",  zip: "43229", type: "single-family", beds: 3, baths: 1.5, sqft: 1380, rent: 1695, available: true,  available_date: "2026-11-01" },
    { slug: "bremen",        name: "The Bremen Cottage",     street: "3368 Bremen Street",      city: "Columbus",  zip: "43224", type: "single-family", beds: 3, baths: 1,   sqft: 1120, rent: null, available: false },
    { slug: "weber",         name: "The Weber House",        street: "1678 East Weber Road",    city: "Columbus",  zip: "43211", type: "single-family", beds: 2, baths: 1,   sqft: 980,  rent: null, available: false },
    { slug: "urana",         name: "The Urana Bungalow",     street: "1067 Urana Avenue",       city: "Columbus",  zip: "43224", type: "single-family", beds: 3, baths: 1,   sqft: 1200, rent: null, available: false },
    { slug: "collingwood",   name: "The Collingwood House",  street: "659 Collingwood Avenue",  city: "Whitehall", zip: "43213", type: "single-family", beds: 3, baths: 2,   sqft: 1450, rent: null, available: false },
    // ---------- Duplexes (one listing per side) ----------
    { slug: "hillcreek-3500", name: "Hillcreek Court · 3500", street: "3500 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: null, available: false },
    { slug: "hillcreek-3502", name: "Hillcreek Court · 3502", street: "3502 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: null, available: false },
    { slug: "hillcreek-3480", name: "Hillcreek Court · 3480", street: "3480 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: null, available: false },
    { slug: "hillcreek-3482", name: "Hillcreek Court · 3482", street: "3482 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: 1295, available: true, available_date: "2026-12-01" },
    { slug: "hillcreek-3477", name: "Hillcreek Court · 3477", street: "3477 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: null, available: false },
    { slug: "hillcreek-3479", name: "Hillcreek Court · 3479", street: "3479 Hillcreek Court",  city: "Columbus",  zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 900, rent: null, available: false },
    { slug: "beulah-a",       name: "Beulah Road · Unit A",   street: "3713 Beulah Road", unit: "Unit A", city: "Columbus", zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 850, rent: null, available: false },
    { slug: "beulah-b",       name: "Beulah Road · Unit B",   street: "3713 Beulah Road", unit: "Unit B", city: "Columbus", zip: "43224", type: "duplex", beds: 2, baths: 1, sqft: 850, rent: null, available: false }
  ];

  const descr = (p) => `${p.name} is a ${p.beds}-bedroom, ${p.baths}-bath ${p.type === "duplex" ? "duplex home" : "single-family home"} in ${p.city}, Ohio. Well kept and ready to be lived in, with a sensible layout and the everyday conveniences close by.\n\nThis description is a placeholder. Open the admin dashboard to replace it with the real details, photos, and pricing for this home.`;

  window.HC_SEED = base.map((p, i) => ({
    id: "seed-" + p.slug,
    slug: p.slug,
    name: p.name,
    street: p.street,
    unit: p.unit || "",
    city: p.city,
    state: "OH",
    zip: p.zip,
    type: p.type,
    beds: p.beds,
    baths: p.baths,
    sqft: p.sqft,
    rent: p.rent,
    deposit: p.rent,
    pets: "Cats and small dogs considered with pet deposit",
    available_date: p.available_date || null,
    lease_term: "12 months",
    description: descr(p),
    features: ["Washer & dryer hookups", "Off-street parking", "Private yard", "Central air", "Updated kitchen", "Hardwood floors"],
    is_available: p.available,
    cover_url: U(EXT[i % EXT.length], 1200),
    sort_order: i + 1,
    photos: [0, 1, 2, 3].map((k, j) => ({
      id: "seed-photo-" + p.slug + "-" + j,
      url: U(INT[(i * 3 + k) % INT.length], 1600),
      caption: "",
      sort_order: j + 1
    }))
  }));
})();
