import os
from PIL import Image, ImageOps

PHOTOS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
PREVIEWS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/previews'
os.makedirs(PREVIEWS_DIR, exist_ok=True)

files = [f for f in os.listdir(PHOTOS_DIR) if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.endswith('.part')]

print(f"Found {len(files)} photos.")

for f in sorted(files):
    src = os.path.join(PHOTOS_DIR, f)
    dst = os.path.join(PREVIEWS_DIR, os.path.splitext(f)[0] + '.jpg')
    if os.path.exists(dst):
        continue
    try:
        with Image.open(src) as img:
            img = ImageOps.exif_transpose(img)
            img = img.convert('RGB')
            img.thumbnail((700, 700))
            img.save(dst, 'JPEG', quality=82)
            print(f"Generated preview: {f} ({img.size})")
    except Exception as e:
        print(f"Error processing {f}: {e}")

print("Previews generation complete.")
