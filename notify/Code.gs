/**
 * Mill Valley Finds — email notifications.
 * Paste this into a new Google Apps Script project (script.google.com) and deploy it as a web app.
 * The map posts here each time someone logs a find, and GitHub posts here each time changes are pushed
 * to the site (.github/workflows/notify-deploy.yml). This sends the emails from your own Gmail.
 */
const KEY  = "-qmKljFuDQuRoR7MmXHe9Ubg";                                // must match NOTIFY_KEY in config.js
const TO   = "nicholas@feltron.com, hesontheroad@hotmail.com";   // where notifications go (comma-separated)
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
  if (d.type === "deploy") return deployEmail(d, s, h);
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

/** "The site was updated": one line per change pushed to GitHub. */
function deployEmail(d, s, h) {
  const commits = (Array.isArray(d.commits) ? d.commits : []).slice(0, 20);
  if (!commits.length) return done("nothing to report");
  const first = s(commits[0].message).split("\n")[0];
  const items = commits.map(c => {
    const lines = String(c.message || "").split("\n").filter(l => !/^(Co-Authored-By|Claude-Session|Signed-off-by):/i.test(l.trim())).map(l => l.slice(0, 300));
    const url = /^https:\/\/github\.com\//.test(s(c.url)) ? s(c.url) : "";
    return '<li style="margin:0 0 8px"><b>' + h(lines[0]) + "</b>" +
      (lines.slice(1).join(" ").trim() ? '<br><span style="color:#5D6A63">' + h(lines.slice(1).join(" ").trim().slice(0, 300)) + "</span>" : "") +
      (url ? ' <a href="' + h(url) + '" style="color:#5D6A63;font-size:12px">details</a>' : "") + "</li>";
  }).join("");
  const html =
    '<div style="font:14px/1.5 -apple-system,Helvetica,Arial,sans-serif;color:#1A2320">' +
    '<p style="margin:0 0 4px;color:#5D6A63;font-size:12px;letter-spacing:.08em;text-transform:uppercase">Site updated</p>' +
    '<h2 style="margin:0 0 12px;font-size:22px">Mill Valley Finds has new changes</h2>' +
    '<ul style="padding-left:18px;margin:0">' + items + "</ul>" +
    '<p style="margin:16px 0 0;color:#5D6A63">The changes go live within a few minutes. Reload the map (or do a hard reload) to see them.</p>' +
    '<p style="margin:12px 0 0"><a href="' + SITE + '" style="color:#A8682A;font-weight:600">Open Mill Valley Finds</a></p></div>';
  Logger.log("Deploy email to " + TO);
  MailApp.sendEmail({
    to: TO,
    name: "Mill Valley Finds",
    subject: "Site updated: " + first.slice(0, 80) + (commits.length > 1 ? " (+" + (commits.length - 1) + " more)" : ""),
    htmlBody: html,
  });
  return done("ok");
}

function done(t) { return ContentService.createTextOutput(t); }

/** Run from the editor to check the "site updated" email. */
function testDeployEmail() {
  doPost({ postData: { contents: JSON.stringify({ key: KEY, type: "deploy", commits: [{ message: "Test: site update notification\nThis is a sample of the email sent when changes are pushed.", url: "https://github.com/feltron/mill-valley-finds" }] }) } });
}

/** Run this once from the editor to check that email works (it sends you a sample). */
function testEmail() {
  doPost({ postData: { contents: JSON.stringify({ key: KEY, name: "Test find: Barber dime", category: "Coin", finder: "Test", foundOn: "2026-11-07", age: "1906", place: "Old Mill Park", lat: 37.9056, lon: -122.5536, photos: 2, notes: "Sample email from the notification script." }) } });
}
