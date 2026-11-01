/*
  Plutonium site settings. This is the only file you need to edit to connect the site to your servers.

  1. Set useServer to true once the servers are running.
  2. Fill in each endpoint below with the service and path that returns that data.
     An endpoint set to null keeps the preset data for that part of the site.
*/
window.PLUTONIUM_CONFIG = {
  // Your domain. Services are reached at https://<subdomain>.<domain>
  domain: "plutoniumrec.net",

  // false = preview mode (preset rooms, photos and players, local-only login)
  // true  = log in and load data from your servers
  useServer: false,

  // false = the browser calls your servers directly (the servers must allow https://plutoniumrec.net, called CORS).
  // true  = calls go through /api/<service>/... on this site (see functions/api/[[path]].js).
  useProxy: false,

  // How often to re-check the servers for new rooms, photos and players.
  refreshSeconds: 30,

  // Subdomain for each service. Change a value if your server uses a different subdomain.
  services: {
    auth: "auth",
    accounts: "accounts",
    rooms: "rooms",
    photos: "photos"
  },

  // If the server returns image file names instead of full links, put the address images are served from here.
  // Example: "https://img.plutoniumrec.net"
  imageBase: "",

  // Login request. These match a standard OAuth "password" request. Change them to match your auth service.
  login: {
    grantType: "password",
    usernameField: "username",
    passwordField: "password",
    clientId: "",
    scope: "",
    extraFields: {}
  },

  endpoints: {
    // Where login is sent, on the auth service.
    token: "/connect/token",

    // Each of these is { service: "<key from services above>", path: "/path" } or null.
    // me: returns the logged-in player's profile (used to show their real name).
    me: null,
    // rooms: returns a list of rooms.
    rooms: null,
    // players: returns a list of players.
    players: null,
    // photos: returns a list of photos, newest first if possible.
    photos: null

    // Example once you know the paths:
    // rooms: { service: "rooms", path: "/rooms" },
    // players: { service: "accounts", path: "/players" },
    // photos: { service: "photos", path: "/photos" },
    // me: { service: "accounts", path: "/account/me" }
  }
};
