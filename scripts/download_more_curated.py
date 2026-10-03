import os, re, gdown
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

curated_targets = []

# Select from pics (122 files)
pics_files = [x for x in folder_files.get('pics', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in pics_files[::8][:15]:
    curated_targets.append((f[0], f"pics_{f[1]}"))

# Select from 10080120 (26 files)
f1008 = [x for x in folder_files.get('10080120', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in f1008[::2][:12]:
    curated_targets.append((f[0], f"10080120_{f[1]}"))

# Select from 100MSDCF (1207 files)
fmsd = [x for x in folder_files.get('100MSDCF', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in fmsd[::50][:25]:
    curated_targets.append((f[0], f"100MSDCF_{f[1]}"))

# Select from BB Catering1:1:26 (388 jpegs)
fbbc = [x for x in folder_files.get('BB Catering1:1:26', []) if x[1].lower().endswith(('.jpg', '.jpeg')) and not x[1].startswith('._')]
for f in fbbc[::20][:18]:
    curated_targets.append((f[0], f"BBCatering_{f[1]}"))

# Testimonial
ftest = folder_files.get('Testimonial', [])
for f in ftest:
    if not f[1].startswith('._'):
        curated_targets.append((f[0], f"Testimonial_{f[1]}"))

# Sample mobile videos from Bb or Clips 2
fbb_vid = [x for x in folder_files.get('Bb', []) if x[1].lower().endswith('.mp4') and not x[1].startswith('._')]
for f in fbb_vid[:3]:
    curated_targets.append((f[0], f"BbVid_{f[1]}"))

print(f"Target count: {len(curated_targets)}")

def download_file(item):
    fid, name = item
    out_path = os.path.join(OUT_DIR, name)
    if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
        return True, name
    try:
        gdown.download(id=fid, output=out_path, quiet=True)
        if os.path.exists(out_path) and os.path.getsize(out_path) > 1000:
            return True, name
        return False, name
    except Exception as e:
        return False, f"{name}: {e}"

with ThreadPoolExecutor(max_workers=8) as executor:
    results = list(executor.map(download_file, curated_targets))

for res, name in results:
    print(f"{'OK' if res else 'FAIL'}: {name}")
