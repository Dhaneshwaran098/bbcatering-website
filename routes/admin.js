const { Router } = require('../lib/router');
const router = new Router();
const fs = require('fs');
const path = require('path');
const store = require('../lib/store');
const upload = require('../middleware/upload');
const requireAdmin = require('../middleware/requireAdmin');

const CATEGORY_OPTIONS = [
  'Mutton', 'Chicken', 'Fish & Seafood', 'Traditional Madurai',
  'Biriyani & Rice', 'Starters', 'Desserts', 'Vegetarian',
];
const GALLERY_CATEGORY_OPTIONS = ['dishes', 'prep', 'events', 'setups'];

router.use(requireAdmin);

function deleteUploadedFile(imagePath) {
  if (!imagePath || !imagePath.startsWith('/uploads/')) return;
  if (imagePath.includes('placeholder-')) return; // never delete shared placeholders
  const full = path.join(__dirname, '..', 'public', imagePath);
  fs.unlink(full, () => {}); // best-effort; ignore errors (file may already be gone)
}

// ---------- Dashboard home ----------
router.get('/', (req, res) => {
  const dishes = store.getDishes();
  const gallery = store.getGallery();
  res.render('admin/dashboard', {
    dishCount: dishes.length,
    galleryCount: gallery.length,
    categoryCount: new Set(dishes.map((d) => d.category)).size,
    msg: req.query.msg || null,
  });
});

// ---------- Menu management ----------
router.get('/menu', (req, res) => {
  const dishes = store.getDishes().sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));
  res.render('admin/menu', {
    dishes,
    categoryOptions: CATEGORY_OPTIONS,
    msg: req.query.msg || null,
    editDish: null,
  });
});

router.get('/menu/:id/edit', (req, res) => {
  const dishes = store.getDishes();
  const editDish = dishes.find((d) => d.id === req.params.id);
  if (!editDish) return res.redirect('/admin/menu?msg=Dish not found');
  res.render('admin/menu', {
    dishes: dishes.sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name)),
    categoryOptions: CATEGORY_OPTIONS,
    msg: null,
    editDish,
  });
});

router.post('/menu', upload.single('image'), (req, res) => {
  const dishes = store.getDishes();
  const { name, category, price, unit, spice, featured } = req.body;

  if (!name || !category || !price) {
    return res.redirect('/admin/menu?msg=' + encodeURIComponent('Name, category and price are required.'));
  }

  const newDish = {
    id: store.generateId('d'),
    name: name.trim(),
    category,
    price: Number(price) || 0,
    unit: (unit || 'per kg').trim(),
    spice: Math.min(3, Math.max(0, Number(spice) || 0)),
    image: req.file ? `/uploads/${req.file.filename}` : '/uploads/placeholder-dish.svg',
    featured: featured === 'on',
  };

  dishes.push(newDish);
  store.saveDishes(dishes);
  res.redirect('/admin/menu?msg=' + encodeURIComponent(`"${newDish.name}" added.`));
});

router.post('/menu/:id/update', upload.single('image'), (req, res) => {
  const dishes = store.getDishes();
  const dish = dishes.find((d) => d.id === req.params.id);
  if (!dish) return res.redirect('/admin/menu?msg=' + encodeURIComponent('Dish not found.'));

  const { name, category, price, unit, spice, featured } = req.body;
  if (!name || !category || !price) {
    return res.redirect(`/admin/menu/${dish.id}/edit?msg=` + encodeURIComponent('Name, category and price are required.'));
  }

  dish.name = name.trim();
  dish.category = category;
  dish.price = Number(price) || 0;
  dish.unit = (unit || 'per kg').trim();
  dish.spice = Math.min(3, Math.max(0, Number(spice) || 0));
  dish.featured = featured === 'on';

  if (req.file) {
    deleteUploadedFile(dish.image);
    dish.image = `/uploads/${req.file.filename}`;
  }

  store.saveDishes(dishes);
  res.redirect('/admin/menu?msg=' + encodeURIComponent(`"${dish.name}" updated.`));
});

router.post('/menu/:id/delete', (req, res) => {
  let dishes = store.getDishes();
  const dish = dishes.find((d) => d.id === req.params.id);
  if (dish) deleteUploadedFile(dish.image);
  dishes = dishes.filter((d) => d.id !== req.params.id);
  store.saveDishes(dishes);
  res.redirect('/admin/menu?msg=' + encodeURIComponent('Dish deleted.'));
});

// ---------- Gallery management ----------
router.get('/gallery', (req, res) => {
  const gallery = store.getGallery().slice().reverse();
  res.render('admin/gallery', {
    gallery,
    categoryOptions: GALLERY_CATEGORY_OPTIONS,
    msg: req.query.msg || null,
  });
});

router.post('/gallery', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.redirect('/admin/gallery?msg=' + encodeURIComponent('Please choose a photo to upload.'));
  }
  const { caption, category } = req.body;
  const items = store.getGallery();
  items.push({
    id: store.generateId('g'),
    image: `/uploads/${req.file.filename}`,
    caption: (caption || '').trim() || 'Untitled',
    category: category || 'dishes',
  });
  store.saveGallery(items);
  res.redirect('/admin/gallery?msg=' + encodeURIComponent('Photo added to gallery.'));
});

router.post('/gallery/:id/delete', (req, res) => {
  let items = store.getGallery();
  const item = items.find((g) => g.id === req.params.id);
  if (item) deleteUploadedFile(item.image);
  items = items.filter((g) => g.id !== req.params.id);
  store.saveGallery(items);
  res.redirect('/admin/gallery?msg=' + encodeURIComponent('Photo removed.'));
});

// ---------- Site settings ----------
router.get('/settings', (req, res) => {
  res.render('admin/settings', {
    settings: store.getSettings(),
    msg: req.query.msg || null,
  });
});

router.post('/settings', upload.fields(['heroImage', 'logoImage', 'faviconImage']), (req, res) => {
  const settings = store.getSettings();
  const {
    businessName, tagline, aboutLede, yearsExperience, phone, whatsapp, email,
    address, addressLocality, addressRegion, domain, instagram, facebook, youtube, mapEmbedUrl,
  } = req.body;

  settings.businessName = businessName || settings.businessName;
  settings.tagline = tagline || settings.tagline;
  settings.aboutLede = aboutLede || settings.aboutLede;
  settings.yearsExperience = yearsExperience || settings.yearsExperience;
  settings.phone = phone || settings.phone;
  settings.whatsapp = (whatsapp || settings.whatsapp || '').replace(/\D/g, '');
  settings.email = email || settings.email;
  settings.address = address || settings.address;
  settings.addressLocality = addressLocality || settings.addressLocality;
  settings.addressRegion = addressRegion || settings.addressRegion;
  settings.domain = domain || settings.domain;
  settings.instagram = instagram || settings.instagram;
  settings.facebook = facebook || settings.facebook;
  settings.youtube = youtube || settings.youtube;
  settings.mapEmbedUrl = mapEmbedUrl || settings.mapEmbedUrl;

  if (req.files.heroImage) {
    deleteUploadedFile(settings.heroImage);
    settings.heroImage = `/uploads/${req.files.heroImage.filename}`;
  }
  if (req.files.logoImage) {
    deleteUploadedFile(settings.logoImage);
    settings.logoImage = `/uploads/${req.files.logoImage.filename}`;
    // Reuse the same logo for the "full" OG/schema image unless a dedicated one is set later.
    settings.logoFullImage = settings.logoImage;
  }
  if (req.files.faviconImage) {
    deleteUploadedFile(settings.faviconImage);
    settings.faviconImage = `/uploads/${req.files.faviconImage.filename}`;
  }

  store.saveSettings(settings);
  res.redirect('/admin/settings?msg=' + encodeURIComponent('Settings saved.'));
});

module.exports = router;
