var start_point = [55.726543, 37.771247];
var grid_extent = [37.689,55.690,37.803,55.759];

var modes = [
  { id: 'markers', name: 'Точки'},
//  { id: 'circles', name: '5-мин радиусы'},
  { id: 'clusters', name: 'Кластеры'},
  { id: 'grid', name: 'Сетка'},
  { id: 'heatmap', name: 'Хитмап'}
];

var layers = [
  {
    id: '4sq',
    name: 'Форсквер',
    style: {
      'marker-color': '#999999',
      'marker-symbol': 'circle-stroked'
    }
  }
];
