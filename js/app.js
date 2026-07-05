(function () {
  const { Calculator, MealTemplates, FoodDatabase, Storage } = window.DietApp;
  const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'];

  const el = (id) => document.getElementById(id);
  const screens = {
    setup: el('setup-screen'),
    dashboard: el('dashboard-screen'),
    complete: el('complete-screen'),
  };

  let state = Storage.loadState();

  function emptyPendingMeals() {
    return { breakfast: null, lunch: null, dinner: null };
  }

  function showScreen(name) {
    Object.entries(screens).forEach(([key, node]) => {
      node.classList.toggle('hidden', key !== name);
    });
    el('reset-btn').classList.toggle('hidden', name === 'setup');
  }

  // ---------- 탭 전환 (기본 정보 / 인바디) ----------
  document.querySelectorAll('.tab-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach((b) => b.classList.remove('active'));
      document.querySelectorAll('.tab-panel').forEach((p) => p.classList.remove('active'));
      btn.classList.add('active');
      document.querySelector(`.tab-panel[data-panel="${btn.dataset.tab}"]`).classList.add('active');
      document.querySelectorAll('.inbody-only').forEach((elm) => {
        elm.classList.toggle('hidden', btn.dataset.tab !== 'inbody');
      });
    });
  });

  // ---------- 초기 설정 폼 ----------
  el('setup-form').addEventListener('submit', (e) => {
    e.preventDefault();

    const gender = document.querySelector('input[name="gender"]:checked').value;
    const age = Number(el('age').value);
    const heightCm = Number(el('height').value);
    const weightKg = Number(el('weight').value);
    const bodyFatRaw = el('bodyFat').value;
    const measuredBmrRaw = el('measuredBmr').value;
    const activityLevel = el('activityLevel').value;
    const targetWeightKg = Number(el('targetWeight').value);
    const durationWeeks = Number(el('durationWeeks').value);

    const warning = el('setup-warning');
    if (targetWeightKg === weightKg) {
      warning.textContent = '목표 몸무게가 현재 몸무게와 같습니다. 목표를 다르게 설정해주세요.';
      warning.classList.remove('hidden');
      return;
    }
    warning.classList.add('hidden');

    const profile = {
      gender,
      age,
      heightCm,
      weightKg,
      bodyFatPct: bodyFatRaw ? Number(bodyFatRaw) : null,
      measuredBmr: measuredBmrRaw ? Number(measuredBmrRaw) : null,
      activityLevel,
      targetWeightKg,
      durationDays: durationWeeks * 7,
    };

    const plan = Calculator.createPlan(profile);
    state = { plan, log: [], dayIndex: 0, pendingMeals: emptyPendingMeals() };
    Storage.saveState(state);
    renderApp();
  });

  // ---------- 대시보드 렌더링 ----------
  const selectedOptionByMeal = { breakfast: null, lunch: null, dinner: null };
  const customMealItems = { breakfast: [], lunch: [], dinner: [] }; // { food, amount }[]
  const mealBlockElements = { breakfast: null, lunch: null, dinner: null };
  let currentDayContext = { targetCalories: 0, appliedAdjustment: 0 };

  function renderDashboard() {
    const { plan, log, dayIndex } = state;
    const { targetCalories, appliedAdjustment } = Calculator.computeDailyTarget(plan, log, dayIndex);
    const macros = Calculator.calcMacros(targetCalories, plan.currentWeightKg);
    currentDayContext = { targetCalories, appliedAdjustment };

    el('day-index-label').textContent = `Day ${dayIndex + 1} / ${plan.durationDays}`;
    el('progress-fill').style.width = `${Math.min((dayIndex / plan.durationDays) * 100, 100)}%`;

    el('stat-bmr').textContent = `${plan.bmr} kcal`;
    el('stat-tdee').textContent = `${plan.tdee} kcal`;
    el('stat-current-weight').textContent = `${plan.currentWeightKg} kg`;
    el('stat-target-weight').textContent = `${plan.targetWeightKg} kg`;

    const paceWarning = el('pace-warning');
    if (plan.isAggressive) {
      paceWarning.textContent = `⚠️ 주당 ${plan.weeklyRateKg.toFixed(1)}kg의 변화 속도는 권장 속도(주당 1kg)보다 빠릅니다. 기간을 늘리는 것을 권장해요.`;
      paceWarning.classList.remove('hidden');
    } else {
      paceWarning.classList.add('hidden');
    }

    el('target-kcal').textContent = `${targetCalories} kcal`;
    el('target-protein').textContent = `${macros.proteinG} g`;
    el('target-carb').textContent = `${macros.carbG} g`;
    el('target-fat').textContent = `${macros.fatG} g`;

    renderMealSections(targetCalories);
    renderHistory();
  }

  function mealTargetFor(mealType, targetCalories) {
    return Math.round(targetCalories * Calculator.MEAL_SHARES[mealType]);
  }

  function renderMealSections(targetCalories) {
    const container = el('meal-sections');
    container.innerHTML = '';

    MEAL_TYPES.forEach((mealType) => {
      const block = buildMealBlock(mealType, mealTargetFor(mealType, targetCalories));
      mealBlockElements[mealType] = block;
      container.appendChild(block);
    });
  }

  function rerenderMealBlock(mealType) {
    const mealTarget = mealTargetFor(mealType, currentDayContext.targetCalories);
    const newBlock = buildMealBlock(mealType, mealTarget);
    mealBlockElements[mealType].replaceWith(newBlock);
    mealBlockElements[mealType] = newBlock;
    return newBlock;
  }

  // ---------- 끼니 블록(추천 4종 + 직접 입력) ----------
  function buildMealBlock(mealType, mealTarget) {
    const block = document.createElement('div');
    block.className = 'meal-type-block';

    const done = state.pendingMeals[mealType];
    const header = document.createElement('div');
    header.className = 'meal-type-header';
    header.innerHTML = `<h2>${MealTemplates.MEAL_TYPE_LABELS[mealType]}</h2><span class="meal-type-target">약 ${mealTarget}kcal 목표</span>`;
    block.appendChild(header);

    if (done) {
      const status = document.createElement('div');
      status.className = `meal-status-done ${done.success ? 'success' : 'fail'}`;
      status.textContent = `${done.success ? '✅' : '❌'} ${done.optionName} — ${done.success ? '성공' : '실패'}으로 기록했어요`;
      block.appendChild(status);
      return block;
    }

    const options = MealTemplates.generateMealOptions(mealType, mealTarget);
    const isCustomSelected = selectedOptionByMeal[mealType] === 'custom';
    if (!selectedOptionByMeal[mealType] || (!isCustomSelected && !options.some((o) => o.id === selectedOptionByMeal[mealType]))) {
      selectedOptionByMeal[mealType] = options[0].id;
    }

    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'meal-type-options';
    options.forEach((option) => {
      optionsGrid.appendChild(buildRecommendedCard(mealType, option));
    });
    block.appendChild(optionsGrid);

    block.appendChild(buildCustomCard(mealType, mealTarget));

    const weightFieldWrap = document.createElement('div');
    if (mealType === 'breakfast') {
      weightFieldWrap.innerHTML = `
        <label class="optional-weight">
          오늘 아침 체중 (kg, 선택 입력 시 계획이 더 정확해집니다)
          <input type="number" id="actual-weight" step="0.1" placeholder="예: 69.5" />
        </label>
      `;
    }
    block.appendChild(weightFieldWrap);

    const checkinButtons = document.createElement('div');
    checkinButtons.className = 'checkin-buttons';
    checkinButtons.innerHTML = `
      <button class="success-btn" type="button">✅ 성공했어요</button>
      <button class="fail-btn" type="button">❌ 실패했어요</button>
    `;
    checkinButtons.querySelector('.success-btn').addEventListener('click', () => markMealResult(mealType, true, mealTarget));
    checkinButtons.querySelector('.fail-btn').addEventListener('click', () => markMealResult(mealType, false, mealTarget));
    block.appendChild(checkinButtons);

    return block;
  }

  function buildRecommendedCard(mealType, option) {
    const card = document.createElement('div');
    const selected = option.id === selectedOptionByMeal[mealType];
    card.className = `meal-card ${selected ? 'selected' : ''}`;
    card.dataset.optionId = option.id;

    const itemsHtml = option.items.map((it) => `<li>${it.name} ${it.amount}g <span>(${it.kcal}kcal)</span></li>`).join('');
    card.innerHTML = `
      <label class="meal-card-header">
        <input type="radio" name="mealChoice-${mealType}" value="${option.id}" ${selected ? 'checked' : ''} />
        <div>
          <strong>${option.name}</strong>
          <p class="meal-desc">${option.description}</p>
        </div>
      </label>
      <div class="meal-totals">
        ${option.totals.kcal}kcal · 단백질 ${option.totals.protein}g · 탄수 ${option.totals.carb}g · 지방 ${option.totals.fat}g
      </div>
      <ul>${itemsHtml}</ul>
    `;

    card.querySelector('input[type="radio"]').addEventListener('change', () => {
      selectedOptionByMeal[mealType] = option.id;
      rerenderMealBlock(mealType);
    });

    return card;
  }

  // ---------- 직접 입력 카드 (음식 검색 + 담기) ----------
  function computeCustomTotals(mealType) {
    return customMealItems[mealType].reduce(
      (acc, item) => {
        acc.kcal += (item.food.kcal100 * item.amount) / 100;
        acc.protein += (item.food.protein100 * item.amount) / 100;
        acc.carb += (item.food.carb100 * item.amount) / 100;
        acc.fat += (item.food.fat100 * item.amount) / 100;
        return acc;
      },
      { kcal: 0, protein: 0, carb: 0, fat: 0 }
    );
  }

  function buildCustomOption(mealType) {
    const totals = computeCustomTotals(mealType);
    return {
      id: 'custom',
      name: '직접 입력',
      items: customMealItems[mealType].map((item) => ({
        name: item.food.name,
        amount: item.amount,
        kcal: Math.round((item.food.kcal100 * item.amount) / 100),
      })),
      totals: {
        kcal: Math.round(totals.kcal),
        protein: Math.round(totals.protein),
        carb: Math.round(totals.carb),
        fat: Math.round(totals.fat),
      },
    };
  }

  function buildCustomCard(mealType, mealTarget) {
    const card = document.createElement('div');
    const selected = selectedOptionByMeal[mealType] === 'custom';
    card.className = `custom-meal-card ${selected ? 'selected' : ''}`;
    card.dataset.optionId = 'custom';

    card.innerHTML = `
      <label class="meal-card-header">
        <input type="radio" name="mealChoice-${mealType}" value="custom" ${selected ? 'checked' : ''} />
        <div>
          <strong>직접 입력</strong>
          <p class="meal-desc">실제로 먹은 음식을 검색해서 담아보세요</p>
        </div>
      </label>
    `;

    card.querySelector('input[type="radio"]').addEventListener('change', () => {
      selectedOptionByMeal[mealType] = 'custom';
      rerenderMealBlock(mealType);
    });

    if (selected) {
      card.appendChild(buildCustomPanel(mealType, mealTarget));
    }

    return card;
  }

  function buildCustomPanel(mealType, mealTarget) {
    const panel = document.createElement('div');
    panel.className = 'custom-meal-panel';

    const searchWrap = document.createElement('div');
    searchWrap.className = 'cf-search';
    searchWrap.innerHTML = `
      <input type="text" class="cf-search-input" placeholder="음식 이름 검색 (예: 닭가슴살, 라면)" autocomplete="off" />
      <div class="cf-search-results"></div>
    `;
    const searchInput = searchWrap.querySelector('.cf-search-input');
    const resultsBox = searchWrap.querySelector('.cf-search-results');

    function renderResults(query) {
      const matches = FoodDatabase.searchFoods(query, 8);
      resultsBox.innerHTML = matches
        .map(
          (food, idx) => `
        <button type="button" class="cf-result" data-index="${idx}">
          ${food.name} <span>(${food.kcal100}kcal/100g${food.unit ? ` · 1${food.unit.label}≈${food.unit.grams}g` : ''})</span>
        </button>
      `
        )
        .join('');
      resultsBox.querySelectorAll('.cf-result').forEach((btn, idx) => {
        btn.addEventListener('click', () => {
          const food = matches[idx];
          customMealItems[mealType].push({ food, amount: food.unit ? food.unit.grams : 100 });
          const newBlock = rerenderMealBlock(mealType);
          const reopenedSearch = newBlock.querySelector('.cf-search-input');
          if (reopenedSearch) reopenedSearch.focus();
        });
      });
    }

    searchInput.addEventListener('input', () => renderResults(searchInput.value));
    renderResults('');
    panel.appendChild(searchWrap);

    const list = document.createElement('ul');
    list.className = 'cf-item-list';
    customMealItems[mealType].forEach((item, index) => {
      list.appendChild(buildCustomItemRow(mealType, item, index));
    });
    panel.appendChild(list);

    const totalsLine = document.createElement('div');
    totalsLine.className = 'cf-totals';
    panel.appendChild(totalsLine);
    updateCustomTotalsDOM(mealType, mealTarget, totalsLine);

    return panel;
  }

  function buildCustomItemRow(mealType, item, index) {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="cf-item-main">
        <strong>${item.food.name}</strong>
        <div class="cf-item-controls">
          <input type="number" class="cf-amount" min="1" value="${item.amount}" /> g
          ${item.food.unit ? `<button type="button" class="cf-unit-btn">+1${item.food.unit.label} (${item.food.unit.grams}g)</button>` : ''}
          <button type="button" class="cf-remove">✕</button>
        </div>
      </div>
      <div class="cf-item-kcal"></div>
    `;

    const kcalLine = li.querySelector('.cf-item-kcal');
    function refreshItemKcal() {
      const kcal = Math.round((item.food.kcal100 * item.amount) / 100);
      const protein = Math.round((item.food.protein100 * item.amount) / 100);
      const carb = Math.round((item.food.carb100 * item.amount) / 100);
      const fat = Math.round((item.food.fat100 * item.amount) / 100);
      kcalLine.textContent = `${kcal}kcal · 단백질 ${protein}g · 탄수 ${carb}g · 지방 ${fat}g`;
    }
    refreshItemKcal();

    const amountInput = li.querySelector('.cf-amount');
    amountInput.addEventListener('input', () => {
      const parsed = Number(amountInput.value);
      item.amount = parsed > 0 ? parsed : 0;
      refreshItemKcal();
      const totalsLine = mealBlockElements[mealType].querySelector('.cf-totals');
      if (totalsLine) updateCustomTotalsDOM(mealType, mealTargetFor(mealType, currentDayContext.targetCalories), totalsLine);
    });

    const unitBtn = li.querySelector('.cf-unit-btn');
    if (unitBtn) {
      unitBtn.addEventListener('click', () => {
        item.amount += item.food.unit.grams;
        amountInput.value = item.amount;
        refreshItemKcal();
        const totalsLine = mealBlockElements[mealType].querySelector('.cf-totals');
        if (totalsLine) updateCustomTotalsDOM(mealType, mealTargetFor(mealType, currentDayContext.targetCalories), totalsLine);
      });
    }

    li.querySelector('.cf-remove').addEventListener('click', () => {
      customMealItems[mealType].splice(index, 1);
      rerenderMealBlock(mealType);
    });

    return li;
  }

  function updateCustomTotalsDOM(mealType, mealTarget, totalsLineEl) {
    const totals = buildCustomOption(mealType).totals;
    const diff = totals.kcal - mealTarget;
    let diffText;
    if (customMealItems[mealType].length === 0) {
      diffText = '';
    } else if (Math.abs(diff) <= 20) {
      diffText = ' · 목표와 거의 같아요';
    } else if (diff > 0) {
      diffText = ` · 목표보다 ${diff}kcal 더 드셨어요`;
    } else {
      diffText = ` · 목표보다 ${Math.abs(diff)}kcal 적게 드셨어요`;
    }
    totalsLineEl.textContent =
      customMealItems[mealType].length === 0
        ? '아직 담은 음식이 없어요. 위에서 검색해 담아주세요.'
        : `합계 ${totals.kcal}kcal · 단백질 ${totals.protein}g · 탄수 ${totals.carb}g · 지방 ${totals.fat}g${diffText}`;
  }

  function markMealResult(mealType, success, mealTarget) {
    let chosen;
    if (selectedOptionByMeal[mealType] === 'custom') {
      if (customMealItems[mealType].length === 0) {
        alert('직접 입력을 선택했다면 최소 한 가지 음식을 담아주세요.');
        return;
      }
      chosen = buildCustomOption(mealType);
    } else {
      const options = MealTemplates.generateMealOptions(mealType, mealTarget);
      chosen = options.find((o) => o.id === selectedOptionByMeal[mealType]) || options[0];
    }

    if (mealType === 'breakfast') {
      const actualWeightRaw = el('actual-weight') ? el('actual-weight').value : '';
      if (actualWeightRaw) {
        state.plan.currentWeightKg = Number(actualWeightRaw);
      }
    }

    state.pendingMeals[mealType] = { optionId: chosen.id, optionName: chosen.name, success };
    customMealItems[mealType] = [];
    selectedOptionByMeal[mealType] = null;

    const dayComplete = MEAL_TYPES.every((type) => state.pendingMeals[type]);
    if (dayComplete) {
      state.log.push({
        dayIndex: state.dayIndex,
        date: new Date().toISOString(),
        targetCalories: currentDayContext.targetCalories,
        appliedAdjustment: currentDayContext.appliedAdjustment,
        meals: state.pendingMeals,
      });
      state.dayIndex += 1;
      state.pendingMeals = emptyPendingMeals();
    }

    Storage.saveState(state);
    renderApp();
  }

  function renderHistory() {
    const tbody = el('history-body');
    tbody.innerHTML = '';
    state.log.forEach((entry) => {
      const tr = document.createElement('tr');
      const mealCell = (mealType) => {
        const meal = entry.meals[mealType];
        return `${meal.optionName} ${meal.success ? '✅' : '❌'}`;
      };
      tr.innerHTML = `
        <td>${entry.dayIndex + 1}</td>
        <td>${new Date(entry.date).toLocaleDateString('ko-KR')}</td>
        <td>${mealCell('breakfast')}</td>
        <td>${mealCell('lunch')}</td>
        <td>${mealCell('dinner')}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  // ---------- 완료 화면 ----------
  function renderComplete() {
    const { plan, log } = state;
    const totalMeals = log.length * MEAL_TYPES.length;
    const successMeals = log.reduce(
      (sum, entry) => sum + MEAL_TYPES.filter((type) => entry.meals[type].success).length,
      0
    );
    el('final-days').textContent = `${plan.durationDays}일`;
    el('final-success-days').textContent = `${successMeals} / ${totalMeals}끼`;
    el('final-start-weight').textContent = `${plan.startWeightKg} kg`;
    el('final-current-weight').textContent = `${plan.currentWeightKg} kg`;
  }

  el('restart-btn').addEventListener('click', () => {
    Storage.clearState();
    state = null;
    showScreen('setup');
  });

  el('reset-btn').addEventListener('click', () => {
    if (confirm('지금까지의 기록이 모두 초기화됩니다. 계속할까요?')) {
      Storage.clearState();
      state = null;
      showScreen('setup');
    }
  });

  // ---------- 전체 렌더 진입점 ----------
  function renderApp() {
    if (!state) {
      showScreen('setup');
      return;
    }
    if (state.dayIndex >= state.plan.durationDays) {
      renderComplete();
      showScreen('complete');
      return;
    }
    renderDashboard();
    showScreen('dashboard');
  }

  renderApp();
})();
