(function () {
  const { Calculator, MealTemplates, Storage } = window.DietApp;

  const el = (id) => document.getElementById(id);
  const screens = {
    setup: el('setup-screen'),
    dashboard: el('dashboard-screen'),
    complete: el('complete-screen'),
  };

  let state = Storage.loadState();

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
    state = { plan, log: [], dayIndex: 0 };
    Storage.saveState(state);
    renderApp();
  });

  // ---------- 대시보드 렌더링 ----------
  let selectedMealId = null;

  function renderDashboard() {
    const { plan, log, dayIndex } = state;
    const { targetCalories, appliedAdjustment } = Calculator.computeDailyTarget(plan, log, dayIndex);
    const macros = Calculator.calcMacros(targetCalories, plan.currentWeightKg);

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

    const options = MealTemplates.generateDailyOptions(targetCalories);
    selectedMealId = options[0].id;
    renderMealOptions(options);
    renderHistory();

    // 다음 체크인에 사용할 값을 미리 계산해 저장해둔다.
    renderDashboard._pendingAdjustment = appliedAdjustment;
    renderDashboard._pendingTargetCalories = targetCalories;
  }

  function renderMealOptions(options) {
    const container = el('meal-options');
    container.innerHTML = '';

    options.forEach((option, idx) => {
      const card = document.createElement('div');
      card.className = 'meal-card';

      const mealsHtml = Object.entries(option.meals)
        .map(([type, items]) => {
          const itemsHtml = items.map((it) => `<li>${it.name} ${it.amount}g <span>(${it.kcal}kcal)</span></li>`).join('');
          return `<div class="meal-block"><h4>${MealTemplates.MEAL_TYPE_LABELS[type]}</h4><ul>${itemsHtml}</ul></div>`;
        })
        .join('');

      card.innerHTML = `
        <label class="meal-card-header">
          <input type="radio" name="mealChoice" value="${option.id}" ${idx === 0 ? 'checked' : ''} />
          <div>
            <strong>${option.name}</strong>
            <p class="meal-desc">${option.description}</p>
          </div>
        </label>
        <div class="meal-totals">
          ${option.totals.kcal}kcal · 단백질 ${option.totals.protein}g · 탄수 ${option.totals.carb}g · 지방 ${option.totals.fat}g
        </div>
        ${mealsHtml}
      `;

      card.querySelector('input[type="radio"]').addEventListener('change', () => {
        selectedMealId = option.id;
        container.querySelectorAll('.meal-card').forEach((c) => c.classList.remove('selected'));
        card.classList.add('selected');
      });

      if (idx === 0) card.classList.add('selected');
      container.appendChild(card);
    });
  }

  function renderHistory() {
    const tbody = el('history-body');
    tbody.innerHTML = '';
    state.log.forEach((entry) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${entry.dayIndex + 1}</td>
        <td>${new Date(entry.date).toLocaleDateString('ko-KR')}</td>
        <td>${entry.targetCalories} kcal</td>
        <td>${entry.chosenMealName}</td>
        <td>${entry.success ? '✅ 성공' : '❌ 실패'}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function recordCheckIn(success) {
    const { plan, dayIndex } = state;
    const options = MealTemplates.generateDailyOptions(renderDashboard._pendingTargetCalories);
    const chosen = options.find((o) => o.id === selectedMealId) || options[0];

    const actualWeightRaw = el('actual-weight').value;
    if (actualWeightRaw) {
      plan.currentWeightKg = Number(actualWeightRaw);
    }

    state.log.push({
      dayIndex,
      date: new Date().toISOString(),
      targetCalories: renderDashboard._pendingTargetCalories,
      appliedAdjustment: renderDashboard._pendingAdjustment,
      success,
      chosenMealId: chosen.id,
      chosenMealName: chosen.name,
    });
    state.dayIndex += 1;
    el('actual-weight').value = '';

    Storage.saveState(state);
    renderApp();
  }

  el('success-btn').addEventListener('click', () => recordCheckIn(true));
  el('fail-btn').addEventListener('click', () => recordCheckIn(false));

  // ---------- 완료 화면 ----------
  function renderComplete() {
    const { plan, log } = state;
    el('final-days').textContent = `${plan.durationDays}일`;
    el('final-success-days').textContent = `${log.filter((l) => l.success).length} / ${log.length}일`;
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
