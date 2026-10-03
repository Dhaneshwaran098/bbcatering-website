import os, cv2
from PIL import Image

PHOTOS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/photos'
PREVIEWS_DIR = '/Users/dhanesh/.gemini/antigravity-ide/brain/18aab269-814a-45c9-bd08-46871e42c6ce/scratch/previews'
os.makedirs(PREVIEWS_DIR, exist_ok=True)

video_files = [f for f in os.listdir(PHOTOS_DIR) if f.lower().endswith(('.mp4', '.mov')) and not f.endswith('.part')]
print(f"Found {len(video_files)} video files:")

for vf in sorted(video_files):
    vpath = os.path.join(PHOTOS_DIR, vf)
    cap = cv2.VideoCapture(vpath)
    if not cap.isOpened():
        print(f"[ERROR] Could not open video: {vf}")
        continue
    
    fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
    total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    duration_sec = total_frames / fps if fps else 0
    w = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    h = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    size_mb = os.path.getsize(vpath) / (1024 * 1024)
    
    print(f"\nVideo: {vf}")
    print(f"  Resolution: {w}x{h}, Duration: {duration_sec:.1f}s, FPS: {fps:.1f}, Size: {size_mb:.1f}MB")
    
    # Extract middle frame (at 40%)
    target_frame = int(total_frames * 0.4)
    cap.set(cv2.CAP_PROP_POS_FRAMES, target_frame)
    ret, frame = cap.read()
    if ret:
        # Convert BGR to RGB
        frame_rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        img = Image.fromarray(frame_rgb)
        img.thumbnail((700, 700))
        dst_path = os.path.join(PREVIEWS_DIR, f"vidframe_{os.path.splitext(vf)[0]}.jpg")
        img.save(dst_path, 'JPEG', quality=85)
        print(f"  Extracted frame: {dst_path}")
    cap.release()

print("\nVideo frame extraction complete.")
