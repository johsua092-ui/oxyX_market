const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcryptjs');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user' CHECK(role IN ('owner', 'staff', 'user')),
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    )
  `);

  // Builds table
  db.run(`
    CREATE TABLE IF NOT EXISTS builds (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT CHECK(type IN ('premium', 'free')),
      price REAL DEFAULT 0,
      file_path TEXT,
      download_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // IP Whitelist table
  db.run(`
    CREATE TABLE IF NOT EXISTS ip_whitelist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ip_address TEXT UNIQUE NOT NULL,
      role TEXT CHECK(role IN ('owner', 'staff')),
      assigned_to TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Create default owner account with random password
  const generatedOwnerPass = Math.random().toString(36).substring(2, 10).toUpperCase();
  const hashedOwnerPass = bcrypt.hashSync(generatedOwnerPass, 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (id, username, email, password, role)
    VALUES (1, 'owner', 'owner@oxyxstore.com', ?, 'owner')
  `, [hashedOwnerPass], function(err) {
    if (!err && this.changes > 0) {
      console.log('\n========================================');
      console.log('  OWNER ACCOUNT CREATED');
      console.log('  Username: owner');
      console.log('  Password: ' + generatedOwnerPass);
      console.log('========================================\n');
    }
  });

  // Create staff accounts with random passwords
  const generatedStaff1Pass = Math.random().toString(36).substring(2, 10).toUpperCase();
  const generatedStaff2Pass = Math.random().toString(36).substring(2, 10).toUpperCase();
  const hashedStaff1Pass = bcrypt.hashSync(generatedStaff1Pass, 10);
  const hashedStaff2Pass = bcrypt.hashSync(generatedStaff2Pass, 10);
  
  db.run(`
    INSERT OR IGNORE INTO users (id, username, email, password, role)
    VALUES (2, 'staff1', 'staff1@oxyxstore.com', ?, 'staff')
  `, [hashedStaff1Pass], function(err) {
    if (!err && this.changes > 0) {
      console.log('STAFF 1 ACCOUNT CREATED');
      console.log('  Username: staff1');
      console.log('  Password: ' + generatedStaff1Pass);
      console.log('');
    }
  });
  
  db.run(`
    INSERT OR IGNORE INTO users (id, username, email, password, role)
    VALUES (3, 'staff2', 'staff2@oxyxstore.com', ?, 'staff')
  `, [hashedStaff2Pass], function(err) {
    if (!err && this.changes > 0) {
      console.log('STAFF 2 ACCOUNT CREATED');
      console.log('  Username: staff2');
      console.log('  Password: ' + generatedStaff2Pass);
      console.log('========================================\n');
    }
  });

  console.log('Database initialized successfully');
});

module.exports = db;
