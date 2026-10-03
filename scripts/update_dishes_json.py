import json

DISHES_FILE = '/Users/dhanesh/Documents/bbcatering-wip/data/dishes.json'

with open(DISHES_FILE, 'r') as f:
    dishes = json.load(f)

# Update dishes with real photos
updates = {
    "d001": {"image": "/uploads/dishes/mutton-kuzhambu.jpg", "featured": True},
    "d002": {"image": "/uploads/dishes/mutton-chukka.jpg", "featured": True},
    "d007": {"image": "/uploads/dishes/naadan-chicken-chukka.jpg", "featured": True},
    "d008": {"image": "/uploads/dishes/chicken-65.jpg", "featured": True},
    "d024": {"image": "/uploads/dishes/idiyappam-kuzhambu.jpg", "featured": True},
    "d025": {"image": "/uploads/dishes/wedding-biriyani.jpg", "featured": True},
    "d026": {"image": "/uploads/dishes/wedding-biriyani.jpg", "featured": True},
    "d031": {"image": "/uploads/dishes/mutton-chukka.jpg", "featured": True},
    "d032": {"image": "/uploads/dishes/chicken-65.jpg", "featured": True},
    "d035": {"image": "/uploads/dishes/starter-skewers.jpg", "featured": True},
}

for d in dishes:
    if d['id'] in updates:
        d.update(updates[d['id']])

# Check if special authentic wedding feast items are already present, else add them
existing_ids = {d['id'] for d in dishes}

extra_dishes = [
    {
        "id": "d043",
        "name": "Grand Banana Leaf Wedding Feast",
        "category": "Traditional Madurai",
        "price": 350,
        "unit": "per leaf meal",
        "spice": 2,
        "image": "/uploads/dishes/banana-leaf-feast.jpg",
        "featured": True
    },
    {
        "id": "d044",
        "name": "Heart-in Idly & Beetroot Poori Breakfast",
        "category": "Traditional Madurai",
        "price": 160,
        "unit": "per set",
        "spice": 1,
        "image": "/uploads/dishes/heart-idly-breakfast.jpg",
        "featured": True
    },
    {
        "id": "d045",
        "name": "Traditional Sweet Kali & Halwa",
        "category": "Desserts",
        "price": 70,
        "unit": "per portion",
        "spice": 0,
        "image": "/uploads/dishes/sweet-kali-halwa.jpg",
        "featured": True
    },
    {
        "id": "d046",
        "name": "Wedding Poriyal & Kootu",
        "category": "Traditional Madurai",
        "price": 90,
        "unit": "per portion",
        "spice": 1,
        "image": "/uploads/dishes/wedding-poriyal.jpg",
        "featured": False
    },
    {
        "id": "d047",
        "name": "Madurai Parotta & Chukka Combo",
        "category": "Traditional Madurai",
        "price": 220,
        "unit": "per set",
        "spice": 2,
        "image": "/uploads/dishes/parotta-pack.jpg",
        "featured": True
    }
]

for ed in extra_dishes:
    if ed['id'] not in existing_ids:
        dishes.append(ed)

with open(DISHES_FILE, 'w') as f:
    json.dump(dishes, f, indent=2)

print("Updated dishes.json with authentic items and photos!")
