
var modes = [
  { id: 'markers', name: 'Точки'},
  { id: 'circles', name: '5-мин радиусы'},
  { id: 'clusters', name: 'Кластеры'},
  { id: 'grid', name: 'Сетка'},
  { id: 'heatmap', name: 'Хитмап'}
];

var layers = [
  {
    id: 'libraries',
    name: 'Библиотеки',
    style: {
      'marker-color': '#ff7800',
      'marker-symbol': 'library'
    }
  },
  {
    id: 'museums',
    name: 'Музеи',
    style: {
      'marker-color': '#aa4400',
      'marker-symbol': 'museum'
    }
  },
  {
    id: 'kindergardens',
    name: 'Детские сады',
    style: {
      'marker-color': '#ff7800',
      'marker-symbol': 'playground'
    }
  },
  {
    id: 'proforientation',
    name: 'Центры профориентации',
    style: {
      'marker-color': '#CC3300',
      'marker-symbol': 'chemist'
    }
  },
  {
    id: 'womenconsult',
    name: 'Женская консультация',
    style: {
      'marker-color': '#ff78FF',
      'marker-symbol': 'heart'
    }
  },
  {
    id: 'hospitals_adults',
    name: 'Взрослые поликлиники',
    style: {
      'marker-color': '#aa6633',
      'marker-symbol': 'hospital'
    }
  },
  {
    id: 'hospitals_kids',
    name: 'Детские поликлиники',
    style: {
      'marker-color': '#0078DD',
      'marker-symbol': 'hospital'
    }
  }
];
