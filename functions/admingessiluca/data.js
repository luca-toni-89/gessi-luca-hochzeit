function json(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: {
      "Cache-Control": "private, no-store, max-age=0",
      "Pragma": "no-cache",
      "X-Content-Type-Options": "nosniff",
      "X-Robots-Tag": "noindex, nofollow"
    }
  });
}

export async function onRequestGet(context) {
  var db = context.env.DB;
  if (!db) return json({ error: "Die Datenbank ist nicht konfiguriert." }, 503);

  try {
    var rsvpResult = await db.prepare(
      "SELECT id, contact_name AS contactName, attending, language, created_at AS createdAt " +
      "FROM rsvps ORDER BY created_at DESC, id DESC"
    ).all();

    var guestResult = await db.prepare(
      "SELECT id, rsvp_id AS rsvpId, first_name AS firstName, " +
      "last_name AS lastName, dietary_requirements AS dietaryRequirements " +
      "FROM guests ORDER BY created_at ASC, rowid ASC"
    ).all();

    var guestsByRsvp = Object.create(null);
    (guestResult.results || []).forEach(function (guest) {
      if (!guestsByRsvp[guest.rsvpId]) guestsByRsvp[guest.rsvpId] = [];
      guestsByRsvp[guest.rsvpId].push({
        id: guest.id,
        firstName: guest.firstName,
        lastName: guest.lastName,
        dietaryRequirements: guest.dietaryRequirements || ""
      });
    });

    var rsvps = (rsvpResult.results || []).map(function (rsvp) {
      return {
        id: rsvp.id,
        contactName: rsvp.contactName,
        attending: Number(rsvp.attending) === 1,
        language: rsvp.language,
        createdAt: rsvp.createdAt,
        guests: guestsByRsvp[rsvp.id] || []
      };
    });

    return json({ rsvps: rsvps });
  } catch (error) {
    console.error("Wedding admin data load failed", error);
    return json({ error: "Die Gästeliste konnte nicht geladen werden." }, 500);
  }
}