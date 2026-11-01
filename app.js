(function () {
  "use strict";
  var CFG = window.PLUTONIUM_CONFIG || {};
  var EP = CFG.endpoints || {};
  var LIVE = !!CFG.useServer;
  var ICON = "assets/logo-icon.png";
  var WORD = "assets/logo-wordmark.png";

  /* ---------- small helpers ---------- */
  var mem = {};
  var store = {
    get: function (k, d) {
      try { var v = localStorage.getItem(k); if (v !== null) return JSON.parse(v); } catch (e) {}
      return Object.prototype.hasOwnProperty.call(mem, k) ? mem[k] : d;
    },
    set: function (k, v) {
      mem[k] = v;
      try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {}
    }
  };
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; });
  }
  function $(id) { return document.getElementById(id); }
  function str(v) { return (typeof v === "string" || typeof v === "number") ? String(v) : ""; }
  function norm(s) { return String(s).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function pick(o, keys) {
    if (!o || typeof o !== "object") return null;
    for (var i = 0; i < keys.length; i++) { var v = o[keys[i]]; if (v !== undefined && v !== null && v !== "") return v; }
    return null;
  }
  function safeUrl(u) {
    u = str(u);
    if (!/^(https?:)?\/\//.test(u) && !/^\//.test(u) && !/^assets\//.test(u)) return "";
    return u.replace(/['"()\s<>\\]/g, function (c) { return "%" + ("0" + c.charCodeAt(0).toString(16)).slice(-2); });
  }
  function imgUrl(v) {
    var s = str(v);
    if (!s) return "";
    if (/^https?:\/\//.test(s)) return s;
    if (CFG.imageBase) return String(CFG.imageBase).replace(/\/$/, "") + "/" + s.replace(/^\//, "");
    return "";
  }
  function wantLive(k) { return LIVE && !!EP[k]; }

  /* ---------- icons ---------- */
  var I = {
    share: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M14 4v4.5c-6 .4-10 3.6-11 9.5 2.4-3.7 5.9-5 11-5v4.5L22 11 14 4Z"/></svg>',
    thumb: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M1 21h4V9H1v12zm22-11c0-1.1-.9-2-2-2h-6.31l.95-4.57.03-.32c0-.41-.17-.79-.44-1.06L14.17 1 7.59 7.59C7.22 7.95 7 8.45 7 9v10c0 1.1.9 2 2 2h9c.83 0 1.54-.5 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>',
    back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><path d="m15 5-7 7 7 7"/></svg>',
    chev: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 5 7 7-7 7"/></svg>',
    cam: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9 3 7.2 5H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-3.2L15 3H9Zm3 14.5a4.5 4.5 0 1 1 0-9 4.5 4.5 0 0 1 0 9Z"/></svg>',
    cal: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 2v2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2V2h-2v2H9V2H7Zm-2 8h14v10H5V10Z"/></svg>',
    monitor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="4" width="20" height="13" rx="2"/><path d="M8 21h8M12 17v4"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="12" height="20" rx="2"/><path d="M11 18h2"/></svg>'
  };

  /* ---------- data: presets, or live from the servers ---------- */
  var PRESET_ROOMS = [
    { id: "hub", name: "^PlutoniumHub", by: "@Plutonium", cap: 40, tags: ["hangout", "art", "games", "walkvr", "teleportvr", "pickup"] },
    { id: "builders", name: "^BuildersLab", by: "@Plutonium", cap: 20, tags: ["build", "art", "teleportvr", "junior"] },
    { id: "arcade", name: "^ArcadeRow", by: "@Plutonium", cap: 30, tags: ["games", "screen", "hangout", "pickup"] },
    { id: "workshop", name: "^WorkshopOne", by: "@Plutonium", cap: 16, tags: ["build", "walkvr", "screen"] },
    { id: "lounge", name: "^TheLounge", by: "@Plutonium", cap: 40, tags: ["hangout", "teleportvr", "junior"] },
    { id: "studio", name: "^RoomSix", by: "@creator", cap: 12, tags: ["art", "hangout"] },
    { id: "garden", name: "^RoomSeven", by: "@creator", cap: 24, tags: ["walkvr", "hangout", "junior"] },
    { id: "vault", name: "^RoomEight", by: "@creator", cap: 8, tags: ["games", "pickup"] }
  ];
  var feedRooms = ["hub", "builders", "arcade"];
  var PRESET_PHOTOS = 10;

  var rooms = wantLive("rooms") ? [] : PRESET_ROOMS.slice();
  var roomBy = {};
  var livePhotos = wantLive("photos") ? [] : null;   // null = use presets
  var livePlayers = wantLive("players") ? [] : null; // null = use presets
  var loadedOnce = !LIVE;
  function indexRooms() { roomBy = {}; rooms.forEach(function (r) { roomBy[r.id] = r; }); }
  indexRooms();

  function players() {
    var seen = {}, list = [];
    function add(name) {
      var slug = norm(name);
      if (!slug || seen[slug]) return;
      seen[slug] = 1; list.push({ name: name, slug: slug });
    }
    if (livePlayers) livePlayers.forEach(function (p) { add(p.name); });
    rooms.forEach(function (r) { add(r.by); });
    if (!livePlayers) add("@username");
    if (user) add("@" + user);
    return list;
  }

  /* photos: { key, url, user, roomId, cheers, created } */
  function photoObj(key) {
    if (livePhotos) {
      for (var i = 0; i < livePhotos.length; i++) if (livePhotos[i].key === key) return livePhotos[i];
      return null;
    }
    var m = key.match(/^([a-z0-9]+)-(\d+)$/);
    if (!m) return null;
    var n = +m[2], rid = m[1] === "feed" ? feedRooms[(n - 1) % 3] : m[1];
    if (!roomBy[rid] || n < 1 || n > 99) return null;
    return { key: key, url: "", user: "@username", roomId: rid, cheers: 0, n: n };
  }
  function feedPhotos() {
    if (livePhotos) return livePhotos.slice(0, 6);
    return [1, 2, 3].map(function (n) { return photoObj("feed-" + n); });
  }
  function roomPhotos(id) {
    if (livePhotos) return livePhotos.filter(function (p) { return p.roomId === id; });
    var a = [];
    for (var n = 1; n <= PRESET_PHOTOS; n++) a.push(photoObj(id + "-" + n));
    return a;
  }
  function roomNameOf(p) { return roomBy[p.roomId] ? roomBy[p.roomId].name : "^Room"; }

  /* ---------- turning server replies into site data ---------- */
  function asList(j) {
    if (Array.isArray(j)) return j;
    if (j && typeof j === "object") {
      var ks = ["data", "Data", "items", "Items", "results", "Results", "rooms", "Rooms", "players", "Players", "photos", "Photos", "images", "Images"];
      for (var i = 0; i < ks.length; i++) if (Array.isArray(j[ks[i]])) return j[ks[i]];
    }
    return [];
  }
  function whoName(v) {
    if (v && typeof v === "object") v = pick(v, ["username", "Username", "userName", "name", "Name", "displayName", "DisplayName", "accountName", "AccountName"]);
    var s = str(v).replace(/^@/, "");
    return s ? "@" + s : "";
  }
  function fmtDate(v) {
    if (v === null || v === undefined || v === "") return "—";
    var d = new Date(v);
    if (isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
  }
  function normRoom(r) {
    var id = norm(str(pick(r, ["id", "Id", "ID", "roomId", "RoomId"])));
    var name = str(pick(r, ["name", "Name", "roomName", "RoomName"]));
    if (!id || !name) return null;
    var tagsRaw = pick(r, ["tags", "Tags"]), tags = [];
    if (Array.isArray(tagsRaw)) tags = tagsRaw.map(function (t) { return typeof t === "object" ? str(pick(t, ["tag", "Tag", "name", "Name"])) : str(t); });
    else if (typeof tagsRaw === "string") tags = tagsRaw.split(/[,\s]+/);
    tags = tags.map(function (t) { return t.replace(/^#/, "").toLowerCase(); }).filter(Boolean);
    var imgs = [];
    var imgRaw = pick(r, ["images", "Images", "imageUrls", "ImageUrls"]);
    if (Array.isArray(imgRaw)) imgs = imgRaw.map(function (x) { return imgUrl(typeof x === "object" ? pick(x, ["url", "Url", "imageUrl", "ImageUrl", "imageName", "ImageName"]) : x); }).filter(Boolean);
    if (!imgs.length) { var one = imgUrl(pick(r, ["imageUrl", "ImageUrl", "imageName", "ImageName", "thumbnailUrl", "ThumbnailUrl", "image", "Image"])); if (one) imgs = [one]; }
    var cap = Number(pick(r, ["maxPlayers", "MaxPlayers", "capacity", "Capacity", "maxPlayerCalculationMode"]));
    var visits = Number(pick(r, ["visitCount", "VisitCount", "visits", "Visits", "totalVisits", "TotalVisits"]));
    return {
      id: id,
      name: "^" + name.replace(/^\^/, ""),
      by: whoName(pick(r, ["creatorName", "CreatorName", "creator", "Creator", "creatorAccountName", "CreatorAccountName", "ownerName", "OwnerName", "owner", "Owner"])) || "@unknown",
      cap: isFinite(cap) && cap > 0 ? cap : "—",
      visits: isFinite(visits) ? visits : 0,
      published: fmtDate(pick(r, ["publishedAt", "PublishedAt", "createdAt", "CreatedAt", "createdDate", "CreatedDate"])),
      desc: str(pick(r, ["description", "Description"])),
      tags: tags,
      images: imgs
    };
  }
  function normPlayer(r) {
    var name = whoName(typeof r === "string" ? r : pick(r, ["username", "Username", "userName", "UserName", "name", "Name", "accountName", "AccountName", "displayName", "DisplayName"]));
    return name ? { name: name } : null;
  }
  function normPhoto(r, i) {
    var id = norm(str(pick(r, ["id", "Id", "ID", "photoId", "PhotoId", "imageId", "ImageId"])));
    if (!id) return null;
    var t = Date.parse(str(pick(r, ["createdAt", "CreatedAt", "created", "Created", "date", "Date", "timestamp", "Timestamp"])));
    return {
      key: "p" + id,
      url: imgUrl(pick(r, ["imageUrl", "ImageUrl", "url", "Url", "imageName", "ImageName", "image", "Image"])),
      user: whoName(pick(r, ["playerName", "PlayerName", "username", "Username", "userName", "user", "User", "creatorName", "CreatorName", "player", "Player"])) || "@player",
      roomId: norm(str(pick(r, ["roomId", "RoomId", "room", "Room"]))),
      cheers: Math.max(0, Number(pick(r, ["cheerCount", "CheerCount", "cheers", "Cheers"])) || 0),
      created: isNaN(t) ? 0 : t,
      order: i
    };
  }

  /* ---------- talking to the servers ---------- */
  var token = null;
  try { token = sessionStorage.getItem("pl-token"); } catch (e) {}
  function svcUrl(service, path) {
    var sub = (CFG.services && CFG.services[service]) || service;
    if (CFG.useProxy) return "/api/" + sub + path;
    return "https://" + sub + "." + CFG.domain + path;
  }
  function apiGet(ep) {
    var h = { Accept: "application/json" };
    if (token) h.Authorization = "Bearer " + token;
    return fetch(svcUrl(ep.service, ep.path), { headers: h }).then(function (r) {
      if (!r.ok) throw new Error("HTTP " + r.status);
      return r.json();
    });
  }
  function serverLogin(name, pass) {
    var L = CFG.login || {}, body = new URLSearchParams();
    body.set("grant_type", L.grantType || "password");
    body.set(L.usernameField || "username", name);
    body.set(L.passwordField || "password", pass);
    if (L.clientId) body.set("client_id", L.clientId);
    if (L.scope) body.set("scope", L.scope);
    var extra = L.extraFields || {};
    Object.keys(extra).forEach(function (k) { body.set(k, extra[k]); });
    return fetch(svcUrl("auth", EP.token || "/connect/token"), {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
      body: body.toString()
    }).then(function (r) {
      return r.text().then(function (t) {
        var j = {};
        try { j = JSON.parse(t); } catch (e) {}
        if (!r.ok || !j.access_token) throw new Error(str(j.error_description || j.error || j.message) || "Login failed (" + r.status + ")");
        return j;
      });
    });
  }

  var lastSig = "", lastOk = null;
  function busy() {
    var el = document.activeElement, tag = el && el.tagName;
    return !$("modal").hidden || !$("search").hidden || tag === "TEXTAREA" || tag === "INPUT";
  }
  function setNote(text) { var n = $("foot-note"); if (n) n.textContent = text; }
  function refresh() {
    if (!LIVE) return;
    var jobs = [];
    if (wantLive("rooms")) jobs.push(apiGet(EP.rooms).then(function (j) { return { k: "rooms", v: asList(j).map(normRoom).filter(Boolean) }; }));
    if (wantLive("players")) jobs.push(apiGet(EP.players).then(function (j) { return { k: "players", v: asList(j).map(normPlayer).filter(Boolean) }; }));
    if (wantLive("photos")) jobs.push(apiGet(EP.photos).then(function (j) {
      var l = asList(j).map(normPhoto).filter(Boolean);
      l.sort(function (a, b) { return (b.created - a.created) || (a.order - b.order); });
      return { k: "photos", v: l };
    }));
    if (!jobs.length) { loadedOnce = true; setNote("Connected to " + CFG.domain + ". No data endpoints are set in config.js yet."); return; }
    var failed = false;
    Promise.all(jobs.map(function (p) { return p.catch(function () { failed = true; return null; }); })).then(function (res) {
      res.forEach(function (x) {
        if (!x) return;
        if (x.k === "rooms") { rooms = x.v; indexRooms(); }
        else if (x.k === "players") livePlayers = x.v;
        else if (x.k === "photos") livePhotos = x.v;
      });
      var first = !loadedOnce;
      loadedOnce = true;
      var sig = JSON.stringify([rooms, livePhotos, livePlayers]);
      setNote(failed ? "Can't reach the servers right now. Showing the last data." : "Live from " + CFG.domain + ". Updated " + new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) + ".");
      if ((sig !== lastSig || first) && !busy()) { lastSig = sig; route(); }
      else if (sig !== lastSig) { lastSig = ""; }
    });
  }

  /* ---------- state ---------- */
  var user = store.get("pl-user", null);
  if (LIVE && !token) user = null; // a live session needs a real token
  var homeView = "feed";
  var rs = { id: "", thumb: 0, tab: "photos", ptab: "popular", pick: 0 };
  var lastKey = "";
  var lastFocus = null;

  function cheerCount(p) { return (p.cheers || 0) + (store.get("pl-cheers", {})[p.key] ? 1 : 0); }
  function cheerText(n) { return n + (n === 1 ? " cheer" : " cheers"); }

  var toastTimer;
  function toast(msg) {
    var t = $("toast");
    t.textContent = msg; t.hidden = false;
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.hidden = true; }, 2800);
  }

  /* ---------- auth ---------- */
  function renderAuth() {
    $("auth").innerHTML = user
      ? '<span class="me"><span class="ava" aria-hidden="true">' + esc(user.charAt(0)) + '</span><b>@' + esc(user) + '</b><button class="btn" type="button" data-act="logout">Log out</button></span>'
      : '<button class="btn" type="button" data-act="login">Login</button>';
  }
  function openLogin(msg) {
    $("login-msg").textContent = msg || "Log in to Plutonium to cheer photos and leave comments.";
    $("login-err").textContent = "";
    if (LIVE) $("login-note").textContent = "Use your Plutonium account.";
    lastFocus = document.activeElement;
    $("modal").hidden = false;
    $("login-user").focus();
  }
  function closeLogin() {
    $("modal").hidden = true;
    if (lastFocus && lastFocus.focus) { try { lastFocus.focus(); } catch (e) {} }
  }
  function needLogin(msg) {
    if (user) return false;
    openLogin(msg);
    return true;
  }
  function finishLogin(name) {
    user = name; store.set("pl-user", name);
    $("login-pass").value = ""; $("login-user").value = "";
    closeLogin(); renderAuth(); route(); toast("Logged in as @" + name);
  }

  /* ---------- views: home ---------- */
  function roomCard(r) {
    var pic = r.images && r.images.length
      ? '<div class="pic"><img class="cover" src="' + esc(r.images[0]) + '" alt="" loading="lazy"></div>'
      : '<div class="pic"><img src="' + ICON + '" alt=""></div>';
    return '<a class="room" href="#room-' + r.id + '">' + pic + '<div class="nm"><b>' + esc(r.name) + "</b><span>" + esc(r.by) + "</span></div></a>";
  }
  function photoFace(p, label) {
    return p.url
      ? '<img class="cover" src="' + esc(p.url) + '" alt="' + esc(label || "") + '" loading="lazy">'
      : '<img src="' + ICON + '" alt=""><span>No photo yet. Click to open.</span>';
  }
  function feedPost(p) {
    var c = cheerCount(p), rid = p.roomId;
    return '<article class="post"><div class="post-top"><div class="ava"><img src="' + ICON + '" alt=""></div>' +
      '<div class="who"><b>' + esc(p.user) + '</b>' + (roomBy[rid] ? '<a href="#room-' + rid + '">' + esc(roomNameOf(p)) + "</a>" : "<span>" + esc(roomNameOf(p)) + "</span>") + "</div>" +
      '<button class="share" type="button" data-act="share" data-hash="photo-' + p.key + '" aria-label="Copy link to this photo">' + I.share + "</button></div>" +
      '<a class="shot" href="#photo-' + p.key + '" aria-label="Open photo to see cheers and comments">' + photoFace(p, "Photo by " + p.user) + "</a>" +
      '<div class="post-foot"><b>' + cheerText(c) + "</b>" +
      (user ? '<a class="linkish" href="#photo-' + p.key + '">View comments</a>' : '<button class="linkish" type="button" data-act="login">Log in to view comments for this photo</button>') +
      "</div></article>";
  }
  function article() {
    return '<article class="article"><div class="shot"><img src="' + ICON + '" alt=""></div>' +
      '<div><h3>Headline goes here</h3><p>A short summary of the update sits under the headline. Nothing has been posted yet.</p></div></article>';
  }
  function eventRow() {
    return '<article class="event"><div class="date">Date<b>--</b></div>' +
      '<div><h3>Event name</h3><p>Hosted by @Plutonium in ^RoomName</p></div>' +
      '<button class="btn" type="button" data-act="remind">Remind me</button></article>';
  }
  function emptyBox(title, text) { return '<div class="panel" style="margin-top:0"><div class="empty"><b>' + esc(title) + "</b>" + esc(text) + "</div></div>"; }
  var views = {
    feed: { h: "Take A Look At What's Happening Right Now In Plutonium", html: function () {
      var l = feedPhotos();
      if (!l.length) return emptyBox(loadedOnce ? "No photos yet" : "Loading", loadedOnce ? "New photos from players will show up here." : "Getting the latest from the servers.");
      return '<div class="feed">' + l.map(feedPost).join("") + "</div>";
    } },
    news: { h: "News", html: function () { return '<div class="list">' + [0, 1, 2].map(article).join("") + "</div>"; } },
    events: { h: "Upcoming Events", html: function () { return '<div class="list">' + [0, 1, 2].map(eventRow).join("") + "</div>"; } },
    rooms: { h: "Rooms", html: function () { return rooms.length ? '<div class="room-grid">' + rooms.map(roomCard).join("") + "</div>" : emptyBox(loadedOnce ? "No rooms yet" : "Loading", loadedOnce ? "Rooms will show up here as players publish them." : "Getting the latest from the servers."); } }
  };
  function tabBtn(v, label, icon) {
    return '<button class="tab" type="button" data-act="tab" data-view="' + v + '" aria-pressed="' + (homeView === v) + '">' + icon + label + "</button>";
  }
  function homePage(view) {
    homeView = view;
    var v = views[view];
    var feat = rooms.slice(0, 5);
    return '<section class="band" aria-label="Highlights"><div class="wrap"><div class="promos">' +
      '<a class="promo" href="#creator-hub"><div class="art hub" aria-hidden="true"><div class="tiles"><div class="tile">Room Stats</div><div class="tile">Total Tokens</div><div class="tile">Earn Rewards</div></div></div><span class="lbl">View Creator Hub ' + I.chev + "</span></a>" +
      '<a class="promo" href="#get-plutonium"><div class="art dl" role="img" aria-label="Plutonium logo on a green background"></div><span class="lbl">Download For Free ' + I.chev + "</span></a>" +
      '<a class="promo" href="#events"><div class="art ev"><div><div class="t">Your Featured Event Here</div><div class="s">Coming soon</div></div></div><span class="lbl">Plutonium Event Spotlight ' + I.chev + "</span></a>" +
      '</div></div></section>' +
      '<div class="wrap"><div class="tabs" role="group" aria-label="Browse">' +
      tabBtn("news", "News", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10v4l11 5V5L3 10Z"/><path d="M18 9a4 4 0 0 1 0 6"/></svg>') +
      tabBtn("events", "Events", '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/></svg>') +
      tabBtn("rooms", "Rooms", '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 3 2 12h3v9h5v-6h4v6h5v-9h3L12 3Z"/></svg>') +
      '</div><div class="cols"><aside class="side" aria-labelledby="fr-h"><h2 class="h" id="fr-h">Featured Rooms</h2><div class="rooms">' +
      (feat.length ? feat.map(roomCard).join("") : '<p class="note-empty">' + (loadedOnce ? "No rooms yet." : "Loading rooms.") + "</p>") +
      "</div>" + (LIVE ? "" : '<p class="preset-note">Preset rooms. Swap in your own.</p>') +
      '</aside><main><h1 class="main-h">' + esc(v.h) + "</h1>" + v.html() + "</main></div></div>";
  }

  /* ---------- views: room ---------- */
  function roomPage(id) {
    if (rs.id !== id) rs = { id: id, thumb: 0, tab: "photos", ptab: "popular", pick: 0 };
    var r = roomBy[id];
    var liked = !!store.get("pl-likes", {})[id];
    var imgs = r.images && r.images.length ? r.images.slice(0, 6) : null;
    var count = imgs ? imgs.length : 4;
    if (rs.thumb >= count) rs.thumb = 0;

    var thumbs = imgs
      ? imgs.map(function (u, i) { return '<button class="th ph" type="button" style="background-image:url(\'' + safeUrl(u) + '\')" data-act="thumb" data-i="' + i + '" aria-pressed="' + (rs.thumb === i) + '" aria-label="Show image ' + (i + 1) + '"></button>'; }).join("")
      : [0, 1, 2, 3].map(function (i) { return '<button class="th ph ph' + i + '" type="button" data-act="thumb" data-i="' + i + '" aria-pressed="' + (rs.thumb === i) + '" aria-label="Show image ' + (i + 1) + '">' + (i > 1 ? '<img src="' + ICON + '" alt="">' : "") + "</button>"; }).join("");
    var hero = imgs
      ? '<div class="hero-img ph" style="background-image:url(\'' + safeUrl(imgs[rs.thumb]) + '\')" role="img" aria-label="Room image ' + (rs.thumb + 1) + " of " + count + '"></div>'
      : '<div class="hero-img ph ph' + rs.thumb + '" role="img" aria-label="Room image ' + (rs.thumb + 1) + ' of 4">' + (rs.thumb > 1 ? '<img src="' + ICON + '" alt="">' : "") + "</div>";

    var list = roomPhotos(id);
    if (livePhotos) { if (rs.ptab === "popular") list = list.slice().sort(function (a, b) { return cheerCount(b) - cheerCount(a); }); }
    else if (rs.ptab === "new") list = list.slice().reverse();
    if (rs.pick >= list.length) rs.pick = 0;
    var cur = list[rs.pick];

    var tabBody;
    if (rs.tab === "photos") {
      var inner;
      if (!list.length) {
        inner = '<div class="empty"><b>No photos yet</b>Photos taken in ' + esc(r.name) + " will show up here.</div>";
      } else {
        var pgrid = list.map(function (p, idx) {
          return '<button class="pt" type="button" data-act="pick" data-i="' + idx + '" aria-pressed="' + (rs.pick === idx) + '" aria-label="Preview photo ' + (idx + 1) + '">' + (p.url ? '<img class="cover" src="' + esc(p.url) + '" alt="" loading="lazy">' : (p.n || idx + 1)) + "</button>";
        }).join("");
        inner = '<div class="pg-top"><a class="bigshot" href="#photo-' + cur.key + '" aria-label="Open photo to see cheers and comments">' +
          (cur.url ? '<img class="cover" src="' + esc(cur.url) + '" alt="">' : '<img src="' + ICON + '" alt=""><span>Click to see cheers and comments.</span>') + "</a>" +
          '<div class="pinfo"><div class="row"><div class="ava"><img src="' + ICON + '" alt=""></div><div class="who"><b>' + esc(cur.user) + '</b><a href="#room-' + id + '">' + esc(r.name) + "</a></div></div>" +
          '<span class="pill">' + I.thumb + " " + cheerText(cheerCount(cur)) + "</span></div></div>" +
          '<div class="pthumbs">' + pgrid + "</div>";
      }
      tabBody = '<section class="panel" aria-labelledby="ph-h"><h2 class="h" id="ph-h">Photos In This Room</h2>' +
        '<div class="subtabs" role="tablist" aria-label="Photo order">' +
        '<button class="rtab" type="button" role="tab" data-act="ptab" data-v="popular" aria-selected="' + (rs.ptab === "popular") + '">Popular</button>' +
        '<button class="rtab" type="button" role="tab" data-act="ptab" data-v="new" aria-selected="' + (rs.ptab === "new") + '">New</button></div>' + inner + "</section>";
    } else {
      tabBody = '<section class="panel"><div class="empty"><b>No events yet</b>Events hosted in ' + esc(r.name) + " will show up here.</div></section>";
    }

    var desc = r.desc || ("Welcome to " + r.name + ". This is a preset room page. Add your room description here so players know what to expect.");
    return '<div class="wrap page"><a class="back" href="#">' + I.back + 'Back to home</a>' +
      '<div class="rm-top"><div>' + hero + '<div class="thumbs">' + thumbs + "</div></div>" +
      '<div><h1 class="rm-name">' + esc(r.name) + '</h1><p class="rm-by">' + esc(r.by) + "</p>" +
      '<p class="rm-desc">' + esc(desc) + "</p>" +
      '<div class="rm-btns"><button class="btn solid" type="button" data-act="play">Play</button><button class="btn mute" type="button" aria-disabled="true" data-act="meetup">Meetup</button></div>' +
      '<div class="likes"><button class="lk" type="button" data-act="like" data-room="' + id + '" aria-pressed="' + liked + '" aria-label="Like this room">' + I.thumb + "<span>" + (liked ? 1 : 0) + "</span></button>" +
      '<button class="share" type="button" data-act="share" data-hash="room-' + id + '" aria-label="Copy link to this room">' + I.share + "</button></div>" +
      '<div class="chips">' + r.tags.map(function (t) { return '<span class="chip">#' + esc(t) + "</span>"; }).join("") + "</div></div></div>" +
      '<div class="stats"><div class="stat"><b>Room Visits</b><span>' + Number(r.visits || 0).toLocaleString() + '</span></div><div class="stat"><b>Published</b><span>' + esc(r.published || "—") + '</span></div><div class="stat"><b>Capacity</b><span>' + esc(r.cap) + '</span></div><div class="stat"><b>Platforms</b><span>' + I.monitor + I.phone + "VR</span></div></div>" +
      '<div class="rtabs" role="tablist" aria-label="Room sections"><button class="rtab" type="button" role="tab" data-act="rtab" data-v="photos" aria-selected="' + (rs.tab === "photos") + '">' + I.cam + 'Photos</button><button class="rtab" type="button" role="tab" data-act="rtab" data-v="events" aria-selected="' + (rs.tab === "events") + '">' + I.cal + "Events</button></div>" +
      tabBody + "</div>";
  }

  /* ---------- views: photo ---------- */
  function photoPage(p) {
    var key = p.key, cheered = !!store.get("pl-cheers", {})[key], c = cheerCount(p);
    var isFeed = /^feed-/.test(key) || !roomBy[p.roomId];
    var backHref = isFeed ? "#" : "#room-" + p.roomId;
    var backText = isFeed ? "Back to home" : "Back to " + roomNameOf(p);
    var comments = store.get("pl-comments", {})[key] || [];
    var cm;
    if (user) {
      cm = '<div class="cmts">' + (comments.length ? comments.map(function (m) {
        return '<div class="cmt"><span class="ava" aria-hidden="true">' + esc(m.u.charAt(0)) + '</span><div><b>@' + esc(m.u) + "</b><p>" + esc(m.t) + "</p></div></div>";
      }).join("") : '<p class="note">No comments yet. Be the first.</p>') + "</div>" +
        '<form class="cm-form" id="comment-form" data-key="' + key + '"><label class="note" for="comment-text">Add a comment</label><textarea id="comment-text" maxlength="280" placeholder="Say something nice"></textarea><button class="btn solid" type="submit">Post comment</button></form>';
    } else {
      cm = '<p class="note">Log in to view comments for this photo.</p><button class="btn solid" type="button" data-act="login" style="align-self:flex-start">Log in</button>';
    }
    return '<div class="wrap page"><a class="back" href="' + backHref + '">' + I.back + esc(backText) + "</a>" +
      '<div class="photo-layout"><div class="shot photo-img" style="border:1px solid var(--line);border-radius:10px;aspect-ratio:4/3">' +
      (p.url ? '<img class="cover" src="' + esc(p.url) + '" alt="Photo by ' + esc(p.user) + '">' : '<img src="' + ICON + '" alt=""><span>No photo yet</span>') + "</div>" +
      '<div class="photo-box"><div class="post-top" style="padding:0"><div class="ava"><img src="' + ICON + '" alt=""></div><div class="who"><b>' + esc(p.user) + "</b>" + (roomBy[p.roomId] ? '<a href="#room-' + p.roomId + '">' + esc(roomNameOf(p)) + "</a>" : "<span>" + esc(roomNameOf(p)) + "</span>") + "</div>" +
      '<button class="share" type="button" data-act="share" data-hash="photo-' + key + '" aria-label="Copy link to this photo">' + I.share + "</button></div>" +
      '<div class="cheer-row"><button class="cheer-btn" type="button" data-act="cheer" data-key="' + key + '" aria-pressed="' + cheered + '">' + I.thumb + (cheered ? "Cheered" : "Cheer") + "</button><b>" + cheerText(c) + "</b></div>" +
      '<h2 class="cm-h">Comments</h2>' + cm + "</div></div></div>";
  }

  /* ---------- views: players, download, placeholders ---------- */
  function playerPage(slug) {
    var p = players().filter(function (x) { return x.slug === slug; })[0];
    if (!p) return soonPage("Player");
    var mine = rooms.filter(function (r) { return r.by === p.name; });
    return '<div class="wrap page"><a class="back" href="#">' + I.back + 'Back to home</a>' +
      '<div class="pl-head"><span class="ava" aria-hidden="true">' + esc(p.name.charAt(1)) + '</span><div><h1>' + esc(p.name) + '</h1><p class="note">Player profile</p></div></div>' +
      '<section class="panel"><h2 class="h">Rooms</h2>' +
      (mine.length ? '<div class="room-grid" style="margin-top:14px">' + mine.map(roomCard).join("") + "</div>" : '<div class="empty"><b>No rooms yet</b>Rooms made by ' + esc(p.name) + " will show up here.</div>") +
      "</section></div>";
  }
  function downloadPage() {
    var plats = [["PC", "Windows 10 and 11"], ["Meta Quest", "Quest 2, 3 and Pro"], ["PlayStation", "PS4 and PS5"], ["Xbox", "Xbox One and Series X|S"], ["iOS", "iPhone and iPad"], ["Android", "Phones and tablets"]];
    return '<div class="wrap page"><a class="back" href="#">' + I.back + 'Back to home</a>' +
      '<div class="dl-hero"><img src="' + WORD + '" alt="Plutonium"><h1>Download Plutonium</h1><p>Free to play. Pick your platform to get started, then jump into your first room.</p></div>' +
      '<div class="plats">' + plats.map(function (p) {
        return '<div class="plat"><h3>' + p[0] + "</h3><p>" + p[1] + '</p><button class="btn solid" type="button" data-act="platform" data-name="' + p[0] + '">Download</button></div>';
      }).join("") + "</div></div>";
  }
  function soonPage(title) {
    return '<div class="wrap page"><a class="back" href="#">' + I.back + 'Back to home</a><section class="panel"><div class="empty"><b>' + esc(title) + '</b>This page is coming soon.</div></section></div>';
  }
  function loadingPage() {
    return '<div class="wrap page"><section class="panel"><div class="empty"><b>Loading</b>Getting the latest from the servers.</div></section></div>';
  }

  /* ---------- search ---------- */
  var sp = { type: "players", q: "" };
  function renderSearch() {
    var q = norm(sp.q), items;
    [].forEach.call(document.querySelectorAll("#search .rtab"), function (b) {
      b.setAttribute("aria-selected", b.getAttribute("data-v") === sp.type ? "true" : "false");
    });
    $("search-q").placeholder = sp.type === "rooms" ? "Search rooms" : "Search players";
    if (sp.type === "rooms") {
      items = rooms.filter(function (r) {
        return !q || norm(r.name).indexOf(q) > -1 || norm(r.by).indexOf(q) > -1 || r.tags.some(function (t) { return norm(t).indexOf(q) > -1; });
      }).map(function (r) {
        return '<a class="sr" href="#room-' + r.id + '"><span class="sr-pic"><img src="' + ICON + '" alt=""></span><span><b>' + esc(r.name) + "</b><i>" + esc(r.by) + "</i></span></a>";
      });
    } else {
      items = players().filter(function (p) { return !q || norm(p.name).indexOf(q) > -1; }).map(function (p) {
        return '<a class="sr" href="#player-' + p.slug + '"><span class="ava" aria-hidden="true">' + esc(p.name.charAt(1)) + "</span><span><b>" + esc(p.name) + "</b><i>Player</i></span></a>";
      });
    }
    $("search-results").innerHTML = items.length ? items.join("") : '<p class="note" style="padding:10px 6px">No ' + sp.type + " found.</p>";
  }
  function openSearch() {
    $("search").hidden = false;
    $("search-btn").setAttribute("aria-expanded", "true");
    renderSearch();
    $("search-q").focus();
  }
  function closeSearch() {
    if ($("search").hidden) return;
    $("search").hidden = true;
    $("search-btn").setAttribute("aria-expanded", "false");
  }
  function toggleSearch() { if ($("search").hidden) openSearch(); else closeSearch(); }

  /* ---------- router ---------- */
  function route() {
    var h = (location.hash || "").replace("#", ""), m, key, html, p;
    closeSearch();
    if (h === "get-plutonium") { key = "dl"; html = downloadPage(); }
    else if ((m = h.match(/^player-([a-z0-9]+)$/)) && players().some(function (x) { return x.slug === m[1]; })) { key = "player-" + m[1]; html = playerPage(m[1]); }
    else if ((m = h.match(/^room-([a-z0-9]+)$/)) && roomBy[m[1]]) { key = "room-" + m[1]; html = roomPage(m[1]); }
    else if ((m = h.match(/^photo-([a-z0-9-]+)$/)) && (p = photoObj(m[1]))) { key = "photo-" + m[1]; html = photoPage(p); }
    else if (!loadedOnce && /^(room|photo|player)-/.test(h)) { key = "loading"; html = loadingPage(); }
    else if (h === "shop") { key = "shop"; html = soonPage("Shop"); }
    else if (h === "creator-hub") { key = "hub"; html = soonPage("Creator Hub"); }
    else { var v = views[h] ? h : "feed"; key = "home-" + v; html = homePage(v); }
    $("app").innerHTML = html;
    if (key !== lastKey) { try { window.scrollTo(0, 0); } catch (e) {} lastKey = key; }
  }
  function goHome() { if (location.hash) location.hash = ""; else route(); }
  window.addEventListener("hashchange", route);

  /* ---------- events ---------- */
  document.addEventListener("click", function (e) {
    var t = e.target.closest("[data-act]");
    if (!$("search").hidden && !e.target.closest("#search") && !(t && t.getAttribute("data-act") === "search")) closeSearch();
    if (!t) return;
    var a = t.getAttribute("data-act");
    if (a === "search") { toggleSearch(); }
    else if (a === "stype") { sp.type = t.getAttribute("data-v"); renderSearch(); $("search-q").focus(); }
    else if (a === "home") { e.preventDefault(); goHome(); }
    else if (a === "login") { openLogin(); }
    else if (a === "logout") {
      user = null; token = null; store.set("pl-user", null);
      try { sessionStorage.removeItem("pl-token"); } catch (err) {}
      renderAuth(); route(); toast("Logged out");
    }
    else if (a === "tab") { var v = t.getAttribute("data-view"); if (homeView === v) goHome(); else location.hash = v; }
    else if (a === "thumb") { rs.thumb = +t.getAttribute("data-i"); route(); }
    else if (a === "rtab") { rs.tab = t.getAttribute("data-v"); route(); }
    else if (a === "ptab") { rs.ptab = t.getAttribute("data-v"); rs.pick = 0; route(); }
    else if (a === "pick") { rs.pick = +t.getAttribute("data-i"); route(); }
    else if (a === "play") { location.hash = "get-plutonium"; }
    else if (a === "meetup") { toast("Meetups open once you are in the game."); }
    else if (a === "remind") { if (!needLogin("Log in to set event reminders.")) toast("Reminder set"); }
    else if (a === "platform") { toast(t.getAttribute("data-name") + " downloads are not live yet. This is a preview page."); }
    else if (a === "like") {
      if (needLogin("Log in to like this room.")) return;
      var id = t.getAttribute("data-room"), likes = store.get("pl-likes", {});
      likes[id] = !likes[id]; store.set("pl-likes", likes); route();
    }
    else if (a === "cheer") {
      if (needLogin("Log in to cheer this photo.")) return;
      var k = t.getAttribute("data-key"), ch = store.get("pl-cheers", {});
      ch[k] = !ch[k]; store.set("pl-cheers", ch); route();
    }
    else if (a === "share") {
      var url = location.href.split("#")[0] + "#" + t.getAttribute("data-hash");
      try {
        navigator.clipboard.writeText(url).then(function () { toast("Link copied"); }, function () { toast("Could not copy. Use the address bar link."); });
      } catch (err) { toast("Could not copy. Use the address bar link."); }
    }
  });

  document.addEventListener("submit", function (e) {
    var f = e.target;
    if (f.id === "login-form") {
      e.preventDefault();
      var name = $("login-user").value.trim().replace(/^@/, ""), pass = $("login-pass").value;
      if (LIVE) {
        if (!name || !pass) { $("login-err").textContent = "Enter your username and password."; return; }
        var btn = f.querySelector('button[type="submit"]');
        btn.disabled = true; $("login-err").textContent = "";
        serverLogin(name, pass).then(function (j) {
          token = j.access_token;
          try { sessionStorage.setItem("pl-token", token); } catch (err) {}
          if (EP.me) {
            return apiGet(EP.me).then(function (p) { var n = normPlayer(p); return n ? n.name.replace(/^@/, "") : name; }, function () { return name; });
          }
          return name;
        }).then(function (shown) {
          btn.disabled = false; finishLogin(shown); refresh();
        }, function (err) {
          btn.disabled = false;
          $("login-err").textContent = (err && err.message === "Failed to fetch")
            ? "Could not reach the server. Check config.js, and that the server allows this site."
            : (err && err.message) || "Login failed.";
        });
        return;
      }
      if (!/^[A-Za-z0-9_]{2,20}$/.test(name)) { $("login-err").textContent = "Use 2 to 20 letters, numbers or underscores for your username."; $("login-user").focus(); return; }
      if (pass.length < 4) { $("login-err").textContent = "Your password needs at least 4 characters."; $("login-pass").focus(); return; }
      finishLogin(name);
    } else if (f.id === "comment-form") {
      e.preventDefault();
      var ta = $("comment-text"), txt = ta.value.trim();
      if (!txt || !user) return;
      var all = store.get("pl-comments", {}), key = f.getAttribute("data-key");
      (all[key] = all[key] || []).push({ u: user, t: txt.slice(0, 280) });
      store.set("pl-comments", all); route();
      var nt = $("comment-text"); if (nt) nt.focus();
    }
  });

  $("login-cancel").addEventListener("click", closeLogin);
  $("modal").addEventListener("click", function (e) { if (e.target === $("modal")) closeLogin(); });
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    if (!$("modal").hidden) closeLogin();
    else if (!$("search").hidden) { closeSearch(); $("search-btn").focus(); }
  });
  $("search-q").addEventListener("input", function (e) { sp.q = e.target.value; renderSearch(); });
  $("search-q").addEventListener("keydown", function (e) {
    if (e.key !== "Enter") return;
    e.preventDefault();
    var first = document.querySelector("#search-results a");
    if (first) { location.hash = first.getAttribute("href").slice(1); closeSearch(); }
  });

  renderAuth();
  route();
  if (LIVE) {
    setNote("Connecting to " + CFG.domain + ".");
    refresh();
    setInterval(refresh, Math.max(10, Number(CFG.refreshSeconds) || 30) * 1000);
    document.addEventListener("visibilitychange", function () { if (!document.hidden) refresh(); });
  }
})();
