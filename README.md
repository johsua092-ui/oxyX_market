# Oxyx Store

![Oxyx Store Logo](https://img.shields.io/badge/Oxyx-Store-6366f1?style=for-the-badge&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLXdpZHRoPSIyIj48cGF0aCBkPSJNMTIgMkwyIDIxSDIyTDEyIDJaIi8+PC9zdmc+&logoColor=white)

Premium & Free Builds Marketplace dengan sistem manajemen IP Whitelist untuk keamanan akses Owner dan Staff.

## Fitur Utama

- **Autentikasi Lengkap** - Sistem Login/Register dengan bcrypt encryption
- **IP Whitelist** - Hanya 1 Owner dan 2 Staff yang dapat login dengan IP tertentu
- **Build Management** - Upload dan kelola build Premium dan Free
- **UI Modern** - Desain aesthetic dengan dark theme dan gradient accents
- **Role System** - Owner, Staff, dan User dengan permission berbeda
- **Download System** - Download builds dengan tracking count

## Default Accounts

> **NOTE**: Passwords are now randomly generated on first run!

| Role | Username | Password |
|------|----------|----------|
| Owner | `owner` | Generated on first run (check console) |
| Staff 1 | `staff1` | Generated on first run (check console) |
| Staff 2 | `staff2` | Generated on first run (check console) |

## GitHub Setup (Push & Pull)

### 1. Inisialisasi Repository Local
```bash
cd "C:\Users\MyBook Hype\CascadeProjects\oxyx-store"
git init
git add .
git commit -m "Initial commit: Oxyx Store"
```

### 2. Connect ke GitHub Repository
```bash
# Create repository di GitHub dulu (tanpa README, .gitignore, license)
# Lalu jalankan:
git remote add origin https://github.com/USERNAME/oxyx-store.git
git branch -M main
git push -u origin main
```

### 3. Pull dari GitHub
```bash
git pull origin main
```

### 4. Push Perubahan
```bash
git add .
git commit -m "Update: deskripsi perubahan"
git push origin main
```

### File yang di-ignore (sudah di .gitignore)
- `node_modules/` - Install dengan `npm install`
- `database.sqlite` - Database local
- `public/uploads/` - File uploads
- `.env` - Environment variables

## Instalasi

1. Clone repository:
```bash
git clone https://github.com/username/oxyx-store.git
cd oxyx-store
```

2. Install dependencies:
```bash
npm install
```

3. Jalankan aplikasi:
```bash
npm start
# atau untuk development
npm run dev
```

4. Buka browser dan akses:
```
http://localhost:3000
```

## Konfigurasi Environment

Buat file `.env` di root directory:

```env
PORT=3000
SESSION_SECRET=your_secret_key_here
OWNER_IP=your_owner_ip
STAFF1_IP=your_staff1_ip
STAFF2_IP=your_staff2_ip
```

## Struktur Project

```
oxyx-store/
├── views/
│   ├── layout.ejs          # Main layout template
│   ├── index.ejs           # Homepage
│   ├── login.ejs           # Login page
│   ├── register.ejs        # Register page
│   └── admin/
│       ├── dashboard.ejs   # Admin dashboard
│       └── new-build.ejs   # Add build form
├── public/
│   └── uploads/            # Build files storage
├── database.js             # SQLite configuration
├── server.js               # Main server file
├── package.json
├── .env
└── README.md
```

## Deployment

### Deploy ke Railway/Render/Heroku

1. Push ke GitHub repository
2. Connect repository ke platform deployment
3. Set environment variables
4. Deploy!

### Deploy ke VPS

```bash
# Install PM2 globally
npm install -g pm2

# Start dengan PM2
pm2 start server.js --name oxyx-store

# Save PM2 config
pm2 save
pm2 startup
```

## Keamanan

- Password di-hash dengan bcrypt (10 salt rounds)
- Session management dengan express-session
- IP Whitelist untuk akses Owner/Staff
- Input validation pada semua form
- File upload validation dan size limits

## Lisensi

MIT License - Free untuk penggunaan pribadi dan komersial.

---

Dibuat dengan ❤️ oleh Oxyx Store Team
