const ID_MIN_LENGTH = 2;
const ID_MAX_LENGTH = 20;
const ID_LENGTH = ID_MIN_LENGTH;

// Add reserved routes
// If you follow the recommended order of the routing, nothing will happen if somebody makes a link with the ID as one of these routes.
// The link will be made but the route will still resolve to whatever page you want.
const RESERVED = ["n", "l"];

// === CHANGE THESE TO YOUR OWN DOMAIN ===
const DEFAULT_HOST = "linkfy.gq";
const DEFAULT_BASE = "https://priyansh.is-a.dev";

// If true, list page will be disabled. Stats page will work.
// Note: if this is false, password-protected links will be disabled.
// IF YOU SET THIS TO FALSE AFTER IT HAS BEEN TRUE, ALL PASSWORDS WILL BE EXPOSED.
const KEEP_LINKS_SECRET = false;

// If true, IP addresses will not be logged.
// They will (must) still be used to rate limit incoming connections.
const KEEP_IPS_UNLOGGED = true;

const ip = (req) => {
  return KEEP_IPS_UNLOGGED?"XXX.XXX.XXX.XXX":req.get("X-Forwarded-For")
}

const mySecret = process.env['DROP_KEY'];
const htmlhead = `
<!doctype html>
<head>
<link rel="shortcut icon" href="https://priyansh.pages.dev/c/favicon/priyansh.ico" type="image/x-icon"/>
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>URL Shortner</title>

<link rel="preconnect" href="https://fonts.gstatic.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap" rel="stylesheet">
<style>

* { box-sizing: border-box }

a { word-break: break-word }

body { 
background-image: url(https://priyansh.pages.dev/c/bg/db24d8.jpg);
background-position: center;
background-repeat: no-repeat;
background-size: cover;);
background-position: center;
background-repeat: no-repeat;
background-size: cover;
display: flex;
margin: 0; padding: 0;
align-items: center;
justify-content: center;
height: 100vh;
font-family: 'Inter', -apple-system, "Helvetica", 'Roboto', sans-serif;
background-color: #FAFAFA;
line-height: 1.5;
}

div.container { background-color: #FFF; margin:20px; padding: 20px; max-width: 700px; border-radius: 10px; }

input, button {  border: none; padding: 5px; border-radius: 3px; border: 2px solid #EEE; margin: 2px; width: 100% }

select {  border: none; padding: 5px; border-radius: 3px; border: 2px solid #EEE; margin: 2px; width: 45% }

.custom {  border: none; padding: 5px; border-radius: 3px; border: 2px solid #EEE; margin: 2px; width: 50% }

select{
  direction: rtl;
}
select option{
  direction:ltr;
}


input[type=submit], button {font-size: 0.9rem; color: white;background-color: #9046CF;border: none; margin-top: 15px}

td, th { text-overflow: ellipsis; padding: 7px;}

td.true { word-break: break-word; }
td.false {font-family: monospace;}

td, table, tr, th { border: 2px solid #EEE; border-collapse:collapse; }

table {border-radius: 3px; font-size: 0.8rem}

code, pre {
  padding: 3px;
  background-color: #EEE;
  border-radius: 3px;
  display: inline;

  margin-top: inherit;
  margin-bottom: inherit;
}

label {
  font-size: 0.85rem;
}

/*
@media (prefers-color-scheme: dark) {
  div.container { background-color: #0E131F; border: 1px solid white }
  body { background-color: #1B1B1B; color: #FAFAFA; }
  input, code {background-color: black; color: #FAFAFA;}
  input, button {border: 1px solid #EEE;}
  a { color: #446DF6 }
}
*/

footer { margin-top: 25px; }

.indextitle {
  text-decoration-line: underline;
  text-decoration-style: solid;
}

h1 {margin:0}

.errorbox { display: block; margin: 10px 0; padding: 15px; border-radius: 5px; border: 2px solid lightcoral; font-size:0.9rem;color:red }

</style>
</head>

<body>
<div class=container>
`;

const htmlend = `
<footer><hr>
<subtitle style="font-size:0.8rem;color:darkgray">Made by <a href="https://priyansh.xyz">Priyansh |</a>  <a href="https://github.com/priyanshprajapat/url-shortner">GitHub</a> | <a href="https://priyansh.xyz/donate">Donate</a> | <a href="https://discord.com/invite/VWUh7KuCwy">Discord</a>
<br>
</subtitle>
<subtitle style="font-size:0.8rem;color:darkgray">Similar Service <a href="https://linkfy.tk">linkfy.tk</a> | <a href="https://linnk.ga">linnk.ga</a> | <a href="https://mitly.ml">mitly.ml</a> | <a href="https://ooon.ga">ooon.ga</a> | <a href="https://ppan.ga">ppan.ga</a>
</subtitle></footer>
</div>
</body>
`

const slugify = require('slugify');
var randomWords = require('random-words');
const humanizeDuration = require("humanize-duration");
const sanitizeHtml = require('sanitize-html');

const Client = require("@replit/database");
const client = new Client();

// console.log(process.env.REPLIT_DB_URL)

const express = require('express');
const app = express();

app.use((req, res, next) => {

  // Useful for logging

  console.log(`[REQUEST] by IP ${ip(req)} to ${req.originalUrl}`);
  next();
})

const slowDown = require("express-slow-down");
app.enable("trust proxy");

// Limiter for requests
// Limiter applies to all routes because they all hit the database.
const speedLimiter = slowDown({
  windowMs: 1 * 60 * 1000, // 1 minute
  delayAfter: 20, //  20 requests
  delayMs: 500 // If somebody makes 20 requests in a 1 minute window, the program will add 500ms delay to every further request.
});

app.use(speedLimiter);

var http = require('http').createServer(app);
const webport = process.env.PORT || 8080;

const validURL = require('valid-url');

function makeid(length) {

  var result = [];
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result.push(characters.charAt(Math.floor(Math.random() *
      charactersLength)));
  }

  return result.join('');

  // return randomWords(2).join('-');
}

function validateID(id, override) {

  if (override) {return id;}

  id = slugify(id);

  // console.log(id.length)
  // console.log(!RESERVED.includes(id))

  if (
    id.length > ID_MIN_LENGTH &&
    id.length < ID_MAX_LENGTH &&
    !RESERVED.includes(id)
  ) {
    return id
  } else {
    throw Exception("ID is not valid.")
  }

}

const row = html => `<tr>\n${html}</tr>\n`,
  heading = object => row(Object.keys(object).reduce((html, heading) => (html + `<th>${heading}</th>`), '')),
  datarow = object => row(Object.values(object).reduce((html, value) => (html + `<td class=${value.toString().includes('http')}>${value}</td>`), ''));

function htmlTable(dataList) {
  return `<table>
            ${heading(dataList[0])}
            ${dataList.reduce((html, object) => (html + datarow(object)), '')}
          </table>`
}

app.get("/", async (req, res) => {

  const base = "https://" + req.get('host') + "/";
  const all = await client.getAll();
  const num = Object.keys(all).length;

  res.end(`
      ${htmlhead}
      <div>
      <b class="indextitle">URL Shortner</b><br/>
      
      ${ (DEFAULT_HOST !== req.get("host")) ? "<b class=errorbox><code>DEFAULT_HOST</code> variable in source does not seem to match current host. Either there is a host mismatch, or the administrator may have to configure the <code>DEFAULT_HOST</code> variable.</b>":"<br/>" }

      <form action="n" method="GET" autocomplete="off">
        <label>Current URL<br/><input type="url" name="url" placeholder="https://example.com" required></label><br/>
        <label>Custom ID (Optional)<br/><select size="1" name="links" onchange="window.location.href=this.value;">
<option value="https://linkfy.gq" selected>https://linkfy.gq/</option>
<option value="https://linkfy.tk" disabled>https://linkfy.tk</option>
<option value="https://linnk.ga" disabled>https://linnk.ga</option>
<option value="https://mitly.ml" disabled>https://mitly.ml</option>
<option value="https://ooon.ga" disabled>https://ooon.ga</option>
<option value="https://ppan.ga" disabled>https://ppan.ga</option>
</select><input class="custom" type="text" placeholder="cool-ending" name="id" autocomplete="false" minlength="${ID_MIN_LENGTH}" maxlength="${ID_MAX_LENGTH}"></label><br/>
        <input type="submit">
      </form><br/>

      <!--<code>${base}[id]</code> to navigate to previously-created shortlink.<br>
      <code>${base}n/?url=[url]</code> to make a new one. Append &id=[id] for custom id, append &json=true for JSON output.<br>
      <code>${base}l</code> for list of all.<br>
      <br>-->
      <a href="#">Currently serving ${num} URLs.</a>
  ` + htmlend)

});

// To list all URLs. May want to disable this route if you have many, unnecessary load.

app.get("/l", (req, res) => {
  const reject = () => {
    res.setHeader("www-authenticate", "Basic");
    res.sendStatus(401);
  };

  const authorization = req.headers.authorization;

  if (!authorization) {
    return reject();
  }

  const [username, password] = Buffer.from(
    authorization.replace("Basic ", ""),
    "base64"
  )
    .toString()
    .split(":");

  if (!(username === process.env.username || "spicydevs" && password === process.env.password || "password")) {

  return reject();
  }

  if (KEEP_LINKS_SECRET && ( req.query.key !== mySecret )) { return res.status(401).end(htmlhead + "<b class=errorbox>Sorry, the URL list is disabled for privacy. Ask the server operator for more information.</b>" + htmlend) }

  const all = client.getAll();
  const base = "https://" + req.get('host') + "/";
  const listed = Object.keys(all).map(k => all[k]);

  // console.dir(listed)

  if (listed.length === 0) {
    return res.end(htmlhead + "<h2>No URLs available</h2>" + htmlend);
  }

  return res.end(htmlhead + `
  <h2 style="margin-bottom:10px">List of URLs</h2>

  <subtitle>Also visit ${base}<input size=10 placeholder="[link id]" style="font-family:monospace;padding:2px" id=id>/stats (<a href="#" onclick="document.location.href = ('${base}' + document.getElementById('id').value + '/stats')">go</a>) for better information.</subtitle>

  ${KEEP_LINKS_SECRET ? "<b class=errorbox>Attention: you are overriding the <code>KEEP_LINKS_SECRET</code> privacy setting. Note that this list may contain sensitive information.</b>":"<br><br>"}
  ` + htmlTable(listed) + htmlend);
});


// New URL
// Note that this takes an optional `key` GET parameter which will disable all checking of the link ID.
// The key is defined by the environment variable DROP_KEY.

// == Notes on use of the master key ==
// - IMPORTANT: A bug in the REPL.IT database system means you MUST NOT includes emojis or any special character as the IDs.
//   Normal sanitisation will usually catch this unless you use the master key.
//   If you do so, you will disable the list function and the front page.
//   To fix it, you will have to manually do a GET request and sanitise your database.

// - You can make infinite loops with the master key, which can harm your program.
//   If a poorly-configured script scrapes this URL, it will keep on hitting your program.

// - Specifying the key also disables the check for a previously existing ID. 
//   Therefore, if you include the key and the ID, whatever link previously had that ID will be overwritten.

app.get("/n", async (req, res) => {

  // If links are not kept secret, passwords will be exposed.
  if ((req.query.password || req.query.pw) && !KEEP_LINKS_SECRET) {
    return res.status(500).end(htmlhead + "<b>This server isn't configured properly for password-protected links. Contact the server administrator.</b>" + htmlend);
  }

  console.log("url create request");
  console.dir({ params: req.params, query: req.query });

  const base = 'https://' + req.get('host') + "/";
  const override = (req.query.key === mySecret);

  if (!validURL.isUri(req.query.url) && !override) {
    return res.status(400).json({
      success: false,
      message: "URL is not valid",
      url: req.query.url
    });
  }

  if (override && (slugify(req.query.id) !== req.query.id) && !req.query.overide_id_specialchars) {

    return res.status(400).end(htmlhead +
    
    `<b class=errorbox>
      You are overriding the link creation function and you have special characters in your ID. This may cause the front page and database to be inaccessible. If you still want to continue, add <code>?override_id_specialchars=true</code> to the end of the URL, or use the sanitized ID below.<br><br>
      
      Original ID: <pre>${sanitizeHtml(req.query.id)}</pre><br>
      Sanitized ID: <pre>${slugify(req.query.id)}</pre>
    </b>
    `
    
    + htmlend);

  }

  if (req.query.url.includes(req.get('host')) && !override) {
    return res.status(400).json({
      success: false,
      message: `Nested shortlinks/shortlinks to ${req.get('host')} to are not allowed.`
    });
  }

  var newId = makeid(ID_LENGTH);

  if (req.query.id && (req.query.id !== '')) {

    try {
      newId = validateID(sanitizeHtml(req.query.id), override);
    } catch (e) {
      console.error(e)
      return res.status(400).json({
        success: false,
        message: "ID is not valid.",
        id: req.query.id
      });
    }

  }

  if (override && (await client.get(newId))) {
    return res.status(409).json({ success: false, message: "URL with specified ID already exists." })
  }

  await client.set(newId, { 
    id: newId,
    url: req.query.url,
    visits: 0,
    created: new Date().getTime(),
    password: req.query.password || req.query.pw
  });

  if (req.query.json) {

    return res.json({
      success: true,
      shortlink: base + newId,
      url: req.query.url
    });

  } else {
    return res.redirect(301, base + newId + "/stats?new=true" + req.query.password)
  }

});

// Drop database. Useful for schema changes. Again, authorization with the key as the `key` GET parameter.
app.get("/config/drop", async (req, res) => {
  if (req.query.key !== mySecret) {
    return res.sendStatus(404);
  } else {

    await client.empty()
    return res.json({
      success: true,
      message: "Database has been cleared."
    });

  }
});

// Stats for each.
// Since this page directly embeds user input into HTML, it is probably vulnerable to XSS.
// Most dangerous entities should be caught by the URL and ID parser, but not guaranteed.
app.get("/:id/stats", async (req, res) => {

  let url  = await client.get(req.params.id);
  const base = 'https://' + req.get('host') + "/";

  if (!url) {
    return res.status(404).json({success: false, message: 'Not found'});
  }

  if ( url.password && ((req.query.password || req.query.pw) !== url.password) ) {
    return res.status(401).end(htmlhead + 
    `
    <h3 style="margin-bottom:0" >This is a protected link.</h3>
    <b>Please supply a correct password.</b><br><br>
    <form autocomplete=off action="/${url.id}/stats" method='get'> 
      <label>Password: <input  name=pw type=password></label><br>
      <input type=submit>
    </form>
    `
    + htmlend)
  }

  if (req.query.json) { return res.json(url)}

  const actualurl = `${base}${req.params.id}${url.password?'/?pw='+url.password:""}`

  res.end(htmlhead + `

    <h2><a href="${actualurl}">${base}${req.params.id}</a></h2>
    ${ (KEEP_LINKS_SECRET && req.query.new) ? "<b>Remember the shortlink URL - you'll only see it on this page.</b>":"" }
    <ul>
      <li>This link goes to <a href="${actualurl}">${url.url}</a></li>
      <li>Visited ${url.visits} ${url.visits === 1 ? "time":"times"}.</li>
      <li>Created ${ humanizeDuration(new Date().getTime() - url.created, {round: true}) } ago.</li>
      ${url.password && (url.password !== '') ? ("<li>Password: <pre>" + url.password + "</pre></li>"):""}
    </ul>

  ` + htmlend)

})

// Final, actual redirect loop.
// Note that this route must be last, because it catches everything.
app.get("/:id", async (req, res) => {

  console.log("url nav request.");
  console.dir({ params: req.params, query: req.query });

  if (!req.params.id) {
    return res.status(400).end("No ID was specified.")
  }

  let url;

  try {  url = await client.get(req.params.id); } catch (e) { return res.status(500).json({success: false, message: "Internal server error"}) }

  if (!url) {
    return res.status(404).end("Not found.")
  }

  if ( url.password && ((req.query.password || req.query.pw) !== url.password) ) {
    return res.status(401).end(htmlhead + 
    `
    <h3 style="margin-bottom:0" >This is a protected link.</h3>
    <b>Please supply a correct password.</b><br><br>
    <form autocomplete=off action="/${url.id}" method='get'> 
      <label>Password: <input  name=pw type=password></label><br>
      <input type=submit>
    </form>
    `
    + htmlend)
  }

  await client.set(url.id, {
    ...url,
    visits: url.visits + 1
  });

  // "Soft" redirect to bypass some social media metadata checks
  if (req.query.soft) {
    return res.end(`

    <!-- Soft redirect is being served because ?soft was specified in the URL query parameters. For a HTTP 301 redirect, remove this parameter. -->
    
    <!doctype html>
    <head>

      <title>${url["url"]}</title>
      <meta name="description" content="This is a short link to ${url['url']}. Go to ${DEFAULT_BASE} for more info.">

      <meta http-equiv="refresh" content="0;URL='${url['url']}'" />

      <script>
        window.location.href = \`${url["url"]}\`;
      </script>

    </head>
    </html>
    
    `)
  }

  // 301 Permanent Redirect instead of Express default 302 Found, this prevents infinite looping IN BROWSERS.
  // Note: a program or script can still infinite loop.
  return res.redirect(301, url["url"]);

});

http.listen(webport, function() {
  console.log('listening on *:' + webport);
});
