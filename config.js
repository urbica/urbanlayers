
var modes = [
  { id: 'markers', name: 'Точки'},
  { id: 'circles', name: '5-мин радиусы'},
  { id: 'clusters', name: 'Кластеры'},
  { id: 'grid', name: 'Сетка'},
  { id: 'heatmap', name: 'Хитмап'}
];

var layers = [
  {
    id: 'varshava_0',
    name: 'Без категории',
    style: {
      'marker-color': '#999999',
      'marker-symbol': 'circle-stroked'
    }
  },
  {
    id: 'varshava_1',
    name: 'Oбразовательные учреждения (общее, профессиональное)',
    style: {
      'marker-color': '#aa4400',
      'marker-symbol': 'college'
    }
  },
  {
    id: 'varshava_2',
    name: 'Учреждения дополнительного образования',
    style: {
      'marker-color': '#99aa33',
      'marker-symbol': 'chemist'
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
    id: 'adult_clinics',
    name: 'Взрослые поликлиники',
    style: {
      'marker-color': '#aa6633',
      'marker-symbol': 'hospital'
    }
  },
  {
    id: 'kids_clinics',
    name: 'Детские поликлиники',
    style: {
      'marker-color': '#0078DD',
      'marker-symbol': 'hospital'
    }
  },
  {
    id: 'milk_kichens',
    name: 'Молочные кухни',
    style: {
      'marker-color': '#444',
      'marker-symbol': 'water'
    }
  }
];
