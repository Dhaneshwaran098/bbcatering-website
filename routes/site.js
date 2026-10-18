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

router.get('/', async (req, res) => {
  const [dishes, menus, gallery, videos, settings] = await Promise.all([
    store.getDishes(),
    store.getMenus(),
    store.getGallery(),
    store.getVideos(),
    store.getSettings(),
  ]);
  const featured = dishes.filter((d) => d.featured).slice(0, 4);
  const popular = featured.length ? featured : dishes.slice(0, 4);
  res.render('index', {
    page: 'home',
    settings,
    menus,
    popularDishes: popular,
    galleryPreview: gallery.slice(0, 6),
    videosPreview: videos.slice(0, 3),
  });
});

router.get('/about', async (req, res) => {
  const settings = await store.getSettings();
  res.render('about', { page: 'about', settings });
});

router.get('/services', async (req, res) => {
  const settings = await store.getSettings();
  res.render('services', { page: 'services', settings });
});

router.get('/menu', async (req, res) => {
  const [dishes, menus, settings] = await Promise.all([
    store.getDishes(),
    store.getMenus(),
    store.getSettings(),
  ]);
  const grouped = groupByCategory(dishes);
  const categories = CATEGORY_ORDER.filter((c) => grouped[c] && grouped[c].length);
  // include any custom categories not in the fixed order, at the end
  Object.keys(grouped).forEach((c) => { if (!categories.includes(c)) categories.push(c); });
  res.render('menu', {
    page: 'menu',
    settings,
    menus,
    categories,
    grouped,
  });
});

router.get('/gallery', async (req, res) => {
  const [gallery, videos, settings] = await Promise.all([
    store.getGallery(),
    store.getVideos(),
    store.getSettings(),
  ]);
  const categories = [...new Set(gallery.map((g) => g.category))];
  res.render('gallery', {
    page: 'gallery',
    settings,
    gallery,
    videos,
    categories,
  });
});

router.get('/contact', async (req, res) => {
  const settings = await store.getSettings();
  res.render('contact', { page: 'contact', settings, success: req.query.success === '1' });
});

router.post('/api/enquiries', async (req, res) => {
  const body = req.body || {};
  if (!body.name || !body.phone) {
    return res.status(400).json({ ok: false, error: 'Name and phone number are required.' });
  }

  const newEnquiry = await store.addEnquiry(body);
  res.json({ ok: true, enquiry: newEnquiry });
});

router.post('/contact', async (req, res) => {
  const body = req.body || {};
  if (body.name && body.phone) {
    await store.addEnquiry(body);
  }
  res.redirect('/contact?success=1');
});

module.exports = router;

