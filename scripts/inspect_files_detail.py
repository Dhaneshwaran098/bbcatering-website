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

for fld in ['images', 'Photo', 'pics', '10080120', 'BB Catering1:1:26', '10180101']:
    print(f"\n--- FOLDER: {fld} ---")
    files = [fn for _, fn in folders.get(fld, []) if not fn.startswith('._')]
    print(f"Total valid: {len(files)}")
    print(files[:20])
