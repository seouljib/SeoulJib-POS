import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'

// index.html 의 서버 선택(클라우드로 넘길지 파이에서 실행할지)이 끝난 뒤에 화면을 그림
function start() {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  )
}
(window.__sjBoot || Promise.resolve()).then(start, start)
