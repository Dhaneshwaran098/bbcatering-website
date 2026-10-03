import os

PHOTOS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
files = os.listdir(PHOTOS_DIR)
print(f"Total files in scratch/photos: {len(files)}")
vids = [f for f in files if f.lower().endswith(('.mp4', '.mov'))]
imgs = [f for f in files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')) and not f.endswith('.part')]
print(f"Images: {len(imgs)}, Videos: {len(vids)}")
for v in vids:
    size_mb = os.path.getsize(os.path.join(PHOTOS_DIR, v)) / (1024 * 1024)
    print(f"Video: {v} ({size_mb:.1f} MB)")
