/**
 * 应用主逻辑 - 导航与全局状态
 */
(function () {
  const pages = ['home', 'expense', 'schedule', 'profile'];
  let currentPage = 'home';

  // 初始化
  function init() {
    applyDarkMode();
    updateHomePage();
    updateClock();
    setInterval(updateClock, 1000);
    setupNavigation();
    setupGlobalModals();

    toggleFAB('home');
  }

  // 应用暗色模式
  function applyDarkMode() {
    const dark = DataStore.getDarkMode();
    document.documentElement.classList.toggle('dark', dark);
    const toggle = document.getElementById('darkModeToggle');
    if (toggle) toggle.checked = dark;
  }

  // 更新首页
  function updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const s = String(now.getSeconds()).padStart(2, '0');
    const el = document.getElementById('homeClock');
    if (el) el.textContent = h + ':' + m + ':' + s;
  }

  function updateHomePage() {
    const now = new Date();
    const opts = { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' };
    document.getElementById('homeDate').textContent = now.toLocaleDateString('zh-CN', opts);

    // 环形进度条
    updateRingProgress();

    // 今日课表
    renderTodaySchedule();
  }

  // 环形进度条
  function updateRingProgress() {
    const expenses = DataStore.getExpenses();
    const budget = DataStore.getBudget();
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    let total = 0;
    expenses.forEach(e => {
      if (e.type === 'expense' && e.date.startsWith(monthKey)) {
        total += e.amount;
      }
    });

    const percent = budget > 0 ? Math.round((total / budget) * 100) : 0;
    const circumference = 2 * Math.PI * 85; // r=85
    const offset = circumference - (Math.min(percent, 100) / 100) * circumference;

    const ring = document.getElementById('ringProgress');
    const percentEl = document.getElementById('ringPercent');
    const emojiEl = document.getElementById('ringEmoji');
    const subtitleEl = document.getElementById('ringSubtitle');
    const labelEl = document.getElementById('ringLabel');

    if (percent > 100) {
      ring.classList.add('exceeded');
      percentEl.textContent = '已超额';
      emojiEl.textContent = '🔥';
      labelEl.textContent = '超出 ¥' + (total - budget).toFixed(2);
      subtitleEl.textContent = '已花 ¥' + total.toFixed(2) + ' / 预算 ¥' + budget.toFixed(2);
      ring.style.stroke = '#FF6B6B';
      document.getElementById("ringContainer").style.color = "#FF6B6B";
    } else {
      ring.classList.remove('exceeded');
      let color = '#8FC9A9';
      if (percent > 50) color = '#FFB49A';
      if (percent > 70) color = '#FF8C61';
      if (percent > 90) color = '#FF6B35';
      ring.style.stroke = color;
      document.getElementById("ringContainer").style.color = color;

      let emoji = '💰';
      if (percent > 80) emoji = '😅';
      percentEl.textContent = percent + '%';
      emojiEl.textContent = emoji;
      labelEl.textContent = '本月支出';
      subtitleEl.textContent = '已花 ¥' + total.toFixed(2) + ' / 预算 ¥' + budget.toFixed(2);
    }

    // 动画：先重置为0%，强制回流，再播放动画
    ring.style.transition = 'none';
    ring.style.strokeDasharray = circumference;
    ring.style.strokeDashoffset = circumference;
    void ring.offsetWidth; // 强制回流
    requestAnimationFrame(() => {
      const duration = percent > 100 ? 0 : 1400;
      ring.style.transition = 'stroke-dashoffset ' + duration + 'ms ease-out, stroke 0.3s';
      ring.style.strokeDashoffset = offset;
    });
  }

  // 今日课表
  function renderTodaySchedule() {
    const courses = DataStore.getCourses();
    const now = new Date();
    const todayWeekday = now.getDay() === 0 ? 0 : now.getDay(); // 0=周日, 1=周一...6=周六，与按钮 data-day 一致

    const semesterStart = DataStore.getSemesterStart();
    const container = document.getElementById('todayScheduleList');

    if (!semesterStart) {
      container.innerHTML = '<div class="empty-state">请先设置学期起始日期</div>';
      return;
    }

    const weekNum = getCurrentWeekNum(semesterStart, now);
    const todayCourses = courses.filter(c => {
      const days = Array.isArray(c.days) ? c.days : JSON.parse(c.days || '[]');
      if (!days.includes(todayWeekday)) return false;
      const range = parseWeekRange(c.weekRange);
      return range && weekNum >= range[0] && weekNum <= range[1];
    });

    if (todayCourses.length === 0) {
      container.innerHTML = '<div class="empty-state">今天没课，好好休息～</div>';
      return;
    }

    container.innerHTML = '';
    todayCourses.forEach(course => {
      const card = document.createElement('div');
      card.className = 'today-course-card';
      const startEnd = getPeriodTime(course.startPeriod, course.endPeriod);
      card.innerHTML = `
        <div class="today-course-bar" style="background:${course.color}"></div>
        <div class="today-course-info">
          <div class="today-course-name">${escHtml(course.name)}</div>
          <div class="today-course-meta">${startEnd}${course.room ? ' · ' + course.room : ''}</div>
        </div>
      `;
      container.appendChild(card);
    });
  }

  // 导航切换
  function setupNavigation() {
    document.querySelectorAll('.nav-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        if (page === currentPage) return;
        switchPage(page);
      });
    });
  }

  function switchPage(pageName) {
    const idx = pages.indexOf(pageName);
    const currentIdx = pages.indexOf(currentPage);
    const direction = idx > currentIdx ? 1 : -1;

    const currentEl = document.getElementById('page-' + currentPage);
    const nextEl = document.getElementById('page-' + pageName);

    currentEl.style.transform = 'translateX(' + (-30 * direction) + 'px)';
    currentEl.style.opacity = '0';

    nextEl.style.transform = 'translateX(' + (30 * direction) + 'px)';
    nextEl.style.opacity = '0';

    requestAnimationFrame(() => {
      nextEl.style.transition = 'transform 0.25s ease-in-out, opacity 0.25s ease-in-out';
      nextEl.style.transform = 'translateX(0)';
      nextEl.style.opacity = '1';
      nextEl.classList.add('active');
      nextEl.style.zIndex = '2';

      currentEl.classList.remove('active');
      currentEl.style.zIndex = '1';
    });

    document.querySelectorAll('.nav-item').forEach(b => b.classList.remove('active'));
    document.querySelector('.nav-item[data-page="' + pageName + '"]').classList.add('active');
    currentPage = pageName;

    // 刷新页面数据
    if (pageName === 'home') updateHomePage();
    // Show/hide FAB buttons based on active page
    toggleFAB(pageName);
    if (pageName === 'expense') ExpenseModule.refresh();
    if (pageName === 'schedule') ScheduleModule.render();
    if (pageName === 'profile') ProfileModule.refresh();
  }

  // 全局弹窗关闭
  function setupGlobalModals() {
    document.querySelectorAll('[data-close]').forEach(el => {
      el.addEventListener('click', () => {
        el.closest('.modal').classList.remove('show');
      });
    });
  }

  // 工具函数
  function getCurrentWeekNum(semesterStartStr, targetDate) {
    const start = new Date(semesterStartStr);
    start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    const diff = Math.floor((target - start) / (7 * 24 * 60 * 60 * 1000));
    return Math.max(1, diff + 1);
  }

  function parseWeekRange(str) {
    if (!str) return null;
    const m = String(str).match(/(\d+)\s*[-～到]\s*(\d+)/);
    if (!m) return null;
    return [parseInt(m[1]), parseInt(m[2])];
  }

  function getPeriodTime(start, end) {
    const times = PERIOD_TIMES;
    const s = times[parseInt(start) - 1];
    const e = times[parseInt(end) - 1];
    if (!s || !e) return '';
    return s.start + '-' + e.end;
  }

  function escHtml(str) {
    const d = document.createElement('div');
    d.textContent = str || '';
    return d.innerHTML;
  }

  // 周期时间表
  window.PERIOD_TIMES = [
    { num: 1, start: '8:20', end: '9:05' },
    { num: 2, start: '9:10', end: '9:55' },
    { num: 3, start: '10:05', end: '10:50' },
    { num: 4, start: '10:55', end: '11:40' },
    { num: 5, start: '11:45', end: '12:30' },
    { num: 6, start: '13:30', end: '14:15' },
    { num: 7, start: '14:20', end: '15:05' },
    { num: 8, start: '15:10', end: '15:55' },
    { num: 9, start: '16:00', end: '16:45' },
    { num: 10, start: '18:15', end: '19:00' },
    { num: 11, start: '19:05', end: '19:50' },
  ];

  function toggleFAB(pageName) {
    const fabAdd = document.getElementById('fabAdd');
    const fabCourse = document.getElementById('fabAddCourse');
    if (pageName === 'expense') {
      fabAdd.style.display = 'flex';
      fabCourse.style.display = 'none';
    } else if (pageName === 'schedule') {
      fabAdd.style.display = 'none';
      fabCourse.style.display = 'flex';
    } else {
      fabAdd.style.display = 'none';
      fabCourse.style.display = 'none';
    }
  }

  window.App = {
    init,
    switchPage,
    getCurrentWeekNum,
    parseWeekRange,
    getPeriodTime,
    escHtml,
    PERIOD_TIMES,
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
