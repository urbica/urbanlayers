var request = require("request");
var fs = require('fs');
var turf = require('turf');

//var extent = [37.35,55.56,37.87,55.94]; //- all moscow
var extent = [37.606,55.731,37.640,55.752];
var cellWidth = 0.1,
 units = 'kilometers',
 routerUrl = "http://127.0.0.1:5001/table?",
 currentSrc = 0,
 currentDst = 0,
 lines = 0,
 pointsOutput = "matrix/points_matrix.csv",
 matrixOutput = "matrix/matrix.csv",
 gridOutput = "matrix/grid.geojson"
 logOutput = "matrix/output.log",
 startTime = new Date(), currentTime = new Date(), chunkTime  = new Date(), estimate = new Date();

var hexGrid = turf.hexGrid(extent, cellWidth, units);
console.log('Start time: ' + startTime);
console.log('Num cells: ' + hexGrid.features.length);

//starting log
var logStream = fs.createWriteStream(logOutput);

//filling the iDs for cells
var pointsStream = fs.createWriteStream(pointsOutput);
hexGrid.features.forEach(function(d,i) {
  d.properties = { id: i }
  var point = turf.centroid(d);
  pointsStream.write(i + '\t' + point.geometry.coordinates[0] + '\t' + point.geometry.coordinates[1] + '\n');
});
pointsStream.end();

var matrixStream = fs.createWriteStream(matrixOutput);

writeData();
console.log(Date.now());

//start
matrixStream.write('src\tdst\ttime\n');
routeRequest();

function routeRequest() {
  var total_distance = 0,
      total_time = 0;

  if(currentSrc < hexGrid.features.length) {
    var source = hexGrid.features[currentSrc];
    var sourcePoint = turf.centroid(source);

    if(currentDst < hexGrid.features.length) {
      var destination = hexGrid.features[currentDst];
      var destinationPoint = turf.centroid(destination);
    //console.log(centroidPt);

      request({
        url: routerUrl + 'loc=' + sourcePoint.geometry.coordinates[1] + ',' + sourcePoint.geometry.coordinates[0] +'&loc=' + destinationPoint.geometry.coordinates[1] + ',' + destinationPoint.geometry.coordinates[0],
        json: true
      }, function (error, response, body) {
        if (!error && response.statusCode === 200) {


            //total_time = Math.round(body.route_summary.total_time/60); //convert in minutes
            total_time = Math.round(body.distance_table[0][1]/600);

            //writing data
            matrixStream.write(currentSrc + '\t' + currentDst + '\t' + total_time + '\n');
            lines++;

            //next destination
            currentDst++;



            //next request
            routeRequest();


        } else console.log(error);
    });


  } else {

    //time
    currentTime = new Date();

    currentSrc++;

    chunkTime = (currentTime.getTime() - startTime.getTime())/currentSrc; //now; //currentTime.getTime() - now.getTime();
    estimate = (hexGrid.features.length*chunkTime - currentSrc*chunkTime);

    console.log(currentSrc + '/' + hexGrid.features.length + ' time left, s: ' + Math.round(estimate/1000));
    logStream.write(currentSrc + '/' + hexGrid.features.length + ' time left, s: ' + Math.round(estimate/1000) + '\n');

    currentDst = 0; //emptying destination id

    routeRequest();
    }
  } else {

    //end of matrix stream
    matrixStream.end();


    console.log('CSV:' + lines + ' written.');
    logStream.write('CSV:' + lines + ' written. \n');
    logStream.end();

    writeData();
    console.log('Done');
  }

}



function writeData() {
  fs.writeFile(gridOutput, JSON.stringify(hexGrid), function(err) {
    if(err) {
      return console.log(err);
    }
      console.log("The JSON file was saved");
    });
}
