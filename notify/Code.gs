/**
 * Mill Valley Finds — email notifications.
 * Paste this into a new Google Apps Script project (script.google.com) and deploy it as a web app.
 * The map posts here each time someone logs a find; this sends you an email from your own Gmail.
 */
const KEY  = "-qmKljFuDQuRoR7MmXHe9Ubg";                                // must match NOTIFY_KEY in config.js
const TO   = "nicholas@feltron.com";                 // where notifications go
const SITE = "https://feltron.github.io/mill-valley-finds/";
const MAX_PER_HOUR = 30;                             // stops a flood if the page is ever abused

function doPost(e) {
  let d;
  try { d = JSON.parse(e.postData.contents); } catch (err) { return done("bad request"); }
  if (d.key !== KEY) return done("not allowed");

  const cache = CacheService.getScriptCache();
  const sent = Number(cache.get("sent") || 0);
  if (sent >= MAX_PER_HOUR) return done("busy");
  cache.put("sent", String(sent + 1), 3600);

  const s = v => String(v == null ? "" : v).slice(0, 600);
  const h = v => s(v).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const lat = Number(d.lat), lon = Number(d.lon), hasLoc = d.lat != null && d.lon != null && isFinite(lat) && isFinite(lon);
  const link = /^https?:\/\//i.test(s(d.link)) ? s(d.link) : "";

  const rows = [
    ["Category", h(d.category)],
    ["Found by", h(d.finder)],
    ["Date found", h(d.foundOn)],
    ["Estimated age", h(d.age)],
    ["Where", h(d.place) + (hasLoc ? ' &nbsp;<a href="https://maps.google.com/?q=' + lat.toFixed(6) + "," + lon.toFixed(6) + '">' + lat.toFixed(5) + ", " + lon.toFixed(5) + "</a>" : "")],
    ["Photos", d.photos ? h(d.photos) : ""],
    ["Reference", link ? '<a href="' + h(link) + '">' + h(link) + "</a>" : ""],
    ["Notes", h(d.notes).replace(/\n/g, "<br>")],
  ].filter(r => r[1]);

  const html =
    '<div style="font:14px/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#1A2320">' +
    '<p style="margin:0 0 4px;color:#5D6A63;font-size:12px;letter-spacing:.08em;text-transform:uppercase">New find logged</p>' +
    '<h2 style="margin:0 0 12px;font-size:22px">' + h(d.name) + "</h2>" +
    '<table style="border-collapse:collapse">' +
    rows.map(r => '<tr><td style="padding:3px 14px 3px 0;color:#5D6A63;vertical-align:top;white-space:nowrap">' + r[0] + '</td><td style="padding:3px 0">' + r[1] + "</td></tr>").join("") +
    "</table>" +
    '<p style="margin:16px 0 0"><a href="' + SITE + '" style="color:#A8682A;font-weight:600">Open Mill Valley Finds</a></p></div>';

  Logger.log("Sending to " + TO + " (" + MailApp.getRemainingDailyQuota() + " emails left today)");
  MailApp.sendEmail({
    to: TO,
    name: "Mill Valley Finds",
    subject: "New find: " + s(d.name).slice(0, 80) + (d.finder ? " · " + s(d.finder).slice(0, 40) : ""),
    htmlBody: html,
  });
  return done("ok");
}

function done(t) { return ContentService.createTextOutput(t); }

/** Run this once from the editor to check that email works (it sends you a sample). */
function testEmail() {
  doPost({ postData: { contents: JSON.stringify({ key: KEY, name: "Test find: Barber dime", category: "Coin", finder: "Test", foundOn: "2026-11-07", age: "1906", place: "Old Mill Park", lat: 37.9056, lon: -122.5536, photos: 2, notes: "Sample email from the notification script." }) } });
}
