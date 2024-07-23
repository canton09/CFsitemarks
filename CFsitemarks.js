// 常量定义
const PASSWORD = '87654321';
const KV_KEYS = {
  LINKS: 'links',
  MEMOS: 'memos'
};

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request));
});

async function handleRequest(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // 处理 API 请求
  if (pathname.startsWith('/api/')) {
    if (pathname.startsWith('/api/links')) {
      return handleAPI(request, KV_KEYS.LINKS);
    } else if (pathname.startsWith('/api/memos')) {
      return handleAPI(request, KV_KEYS.MEMOS);
    } else if (pathname === '/api/client-info') {
      return handleClientInfoAPI(request);
    } else if (pathname === '/api/hitokoto') {
      return handleHitokotoProxy(request);
    }
    return new Response('API not found', { status: 404 });
  }

  // 处理页面请求
  if (pathname === '/') {
    return renderPage(generateHomePage);
  } else if (pathname === '/memo') {
    return renderPage(generateMemoPage);
  }

  return new Response('Not Found', { status: 404 });
}

async function renderPage(pageGenerator) {
  const html = pageGenerator();
  return new Response(html, {
    headers: { 'content-type': 'text/html;charset=UTF-8' }
  });
}

function generateCommonHTML(title, content) {
  return `
    <!DOCTYPE html>
    <html lang="zh">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
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
            #hitokoto {
                font-size: 14px;
                color: #0f0;
                text-align: center;
                margin-bottom: 20px;
                font-style: italic;
            }
            #categories, #links {
                display: flex;
                flex-wrap: wrap;
                justify-content: center;
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
            #add-form, #memo-input {
                margin-top: 20px;
                text-align: center;
            }
            input, button, select, textarea {
                background-color: rgba(17, 17, 17, 0.8);
                border: 1px solid #0f0;
                color: #0f0;
                padding: 5px 10px;
                margin: 5px;
                font-size: 0.9em;
            }
            #login-container {
                margin-top: 20px;
                text-align: center;
            }
            #login-form {
                display: none;
                margin-top: 10px;
            }
            @media (max-width: 768px) {
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
            }
        </style>
    </head>
    <body>
        <canvas id="matrix-bg"></canvas>
        <h1>${title}</h1>
        <div id="info">
            中国时间: <span id="china-time"></span><br>
            您的IP: <span id="client-ip"></span> | 所在地区: <span id="client-country"></span>
        </div>
        ${content}
        <script>
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
                ctx.fillStyle = "rgba(0, 102, 0, 0.5)";
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

            function updateChinaTime() {
                const now = new Date();
                const chinaTime = now.toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
                document.getElementById('china-time').textContent = chinaTime;
            }

            async function fetchClientInfo() {
                const response = await fetch('/api/client-info');
                const clientInfo = await response.json();
                document.getElementById('client-ip').textContent = clientInfo.ip;
                document.getElementById('client-country').textContent = clientInfo.country;
            }

            async function init() {
                updateChinaTime();
                await fetchClientInfo();
                if (typeof initPage === 'function') {
                    await initPage();
                }
            }

            setInterval(updateChinaTime, 1000);
            window.onload = init;
        </script>
    </body>
    </html>
  `;
}

function generateHomePage() {
  const content = `
    <div id="hitokoto" style="text-align: center; font-style: italic; margin-bottom: 20px;"></div>
    <div id="categories"></div>
    <div id="links"></div>
    <div id="add-form" style="display: none;">
        <input type="text" id="name" placeholder="网站名称">
        <input type="url" id="url" placeholder="网站地址">
        <input type="url" id="icon" placeholder="图标URL">
        <input type="text" id="category" placeholder="分类">
        <button onclick="addLink()">添加链接</button>
    </div>
    <button class="function-btn" onclick="location.href='/memo'">备忘录</button>
    <button id="export-btn" onclick="exportBookmarks()">导出书签</button>
    <button id="import-btn" onclick="document.getElementById('file-input').click()">导入书签</button>
    <input type="file" id="file-input" accept=".json" onchange="importBookmarks(this)" style="display: none;">
    <div id="login-container">
        <button id="login-btn" onclick="showLoginForm()">登录</button>
        <div id="login-form" style="display: none;">
            <input type="password" id="password" placeholder="请输入密码">
            <button onclick="login()">确认</button>
        </div>
    </div>
    <script>
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
                    body: JSON.stringify({ ...newLink, password: '${PASSWORD}' }),
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
                body: JSON.stringify({ password: '${PASSWORD}' }),
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
                                body: JSON.stringify({ links: importedLinks, password: '${PASSWORD}' }),
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
            if (password === '${PASSWORD}') {
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
                const response = await fetch('/api/hitokoto');
                if (!response.ok) {
                    throw new Error(\`无法获取一言数据: \${response.statusText}\`);
                }
                const data = await response.json();
                document.getElementById('hitokoto').innerHTML = \`\${data.hitokoto} —— \${data.from}\`;
            } catch (error) {
                console.error('获取一言数据失败:', error);
                document.getElementById('hitokoto').innerHTML = '无法获取一言，请稍后再试。';
            }
        }

        async function initPage() {
            await fetchLinks();
            await fetchHitokoto();
            showEditControls();
        }

        // 确保在页面加载完成后调用 initPage
        window.addEventListener('load', initPage);

        // 每4秒刷新一次一言
        setInterval(fetchHitokoto, 4000);
    </script>
  `;
  return generateCommonHTML('黑風導航', content);
}

function generateMemoPage() {
  const content = `
    <div id="memo-container">
      <div id="memo-sidebar">
        <div id="memo-search">
          <input type="text" id="search-input" placeholder="搜索备忘录...">
        </div>
        <div id="memo-categories">
          <h3>分类</h3>
          <ul id="category-list"></ul>
        </div>
      </div>
      <div id="memo-main">
        <div id="memo-list"></div>
        <div id="memo-input" style="display: none;">
          <input type="text" id="memo-title" placeholder="标题">
          <textarea id="memo-content" placeholder="输入新的备忘录..."></textarea>
          <input type="text" id="memo-category" placeholder="分类">
          <button onclick="addOrUpdateMemo()">保存备忘录</button>
        </div>
      </div>
    </div>
    <button class="function-btn" onclick="location.href='/'">返回主页</button>
    <div id="login-container">
        <button id="login-btn" onclick="showLoginForm()">登录</button>
        <div id="login-form" style="display: none;">
            <input type="password" id="password" placeholder="请输入密码">
            <button onclick="login()">确认</button>
        </div>
    </div>
    <style>
      #memo-container {
        display: flex;
        max-width: 1200px;
        margin: 0 auto;
        background-color: rgba(0, 0, 0, 0.7);
        border-radius: 10px;
        overflow: hidden;
      }
      #memo-sidebar {
        width: 250px;
        background-color: rgba(0, 20, 0, 0.8);
        padding: 20px;
        border-right: 1px solid #0f0;
      }
      #memo-main {
        flex-grow: 1;
        padding: 20px;
      }
      #memo-search input, #memo-input input, #memo-input textarea {
        width: 100%;
        margin-bottom: 10px;
        background-color: rgba(0, 20, 0, 0.6);
        border: 1px solid #0f0;
        color: #0f0;
        padding: 10px;
      }
      #memo-categories h3 {
        color: #0f0;
        margin-top: 20px;
      }
      #category-list {
        list-style-type: none;
        padding: 0;
      }
      #category-list li {
        cursor: pointer;
        padding: 5px;
        margin: 2px 0;
        background-color: rgba(0, 40, 0, 0.6);
        border-radius: 3px;
      }
      #category-list li:hover {
        background-color: rgba(0, 60, 0, 0.6);
      }
      .memo-item {
        background-color: rgba(0, 20, 0, 0.6);
        margin-bottom: 10px;
        padding: 10px;
        border-radius: 5px;
        transition: all 0.3s ease;
      }
      .memo-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0, 255, 0, 0.2);
      }
      .memo-item h3 {
        margin-top: 0;
        color: #0f0;
      }
      .memo-item p {
        margin-bottom: 5px;
      }
      .memo-item .memo-category {
        font-size: 0.8em;
        color: #0f9;
      }
      .memo-actions {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;
      }
      .memo-actions button {
        margin-left: 5px;
        background-color: rgba(0, 40, 0, 0.6);
        border: none;
        color: #0f0;
        padding: 5px 10px;
        cursor: pointer;
        transition: background-color 0.3s ease;
      }
      .memo-actions button:hover {
        background-color: rgba(0, 60, 0, 0.6);
      }
      #memo-input {
        margin-top: 20px;
      }
      .function-btn {
        display: block;
        margin: 20px auto;
      }
    </style>
    <script>
        let memos = [];
        let isLoggedIn = false;
        let currentCategory = 'all';
        let editingMemoId = null;

        async function fetchMemos() {
            const response = await fetch('/api/memos');
            memos = await response.json();
            renderMemos();
            renderCategories();
        }

        function renderMemos() {
            const memoList = document.getElementById('memo-list');
            memoList.innerHTML = memos
                .filter(memo => currentCategory === 'all' || memo.category === currentCategory)
                .map((memo, index) => \`
                    <div class="memo-item" data-id="\${index}">
                        <h3>\${memo.title}</h3>
                        <p>\${memo.content}</p>
                        <div class="memo-category">\${memo.category || '未分类'}</div>
                        <div class="memo-actions" style="display: \${isLoggedIn ? 'flex' : 'none'}">
                            <button onclick="editMemo(\${index})">编辑</button>
                            <button onclick="deleteMemo(\${index})">删除</button>
                        </div>
                    </div>
                \`).join('');
        }

        function renderCategories() {
            const categories = ['全部', ...new Set(memos.map(memo => memo.category || '未分类'))];
            const categoryList = document.getElementById('category-list');
            categoryList.innerHTML = categories.map(category => 
                \`<li onclick="filterCategory('\${category}')">\${category}</li>\`
            ).join('');
        }

        function filterCategory(category) {
            currentCategory = category === '全部' ? 'all' : category;
            renderMemos();
        }

        async function addOrUpdateMemo() {
            if (!isLoggedIn) {
                alert('请先登录！');
                return;
            }
            const title = document.getElementById('memo-title').value;
            const content = document.getElementById('memo-content').value;
            const category = document.getElementById('memo-category').value || '未分类';
            
            if (title && content) {
                const newMemo = { title, content, category };
                const method = editingMemoId !== null ? 'PUT' : 'POST';
                const url = editingMemoId !== null ? \`/api/memos/\${editingMemoId}\` : '/api/memos';
                
                const response = await fetch(url, {
                    method: method,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ ...newMemo, password: '${PASSWORD}' }),
                });
                if (response.ok) {
                    await fetchMemos();
                    clearMemoForm();
                    editingMemoId = null;
                } else {
                    alert(editingMemoId !== null ? '更新备忘录失败' : '添加备忘录失败');
                }
            }
        }

        function editMemo(index) {
            const memo = memos[index];
            document.getElementById('memo-title').value = memo.title;
            document.getElementById('memo-content').value = memo.content;
            document.getElementById('memo-category').value = memo.category || '';
            editingMemoId = index;
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
                body: JSON.stringify({ password: '${PASSWORD}' }),
            });
            if (response.ok) {
                await fetchMemos();
            } else {
                alert('删除备忘录失败');
            }
        }

        function clearMemoForm() {
            document.getElementById('memo-title').value = '';
            document.getElementById('memo-content').value = '';
            document.getElementById('memo-category').value = '';
        }

        function showLoginForm() {
            document.getElementById('login-btn').style.display = 'none';
            document.getElementById('login-form').style.display = 'block';
        }

        function login() {
            const password = document.getElementById('password').value;
            if (password === '${PASSWORD}') {
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
            const memoActions = document.querySelectorAll('.memo-actions');
            if (isLoggedIn) {
                memoInput.style.display = 'block';
                memoActions.forEach(action => action.style.display = 'flex');
            } else {
                memoInput.style.display = 'none';
                memoActions.forEach(action => action.style.display = 'none');
            }
        }

        document.getElementById('search-input').addEventListener('input', function(e) {
            const searchTerm = e.target.value.toLowerCase();
            const filteredMemos = memos.filter(memo => 
                memo.title.toLowerCase().includes(searchTerm) || 
                memo.content.toLowerCase().includes(searchTerm)
            );
            renderFilteredMemos(filteredMemos);
        });

        function renderFilteredMemos(filteredMemos) {
            const memoList = document.getElementById('memo-list');
            memoList.innerHTML = filteredMemos.map((memo, index) => \`
                <div class="memo-item" data-id="\${index}">
                    <h3>\${memo.title}</h3>
                    <p>\${memo.content}</p>
                    <div class="memo-category">\${memo.category || '未分类'}</div>
                    <div class="memo-actions" style="display: \${isLoggedIn ? 'flex' : 'none'}">
                        <button onclick="editMemo(\${index})">编辑</button>
                        <button onclick="deleteMemo(\${index})">删除</button>
                    </div>
                </div>
            \`).join('');
        }

        async function initPage() {
            await fetchMemos();
            showEditControls();
        }

        // 确保在页面加载完成后调用 initPage
        window.addEventListener('load', initPage);
    </script>
  `;
  return generateCommonHTML('备忘录', content);
}

async function handleAPI(request, key) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (request.method === 'GET') {
    const data = await NAVIGATION_KV.get(key, 'json') || [];
    return new Response(JSON.stringify(data), { headers: { 'Content-Type': 'application/json' } });
  }

  let requestData;
  try {
    requestData = await request.json();
  } catch (error) {
    return new Response('Invalid JSON', { status: 400 });
  }

  const { password, ...data } = requestData;
  if (password !== PASSWORD) {
    return new Response('Unauthorized', { status: 401 });
  }

  let items = await NAVIGATION_KV.get(key, 'json') || [];

  switch (request.method) {
    case 'POST':
      items.push(key === KV_KEYS.MEMOS ? data : data);
      await NAVIGATION_KV.put(key, JSON.stringify(items));
      return new Response('Item added successfully', { status: 201 });
    case 'PUT':
      if (key === KV_KEYS.LINKS) {
        await NAVIGATION_KV.put(key, JSON.stringify(data.links));
        return new Response('Links updated successfully', { status: 200 });
      } else if (key === KV_KEYS.MEMOS) {
        const index = parseInt(pathname.split('/').pop());
        if (index >= 0 && index < items.length) {
          items[index] = data;
          await NAVIGATION_KV.put(key, JSON.stringify(items));
          return new Response('Memo updated successfully', { status: 200 });
        }
        return new Response('Invalid index', { status: 400 });
      }
      break;
    case 'DELETE':
      const index = parseInt(pathname.split('/').pop());
      if (index >= 0 && index < items.length) {
        items.splice(index, 1);
        await NAVIGATION_KV.put(key, JSON.stringify(items));
        return new Response('Item deleted successfully', { status: 200 });
      }
      return new Response('Invalid index', { status: 400 });
  }

  return new Response('Method not allowed', { status: 405 });
}

function handleClientInfoAPI(request) {
  const clientIP = request.headers.get('CF-Connecting-IP');
  const clientCountry = request.headers.get('CF-IPCountry');
  return new Response(JSON.stringify({ ip: clientIP, country: clientCountry }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

async function handleHitokotoProxy(request) {
  const hitokotoUrl = 'https://v1.hitokoto.cn/';
  const response = await fetch(hitokotoUrl);
  const data = await response.json();
  return new Response(JSON.stringify(data), {
    headers: { 'Content-Type': 'application/json' },
  });
}
