function json(data, status) {
  return Response.json(data, {
    status: status || 200,
    headers: {
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff"
    }
  });
}

function safeName(name) {
  return String(name || "photo")
    .replace(/[\\/]/g, "_")
    .replace(/[^a-zA-Z0-9._ -]/g, "")
    .slice(0, 120) || "photo";
}

function extensionFor(file) {
  var name = String(file.name || "");
  var match = name.match(/\.([a-zA-Z0-9]{2,5})$/);
  if (match) return match[1].toLowerCase();
  var types = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
    "image/heif": "heif"
  };
  return types[file.type] || "jpg";
}

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env;

  // 10 July 2027, 00:00 in Switzerland (CEST, UTC+02:00).
  if (Date.now() < Date.parse("2027-07-09T22:00:00Z")) {
    return json({ error: "Photo uploads open on 10 July 2027." }, 403);
  }

  if (!env.PHOTOS) return json({ error: "Photo storage is not configured." }, 503);

  var form;
  try {
    form = await request.formData();
  } catch (error) {
    return json({ error: "Invalid form data." }, 400);
  }

  var file = form.get("photo");
  if (!file || typeof file.arrayBuffer !== "function") return json({ error: "Photo is required." }, 400);

  var maxBytes = 15 * 1024 * 1024;
  if (file.size > maxBytes) return json({ error: "Photo is too large." }, 413);

  var ext = extensionFor(file);
  var allowedExtensions = ["jpg", "jpeg", "png", "webp", "heic", "heif"];
  if (allowedExtensions.indexOf(ext) === -1) return json({ error: "Unsupported file type." }, 415);

  var allowedMime = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif", ""];
  if (allowedMime.indexOf(file.type) === -1) return json({ error: "Unsupported content type." }, 415);

  var id = crypto.randomUUID();
  var day = new Date().toISOString().slice(0, 10);
  var key = "guest-uploads/" + day + "/" + id + "." + ext;
  var original = safeName(file.name);

  try {
    await env.PHOTOS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
      customMetadata: { originalFilename: original }
    });

    if (env.DB) {
      await env.DB.prepare(
        "INSERT INTO photo_uploads (id, object_key, original_filename, content_type) VALUES (?, ?, ?, ?)"
      ).bind(id, key, original, file.type || "application/octet-stream").run();
    }
  } catch (error) {
    console.error("Photo upload failed", error);
    try { await env.PHOTOS.delete(key); } catch (cleanupError) {}
    return json({ error: "Could not save photo." }, 500);
  }

  return json({ ok: true, id: id }, 201);
}

export async function onRequestGet() {
  return json({ error: "Method not allowed." }, 405);
}
