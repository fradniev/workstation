const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const app = express()
const geometry = require('spherical-geometry-js');

app.use(express.static('public'));
app.use(bodyParser.urlencoded({ extended: true }));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');

/** bodyParser.urlencoded(options)
 * Parses the text as URL encoded data (which is how browsers tend to send form data from regular forms set to POST)
 * and exposes the resulting object (containing the keys and values) on req.body
 */
 app.use(bodyParser.urlencoded({
  extended: true
}));

 app.use(bodyParser.json());

 app.get('/', function (req, res) {
  var markers = JSON.parse(fs.readFileSync('markers.json', 'utf8'));
  res.render('index', {markers:markers});
})

 app.post('/', function (req, res) {
  fs.writeFileSync('markers.json', JSON.stringify(req.body));
  res.send(true);
})

 app.post('/position', function (req, res) {
  var markers = JSON.parse(fs.readFileSync('markers.json', 'utf8'));
  for (var j = 0; j< markers.length; j++) {
    if (geometry.computeDistanceBetween(
      new geometry.LatLng( markers[j].lat, markers[j].lng ),
      new geometry.LatLng( req.body.lat, req.body.lng )
      ) <= 30) {
      console.log("In Workplace.");
    break;
    } else {
      console.log("Away from Workplace.");
    }
  }
  //fs.writeFileSync('position.json', JSON.stringify(req.body));
  res.send(true);
})

 app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
})
