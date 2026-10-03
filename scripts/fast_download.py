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
# Pick from 100MSDCF (1207 files)
fmsd = [x for x in folder_files.get('100MSDCF', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in fmsd[::60][:15]:
    targets.append((f[0], f"100MSDCF_{f[1]}"))

# Pick from pics (122 files)
fpics = [x for x in folder_files.get('pics', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in fpics[::10][:12]:
    targets.append((f[0], f"pics_{f[1]}"))

# Pick from 10080120 (26 files)
f1008 = [x for x in folder_files.get('10080120', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in f1008[::3][:8]:
    targets.append((f[0], f"10080120_{f[1]}"))

# Pick from BB Catering1:1:26 (388 jpegs)
fbbc = [x for x in folder_files.get('BB Catering1:1:26', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in fbbc[::25][:12]:
    targets.append((f[0], f"BBCatering_{f[1]}"))

print(f"Total files to download: {len(targets)}")

def download_gdrive_file(fid, destination):
    if os.path.exists(destination) and os.path.getsize(destination) > 10000:
        return True, "already exists"
    session = requests.Session()
    URL = "https://drive.google.com/uc?export=download"
    response = session.get(URL, params={'id': fid}, stream=True, timeout=30)
    for k, v in response.cookies.items():
        if k.startswith('download_warning'):
            params = {'id': fid, 'confirm': v}
            response = session.get(URL, params=params, stream=True, timeout=30)
            break
    
    # Save content
    CHUNK_SIZE = 64 * 1024
    with open(destination, "wb") as f:
        for chunk in response.iter_content(CHUNK_SIZE):
            if chunk:
                f.write(chunk)
    
    size = os.path.getsize(destination)
    if size < 5000: # Probably an html error page
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
        print(f"[{'OK' if ok else 'FAIL'}] {name}: {msg}")
        return ok
    except Exception as e:
        print(f"[ERROR] {name}: {e}")
        return False

with ThreadPoolExecutor(max_workers=5) as pool:
    results = list(pool.map(worker, targets))

print(f"Finished: {sum(1 for r in results if r)} / {len(targets)} success.")
