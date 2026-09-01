/**
 * Schedule Module - Timetable management
 */
const ScheduleModule = (function () {
  let viewMode = 'week';
  let currentWeekStart = getMonday(new Date());
  let currentDay = new Date();
  let editingCourse = null;
  let selectedWeekdays = [];

  const COURSE_COLORS = [
    '#FF5A5A', '#FF8A5E', '#FFC107', '#4CAF50',
    '#3F9EFF', '#8E44AD', '#FF7043', '#5BB8D8',
    '#FF55AA', '#00BCD4', '#FF6347', '#64B5F6',
  ];

  function init() {
    bindScheduleEvents();
    populatePeriodSelects();
    renderColorPicker();
    render();
  }

  function getMonday(d) {
    const date = new Date(d);
    const day = date.getDay();
    const diff = date.getDate() - day + (day === 0 ? -6 : 1);
    date.setDate(diff);
    date.setHours(0, 0, 0, 0);
    return date;
  }

  function toStr(d) {
    return d.getFullYear() + '-' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' +
      String(d.getDate()).padStart(2, '0');
  }

  function getWeekNum(startDate, targetDate) {
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0);
    const target = new Date(targetDate);
    target.setHours(0, 0, 0, 0);
    return Math.floor((target - start) / (7 * 24 * 60 * 60 * 1000)) + 1;
  }

  function dayToCol(dayOfWeek) {
    return dayOfWeek === 0 ? 9 : 2 + dayOfWeek;
  }

  function bindScheduleEvents() {
    document.getElementById('weekViewBtn').addEventListener('click', () => {
      viewMode = 'week';
      document.getElementById('weekViewBtn').classList.add('active');
      document.getElementById('dayViewBtn').classList.remove('active');
      document.getElementById('weekNav').style.display = 'flex';
      document.getElementById('dayNav').style.display = 'none';
      render();
    });
    document.getElementById('dayViewBtn').addEventListener('click', () => {
      viewMode = 'day';
      document.getElementById('dayViewBtn').classList.add('active');
      document.getElementById('weekViewBtn').classList.remove('active');
      document.getElementById('weekNav').style.display = 'none';
      document.getElementById('dayNav').style.display = 'flex';
      currentDay = new Date();
      render();
    });
    document.getElementById('prevWeek').addEventListener('click', () => {
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() - 7);
      render();
    });
    document.getElementById('nextWeek').addEventListener('click', () => {
      currentWeekStart = new Date(currentWeekStart);
      currentWeekStart.setDate(currentWeekStart.getDate() + 7);
      render();
    });
    document.getElementById('prevDay').addEventListener('click', () => {
      currentDay = new Date(currentDay);
      currentDay.setDate(currentDay.getDate() - 1);
      render();
    });
    document.getElementById('nextDay').addEventListener('click', () => {
      currentDay = new Date(currentDay);
      currentDay.setDate(currentDay.getDate() + 1);
      render();
    });
    document.getElementById('fabAddCourse').addEventListener('click', () => {
      editingCourse = null;
      resetCourseForm();
      document.getElementById('courseModalTitle').textContent = '\u6DFb\u52A0\u8BFE\u7A0B';
      document.getElementById('deleteCourseBtn').style.display = 'none';
      document.getElementById('courseModal').classList.add('show');
    });
  }

  function populatePeriodSelects() {
    const startSel = document.getElementById('courseStartPeriod');
    const endSel = document.getElementById('courseEndPeriod');
    const times = window.PERIOD_TIMES;
    startSel.innerHTML = '';
    endSel.innerHTML = '';
    times.forEach((p) => {
      const opt1 = new Option('第' + p.num + '节 ' + p.start + '-' + p.end, p.num);
      const opt2 = new Option('第' + p.num + '节 ' + p.start + '-' + p.end, p.num);
      startSel.appendChild(opt1);
      endSel.appendChild(opt2);
    });
    startSel.value = '1';
    endSel.value = '1';
  }

  function renderColorPicker() {
    const picker = document.getElementById('colorPicker');
    picker.innerHTML = '';
    COURSE_COLORS.forEach((color, i) => {
      const el = document.createElement('div');
      el.className = 'color-swatch' + (i === 0 ? ' selected' : '');
      el.style.background = color;
      el.dataset.color = color;
      el.addEventListener('click', () => {
        picker.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
        el.classList.add('selected');
      });
      picker.appendChild(el);
    });
  }

  function render() {
    const semesterStart = DataStore.getSemesterStart();
    const notice = document.getElementById('semesterNotice');
    const gridWrapper = document.getElementById('scheduleGridWrapper');
    if (!semesterStart) {
      notice.style.display = 'block';
      gridWrapper.style.display = 'none';
      return;
    }
    notice.style.display = 'none';
    gridWrapper.style.display = 'block';
    if (viewMode === 'week') renderWeekGrid(semesterStart);
    else renderDayGrid(semesterStart);
  }

  function renderWeekGrid(semesterStart) {
    const grid = document.getElementById('scheduleGrid');
    const wrapper = document.getElementById('scheduleGridWrapper');
    const courses = DataStore.getCourses();
    const weekNum = getWeekNum(semesterStart, currentWeekStart);
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    document.getElementById('weekLabel').textContent =
      toStr(currentWeekStart).slice(5) + ' ~ ' + toStr(weekEnd).slice(5);
    const thisWeekNum = getWeekNum(semesterStart, new Date());
    const todayWeekday = new Date().getDay();
    const isCurrentWeek = weekNum === thisWeekNum;
    const oldHeader = wrapper.querySelector('.schedule-date-header');
    if (oldHeader) oldHeader.remove();
    const headerEl = document.createElement('div');
    headerEl.className = 'schedule-date-header';
    const gap1 = document.createElement('div');
    gap1.className = 'date-header-gap';
    headerEl.appendChild(gap1);
    const gap2 = document.createElement('div');
    gap2.className = 'date-header-gap';
    headerEl.appendChild(gap2);
    const dayNames = ['\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D', '\u5468\u65E5'];
    const weekdays = [1, 2, 3, 4, 5, 6, 0];
    for (let i = 0; i < 7; i++) {
      const dayOfWeek = weekdays[i];
      const isToday = isCurrentWeek && dayOfWeek === todayWeekday;
      const cell = document.createElement('div');
      cell.className = 'date-header-cell' + (isToday ? ' today' : '');
      const dDate = new Date(currentWeekStart);
      dDate.setDate(dDate.getDate() + i);
      cell.innerHTML = dayNames[i] + '<br>' + (dDate.getMonth() + 1) + '/' + dDate.getDate();
      headerEl.appendChild(cell);
    }
    wrapper.insertBefore(headerEl, grid);
    grid.className = 'schedule-grid week-grid';
    grid.innerHTML = '';
    const sections = [
      { label: '\u4E0A<br>\u5348', rowStart: 1, rowEnd: 6 },
      { label: '\u4E0B<br>\u5348', rowStart: 6, rowEnd: 10 },
      { label: '\u665A<br>\u4E0A', rowStart: 10, rowEnd: 12 },
    ];
    sections.forEach(sec => {
      const el = document.createElement('div');
      el.className = 'time-section-label';
      el.style.gridRow = sec.rowStart + '/' + sec.rowEnd;
      el.style.gridColumn = '1';
      el.innerHTML = sec.label;
      grid.appendChild(el);
    });
    for (let p = 1; p <= 11; p++) {
      const el = document.createElement('div');
      el.className = 'period-label';
      el.style.gridRow = p;
      el.style.gridColumn = '2';
      el.textContent = p;
      grid.appendChild(el);
    }
    const cells = [];
    courses.forEach(course => {
      const days = Array.isArray(course.days) ? course.days : JSON.parse(course.days || '[]');
      const range = App.parseWeekRange(course.weekRange);
      if (!range || weekNum < range[0] || weekNum > range[1]) return;
      const startP = parseInt(course.startPeriod);
      const endP = parseInt(course.endPeriod);
      days.forEach(dayOfWeek => {
        const col = dayToCol(dayOfWeek);
        cells.push({ rowStart: startP, rowEnd: endP + 1, col: col, course: course });
      });
    });
    cells.forEach(cell => {
      const el = document.createElement('div');
      el.className = 'course-cell week-card';
      el.style.gridRow = cell.rowStart + '/' + cell.rowEnd;
      el.style.gridColumn = cell.col;
      el.style.background = cell.course.color;
      el.dataset.courseId = cell.course.id;
      const room = cell.course.room
        ? '<div class="course-room">' + App.escHtml(cell.course.room) + '</div>'
        : '';
      el.innerHTML = '<div class="course-name">' + App.escHtml(cell.course.name) + '</div>' + room;
      el.addEventListener('click', (e) => { e.stopPropagation(); editCourse(cell.course.id); });
      grid.appendChild(el);
    });
  }

  function renderDayGrid(semesterStart) {
    const grid = document.getElementById('scheduleGrid');
    const wrapper = document.getElementById('scheduleGridWrapper');
    const courses = DataStore.getCourses();
    const dayOfWeek = new Date(currentDay).getDay();
    const dayNum = getWeekNum(semesterStart, currentDay);
    const today = new Date();
    const isToday = toStr(currentDay) === toStr(today);
    const dayNames = ['\u5468\u65E5', '\u5468\u4E00', '\u5468\u4E8C', '\u5468\u4E09', '\u5468\u56DB', '\u5468\u4E94', '\u5468\u516D'];
    const dayLabel = isToday ? '\u4ECA\u5929' : dayNames[dayOfWeek] + ' ' + (currentDay.getMonth() + 1) + '/' + currentDay.getDate();
    document.getElementById('dayLabel').textContent = dayLabel;
    const oldHeader = wrapper.querySelector('.schedule-date-header');
    if (oldHeader) oldHeader.remove();
    const headerEl = document.createElement('div');
    headerEl.className = 'schedule-date-header day-header';
    const gap1 = document.createElement('div');
    gap1.className = 'date-header-gap';
    headerEl.appendChild(gap1);
    const gap2 = document.createElement('div');
    gap2.className = 'date-header-gap';
    headerEl.appendChild(gap2);
    const cell = document.createElement('div');
    cell.className = 'date-header-cell' + (isToday ? ' today' : '');
    cell.innerHTML = dayNames[dayOfWeek] + '<br>' + (currentDay.getMonth() + 1) + '/' + currentDay.getDate();
    headerEl.appendChild(cell);
    wrapper.insertBefore(headerEl, grid);
    grid.className = 'schedule-grid day-grid';
    grid.innerHTML = '';
    const sections = [
      { label: '\u4E0A<br>\u5348', rowStart: 1, rowEnd: 6 },
      { label: '\u4E0B<br>\u5348', rowStart: 6, rowEnd: 10 },
      { label: '\u665A<br>\u4E0A', rowStart: 10, rowEnd: 12 },
    ];
    sections.forEach(sec => {
      const el = document.createElement('div');
      el.className = 'time-section-label';
      el.style.gridRow = sec.rowStart + '/' + sec.rowEnd;
      el.style.gridColumn = '1';
      el.innerHTML = sec.label;
      grid.appendChild(el);
    });
    for (let p = 1; p <= 11; p++) {
      const el = document.createElement('div');
      el.className = 'period-label';
      el.style.gridRow = p;
      el.style.gridColumn = '2';
      el.textContent = p;
      grid.appendChild(el);
    }
    const dayCourses = courses.filter(c => {
      const days = Array.isArray(c.days) ? c.days : JSON.parse(c.days || '[]');
      if (!days.includes(dayOfWeek)) return false;
      const range = App.parseWeekRange(c.weekRange);
      return range && dayNum >= range[0] && dayNum <= range[1];
    });
    dayCourses.forEach(course => {
      const startP = parseInt(course.startPeriod);
      const endP = parseInt(course.endPeriod);
      const times = window.PERIOD_TIMES;
      const timeStr = times[startP - 1].start + '-' + times[endP - 1].end;
      const el = document.createElement('div');
      el.className = 'course-cell day-card';
      el.style.gridRow = startP + '/' + (endP + 1);
      el.style.gridColumn = '3';
      el.style.background = course.color;
      el.dataset.courseId = course.id;
      let html = '<div class="course-name">' + App.escHtml(course.name) + '</div>';
      html += '<div class="course-time">' + timeStr + '</div>';
      if (course.room) html += '<div class="course-room">' + App.escHtml(course.room) + '</div>';
      if (course.teacher) html += '<div class="course-teacher">' + App.escHtml(course.teacher) + '</div>';
      if (course.weekRange) html += '<div class="course-weeks">' + App.escHtml(course.weekRange) + '\u5468</div>';
      el.innerHTML = html;
      el.addEventListener('click', (e) => { e.stopPropagation(); editCourse(course.id); });
      grid.appendChild(el);
    });
  }

  function editCourse(courseId) {
    const courses = DataStore.getCourses();
    const course = courses.find(c => c.id === courseId);
    if (!course) return;
    editingCourse = course;
    document.getElementById('courseModalTitle').textContent = '\u7F16\u8F91\u8BFE\u7A0B';
    document.getElementById('deleteCourseBtn').style.display = 'block';
    document.getElementById('courseName').value = course.name;
    document.getElementById('courseRoom').value = course.room || '';
    document.getElementById('courseTeacher').value = course.teacher || '';
    document.getElementById('courseStartPeriod').value = course.startPeriod;
    document.getElementById('courseEndPeriod').value = course.endPeriod;
    document.getElementById('weekStart').value = '';
    document.getElementById('weekEnd').value = '';
    if (course.weekRange) {
      const range = App.parseWeekRange(course.weekRange);
      if (range) {
        document.getElementById('weekStart').value = range[0];
        document.getElementById('weekEnd').value = range[1];
      }
    }
    const days = Array.isArray(course.days) ? course.days : JSON.parse(course.days || '[]');
    selectedWeekdays = days;
    document.querySelectorAll('.weekday-btn').forEach(btn => {
      const dayVal = parseInt(btn.dataset.day);
      btn.classList.toggle('selected', days.includes(dayVal));
    });
    document.querySelectorAll('.color-swatch').forEach(sw => {
      sw.classList.toggle('selected', sw.dataset.color === course.color);
    });
    document.getElementById('courseModal').classList.add('show');
  }

  function resetCourseForm() {
    document.getElementById('courseName').value = '';
    document.getElementById('courseRoom').value = '';
    document.getElementById('courseTeacher').value = '';
    document.getElementById('courseStartPeriod').value = '1';
    document.getElementById('courseEndPeriod').value = '1';
    document.getElementById('weekStart').value = '';
    document.getElementById('weekEnd').value = '';
    selectedWeekdays = [];
    document.querySelectorAll('.weekday-btn').forEach(b => b.classList.remove('selected'));
    document.querySelectorAll('.color-swatch').forEach((s, i) => {
      s.classList.toggle('selected', i === 0);
    });
  }

  document.addEventListener('click', (e) => {
    if (e.target.classList.contains('weekday-btn')) {
      const day = parseInt(e.target.dataset.day);
      if (selectedWeekdays.includes(day)) {
        selectedWeekdays = selectedWeekdays.filter(d => d !== day);
        e.target.classList.remove('selected');
      } else {
        selectedWeekdays.push(day);
        selectedWeekdays.sort();
        e.target.classList.add('selected');
      }
    }
  });
  document.getElementById('confirmCourse').addEventListener('click', () => {
    const name = document.getElementById('courseName').value.trim();
    if (!name) { showToast('Please enter course name'); return; }
    if (selectedWeekdays.length === 0) { showToast('Please select at least one day'); return; }
    const startP = document.getElementById('courseStartPeriod').value;
    const endP = document.getElementById('courseEndPeriod').value;
    if (parseInt(startP) > parseInt(endP)) { showToast('Start period cannot be after end period'); return; }
    const weekStartVal = document.getElementById('weekStart').value.trim();
    const weekEndVal = document.getElementById('weekEnd').value.trim();
    if (!weekStartVal || !weekEndVal || isNaN(parseInt(weekStartVal)) || isNaN(parseInt(weekEndVal))) {
      showToast('请输入完整的起止周次');
      return;
    }
    const selectedColor = document.querySelector('.color-swatch.selected');
    const color = selectedColor ? selectedColor.dataset.color : COURSE_COLORS[0];
    const courseData = {
      name,
      room: document.getElementById('courseRoom').value.trim(),
      teacher: document.getElementById('courseTeacher').value.trim(),
      days: selectedWeekdays,
      startPeriod: startP,
      endPeriod: endP,
      weekRange: weekStartVal + '-' + weekEndVal,
      color,
    };
    const courses = DataStore.getCourses();
    if (editingCourse) {
      const idx = courses.findIndex(c => c.id === editingCourse.id);
      if (idx >= 0) courses[idx] = { ...courses[idx], ...courseData };
      showToast('Course updated');
    } else {
      courses.push({ id: Date.now(), ...courseData });
      showToast('Course added');
    }
    DataStore.saveCourses(courses);
    document.getElementById('courseModal').classList.remove('show');
    render();
  });
  document.getElementById('deleteCourseBtn').addEventListener('click', () => {
    if (!editingCourse) return;
    if (!confirm('Delete this course?')) return;
    let courses = DataStore.getCourses();
    courses = courses.filter(c => c.id !== editingCourse.id);
    DataStore.saveCourses(courses);
    document.getElementById('courseModal').classList.remove('show');
    render();
    showToast('Course deleted');
  });

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  }

  return { init, render };
})();

document.addEventListener('DOMContentLoaded', () => {
  ScheduleModule.init();
});
