var zonesColors = {
  '5': '#de2d26',
  '10': '#fc9272',
  '15': '#fee0d2',
  '20': '#fee0d2'
}

var poiIconSmall = L.icon({ iconUrl: 'poiSmall.svg', iconSize: [5, 5], iconAnchor:   [3, 3], popupAnchor:  [-3, -3] });
var poiIconBig = L.icon({ iconUrl: 'poiSmall.svg', iconSize: [5, 5], iconAnchor:   [8, 8], popupAnchor:  [-8, -8] });
var busIcon = L.icon({ iconUrl: 'bus.svg', iconSize: [25, 22], iconAnchor:   [10, 10], popupAnchor:  [-10, -10] });
var subwayIcon = L.icon({ iconUrl: 'metro.svg', iconSize: [25, 22], iconAnchor:   [10, 10], popupAnchor:  [-10, -10] });



function getDensity(p) {
  var o = p/1600;
  var c = '#efedf5';
  if(o>0.4) c = '#bcbddc';
  if(o>0.6) c = '#756bb1';
  return { fillOpacity: o, fillColor: c };
}



var start = [55.798551,49.106324],
    map = L.map('map', {
      zoomControl: false,
      center: start,
      //drawControl: true,
      zoom: 13
    });

 var gis = L.tileLayer('https://tile1.maps.2gis.com/tiles?x={x}&y={y}&z={z}&v=1', {
    attribution: '© 2ГИС',
    maxZoom: 18
}).addTo(map);

var sputnik = L.tileLayer('http://tiles.maps.sputnik.ru/{z}/{x}/{y}.png?_time=1456323513614', {
   attribution: '© Спутник',
   maxZoom: 18
});

var rosreestr = L.tileLayer('http://a.maps.rosreestr.ru/arcgis/rest/services/BaseMaps/BaseMap/MapServer/tile/{z}/{y}/{x}', {
   attribution: '© Росреестр',
   maxZoom: 18
});


//http://a.maps.rosreestr.ru/arcgis/rest/services/BaseMaps/BaseMap/MapServer/tile/7/39/79
//https://vec03.maps.yandex.net/tiles?l=map&v=4.57.1&x=19823&y=10270&z=15&scale=2&lang=ru_RU
var yndx = new L.Yandex();
//console.log(yndx);
//yndx.addTo(map);


var competitors = L.layerGroup([]),
    poiSmall = L.layerGroup([]).addTo(map),
    poiBig = L.layerGroup([]),
    population = L.layerGroup([]),
    transport = L.layerGroup([]),
    districts = L.layerGroup([]),
    districtsLabels = L.layerGroup([]),
    districtsPies = L.layerGroup([]);


var heatmap = L.heatLayer([], {
  radius: 50,
  blur: 40,
  minOpacity: 0.3,
  max: 1,
  gradient: {
    '0': 'rgba(43,131,186,0)',
    '0.2': 'rgba(43,131,186,0.3)',
    '0.4': 'rgba(171,221,164,0.3)',
    '0.6': 'rgba(253,200,66,0.2)',
    '0.9': 'rgba(225,25,28,0.3)'
  }
});


var baseMaps = {
        "2 ГИС": gis,
        "Яндекс": yndx,
        "Спутник": sputnik,
        "Росреестр": rosreestr
    };

var overlayMaps = {
        "POI": competitors,
        "Население": population,
        "Население(районы)": L.layerGroup([districts,districtsLabels]),
        "Транспорт": transport
//        "Районы": districts,
//        "Хитмап": heatmap,
//        "По районам": L.layerGroup([districts,districtsLabels]),
 };

 L.control.layers(baseMaps, overlayMaps).addTo(map);

var temathicLayers = {
  layer1: { id: 'layer1', label: 'Конкуренты', layer: poiBig },
  layer111: { id: 'layer1', label: 'Конкуренты-мини', layer: poiSmall },
  layer2: { id: 'layer2', label: 'Население', layer: population },
  layer3: { id: 'layer3', label: 'Активное население', layer: population },
  layer4: { id: 'layer4', label: 'Общественный транспорт', layer: transport },
  layer7: { id: 'layer7', label: 'Коммерческая недвижимость (аренда)', layer: transport },
  layer8: { id: 'layer8', label: 'Коммерческая недвижимость (продажа)', layer: transport },
  layer10: { id: 'layer10', label: 'Центры поддержки субъектов МСП', layer: population },
  layer11: { id: 'layer11', label: 'Центры госуслуг', layer: population },
  layer12: { id: 'layer12', label: 'Инновационные центры', layer: population }
};

var layersMenu = d3.select("#layersContent");
for(k in temathicLayers) {
  var layer = layersMenu.append("div").attr("class", "layer").attr("id", k);
  layer.append("div").attr("class", "icon");
  layer.append("div").attr("class", "caption").text(temathicLayers[k].label);

  layer.on('click', function(e) {

//    console.log(this.id);
    showLayer(this.id);
    //switch off all layers
  });
}

function showLayer(id) {
  temathicLayers[id].layer.addTo(map);
  /*
  for(kk in temathicLayers) {
    if(id == kk) {
      console.log(kk + ': ' + id);
      temathicLayers[id].layer.addTo(map);
      console.log(temathicLayers[id].layer);
    } else {
      map.removeLayer(temathicLayers[kk].layer);
    }
  } */
}

function formatNumber(n) {
  if(n) {
  var s = Math.round(n).toString(),
    o;

  if(s.length>3) {
    o =  s.substring(0,(s.length-3)) + "&nbsp;" + s.substring(s.length,(s.length-3));
  } else {
    o = s;
  }
  return o;
  } else { return ' '; }
}

//public transport
d3.json('data/kazan_stop.geojson', function(data) {
  L.geoJson(data, {
    onEachFeature: function (f, layer) {
      L.marker([f.geometry.coordinates[1],f.geometry.coordinates[0]], {icon: busIcon }).addTo(transport);
      L.circleMarker([f.geometry.coordinates[1],f.geometry.coordinates[0]], {
        radius: 50,
        //radius: Math.sqrt(layer.feature.properties.capacity)*4,
        fillColor: "#3A88E2",
        stroke: false,
        fillOpacity: 0.3
      })
      .addTo(transport);
    }
  });
});

//load POI
d3.json('data/kazan_poi_osm.geojson', function(data) {

  //all points
  L.geoJson(data, {
    onEachFeature: function (feature, layer) {
      L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]], {icon: poiIconSmall}).addTo(poiSmall);
      L.marker([feature.geometry.coordinates[1],feature.geometry.coordinates[0]], {icon: poiIconBig}).addTo(poiBig);
    }
  });

});

//load population
d3.json("data/kazan_house_2.geojson", function(data) {
  data.features.forEach(function(f) {
    //console.log(f.properties);
    var c = 10; //Math.sqrt(f.properties.flats_qnt*1.5);
    L.circleMarker([f.geometry.coordinates[1],f.geometry.coordinates[0]], {
      radius: getPopulationCircle(f.properties.rooms_int),
      //radius: Math.sqrt(layer.feature.properties.capacity)*4,
      fillColor: "#9013FE",
      stroke: false,
      fillOpacity: 0.65
    })
    .bindPopup('<b>' + f.properties.ADDRESS +
      '</b><br/>Площадь (жилая):&nbsp;' + f.properties.area_int
      + '<br/>Квартир:&nbsp;' + f.properties.rooms_int
      + '<br/>Население:&nbsp;' + Math.round(2.7*f.properties.rooms_int*2.7) + '<br/>')
    .addTo(population);
  });
});


//load districts
d3.json("data/kazan_districts_pop.geojson", function(data) {
  data.features.forEach(function(f) {
  });
  L.geoJson(data, {
    onEachFeature: function (feature, layer) {
      var label = L.divIcon({
        className: 'label',
        iconSize:null,
        html: formatNumber(feature.properties.houses*2.7)
      });
      var pos = turf.centroid(feature);
      var popup = feature.properties.name + '&nbsp;(' + formatNumber(feature.properties.houses*2.7) + '&nbsp;жителей)';
      console.log(feature);
      layer.bindPopup(popup);
      L.marker([pos.geometry.coordinates[1],pos.geometry.coordinates[0]],{icon: label})
        .bindPopup(popup)
        .addTo(districtsLabels);
    },
    style: function(feature) {
      return { fillColor: "#9013FE", fillOpacity: getDistrictOpacity(feature.properties.houses*2.7), color: "#FFFFFF", weight: 1 };
    }
  })
  .addTo(districts);
});

function format(q) {
  return Math.round(q);
}

map.on('zoomend', function(e) {
  checkZoom();
});

function checkZoom() {
  if(map.getZoom()>12) {
    poiBig.addTo(map);
    map.removeLayer(poiSmall);
  } else {
    poiSmall.addTo(map);
    map.removeLayer(poiSmall);
  }
}

function getDistrictOpacity(p) {
  var o = 0;
  if(p<1000) o = 0.25;
  if(p>1000) o = 0.6;
  if(p>2000) o = 0.9;
  return o;
}

function getPopulationCircle(p) {
  var r = 0;
//  if()
//  console.log(p);
  //return Math.sqrt(p*2.7);

  if(p< 50) r = 4;
  if(p >= 50 && p < 100) r = 8;
  if(p > 100) r = 15;

  return r;

}
