const fs = require('fs');
const vm = require('vm');

// Mock forecast where the first day's `high` is missing (undefined)
const mockForecast = [
  { date: '2026-09-22', code: 0, /* high missing */ low: 60, sunset: '2026-09-22T19:12:00' },
  { date: '2026-09-23', code: 2, high: 68, low: 58, sunset: '2026-09-23T19:11:00' },
];

const makeContainer = () => {
  const container = {
    _innerHTML: '',
    children: [],
    appendChild(child) { this.children.push(child); },
    set innerHTML(value) {
      this._innerHTML = value;
      this.children = [];
    },
    get innerHTML() { return this._innerHTML; },
  };
  return container;
};

const elements = {
  forecast: makeContainer(),
  'sunset-times': makeContainer(),
  status: { textContent: '', classList: { add(){}, remove(){}, toggle(){} }, className: '' },
  updated: { textContent: '' },
};

const makeButton = (unit) => {
  const listeners = {};
  const button = {
    dataset: { unit },
    classList: { add(){}, remove(){}, toggle(){} },
    attributes: {},
    setAttribute(name, value) { this.attributes[name] = value; },
    addEventListener(type, fn) { listeners[type] = fn; },
    click() { if (listeners.click) listeners.click({ currentTarget: button }); },
  };
  return button;
};

const buttons = [makeButton('fahrenheit'), makeButton('celsius')];
const document = {
  listeners: {},
  getElementById(id) { return elements[id] || null; },
  querySelectorAll(selector) {
    if (selector === '.unit-btn') return buttons;
    return [];
  },
  createElement(tag) {
    return {
      tagName: tag.toUpperCase(),
      className: '',
      innerHTML: '',
      children: [],
      appendChild(child) { this.children.push(child); },
      setAttribute() {},
    };
  },
  addEventListener(type, fn) { this.listeners[type] = fn; },
};

const context = {
  document,
  window: {},
  fetch: async () => ({
    ok: true,
    json: async () => ({
      daily: {
        time: mockForecast.map(d => d.date),
        weather_code: mockForecast.map(d => d.code),
        temperature_2m_max: mockForecast.map(d => d.high),
        temperature_2m_min: mockForecast.map(d => d.low),
        sunset: mockForecast.map(d => d.sunset),
      },
    }),
  }),
  console,
  Date,
  URLSearchParams,
  Math,
  setTimeout,
  clearTimeout,
};

vm.createContext(context);
vm.runInContext(fs.readFileSync('app.js', 'utf8'), context);

(async () => {
  await vm.runInContext('init()', context);

  const firstCard = elements.forecast.children[0].innerHTML;
  if (!firstCard.includes('—')) {
    console.error('Test failed: expected missing temperature to render em-dash (—).');
    console.error('First card HTML:', firstCard);
    process.exit(1);
  }

  console.log('Minimal inline test passed: missing temperature renders — as fallback.');
})().catch((err) => {
  console.error(err.stack || err.message || err);
  process.exit(1);
});
