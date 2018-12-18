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
});

app.post('/', function (req, res) {
  fs.writeFileSync('markers.json', JSON.stringify(req.body));
  res.send(true);
});

app.post('/position', function (req, res) {
  console.log(req.body);
  if(req.body.pos!=null){
    var markers = JSON.parse(fs.readFileSync('markers.json', 'utf8'));
    var j = 0;
    while (j< markers.length) {
      if (geometry.computeDistanceBetween(new geometry.LatLng( markers[j].lat, markers[j].lng ),new geometry.LatLng( req.body.pos.lat, req.body.pos.lng )) <= 50){
        if (req.body.time!=null && req.body.work!=null && req.body.work) {
          var save="User: "+req.body.user+". In work: "+req.body.time+"\n";
          fs.appendFile('users logs/'+req.body.user+'.txt', save, function (err) {
            if (err) throw err;
            console.log('Saved!');
          });
        }
        j=markers.length;
      } 
      else {
        if(req.body.time!=null && req.body.work!=null && !req.body.work && j+1==markers.length){
          var save="User: "+req.body.user+". Out of work: "+req.body.time+"\n";
          fs.appendFile('users logs/'+req.body.user+'.txt', save, function (err) {
            if (err) throw err;
            console.log('Saved!');
          });
        }
      }
      j++
    }
  }
  res.send(true);
});

app.listen(3000, function () {
  console.log('Example app listening on port 3000!')
});
