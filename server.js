const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = 5000;
const DB_FILE = path.join(__dirname, 'database.json');

app.use(express.json());

// तुमची मूळ index.html आणि style.css लोड करण्यासाठी
const frontendDir = fs.existsSync(path.join(__dirname, '..', 'index.html'))
  ? path.join(__dirname, '..')
  : __dirname;

app.use(express.static(frontendDir));

// डेटाबेस फाईल नसेल तर तयार करणे
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ users: [], blogs: [] }, null, 2));
}

function readDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
}

function writeDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// 1. User Registration (Store credentials securely)
app.post('/api/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }
  const db = readDB();
  if (db.users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email is already registered' });
  }
  const newUser = {
    id: Date.now().toString(),
    name,
    email,
    password: hashPassword(password)
  };
  db.users.push(newUser);
  writeDB(db);
  res.status(201).json({ message: 'Account created successfully!', user: { id: newUser.id, name: newUser.name, email: newUser.email } });
});

// 2. User Login
app.post('/api/login', (req, res) => {
  const { email, password } = req.body;
  const db = readDB();
  const user = db.users.find(u => u.email === email && u.password === hashPassword(password));
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ message: 'Login successful!', user: { id: user.id, name: user.name, email: user.email } });
});

// 3. Get All Blogs (Retrieve all blogs from database)
app.get('/api/blogs', (req, res) => {
  const db = readDB();
  res.json(db.blogs);
});

// 4. Create or Update Blog (Store blog data in database)
app.post('/api/blogs', (req, res) => {
  const { title, category, content, author, authorEmail } = req.body;
  if (!title || !content) {
    return res.status(400).json({ message: 'Title and content are required' });
  }
  const db = readDB();
  const newBlog = {
    id: Date.now().toString(),
    title,
    category: category || 'Technology',
    content,
    author: author || 'Anonymous',
    authorEmail: authorEmail || '',
    date: new Date().toLocaleDateString()
  };
  db.blogs.unshift(newBlog);
  writeDB(db);
  res.status(201).json(newBlog);
});

// 5. Update Blog
app.put('/api/blogs/:id', (req, res) => {
  const { title, category, content } = req.body;
  const db = readDB();
  const index = db.blogs.findIndex(b => b.id === req.params.id);
  if (index === -1) return res.status(404).json({ message: 'Blog not found' });

  db.blogs[index] = { ...db.blogs[index], title, category, content };
  writeDB(db);
  res.json(db.blogs[index]);
});

// 6. Delete Blog
app.delete('/api/blogs/:id', (req, res) => {
  const db = readDB();
  db.blogs = db.blogs.filter(b => b.id !== req.params.id);
  writeDB(db);
  res.json({ message: 'Blog deleted' });
});

// 7. Get Single Blog Details (Individual blog page data)
app.get('/api/blogs/:id', (req, res) => {
  const db = readDB();
  const blog = db.blogs.find(b => b.id === req.params.id);
  if (!blog) return res.status(404).json({ message: 'Blog not found' });
  res.json(blog);
});

app.get('/', (req, res) => {
  res.sendFile(path.join(frontendDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});