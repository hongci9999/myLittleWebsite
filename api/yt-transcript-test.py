"""
Vercel(클라우드 IP)에서 youtube-transcript-api가 자막을 받을 수 있는지 확인하는 임시 테스트 함수.
GET /api/yt-transcript-test?v=<videoId>
"""
import json
import re
from http.server import BaseHTTPRequestHandler
from urllib.parse import parse_qs, urlparse

from youtube_transcript_api import YouTubeTranscriptApi


def run(video_id: str) -> dict:
    if not re.fullmatch(r"[\w-]{6,20}", video_id):
        return {"ok": False, "errorType": "BadVideoId", "message": video_id}
    try:
        t = YouTubeTranscriptApi().fetch(video_id, languages=["ko", "en", "ja"])
        text = " ".join(s.text for s in t)
        return {
            "ok": True,
            "language": t.language_code,
            "isGenerated": t.is_generated,
            "snippets": len(t),
            "chars": len(text),
            "preview": text[:300],
        }
    except Exception as e:  # 차단(RequestBlocked/IpBlocked) 등 예외 이름을 그대로 노출
        return {"ok": False, "errorType": type(e).__name__, "message": str(e)[:1500]}


class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        video_id = parse_qs(urlparse(self.path).query).get("v", [""])[0].strip()
        body = json.dumps(run(video_id), ensure_ascii=False).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
