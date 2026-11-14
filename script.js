let allBlogs = JSON.parse(localStorage.getItem('blogspace_blogs')) || [
  {
    id: '1',
    title: 'Welcome to BlogSpace',
    category: 'Technology',
    content: 
    author: 'Admin',
    authorEmail: 'admin@blogspace.com',
    date: new Date().toLocaleDateString()
  }
];

let currentCategory = 'All';
let currentUser = JSON.parse(localStorage.getItem('blogspace_user')) || null;
let editingBlogId = null;

document.addEventListener('DOMContentLoaded', () => {
  updateAuthUI();
  renderBlogs();
  if (currentUser) renderMyBlogs();
});

function saveBlogsToLocal() {
  localStorage.setItem('blogspace_blogs', JSON.stringify(allBlogs));
}

// page change
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const target = document.getElementById(pageId);
  if (target) target.classList.add('active');

  if (pageId === 'dashboard') {
    if (!currentUser) {
      alert('Please login first to access your dashboard.');
      showPage('login');
      return;
    }
    renderMyBlogs();
  }
}

function updateAuthUI() {
  const logoutBtn = document.getElementById('logoutBtn');
  const welcome = document.getElementById('welcome');
  if (currentUser) {
    if (logoutBtn) logoutBtn.style.display = 'inline-block';
    if (welcome) welcome.textContent = `Welcome, ${currentUser.name}`;
  } else {
    if (logoutBtn) logoutBtn.style.display = 'none';
    if (welcome) welcome.textContent = 'My Dashboard';
  }
}

// Email login
function login(event) {
  event.preventDefault();
  const email = document.getElementById('loginEmail').value.trim();
  const nameFromEmail = email.split('@')[0] || 'User';

  currentUser = {
    name: nameFromEmail,
    email: email
  };

  localStorage.setItem('blogspace_user', JSON.stringify(currentUser));
  updateAuthUI();
  event.target.reset();
  showPage('dashboard');
}

function logout() {
  currentUser = null;
  localStorage.removeItem('blogspace_user');
  updateAuthUI();
  showPage('home');
}

function setCategory(category, btn) {
  currentCategory = category;
  document.querySelectorAll('.filters button').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  renderBlogs();
}

// To show blog on home page
function renderBlogs() {
  const list = document.getElementById('blogList');
  const noBlogs = document.getElementById('noBlogs');
  if (!list) return;

  const searchInput = document.getElementById('search');
  const searchVal = searchInput ? searchInput.value.toLowerCase() : '';

  const filtered = allBlogs.filter(b => {
    const matchesCat = currentCategory === 'All' || b.category === currentCategory;
    const matchesSearch = b.title.toLowerCase().includes(searchVal) || b.content.toLowerCase().includes(searchVal);
    return matchesCat && matchesSearch;
  });

  if (filtered.length === 0) {
    list.innerHTML = '';
    if (noBlogs) noBlogs.style.display = 'block';
    return;
  }

  if (noBlogs) noBlogs.style.display = 'none';
  list.innerHTML = filtered.map(blog => `
    <div class="card">
      <div class="tag">${blog.category}</div>
      <h3>${blog.title}</h3>
      <p>${blog.content.substring(0, 130)}...</p>
      <div class="meta">By ${blog.author} • ${blog.date}</div>
      <div class="actions">
        <button class="primary" onclick="viewBlog('${blog.id}')">Read More →</button>
      </div>
    </div>
  `).join('');
}

// To open new blog page
function openCreate() {
  if (!currentUser) {
    alert('Please login first to write a blog.');
    showPage('login');
    return;
  }
  editingBlogId = null;
  document.getElementById('editorTitle').textContent = 'Create a Blog';
  document.getElementById('blogTitle').value = '';
  document.getElementById('blogCategory').value = 'Technology';
  document.getElementById('blogContent').value = '';
  showPage('create');
}

// Publish to save blog
function saveBlog(event) {
  event.preventDefault();
  const title = document.getElementById('blogTitle').value.trim();
  const category = document.getElementById('blogCategory').value;
  const content = document.getElementById('blogContent').value.trim();

  if (!title || !content) {
    alert('fill title'.');
    return;
  }

  if (editingBlogId) {
    const index = allBlogs.findIndex(b => b.id === editingBlogId);
    if (index !== -1) {
      allBlogs[index] = { ...allBlogs[index], title, category, content };
    }
    alert('Blog updated!');
  } else {
    const newBlog = {
      id: Date.now().toString(),
      title: title,
      category: category,
      content: content,
      author: currentUser ? currentUser.name : 'Anonymous',
      authorEmail: currentUser ? currentUser.email : '',
      date: new Date().toLocaleDateString()
    };
    allBlogs.unshift(newBlog);
    alert('Blog published successfully!');
  }

  saveBlogsToLocal();
  renderBlogs();
  renderMyBlogs();
  showPage('dashboard');
}

// To show blog on dashboard
function renderMyBlogs() {
  const container = document.getElementById('myBlogs');
  const emptyMsg = document.getElementById('noMyBlogs');
  if (!currentUser || !container) return;

  if (allBlogs.length === 0) {
    container.innerHTML = '';
    if (emptyMsg) emptyMsg.style.display = 'block';
    return;
  }

  if (emptyMsg) emptyMsg.style.display = 'none';
  container.innerHTML = allBlogs.map(blog => `
    <div class="card">
      <div class="tag">${blog.category}</div>
      <h3>${blog.title}</h3>
      <p>${blog.content.substring(0, 120)}...</p>
      <div class="meta">By ${blog.author} • ${blog.date}</div>
      <div class="actions">
        <button class="primary" onclick="viewBlog('${blog.id}')">Read</button>
        <button class="secondary" onclick="editBlog('${blog.id}')">Edit</button>
        <button class="secondary" onclick="deleteBlog('${blog.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function editBlog(id) {
  const blog = allBlogs.find(b => b.id === id);
  if (!blog) return;
  editingBlogId = id;
  document.getElementById('editorTitle').textContent = 'Edit Blog';
  document.getElementById('blogTitle').value = blog.title;
  document.getElementById('blogCategory').value = blog.category;
  document.getElementById('blogContent').value = blog.content;
  showPage('create');
}

function deleteBlog(id) {
  if (!confirm('Are you sure you want to delete this blog?')) return;
  allBlogs = allBlogs.filter(b => b.id !== id);
  saveBlogsToLocal();
  renderBlogs();
  renderMyBlogs();
}

// To read Blog
function viewBlog(id) {
  const blog = allBlogs.find(b => b.id === id);
  if (!blog) {
    alert('Blog not found');
    return;
  }
  document.getElementById('readCategory').textContent = blog.category;
  document.getElementById('readTitle').textContent = blog.title;
  document.getElementById('readMeta').textContent = `By ${blog.author} • Published on ${blog.date}`;
  document.getElementById('readContent').textContent = blog.content;
  showPage('read');
}