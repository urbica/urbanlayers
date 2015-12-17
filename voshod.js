var start_point = [55.726543, 37.771247];
var grid_extent = [37.689,55.690,37.803,55.759];

var modes = [
  { id: 'markers', name: 'Точки'},
  { id: 'circles', name: '5-мин радиусы'},
  { id: 'clusters', name: 'Кластеры'},
  { id: 'grid', name: 'Сетка'},
  { id: 'heatmap', name: 'Хитмап'}
];

var layers = [
  {
    id: 'voshod_0',
    name: 'Без категории',
    style: {
      'marker-color': '#999999',
      'marker-symbol': 'circle-stroked'
    }
  },
  {
    id: 'voshod_1',
    name: 'Образование',
    style: {
      'marker-color': '#aa4400',
      'marker-symbol': 'college'
    }
  },
  {
    id: 'voshod_2',
    name: 'Доп. образование',
    style: {
      'marker-color': '#99aa33',
      'marker-symbol': 'chemist'
    }
  },
  {
    id: 'voshod_3',
    name: 'Еда',
    style: {
      'marker-color': '#ff7800',
      'marker-symbol': 'fast-food'
    }
  },
  {
    id: 'voshod_4',
    name: 'Продукты',
    style: {
      'marker-color': '#CC3300',
      'marker-symbol': 'grocery'
    }
  },
  {
    id: 'voshod_5',
    name: 'Непродукты',
    style: {
      'marker-color': '#8878FF',
      'marker-symbol': 'clothing-store'
    }
  },
  {
    id: 'voshod_6',
    name: 'Бытовые услуги',
    style: {
      'marker-color': '#ff78FF',
      'marker-symbol': 'laundry'
    }
  },
  {
    id: 'voshod_7',
    name: 'Медицина',
    style: {
      'marker-color': '#0078DD',
      'marker-symbol': 'hospital'
    }
  },
  {
    id: 'voshod_8',
    name: 'Спорт',
    style: {
      'marker-color': '#F44',
      'marker-symbol': 'pitch'
    }
  },
  {
    id: 'voshod_9',
    name: 'Культура',
    style: {
      'marker-color': '#3AA',
      'marker-symbol': 'theatre'
    }
  },
  {
    id: 'voshod_10',
    name: 'Банки',
    style: {
      'marker-color': '#F44',
      'marker-symbol': 'bank'
    }
  },
  {
    id: 'voshod_11',
    name: 'Инфраструктура',
    style: {
      'marker-color': '#888',
      'marker-symbol': 'city'
    }
  }
];
