#!/bin/bash
# 루트 정처기 폴더 git 추적 해제 (로컬 파일은 유지)
cd "$(dirname "$0")/.."
git rm -r --cached "정처기/"
echo ""
echo "완료. 다음 실행:"
echo "  git commit -m \"chore: 루트 정처기 폴더 추적 해제\""
echo "  git push"
