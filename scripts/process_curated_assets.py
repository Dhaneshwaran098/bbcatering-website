import os, json
from PIL import Image, ImageOps

PHOTOS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
UPLOADS_DIR = '/Users/dhanesh/Documents/bbcatering-wip/public/uploads'
IMAGES_DIR = '/Users/dhanesh/Documents/bbcatering-wip/public/images'

os.makedirs(os.path.join(UPLOADS_DIR, 'dishes'), exist_ok=True)
os.makedirs(os.path.join(UPLOADS_DIR, 'gallery'), exist_ok=True)
os.makedirs(IMAGES_DIR, exist_ok=True)

def process_and_save(src_filename, dst_rel_path, target_size=(800, 600), crop_fit=True, quality=85):
    src_path = os.path.join(PHOTOS_DIR, src_filename)
    if not os.path.exists(src_path):
        print(f"[MISSING] Source file not found: {src_filename}")
        return False
    
    dst_full_path = os.path.join('/Users/dhanesh/Documents/bbcatering-wip/public', dst_rel_path.lstrip('/'))
    os.makedirs(os.path.dirname(dst_full_path), exist_ok=True)
    
    try:
        with Image.open(src_path) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert('RGB')
            
            if crop_fit:
                # Target aspect ratio
                target_ratio = target_size[0] / target_size[1]
                img_ratio = img.width / img.height
                
                if img_ratio > target_ratio:
                    # Image is wider than target -> crop left/right
                    new_w = int(img.height * target_ratio)
                    left = (img.width - new_w) // 2
                    img = img.crop((left, 0, left + new_w, img.height))
                else:
                    # Image is taller than target -> crop top/bottom
                    new_h = int(img.width / target_ratio)
                    top = (img.height - new_h) // 2
                    img = img.crop((0, top, img.width, top + new_h))
                
                img = img.resize(target_size, Image.Resampling.LANCZOS)
            else:
                img.thumbnail(target_size, Image.Resampling.LANCZOS)
            
            img.save(dst_full_path, 'JPEG', quality=quality, optimize=True)
            size_kb = os.path.getsize(dst_full_path) / 1024
            print(f"[SAVED] {dst_rel_path} ({img.size[0]}x{img.size[1]}, {size_kb:.1f} KB)")
            return True
    except Exception as e:
        print(f"[ERROR] {src_filename} -> {dst_rel_path}: {e}")
        return False

# 1. Process Hero Banner
process_and_save('images_DSC03494.JPG', 'images/hero-catering.jpg', target_size=(1920, 1080), quality=88)
process_and_save('images_DSC01222.JPG', 'images/hero-feast.jpg', target_size=(1920, 1080), quality=88)

# 2. Process Curated Dishes
dish_map = {
    'chicken-65': ('images_DSC01196.JPG', (800, 600)),
    'naadan-chicken-chukka': ('images_DSC01200.JPG', (800, 600)),
    'mutton-chukka': ('images_DSC01206.JPG', (800, 600)),
    'wedding-biriyani': ('images_DSC01202.JPG', (800, 600)),
    'banana-leaf-feast': ('images_DSC01222.JPG', (800, 600)),
    'heart-idly-breakfast': ('images_DSC03493.JPG', (800, 600)),
    'sweet-kali-halwa': ('images_DSC01205.JPG', (800, 600)),
    'wedding-poriyal': ('images_DSC01203.JPG', (800, 600)),
    'idiyappam-kuzhambu': ('images_DSC01227.JPG', (800, 600)),
    'starter-skewers': ('images_DSC01195.JPG', (800, 600)),
    'mutton-kuzhambu': ('images_DSC01224.JPG', (800, 600)),
    'parotta-pack': ('BBCatering_IMG_2349.jpeg', (800, 600)),
}

for name, (src, size) in dish_map.items():
    process_and_save(src, f'uploads/dishes/{name}.jpg', target_size=size)

# 3. Process Curated Gallery Items
gallery_items = [
    ('gallery_biriyani', 'images_DSC01202.JPG', 'dishes', 'Traditional Seeraga Samba Wedding Biriyani with Raitha'),
    ('gallery_feast_spread', 'images_DSC01222.JPG', 'dishes', 'Authentic Grand Banana Leaf Wedding Feast'),
    ('gallery_heart_idly', 'images_DSC03493.JPG', 'dishes', 'Special Heart-in Idly & Beetroot Poori Breakfast Spread'),
    ('gallery_chicken_65', 'images_DSC01196.JPG', 'dishes', 'Crispy Golden Chicken 65 on Fresh Banana Leaf'),
    ('gallery_sweet_kali', 'images_DSC01205.JPG', 'dishes', 'Hot Traditional Sweet Kali served from Catering Buckets'),
    ('gallery_poriyal', 'images_DSC01203.JPG', 'dishes', 'Fresh Coconut Tempered Wedding Poriyal'),
    ('gallery_idiyappam_dinner', 'images_DSC01227.JPG', 'dishes', 'Steamed Idiyappam & Rumali Roti Wedding Dinner Spread'),
    ('gallery_starter_skewers', 'images_DSC01206.JPG', 'dishes', 'Succulent Chukka Starter Skewers'),
    
    ('gallery_couple_feast', 'images_DSC03512.JPG', 'events', 'Bride & Groom Enjoying the BB Catering Wedding Feast'),
    ('gallery_guests_banquet', 'images_DSC03501.JPG', 'events', 'Wedding Guests Savoring the Grand Traditional Spread'),
    ('gallery_banquet_hall', 'images_DSC03494.JPG', 'events', 'Grand Banquet Dining Setup with Banana Leaf Placings'),
    ('gallery_community_feast', '10080120_DSC02437.JPG', 'events', 'Festive Celebration Dining at Wedding Hall'),
    
    ('gallery_menu_board', 'images_DSC01211.JPG', 'setups', 'Official BB Catering Wedding Menu Display & Hall'),
    ('gallery_business_card', 'images_DSC01217.JPG', 'setups', 'BB Catering Service & Madurai Koorai Kadai Venues'),
    ('gallery_serving_team', 'pics_DSC01797.JPG', 'setups', 'BB Catering Uniformed Crew & Serving Team'),
    ('gallery_live_serving', 'images_DSC03498.JPG', 'setups', 'Live Table Service by Uniformed BB Catering Staff'),
    
    ('gallery_kitchen_prep', 'BBCatering_IMG_2349.jpeg', 'prep', 'Live Kitchen Preparation of Flaky Parottas & Chicken 65'),
    ('gallery_meal_packaging', 'BBCatering_IMG_2178.jpeg', 'prep', 'Hygienic Bulk Meal Box Packaging & Quality Check'),
    ('gallery_delivery_fleet', 'BBCatering_IMG_2324.jpeg', 'prep', 'Catering Logistics Fleet Loaded for Timely Delivery'),
]

gallery_json_data = []
for idx, (img_id, src_file, cat, caption) in enumerate(gallery_items):
    out_rel = f'uploads/gallery/{img_id}.jpg'
    ok = process_and_save(src_file, out_rel, target_size=(1000, 750))
    if ok:
        gallery_json_data.append({
            "id": f"g{idx+1:03d}",
            "image": f"/{out_rel}",
            "caption": caption,
            "category": cat
        })

with open('/Users/dhanesh/Documents/bbcatering-wip/data/gallery.json', 'w') as f:
    json.dump(gallery_json_data, f, indent=2)

print("Gallery JSON updated with real photos!")
