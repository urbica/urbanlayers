var request = require("request");
var fs = require('fs');
var turf = require('turf');


//var start = [55.820162,37.500531]; //варшава
//var start = [37.771247, 55.726543]; //восход
//var start = [37.500531,55.820162]; //варшава


var cellWidth = 0.1;
var extent = [37.29,55.50,37.92,55.93]; //- all moscow
var buffer = 3,
    units = 'kilometers',
    lines = 0,
    routerUrl = "http://127.0.0.1:5000/table?",
    inputFile = "input/cinema_points.geojson",
    outputFile = "output/isolines_debug.geojson";

var start, startId, color, pt, centroidPt, buffered, bbox, filteredPoints, pointGrid;
    pointGrid = turf.pointGrid(extent, cellWidth, units);

var centroidPt;

var bbox, filteredPoints;


//var matrix = [];

var currentCell = 0,
    currentPoint = 0,
    cellId = 0,
    skipped = 0, routed = 0;

var jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8')),
    pointsCount = jsonData.features.length;

console.log(pointsCount + ' input points. ' + (new Date()));
console.log(pointGrid.features.length + ' points.');

//preparing points grid
pointGrid.features.forEach(function(f,i) {
  f.properties['id'] = i;
  f.properties['time'] = 300;
});



//staring here
nextPoint();

function nextPoint() {
  if(currentPoint < pointsCount) {

    currentCell = 0;
    //filteredPoints.features = [];
    start = jsonData.features[currentPoint].geometry.coordinates;
    //startId = jsonData.features[currentPoint].properties['@id'].replace('node/','');
    //jsonData.features[currentPoint].properties['@id'] = startId;

    bbox = turf.buffer(jsonData.features[currentPoint], buffer, units);
    filteredPoints = turf.within(pointGrid, bbox);

//    console.log(JSON.stringify(withIn));

    routeRequest();

  } else {
    //the end
   writeData();
   console.log('all:' + lines + ' routed: ' + routed);

  }

}

//calculate times for the one point
function routeRequest() {
  var total_distance = 0,
      total_time = 0;

  if(currentCell < filteredPoints.features.length) {

    centroidPt = filteredPoints.features[currentCell];
    cellId = filteredPoints.features[currentCell].properties['id'];

    request({
          url: routerUrl + 'loc=' + start[1] + ',' +  start[0] +'&loc=' + centroidPt.geometry.coordinates[1] + ',' + centroidPt.geometry.coordinates[0],
          json: true
        }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
              total_time = Math.round(body.distance_table[0][1]/600);

              if(!pointGrid.features[cellId].properties['time']) {
                pointGrid.features[cellId].properties['time'] = total_time;
                pointGrid.features[cellId].properties['r'] = true;
              } else {
                if(total_time<pointGrid.features[cellId].properties['time'])
                  pointGrid.features[cellId].properties['time'] = total_time;

              }
              lines++;
              //incrementing
              currentCell++;

              //sucsess
              routed++;

              //next request
              routeRequest();

          } else console.log(error);
      });

  } else {

    console.log(currentPoint + '/' + pointsCount + ': ' + jsonData.features[currentPoint].properties['name'] + ' ' + (new Date()));

    currentPoint++;
    nextPoint();

  }
}



function writeData() {

  var breaks = [0, 5, 10, 15, 20, 30, 60];
  var filteredPoints = turf.filter(pointGrid, 'r', true);
  console.log('Total points in output:' + filteredPoints.features.length);
  var isolined = turf.isolines(pointGrid, 'time', 15, breaks);

  fs.writeFile("output/not_filtered.geojson", JSON.stringify(pointGrid), function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("The JSON file was saved");
    });
}
