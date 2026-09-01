/**
 * 数据存储层 - localStorage
 */
const DataStore = {
  KEYS: {
    EXPENSES: 'student_expenses',
    COURSES: 'student_courses',
    BUDGET: 'student_budget',
    DARK_MODE: 'student_dark_mode',
    SEMESTER_START: 'student_semester_start',
    LAST_WARNING_80: 'student_warning_80',
    LAST_WARNING_100: 'student_warning_100',
  },

  getExpenses() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.EXPENSES)) || [];
    } catch { return []; }
  },

  saveExpenses(arr) {
    localStorage.setItem(this.KEYS.EXPENSES, JSON.stringify(arr));
  },

  getCourses() {
    try {
      return JSON.parse(localStorage.getItem(this.KEYS.COURSES)) || [];
    } catch { return []; }
  },

  saveCourses(arr) {
    localStorage.setItem(this.KEYS.COURSES, JSON.stringify(arr));
  },

  getBudget() {
    return parseFloat(localStorage.getItem(this.KEYS.BUDGET)) || 0;
  },

  saveBudget(val) {
    localStorage.setItem(this.KEYS.BUDGET, String(val));
  },

  getDarkMode() {
    return localStorage.getItem(this.KEYS.DARK_MODE) === '1';
  },

  setDarkMode(val) {
    localStorage.setItem(this.KEYS.DARK_MODE, val ? '1' : '0');
  },

  getSemesterStart() {
    return localStorage.getItem(this.KEYS.SEMESTER_START) || '';
  },

  setSemesterStart(val) {
    localStorage.setItem(this.KEYS.SEMESTER_START, val);
  },

  getLast80() {
    return localStorage.getItem(this.KEYS.LAST_WARNING_80) || '';
  },

  setLast80(val) {
    localStorage.setItem(this.KEYS.LAST_WARNING_80, val);
  },

  getLast100() {
    return localStorage.getItem(this.KEYS.LAST_WARNING_100) || '';
  },

  setLast100(val) {
    localStorage.setItem(this.KEYS.LAST_WARNING_100, val);
  },

  exportAll() {
    return {
      expenses: this.getExpenses(),
      courses: this.getCourses(),
      budget: this.getBudget(),
      darkMode: this.getDarkMode(),
      semesterStart: this.getSemesterStart(),
      exportDate: new Date().toISOString().slice(0, 10),
    };
  },

  importAll(data) {
    if (data.expenses) this.saveExpenses(data.expenses);
    if (data.courses) this.saveCourses(data.courses);
    if (typeof data.budget === 'number') this.saveBudget(data.budget);
    if (typeof data.darkMode === 'boolean') this.setDarkMode(data.darkMode);
    if (data.semesterStart) this.setSemesterStart(data.semesterStart);
  }
};
