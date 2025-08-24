// listings controller
const { admin, db } = require("../config/firebase");
const { badRequest } = require("../utils/httpErrors");
const { sendMail, isMailerConfigured } = require("../utils/mailer");

function escapeHtml(str = "") {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

exports.create = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw badRequest("Unauthenticated");

    const b = req.body || {};

    // Basic validation
    const missing = [];
    if (!b.category) missing.push("category");
    if (!b.scope) missing.push("scope");
    if (!b.city) missing.push("city");
    if (!b.country) missing.push("country");
    if ((Number(b.seats) || 0) <= 0) missing.push("seats");
    if (missing.length) throw badRequest("Missing required fields", { missing });

    // Normalizers
    const S = (v) => (typeof v === "string" ? v.trim() : v);
    const I = (v, min = 0, max = Number.MAX_SAFE_INTEGER) => {
      const n = Number(v); return Number.isFinite(n) ? Math.min(Math.max(n, min), max) : 0;
    };
    const F = (v) => (v === "" || v == null ? null : Number(v));
    const money = (v) => {
      if (v === undefined || v === null || v === "") return null;
      const n = Number(String(v).replace(/[^0-9.]/g, ""));
      return Number.isFinite(n) ? n : null;
    };
    const obj = (v) => {
      if (!v) return {};
      if (typeof v === "object") return v;
      try { return JSON.parse(v); } catch { return {}; }
    };

    const doc = {
      ownerId: uid,
      category: S(b.category) || null,
      scope: S(b.scope) || null,

      // location
      venue: S(b.venue) || null,
      address: S(b.address) || null,
      address2: S(b.address2) || null,
      district: S(b.district) || null,
      city: S(b.city) || null,
      region: S(b.region) || null,
      zip: S(b.zip) || null,
      country: S(b.country) || null,
      lat: F(b.lat),
      lng: F(b.lng),
      showApprox: b.showApprox === true || b.showApprox === "true" || b.showApprox === "1",

      // basics
      seats: I(b.seats, 1, 9999),
      rooms: I(b.rooms, 0, 999),
      privateRooms: I(b.privateRooms, 0, 999),
      minHours: I(b.minHours, 0, 24),
      hasLocks: b.hasLocks === true || b.hasLocks === "true" || b.hasLocks === "1",

      // description
      shortDesc: S(b.shortDesc) || "",
      longDesc: S(b.longDesc) || "",

      // connectivity
      wifiMbps: F(b.wifiMbps),
      outletsPerSeat: F(b.outletsPerSeat),
      noiseLevel: S(b.noiseLevel) || null,

      // pricing
      currency: S((b.currency || "PHP")).toUpperCase(),
      priceSeatDay: money(b.priceSeatDay),
      priceSeatHour: money(b.priceSeatHour),
      priceRoomHour: money(b.priceRoomHour),
      priceRoomDay: money(b.priceRoomDay),
      priceWholeDay: money(b.priceWholeDay),
      priceWholeMonth: money(b.priceWholeMonth),
      serviceFee: money(b.serviceFee),
      cleaningFee: money(b.cleaningFee),

      // objects
      amenities: obj(b.amenities),
      accessibility: obj(b.accessibility),
      parking: S(b.parking) || "none",

      photos: [],
      coverIndex: I(b.coverIndex, 0),

      // status / meta
      status: "pending_review",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    const ref = await db.collection("listings").add(doc);

    // Optional: quick “my listings” index
    await db.collection("users").doc(uid).collection("listings").doc(ref.id).set({
      listingId: ref.id,
      status: doc.status,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    try {
      if (isMailerConfigured()) {
        // get user email & name from Auth
        const user = await admin.auth().getUser(uid).catch(() => null);
        const to = user?.email;
        if (to) {
          const appOrigin  = process.env.APP_ORIGIN || process.env.FRONTEND_ORIGIN || "";
          const logoUrl    = process.env.MAIL_LOGO_URL || ""; // optional
          const listingUrl = appOrigin ? `${appOrigin}/owner/listings/${ref.id}/overview` : null;

          const displayName = user?.displayName || "there";
          const subject = "Your listing was submitted for review";

          // plain-text fallback (kept short and readable)
          const text = [
            `Hi ${displayName},`,
            ``,
            `Thanks for submitting your listing — it is now pending review.`,
            ``,
            `Title: ${doc.shortDesc || "Untitled listing"}`,
            `Location: ${[doc.city, doc.region, doc.country].filter(Boolean).join(", ") || "—"}`,
            `Category: ${doc.category || "—"} • ${doc.scope || "—"}`,
            `Seats: ${doc.seats}`,
            `Listing ID: ${ref.id}`,
            listingUrl ? `Manage: ${listingUrl}` : "",
          ].filter(Boolean).join("\n");

          // HTML version
          const html = `
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background:#f8fafc;padding:24px 0;">
              <tr>
                <td align="center">
                  <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:100%;background:#ffffff;border:1px solid #e2e8f0;border-radius:16px;overflow:hidden;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;color:#0f172a;">
                    <!-- Header -->
                    <tr>
                      <td style="padding:16px 20px;border-bottom:1px solid #e2e8f0;background:#0b1324;">
                        <table width="100%" role="presentation" cellspacing="0" cellpadding="0">
                          <tr>
                            <td align="left" style="vertical-align:middle;">
                              ${logoUrl
                                ? `<img src="${escapeHtml(logoUrl)}" alt="FlexiDesk" height="24" style="display:block;border:0;max-height:24px;">`
                                : `<div style="font-weight:700;color:#ffffff;font-size:16px;letter-spacing:.2px;">FlexiDesk</div>`
                              }
                            </td>
                            <td align="right" style="vertical-align:middle;">
                              <span style="display:inline-block;padding:4px 10px;border-radius:999px;background:#fef3c7;color:#92400e;font-size:12px;line-height:1;">Pending review</span>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- Hero -->
                    <tr>
                      <td style="padding:24px 24px 0 24px;">
                        <div style="font-size:20px;font-weight:700;margin:0 0 6px 0;">Listing submitted 🎉</div>
                        <p style="margin:0 0 16px 0;font-size:14px;color:#334155;">
                          Hi ${escapeHtml(displayName)}, thanks for submitting your listing. Our team will review it shortly.
                        </p>
                      </td>
                    </tr>

                    <!-- Card with details -->
                    <tr>
                      <td style="padding:0 24px 8px 24px;">
                        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border:1px solid #e2e8f0;border-radius:12px;">
                          <tr>
                            <td style="padding:14px 16px;">
                              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;">
                                <tr>
                                  <td width="140" style="color:#64748b;padding:6px 0;">Title</td>
                                  <td style="padding:6px 0;font-weight:600;">${escapeHtml(doc.shortDesc || "Untitled listing")}</td>
                                </tr>
                                <tr>
                                  <td width="140" style="color:#64748b;padding:6px 0;">Location</td>
                                  <td style="padding:6px 0;">${escapeHtml(([doc.city, doc.region, doc.country].filter(Boolean).join(", ")) || "—")}</td>
                                </tr>
                                <tr>
                                  <td width="140" style="color:#64748b;padding:6px 0;">Category</td>
                                  <td style="padding:6px 0;">${escapeHtml(doc.category || "—")} • ${escapeHtml(doc.scope || "—")}</td>
                                </tr>
                                <tr>
                                  <td width="140" style="color:#64748b;padding:6px 0;">Seats</td>
                                  <td style="padding:6px 0;">${Number(doc.seats || 0)}</td>
                                </tr>
                                <tr>
                                  <td width="140" style="color:#64748b;padding:6px 0;">Listing ID</td>
                                  <td style="padding:6px 0;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;color:#0f172a;">${ref.id}</td>
                                </tr>
                              </table>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>

                    <!-- CTA -->
                    ${listingUrl ? `
                    <tr>
                      <td style="padding:8px 24px 24px 24px;">
                        <a href="${escapeHtml(listingUrl)}"
                          style="display:inline-block;background:#0b1324;color:#ffffff;text-decoration:none;font-weight:600;border-radius:10px;padding:10px 16px;font-size:14px;">
                          Go to listing details
                        </a>
                        <span style="font-size:12px;color:#64748b;margin-left:8px;">You can add photos and complete more details there.</span>
                      </td>
                    </tr>` : ""}

                    <!-- Footer -->
                    <tr>
                      <td style="padding:16px 24px 22px 24px;border-top:1px solid #e2e8f0;">
                        <div style="font-size:12px;color:#64748b;">
                          You’ll receive another email once it’s approved and published.<br>
                          If you didn’t create this listing, please ignore this message.
                        </div>
                      </td>
                    </tr>
                  </table>

                  <div style="font-size:11px;color:#94a3b8;margin-top:8px;font-family:system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;">
                    © ${new Date().getFullYear()} FlexiDesk
                  </div>
                </td>
              </tr>
            </table>
          `;


          await sendMail({ to, subject, text, html });
        } else {
          console.warn(`[mailer] No email on user ${uid}; skipping email.`);
        }
      } else {
        console.warn("[mailer] SMTP not configured; skipping email.");
      }
    } catch (mailErr) {
      console.error("[mailer] Failed to send submission email:", mailErr);
    }

    res
      .status(201)
      .set("Location", `/api/items/${ref.id}`)
      .json({ id: ref.id, status: doc.status });
  } catch (e) {
    return next(e);
  }
};


exports.listMine = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    if (!uid) throw badRequest("Unauthenticated");

    // Inputs
    const rawLimit = parseInt(req.query.limit || "20", 10);
    const limit = Math.max(1, Math.min(rawLimit, 100)); // cap to keep memory sane
    const cursorId = req.query.cursor ? String(req.query.cursor) : null;
    const statusParam = String(req.query.status || "").trim().toLowerCase(); // optional

    // No composite index needed: single-field equality only
    const snap = await db.collection("listings")
      .where("ownerId", "==", uid)
      .get();

    // Normalize docs
    const toIso = (ts) => (ts && typeof ts.toDate === "function" ? ts.toDate().toISOString() : null);
    let items = snap.docs.map(d => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        createdAt: toIso(data.createdAt),
        updatedAt: toIso(data.updatedAt),
      };
    });

    // Optional filter (done in memory to avoid composite index)
    if (statusParam) {
      items = items.filter(it => String(it.status || "").toLowerCase() === statusParam);
    }

    // Sort newest first (in memory)
    items.sort((a, b) => {
      const ta = new Date(a.updatedAt || a.createdAt || 0).getTime();
      const tb = new Date(b.updatedAt || b.createdAt || 0).getTime();
      return tb - ta;
    });

    // Cursor slicing (also in memory)
    let start = 0;
    if (cursorId) {
      const idx = items.findIndex(it => it.id === cursorId);
      if (idx !== -1) start = idx + 1;
    }
    const page = items.slice(start, start + limit);
    const nextCursor = (start + limit < items.length) ? items[start + limit - 1].id : null;

    res.json({ items: page, nextCursor });
  } catch (e) {
    next(e);
  }
};

exports.getOne = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;
    const snap = await db.collection("listings").doc(id).get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });
    const data = snap.data();
    if (data.ownerId !== uid) return res.status(403).json({ error: "forbidden" });

    // Normalize timestamps to ISO
    const toIso = (t) =>
      t && t.toDate ? t.toDate().toISOString() : (typeof t === "string" ? t : null);

    res.json({
      id: snap.id,
      ...data,
      createdAt: toIso(data.createdAt),
      updatedAt: toIso(data.updatedAt),
    });
  } catch (e) {
    next(e);
  }
};

//for host cancellation of listing
exports.updateStatus = async (req, res, next) => {
  try {
    const uid = req.user?.uid;
    const { id } = req.params;
    const { status } = req.body || {};
    const allowed = new Set(["draft", "pending_review", "published", "rejected"]);
    if (!allowed.has(status)) return res.status(400).json({ error: "bad_status" });

    const ref = db.collection("listings").doc(id);
    const snap = await ref.get();
    if (!snap.exists) return res.status(404).json({ error: "not_found" });
    const data = snap.data();
    if (data.ownerId !== uid) return res.status(403).json({ error: "forbidden" });

    await ref.update({
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    const updated = await ref.get();
    const d = updated.data();
    res.json({
      id,
      status: d.status,
      updatedAt: d.updatedAt?.toDate ? d.updatedAt.toDate().toISOString() : null,
    });
  } catch (e) {
    next(e);
  }
};

