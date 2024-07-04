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
    } else if (pathname === '/api/links') {
      return handleLinksAPI(request);
    } else if (pathname === '/api/memos') {
      return handleMemosAPI(request);
    } else if (pathname === '/api/client-info') {
      return handleClientInfoAPI(clientIP, clientCountry);
    }
  
    // 获取一言数据
    const hitokotoData = await fetchHitokoto();
  
    const html = `
  <!DOCTYPE html>
  <html lang="zh">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>黑风导航</title>
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
              font-size: 2em;
          }
          #hitokoto {
              font-size: 14px;
              color: #0f0;
              text-align: center;
              margin-bottom: 20px;
              font-style: italic;
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
              font-size: 0.9em;
          }
          .category-btn.active, .function-btn:hover {
              background-color: #0f0;
              color: #000;
          }
          #links {
              display: flex;
              flex-wrap: wrap;
              justify-content: center;
              gap: 10px;
          }
          .link {
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              padding: 5px;
              text-align: center;
              width: 60px;
              height: 60px;
              transition: all 0.3s;
              display: flex;
              flex-direction: column;
              justify-content: space-between;
              position: relative;
          }
          .link:hover {
              box-shadow: 0 0 15px #0f0;
          }
          .link a {
              color: #0f0;
              text-decoration: none;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: space-between;
              height: 100%;
              width: 100%;
              padding: 5px;
              box-sizing: border-box;
          }
          .link img {
              max-width: 100%;
              max-height: 40px;
              width: auto;
              height: auto;
              object-fit: contain;
              margin-bottom: 2px;
          }
          .link p {
              margin: 2px 0 0 0;
              font-size: 10px;
              word-break: break-word;
          }
          .delete-btn {
              position: absolute;
              top: 2px;
              right: 2px;
              background: none;
              border: none;
              color: #0f0;
              font-size: 12px;
              cursor: pointer;
              padding: 0;
              line-height: 1;
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
              font-size: 0.9em;
          }
          button:hover {
              background-color: #0f0;
              color: #000;
          }
          #export-btn, #import-btn {
              position: fixed;
              bottom: 10px;
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              cursor: pointer;
              font-size: 12px;
          }
          #export-btn {
              right: 10px;
          }
          #import-btn {
              left: 10px;
          }
          #file-input {
              display: none;
          }
          #login-container {
              margin-top: 20px;
              text-align: center;
          }
          #login-form {
              display: none;
              margin-top: 10px;
          }
          #login-form input, #login-form button {
              margin: 5px;
              padding: 5px 10px;
              background-color: rgba(17, 17, 17, 0.8);
              border: 1px solid #0f0;
              color: #0f0;
          }
          #login-btn, #login-form button {
              background-color: #111;
              border: 1px solid #0f0;
              color: #0f0;
              padding: 5px 10px;
              cursor: pointer;
          }
          #login-btn:hover, #login-form button:hover {
              background-color: #0f0;
              color: #000;
          }
  
          /* 响应式设计 */
          @media (max-width: 768px) {
              body {
                  padding: 10px;
              }
              h1 {
                  font-size: 1.5em;
              }
              #hitokoto, #info {
                  font-size: 12px;
              }
              .category-btn, .function-btn {
                  font-size: 0.8em;
                  padding: 3px 6px;
              }
              .link {
                  width: 50px;
                  height: 50px;
              }
              .link img {
                  max-height: 30px;
              }
              .link p {
                  font-size: 8px;
              }
              input, button, select {
                  font-size: 0.8em;
                  padding: 3px 6px;
              }
              #export-btn, #import-btn {
                  font-size: 10px;
                  padding: 3px 6px;
              }
          }
  
          @media (min-width: 1200px) {
              .link {
                  width: 80px;
                  height: 80px;
              }
              .link img {
                  max-height: 50px;
              }
              .link p {
                  font-size: 12px;
              }
          }
      </style>
  </head>
  <body>
      <canvas id="matrix-bg"></canvas>
      <h1>黑風導航</h1>
      <div id="hitokoto">${hitokotoData.hitokoto} —— ${hitokotoData.from}</div>
      <div id="info">
          中国时间: <span id="china-time"></span><br>
          您的IP: <span id="client-ip"></span> | 所在地区: <span id="client-country"></span>
      </div>
      <div id="add-form" style="display: none;">
          <input type="text" id="name" placeholder="网站名称">
          <input type="url" id="url" placeholder="网站地址">
          <input type="url" id="icon" placeholder="图标URL">
          <input type="text" id="category" placeholder="分类">
          <button onclick="addLink()">添加链接</button>
      </div>
      <div id="categories"></div>
      <div id="links"></div>
      <button class="function-btn" onclick="location.href='/memo'">备忘录</button>
      <button id="export-btn" onclick="exportBookmarks()">导出书签</button>
      <button id="import-btn" onclick="document.getElementById('file-input').click()">导入书签</button>
      <input type="file" id="file-input" accept=".json" onchange="importBookmarks(this)">
      <div id="login-container">
          <button id="login-btn" onclick="showLoginForm()">登录</button>
          <div id="login-form" style="display: none;">
              <input type="password" id="password" placeholder="请输入密码">
              <button onclick="login()">确认</button>
          </div>
      </div>
  
      <script>
          // 日文字背景代码（调暗）
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
              ctx.fillStyle = "rgba(0, 102, 0, 0.5)"; // 调暗代码雨的亮度
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
  
          let links = [];
          let currentCategory = 'all';
          let isLoggedIn = false;
  
          async function fetchLinks() {
              const response = await fetch('/api/links');
              links = await response.json();
              renderCategories();
              renderLinks();
          }
  
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
                      <button class="delete-btn" onclick="removeLink(\${index})" style="display: \${isLoggedIn ? 'block' : 'none'}">×</button>
                  \`;
                  linksContainer.appendChild(linkElement);
              });
          }
  
          async function addLink() {
              if (!isLoggedIn) {
                  alert('请先登录！');
                  return;
              }
              const name = document.getElementById('name').value;
              let url = document.getElementById('url').value;
              const icon = document.getElementById('icon').value;
              const category = document.getElementById('category').value || 'uncategorized';
              
              if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
                  url = 'http://' + url;
              }
          
              if (name && url) {
                  const newLink = { name, url, icon, category };
                  const response = await fetch('/api/links', {
                      method: 'POST',
                      headers: {
                          'Content-Type': 'application/json',
                      },
                      body: JSON.stringify({ ...newLink, password: '87654321' }),
                  });
                  if (response.ok) {
                      await fetchLinks();
                      clearForm();
                  } else {
                      alert('添加链接失败');
                  }
              }
          }
  
          async function removeLink(index) {
              if (!isLoggedIn) {
                  alert('请先登录！');
                  return;
              }
              const response = await fetch(\`/api/links/\${index}\`, { 
                  method: 'DELETE',
                  headers: {
                      'Content-Type': 'application/json',
                  },
                  body: JSON.stringify({ password: '87654321' }),
            });
            if (response.ok) {
                await fetchLinks();
            } else {
                alert('删除链接失败');
            }
        }

        function clearForm() {
            document.getElementById('name').value = '';
            document.getElementById('url').value = '';
            document.getElementById('icon').value = '';
            document.getElementById('category').value = '';
        }

        async function exportBookmarks() {
            const response = await fetch('/api/links');
            const links = await response.json();
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(links));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", "bookmarks.json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
        }

        async function importBookmarks(input) {
            const file = input.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async function(e) {
                    try {
                        const importedLinks = JSON.parse(e.target.result);
                        if (Array.isArray(importedLinks)) {
                            const response = await fetch('/api/links', {
                                method: 'PUT',
                                headers: {
                                    'Content-Type': 'application/json',
                                },
                                body: JSON.stringify({ links: importedLinks, password: '87654321' }),
                            });
                            if (response.ok) {
                                await fetchLinks();
                                alert('书签导入成功！');
                            } else {
                                throw new Error('Failed to import bookmarks');
                            }
                        } else {
                            throw new Error('Invalid file format');
                        }
                    } catch (error) {
                        alert('导入失败：' + error.message);
                    }
                };
                reader.readAsText(file);
            }
        }

        function showLoginForm() {
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }

        function login() {
            const password = document.getElementById('password').value;
            if (password === '87654321') {
                isLoggedIn = true;
                alert('登录成功！');
                document.getElementById('login-container').style.display = 'none';
                showEditControls();
            } else {
                alert('密码错误！');
            }
            document.getElementById('password').value = '';
        }

        function showEditControls() {
            const addForm = document.getElementById('add-form');
            const deleteButtons = document.getElementsByClassName('delete-btn');
            if (isLoggedIn) {
                addForm.style.display = 'block';
                for (let btn of deleteButtons) {
                    btn.style.display = 'block';
                }
            } else {
                addForm.style.display = 'none';
                for (let btn of deleteButtons) {
                    btn.style.display = 'none';
                }
            }
        }

        async function fetchHitokoto() {
            try {
                const response = await fetch('https://v1.hitokoto.cn/');
                if (!response.ok) {
                    throw new Error(\`无法获取一言数据: \${response.statusText}\`);
                }
                const data = await response.json();
                document.getElementById('hitokoto').innerHTML = \`\${data.hitokoto} —— \${data.from}\`;
            } catch (error) {
                console.error('获取一言数据失败:', error);
            }
        }

        function updateChinaTime() {
            const now = new Date();
            const chinaTime = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            document.getElementById('china-time').textContent = chinaTime;
        }

        // 初始化函数
        async function init() {
            await fetchLinks();
            await fetchHitokoto();
            updateChinaTime();
            showEditControls();

            // 获取客户端IP和国家信息
            const response = await fetch('/api/client-info');
            const clientInfo = await response.json();
            document.getElementById('client-ip').textContent = clientInfo.ip;
            document.getElementById('client-country').textContent = clientInfo.country;
        }

        // 每4秒刷新一次一言
        setInterval(fetchHitokoto, 4000);

        // 每秒更新一次中国时间
        setInterval(updateChinaTime, 1000);

        // 页面加载完成后初始化
        window.onload = init;
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
            font-size: 2em;
        }
        #info {
            text-align: center;
            font-size: 12px;
            margin-bottom: 20px;
        }
        #memo-container {
            display: flex;
            flex-direction: row;
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
            font-size: 0.9em;
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
        #login-container {
            margin-top: 20px;
            text-align: center;
        }
        #login-form {
            display: none;
            margin-top: 10px;
        }
        #login-form input, #login-form button {
            margin: 5px;
            padding: 5px 10px;
            background-color: rgba(17, 17, 17, 0.8);
            border: 1px solid #0f0;
            color: #0f0;
        }

        /* 响应式设计 */
        @media (max-width: 768px) {
            body {
                padding: 10px;
            }
            h1 {
                font-size: 1.5em;
            }
            #info {
                font-size: 10px;
            }
            #memo-container {
                flex-direction: column;
            }
            #memo-input, #memo-list {
                width: 100%;
                margin-bottom: 10px;
            }
            textarea {
                height: 100px;
            }
            button {
                font-size: 0.8em;
                padding: 3px 6px;
            }
        }

        @media (min-width: 1200px) {
            #memo-container {
                max-width: 1200px;
                margin-left: auto;
                margin-right: auto;
            }
            textarea {
                height: 200px;
            }
        }
    </style>
</head>
<body>
    <canvas id="matrix-bg"></canvas>
    <h1>备忘录</h1>
    <div id="info">
        中国时间: <span id="china-time"></span><br>
        您的IP: <span id="client-ip"></span> | 所在地区: <span id="client-country"></span>
    </div>
    <div id="memo-container">
        <div id="memo-input" style="display: none;">
            <textarea id="new-memo" placeholder="输入新的备忘录..."></textarea>
            <button onclick="addMemo()">添加备忘录</button>
        </div>
        <div id="memo-list"></div>
    </div>
    <button onclick="location.href='/'">返回主页</button>
    <div id="login-container">
        <button id="login-btn" onclick="showLoginForm()">登录</button>
        <div id="login-form" style="display: none;">
            <input type="password" id="password" placeholder="请输入密码">
            <button onclick="login()">确认</button>
        </div>
    </div>

    <script>
        // 背景动画代码（与主页相同，调暗）
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
            ctx.fillStyle = "rgba(0, 102, 0, 0.5)"; // 调暗代码雨的亮度
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

        let memos = [];
        let isLoggedIn = false;

        async function fetchMemos() {
            const response = await fetch('/api/memos');
            memos = await response.json();
            renderMemos();
        }

        function renderMemos() {
            const memoList = document.getElementById('memo-list');
            memoList.innerHTML = memos.map((memo, index) => 
                '<div class="memo-item">' +
                    '<p>' + memo + '</p>' +
                    '<button onclick="deleteMemo(' + index + ')" style="display: ' + (isLoggedIn ? 'inline-block' : 'none') + '">删除</button>' +
                '</div>'
            ).join('');
        }

        async function addMemo() {
            if (!isLoggedIn) {
                alert('请先登录！');
                return;
            }
            const newMemo = document.getElementById('new-memo').value;
            if (newMemo) {
                const response = await fetch('/api/memos', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ memo: newMemo, password: '87654321' }),
                });
                if (response.ok) {
                    await fetchMemos();
                    document.getElementById('new-memo').value = '';
                } else {
                    alert('添加备忘录失败');
                }
            }
        }

        async function deleteMemo(index) {
            if (!isLoggedIn) {
                alert('请先登录！');
                return;
            }
            const response = await fetch(\`/api/memos/\${index}\`, { 
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ password: '87654321' }),
            });
            if (response.ok) {
                await fetchMemos();
            } else {
                alert('删除备忘录失败');
            }
        }

        function showLoginForm() {
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }

        function login() {
            const password = document.getElementById('password').value;
            if (password === '87654321') {
                isLoggedIn = true;
                alert('登录成功！');
                document.getElementById('login-container').style.display = 'none';
                showEditControls();
            } else {
                alert('密码错误！');
            }
            document.getElementById('password').value = '';
        }

        function showEditControls() {
            const memoInput = document.getElementById('memo-input');
            const deleteButtons = document.querySelectorAll('#memo-list button');
            if (isLoggedIn) {
                memoInput.style.display = 'block';
                deleteButtons.forEach(btn => btn.style.display = 'inline-block');
            } else {
                memoInput.style.display = 'none';
                deleteButtons.forEach(btn => btn.style.display = 'none');
            }
        }

        function updateChinaTime() {
            const now = new Date();
            const chinaTime = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
            document.getElementById('china-time').textContent = chinaTime;
        }

        // 初始化函数
        async function init() {
            await fetchMemos();
            updateChinaTime();
            showEditControls();

            // 获取客户端IP和国家信息
            const response = await fetch('/api/client-info');
            const clientInfo = await response.json();
            document.getElementById('client-ip').textContent = clientInfo.ip;
            document.getElementById('client-country').textContent = clientInfo.country;
        }

        // 每秒更新一次中国时间
        setInterval(updateChinaTime, 1000);

        // 页面加载完成后初始化
        window.onload = init;
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

async function fetchHitokoto() {
  const response = await fetch('https://v1.hitokoto.cn/');
  if (!response.ok) {
    throw new Error(`无法获取一言数据: ${response.statusText}`);
  }
  return await response.json();
}

async function handleLinksAPI(request) {
  const { pathname, searchParams } = new URL(request.url);
  const key = 'links';

  if (request.method === 'GET') {
    const links = await NAVIGATION_KV.get(key, 'json') || [];
    return new Response(JSON.stringify(links), { headers: { 'Content-Type': 'application/json' } });
  } else {
    // 检查密码
    const { password, ...data } = await request.json();
    if (password !== '87654321') {
      return new Response('Unauthorized', { status: 401 });
    }

    if (request.method === 'POST') {
      let links = await NAVIGATION_KV.get(key, 'json') || [];
      links.push(data);
      await NAVIGATION_KV.put(key, JSON.stringify(links));
      return new Response('Link added successfully', { status: 201 });
    } else if (request.method === 'PUT') {
      await NAVIGATION_KV.put(key, JSON.stringify(data.links));
      return new Response('Links updated successfully', { status: 200 });
    } else if (request.method === 'DELETE') {
      const index = parseInt(pathname.split('/').pop());
      let links = await NAVIGATION_KV.get(key, 'json') || [];
      if (index >= 0 && index < links.length) {
        links.splice(index, 1);
        await NAVIGATION_KV.put(key, JSON.stringify(links));
        return new Response('Link deleted successfully', { status: 200 });
      } else {
        return new Response('Invalid index', { status: 400 });
      }
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

async function handleMemosAPI(request) {
  const { pathname, searchParams } = new URL(request.url);
  const key = 'memos';

  if (request.method === 'GET') {
    const memos = await NAVIGATION_KV.get(key, 'json') || [];
    return new Response(JSON.stringify(memos), { headers: { 'Content-Type': 'application/json' } });
  } else {
    // 检查密码
    const { password, ...data } = await request.json();
    if (password !== '87654321') {
      return new Response('Unauthorized', { status: 401 });
    }

    if (request.method === 'POST') {
      let memos = await NAVIGATION_KV.get(key, 'json') || [];
      memos.push(data.memo);
      await NAVIGATION_KV.put(key, JSON.stringify(memos));
      return new Response('Memo added successfully', { status: 201 });
    } else if (request.method === 'DELETE') {
      const index = parseInt(pathname.split('/').pop());
      let memos = await NAVIGATION_KV.get(key, 'json') || [];
      if (index >= 0 && index < memos.length) {
        memos.splice(index, 1);
        await NAVIGATION_KV.put(key, JSON.stringify(memos));
        return new Response('Memo deleted successfully', { status: 200 });
      } else {
        return new Response('Invalid index', { status: 400 });
      }
    }
  }

  return new Response('Method not allowed', { status: 405 });
}

function handleClientInfoAPI(clientIP, clientCountry) {
  const clientInfo = {
    ip: clientIP,
    country: clientCountry
  };
  return new Response(JSON.stringify(clientInfo), {
    headers: { 'Content-Type': 'application/json' }
  });
}
