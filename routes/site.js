const { Router } = require('../lib/router');
const router = new Router();
const store = require('../lib/store');

// Fixed category order used across the menu page and filters
const CATEGORY_ORDER = [
  'Mutton', 'Chicken', 'Fish & Seafood', 'Traditional Madurai',
  'Biriyani & Rice', 'Starters', 'Vegetarian', 'Desserts',
];

function groupByCategory(dishes) {
  const groups = {};
  dishes.forEach((d) => {
    if (!groups[d.category]) groups[d.category] = [];
    groups[d.category].push(d);
  });
  return groups;
}

router.get('/', (req, res) => {
  const dishes = store.getDishes();
  const gallery = store.getGallery();
  const settings = store.getSettings();
  const featured = dishes.filter((d) => d.featured).slice(0, 4);
  const popular = featured.length ? featured : dishes.slice(0, 4);
  res.render('index', {
    page: 'home',
    settings,
    popularDishes: popular,
    galleryPreview: gallery.slice(0, 4),
  });
});

router.get('/about', (req, res) => {
  res.render('about', { page: 'about', settings: store.getSettings() });
});

router.get('/services', (req, res) => {
  res.render('services', { page: 'services', settings: store.getSettings() });
});

router.get('/menu', (req, res) => {
  const dishes = store.getDishes();
  const grouped = groupByCategory(dishes);
  const categories = CATEGORY_ORDER.filter((c) => grouped[c] && grouped[c].length);
  // include any custom categories not in the fixed order, at the end
  Object.keys(grouped).forEach((c) => { if (!categories.includes(c)) categories.push(c); });
  res.render('menu', {
    page: 'menu',
    settings: store.getSettings(),
    categories,
    grouped,
  });
});

router.get('/gallery', (req, res) => {
  const gallery = store.getGallery();
  const categories = [...new Set(gallery.map((g) => g.category))];
  res.render('gallery', {
    page: 'gallery',
    settings: store.getSettings(),
    gallery,
    categories,
  });
});

router.get('/contact', (req, res) => {
  res.render('contact', { page: 'contact', settings: store.getSettings() });
});

module.exports = router;
