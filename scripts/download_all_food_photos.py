import os, re, requests
from concurrent.futures import ThreadPoolExecutor

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

targets = []

# All from 'images' folder
for fid, fname, _ in folder_files.get('images', []):
    if not fname.startswith('._') and fname.lower().endswith(('.jpg', '.jpeg', '.png')):
        targets.append((fid, f"images_{fname}"))

# All from 'Photo' folder
for fid, fname, _ in folder_files.get('Photo', []):
    if not fname.startswith('._') and fname.lower().endswith(('.jpg', '.jpeg', '.png')):
        targets.append((fid, f"Photo_{fname}"))

# Testimonial video
for fid, fname, _ in folder_files.get('Testimonial', []):
    if not fname.startswith('._'):
        targets.append((fid, f"Testimonial_{fname}"))

# Select 5 short MP4s from 'Bb'
bb_vids = [x for x in folder_files.get('Bb', []) if x[1].lower().endswith('.mp4') and not x[1].startswith('._')]
for fid, fname, _ in bb_vids[:5]:
    targets.append((fid, f"Bb_{fname}"))

print(f"Total files queued: {len(targets)}")

def download_gdrive_file(fid, destination):
    if os.path.exists(destination) and os.path.getsize(destination) > 10000:
        return True, "already exists"
    session = requests.Session()
    URL = "https://drive.google.com/uc?export=download"
    response = session.get(URL, params={'id': fid}, stream=True, timeout=60)
    for k, v in response.cookies.items():
        if k.startswith('download_warning'):
            params = {'id': fid, 'confirm': v}
            response = session.get(URL, params=params, stream=True, timeout=60)
            break
    
    CHUNK_SIZE = 128 * 1024
    with open(destination, "wb") as f:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                f.write(chunk)
    
    size = os.path.getsize(destination)
    if size < 5000:
        with open(destination, 'r', errors='ignore') as f:
            content = f.read()
        if '<html' in content.lower():
            os.remove(destination)
            return False, "HTML error returned"
    return True, f"size {size} bytes"

def worker(item):
    fid, name = item
    dest = os.path.join(OUT_DIR, name)
    try:
        ok, msg = download_gdrive_file(fid, dest)
        if ok and not msg.startswith("already"):
            print(f"[OK] {name}: {msg}")
        return ok
    except Exception as e:
        print(f"[ERROR] {name}: {e}")
        return False

with ThreadPoolExecutor(max_workers=6) as pool:
    results = list(pool.map(worker, targets))

print(f"Finished: {sum(1 for r in results if r)} / {len(targets)} success.")
