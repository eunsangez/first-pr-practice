(function () {
  const { Calculator, MealTemplates, Storage } = window.DietApp;
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

  function renderMealSections(targetCalories) {
    const container = el('meal-sections');
    container.innerHTML = '';

    MEAL_TYPES.forEach((mealType) => {
      const mealTarget = Math.round(targetCalories * Calculator.MEAL_SHARES[mealType]);
      const block = document.createElement('div');
      block.className = 'meal-type-block';

      const done = state.pendingMeals[mealType];
      const header = `
        <div class="meal-type-header">
          <h2>${MealTemplates.MEAL_TYPE_LABELS[mealType]}</h2>
          <span class="meal-type-target">약 ${mealTarget}kcal 목표</span>
        </div>
      `;

      if (done) {
        block.innerHTML = `
          ${header}
          <div class="meal-status-done ${done.success ? 'success' : 'fail'}">
            ${done.success ? '✅' : '❌'} ${done.optionName} — ${done.success ? '성공' : '실패'}으로 기록했어요
          </div>
        `;
        container.appendChild(block);
        return;
      }

      const options = MealTemplates.generateMealOptions(mealType, mealTarget);
      if (!selectedOptionByMeal[mealType] || !options.some((o) => o.id === selectedOptionByMeal[mealType])) {
        selectedOptionByMeal[mealType] = options[0].id;
      }

      const optionsHtml = options
        .map((option) => {
          const itemsHtml = option.items
            .map((it) => `<li>${it.name} ${it.amount}g <span>(${it.kcal}kcal)</span></li>`)
            .join('');
          const selected = option.id === selectedOptionByMeal[mealType];
          return `
            <div class="meal-card ${selected ? 'selected' : ''}" data-option-id="${option.id}">
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
            </div>
          `;
        })
        .join('');

      const weightFieldHtml =
        mealType === 'breakfast'
          ? `
        <label class="optional-weight">
          오늘 아침 체중 (kg, 선택 입력 시 계획이 더 정확해집니다)
          <input type="number" id="actual-weight" step="0.1" placeholder="예: 69.5" />
        </label>
      `
          : '';

      block.innerHTML = `
        ${header}
        <div class="meal-type-options">${optionsHtml}</div>
        ${weightFieldHtml}
        <div class="checkin-buttons">
          <button class="success-btn" type="button">✅ 성공했어요</button>
          <button class="fail-btn" type="button">❌ 실패했어요</button>
        </div>
      `;

      block.querySelectorAll('input[type="radio"]').forEach((input) => {
        input.addEventListener('change', () => {
          selectedOptionByMeal[mealType] = input.value;
          block.querySelectorAll('.meal-card').forEach((c) => {
            c.classList.toggle('selected', c.dataset.optionId === input.value);
          });
        });
      });

      block.querySelector('.success-btn').addEventListener('click', () => markMealResult(mealType, true, mealTarget));
      block.querySelector('.fail-btn').addEventListener('click', () => markMealResult(mealType, false, mealTarget));

      container.appendChild(block);
    });
  }

  function markMealResult(mealType, success, mealTarget) {
    const options = MealTemplates.generateMealOptions(mealType, mealTarget);
    const chosen = options.find((o) => o.id === selectedOptionByMeal[mealType]) || options[0];

    if (mealType === 'breakfast') {
      const actualWeightRaw = el('actual-weight') ? el('actual-weight').value : '';
      if (actualWeightRaw) {
        state.plan.currentWeightKg = Number(actualWeightRaw);
      }
    }

    state.pendingMeals[mealType] = { optionId: chosen.id, optionName: chosen.name, success };

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
