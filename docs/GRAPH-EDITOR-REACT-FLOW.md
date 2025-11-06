# Graph Editor - React Flow Migration

## 개요

Graph Editor가 React Flow 라이브러리를 사용하도록 성공적으로 마이그레이션되었습니다.

## 변경 사항

### 이전 (커스텀 구현)
- 커스텀 Canvas 컴포넌트
- react-draggable을 사용한 노드 드래그
- SVG로 직접 연결 렌더링
- 수동 Pan/Zoom 구현

### 현재 (React Flow)
- React Flow 라이브러리 사용
- 내장 드래그 앤 드롭
- 자동 연결 렌더링
- 내장 Pan/Zoom/Controls
- MiniMap 지원
- Background 그리드

## 주요 기능

### ✅ 유지된 기능

1. **타입 검증 연결**
   - 포트 타입 기반 연결 검증
   - 호환되지 않는 연결 차단
   - 타입별 색상 코딩

2. **Zustand 상태 관리**
   - 기존 store 구조 유지
   - React Flow와 완전 동기화

3. **저장/로드**
   - JSON 파일로 저장/로드
   - 그래프 상태 보존

4. **노드 생성/삭제**
   - 툴바에서 노드 추가
   - Delete 키로 노드 삭제

### 🆕 추가된 기능

1. **MiniMap**
   - 전체 그래프 미리보기
   - 네비게이션 지원

2. **Controls**
   - 줌 인/아웃 버튼
   - Fit View 버튼
   - 전체 화면 토글

3. **Background**
   - 그리드 배경
   - 시각적 가이드

4. **Snap to Grid**
   - 노드 정렬
   - 깔끔한 레이아웃

## 기술 스택

- **React Flow**: 그래프 에디터 라이브러리
- **Zustand**: 상태 관리
- **TypeScript**: 타입 안전성
- **Tailwind CSS**: 스타일링

## 파일 구조

```
components/graph/
├── ReactFlowCanvas.tsx    # React Flow 메인 캔버스
├── ReactFlowNode.tsx      # 커스텀 노드 컴포넌트
├── GraphToolbar.tsx       # 툴바 (기존 유지)
└── (기존 커스텀 컴포넌트들은 유지되지만 사용 안 함)
```

## 사용 방법

### 기본 사용법

1. **노드 추가**
   - 툴바에서 "Add Node" 클릭
   - 노드 이름과 타입 입력

2. **노드 이동**
   - 노드를 드래그하여 이동
   - 자동으로 그리드에 맞춤

3. **연결 생성**
   - 출력 포트에서 입력 포트로 드래그
   - 타입 검증 자동 수행

4. **Pan & Zoom**
   - 마우스 휠로 줌
   - 드래그로 팬
   - Controls 패널 사용

5. **MiniMap**
   - 좌측 하단 미니맵
   - 클릭하여 빠른 이동

## React Flow 장점

1. **성능**
   - 최적화된 렌더링
   - 대규모 그래프 지원

2. **기능**
   - 내장 기능 풍부
   - 확장 가능한 플러그인

3. **유지보수**
   - 검증된 라이브러리
   - 활발한 커뮤니티

4. **접근성**
   - 키보드 네비게이션
   - 스크린 리더 지원

## 커스터마이징

### 노드 스타일

`ReactFlowNode.tsx`에서 커스텀 노드 스타일 수정:

```typescript
// 포트 색상 변경
const getTypeColor = (typeName: string): string => {
  // 커스텀 색상 로직
};
```

### 연결 스타일

`ReactFlowCanvas.tsx`에서 엣지 스타일 수정:

```typescript
const reactFlowEdges = useMemo<Edge[]>(() => {
  return storeConnections.map((conn) => ({
    // ...
    style: { stroke: '#3B82F6', strokeWidth: 2 },
    type: 'smoothstep', // 또는 'default', 'straight'
  }));
}, [storeConnections]);
```

## 마이그레이션 참고사항

### 기존 코드 호환성

- 기존 Zustand store 구조 유지
- 기존 저장된 그래프 파일 호환
- API 변경 없음

### 제거된 기능

- 커스텀 Canvas 구현 (React Flow로 대체)
- 수동 포트 위치 계산 (React Flow 자동 처리)
- 커스텀 연결 렌더링 (React Flow 엣지 사용)

### 향상된 기능

- 더 부드러운 애니메이션
- 더 나은 성능
- 더 많은 기능 내장

## 문제 해결

### 연결이 생성되지 않음

- 포트가 올바르게 Handle로 렌더링되었는지 확인
- 타입 호환성 확인
- 브라우저 콘솔 확인

### 노드가 보이지 않음

- `nodeTypes`에 'custom' 타입이 등록되었는지 확인
- ReactFlowProvider로 감쌌는지 확인

### 뷰포트가 저장되지 않음

- `handleMove` 콜백이 제대로 작동하는지 확인
- Zustand store 업데이트 확인

## 다음 단계

1. **노드 템플릿**: 레지스트리에서 노드 로드
2. **실행 시각화**: 그래프 실행 시 애니메이션
3. **그룹화**: 노드 그룹 기능
4. **실시간 협업**: WebSocket 통합

## 참고 자료

- [React Flow 공식 문서](https://reactflow.dev/)
- [React Flow 예제](https://reactflow.dev/examples/)
- [React Flow API 참조](https://reactflow.dev/api-reference/)


