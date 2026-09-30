# 홍한솔 AX 포트폴리오

현업의 요구를 솔루션으로 개발하는 AX Developer 홍한솔의 포트폴리오 사이트입니다.

- 프로젝트 화면 6개는 사내에서 실제로 운영하는 시스템과 같은 구조로 다시 만든 목업입니다. 회사명·금액·인물은 모두 가상이고, 사내 시스템 코드는 이 저장소에 없습니다.
- `07 RFP 공간 자동 모델링`의 3D 화면은 Blender 검토 모델을 glTF로 변환해 three.js로 띄운 것입니다.

## 구조

```
index.html        페이지 (CSS 포함)
js/app.js         프로젝트 화면 6개 (의존성 없음)
js/viewer.js      3D 뷰어 (three.js ES module)
model/gogeum.glb  Blender → glTF, 양자화 1.9MB
vendor/three/     three.js r170 (필요한 모듈만)
fonts/            Pretendard(사용 글자만 서브셋), Fira Code
img/              렌더 이미지
```

빌드 과정이 없습니다. 정적 파일 그대로 배포합니다.

## 로컬에서 보기

```
python3 -m http.server 8000
# http://localhost:8000
```

## GitHub Pages 배포

1. 이 폴더를 저장소 루트로 푸시합니다.
2. 저장소 Settings → Pages → Source를 `Deploy from a branch`, Branch를 `main` / `/ (root)`로 지정합니다.
3. 1~2분 뒤 https://eplhansol.github.io/portfolio/ 에서 열립니다.
