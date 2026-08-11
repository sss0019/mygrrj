/**
 * 记账模块
 */
const ExpenseModule = (function () {
  const CATEGORIES = {
    expense: [
      { name: '吃饭', color: '#FFB347', icon: '🍚' },
      { name: '奶茶饮料', color: '#D2917E', icon: '🧋' },
      { name: '购物', color: '#B8A0D0', icon: '🛍️' },
      { name: '娱乐', color: '#7EC8E3', icon: '🎮' },
      { name: '学习', color: '#8FC9A9', icon: '📚' },
      { name: '其他', color: '#B0B0B0', icon: '📦' },
    ],
    income: [
      { name: '勤工俭学', color: '#5ECCC4', icon: '💵' },
    ],
  };

  let currentType = 'expense';
  let selectedCategory = null;
  let filterType = 'all';
  let filterDateStart = '';
  let filterDateEnd = '';

  function init() {
    renderCategoryGrid();
    bindExpenseEvents();
    bindFilterEvents();
    bindBudgetBar();
    refresh();
  }

  function renderCategoryGrid() {
    const grid = document.getElementById('categoryGrid');
    const cats = CATEGORIES[currentType];
    grid.innerHTML = '';
    cats.forEach((cat, i) => {
      const el = document.createElement('div');
      el.className = 'category-item';
      el.dataset.index = i;
      el.innerHTML = `
        <div class="category-dot" style="background:${cat.color}"></div>
        <div class="category-name">${cat.icon} ${cat.name}</div>
      `;
      el.addEventListener('click', () => {
        grid.querySelectorAll('.category-item').forEach(b => b.classList.remove('selected'));
        el.classList.add('selected');
        selectedCategory = { ...cat, idx: i };
      });
      grid.appendChild(el);
    });
    // 默认选中第一个
    if (grid.children.length > 0) {
      grid.children[0].click();
    }
  }

  function bindExpenseEvents() {
    // FAB
    document.getElementById('fabAdd').addEventListener('click', () => {
      currentType = 'expense';
      selectedCategory = null;
      document.getElementById('amountInput').value = '';
      document.getElementById('expenseDate').value = todayStr();
      document.getElementById('expenseNote').value = '';
      document.querySelectorAll('.type-btn').forEach(b => {
        b.classList.remove('active', 'income-active');
      });
      document.querySelector('.type-btn[data-type="expense"]').classList.add('active');
      renderCategoryGrid();
      document.getElementById('expenseModal').classList.add('show');
    });

    // 类型切换
    document.querySelectorAll('.type-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        currentType = btn.dataset.type;
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active', 'income-active'));
        btn.classList.add('active');
        if (currentType === 'income') btn.classList.add('income-active');
        selectedCategory = null;
        renderCategoryGrid();
      });
    });

    // 确认记账
    document.getElementById('confirmExpense').addEventListener('click', () => {
      const amount = parseFloat(document.getElementById('amountInput').value);
      if (!amount || amount <= 0) {
        showToast('请输入有效金额');
        return;
      }
      if (!selectedCategory) {
        showToast('请选择分类');
        return;
      }
      const date = document.getElementById('expenseDate').value || todayStr();
      const note = document.getElementById('expenseNote').value.trim();

      const record = {
        id: Date.now(),
        type: currentType,
        category: selectedCategory.name,
        catColor: selectedCategory.color,
        amount: amount,
        date: date,
        note: note,
        createdAt: new Date().toISOString(),
      };

      const expenses = DataStore.getExpenses();
      expenses.unshift(record);
      DataStore.saveExpenses(expenses);

      // 关闭弹窗
      document.getElementById('expenseModal').classList.remove('show');

      // 刷新
      refresh();
      showToast(currentType === 'expense' ? '已记录支出' : '已记录收入');
    });
  }

  function bindFilterEvents() {
    // 类型筛选
    document.querySelectorAll('.filter-label').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-label').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        filterType = btn.dataset.cat;
        renderExpenseList();
      });
    });

    // 日期筛选
    document.getElementById('filterDateBtn').addEventListener('click', () => {
      document.getElementById('dateFilterModal').classList.add('show');
      const today = todayStr();
      const monthStart = today.slice(0, 8) + '01';
      document.getElementById('dateStart').value = monthStart;
      document.getElementById('dateEnd').value = today;
      filterDateStart = monthStart;
      filterDateEnd = today;
    });

    document.getElementById('confirmDateFilter').addEventListener('click', () => {
      filterDateStart = document.getElementById('dateStart').value;
      filterDateEnd = document.getElementById('dateEnd').value;
      document.getElementById('dateFilterModal').classList.remove('show');
      renderExpenseList();
    });
  }

  function bindBudgetBar() {
    const budget = DataStore.getBudget();
    const expenses = DataStore.getExpenses();
    const now = new Date();
    const monthKey = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0');

    let total = 0;
    expenses.forEach(e => {
      if (e.type === 'expense' && e.date.startsWith(monthKey)) total += e.amount;
    });

    const percent = budget > 0 ? Math.min(Math.round((total / budget) * 100), 100) : 0;
    const fill = document.getElementById('budgetBarFill');
    const text = document.getElementById('budgetBarText');
    fill.style.width = percent + '%';
    text.textContent = percent + '%';

    let color = '#8FC9A9';
    if (percent > 50) color = '#FFB49A';
    if (percent > 70) color = '#FF8C61';
    if (percent > 90) color = '#FF6B35';
    if (percent > 100) color = '#FF6B6B';
    fill.style.background = color;
    text.style.color = color;

    // 80% / 100% 提醒
    checkBudgetWarnings(total, budget, monthKey);
  }

  function checkBudgetWarnings(total, budget, monthKey) {
    if (budget <= 0) return;
    const today = todayStr();
    const pct = total / budget;

    if (pct >= 0.8 && pct < 1.0) {
      const last = DataStore.getLast80();
      if (last !== monthKey) {
        showToast('⚠️ 已用 80%，剩余 ¥' + (budget - total).toFixed(2));
        DataStore.setLast80(monthKey);
      }
    }
    if (pct >= 1.0) {
      const last = DataStore.getLast100();
      if (last !== monthKey) {
        showToast('🚨 本月预算已用完！');
        DataStore.setLast100(monthKey);
      }
    }
  }

  function refresh() {
    renderExpenseList();
    bindBudgetBar();
  }

  function renderExpenseList() {
    const container = document.getElementById('expenseList');
    let expenses = DataStore.getExpenses();

    // 按类型筛选
    if (filterType !== 'all') {
      expenses = expenses.filter(e => e.type === filterType);
    }

    // 按日期筛选
    if (filterDateStart) {
      expenses = expenses.filter(e => e.date >= filterDateStart);
    }
    if (filterDateEnd) {
      expenses = expenses.filter(e => e.date <= filterDateEnd);
    }

    if (expenses.length === 0) {
      container.innerHTML = '<div class="empty-state">暂无记录</div>';
      return;
    }

    container.innerHTML = '';
    expenses.forEach((item, i) => {
      const el = document.createElement('div');
      el.className = 'expense-item' + (item.type === 'income' ? ' income' : '');
      el.style.animationDelay = (i * 0.05) + 's';
      const sign = item.type === 'expense' ? '-' : '+';
      el.innerHTML = `
        <div class="expense-cat-dot" style="background:${item.catColor}">${item.category === '吃饭' ? '🍚' : item.category === '奶茶饮料' ? '🧋' : item.category === '购物' ? '🛍️' : item.category === '娱乐' ? '🎮' : item.category === '学习' ? '📚' : item.category === '其他' ? '📦' : '💵'}</div>
        <div class="expense-info">
          <div class="expense-cat-name">${item.category}</div>
          <div class="expense-note">${item.note || ''}</div>
        </div>
        <div style="text-align:right">
          <div class="expense-amount">${sign}¥${item.amount.toFixed(2)}</div>
          <div class="expense-date">${item.date.slice(5)}</div>
        </div>
      `;
      container.appendChild(el);
    });
  }

  function todayStr() {
    const d = new Date();
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }

  function showToast(msg) {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.classList.add('show');
    setTimeout(() => el.classList.remove('show'), 2200);
  }

  // 暴露接口
  return { init, refresh };
})();

// 页面加载后初始化
document.addEventListener('DOMContentLoaded', () => {
  ExpenseModule.init();
});
