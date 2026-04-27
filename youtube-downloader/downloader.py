"""
PixelTruth - YouTube Video Downloader
======================================
Downloads YouTube videos for fingerprinting and duplicate detection analysis.

Requirements:
    pip install pytubefix

Usage:
    python downloader.py
    python downloader.py --url "https://www.youtube.com/watch?v=VIDEO_ID"
    python downloader.py --url "URL" --output "custom/path" --resolution 720
"""

import os
import sys
import argparse
from datetime import datetime

try:
    from pytubefix import YouTube
    from pytubefix.cli import on_progress
except ImportError:
    print("❌ pytubefix not installed. Run: pip install pytubefix")
    sys.exit(1)


# ─── Output folder ────────────────────────────────────────────────────────────
DEFAULT_OUTPUT = "videos"


def download_video(url: str, output_path: str = DEFAULT_OUTPUT, resolution: int = None):
    """
    Download a YouTube video.

    Args:
        url        : Full YouTube video URL
        output_path: Folder to save the video
        resolution : Preferred resolution (e.g. 720, 1080). None = highest available.

    Returns:
        dict with file path and video metadata, or None on failure.
    """

    print(f"\n🔗 URL       : {url}")
    print(f"📁 Output    : {output_path}")
    print(f"🎯 Resolution: {'Highest available' if not resolution else f'{resolution}p'}\n")

    try:
        yt = YouTube(url, on_progress_callback=on_progress)

        print(f"📹 Title     : {yt.title}")
        print(f"👤 Author    : {yt.author}")
        print(f"⏱  Duration  : {yt.length} seconds")
        print(f"👁  Views     : {yt.views:,}")
        print(f"📅 Published : {yt.publish_date}")
        print()

        # Select stream
        if resolution:
            stream = yt.streams.filter(progressive=True, res=f"{resolution}p").first()
            if not stream:
                print(f"⚠️  {resolution}p not available. Falling back to highest resolution.")
                stream = yt.streams.get_highest_resolution()
        else:
            stream = yt.streams.get_highest_resolution()

        if not stream:
            print("❌ No suitable stream found.")
            return None

        print(f"📦 Resolution: {stream.resolution}")
        print(f"📦 File type : {stream.mime_type}")
        print(f"📦 File size : {stream.filesize / (1024 * 1024):.2f} MB")
        print()

        # Create output directory
        os.makedirs(output_path, exist_ok=True)

        # Download
        print("⬇️  Downloading...")
        file_path = stream.download(output_path=output_path)

        print(f"\n✅ Download complete!")
        print(f"   Saved to: {file_path}")

        return {
            "title":      yt.title,
            "author":     yt.author,
            "duration":   yt.length,
            "views":      yt.views,
            "resolution": stream.resolution,
            "file_path":  file_path,
            "file_size":  os.path.getsize(file_path),
            "url":        url,
            "downloaded_at": datetime.now().isoformat(),
        }

    except Exception as e:
        print(f"❌ Error: {e}")
        return None


def download_multiple(urls: list, output_path: str = DEFAULT_OUTPUT):
    """
    Download multiple YouTube videos.

    Args:
        urls       : List of YouTube URLs
        output_path: Folder to save videos
    """
    results = []
    print(f"\n📋 Downloading {len(urls)} video(s)...\n{'─' * 50}")

    for i, url in enumerate(urls, 1):
        print(f"\n[{i}/{len(urls)}]")
        result = download_video(url, output_path)
        results.append(result)
        print("─" * 50)

    success = [r for r in results if r]
    failed  = len(results) - len(success)

    print(f"\n📊 Summary: {len(success)} succeeded, {failed} failed")
    return results


# ─── CLI ──────────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    parser = argparse.ArgumentParser(
        description="PixelTruth YouTube Downloader"
    )
    parser.add_argument(
        "--url", "-u",
        type=str,
        default="https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        help="YouTube video URL"
    )
    parser.add_argument(
        "--output", "-o",
        type=str,
        default=DEFAULT_OUTPUT,
        help=f"Output folder (default: {DEFAULT_OUTPUT})"
    )
    parser.add_argument(
        "--resolution", "-r",
        type=int,
        default=None,
        help="Preferred resolution e.g. 720, 1080 (default: highest)"
    )

    args = parser.parse_args()

    result = download_video(
        url=args.url,
        output_path=args.output,
        resolution=args.resolution
    )

    if result:
        print(f"\n📁 File ready for PixelTruth analysis: {result['file_path']}")
    else:
        print("\n❌ Download failed.")
        sys.exit(1)
