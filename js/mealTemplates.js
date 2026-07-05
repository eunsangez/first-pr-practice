(function (global) {
  // 각 항목의 kcal100/protein100/carb100/fat100 은 100g(또는 100ml)당 영양성분 근사치.
  // baseAmount 는 해당 끼니의 기준량이며, 실제 그 끼니의 목표 칼로리에 맞춰
  // scaleMealOption() 이 비율대로 늘리거나 줄인다.
  const MEAL_OPTIONS = {
    breakfast: [
      {
        id: 'korean',
        name: '한식 스타일',
        description: '현미밥과 계란, 나물 위주의 든든한 아침',
        items: [
          { name: '현미밥', baseAmount: 120, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '계란후라이', baseAmount: 100, kcal100: 196, protein100: 13.6, carb100: 0.8, fat100: 15.3 },
          { name: '미역국', baseAmount: 200, kcal100: 20, protein100: 1.8, carb100: 2.0, fat100: 0.8 },
          { name: '김치', baseAmount: 30, kcal100: 15, protein100: 1.1, carb100: 2.4, fat100: 0.2 },
        ],
      },
      {
        id: 'salad',
        name: '샐러드 스타일',
        description: '가볍게 시작하는 요거트와 과일',
        items: [
          { name: '그릭요거트', baseAmount: 200, kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4 },
          { name: '바나나', baseAmount: 100, kcal100: 89, protein100: 1.1, carb100: 23, fat100: 0.3 },
          { name: '아몬드', baseAmount: 10, kcal100: 579, protein100: 21, carb100: 22, fat100: 50 },
        ],
      },
      {
        id: 'lowcarb',
        name: '저탄수 스타일',
        description: '탄수화물 없이 단백질과 건강한 지방 위주',
        items: [
          { name: '삶은 계란', baseAmount: 150, kcal100: 155, protein100: 13, carb100: 1.1, fat100: 11 },
          { name: '아보카도', baseAmount: 50, kcal100: 160, protein100: 2, carb100: 9, fat100: 15 },
        ],
      },
      {
        id: 'simple',
        name: '간편식 스타일',
        description: '준비하기 쉬운 오트밀과 바나나',
        items: [
          { name: '오트밀(건조)', baseAmount: 50, kcal100: 389, protein100: 17, carb100: 66, fat100: 7 },
          { name: '바나나', baseAmount: 100, kcal100: 89, protein100: 1.1, carb100: 23, fat100: 0.3 },
        ],
      },
    ],
    lunch: [
      {
        id: 'korean',
        name: '한식 스타일',
        description: '현미밥과 닭가슴살, 채소 반찬',
        items: [
          { name: '현미밥', baseAmount: 150, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '닭가슴살구이', baseAmount: 120, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '브로콜리찜', baseAmount: 100, kcal100: 35, protein100: 2.4, carb100: 7, fat100: 0.4 },
          { name: '방울토마토', baseAmount: 50, kcal100: 18, protein100: 0.9, carb100: 3.9, fat100: 0.2 },
        ],
      },
      {
        id: 'salad',
        name: '샐러드 스타일',
        description: '닭가슴살 샐러드와 고구마',
        items: [
          { name: '닭가슴살구이', baseAmount: 150, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '고구마(찐)', baseAmount: 100, kcal100: 90, protein100: 2, carb100: 21, fat100: 0.1 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
      },
      {
        id: 'lowcarb',
        name: '저탄수 스타일',
        description: '닭가슴살과 브로콜리 위주의 고단백 한 끼',
        items: [
          { name: '닭가슴살구이', baseAmount: 180, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '브로콜리찜', baseAmount: 150, kcal100: 35, protein100: 2.4, carb100: 7, fat100: 0.4 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
      },
      {
        id: 'simple',
        name: '간편식 스타일',
        description: '현미밥과 닭가슴살, 김치로 간단하게',
        items: [
          { name: '현미밥', baseAmount: 130, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '닭가슴살구이', baseAmount: 100, kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6 },
          { name: '김치', baseAmount: 30, kcal100: 15, protein100: 1.1, carb100: 2.4, fat100: 0.2 },
        ],
      },
    ],
    dinner: [
      {
        id: 'korean',
        name: '한식 스타일',
        description: '현미밥과 두부구이, 샐러드',
        items: [
          { name: '현미밥', baseAmount: 100, kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0 },
          { name: '두부구이', baseAmount: 150, kcal100: 84, protein100: 8, carb100: 2, fat100: 5 },
          { name: '샐러드 야채', baseAmount: 100, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '올리브오일 드레싱', baseAmount: 5, kcal100: 884, protein100: 0, carb100: 0, fat100: 100 },
        ],
      },
      {
        id: 'salad',
        name: '샐러드 스타일',
        description: '연어구이와 아보카도 샐러드',
        items: [
          { name: '연어구이', baseAmount: 120, kcal100: 208, protein100: 20, carb100: 0, fat100: 13 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
          { name: '아보카도', baseAmount: 50, kcal100: 160, protein100: 2, carb100: 9, fat100: 15 },
        ],
      },
      {
        id: 'lowcarb',
        name: '저탄수 스타일',
        description: '연어구이와 가벼운 샐러드',
        items: [
          { name: '연어구이', baseAmount: 150, kcal100: 208, protein100: 20, carb100: 0, fat100: 13 },
          { name: '샐러드 야채', baseAmount: 150, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
        ],
      },
      {
        id: 'simple',
        name: '간편식 스타일',
        description: '고구마와 두부구이, 샐러드',
        items: [
          { name: '고구마(찐)', baseAmount: 200, kcal100: 90, protein100: 2, carb100: 21, fat100: 0.1 },
          { name: '두부구이', baseAmount: 100, kcal100: 84, protein100: 8, carb100: 2, fat100: 5 },
          { name: '샐러드 야채', baseAmount: 100, kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2 },
        ],
      },
    ],
  };

  const MEAL_TYPE_LABELS = { breakfast: '아침', lunch: '점심', dinner: '저녁' };

  function sumBaseKcal(items) {
    return items.reduce((sum, item) => sum + (item.kcal100 * item.baseAmount) / 100, 0);
  }

  // 그 끼니의 목표 칼로리에 맞춰 기준 재료량을 비율대로 조정한다.
  // 비율은 0.55~1.6 범위로 제한해 극단적으로 적거나 많은 양이 나오지 않게 한다.
  function scaleMealOption(option, targetCalories) {
    const baseKcal = sumBaseKcal(option.items);
    let ratio = targetCalories / baseKcal;
    ratio = Math.min(Math.max(ratio, 0.55), 1.6);

    const totals = { kcal: 0, protein: 0, carb: 0, fat: 0 };
    const items = option.items.map((item) => {
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

    return {
      id: option.id,
      name: option.name,
      description: option.description,
      items,
      totals: {
        kcal: Math.round(totals.kcal),
        protein: Math.round(totals.protein),
        carb: Math.round(totals.carb),
        fat: Math.round(totals.fat),
      },
    };
  }

  function generateMealOptions(mealType, targetCalories) {
    return MEAL_OPTIONS[mealType].map((option) => scaleMealOption(option, targetCalories));
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.MealTemplates = { generateMealOptions, MEAL_TYPE_LABELS };
})(window);
