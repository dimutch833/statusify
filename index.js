var express = require('express'); // Express web server framework
var request = require('request'); // "Request" library
var cors = require('cors');
var querystring = require('querystring');
var cookieParser = require('cookie-parser');
var fs = require('fs');

var client_id = 'CLIENT_ID'; // Your client id
var client_secret = 'CLIENT_SECRET'; // Your secret
var redirect_uri = 'http://localhost/callback'; // Your redirect uri
var main_bearer = "";
/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */
try {
    const data = fs.readFileSync('profile', 'utf8');
    main_bearer = data;
  } catch (err) {
    console.error(err);
  }
var generateRandomString = function(length) {
  var text = '';
  var possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

  for (var i = 0; i < length; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
};

var stateKey = 'spotify_auth_state';

var app = express();

app.use(express.static(__dirname + '/public'))
   .use(cors())
   .use(cookieParser());

app.get('/get_current_song', function(req, res) {

    var options = {
        url: 'https://api.spotify.com/v1/me/player/currently-playing',
        headers: { 'Authorization': 'Bearer ' + main_bearer },
        json: true
      };

      // use the access token to access the Spotify Web API
      request.get(options, function(error, response, body) {
        try{
       var artists_array = body["item"]["artists"];
        var artists = "";
        if(artists_array.length > 1){
        artists_array.forEach(element => {
           artists =  artists.concat(element["name"]+ " ");
        });
       }else{
        artists = artists_array[0]["name"];
       }
        var resp = {
            artists_str : artists,
            song_name : body["item"]["name"],
            photo : body["item"]["album"]["images"][0]["url"],
            progress : body["progress_ms"]
        }
      
        res.send(resp)
        }catch(error){
             res.send("Error");
        }
      });

});
app.get('/login', function(req, res) {

    var state = generateRandomString(16);
    res.cookie(stateKey, state);
  
    // your application requests authorization
    var scope = 'user-read-private user-read-email user-read-currently-playing';
    res.redirect('https://accounts.spotify.com/authorize?' +
      querystring.stringify({
        response_type: 'code',
        client_id: client_id,
        scope: scope,
        redirect_uri: redirect_uri,
        state: state
      }));
  });

app.get('/callback', function(req, res) {

  // your application requests refresh and access tokens
  // after checking the state parameter

  var code = req.query.code || null;
  var state = req.query.state || null;
  var storedState = req.cookies ? req.cookies[stateKey] : null;

  if (state === null || state !== storedState) {
    res.redirect('/#' +
      querystring.stringify({
        error: 'state_mismatch'
      }));
  } else {
    res.clearCookie(stateKey);
    var authOptions = {
      url: 'https://accounts.spotify.com/api/token',
      form: {
        code: code,
        redirect_uri: redirect_uri,
        grant_type: 'authorization_code'
      },
      headers: {
        'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64'))
      },
      json: true
    };

    request.post(authOptions, function(error, response, body) {
      if (!error && response.statusCode === 200) {

        var access_token = body.access_token,
            refresh_token = body.refresh_token;
        main_bearer = access_token;
        fs.writeFile("profile", main_bearer, function(err) {
            if (err) {
                console.log(err);
            }
        });
        fs.writeFile("refresh", refresh_token, function(err) {
          if (err) {
              console.log(err);
          }
      });
        res.send(access_token);

        // we can also pass the token to the browser to make requests from there
        
      } else {
        res.redirect('/#' +
          querystring.stringify({
            error: 'invalid_token'
          }));
      }
    });
  }
});

app.get('/refresh_token', function(req, res) {

  refresh_tok_f = "";
  try {
    const data = fs.readFileSync('refresh', 'utf8');
    refresh_tok_f = data;
  } catch (err) {
    console.error(err);
  }
  // requesting access token from refresh token
  var refresh_token = refresh_tok_f;
  var authOptions = {
    url: 'https://accounts.spotify.com/api/token',
    headers: { 'Authorization': 'Basic ' + (new Buffer(client_id + ':' + client_secret).toString('base64')) },
    form: {
      grant_type: 'refresh_token',
      refresh_token: refresh_token
    },
    json: true
  };

  request.post(authOptions, function(error, response, body) {
    if (!error && response.statusCode === 200) {
      var access_token = body.access_token;
      main_bearer = access_token;
      fs.writeFile("profile", main_bearer, function(err) {
        if (err) {
            console.log(err);
        }
    });
      res.send({
        'access_token': access_token
      });
    }
  });
});

console.log('Listening on 3000');
app.listen(3000);
