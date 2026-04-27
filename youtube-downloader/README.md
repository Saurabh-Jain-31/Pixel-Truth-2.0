# PixelTruth - YouTube Downloader

Downloads YouTube videos for fingerprinting and duplicate detection.

## Install

```bash
pip install pytubefix
```

## Usage

**Download highest resolution (default):**
```bash
python downloader.py --url "https://www.youtube.com/watch?v=VIDEO_ID"
```

**Download specific resolution:**
```bash
python downloader.py --url "https://www.youtube.com/watch?v=VIDEO_ID" --resolution 720
```

**Custom output folder:**
```bash
python downloader.py --url "https://www.youtube.com/watch?v=VIDEO_ID" --output "my_videos"
```

**Download multiple videos (edit the script):**
```python
from downloader import download_multiple

urls = [
    "https://www.youtube.com/watch?v=VIDEO_ID_1",
    "https://www.youtube.com/watch?v=VIDEO_ID_2",
]
download_multiple(urls, output_path="videos/")
```

## Notes
- Uses `pytubefix` instead of `pytube` (pytube is no longer maintained)
- Videos saved to `videos/` folder by default
- Downloaded videos can be uploaded to PixelTruth for duplicate detection
