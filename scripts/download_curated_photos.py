import os, re, time, urllib.request
from concurrent.futures import ThreadPoolExecutor
import gdown

OUT_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
os.makedirs(OUT_DIR, exist_ok=True)

log_path = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/.system_generated/tasks/task-192.log'
with open(log_path, 'r', errors='ignore') as f:
    lines = f.readlines()

current_folder = 'ROOT'
folder_files = {}

for line in lines:
    if 'Retrieving folder' in line:
        m = re.search(r'Retrieving folder\s+([a-zA-Z0-9_-]+)\s*(.*)', line)
        if m:
            current_folder = m.group(2).strip() or m.group(1)
            if current_folder not in folder_files:
                folder_files[current_folder] = []
    elif 'Processing file' in line:
        m = re.search(r'Processing file\s+([a-zA-Z0-9_-]+)\s+(.+)', line)
        if m:
            fid = m.group(1)
            fname = m.group(2).strip()
            if current_folder not in folder_files:
                folder_files[current_folder] = []
            folder_files[current_folder].append((fid, fname, current_folder))

# We want photos from key folders
selected = []
priority_folders = ['images', 'Photo', 'pics', '10080120', 'BB Catering1:1:26', '100MSDCF']

for folder in priority_folders:
    files = folder_files.get(folder, [])
    for fid, fname, fld in files:
        ext = fname.split('.')[-1].lower() if '.' in fname else ''
        if ext in ['jpg', 'jpeg', 'png', 'webp']:
            clean_name = f"{fld.replace(' ', '_').replace(':', '_')}_{fname}"
            selected.append((fid, clean_name))

print(f"Total candidate photos: {len(selected)}")

# Download a curated sample first (e.g. up to 100 high-quality photos across folders)
# Let's pick 20 from images, 20 from Photo, 20 from pics, 15 from 10080120, 25 from BB Catering, 20 from 100MSDCF
curated_batch = []
for folder in priority_folders:
    files = [x for x in selected if x[1].startswith(folder.replace(' ', '_').replace(':', '_'))]
    if len(files) > 30:
        step = len(files) // 25
        curated_batch.extend(files[::step][:25])
    else:
        curated_batch.extend(files)

print(f"Downloading curated batch of {len(curated_batch)} photos...")

def download_one(item):
    fid, name = item
    out_path = os.path.join(OUT_DIR, name)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return True, name
    try:
        url = f"https://drive.google.com/uc?id={fid}&export=download"
        gdown.download(id=fid, output=out_path, quiet=True)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            return True, name
        return False, name
    except Exception as e:
        return False, f"{name}: {e}"

with ThreadPoolExecutor(max_workers=6) as executor:
    results = list(executor.map(download_one, curated_batch))

success = [r for r, _ in results if r]
print(f"Successfully downloaded: {len(success)} / {len(curated_batch)}")
