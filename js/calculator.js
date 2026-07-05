(function (global) {
  const KCAL_PER_KG = 7700; // 체지방 1kg ≈ 7700kcal
  const ACTIVITY_FACTORS = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  const MIN_SAFE_CALORIES = { male: 1500, female: 1200 };
  const MAX_DAILY_ADJUSTMENT = 1100; // 주당 1kg 감량/증량 속도에 해당하는 안전 상한
  const MEAL_SHARES = { breakfast: 0.3, lunch: 0.4, dinner: 0.3 }; // 하루 목표 칼로리 중 각 끼니가 차지하는 비중

  // 체지방률이 없을 때 사용하는 일반 공식
  function calcBMRMifflin({ gender, weightKg, heightCm, age }) {
    const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
    return gender === 'male' ? base + 5 : base - 161;
  }

  // 인바디 체지방률이 있을 때 제지방량 기반으로 더 정확하게 계산
  function calcBMRKatchMcArdle({ weightKg, bodyFatPct }) {
    const leanMassKg = weightKg * (1 - bodyFatPct / 100);
    return 370 + 21.6 * leanMassKg;
  }

  function calcTDEE(bmr, activityLevel) {
    const factor = ACTIVITY_FACTORS[activityLevel] || ACTIVITY_FACTORS.moderate;
    return bmr * factor;
  }

  function createPlan(profile) {
    const {
      gender, age, heightCm, weightKg, bodyFatPct, measuredBmr,
      activityLevel, targetWeightKg, durationDays,
    } = profile;

    let bmr;
    if (measuredBmr) {
      bmr = measuredBmr;
    } else if (bodyFatPct) {
      bmr = calcBMRKatchMcArdle({ weightKg, bodyFatPct });
    } else {
      bmr = calcBMRMifflin({ gender, weightKg, heightCm, age });
    }

    const tdee = calcTDEE(bmr, activityLevel);
    const weightDiffKg = weightKg - targetWeightKg; // 양수: 감량, 음수: 증량
    const totalAdjustment = weightDiffKg * KCAL_PER_KG;
    const minCalories = MIN_SAFE_CALORIES[gender] || MIN_SAFE_CALORIES.female;
    const weeklyRateKg = Math.abs(weightDiffKg) / (durationDays / 7);

    return {
      gender, age, heightCm, activityLevel,
      startWeightKg: weightKg,
      currentWeightKg: weightKg,
      targetWeightKg,
      durationDays,
      bmr: Math.round(bmr),
      tdee: Math.round(tdee),
      totalAdjustment,
      minCalories,
      isBulking: weightDiffKg < 0,
      weeklyRateKg,
      isAggressive: weeklyRateKg > 1,
      createdAt: new Date().toISOString(),
    };
  }

  // 하루 기록 중 실제로 지킨 끼니 비중만큼만 그날의 감량분을 인정한다.
  // (예: 아침만 성공했다면 그날 감량분의 30%만 달성한 것으로 계산)
  function computeAchievedAdjustment(entry) {
    let credit = 0;
    for (const mealType of Object.keys(MEAL_SHARES)) {
      const meal = entry.meals[mealType];
      if (meal && meal.success) credit += MEAL_SHARES[mealType];
    }
    return entry.appliedAdjustment * credit;
  }

  // 지금까지의 성공/실패 기록을 반영해 "남은 목표를 남은 일수로 재분배"하는 방식으로
  // 오늘의 칼로리 목표를 계산한다. 지키지 못한 끼니만큼 감량분이 반영되지 않으므로,
  // 자연스럽게 다음 날들의 목표가 더 엄격해진다.
  function computeDailyTarget(plan, log, dayIndex) {
    const achieved = log.reduce((sum, entry) => sum + computeAchievedAdjustment(entry), 0);
    const remainingDays = Math.max(plan.durationDays - dayIndex, 1);
    const remainingAdjustment = plan.totalAdjustment - achieved;
    let dailyAdjustment = remainingAdjustment / remainingDays;

    const clampedMagnitude = Math.min(Math.abs(dailyAdjustment), MAX_DAILY_ADJUSTMENT);
    dailyAdjustment = Math.sign(dailyAdjustment) * clampedMagnitude;

    let targetCalories = plan.tdee - dailyAdjustment;
    targetCalories = Math.max(targetCalories, plan.minCalories);

    return {
      targetCalories: Math.round(targetCalories),
      appliedAdjustment: Math.round(dailyAdjustment),
    };
  }

  function calcMacros(targetCalories, weightKgForProtein) {
    let proteinG = weightKgForProtein * 1.6;
    let proteinKcal = proteinG * 4;
    let fatKcal = targetCalories * 0.25;
    let fatG = fatKcal / 9;

    if (proteinKcal + fatKcal > targetCalories * 0.9) {
      const scale = (targetCalories * 0.9) / (proteinKcal + fatKcal);
      proteinKcal *= scale;
      proteinG = proteinKcal / 4;
      fatKcal *= scale;
      fatG = fatKcal / 9;
    }

    const carbKcal = Math.max(targetCalories - proteinKcal - fatKcal, 0);
    const carbG = carbKcal / 4;

    return {
      proteinG: Math.round(proteinG),
      fatG: Math.round(fatG),
      carbG: Math.round(carbG),
    };
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.Calculator = {
    calcBMRMifflin,
    calcBMRKatchMcArdle,
    calcTDEE,
    createPlan,
    computeDailyTarget,
    calcMacros,
    KCAL_PER_KG,
    MEAL_SHARES,
  };
})(window);
