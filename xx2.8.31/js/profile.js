/**
 * 我的页面模块
 */
const ProfileModule = (function () {
  function init() {
    bindProfileEvents();
    refresh();
  }

  function refresh() {
    // 预算
    const budget = DataStore.getBudget();
    document.getElementById('budgetInput').value = budget || '';

    // 学期起始
    document.getElementById('semesterStartInput').value = DataStore.getSemesterStart();

    // 本月支出
    const expenses = DataStore.getExpenses();
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');
    let total = 0;
    expenses.forEach(e => {
      if (e.type === 'expense' && e.date.startsWith(monthKey)) total += e.amount;
    });
    document.getElementById('monthExpenseValue').textContent = '¥' + total.toFixed(2);
  }

  function bindProfileEvents() {
    // 预算保存
    document.getElementById('saveBudget').addEventListener('click', () => {
      const val = parseFloat(document.getElementById('budgetInput').value);
      if (isNaN(val) || val < 0) {
        showToast('请输入有效金额');
        return;
      }
      DataStore.saveBudget(val);
      showToast('预算已保存');
    });

    // 暗色模式
    document.getElementById('darkModeToggle').addEventListener('change', (e) => {
      const dark = e.target.checked;
      DataStore.setDarkMode(dark);
      document.documentElement.classList.toggle('dark', dark);
      showToast(dark ? '已开启暗色模式' : '已关闭暗色模式');
    });

    // 学期起始
    document.getElementById('semesterStartInput').addEventListener('change', (e) => {
      DataStore.setSemesterStart(e.target.value);
      showToast('学期起始日期已更新');
    });

    // 导出备份
    document.getElementById('exportBtn').addEventListener('click', exportBackup);

    // 导入备份
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFile').click();
    });
    document.getElementById('importFile').addEventListener('change', importBackup);
  }

  function exportBackup() {
    const data = DataStore.exportAll();
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = '记账课表备份_' + data.exportDate + '.json';
    a.click();
    URL.revokeObjectURL(url);
    showToast('备份已导出');
  }

  function importBackup(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!data.expenses && !data.courses) {
          showToast('无效的备份文件');
          return;
        }
        DataStore.importAll(data);
        showToast('数据已恢复，请刷新页面');
        setTimeout(() => location.reload(), 1000);
      } catch {
        showToast('文件解析失败');
      }
    };
    reader.readAsText(file);
    // 重置以便重复选择同一文件
    e.target.value = '';
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2000);
  }

  return { init, refresh };
})();

document.addEventListener('DOMContentLoaded', () => {
  ProfileModule.init();
});
