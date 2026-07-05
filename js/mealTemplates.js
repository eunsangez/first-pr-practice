(function (global) {
  // 각 항목의 kcal100/protein100/carb100/fat100 은 100g(또는 100ml)당 영양성분 근사치.
  // baseAmount 는 기준 식단(대략 1800kcal)에서의 1인분 기준량이며,
  // 실제 하루 목표 칼로리에 맞춰 scaleTemplate() 이 비율대로 늘리거나 줄인다.
  const TEMPLATES = [
    {
      id: 'korean',
      name: '한식 균형 식단',
      description: '현미밥과 단백질, 나물 위주의 균형 잡힌 한식 식단',
      meals: {
        breakfast: [
          { name: '현미밥', baseAmount: 120, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '계란후라이', baseAmount: 100, kcal100: 196, protein100: 13.6, carb100: 0.8, fat100: 15.3 },
          { name: '미역국', baseAmount: 200, kcal100: 20, protein100: 1.8, carb100: 2.0, fat100: 0.8 },
          { name: '김치', baseAmount: 30, kcal100: 15, protein100: 1.1, carb100: 2.4, fat100: 0.2 },
        ],
        lunch: [
          { name: '현미밥', baseAmount: 150, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '닭가슴살구이', baseAmount: 120, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '브로콜리찜', baseAmount: 100, kcal100: 35, protein100: 2.4, carb100: 7, fat100: 0.4 },
          { name: '방울토마토', baseAmount: 50, kcal100: 18, protein100: 0.9, carb100: 3.9, fat100: 0.2 },
        ],
        dinner: [
          { name: '현미밥', baseAmount: 100, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '두부구이', baseAmount: 150, kcal100: 84, protein100: 8, carb100: 2, fat100: 5 },
          { name: '샐러드 야채', baseAmount: 100, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
        snack: [
          { name: '그릭요거트', baseAmount: 150, kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4 },
          { name: '아몬드', baseAmount: 15, kcal100: 579, protein100: 21, carb100: 22, fat100: 50 },
        ],
      },
    },
    {
      id: 'salad',
      name: '샐러드 & 닭가슴살 식단',
      description: '가볍고 신선한 재료 위주의 샐러드 중심 식단',
      meals: {
        breakfast: [
          { name: '그릭요거트', baseAmount: 200, kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4 },
          { name: '바나나', baseAmount: 100, kcal100: 89, protein100: 1.1, carb100: 23, fat100: 0.3 },
          { name: '아몬드', baseAmount: 10, kcal100: 579, protein100: 21, carb100: 22, fat100: 50 },
        ],
        lunch: [
          { name: '닭가슴살구이', baseAmount: 150, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '고구마(찐)', baseAmount: 100, kcal100: 90, protein100: 2, carb100: 21, fat100: 0.1 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
        dinner: [
          { name: '연어구이', baseAmount: 120, kcal100: 208, protein100: 20, carb100: 0, fat100: 13 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '아보카도', baseAmount: 50, kcal100: 160, protein100: 2, carb100: 9, fat100: 15 },
        ],
        snack: [
          { name: '방울토마토', baseAmount: 100, kcal100: 18, protein100: 0.9, carb100: 3.9, fat100: 0.2 },
          { name: '아몬드', baseAmount: 10, kcal100: 579, protein100: 21, carb100: 22, fat100: 50 },
        ],
      },
    },
    {
      id: 'lowcarb',
      name: '저탄수 고단백 식단',
      description: '탄수화물을 줄이고 단백질 비중을 높인 식단',
      meals: {
        breakfast: [
          { name: '삶은 계란', baseAmount: 150, kcal100: 155, protein100: 13, carb100: 1.1, fat100: 11 },
          { name: '아보카도', baseAmount: 50, kcal100: 160, protein100: 2, carb100: 9, fat100: 15 },
        ],
        lunch: [
          { name: '닭가슴살구이', baseAmount: 180, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '브로콜리찜', baseAmount: 150, kcal100: 35, protein100: 2.4, carb100: 7, fat100: 0.4 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
        dinner: [
          { name: '연어구이', baseAmount: 150, kcal100: 208, protein100: 20, carb100: 0, fat100: 13 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
        ],
        snack: [
          { name: '그릭요거트', baseAmount: 100, kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4 },
          { name: '아몬드', baseAmount: 20, kcal100: 579, protein100: 21, carb100: 22, fat100: 50 },
        ],
      },
    },
    {
      id: 'simple',
      name: '간편식 식단',
      description: '바쁜 날에도 준비하기 쉬운 간편한 식단',
      meals: {
        breakfast: [
          { name: '오트밀(건조)', baseAmount: 50, kcal100: 389, protein100: 17, carb100: 66, fat100: 7 },
          { name: '바나나', baseAmount: 100, kcal100: 89, protein100: 1.1, carb100: 23, fat100: 0.3 },
        ],
        lunch: [
          { name: '현미밥', baseAmount: 130, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '닭가슴살구이', baseAmount: 100, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '김치', baseAmount: 30, kcal100: 15, protein100: 1.1, carb100: 2.4, fat100: 0.2 },
        ],
        dinner: [
          { name: '고구마(찐)', baseAmount: 200, kcal100: 90, protein100: 2, carb100: 21, fat100: 0.1 },
          { name: '두부구이', baseAmount: 100, kcal100: 84, protein100: 8, carb100: 2, fat100: 5 },
          { name: '샐러드 야채', baseAmount: 100, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
        ],
        snack: [
          { name: '그릭요거트', baseAmount: 150, kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4 },
        ],
      },
    },
  ];

  const MEAL_TYPE_LABELS = { breakfast: '아침', lunch: '점심', dinner: '저녁', snack: '간식' };

  function sumNutrition(items, ratio) {
    return items.reduce(
      (acc, item) => {
        const amount = item.baseAmount * ratio;
        acc.kcal += (item.kcal100 * amount) / 100;
        return acc;
      },
      { kcal: 0 }
    );
  }

  // 목표 칼로리에 맞춰 기준 식단의 각 재료량을 비율대로 조정한다.
  // 비율은 0.55~1.6 범위로 제한해 극단적으로 적거나 많은 양이 나오지 않게 한다.
  function scaleTemplate(template, targetCalories) {
    const allItems = Object.values(template.meals).flat();
    const baseTotal = sumNutrition(allItems, 1);
    let ratio = targetCalories / baseTotal.kcal;
    ratio = Math.min(Math.max(ratio, 0.55), 1.6);

    const meals = {};
    const totals = { kcal: 0, protein: 0, carb: 0, fat: 0 };

    for (const [mealType, items] of Object.entries(template.meals)) {
      meals[mealType] = items.map((item) => {
        const amount = Math.max(5, Math.round((item.baseAmount * ratio) / 5) * 5);
        const kcal = (item.kcal100 * amount) / 100;
        const protein = (item.protein100 * amount) / 100;
        const carb = (item.carb100 * amount) / 100;
        const fat = (item.fat100 * amount) / 100;
        totals.kcal += kcal;
        totals.protein += protein;
        totals.carb += carb;
        totals.fat += fat;
        return { name: item.name, amount, kcal: Math.round(kcal) };
      });
    }

    return {
      id: template.id,
      name: template.name,
      description: template.description,
      meals,
      totals: {
        kcal: Math.round(totals.kcal),
        protein: Math.round(totals.protein),
        carb: Math.round(totals.carb),
        fat: Math.round(totals.fat),
      },
    };
  }

  function generateDailyOptions(targetCalories) {
    return TEMPLATES.map((t) => scaleTemplate(t, targetCalories));
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.MealTemplates = { generateDailyOptions, MEAL_TYPE_LABELS };
})(window);
