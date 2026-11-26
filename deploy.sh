#!/bin/bash
# 서울집 POS 배포: 클라우드(Firebase Hosting) + GitHub + 파이(예비 서버)를 한 번에 같은 버전으로 맞춤
# 사용법: bash deploy.sh "변경 내용 한 줄"
set -e
cd ~/Downloads/SeoulJib-POS
MSG="${1:-Update}"

echo "===== [1/4] 빌드 ====="
npm run build

echo "===== [2/4] 클라우드에 올리기 ====="
npx --yes firebase-tools@15 deploy --only hosting --project seoul-jib-pos

echo "===== [3/4] GitHub에 저장 ====="
git add src/App.jsx src/main.jsx index.html firebase.json .firebaserc deploy.sh public/sj-alive.json public/sw.js
git commit -m "$MSG" || echo "(새로 저장할 변경 없음)"
git push

echo "===== [4/4] 파이(예비 서버) 갱신 — 비밀번호 18181818 ====="
ssh -t seouljib@192.168.68.62 "cd ~/SeoulJib-POS && git pull && npm run build && pm2 restart seouljib"

echo ""
echo "완료: https://seoul-jib-pos.web.app 와 파이가 같은 버전입니다."
