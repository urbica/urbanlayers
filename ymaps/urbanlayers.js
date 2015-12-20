
var locations = [
  { name: "Варшава", ll: [37.500531,55.820162], prefix: 'varshava' },
  { name: "Восход", ll: [37.771247,55.726543], prefix: 'voshod' }
];

currentLocation = 0;
currentTime = 60;

ymaps.ready(function() {


var x = d3.scale.linear()
    .domain([0,23])
    .range([0,480]);

var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

var locationsMenu = d3.select("#searchLocations");
var timesMenu = d3.select("#searchTimes");


var hoursDiv = d3.select("#hoursStats");
var distancesDiv = d3.select("#distancesStats")
var hoursChart = hoursDiv.append("svg").attr("width", 560).attr("height", 118);

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


//var start = [37.771247, 55.726543]; //восход
var start = [37.500531,55.820162]; //варшава

var params = {
  apikey: '6a6d6520-a9d5-4d64-889e-de25e17bbe9d',
  text: 'ресторан',
  lang: 'ru_RU',
  ll: '37.500531,55.820162',
  spn: '0.05,0.05',
  results: 200,
  callback: 'processData'
};

var zonesTimes = [5,10,15,20,30,45,60];
var zonesColors = {
  '5': '#253494',
  '10': '#2c7fb8',
  '15': '#41b6c4',
  '20': '#7fcdbb',
  '30': '#c7e9b4',
  '35': '#ffffcc',
  '60': '#ffffcc'
}

var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

var jsonData, filteredData, zonesJson, filteredFeatures = []; //global source data

	//создаём карту с центром в Москве, на 11 масштабе с дефолтным набором элементов управления
	var map = new ymaps.Map('map', {
		center: start,
		zoom: 15,
		controls: ['typeSelector']
	});


  zones = new ymaps.GeoObjectCollection(null, {	});
  map.geoObjects.add(zones);


  var companyInfoTemplate = ymaps.templateLayoutFactory.createClass(
           '<h3>{{ properties.name|default:"Заголовок" }}</h3>' +
           '~ {{ properties.time_min|default:"??" }} – {{ properties.time_max|default:"??" }} минут пешком' +
           ' '
  );

  clusterer = new ymaps.Clusterer({
            preset: 'islands#blackClusterIcons',
            groupByCoordinates: true,
            clusterDisableClickZoom: true,
            clusterHideIconOnBalloonOpen: false,
            geoObjectHideIconOnBalloonOpen: false
        });
  map.geoObjects.add(clusterer);



	//создаём геоколлекцию, с заданными параметрами значка метки
	collection = new ymaps.GeoObjectCollection(null, {
  	 preset: 'islands#circleDotIcon',
     iconColor: '#555',
     balloonContentLayout: companyInfoTemplate
   }, {

   });

   collection.events.add('click', function (e) {
    var object = e.get('target');
    console.log(object);
  });
  map.geoObjects.add(collection);


  locations.forEach(function(l,i) {
    locationsMenu.append("div")
      .attr("class", "location")
      .attr("id", l.prefix)
      .text(l.name)
      .on('click', function() {
        changeLocation(i);
      });
  });

  zonesTimes.forEach(function(t) {
    timesMenu.append("div")
      .attr("class", function() {
        if(t == currentTime) return "time-selected";
          else return "time";
      })
      .attr("id", "time-"+t)
      .text(t)
      .on('click', function() {
        changeTimeFilter(t);
      });
  });



  var searchInput = d3.select("#searchInput");

  searchInput.on('keydown', function() {
      if(d3.event.keyCode == 13) {
        params.text = searchInput.property("value");
        requestData();
      }
    });

    function changeTimeFilter(t) {
      //log(t);

      zonesTimes.forEach(function(l) {
        d3.select("#time-"+l).attr("class", "time");
      });
      d3.select("#time-"+t).attr("class", "time-selected");

      currentTime = t;

      if(jsonData) drawData();
    }

    function changeLocation(loc) {

      console.log(locations[loc]);

        locations.forEach(function(l) {
          d3.select("#"+l.prefix).attr("class", "location");
        });
        d3.select("#"+locations[loc].prefix).attr("class", "location-selected");

        //loading json zones
        jQuery.getJSON('data/' + locations[loc].prefix + '_zones.geojson', function(json) {

        //store zones into global
        zonesJson = json;
        zones.removeAll();

        json.features.forEach(function(feature) {
        if(feature.properties['time_max']<=35) {
          var opacity = 1 - feature.properties['time_max']/35;
          //console.log(opacity);
          var polygon = new ymaps.Polygon(feature.geometry.coordinates[0], {
          hintContent: feature.properties['time_max'],
          balloonContent: feature.properties['time_max']
          }, {
          fillColor: zonesColors[feature.properties['time_max']],
          interactivityModel: 'default#transparent',
          strokeOpacity: 0.5,
          strokeColor: '#555',
          strokeWidth: 0.5,
          opacity: opacity
          });
          zones.add(polygon);
        }

        });

        //re-request data

//        requestData();
        params.ll = locations[loc].ll[0] + ',' + locations[loc].ll[1];
        map.setCenter(locations[loc].ll, 14);
        requestData();


      });

    }

    function requestData() {
    // Using YQL and JSONP
    $.ajax({
      url: "https://search-maps.yandex.ru/v1/?",
      jsonp: "callback",
      dataType: "jsonp",
      data: params,

      // Work with the response
      success: function(response) {


          //adding CompanyMetaData to the features
          response.data.features.forEach(function(feature,i) {
            jQuery.extend(feature.properties, feature.properties.CompanyMetaData);
            //feature.properties['time_max'] = '100';
          });

          jsonData = turf.tag(response.data, zonesJson, 'time_max', 'time_max');
          drawData(); // render data
      }
    });

    }

  function drawData() {

    //remove all objects in the collection
    clusterer.removeAll();

    filteredData = jsonData;
    console.log(jsonData.features.length);


    var filteredFeatures;
//    filteredData.features.forEach(function(f) {});


    filteredFeatures = filteredData.features.filter(function (feature) {
      return feature.properties['time_max'] <= currentTime;
    });


    //setting filtered features
    //filteredData.features = filteredFeatures;


    var hoursStats = [];
    days.forEach(function(d) {
      hoursStats[d] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; //Dummy hours
    });

    var distanceStats = [];
    var hoursCalculated = 0;

    var fr,to, total = filteredFeatures.length;

    filteredFeatures.forEach(function(feature) {

      //calculate days array
      if(feature.properties.Hours) {
        hoursCalculated ++;

        feature.properties.Hours.Availabilities.forEach(function(a) {
          if(a['Everyday']) {
            if(a['TwentyFourHours']) {
              days.forEach(function(d) {
                for(h=0; h<24; h++) {
                  hoursStats[d][h]++;
                }
              });
            } else {
              if(a.Intervals) {
                a.Intervals.forEach(function(inrvl) {
                  fr = +inrvl.from.substr(0,2);
                  to = +inrvl.to.substr(0,2);
                  if(to == 0) { to = 24; }
                  days.forEach(function(d) {
                    for(h=fr; h<to; h++) { hoursStats[d][h]++; }
                  });
                });
              }
            }
          } else {
            days.forEach(function(d) {
              if(a[d] && a.Intervals) {
                a.Intervals.forEach(function(inrvl) {
                  fr = +inrvl.from.substr(0,2);
                  to = +inrvl.to.substr(0,2);
                  if(to == 0) { to = 24; }
                    for(h=fr; h<to; h++) { hoursStats[d][h]++; }
                });
              }
            });
          }

        });

      }

      if(!distanceStats[feature.properties['time_max']]) {
        distanceStats[feature.properties['time_max']] = 1;
      } else {
        distanceStats[feature.properties['time_max']]++;
      }


      //add feature to the map
      //console.log(feature.properties);
      var placemark = new ymaps.Placemark(feature.geometry.coordinates, {
        name: feature.properties['name'],
        balloonContentHeader: feature.properties['name'],
        balloonContent: getBallonContent(feature.properties),
        time_max: feature.properties['time_max'],
        time_min: (feature.properties['time_max']-5)
      }, {
      // Задаем стиль метки (метка в виде круга).
      iconLayout: 'default#image',
      iconImageHref: 'dot.svg',
      iconImageSize: [18, 18],
      iconImageOffset: [-9, -9]
      //preset: "islands#dotCircleIcon",
      // Задаем цвет метки (в формате RGB).
      //iconColor: zonesColors[feature.properties['time_max']]
      });
      clusterer.add(placemark);
    });

    //stats
    drawHours(hoursStats,hoursCalculated);
    drawDistances(distanceStats);

    //tagging objects inside
    //ymaps.geoQuery(filteredData).addTo(collection);

  }

  function getBallonContent(props) {
    var s = '';

    if(props.Categories) {
    s += '<div class="categories">';
    props.Categories.forEach(function (c) {
      s += '<span>' + c.name + '</span>';
    });
    s += '</div>';
    }
    s += '<div class="distances">~' + + props['time_max'] + ' мин.</div>';
    return s;
  }

  function drawHours(hoursStats,total) {
    hoursChart.text("");

    hoursChart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(80,98)")
        .call(xAxis);

    var daysAxis = hoursChart.append("g");
    var blocks = hoursChart.append("g").attr("transform", "translate(80,0)");

    days.forEach(function(day,id) {

      daysAxis.append("text")
        .attr("x", 10 )
        .attr("y", (id*14+10))
        .attr("class", "dayLabel")
        .text(day);


      hoursStats[day].forEach(function(hourStat, ih) {
      //  console.log(day + ': ' + ih + ' — ' + hourStat);
        blocks
          .append("rect")
          .attr("width", 20.1)
          .attr("height", 13.5)
          .attr("transform", function(d, i) { return "translate(" + (ih*20) + "," + (id*14) + ")"; })
          .style("opacity", hourStat/total)
          .style("fill", "#00AAAA")
          .on("mouseover", function(d) {
            tooltip
              .style("opacity", .9)
              .text(day + ' ' + ih + ':00  ' +  hourStat + '/' + total)
                .style("left", (d3.event.pageX) + "px")
                .style("top", (d3.event.pageY - 28) + "px");
            })
          .on("mouseout", function(d) {
            tooltip.style("opacity", 0);
          });
      });
    });
  }

 function drawDistances(distances) {
   distancesDiv.text("");
   var blocks = distancesDiv.append("svg").attr("width", 140).attr("height", 108);
   var barBlocks = blocks.append("g");

   blocks.selectAll("svg");

   var dd = 0;
   var scale = 100/d3.max(distances);
   for(dist in distances) {
     barBlocks.append("rect")
      .style("fill", "#00AAAA")
      .attr("width", distances[dist]*scale)
      .attr("height", 13.5)
      .attr("transform", "translate(20, "+ dd*14 +")")
      .on("mouseover", function(d) {
        tooltip
          .style("opacity", .9)
          .text(dist + "': " + distances[dist] )
            .style("left", (d3.event.pageX) + "px")
            .style("top", (d3.event.pageY - 28) + "px");
        })
      .on("mouseout", function(d) {
        tooltip.style("opacity", 0);
      });

      barBlocks.append("text")
        .attr("x", 0)
        .attr("y", (dd*14+10))
        .attr("class", "dayLabel")
        .text(dist + "'");

        barBlocks.append("text")
          .attr("x", distances[dist]*scale+24)
          .attr("y", (dd*14+8))
          .attr("class", "dayLabel")
          .text(distances[dist]);

      dd++;
   }

 }

//starting
changeLocation(currentLocation);

});
