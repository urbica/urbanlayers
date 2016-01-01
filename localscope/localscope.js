
ymaps.ready(function() {

var x = d3.scale.linear()
    .domain([0,24])
    .range([0,240]);

var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

var hoursChart = d3.select("#hoursStats").append("svg").attr("width", 560).attr("height", 88);

// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var start = [37.633877,55.75436];
//viewport area in coordinates
//var extent = [[37.51,55.65],[-37.70,55.81]];

//specifying projection
var projection = d3.geo.mercator()
	.center(start)
	.scale(50000);


var params = {
  apikey: '6a6d6520-a9d5-4d64-889e-de25e17bbe9d',
  text: 'ресторан',
  lang: 'ru_RU',
  ll: start.join(),
  spn: '0.1,0.05',
  results: 200
};

var filter = {
  minutes: 15
};

var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
var zones = [5,10,15,20,25,30];

var jsonData, //source loaded data
    filteredData, filteredFeatures; //data after filters

var hoursStats, pointsScope, pointsCloud, distancesStats;

	//creating the map
var map = new ymaps.Map('map', {
	center: start,
	zoom: 15,
	controls: ['typeSelector']
});

  var zonesLayer = new ymaps.GeoObjectCollection(null,{
    fillColor: "#555",
    fillOpacity: 0.05,
    strokeColor: "#555",
    strokeWidth: 1,
    strokeOpacity: 0.3
  });
  map.geoObjects.add(zonesLayer);

  var companyInfoTemplate = ymaps.templateLayoutFactory.createClass(
             '<h3>{{ properties.name|default:"Заголовок" }}</h3>' +
             '~ {{ properties.distance }} м' +
             ' '
    );

  var dataLayer = new ymaps.ObjectManager({
      clusterize: false
    });

  // Можно задавать опции напрямую в дочерние коллекции.
  /*
    dataLayer.clusters.options.set({
      preset: 'islands#blackClusterIcons',
      groupByCoordinates: false,
      hintContentLayout: ymaps.templateLayoutFactory.createClass('Группа объектов')
    });
  */


  dataLayer.objects.options.set({
    hasBalloon: true,
    balloonContentLayout: companyInfoTemplate,
    iconLayout: 'default#image',
    iconImageHref: 'dot.svg',
    iconImageSize: [18, 18],
    iconImageOffset: [-9, -9]
  });

//  dataLayer.objects.options.set('preset', 'islands#greenDotIcon');
  map.geoObjects.add(dataLayer);

  var searchInput = d3.select("#searchInput");
  var timeSlider = d3.select("#timeSlider").on("change", function() {
    timeIndicator.text(timeSlider.property("value"));
    filter.minutes = timeSlider.property("value");
    processData();
  });
  var timeIndicator = d3.select("#timeIndicator");

  searchInput.on('keydown', function() {
      if(d3.event.keyCode == 13) {
        params.text = searchInput.property("value");
        requestData();
      }
    });

  //start
  requestData();


  function requestData() {



    //setting new center to search
    start = map.getCenter();
    params.ll = start.join(',');

    zonesLayer.removeAll();
    zones.forEach(function(z,i) {
      var circle = new ymaps.Circle([start, z*90], {}, {});
      //console.log(z*90);
      zonesLayer.add(circle);
    });


    $.ajax({
      url: "https://search-maps.yandex.ru/v1/?",
      jsonp: "callback",
      dataType: "jsonp",
      data: params,

      //response
      success: function(response) {

        //console.log(response);


          //adding CompanyMetaData to the features
          response.data.features.forEach(function(feature,i) {
            jQuery.extend(feature.properties, feature.properties.CompanyMetaData);
            feature.properties['distance'] = Math.round(turf.distance(feature, turf.point(start), "kilometers")*1000);
            feature['id'] = i;
          });
          jsonData = response.data;
          processData(); // process loaded data
      }
    });

    }

  function filterByDistance(f) {

      return (f.properties['distance'] <= filter.minutes*90);
    }

  function processData() {

    //remove all objects in the collection
    dataLayer.removeAll();

    //dataLayer.add(jsonData);

    console.log(jsonData.features.length);
    filteredFeatures = jsonData.features.filter(filterByDistance);
    console.log(filteredFeatures.length);
    dataLayer.add(filteredFeatures);



    //console.log(dataLayer.objects.getAll());
    //dataLayer.add(jsonData.features);
    filteredFeatures.forEach(function(f) {
    //  console.log(f);
    //  dataLayer.add(f);
    });
    console.log(dataLayer.objects.getAll());
    //clusterer.add(filteredFeatures);
    //console.log(dataLayer.objects.getAll());
    //objectManager.removeAll();
    //objectManager.add(jsonData);

    hoursStats = [];
    days.forEach(function(d) {
      hoursStats[d] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; //Dummy hours
    });

    distanceStats = [];
    hoursCalculated = 0;

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
                    if(fr<to) {
                      for(h=fr; h<to; h++) { hoursStats[d][h]++; }
                    } else {
                      for(h=0; h<to; h++) { hoursStats[d][h]++; }
                      for(h=fr; h<24; h++) { hoursStats[d][h]++; }
                    }
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
                  if(fr<to) {
                    for(h=fr; h<to; h++) { hoursStats[d][h]++; }
                  } else {
                    for(h=0; h<to; h++) { hoursStats[d][h]++; }
                    for(h=fr; h<24; h++) { hoursStats[d][h]++; }
                  }
                });
              }
            });
          }

        });

      }

    });

      //rendering stats graph
      drawGraphs(hoursStats,hoursCalculated);

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
    return s;
  }

  function drawGraphs(hoursStats,total) {
    hoursChart.text("");

    hoursChart.append("g")
        .attr("class", "x axis")
        .attr("transform", "translate(180,70)")
        .call(xAxis);

    var daysAxis = hoursChart.append("g");
    var blocks = hoursChart.append("g").attr("transform", "translate(180,0)");
    var pointsTest = d3.select("#test").append("svg")
      .attr("width", 100).attr("height", 100)
    var location = projection(start);
    projection.center(start);
    console.log(location);

    hoursChart.append("g")
      .attr("class", "pointsCloud")
      .attr("width", 100).attr("height", 100)
      .attr("transform", "translate(-430,-220)")
      .selectAll("circle")
      .data(filteredFeatures)
      .enter()
      .append("circle")
       .attr("cx", function(d) {

         var lon = projection(d.geometry.coordinates)[0];
         console.log("x: " + lon);
         return lon;
       })
       .attr("cy", function(d) {
         var lat = projection(d.geometry.coordinates)[1];
         console.log("y: " + lat);
         return lat;
       })
  	   .style("fill", "#333")
       .style("opacity", 1)
  	   .style("stroke-width", 0)
       .attr("r", 3);



    days.forEach(function(day,id) {

      daysAxis.append("text")
        .attr("transform", "translate(100,0)")
        .attr("x", 10 )
        .attr("y", (id*10+10))
        .attr("class", "dayLabel")
        .text(day);


      hoursStats[day].forEach(function(hourStat, ih) {
      //  console.log(day + ': ' + ih + ' — ' + hourStat);
        blocks
          .append("rect")
          .attr("width", 9.99)
          .attr("height", 9.5)
          .attr("transform", function(d, i) { return "translate(" + (ih*10) + "," + (id*10) + ")"; })
          .style("opacity", hourStat/total)
          .style("fill", "#333")
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


});
