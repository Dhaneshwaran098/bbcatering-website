import re
from collections import defaultdict

log_path = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/.system_generated/tasks/task-192.log'
with open(log_path, 'r', errors='ignore') as f:
    lines = f.readlines()

current_folder = 'ROOT'
folders = defaultdict(list)

for line in lines:
    if 'Retrieving folder' in line:
        m = re.search(r'Retrieving folder\s+([a-zA-Z0-9_-]+)\s*(.*)', line)
        if m:
            current_folder = m.group(2).strip() or m.group(1)
    elif 'Processing file' in line:
        m = re.search(r'Processing file\s+([a-zA-Z0-9_-]+)\s+(.+)', line)
        if m:
            fid = m.group(1)
            fname = m.group(2).strip()
            folders[current_folder].append((fid, fname))

print(f"Total folders found: {len(folders)}")
for fld, files in sorted(folders.items(), key=lambda x: len(x[1]), reverse=True):
    exts = defaultdict(int)
    for fid, fname in files:
        ext = fname.split('.')[-1].lower() if '.' in fname else 'noext'
        exts[ext] += 1
    ext_str = ", ".join([f"{k}: {v}" for k, v in exts.items()])
    print(f"\nFolder: '{fld}' ({len(files)} files) -> {ext_str}")
    sample_files = [fn for _, fn in files[:5]]
    print(f"  Samples: {sample_files}")
