export type MenuDish = { category: string; name: string; ingredients: string; calories: number; protein: number; fat: number; carbs: number };

export const MENU_CATEGORIES = ["All", "Starters", "Salads", "Soups", "Mains", "Pasta & risotto", "Desserts"];

export const MENU: MenuDish[] = [
  { category: "Starters", name: "Beef tartare with truffle cream and parmesan", ingredients: "Marbled beef tenderloin, truffle cream, Worcestershire sauce, capers, shallot, olive oil, parmesan, quail egg, salad mix, ciabatta croutons.", calories: 340, protein: 24, fat: 22, carbs: 12 },
  { category: "Starters", name: "Octopus carpaccio with capers and citrus dressing", ingredients: "Sous-vide octopus, capers, cherry tomatoes, arugula, lemon juice, extra virgin olive oil, balsamic cream, sea salt.", calories: 190, protein: 16, fat: 12, carbs: 4 },
  { category: "Starters", name: "Bruschetta with stracciatella, sun-dried tomatoes and basil", ingredients: "Sourdough ciabatta, stracciatella, sun-dried tomatoes, fresh basil, pine nuts, olive oil, balsamic.", calories: 310, protein: 10, fat: 16, carbs: 32 },
  { category: "Starters", name: "Baked camembert with rosemary, honey and walnuts", ingredients: "Camembert, honey, walnuts, fresh rosemary, toasted baguette.", calories: 450, protein: 20, fat: 34, carbs: 18 },
  { category: "Starters", name: "Salmon poke with avocado and mango-chili sauce", ingredients: "Lightly salted salmon, sushi rice, avocado, edamame, chuka, mango-chili sauce, sesame, nori.", calories: 480, protein: 22, fat: 20, carbs: 54 },
  { category: "Salads", name: "Crispy eggplant salad with tomatoes and stracciatella", ingredients: "Fried eggplant in starch, fresh tomatoes, stracciatella, cilantro, sweet chili sauce, sesame oil, nut sauce.", calories: 390, protein: 11, fat: 24, carbs: 33 },
  { category: "Salads", name: "Caesar with grilled tiger prawns", ingredients: "Tiger prawns, romaine, cherry tomatoes, parmesan, white bread croutons, classic Caesar dressing.", calories: 360, protein: 25, fat: 18, carbs: 22 },
  { category: "Salads", name: "Duck breast salad with fig and port sauce", ingredients: "Seared sous-vide duck breast, fresh fig, arugula and spinach, goat cheese, walnuts, port and berry sauce.", calories: 420, protein: 26, fat: 22, carbs: 28 },
  { category: "Soups", name: "Pumpkin cream soup with prawns and coconut milk", ingredients: "Roasted pumpkin, coconut milk, onion, ginger, tiger prawn skewer, pumpkin seeds, pumpkin seed oil.", calories: 280, protein: 14, fat: 15, carbs: 22 },
  { category: "Soups", name: "Porcini cream soup with truffle oil", ingredients: "Porcini, champignons, potato, 22% cream, onion, garlic, truffle oil, mini croutons.", calories: 320, protein: 6, fat: 22, carbs: 24 },
  { category: "Mains", name: "Ribeye steak with pepper sauce", ingredients: "Ribeye steak, butter, thyme, garlic, creamy demi-glace with green peppercorns.", calories: 650, protein: 42, fat: 52, carbs: 4 },
  { category: "Mains", name: "Striploin steak with rosemary butter", ingredients: "Striploin steak, rosemary-garlic butter, coarse sea salt, salsa verde.", calories: 540, protein: 46, fat: 38, carbs: 2 },
  { category: "Mains", name: "Filet mignon with truffle mash", ingredients: "Beef tenderloin, potato mash with truffle paste and cream, demi-glace.", calories: 490, protein: 38, fat: 26, carbs: 25 },
  { category: "Mains", name: "Duck breast with berry confit and sweet potato", ingredients: "Crispy-skin duck breast, sweet potato purée, cranberry-lingonberry sauce, microgreens.", calories: 530, protein: 32, fat: 30, carbs: 34 },
  { category: "Mains", name: "Salmon fillet with broccolini and beurre blanc", ingredients: "Grilled salmon, broccolini, beurre blanc (white wine, butter, shallot), lemon wedge.", calories: 510, protein: 34, fat: 36, carbs: 6 },
  { category: "Pasta & risotto", name: "Tagliatelle with tiger prawns in creamy bisque", ingredients: "Tagliatelle, tiger prawns, bisque sauce, cherry tomatoes, herbs.", calories: 580, protein: 24, fat: 22, carbs: 70 },
  { category: "Pasta & risotto", name: "Seafood spaghetti in tomato sauce", ingredients: "Durum wheat spaghetti, mussels, squid, prawns, octopus, marinara, olive oil.", calories: 520, protein: 28, fat: 14, carbs: 68 },
  { category: "Pasta & risotto", name: "Porcini risotto with truffle paste", ingredients: "Arborio rice, porcini, vegetable stock, shallot, dry white wine, butter, parmesan, truffle paste.", calories: 560, protein: 12, fat: 24, carbs: 72 },
  { category: "Desserts", name: "Chocolate fondant with vanilla ice cream", ingredients: "Dark Belgian chocolate sponge with a molten center, butter, eggs, sugar, cocoa, vanilla ice cream, mint.", calories: 480, protein: 7, fat: 28, carbs: 52 },
  { category: "Desserts", name: "San Sebastián cheesecake with salted caramel", ingredients: "Cream cheese, 33% cream, eggs, sugar, corn starch, homemade salted caramel.", calories: 520, protein: 9, fat: 38, carbs: 36 },
];
