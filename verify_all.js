const fs = require('fs');

const css = fs.readFileSync('D:\\AI项目\\xx\\css\\style.css', 'utf-8');
const js = fs.readFileSync('D:\\AI项目\\xx\\js\\app.js', 'utf-8');
const html = fs.readFileSync('D:\\AI项目\\xx\\index.html', 'utf-8');

const checks = [
  ['FAB position: fixed', css.includes('position: fixed;') && css.indexOf('.fab {') < css.indexOf('position: fixed')],
  ['FAB z-index: 100', css.includes('z-index: 100')],
  ['FAB coral bg', css.includes('background: var(--accent);') && css.indexOf('.fab {') < css.indexOf('background: var(--accent)')],
  ['No dead visibility rules', !css.includes('#page-expense #fabAdd')],
  ['toggleFAB in JS', js.includes('function toggleFAB')],
  ['toggleFAB called in init', js.includes("toggleFAB('home')")],
  ['toggleFAB called in switchPage', js.includes("toggleFAB(pageName)")],
  ['updateClock in JS', js.includes('function updateClock')],
  ['setInterval for clock', js.includes('setInterval(updateClock, 1000)')],
  ['home-clock in HTML', html.includes('id="homeClock"')],
  ['home-title removed', !html.includes('class="home-title"')],
  ['home-clock CSS', css.includes('.home-clock {')],
  ['font-weight 300', css.substring(css.indexOf('.home-clock {'), css.indexOf('\n}', css.indexOf('.home-clock {'))).includes('font-weight: 300')],
  ['fabAdd before nav', html.indexOf('fabAdd') > 0 && html.indexOf('fabAdd') < html.indexOf('bottom-nav')],
  ['fabAddCourse before nav', html.indexOf('fabAddCourse') > 0 && html.indexOf('fabAddCourse') < html.indexOf('bottom-nav')],
];

let allOk = true;
checks.forEach(([name, ok]) => {
  if (!ok) allOk = false;
  console.log(ok ? 'OK' : 'FAIL', '-', name);
});
console.log('\n' + (allOk ? 'ALL PASSED' : 'SOME FAILED'));
