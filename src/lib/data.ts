import r1 from "@/assets/r1.jpg";
import r2 from "@/assets/r2.jpg";
import r3 from "@/assets/r3.jpg";
import r4 from "@/assets/r4.jpg";
import r5 from "@/assets/r5.jpg";
import cStarter from "@/assets/c-starter.jpg";
import cMain from "@/assets/c-main.jpg";
import cDessert from "@/assets/c-dessert.jpg";
import cDrink from "@/assets/c-drink.jpg";

export const ALLERGENS = [
  { id: "gluten", label: "Глютен" },
  { id: "lactose", label: "Лактоза" },
  { id: "nuts", label: "Орехи" },
  { id: "peanut", label: "Арахис" },
  { id: "eggs", label: "Яйца" },
  { id: "fish", label: "Рыба" },
  { id: "seafood", label: "Морепродукты" },
  { id: "soy", label: "Соя" },
  { id: "sesame", label: "Кунжут" },
] as const;
export type AllergenId = (typeof ALLERGENS)[number]["id"];

export const CATEGORIES = [
  { id: "starter", label: "Закуски", img: cStarter },
  { id: "main", label: "Основные", img: cMain },
  { id: "dessert", label: "Десерты", img: cDessert },
  { id: "drink", label: "Напитки", img: cDrink },
] as const;
export type CategoryId = (typeof CATEGORIES)[number]["id"];

export interface Dish {
  id: string;
  name: string;
  description: string;
  price: number;
  category: CategoryId;
  kcal: number;
  p: number;
  f: number;
  c: number;
  allergens: AllergenId[];
  img: string;
}
export interface Table {
  id: string;
  number: number;
  seats: number;
  x: number;
  y: number;
}
export interface Restaurant {
  id: string;
  name: string;
  cuisine: string;
  rating: number;
  address: string;
  img: string;
  dishes: Dish[];
  tables: Table[];
}

type Raw = [string, string, number, CategoryId, number, number, number, number, AllergenId[]];

const menus: Record<string, Raw[]> = {
  trattoria: [
    ["Брускетта с томатами", "Хрустящий хлеб, томаты, базилик", 450, "starter", 220, 6, 8, 30, ["gluten"]],
    ["Капрезе", "Моцарелла, томаты, песто", 590, "starter", 310, 16, 24, 6, ["lactose", "nuts"]],
    ["Карпаччо из говядины", "Руккола, пармезан, каперсы", 790, "starter", 260, 22, 17, 3, ["lactose"]],
    ["Тальятелле болоньезе", "Домашняя паста, рагу из говядины", 890, "main", 720, 34, 26, 82, ["gluten", "eggs", "lactose"]],
    ["Ризотто с грибами", "Белые грибы, пармезан", 850, "main", 640, 16, 22, 88, ["lactose"]],
    ["Пицца Маргарита", "Томаты, моцарелла, базилик", 690, "main", 820, 32, 28, 104, ["gluten", "lactose"]],
    ["Спагетти с морепродуктами", "Креветки, мидии, чеснок", 1190, "main", 680, 38, 18, 86, ["gluten", "seafood"]],
    ["Сибас на гриле", "Овощи гриль, лимон", 1390, "main", 420, 44, 22, 8, ["fish"]],
    ["Лазанья", "Говядина, бешамель", 920, "main", 780, 38, 40, 62, ["gluten", "lactose", "eggs"]],
    ["Тирамису", "Маскарпоне, кофе, какао", 490, "dessert", 450, 8, 28, 40, ["lactose", "eggs", "gluten"]],
    ["Панна котта", "Сливки, ягодный соус", 420, "dessert", 340, 4, 24, 28, ["lactose"]],
    ["Джелато фисташковое", "Два шарика", 380, "dessert", 280, 6, 16, 30, ["lactose", "nuts"]],
    ["Лимонад домашний", "Лимон, мята", 290, "drink", 120, 0, 0, 30, []],
    ["Эспрессо", "Двойной", 220, "drink", 5, 0, 0, 1, []],
  ],
  sushi: [
    ["Эдамаме", "Соевые бобы с солью", 390, "starter", 190, 17, 8, 14, ["soy"]],
    ["Салат с вакаме", "Водоросли, кунжутный соус", 420, "starter", 150, 3, 9, 14, ["sesame", "soy"]],
    ["Мисо-суп", "Тофу, вакаме, лук", 350, "starter", 90, 7, 3, 9, ["soy"]],
    ["Ролл Филадельфия", "Лосось, сливочный сыр", 790, "main", 480, 22, 18, 56, ["fish", "lactose", "sesame"]],
    ["Ролл Калифорния", "Краб, авокадо, тобико", 690, "main", 420, 14, 16, 54, ["seafood", "eggs", "sesame"]],
    ["Сашими лосось", "8 кусочков", 890, "main", 280, 32, 16, 0, ["fish"]],
    ["Рамен тонкоцу", "Свинина, яйцо, лапша", 950, "main", 760, 36, 30, 84, ["gluten", "eggs", "soy"]],
    ["Темпура креветки", "Соус тентсую", 820, "main", 520, 24, 26, 46, ["seafood", "gluten", "eggs"]],
    ["Якитори", "Курица на шпажках, соус тарэ", 650, "main", 380, 34, 14, 22, ["soy", "sesame"]],
    ["Поке с тунцом", "Рис, тунец, авокадо", 880, "main", 560, 30, 18, 68, ["fish", "soy", "sesame"]],
    ["Моти", "Рисовые пирожные, 3 шт", 390, "dessert", 260, 3, 4, 54, []],
    ["Чизкейк матча", "Зелёный чай", 450, "dessert", 390, 7, 24, 36, ["lactose", "eggs", "gluten"]],
    ["Матча латте", "На овсяном молоке", 340, "drink", 140, 3, 5, 20, ["gluten"]],
    ["Сенча", "Зелёный чай, чайник", 290, "drink", 2, 0, 0, 0, []],
  ],
  georgian: [
    ["Пхали ассорти", "Шпинат, свёкла, грецкий орех", 520, "starter", 290, 9, 22, 14, ["nuts"]],
    ["Баклажаны с орехами", "Рулетики, гранат", 490, "starter", 320, 6, 26, 16, ["nuts"]],
    ["Сулугуни жареный", "С мятой", 560, "starter", 420, 26, 32, 4, ["lactose"]],
    ["Хачапури по-аджарски", "Сыр, яйцо, масло", 690, "main", 980, 36, 48, 98, ["gluten", "lactose", "eggs"]],
    ["Хинкали с говядиной", "5 штук", 590, "main", 640, 32, 26, 66, ["gluten"]],
    ["Шашлык из баранины", "Лук, лаваш", 1190, "main", 720, 52, 52, 12, ["gluten"]],
    ["Чкмерули", "Цыплёнок в сливочно-чесночном соусе", 990, "main", 680, 48, 48, 8, ["lactose"]],
    ["Чахохбили", "Курица в томатах", 850, "main", 460, 40, 24, 18, []],
    ["Форель на кеци", "С гранатом", 1090, "main", 380, 42, 20, 6, ["fish"]],
    ["Пеламуши", "Виноградный десерт", 380, "dessert", 240, 2, 4, 50, ["nuts"]],
    ["Пахлава", "Мёд, орехи", 420, "dessert", 460, 7, 26, 52, ["gluten", "nuts"]],
    ["Тархун", "Домашний лимонад", 290, "drink", 110, 0, 0, 28, []],
    ["Боржоми", "0,5 л", 260, "drink", 0, 0, 0, 0, []],
  ],
  green: [
    ["Хумус с овощами", "Нут, тахини, крудите", 450, "starter", 320, 11, 18, 30, ["sesame"]],
    ["Гуакамоле", "Начос из кукурузы", 490, "starter", 380, 5, 26, 32, []],
    ["Спринг-роллы", "Рисовая бумага, арахисовый соус", 520, "starter", 260, 8, 10, 34, ["peanut", "soy"]],
    ["Боул с киноа", "Нут, авокадо, капуста", 690, "main", 540, 18, 22, 66, ["sesame"]],
    ["Бургер с фалафелем", "Веганская булочка", 720, "main", 610, 22, 24, 74, ["gluten", "sesame"]],
    ["Карри с тофу", "Кокосовое молоко, рис", 750, "main", 580, 20, 26, 64, ["soy"]],
    ["Пад-тай веган", "Рисовая лапша, арахис", 740, "main", 620, 18, 22, 86, ["peanut", "soy"]],
    ["Салат с лососем", "Микс салатов, киноа", 820, "main", 430, 30, 24, 22, ["fish"]],
    ["Тыквенный суп", "Кокосовые сливки", 450, "main", 240, 4, 14, 26, []],
    ["Сырник веган", "Кешью, ягоды", 480, "dessert", 360, 8, 22, 32, ["nuts"]],
    ["Энергетический шарик", "Финики, какао", 220, "dessert", 180, 4, 8, 24, ["nuts"]],
    ["Смузи зелёный", "Шпинат, банан, яблоко", 390, "drink", 180, 3, 1, 40, []],
    ["Капучино на овсяном", "Двойной", 320, "drink", 130, 3, 5, 18, ["gluten"]],
  ],
  burger: [
    ["Картофель фри", "С соусом", 290, "starter", 380, 4, 18, 48, []],
    ["Луковые кольца", "В пивном кляре", 350, "starter", 410, 6, 22, 44, ["gluten", "eggs"]],
    ["Крылья баффало", "8 шт, соус блю чиз", 590, "starter", 620, 42, 44, 8, ["lactose"]],
    ["Классический бургер", "Говядина, чеддер, соленья", 690, "main", 820, 42, 46, 52, ["gluten", "lactose", "sesame"]],
    ["Бекон-бургер", "Двойная котлета, бекон", 890, "main", 1150, 64, 72, 54, ["gluten", "lactose", "sesame", "eggs"]],
    ["Чикен-бургер", "Хрустящая курица, коул-слоу", 650, "main", 760, 38, 36, 66, ["gluten", "eggs", "sesame"]],
    ["Стейк рибай", "300 г, овощи", 1990, "main", 880, 70, 64, 6, []],
    ["Рёбрышки BBQ", "Соус барбекю, кукуруза", 1290, "main", 960, 56, 64, 38, ["soy"]],
    ["Фиш-энд-чипс", "Треска, тартар", 790, "main", 840, 36, 44, 72, ["fish", "gluten", "eggs"]],
    ["Цезарь с креветками", "Пармезан, гренки", 690, "main", 450, 28, 28, 20, ["seafood", "gluten", "eggs", "lactose"]],
    ["Брауни", "С пломбиром", 420, "dessert", 540, 7, 30, 62, ["gluten", "eggs", "lactose", "nuts"]],
    ["Чизкейк Нью-Йорк", "Классический", 450, "dessert", 480, 8, 32, 40, ["gluten", "eggs", "lactose"]],
    ["Милкшейк", "Ваниль / шоколад", 390, "drink", 520, 12, 22, 68, ["lactose"]],
    ["Кола", "0,4 л", 190, "drink", 170, 0, 0, 42, []],
    ["Арахисовый шейк", "Арахисовая паста, банан", 420, "drink", 610, 18, 30, 66, ["peanut", "lactose"]],
  ],
};

function makeTables(prefix: string, count: number): Table[] {
  const seatsCycle = [2, 4, 2, 6, 4, 2, 4, 8, 2, 4, 6, 4, 2, 4, 6];
  const cols = 4;
  return Array.from({ length: count }, (_, i) => ({
    id: `${prefix}-t${i + 1}`,
    number: i + 1,
    seats: seatsCycle[i % seatsCycle.length],
    x: i % cols,
    y: Math.floor(i / cols),
  }));
}

function build(id: string, name: string, cuisine: string, rating: number, address: string, img: string, menu: Raw[], tables: number): Restaurant {
  return {
    id, name, cuisine, rating, address, img,
    dishes: menu.map(([n, d, price, category, kcal, p, f, c, allergens], i) => ({
      id: `${id}-d${i + 1}`, name: n, description: d, price, category, kcal, p, f, c, allergens,
      img: CATEGORIES.find((x) => x.id === category)!.img,
    })),
    tables: makeTables(id, tables),
  };
}

export const RESTAURANTS: Restaurant[] = [
  build("trattoria", "La Nostra Cucina", "Итальянская", 4.8, "ул. Абая, 12", r1, menus.trattoria, 12),
  build("sushi", "Umami Bar", "Японская", 4.7, "пр. Достык, 45", r2, menus.sushi, 10),
  build("georgian", "Сакартвело", "Грузинская", 4.9, "ул. Панфилова, 8", r3, menus.georgian, 15),
  build("green", "Green Bowl", "Веганская", 4.6, "ул. Жибек Жолы, 30", r4, menus.green, 11),
  build("burger", "Smoke & Grill", "Американская", 4.5, "ул. Сатпаева, 90", r5, menus.burger, 13),
];

export const getRestaurant = (id: string) => RESTAURANTS.find((r) => r.id === id);
