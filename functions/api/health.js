export async function onRequestGet() {
  return Response.json({ ok: true, service: "gessi-luca-hochzeit" }, {
    headers: { "Cache-Control": "no-store" },
  });
}
