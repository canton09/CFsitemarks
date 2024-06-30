addEventListener('fetch', event => {
    event.respondWith(handleRequest(event.request))
  })
  
  async function handleRequest(request) {
    const clientIP = request.headers.get('CF-Connecting-IP');
    const clientCountry = request.headers.get('CF-IPCountry');
  
    // 获取当前中国时间
    const chinaTime = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
  
    const { pathname } = new URL(request.url);
  
    if (pathname === '/memo') {
      return handleMemoPage(clientIP, clientCountry, chinaTime);
    }
  
    const html = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>日式黑客风格导航</title>
      <style>
          body {
              background-color: #000;
              color: #0f0;
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              overflow-x: hidden;
          }
          #matrix-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
          }
          h1 {
              text-align: center;
              text-shadow: 0 0 10px #0f0;
              margin-bottom: 5px;
          }
          #info {
              text-align: center;
              font-size: 12px;
              margin-bottom: 20px;
          }
          #categories {
              display: flex;
              justify-content: center;
              flex-wrap: wrap;
              gap: 10px;
              margin-bottom: 20px;
          }
          .category-btn, .function-btn {
              background-color: #111;
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              cursor: pointer;
          }
          .category-btn.active, .function-btn:hover {
              background-color: #0f0;
              color: #000;
          }
          #links {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 20px;
          }
          .link {
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              padding: 10px;
              text-align: center;
              width: 150px;
              transition: all 0.3s;
          }
          .link:hover {
              box-shadow: 0 0 15px #0f0;
          }
          .link a {
              color: #0f0;
              text-decoration: none;
          }
          .link img {
              width: 50px;
              height: 50px;
              margin-bottom: 10px;
          }
          #add-form {
              margin-top: 20px;
              text-align: center;
          }
          input, button, select {
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              margin: 5px;
          }
          button:hover {
              background-color: #0f0;
              color: #000;
          }
          #export-btn {
              position: fixed;
              bottom: 10px;
              right: 10px;
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              cursor: pointer;
              font-size: 12px;
          }
      </style>
  </head>
  <body>
      <canvas id="matrix-bg"></canvas>
      <h1>日式黑客导航</h1>
      <div id="info">
          中国时间: ${chinaTime}<br>
          您的IP: ${clientIP} | 所在地区: ${clientCountry}
      </div>
      <div id="categories"></div>
      <div id="links"></div>
      <div id="add-form">
          <input type="text" id="name" placeholder="网站名称">
          <input type="url" id="url" placeholder="网站地址">
          <input type="url" id="icon" placeholder="图标URL">
          <input type="text" id="category" placeholder="分类">
          <button onclick="addLink()">添加链接</button>
      </div>
      <button class="function-btn" onclick="location.href='/memo'">备忘录</button>
      <button id="export-btn" onclick="exportBookmarks()">导出书签</button>
  
      <script>
          // 日文字背景代码（保持不变）
          const canvas = document.getElementById('matrix-bg');
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const japaneseChars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ";
          const fontSize = 16;
          const columns = canvas.width / fontSize;
          const drops = [];
          for (let i = 0; i < columns; i++) {
              drops[i] = 1;
          }
          function drawMatrix() {
              ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "#0F0";
              ctx.font = fontSize + "px monospace";
              for (let i = 0; i < drops.length; i++) {
                  const text = japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
                  ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                  if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                      drops[i] = 0;
                  }
                  drops[i]++;
              }
          }
          setInterval(drawMatrix, 50);
  
          let links = JSON.parse(localStorage.getItem('links')) || [];
          let currentCategory = 'all';
  
          function renderCategories() {
              const categories = ['all', ...new Set(links.map(link => link.category))];
              const categoriesContainer = document.getElementById('categories');
              categoriesContainer.innerHTML = categories.map(category => 
                  \`<button class="category-btn \${category === currentCategory ? 'active' : ''}" 
                   onclick="filterCategory('\${category}')">\${category}</button>\`
              ).join('');
          }
  
          function filterCategory(category) {
              currentCategory = category;
              renderCategories();
              renderLinks();
          }
  
          function renderLinks() {
              const linksContainer = document.getElementById('links');
              linksContainer.innerHTML = '';
              links.filter(link => currentCategory === 'all' || link.category === currentCategory)
                   .forEach((link, index) => {
                  const linkElement = document.createElement('div');
                  linkElement.className = 'link';
                  linkElement.innerHTML = \`
                      <a href="\${link.url}" target="_blank">
                          <img src="\${link.icon}" alt="\${link.name}">
                          <p>\${link.name}</p>
                      </a>
                      <button onclick="removeLink(\${index})">删除</button>
                  \`;
                  linksContainer.appendChild(linkElement);
              });
          }
  
          function addLink() {
              const name = document.getElementById('name').value;
              const url = document.getElementById('url').value;
              const icon = document.getElementById('icon').value;
              const category = document.getElementById('category').value || 'uncategorized';
              if (name && url) {
                  links.push({ name, url, icon, category });
                  saveLinks();
                  renderCategories();
                  renderLinks();
                  clearForm();
              }
          }
  
          function removeLink(index) {
              links.splice(index, 1);
              saveLinks();
              renderCategories();
              renderLinks();
          }
  
          function saveLinks() {
              localStorage.setItem('links', JSON.stringify(links));
          }
  
          function clearForm() {
              document.getElementById('name').value = '';
              document.getElementById('url').value = '';
              document.getElementById('icon').value = '';
              document.getElementById('category').value = '';
          }
  
          function exportBookmarks() {
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(links));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "bookmarks.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
          }
  
          renderCategories();
          renderLinks();
      </script>
  </body>
  </html>
    `;
  
    return new Response(html, {
      headers: {
        'content-type': 'text/html;charset=UTF-8',
      },
    });
  }
  
  async function handleMemoPage(clientIP, clientCountry, chinaTime) {
    const html = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>备忘录</title>
      <style>
          body {
              background-color: #000;
              color: #0f0;
              font-family: 'Courier New', monospace;
              margin: 0;
              padding: 20px;
              overflow-x: hidden;
          }
          #matrix-bg {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: -1;
          }
          h1 {
              text-align: center;
              text-shadow: 0 0 10px #0f0;
          }
          #info {
              text-align: center;
              font-size: 12px;
              margin-bottom: 20px;
          }
          #memo-container {
              display: flex;
              justify-content: space-between;
              margin-top: 20px;
          }
          #memo-input, #memo-list {
              width: 45%;
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              padding: 10px;
          }
          textarea {
              width: 100%;
              height: 150px;
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              color: #0f0;
              margin-bottom: 10px;
          }
          button {
              background-color: #111;
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              cursor: pointer;
          }
          button:hover {
              background-color: #0f0;
              color: #000;
          }
          .memo-item {
              margin-bottom: 10px;
              border-bottom: 1px solid #0f0;
              padding-bottom: 5px;
          }
          .memo-item button {
              margin-left: 10px;
          }
      </style>
  </head>
  <body>
      <canvas id="matrix-bg"></canvas>
      <h1>备忘录</h1>
      <div id="info">
          中国时间: ${chinaTime}<br>
          您的IP: ${clientIP} | 所在地区: ${clientCountry}
      </div>
      <div id="memo-container">
          <div id="memo-input">
              <textarea id="new-memo" placeholder="输入新的备忘录..."></textarea>
              <button onclick="addMemo()">添加备忘录</button>
          </div>
          <div id="memo-list"></div>
      </div>
      <button onclick="location.href='/'">返回主页</button>
  
      <script>
          // 背景动画代码（与主页相同）
          const canvas = document.getElementById('matrix-bg');
          const ctx = canvas.getContext('2d');
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;
          const japaneseChars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜｦﾝ";
          const fontSize = 16;
          const columns = canvas.width / fontSize;
          const drops = [];
          for (let i = 0; i < columns; i++) {
              drops[i] = 1;
          }
          function drawMatrix() {
              ctx.fillStyle = "rgba(0, 0, 0, 0.05)";
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              ctx.fillStyle = "rgba(0, 255, 0, 0.1)"; // 调暗代码雨的亮度
              ctx.fillStyle = "#006600";
              ctx.font = fontSize + "px monospace";
              for (let i = 0; i < drops.length; i++) {
                  const text = japaneseChars[Math.floor(Math.random() * japaneseChars.length)];
                  ctx.fillText(text, i * fontSize, drops[i] * fontSize);
                  if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
                      drops[i] = 0;
                  }
                  drops[i]++;
              }
          }
          setInterval(drawMatrix, 50);
  
          let memos = JSON.parse(localStorage.getItem('memos')) || [];
  
          function renderMemos() {
              const memoList = document.getElementById('memo-list');
              memoList.innerHTML = memos.map((memo, index) => \`
                  <div class="memo-item">
                      <p>\${memo}</p>
                      <button onclick="deleteMemo(\${index})">删除</button>
                  </div>
              \`).join('');
          }
  
          function addMemo() {
              const newMemo = document.getElementById('new-memo').value;
              if (newMemo) {
                  memos.push(newMemo);
                  saveMemos();
                  renderMemos();
                  document.getElementById('new-memo').value = '';
                }
            }
    
            function deleteMemo(index) {
                memos.splice(index, 1);
                saveMemos();
                renderMemos();
            }
    
            function saveMemos() {
                localStorage.setItem('memos', JSON.stringify(memos));
            }
    
            renderMemos();
        </script>
    </body>
    </html>
      `;
    
      return new Response(html, {
        headers: {
          'content-type': 'text/html;charset=UTF-8',
        },
      });
    }