import os, shutil
from PIL import Image

PHOTOS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
PREVIEWS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/previews'
VIDEOS_DIR = '/Users/dhanesh/Documents/bbcatering-wip/public/uploads/videos'
POSTERS_DIR = '/Users/dhanesh/Documents/bbcatering-wip/public/uploads/videos/posters'

os.makedirs(VIDEOS_DIR, exist_ok=True)
os.makedirs(POSTERS_DIR, exist_ok=True)

# Curated top catering videos
curated_videos = [
    {
        "id": "v001",
        "src_file": "Reel_IMG_2055.MOV",
        "dest_file": "live-wedding-biriyani.mp4",
        "poster_src": "vidframe_Reel_IMG_2055.jpg",
        "poster_dest": "poster_biriyani.jpg",
        "title": "Master Chef Wedding Biriyani Dum",
        "category": "live-cooking",
        "duration": "8s",
        "description": "Steaming hot traditional wedding biriyani mixed fresh in giant handi cauldron."
    },
    {
        "id": "v002",
        "src_file": "Bb_20260913_154853.mp4",
        "dest_file": "madurai-bun-parotta-tawa.mp4",
        "poster_src": "vidframe_Bb_20260913_154853.jpg",
        "poster_dest": "poster_parotta_tawa.jpg",
        "title": "Madurai Bun Parotta Live Sizzle",
        "category": "live-cooking",
        "duration": "14s",
        "description": "Flaky golden bun parottas sizzling on the massive iron hotplate."
    },
    {
        "id": "v003",
        "src_file": "Bb_20260913_154934.mp4",
        "dest_file": "parotta-chef-hand-clapping.mp4",
        "poster_src": "vidframe_Bb_20260913_154934.jpg",
        "poster_dest": "poster_parotta_clap.jpg",
        "title": "Master Chef Parotta Hand Layering",
        "category": "kitchen-prep",
        "duration": "12s",
        "description": "Artisan chef hand-clapping and layering piping hot flaky parottas."
    },
    {
        "id": "v004",
        "src_file": "Clips2_20260827_161636.mp4",
        "dest_file": "steaming-wedding-kurma.mp4",
        "poster_src": "vidframe_Clips2_20260827_161636.jpg",
        "poster_dest": "poster_kurma.jpg",
        "title": "Aromatic Wedding Kurma Cauldron",
        "category": "kitchen-prep",
        "duration": "4s",
        "description": "Rich slow-cooked wedding kurma simmering with aromatic whole spices."
    },
    {
        "id": "v005",
        "src_file": "Reel_CADB336C-32E0-42BA-ACED-44EC9B36F081.MP4",
        "dest_file": "bulk-meal-box-packaging.mp4",
        "poster_src": "vidframe_Reel_CADB336C-32E0-42BA-ACED-44EC9B36F081.jpg",
        "poster_dest": "poster_packaging.jpg",
        "title": "Hygienic Bulk Meal Box Packaging",
        "category": "packaging",
        "duration": "20s",
        "description": "Systematic bulk meal box assembly and quality check for catering dispatch."
    }
]

processed_video_data = []

for v in curated_videos:
    src_vpath = os.path.join(PHOTOS_DIR, v["src_file"])
    dst_vpath = os.path.join(VIDEOS_DIR, v["dest_file"])
    
    if os.path.exists(src_vpath):
        shutil.copy2(src_vpath, dst_vpath)
        v_size_mb = os.path.getsize(dst_vpath) / (1024 * 1024)
        print(f"[COPIED VIDEO] {v['dest_file']} ({v_size_mb:.1f} MB)")
    else:
        print(f"[MISSING VIDEO] {src_vpath}")
    
    # Process poster
    src_p = os.path.join(PREVIEWS_DIR, v["poster_src"])
    dst_p = os.path.join(POSTERS_DIR, v["poster_dest"])
    if os.path.exists(src_p):
        with Image.open(src_p) as pimg:
            pimg = pimg.convert('RGB')
            pimg.thumbnail((600, 600))
            pimg.save(dst_p, 'JPEG', quality=85)
            print(f"[SAVED POSTER] {v['poster_dest']}")
    
    processed_video_data.append({
        "id": v["id"],
        "title": v["title"],
        "videoUrl": f"/uploads/videos/{v['dest_file']}",
        "posterUrl": f"/uploads/videos/posters/{v['poster_dest']}",
        "category": v["category"],
        "duration": v["duration"],
        "description": v["description"]
    })

import json
with open('/Users/dhanesh/Documents/bbcatering-wip/data/videos.json', 'w') as f:
    json.dump(processed_video_data, f, indent=2)

print("Saved data/videos.json with 5 curated videos!")
