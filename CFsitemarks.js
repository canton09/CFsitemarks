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

        fetchLinks();

        // 添加一言刷新功能
        function refreshHitokoto() {
            fetch('https://v1.hitokoto.cn/')
                .then(response => response.json())
                .then(data => {
                    document.getElementById('hitokoto').innerHTML = 
                        \`\${data.hitokoto} —— \${data.from}\`;
                })
                .catch(console.error);
        }

        // 每4秒刷新一次一言
        setInterval(refreshHitokoto, 4000);

        // 在页面加载时隐藏编辑控件
        window.onload = function() {
            showEditControls();
        };
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

    fetchMemos();

    // 在页面加载时隐藏编辑控件
    window.onload = function() {
        showEditControls();
    };
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
