function json(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function text(value, max) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env;

  if (!env.DB) return json({ error: "RSVP storage is not configured." }, 503);

  var payload;
  try {
    payload = await request.json();
  } catch (error) {
    return json({ error: "Invalid JSON." }, 400);
  }

  var contactName = text(payload.contactName, 120);
  var language = payload.language === "it" ? "it" : "de";
  var attending = payload.attending === true;
  var guests = Array.isArray(payload.guests) ? payload.guests.slice(0, 10) : [];

  if (attending && guests.length === 0) return json({ error: "At least one guest is required." }, 400);
  if (!attending && !contactName) return json({ error: "Contact name is required." }, 400);

  var normalizedGuests = [];
  if (attending) {
    for (var i = 0; i < guests.length; i += 1) {
      var firstName = text(guests[i] && guests[i].firstName, 80);
      var lastName = text(guests[i] && guests[i].lastName, 80);
      if (!firstName || !lastName) return json({ error: "Guest name is incomplete." }, 400);
      normalizedGuests.push({ firstName: firstName, lastName: lastName });
    }
  }

  var rsvpId = crypto.randomUUID();
  var statements = [
    env.DB.prepare(
      "INSERT INTO rsvps (id, contact_name, contact_email, attending, language, notes) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(rsvpId, attending ? normalizedGuests[0].firstName + " " + normalizedGuests[0].lastName : contactName, null, attending ? 1 : 0, language, null)
  ];

  normalizedGuests.forEach(function (guest) {
    statements.push(
      env.DB.prepare(
        "INSERT INTO guests (id, rsvp_id, first_name, last_name, dietary_requirements) VALUES (?, ?, ?, ?, ?)"
      ).bind(crypto.randomUUID(), rsvpId, guest.firstName, guest.lastName, null)
    );
  });

  try {
    await env.DB.batch(statements);
  } catch (error) {
    console.error("RSVP write failed", error);
    return json({ error: "Could not save RSVP." }, 500);
  }

  return json({ ok: true, id: rsvpId }, 201);
}

export async function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
