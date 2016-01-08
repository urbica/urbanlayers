var labels = {
  en_US: { query: 'cafe', m: 'm', map: 'Map', satellite: 'Satellite', found: 'Found', not_found: 'Nothing found', page: 'Page on Yandex.Maps', url: 'http://maps.yandex.com' },
  ru_RU: { query: 'кафе', m: 'м', map: 'Карта', satellite: 'Спутник', found: 'Найдено', not_found: 'Ничего не найдено', page: 'Страница на Яндекс.Картах', url: 'http://maps.yandex.ru' }
};

var l = 'en_US'; //default lang



ymaps.ready(function() {

var x = d3.scale.linear()
    .domain([0,24])
    .range([0,360]);

var xAxis = d3.svg.axis()
      .scale(x)
      .orient("bottom");

var hoursChart = d3.select("#graph").append("svg").attr("width", 400).attr("height", 90);

var mapType = d3.select("#mapType").text(labels[l].map).on('click', function() { reColor('light'); }),
    satType = d3.select("#satType").text(labels[l].satellite).on('click', function() { reColor('dark'); });


// Define the div for the tooltip
var tooltip = d3.select("body").append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);


var start = [37.633877,55.75436]; //starting point

var params = {
  apikey: '6a6d6520-a9d5-4d64-889e-de25e17bbe9d',
  text: labels[l].query, //'ресторан',
  lang: l, //'ru_RU'
  ll: start.join(),
  spn: '0.1,0.05',
  results: 200
};

  var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  var daysLabels = {
      'ru_RU': ['ПН', 'ВТ', 'СР', 'ЧТ', 'ПТ', 'СБ', 'ВС'],
      'en_US': ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  };

  var colors = {
    'light': { foreground: '#000', background: "#fff" },
    'dark': { foreground: '#fff', background: "#000" }
  };


  var jsonData, //source loaded data
      filteredFeatures; //data after filters

  var hoursStats, fr,to, total; //vars for time graps

//poniter params
  var distance = 1350, //in meters
      minDistance = 90,
      maxDistance = 2700,
      bearing = 90,
      units = 'kilometers',
      minX, maxX, currentX;

	//creating the map
  var map = new ymaps.Map('map', {
	   center: start,
	    zoom: 14,
	    controls: [] //['typeSelector']
  });

  var circle = new ymaps.Circle([start,distance], { }, {
  fillOpacity: 0,
  strokeColor: "#000",
  strokeWidth: 2,
  strokeOpacity: 0.7
  });
  map.geoObjects.add(circle);


  var companyInfoTemplate = ymaps.templateLayoutFactory.createClass(
             '<h3>{{ properties.name }}</h3>' +
             '~ {{ properties.distance }} м </br>' +
             '<a href='+labels[l].url+'/org/{{ properties.CompanyMetaData.id }} target=_blank>' + labels[l].page + '</a>');

  var dataLayer = new ymaps.ObjectManager({
      clusterize: false
    });



  dataLayer.objects.options.set({
    hasBalloon: true,
    balloonContentLayout: companyInfoTemplate,
    iconLayout: 'default#image',
    iconImageHref: 'dot-light.svg',
    iconImageSize: [18, 18],
    iconImageOffset: [-9, -9]
  });

//  dataLayer.objects.options.set('preset', 'islands#greenDotIcon');
  map.geoObjects.add(dataLayer);

  function getPosition(dist) {
    return (turf.destination(turf.point(start), dist/1000, bearing, units)).geometry.coordinates;
  }

  function getPositionX(dist) {
    return (turf.destination(turf.point(start), dist/1000, bearing, units)).geometry.coordinates[0];
  }

  function updatePointer() {
    circle.geometry.setRadius(distance);
    pointer.properties.set('distance', Math.round(distance));
  }

  function checkGeometry() {
    var x = dragGeometry[0];
    if(dragGeometry[0] <= getPositionX(minDistance)) x = getPositionX(minDistance);
    if(dragGeometry[0] >= getPositionX(maxDistance)) x = getPositionX(maxDistance);
    return [x,start[1]];
  }

  var dragGeometry = getPosition(distance);

  var  pointerLayouts = [];

  pointerLayouts['light'] = ymaps.templateLayoutFactory.createClass('<span id="pointer" class="pointer-light"> {{properties.distance }}&nbsp;'+ labels[l].m +'</span>');
  pointerLayouts['dark'] = ymaps.templateLayoutFactory.createClass('<span id="pointer" class="pointer-dark"> {{properties.distance }}&nbsp;'+ labels[l].m +'</span>');

  var  pointer = new ymaps.Placemark(getPosition(distance), {
        distance: 100
        }, {
          iconLayout: pointerLayouts['light'],
          iconShape: {
            type: 'Rectangle',
            coordinates: [[-24, -12], [24, 12]]
          },
          draggable: true
        });

  pointer.events.add("drag", function(e) {
    dragGeometry = pointer.geometry.getCoordinates();
    pointer.geometry.setCoordinates(checkGeometry());
    distance = Math.round(turf.distance(turf.point(start),turf.point(checkGeometry()))*1000);
    processData();
  });
  map.geoObjects.add(pointer);


  var input = d3.select("#input").property("value", labels[l].query);
  var indicator = d3.select("#indicator");

  input.on('keydown', function() {
      if(d3.event.keyCode == 13) {
        params.text = input.property("value");
        requestData();
      }
    });

  function reColor(mode) {
    console.log(mode);
    if(mode == "light") {
      map.setType('yandex#map');
      mapType.attr("class", "type-selected");
      satType.attr("class", "type");
    } else {
      map.setType('yandex#satellite');
      mapType.attr("class", "type");
      satType.attr("class", "type-selected");
    }

    circle.options.set('strokeColor', colors[mode].foreground); //re-coloring circle
    dataLayer.objects.options.set('iconImageHref', 'dot-'+mode+'.svg');
    pointer.options.set('iconLayout', pointerLayouts[mode]);
    d3.select("#pointer").attr("class", "pointer-"+mode);
  }


  function requestData() {

    //setting new center to search
    start = map.getCenter();
    params.ll = start.join(',');

    //update pointers position
    circle.geometry.setCoordinates(start,distance);
//    circle.geometry.setRadius(distance);
    pointer.geometry.setCoordinates(getPosition(distance));

    dataLayer.removeAll();


    $.ajax({
      url: "https://search-maps.yandex.ru/v1/?",
      jsonp: "callback",
      dataType: "jsonp",
      data: params,

      //response
      success: function(response) {

          //adding CompanyMetaData to the features
          response.data.features.forEach(function(feature,i) {
            jQuery.extend(feature.properties, feature.properties.CompanyMetaData);
            feature.properties['distance'] = Math.round(turf.distance(feature, turf.point(start), "kilometers")*1000);
            feature['id'] = i;
          });
          jsonData = response.data;
          processData(); // process loaded data
          console.log(map.getType());
      }
    });

    }

  function filterByDistance(f) {
      return (f.properties['distance'] <= distance);
  }

  function processData() {

    //updating pointer position
    updatePointer();

    //remove all objects in the collection
    dataLayer.removeAll();

    //applying time filter
    filteredFeatures = jsonData.features.filter(filterByDistance);
    dataLayer.add(filteredFeatures);

    indicator.text(function() {
      if(filteredFeatures.length>0)
        return labels[l].found + ": " + filteredFeatures.length;
      else
        return labels[l].not_found;

    });

    hoursStats = [];
    days.forEach(function(d) {
      hoursStats[d] = [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0]; //Dummy hours
    });

    distanceStats = [];
    hoursCalculated = 0;

    total = filteredFeatures.length;

    //calculate working hours statistics
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
        .attr("transform", "translate(35,70)")
        .call(xAxis);

    var daysAxis = hoursChart.append("g");
    var blocks = hoursChart.append("g").attr("transform", "translate(35,0)");

    days.forEach(function(day,id) {

      daysAxis.append("text")
        .attr("transform", "translate(0,-2)")
        .attr("x", 10 )
        .attr("y", (id*10+10))
        .attr("class", "dayLabel")
        .text(daysLabels[l][id]);

//      if(hoursStats[day])
      hoursStats[day].forEach(function(hourStat, ih) {
      //  console.log(day + ': ' + ih + ' — ' + hourStat);
      if(hourStat > 0)
        blocks
          .append("rect")
          .attr("width", 14.99)
          .attr("height", 9)
          .attr("transform", function(d, i) { return "translate(" + (ih*15) + "," + (id*10) + ")"; })
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


  //start
  requestData();


});
