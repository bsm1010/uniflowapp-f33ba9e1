/**
 * Demo product data per theme niche for the theme gallery preview.
 * Uses placeholder image URLs from picsum.photos with deterministic seeds.
 */

export interface DemoProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  category: string;
  stock: number;
  badge?: "sale" | "new" | "best-seller";
  description?: string;
}

function img(seed: number, w = 600, h = 800): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

const DEMO_DATA: Record<string, DemoProduct[]> = {
  streetwear: [
    { id: "sw1", name: "Oversized Graphic Tee", price: 49.99, images: [img(101)], category: "T-Shirts", stock: 25, badge: "new" },
    { id: "sw2", name: "Cargo Joggers", price: 89.99, images: [img(102)], category: "Bottoms", stock: 12 },
    { id: "sw3", name: "Puffer Vest", price: 129.99, images: [img(103)], category: "Outerwear", stock: 8, badge: "best-seller" },
    { id: "sw4", name: "Distressed Hoodie", price: 79.99, images: [img(104)], category: "Hoodies", stock: 15 },
    { id: "sw5", name: "Washed Denim Jacket", price: 149.99, images: [img(105)], category: "Outerwear", stock: 6 },
    { id: "sw6", name: "Box Logo Cap", price: 34.99, images: [img(106)], category: "Accessories", stock: 30, badge: "sale" },
    { id: "sw7", name: "Tech Fleece Pants", price: 99.99, images: [img(107)], category: "Bottoms", stock: 20 },
    { id: "sw8", name: "Chain Necklace Set", price: 24.99, images: [img(108)], category: "Accessories", stock: 50 },
  ],
  luxe: [
    { id: "lx1", name: "Cashmere Coat", price: 890, images: [img(201)], category: "Outerwear", stock: 5, badge: "new" },
    { id: "lx2", name: "Silk Blouse", price: 320, images: [img(202)], category: "Tops", stock: 12 },
    { id: "lx3", name: "Tailored Trousers", price: 450, images: [img(203)], category: "Bottoms", stock: 8 },
    { id: "lx4", name: "Leather Tote Bag", price: 680, images: [img(204)], category: "Bags", stock: 4, badge: "best-seller" },
    { id: "lx5", name: "Wool Midi Skirt", price: 380, images: [img(205)], category: "Bottoms", stock: 10 },
    { id: "lx6", name: "Merino Turtleneck", price: 290, images: [img(206)], category: "Tops", stock: 15 },
    { id: "lx7", name: "Calfskin Belt", price: 195, images: [img(207)], category: "Accessories", stock: 20 },
    { id: "lx8", name: "Draped Evening Dress", price: 1200, images: [img(208)], category: "Dresses", stock: 3 },
  ],
  techflow: [
    { id: "tf1", name: "Wireless Earbuds Pro", price: 149.99, images: [img(301)], category: "Audio", stock: 50, badge: "best-seller" },
    { id: "tf2", name: "Smart Watch Ultra", price: 399.99, images: [img(302)], category: "Wearables", stock: 20, badge: "new" },
    { id: "tf3", name: "USB-C Hub 7-in-1", price: 59.99, images: [img(303)], category: "Accessories", stock: 100 },
    { id: "tf4", name: "Mechanical Keyboard", price: 129.99, images: [img(304)], category: "Peripherals", stock: 35 },
    { id: "tf5", name: "Portable SSD 1TB", price: 89.99, images: [img(305)], category: "Storage", stock: 60 },
    { id: "tf6", name: "Webcam 4K", price: 79.99, images: [img(306)], category: "Peripherals", stock: 45 },
    { id: "tf7", name: "Power Bank 20000mAh", price: 44.99, images: [img(307)], category: "Accessories", stock: 80, badge: "sale" },
    { id: "tf8", name: "LED Desk Lamp", price: 69.99, images: [img(308)], category: "Accessories", stock: 25 },
  ],
  habitat: [
    { id: "hb1", name: "Linen Throw Pillow", price: 45, images: [img(401)], category: "Textiles", stock: 40 },
    { id: "hb2", name: "Ceramic Vase", price: 78, images: [img(402)], category: "Decor", stock: 15, badge: "new" },
    { id: "hb3", name: "Walnut Side Table", price: 290, images: [img(403)], category: "Furniture", stock: 8 },
    { id: "hb4", name: "Scented Candle Set", price: 38, images: [img(404)], category: "Candles", stock: 60, badge: "best-seller" },
    { id: "hb5", name: "Woven Storage Basket", price: 55, images: [img(405)], category: "Storage", stock: 25 },
    { id: "hb6", name: "Wall Art Print", price: 89, images: [img(406)], category: "Art", stock: 20 },
    { id: "hb7", name: "Cotton Throw Blanket", price: 68, images: [img(407)], category: "Textiles", stock: 30 },
    { id: "hb8", name: "Brass Table Lamp", price: 145, images: [img(408)], category: "Lighting", stock: 12 },
  ],
  bloom: [
    { id: "bl1", name: "Hydrating Serum", price: 48, images: [img(501)], category: "Skincare", stock: 80, badge: "best-seller" },
    { id: "bl2", name: "Matte Lipstick Set", price: 32, images: [img(502)], category: "Makeup", stock: 100 },
    { id: "bl3", name: "Rose Face Mist", price: 24, images: [img(503)], category: "Skincare", stock: 60, badge: "new" },
    { id: "bl4", name: "Vitamin C Cream", price: 56, images: [img(504)], category: "Skincare", stock: 45 },
    { id: "bl5", name: "Foundation Palette", price: 42, images: [img(505)], category: "Makeup", stock: 35 },
    { id: "bl6", name: "Hair Oil Treatment", price: 28, images: [img(506)], category: "Hair", stock: 70, badge: "sale" },
    { id: "bl7", name: "Makeup Brush Set", price: 38, images: [img(507)], category: "Tools", stock: 50 },
    { id: "bl8", name: "Eye Cream", price: 44, images: [img(508)], category: "Skincare", stock: 40 },
  ],
  ironclad: [
    { id: "ic1", name: "Resistance Bands Set", price: 29.99, images: [img(601)], category: "Equipment", stock: 100, badge: "best-seller" },
    { id: "ic2", name: "Pre-Workout Powder", price: 39.99, images: [img(602)], category: "Supplements", stock: 60 },
    { id: "ic3", name: "Lifting Gloves", price: 24.99, images: [img(603)], category: "Accessories", stock: 50 },
    { id: "ic4", name: "Gym Duffle Bag", price: 59.99, images: [img(604)], category: "Bags", stock: 30, badge: "new" },
    { id: "ic5", name: "Compression Tights", price: 44.99, images: [img(605)], category: "Apparel", stock: 40 },
    { id: "ic6", name: "Adjustable Dumbbells", price: 199.99, images: [img(606)], category: "Equipment", stock: 10 },
    { id: "ic7", name: "Whey Protein 2kg", price: 54.99, images: [img(607)], category: "Supplements", stock: 45 },
    { id: "ic8", name: "Jump Rope Pro", price: 19.99, images: [img(608)], category: "Equipment", stock: 80 },
  ],
  kickz: [
    { id: "kz1", name: "Air Max Retro", price: 179.99, images: [img(701)], category: "Running", stock: 15, badge: "new" },
    { id: "kz2", name: "High-Top Classics", price: 139.99, images: [img(702)], category: "Lifestyle", stock: 20, badge: "best-seller" },
    { id: "kz3", name: "Trail Runner Pro", price: 159.99, images: [img(703)], category: "Running", stock: 25 },
    { id: "kz4", name: "Skate Low", price: 99.99, images: [img(704)], category: "Skate", stock: 30 },
    { id: "kz5", name: "Limited Edition Collab", price: 249.99, images: [img(705)], category: "Limited", stock: 5, badge: "sale" },
    { id: "kz6", name: "Chunky Platform", price: 129.99, images: [img(706)], category: "Lifestyle", stock: 18 },
    { id: "kz7", name: "Basketball Elite", price: 189.99, images: [img(707)], category: "Basketball", stock: 12 },
    { id: "kz8", name: "Slip-On Comfort", price: 79.99, images: [img(708)], category: "Casual", stock: 40 },
  ],
  aurum: [
    { id: "au1", name: "Diamond Solitaire Ring", price: 2400, images: [img(801)], category: "Rings", stock: 3, badge: "best-seller" },
    { id: "au2", name: "Pearl Necklace", price: 580, images: [img(802)], category: "Necklaces", stock: 8 },
    { id: "au3", name: "Gold Hoop Earrings", price: 320, images: [img(803)], category: "Earrings", stock: 15, badge: "new" },
    { id: "au4", name: "Sapphire Pendant", price: 1200, images: [img(804)], category: "Necklaces", stock: 5 },
    { id: "au5", name: "Tennis Bracelet", price: 890, images: [img(805)], category: "Bracelets", stock: 6 },
    { id: "au6", name: "Signet Ring", price: 450, images: [img(806)], category: "Rings", stock: 10 },
    { id: "au7", name: "Charm Anklet", price: 180, images: [img(807)], category: "Anklets", stock: 20 },
    { id: "au8", name: "Cufflinks Set", price: 280, images: [img(808)], category: "Accessories", stock: 12 },
  ],
  playtime: [
    { id: "pt1", name: "Building Blocks 200pc", price: 34.99, images: [img(901)], category: "Building", stock: 50, badge: "best-seller" },
    { id: "pt2", name: "Plush Bear", price: 24.99, images: [img(902)], category: "Plush", stock: 40 },
    { id: "pt3", name: "Art Supply Kit", price: 29.99, images: [img(903)], category: "Creative", stock: 60, badge: "new" },
    { id: "pt4", name: "Remote Control Car", price: 49.99, images: [img(904)], category: "Vehicles", stock: 25 },
    { id: "pt5", name: "Science Experiment Set", price: 39.99, images: [img(905)], category: "STEM", stock: 35 },
    { id: "pt6", name: "Puzzle World Map", price: 19.99, images: [img(906)], category: "Puzzles", stock: 70 },
    { id: "pt7", name: "Play Kitchen Set", price: 89.99, images: [img(907)], category: "Pretend Play", stock: 15 },
    { id: "pt8", name: "Board Game Collection", price: 44.99, images: [img(908)], category: "Games", stock: 30 },
  ],
  pawpal: [
    { id: "pp1", name: "Premium Dog Food 5kg", price: 42.99, images: [img(1001)], category: "Food", stock: 60, badge: "best-seller" },
    { id: "pp2", name: "Cat Scratching Tower", price: 79.99, images: [img(1002)], category: "Furniture", stock: 20 },
    { id: "pp3", name: "Adjustable Dog Harness", price: 34.99, images: [img(1003)], category: "Accessories", stock: 40, badge: "new" },
    { id: "pp4", name: "Interactive Toy Ball", price: 14.99, images: [img(1004)], category: "Toys", stock: 80 },
    { id: "pp5", name: "Pet Grooming Kit", price: 29.99, images: [img(1005)], category: "Grooming", stock: 35 },
    { id: "pp6", name: "Cozy Pet Bed Large", price: 59.99, images: [img(1006)], category: "Beds", stock: 25 },
    { id: "pp7", name: "Dental Chew Treats", price: 12.99, images: [img(1007)], category: "Treats", stock: 100, badge: "sale" },
    { id: "pp8", name: "Travel Water Bottle", price: 18.99, images: [img(1008)], category: "Accessories", stock: 50 },
  ],
  circuitry: [
    { id: "cr1", name: "4K Smart TV 55\"", price: 599.99, images: [img(1101)], category: "TVs", stock: 15, badge: "sale" },
    { id: "cr2", name: "Laptop Stand", price: 39.99, images: [img(1102)], category: "Accessories", stock: 80 },
    { id: "cr3", name: "Bluetooth Speaker", price: 79.99, images: [img(1103)], category: "Audio", stock: 45, badge: "best-seller" },
    { id: "cr4", name: "Wireless Mouse", price: 29.99, images: [img(1104)], category: "Peripherals", stock: 100 },
    { id: "cr5", name: "Smart Plug 4-Pack", price: 34.99, images: [img(1105)], category: "Smart Home", stock: 60 },
    { id: "cr6", name: "Monitor 27\" QHD", price: 349.99, images: [img(1106)], category: "Monitors", stock: 20 },
    { id: "cr7", name: "USB Microphone", price: 69.99, images: [img(1107)], category: "Audio", stock: 30, badge: "new" },
    { id: "cr8", name: "Phone Case Armor", price: 19.99, images: [img(1108)], category: "Accessories", stock: 150 },
  ],
  artisan: [
    { id: "ar1", name: "Hand-Knit Scarf", price: 65, images: [img(1201)], category: "Knitwear", stock: 12, badge: "new" },
    { id: "ar2", name: "Pottery Bowl Set", price: 88, images: [img(1202)], category: "Ceramics", stock: 8 },
    { id: "ar3", name: "Leather Journal", price: 42, images: [img(1203)], category: "Paper", stock: 30, badge: "best-seller" },
    { id: "ar4", name: "Beeswax Candles (3)", price: 28, images: [img(1204)], category: "Candles", stock: 40 },
    { id: "ar5", name: "Macramé Wall Hanging", price: 75, images: [img(1205)], category: "Decor", stock: 10 },
    { id: "ar6", name: "Handmade Soap Set", price: 22, images: [img(1206)], category: "Bath", stock: 50 },
    { id: "ar7", name: "Wooden Cutting Board", price: 55, images: [img(1207)], category: "Kitchen", stock: 18 },
    { id: "ar8", name: "Embroidered Cushion", price: 48, images: [img(1208)], category: "Textiles", stock: 15 },
  ],
  interior: [
    { id: "in1", name: "Modular Sofa", price: 2400, images: [img(1301)], category: "Sofas", stock: 4 },
    { id: "in2", name: "Oak Dining Table", price: 1800, images: [img(1302)], category: "Tables", stock: 6, badge: "new" },
    { id: "in3", name: "Bookshelf Oak", price: 580, images: [img(1303)], category: "Storage", stock: 10 },
    { id: "in4", name: "Floor Lamp Arc", price: 320, images: [img(1304)], category: "Lighting", stock: 15 },
    { id: "in5", name: "Lounge Chair", price: 890, images: [img(1305)], category: "Chairs", stock: 8, badge: "best-seller" },
    { id: "in6", name: "Bed Frame King", price: 1200, images: [img(1306)], category: "Beds", stock: 5 },
    { id: "in7", name: "Console Table", price: 450, images: [img(1307)], category: "Tables", stock: 12 },
    { id: "in8", name: "Mirror Round 80cm", price: 280, images: [img(1308)], category: "Decor", stock: 20 },
  ],
  brewhaus: [
    { id: "bh1", name: "Ethiopia Yirgacheffe 250g", price: 18.99, images: [img(1401)], category: "Single Origin", stock: 50, badge: "best-seller" },
    { id: "bh2", name: "Colombia Supremo 250g", price: 16.99, images: [img(1402)], category: "Single Origin", stock: 40 },
    { id: "bh3", name: "House Blend 500g", price: 24.99, images: [img(1403)], category: "Blends", stock: 80 },
    { id: "bh4", name: "Pour Over Kit", price: 49.99, images: [img(1404)], category: "Equipment", stock: 20, badge: "new" },
    { id: "bh5", name: "Ceramic Mug Set (2)", price: 32.99, images: [img(1405)], category: "Merch", stock: 30 },
    { id: "bh6", name: "Cold Brew Maker", price: 39.99, images: [img(1406)], category: "Equipment", stock: 25 },
    { id: "bh7", name: "Espresso Dark Roast", price: 19.99, images: [img(1407)], category: "Blends", stock: 60 },
    { id: "bh8", name: "Coffee Subscription Box", price: 44.99, images: [img(1408)], category: "Subscriptions", stock: 100, badge: "sale" },
  ],
  greens: [
    { id: "gr1", name: "Mixed Greens Box", price: 28.99, images: [img(1501)], category: "Vegetables", stock: 40, badge: "new" },
    { id: "gr2", name: "Organic Avocados (6)", price: 12.99, images: [img(1502)], category: "Fruits", stock: 60 },
    { id: "gr3", name: "Raw Honey 500ml", price: 15.99, images: [img(1503)], category: "Pantry", stock: 50, badge: "best-seller" },
    { id: "gr4", name: "Cold-Pressed Juice Set", price: 34.99, images: [img(1504)], category: "Beverages", stock: 30 },
    { id: "gr5", name: "Chia Seeds 500g", price: 9.99, images: [img(1505)], category: "Superfoods", stock: 80 },
    { id: "gr6", name: "Organic Olive Oil 750ml", price: 22.99, images: [img(1506)], category: "Pantry", stock: 45 },
    { id: "gr7", name: "Seasonal Fruit Box", price: 38.99, images: [img(1507)], category: "Fruits", stock: 25 },
    { id: "gr8", name: "Herbal Tea Collection", price: 18.99, images: [img(1508)], category: "Beverages", stock: 55, badge: "sale" },
  ],
  pixelcraft: [
    { id: "pc1", name: "UI Kit Pro", price: 49, images: [img(1601)], category: "Design", stock: 999, badge: "best-seller" },
    { id: "pc2", name: "Icon Pack 2000+", price: 29, images: [img(1602)], category: "Icons", stock: 999 },
    { id: "pc3", name: "Notion Templates", price: 19, images: [img(1603)], category: "Templates", stock: 999, badge: "new" },
    { id: "pc4", name: "Social Media Kit", price: 39, images: [img(1604)], category: "Marketing", stock: 999 },
    { id: "pc5", name: "Landing Page Builder", price: 79, images: [img(1605)], category: "Tools", stock: 999 },
    { id: "pc6", name: "Font Bundle", price: 59, images: [img(1606)], category: "Fonts", stock: 999 },
    { id: "pc7", name: "Mockup Collection", price: 34, images: [img(1607)], category: "Design", stock: 999, badge: "sale" },
    { id: "pc8", name: "E-book: Design Systems", price: 24, images: [img(1608)], category: "E-books", stock: 999 },
  ],
  gameforge: [
    { id: "gf1", name: "RGB Gaming Mouse", price: 69.99, images: [img(1701)], category: "Mice", stock: 40, badge: "best-seller" },
    { id: "gf2", name: "Mechanical Keyboard RGB", price: 149.99, images: [img(1702)], category: "Keyboards", stock: 25 },
    { id: "gf3", name: "Gaming Headset 7.1", price: 89.99, images: [img(1703)], category: "Audio", stock: 30, badge: "new" },
    { id: "gf4", name: "XXL Mouse Pad", price: 29.99, images: [img(1704)], category: "Accessories", stock: 60 },
    { id: "gf5", name: "Stream Deck Mini", price: 99.99, images: [img(1705)], category: "Streaming", stock: 15 },
    { id: "gf6", name: "Controller Pro", price: 59.99, images: [img(1706)], category: "Controllers", stock: 35, badge: "sale" },
    { id: "gf7", name: "Gaming Chair", price: 299.99, images: [img(1707)], category: "Furniture", stock: 10 },
    { id: "gf8", name: "LED Light Strip Kit", price: 24.99, images: [img(1708)], category: "Accessories", stock: 80 },
  ],
  athlete: [
    { id: "at1", name: "Running Shoes Elite", price: 139.99, images: [img(1801)], category: "Footwear", stock: 25, badge: "new" },
    { id: "at2", name: "Yoga Mat Premium", price: 49.99, images: [img(1802)], category: "Yoga", stock: 40 },
    { id: "at3", name: "Tennis Racket Pro", price: 189.99, images: [img(1803)], category: "Tennis", stock: 15, badge: "best-seller" },
    { id: "at4", name: "Swimming Goggles", price: 29.99, images: [img(1804)], category: "Swimming", stock: 50 },
    { id: "at5", name: "Basketball Official", price: 34.99, images: [img(1805)], category: "Basketball", stock: 35 },
    { id: "at6", name: "Cycling Jersey", price: 79.99, images: [img(1806)], category: "Cycling", stock: 20 },
    { id: "at7", name: "Fitness Tracker Band", price: 59.99, images: [img(1807)], category: "Wearables", stock: 45, badge: "sale" },
    { id: "at8", name: "Boxing Gloves 12oz", price: 54.99, images: [img(1808)], category: "Boxing", stock: 30 },
  ],
  chronos: [
    { id: "ch1", name: "Classic Automatic", price: 4200, images: [img(1901)], category: "Automatic", stock: 3, badge: "new" },
    { id: "ch2", name: "Dive Watch 200m", price: 2800, images: [img(1902)], category: "Sport", stock: 5 },
    { id: "ch3", name: "Dress Watch Rose Gold", price: 3600, images: [img(1903)], category: "Dress", stock: 4, badge: "best-seller" },
    { id: "ch4", name: "Chronograph Black", price: 5100, images: [img(1904)], category: "Chronograph", stock: 2 },
    { id: "ch5", name: "Minimalist Quartz", price: 890, images: [img(1905)], category: "Quartz", stock: 10 },
    { id: "ch6", name: "Leather Watch Strap", price: 120, images: [img(1906)], category: "Straps", stock: 25 },
    { id: "ch7", name: "GMT Traveler", price: 4800, images: [img(1907)], category: "Sport", stock: 3 },
    { id: "ch8", name: "Watch Winder Box", price: 340, images: [img(1908)], category: "Accessories", stock: 8 },
  ],
  trendmart: [
    { id: "tm1", name: "LED Ring Light", price: 29.99, images: [img(2001)], category: "Electronics", stock: 80, badge: "best-seller" },
    { id: "tm2", name: "Phone Holder Tripod", price: 19.99, images: [img(2002)], category: "Accessories", stock: 100 },
    { id: "tm3", name: "Posture Corrector", price: 24.99, images: [img(2003)], category: "Health", stock: 60, badge: "sale" },
    { id: "tm4", name: "Sunset Lamp", price: 34.99, images: [img(2004)], category: "Home", stock: 45, badge: "new" },
    { id: "tm5", name: "Portable Blender", price: 39.99, images: [img(2005)], category: "Kitchen", stock: 55 },
    { id: "tm6", name: "Cloud Slides", price: 27.99, images: [img(2006)], category: "Footwear", stock: 70 },
    { id: "tm7", name: "Mini Projector", price: 89.99, images: [img(2007)], category: "Electronics", stock: 20 },
    { id: "tm8", name: "Neck Massager", price: 44.99, images: [img(2008)], category: "Health", stock: 35 },
  ],
};

export function getDemoProducts(themeId: string): DemoProduct[] {
  return DEMO_DATA[themeId] ?? [];
}

export function getAllThemeDemoData(): Record<string, DemoProduct[]> {
  return DEMO_DATA;
}
