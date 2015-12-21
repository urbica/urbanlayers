var foursquare = (require('foursquarevenues'))('MJ3XTQDYT4QXDQWTI2QHY1CI3NCJSCGTZRNPBM2AM0W44GC3', 'JWWZX01NLTHJR52JNDWTIQTUBFURZ1Z4Q5ZVNSGEZ2JJBMTW');
var fs = require('fs');
var turf = require('turf');

var data = [],
    orderedData = [],
    cellWidth = 0.05,
    buffer = 2,
    units = 'kilometers',
    outputFile = "_50m_2km",
    current = 0,
    sum = 0,
    loc = 4; //current location

    var locations = [
      { name: "Варшава", ll: [37.500531,55.820162], prefix: 'varshava' },
      { name: "Восход", ll: [37.771247,55.726543], prefix: 'voshod' },
      { name: "Керчь", ll: [37.664415,55.595754], prefix: 'kerch' },
      { name: "Рассвет", ll: [37.518301,55.824050], prefix: 'rassvet' },
      { name: "Дом", ll: [37.554187,55.67428], prefix: 'dom' }
    ];

    	  var params = {
    		    ll: locations[loc].ll[1] + "," + locations[loc].ll[0],
            radius: 150,
            intent: "browse",
            limit: 50
    	    };


    //empty geojson
    var geoJSON = {
    "type": "FeatureCollection",
    "crs": { "type": "name", "properties": { "name": "urn:ogc:def:crs:OGC:1.3:CRS84" } },
    "features": []
    };




    //calculate boundinx box
    var bbox = turf.extent(turf.buffer(turf.point(locations[loc].ll), buffer, units));
    var grid = turf.pointGrid(bbox, cellWidth, units);

    console.log('grid: ' + grid.features.length + ' points');



    var p; //for props



  function getData() {
    if(current < grid.features.length) {

      foursquare.getVenues(params, function(error, venues) {
      	if (!error) {
            //console.log(JSON.stringify(grid.features[current]));

           params.ll = grid.features[current].geometry.coordinates[1] + ',' + grid.features[current].geometry.coordinates[0];
      	   console.log('point: ' + current + ' venues: ' + venues.response.venues.length);

           sum += venues.response.venues.length;

           venues.response.venues.forEach(function(v) {
             if(!data[v.id]) {
               data[v.id] = v.id;
               //orderedData.push(v);

               //setting the properties
               p = {
                 id: v.id,
                 name: v.name,
                 category: getCat(v.categories),
                 address: v.location.formattedAddress,
                 checkins: v.stats.checkinsCount,
                 users: v.stats.usersCount,
                 tips: v.stats.tipCount
               };

               //writing data into json
               geoJSON.features.push(turf.point([v.location.lng,v.location.lat], p));


               //console.log(v.id);
             }
           });
           current ++;
           getData();
      	}
      });
    } else {
      console.log('venues loaded: ' + sum);
      console.log('venues written: ' + geoJSON.features.length);

      fs.writeFile(locations[loc].prefix + "_" + outputFile + ".geojson", JSON.stringify(geoJSON), function(err) {
        if(err) {
          return console.log(err);
        }
          console.log("The JSON file was saved");
        });

    }
  }

  function getCat(categories) {
    var cat = '';
    categories.forEach(function(c) {
      if(c.primary) cat = c.shortName;
    });
    return cat;
  }

  //start scrapping
  getData();
