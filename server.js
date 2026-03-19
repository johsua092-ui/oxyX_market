const express = require('express');
const session = require('express-session');
const path = require('path');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const uuid = require('uuid');
require('dotenv').config();

const db = require('./database');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: process.env.SESSION_SECRET || 'oxyx_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Set view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

// IP Whitelist Middleware
const ipWhitelistMiddleware = (req, res, next) => {
  if (req.session.user && (req.session.user.role === 'owner' || req.session.user.role === 'staff')) {
    const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const cleanIP = clientIP.replace('::ffff:', '');
    
    db.get('SELECT * FROM ip_whitelist WHERE ip_address = ?', [cleanIP], (err, row) => {
      if (err) {
        console.error('IP check error:', err);
        return next();
      }
      
      // If IP is not whitelisted, add it for owner/staff
      if (!row && req.session.user.role === 'owner') {
        db.run('INSERT OR IGNORE INTO ip_whitelist (ip_address, role, assigned_to) VALUES (?, ?, ?)',
          [cleanIP, 'owner', req.session.user.username]);
      }
      
      req.session.userIp = cleanIP;
      next();
    });
  } else {
    next();
  }
};

// Auth Middleware
const requireAuth = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.session.user || (req.session.user.role !== 'owner' && req.session.user.role !== 'staff')) {
    return res.status(403).send('Access denied');
  }
  next();
};

const requireOwner = (req, res, next) => {
  if (!req.session.user || req.session.user.role !== 'owner') {
    return res.status(403).send('Owner access only');
  }
  next();
};

// Routes
app.get('/', (req, res) => {
  db.all('SELECT * FROM builds ORDER BY created_at DESC', [], (err, builds) => {
    if (err) {
      builds = [];
    }
    res.render('index', { 
      user: req.session.user,
      builds: builds
    });
  });
});

// Auth Routes
app.get('/login', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('login', { error: null });
});

app.post('/login', (req, res) => {
  const { username, password } = req.body;
  
  db.get('SELECT * FROM users WHERE username = ?', [username], (err, user) => {
    if (err || !user) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    if (!bcrypt.compareSync(password, user.password)) {
      return res.render('login', { error: 'Invalid credentials' });
    }
    
    // Check IP whitelist for owner/staff
    if (user.role === 'owner' || user.role === 'staff') {
      const clientIP = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      const cleanIP = clientIP.replace('::ffff:', '');
      
      db.get('SELECT * FROM ip_whitelist WHERE ip_address = ?', [cleanIP], (err, ipRow) => {
        if (!ipRow && user.role === 'staff') {
          return res.render('login', { error: 'Access denied: IP not whitelisted' });
        }
        
        // Auto-whitelist owner IP
        if (!ipRow && user.role === 'owner') {
          db.run('INSERT OR IGNORE INTO ip_whitelist (ip_address, role, assigned_to) VALUES (?, ?, ?)',
            [cleanIP, 'owner', user.username]);
        }
        
        req.session.user = {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        };
        
        db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP, ip_address = ? WHERE id = ?', 
          [cleanIP, user.id]);
        
        res.redirect('/');
      });
    } else {
      req.session.user = {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      };
      
      db.run('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
      res.redirect('/');
    }
  });
});

app.get('/register', (req, res) => {
  if (req.session.user) {
    return res.redirect('/');
  }
  res.render('register', { error: null });
});

app.post('/register', (req, res) => {
  const { username, email, password, confirmPassword } = req.body;
  
  if (password !== confirmPassword) {
    return res.render('register', { error: 'Passwords do not match' });
  }
  
  if (password.length < 6) {
    return res.render('register', { error: 'Password must be at least 6 characters' });
  }
  
  const hashedPassword = bcrypt.hashSync(password, 10);
  
  db.run('INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
    [username, email, hashedPassword, 'user'],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE constraint failed')) {
          return res.render('register', { error: 'Username or email already exists' });
        }
        return res.render('register', { error: 'Registration failed' });
      }
      
      req.session.user = {
        id: this.lastID,
        username: username,
        email: email,
        role: 'user'
      };
      
      res.redirect('/');
    }
  );
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

// Admin Routes
app.get('/admin', requireAdmin, (req, res) => {
  db.all('SELECT * FROM builds ORDER BY created_at DESC', [], (err, builds) => {
    db.all('SELECT * FROM users ORDER BY created_at DESC', [], (err2, users) => {
      db.all('SELECT * FROM ip_whitelist', [], (err3, ips) => {
        res.render('admin/dashboard', {
          user: req.session.user,
          builds: builds || [],
          users: users || [],
          ips: ips || []
        });
      });
    });
  });
});

app.get('/admin/builds/new', requireAdmin, (req, res) => {
  res.render('admin/new-build', { user: req.session.user, error: null });
});

app.post('/admin/builds', requireAdmin, upload.single('buildFile'), (req, res) => {
  const { name, description, type, price } = req.body;
  const filePath = req.file ? '/uploads/' + req.file.filename : null;
  
  db.run('INSERT INTO builds (name, description, type, price, file_path, created_by) VALUES (?, ?, ?, ?, ?, ?)',
    [name, description, type, price || 0, filePath, req.session.user.id],
    function(err) {
      if (err) {
        return res.render('admin/new-build', { 
          user: req.session.user, 
          error: 'Failed to create build' 
        });
      }
      res.redirect('/admin');
    }
  );
});

app.post('/admin/builds/:id/delete', requireAdmin, (req, res) => {
  db.run('DELETE FROM builds WHERE id = ?', [req.params.id], (err) => {
    res.redirect('/admin');
  });
});

// IP Whitelist Management (Owner only)
app.post('/admin/ip-whitelist', requireOwner, (req, res) => {
  const { ipAddress, role, assignedTo } = req.body;
  
  db.run('INSERT OR REPLACE INTO ip_whitelist (ip_address, role, assigned_to) VALUES (?, ?, ?)',
    [ipAddress, role, assignedTo],
    (err) => {
      if (err) {
        return res.status(500).json({ error: 'Failed to add IP' });
      }
      res.redirect('/admin');
    }
  );
});

app.post('/admin/ip-whitelist/:id/delete', requireOwner, (req, res) => {
  db.run('DELETE FROM ip_whitelist WHERE id = ?', [req.params.id], (err) => {
    res.redirect('/admin');
  });
});

// Download Build
app.get('/download/:id', requireAuth, (req, res) => {
  db.get('SELECT * FROM builds WHERE id = ?', [req.params.id], (err, build) => {
    if (err || !build) {
      return res.status(404).send('Build not found');
    }
    
    // Check if premium and user is not admin
    if (build.type === 'premium' && req.session.user.role === 'user') {
      return res.status(403).send('Premium builds require staff access');
    }
    
    // Increment download count
    db.run('UPDATE builds SET download_count = download_count + 1 WHERE id = ?', [build.id]);
    
    if (build.file_path) {
      res.download(path.join(__dirname, 'public', build.file_path));
    } else {
      res.send('Build file not available');
    }
  });
});

// API Routes
app.get('/api/builds', (req, res) => {
  db.all('SELECT id, name, description, type, price, download_count, created_at FROM builds ORDER BY created_at DESC', 
    [], (err, builds) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      res.json(builds);
    }
  );
});

// Initialize uploads directory
const fs = require('fs');
const uploadsDir = path.join(__dirname, 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

app.listen(PORT, () => {
  console.log(`Oxyx Store running on http://localhost:${PORT}`);
  console.log(`Check console above for randomly generated Owner/Staff passwords`);
});

module.exports = app;
