# Statusify

### Statusify is server that fetch current listening song from Spotify APi

CLIENT_ID and CLIENT_SECRET can configured from index.js

Libs:
 - axios
 - cookie-parser
 - cors
 - express
 - request

/login to login  to your acount

/refresh_token to refresh token

/get_current_song  returns current listeing song

Example response:

```json
{
   "artists_str":"нестор TONYMO ",
   "song_name":"віра",
   "photo":"https://i.scdn.co/image/ab67616d0000b273f8d01e7fd47a415107238c45",
   "progress":22070
}
```
