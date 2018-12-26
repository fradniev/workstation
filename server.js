const express = require('express');
const bodyParser = require('body-parser');
const fs = require("fs");
const app = express()
const httpsOptions = {
  key: fs.readFileSync('./key.pem'),
  cert: fs.readFileSync('./cert.pem')
}
var https = require('https').createServer(httpsOptions, app);
//var http = require('http').Server(app)
var io = require('socket.io')(https);
const geometry = require('spherical-geometry-js');
const port = 3000;

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
  res.render('index', {markers:getSavedMarkers()});
});

app.post('/', function (req, res) {
  fs.writeFileSync('markers.json', JSON.stringify(req.body));
  res.send(true);
});

app.post('/position', function (req, res) {
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

var users = [];

io.on('connection', function(socket){
  socket.on('savedMarkers', function(){
    socket.emit("savedMarkers", getSavedMarkers());
  });
  socket.on('saveMarkersFile', function(markers){
    fs.writeFileSync('markers.json', markers);
  });
  socket.on('addUser', function(name){
    users.push({name:name, id:socket.id});
  });
  socket.on('disconnect', function(){
    for (var i = 0; i < users.length; i++) {
      if (users[i].id==socket.id) {
        var name=users[i].name;
        users.splice(i,1);
        break;
      }
    }
    var logoutTime=getDateTime();
    var save="User: "+name+". Out of work: "+logoutTime+"\n";
    fs.appendFile('users logs/'+name+'.txt', save, function (err) {
      if (err) throw err;
        console.log('Saved!');
    });
    console.log(getTimePassed(socket.loginTime, logoutTime));

  });
  socket.on('position', function(dat){
    var data = JSON.parse(dat);
    if(data.pos!=null){
      var markers = JSON.parse(fs.readFileSync('markers.json', 'utf8'));
      var j = 0;
      var gps=true;
      while (j< markers.length) {
        if (gps && geometry.computeDistanceBetween(new geometry.LatLng( markers[j].lat, markers[j].lng ),new geometry.LatLng( data.pos.lat, data.pos.lng )) <= 50){
          if (data.work!=null && data.work) {
            console.log("In!");
            socket.loginTime=getDateTime();
            var save="User: "+data.user+". In work: "+socket.loginTime+"\n";
            fs.appendFile('users logs/'+data.user+'.txt', save, function (err) {
              if (err) throw err;
              console.log('Saved!');
            });
          }
          j=markers.length;
        } 
        else {
          if(data.work!=null && !data.work && j+1==markers.length){
            console.log("Out!");
            var logoutTime=getDateTime();
            var save="User: "+data.user+". Out of work: "+logoutTime+"\n";
            fs.appendFile('users logs/'+data.user+'.txt', save, function (err) {
              if (err) throw err;
              console.log('Saved!');
            });
            console.log(getTimePassed(socket.loginTime, logoutTime));
          }
        }
        j++
      }
    }
    fs.writeFileSync('markers.json', JSON.stringify(markers));
  });
});

https.listen(port, function(){
  console.log('listening on *: '+port);
});

function getSavedMarkers(){
  return JSON.parse(fs.readFileSync('markers.json', 'utf8'));
}
function getDateTime() {
  var date = new Date();

  var hour = date.getHours();
  hour = (hour < 10 ? "0" : "") + hour;

  var min  = date.getMinutes();
  min = (min < 10 ? "0" : "") + min;

  var sec  = date.getSeconds();
  sec = (sec < 10 ? "0" : "") + sec;

  var year = date.getFullYear();

  var month = date.getMonth() + 1;
  month = (month < 10 ? "0" : "") + month;

  var day  = date.getDate();
  day = (day < 10 ? "0" : "") + day;

  return year + ":" + month + ":" + day + ":" + hour + ":" + min + ":" + sec;
}
function getTimePassed(loginDate, logoutDate){
  var diff = Math.abs(new Date(loginDate) - new Date(logoutDate));
  return diff;
}