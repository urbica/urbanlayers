var request = require("request");
var fs = require('fs');
var turf = require('turf');


var cellWidth = 0.1;
var extent = [37.29,55.50,37.92,55.93]; //- all moscow
var buffer = 6,
    units = 'kilometers',
    lines = 0,
    contourSteps = [5,10,15,20,30],
    routerUrl = "http://127.0.0.1:5000/table?",
    inputFile = "input/subway_stations.geojson",
    outputPoints = "output/subway_stations_points.geojson",
    outputGrid = "output/subway_stations_grid.geojson",
    outputContours = "output/subway_stations_contours.geojson";
    outputSplines = "output/subway_stations_splines.geojson";

var start, grid, points, contours, lines, splines, centroid, buffered, bbox, filteredPoints;

    grid = turf.squareGrid(extent, cellWidth, units);
    points = turf.featurecollection([]);
    contours = turf.featurecollection([]);
    splines = turf.featurecollection([]);

var currentCell = 0,
    currentPoint = 0,
    cellId = 0,
    skipped = 0, routed = 0;

var jsonData = JSON.parse(fs.readFileSync(inputFile, 'utf8')),
    pointsCount = jsonData.features.length;


console.log(pointsCount + ' input points. ' + (new Date()));
console.log(grid.features.length + ' cells.');

//preparing points grid
grid.features.forEach(function(f,i) {
  f.properties['id'] = i;
  points.features.push(turf.centroid(f));
  points.features[i].properties = f.properties;
});



//staring here
nextPoint();

function nextPoint() {
  if(currentPoint < pointsCount) {

    currentCell = 0;
    //filteredPoints.features = [];
    start = jsonData.features[currentPoint].geometry.coordinates;

    bbox = turf.buffer(jsonData.features[currentPoint], buffer, units);
    filteredPoints = turf.within(points, bbox);

    routeRequest();

  } else {
    //the end
   writeData();
   console.log('all:' + lines + ' routed: ' + routed);

  }
}

function makeContours() {
  var poly,spline, contourPoints, feature, splineFeature;

  contourSteps.forEach(function(c,i) {
    console.log('making ' + c + ' min contours');
    contourPoints = turf.featurecollection([]);
    contourPoints.features = filteredPoints.features.filter(function (p) {
      return p.properties['time'] <= c;
    });

    poly = turf.concave(contourPoints, 0.5, 'kilometers');
    if(poly) {
    if(poly.geometry.coordinates[0]) {
      spline = turf.bezier(turf.linestring(poly.geometry.coordinates[0]));
      splineFeature = {
        type: "Feature",
        properties: {
          time: c,
          idx: i,
          name: jsonData.features[currentPoint].properties['name'],
          pointId: currentPoint
        },
        geometry: spline.geometry
      };
      splines.features.push(splineFeature);
    } else {
      console.log('something wrong with poly geometry');
    }

    feature = {
      type: "Feature",
      properties: {
        time: c,
        idx: i,
        name: jsonData.features[currentPoint].properties['name'],
        pointId: currentPoint
      },
      geometry: poly.geometry
    };

    contours.features.push(feature);
  } else {
    console.log('Polygon not created ((');
  }

  });
}

//calculate times for the one point
function routeRequest() {
  var total_distance = 0,
      total_time = 0;

  if(currentCell < filteredPoints.features.length) {

    centroid = filteredPoints.features[currentCell];
    cellId = filteredPoints.features[currentCell].properties['id'];

    request({
          url: routerUrl + 'loc=' + start[1] + ',' +  start[0] +'&loc=' + centroid.geometry.coordinates[1] + ',' + centroid.geometry.coordinates[0],
          json: true
        }, function (error, response, body) {
          if (!error && response.statusCode === 200) {
              total_time = Math.round(body.distance_table[0][1]/600);

              if(!grid.features[cellId].properties['time']) {
                grid.features[cellId].properties['time'] = total_time;
                grid.features[cellId].properties['r'] = true;
                points.features[cellId].properties['time'] = total_time;
                points.features[cellId].properties['r'] = true;
              } else {
                if(total_time<grid.features[cellId].properties['time'])
                  grid.features[cellId].properties['time'] = total_time;
                  points.features[cellId].properties['time'] = total_time;
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

    makeContours();
    currentPoint++;
    nextPoint();

  }
}



function writeData() {

  //var breaks = [0, 5, 10, 15, 20, 30, 60];
  //var filteredPoints = turf.filter(pointGrid, 'r', true);
  //console.log('Total points in output:' + filteredPoints.features.length);
//  var isolined = turf.isolines(filteredPoints, 'z', 15, breaks);

  fs.writeFile(outputPoints, JSON.stringify(points), function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("Points JSON file was saved");
    });

  fs.writeFile(outputGrid, JSON.stringify(grid), function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("Grid JSON file was saved");
    });
  fs.writeFile(outputContours, JSON.stringify(contours), function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("Contours JSON file was saved");
    });

    fs.writeFile(outputSplines, JSON.stringify(splines), function(err) {
      if(err) {
        return console.log(err);
      }
        console.log("Splines JSON file was saved");
      });


}
