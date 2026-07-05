(function (global) {
  // kcal100/protein100/carb100/fat100 은 100g당 영양성분 근사치.
  // unit이 있으면 "1개/1잔" 등 흔히 먹는 단위당 그램수를 의미한다 (직접 입력 시 빠르게 수량을 더하는 용도).
  const FOOD_DATABASE = [
    { name: '흰쌀밥', kcal100: 143, protein100: 2.5, carb100: 32, fat100: 0.3, unit: { label: '공기', grams: 210 } },
    { name: '현미밥', kcal100: 130, protein100: 2.7, carb100: 28, fat100: 1.0, unit: { label: '공기', grams: 210 } },
    { name: '통밀식빵', kcal100: 247, protein100: 10, carb100: 41, fat100: 3.5, unit: { label: '장', grams: 35 } },
    { name: '김밥', kcal100: 150, protein100: 4, carb100: 25, fat100: 4, unit: { label: '줄', grams: 230 } },
    { name: '라면(조리)', kcal100: 120, protein100: 3, carb100: 17, fat100: 4, unit: { label: '봉지', grams: 500 } },
    { name: '짜장면', kcal100: 174, protein100: 5, carb100: 25, fat100: 6, unit: { label: '그릇', grams: 600 } },
    { name: '스파게티(토마토소스)', kcal100: 157, protein100: 5.8, carb100: 30, fat100: 1, unit: { label: '접시', grams: 350 } },
    { name: '닭가슴살구이', kcal100: 165, protein100: 31, carb100: 0, fat100: 3.6, unit: null },
    { name: '후라이드치킨', kcal100: 246, protein100: 17, carb100: 8, fat100: 16, unit: { label: '조각', grams: 100 } },
    { name: '삼겹살구이', kcal100: 297, protein100: 25, carb100: 0, fat100: 21, unit: null },
    { name: '소고기구이', kcal100: 250, protein100: 26, carb100: 0, fat100: 16, unit: null },
    { name: '계란후라이', kcal100: 196, protein100: 13.6, carb100: 0.8, fat100: 15.3, unit: { label: '개', grams: 50 } },
    { name: '삶은 계란', kcal100: 155, protein100: 13, carb100: 1.1, fat100: 11, unit: { label: '개', grams: 50 } },
    { name: '참치캔', kcal100: 116, protein100: 25, carb100: 0, fat100: 1, unit: { label: '캔', grams: 100 } },
    { name: '고등어구이', kcal100: 205, protein100: 19, carb100: 0, fat100: 14, unit: null },
    { name: '연어구이', kcal100: 208, protein100: 20, carb100: 0, fat100: 13, unit: null },
    { name: '새우(찐)', kcal100: 99, protein100: 24, carb100: 0.2, fat100: 0.3, unit: null },
    { name: '두부구이', kcal100: 84, protein100: 8, carb100: 2, fat100: 5, unit: null },
    { name: '어묵', kcal100: 120, protein100: 10, carb100: 10, fat100: 4, unit: null },
    { name: '브로콜리찜', kcal100: 35, protein100: 2.4, carb100: 7, fat100: 0.4, unit: null },
    { name: '샐러드 야채', kcal100: 20, protein100: 1.5, carb100: 3, fat100: 0.2, unit: null },
    { name: '김치', kcal100: 15, protein100: 1.1, carb100: 2.4, fat100: 0.2, unit: null },
    { name: '미역국', kcal100: 20, protein100: 1.8, carb100: 2, fat100: 0.8, unit: null },
    { name: '시금치나물', kcal100: 40, protein100: 3, carb100: 4, fat100: 2, unit: null },
    { name: '고구마(찐)', kcal100: 90, protein100: 2, carb100: 21, fat100: 0.1, unit: { label: '개', grams: 200 } },
    { name: '감자(찐)', kcal100: 87, protein100: 2, carb100: 20, fat100: 0.1, unit: { label: '개', grams: 150 } },
    { name: '바나나', kcal100: 89, protein100: 1.1, carb100: 23, fat100: 0.3, unit: { label: '개', grams: 120 } },
    { name: '사과', kcal100: 52, protein100: 0.3, carb100: 14, fat100: 0.2, unit: { label: '개', grams: 250 } },
    { name: '오렌지', kcal100: 47, protein100: 0.9, carb100: 12, fat100: 0.1, unit: { label: '개', grams: 200 } },
    { name: '딸기', kcal100: 33, protein100: 0.7, carb100: 8, fat100: 0.3, unit: null },
    { name: '아보카도', kcal100: 160, protein100: 2, carb100: 9, fat100: 15, unit: { label: '개', grams: 200 } },
    { name: '그릭요거트', kcal100: 59, protein100: 10, carb100: 3.6, fat100: 0.4, unit: { label: '컵', grams: 150 } },
    { name: '우유', kcal100: 60, protein100: 3.2, carb100: 4.8, fat100: 3.2, unit: { label: '잔', grams: 200 } },
    { name: '두유', kcal100: 54, protein100: 3.6, carb100: 4, fat100: 2.6, unit: { label: '팩', grams: 190 } },
    { name: '아메리카노', kcal100: 2, protein100: 0.1, carb100: 0.3, fat100: 0, unit: { label: '잔', grams: 355 } },
    { name: '카페라떼', kcal100: 60, protein100: 3.3, carb100: 4.8, fat100: 3.3, unit: { label: '잔', grams: 355 } },
    { name: '콜라', kcal100: 42, protein100: 0, carb100: 10.6, fat100: 0, unit: { label: '캔', grams: 250 } },
    { name: '맥주', kcal100: 43, protein100: 0.5, carb100: 3.6, fat100: 0, unit: { label: '캔', grams: 355 } },
    { name: '아몬드', kcal100: 579, protein100: 21, carb100: 22, fat100: 50, unit: null },
    { name: '감자칩', kcal100: 536, protein100: 7, carb100: 53, fat100: 35, unit: null },
    { name: '초콜릿', kcal100: 546, protein100: 7.6, carb100: 58, fat100: 31, unit: null },
    { name: '피자', kcal100: 266, protein100: 11, carb100: 33, fat100: 10, unit: { label: '조각', grams: 110 } },
    { name: '치즈버거', kcal100: 250, protein100: 13, carb100: 30, fat100: 9, unit: { label: '개', grams: 180 } },
    { name: '올리브오일', kcal100: 884, protein100: 0, carb100: 0, fat100: 100, unit: { label: '큰술', grams: 13 } },
    { name: '오트밀(건조)', kcal100: 389, protein100: 17, carb100: 66, fat100: 7, unit: { label: '컵', grams: 80 } },
  ];

  function searchFoods(query, limit) {
    const max = limit || 8;
    const trimmed = (query || '').trim();
    if (!trimmed) return FOOD_DATABASE.slice(0, max);
    const lower = trimmed.toLowerCase();
    return FOOD_DATABASE.filter((food) => food.name.toLowerCase().includes(lower)).slice(0, max);
  }

  global.DietApp = global.DietApp || {};
  global.DietApp.FoodDatabase = { FOOD_DATABASE, searchFoods };
})(window);
