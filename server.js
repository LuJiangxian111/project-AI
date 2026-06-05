import express from 'express';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import Database from 'better-sqlite3';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import nodemailer from 'nodemailer';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 8000;
const JWT_SECRET = process.env.JWT_SECRET || 'project-ai-secret-key-2024';

// 邮件发送器 - 动态创建
let transporter = null;
let smtpConfig = null;

// 初始化 transporter（从环境变量优先，否则从数据库读取）
function initTransporter(dbInstance) {
  // 优先使用环境变量
  const envHost = process.env.SMTP_HOST;
  const envUser = process.env.SMTP_USER;
  const envPass = process.env.SMTP_PASS;
  
  if (envHost && envUser && envPass) {
    smtpConfig = {
      host: envHost,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      user: envUser,
      pass: envPass,
    };
    transporter = nodemailer.createTransport({
      host: smtpConfig.host,
      port: smtpConfig.port,
      secure: smtpConfig.secure,
      auth: { user: smtpConfig.user, pass: smtpConfig.pass },
    });
    console.log('[SMTP] 已通过环境变量初始化邮件服务');
    return;
  }
  
  // 从数据库读取
  try {
    if (dbInstance) {
      const row = dbInstance.prepare("SELECT value FROM system_settings WHERE key = 'smtp_config'").get();
      if (row) {
        smtpConfig = JSON.parse(row.value);
        if (smtpConfig && smtpConfig.host && smtpConfig.user && smtpConfig.pass) {
          transporter = nodemailer.createTransport({
            host: smtpConfig.host,
            port: smtpConfig.port || 587,
            secure: smtpConfig.secure || false,
            auth: { user: smtpConfig.user, pass: smtpConfig.pass },
          });
          console.log('[SMTP] 已从数据库加载邮件配置');
          return;
        }
      }
    }
  } catch (e) {
    console.error('[SMTP] 从数据库加载配置失败:', e.message);
  }
  
  console.log('[SMTP] 邮件服务未配置，验证码将仅在控制台输出');
}

// 创建/更新 transporter
function recreateTransporter(config) {
  smtpConfig = config;
  if (config && config.host && config.user && config.pass) {
    transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port || 587,
      secure: config.secure || false,
      auth: { user: config.user, pass: config.pass },
    });
    return true;
  }
  transporter = null;
  return false;
}

// 生成6位数字验证码
function generateCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 发送验证码邮件
async function sendVerificationEmail(email, code) {
  if (!transporter) {
    console.log(`[DEV] 验证码已发送到 ${email}: ${code}`);
    return { dev: true, code };
  }
  try {
    await transporter.sendMail({
      from: smtpConfig?.user || process.env.SMTP_USER,
      to: email,
      subject: 'ProjectAI - 密码重置验证码',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;background:#0f172a;color:#e2e8f0;border-radius:12px">
        <h2 style="color:#6366f1">ProjectAI 密码重置</h2>
        <p>您的验证码为：</p>
        <div style="font-size:32px;font-weight:bold;letter-spacing:8px;text-align:center;padding:16px;background:#1e293b;border-radius:8px;color:#22d3ee;margin:16px 0">${code}</div>
        <p style="color:#94a3b8;font-size:14px">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>`,
    });
    return { dev: false };
  } catch (e) {
    console.error('[SMTP] 邮件发送失败:', e.message);
    throw e;
  }
}

// 数据库初始化
const DATA_DIR = process.env.DATA_DIR || __dirname;
const db = new Database(path.join(DATA_DIR, 'data.db'));
db.pragma('journal_mode = WAL');

// 创建表
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    hashed_password TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    is_superuser INTEGER DEFAULT 0,
    preferences TEXT DEFAULT '{}',
    llm_provider TEXT DEFAULT 'openai',
    llm_api_key TEXT,
    llm_base_url TEXT,
    llm_model TEXT DEFAULT 'gpt-4',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'planning',
    progress REAL DEFAULT 0,
    start_date TEXT,
    end_date TEXT,
    deadline TEXT,
    budget REAL,
    actual_cost REAL DEFAULT 0,
    owner_id TEXT NOT NULL REFERENCES users(id),
    team_members TEXT DEFAULT '[]',
    settings TEXT DEFAULT '{}',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    due_date TEXT,
    start_date TEXT,
    completed_date TEXT,
    progress REAL DEFAULT 0,
    estimated_hours REAL,
    actual_hours REAL DEFAULT 0,
    project_id TEXT NOT NULL REFERENCES projects(id),
    assignee_id TEXT REFERENCES users(id),
    parent_task_id TEXT REFERENCES tasks(id),
    tags TEXT DEFAULT '[]',
    dependencies TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_positions (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    department TEXT,
    location TEXT,
    employment_type TEXT DEFAULT 'full_time',
    description TEXT,
    requirements TEXT,
    status TEXT DEFAULT 'open',
    priority TEXT DEFAULT 'medium',
    target_hire_count INTEGER DEFAULT 1,
    hired_count INTEGER DEFAULT 0,
    salary_min REAL,
    salary_max REAL,
    project_id TEXT NOT NULL REFERENCES projects(id),
    hiring_manager_id TEXT REFERENCES users(id),
    creator_id TEXT REFERENCES users(id),
    posting_date TEXT DEFAULT (datetime('now')),
    closing_date TEXT,
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS resumes (
    id TEXT PRIMARY KEY,
    candidate_name TEXT NOT NULL,
    candidate_email TEXT NOT NULL,
    candidate_phone TEXT,
    file_path TEXT,
    file_name TEXT,
    file_size INTEGER,
    file_type TEXT,
    status TEXT DEFAULT 'new',
    rating INTEGER,
    notes TEXT,
    source TEXT DEFAULT 'direct',
    job_position_id TEXT NOT NULL REFERENCES job_positions(id),
    recruiter_id TEXT REFERENCES users(id),
    skills TEXT DEFAULT '[]',
    experience TEXT DEFAULT '[]',
    education TEXT DEFAULT '[]',
    parsed_data TEXT DEFAULT '{}',
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS interviews (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    round_number INTEGER DEFAULT 1,
    interview_type TEXT DEFAULT 'technical',
    format TEXT DEFAULT 'onsite',
    description TEXT,
    notes TEXT,
    feedback TEXT,
    status TEXT DEFAULT 'scheduled',
    result TEXT,
    rating INTEGER,
    scheduled_start TEXT NOT NULL,
    scheduled_end TEXT NOT NULL,
    actual_start TEXT,
    actual_end TEXT,
    location TEXT,
    meeting_link TEXT,
    resume_id TEXT NOT NULL REFERENCES resumes(id),
    interviewer_id TEXT NOT NULL REFERENCES users(id),
    additional_interviewers TEXT DEFAULT '[]',
    tags TEXT DEFAULT '[]',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS llm_configs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    provider TEXT DEFAULT 'openai',
    api_key TEXT,
    base_url TEXT,
    model TEXT DEFAULT 'gpt-4',
    is_default INTEGER DEFAULT 0,
    is_active INTEGER DEFAULT 1,
    temperature TEXT DEFAULT '0.7',
    max_tokens INTEGER DEFAULT 2000,
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS task_comments (
    id TEXT PRIMARY KEY,
    content TEXT NOT NULL,
    task_id TEXT NOT NULL REFERENCES tasks(id),
    user_id TEXT NOT NULL REFERENCES users(id),
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS verification_codes (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS job_marketplace (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    requirements TEXT,
    department TEXT,
    location TEXT,
    employment_type TEXT DEFAULT 'full_time',
    urgency TEXT DEFAULT 'medium',
    target_hire_count INTEGER DEFAULT 1,
    current_filled INTEGER DEFAULT 0,
    project_id TEXT REFERENCES projects(id),
    project_name TEXT NOT NULL,
    creator_id TEXT NOT NULL REFERENCES users(id),
    creator_name TEXT NOT NULL,
    contact_info TEXT,
    status TEXT DEFAULT 'open',
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
  );
`);

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 初始化邮件服务
initTransporter(db);

// 文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, 'uploads', 'resumes');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, uuidv4() + path.extname(file.originalname));
  }
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

// JWT 认证中间件
function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ detail: '无效的认证凭证' });
  }
  try {
    const token = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.sub;
    next();
  } catch {
    return res.status(401).json({ detail: '无效的认证凭证' });
  }
}

// 辅助函数
function parseJSON(val, defaultVal) {
  try { return JSON.parse(val || JSON.stringify(defaultVal)); } catch { return defaultVal; }
}

// =========== 认证 API ===========
app.post('/api/v1/auth/register', (req, res) => {
  try {
    const { email, full_name, password } = req.body;
    if (!email || !full_name || !password || password.length < 8) {
      return res.status(400).json({ detail: '请提供有效的邮箱、姓名和密码（至少8位）' });
    }
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (existing) {
      return res.status(400).json({ detail: '该邮箱已被注册' });
    }
    const id = uuidv4();
    const hashed = bcrypt.hashSync(password, 10);
    db.prepare('INSERT INTO users (id, email, full_name, hashed_password) VALUES (?,?,?,?)').run(id, email, full_name, hashed);
    const token = jwt.sign({ sub: id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ access_token: token, token_type: 'bearer', user_id: id, email, full_name });
  } catch (e) {
    res.status(400).json({ detail: '注册失败，请检查邮箱是否已被使用' });
  }
});

app.post('/api/v1/auth/login', (req, res) => {
  try {
    const { username, password } = req.body;
    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(username);
    if (!user || !bcrypt.compareSync(password, user.hashed_password)) {
      return res.status(401).json({ detail: '邮箱或密码错误' });
    }
    const token = jwt.sign({ sub: user.id }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ access_token: token, token_type: 'bearer', user_id: user.id, email: user.email, full_name: user.full_name });
  } catch {
    res.status(401).json({ detail: '邮箱或密码错误' });
  }
});

// 发送密码重置验证码
app.post('/api/v1/auth/send-reset-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ detail: '请输入邮箱' });
    }
    const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (!user) {
      return res.status(404).json({ detail: '该邮箱未注册' });
    }
    // 清除该邮箱之前的验证码
    db.prepare('DELETE FROM verification_codes WHERE email = ?').run(email);
    // 生成新验证码（5分钟有效）
    const code = generateCode();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO verification_codes (id, email, code, expires_at) VALUES (?, ?, ?, ?)').run(uuidv4(), email, code, expiresAt);
    // 发送邮件
    const result = await sendVerificationEmail(email, code);
    if (result.dev) {
      res.json({ message: '邮件服务未配置，验证码仅在控制台输出', dev_code: result.code });
    } else {
      res.json({ message: '验证码已发送到您的邮箱' });
    }
  } catch (e) {
    console.error('发送验证码失败:', e);
    res.status(500).json({ detail: '发送验证码失败，请稍后重试' });
  }
});

// 密码重置（需验证码）
app.post('/api/v1/auth/reset-password', (req, res) => {
  try {
    const { email, code, new_password } = req.body;
    if (!email || !code || !new_password || new_password.length < 8) {
      return res.status(400).json({ detail: '请提供邮箱、验证码和新密码（至少8位）' });
    }
    // 验证验证码
    const record = db.prepare(`SELECT * FROM verification_codes WHERE email = ? AND code = ? AND used = 0`).get(email, code);
    if (!record) {
      return res.status(400).json({ detail: '验证码错误' });
    }
    if (new Date(record.expires_at) < new Date()) {
      return res.status(400).json({ detail: '验证码已过期，请重新获取' });
    }
    // 标记验证码已使用
    db.prepare('UPDATE verification_codes SET used = 1 WHERE id = ?').run(record.id);
    // 重置密码
    const hashed = bcrypt.hashSync(new_password, 10);
    db.prepare(`UPDATE users SET hashed_password = ?, updated_at = datetime('now') WHERE email = ?`).run(hashed, email);
    res.json({ message: '密码已重置，请使用新密码登录' });
  } catch (e) {
    console.error('密码重置失败:', e);
    res.status(500).json({ detail: '密码重置失败' });
  }
});

// =========== 系统设置 API（SMTP 邮件配置等） ===========
app.get('/api/v1/system/settings/smtp', authMiddleware, (req, res) => {
  const row = db.prepare("SELECT value FROM system_settings WHERE key = 'smtp_config'").get();
  if (row) {
    try {
      const config = JSON.parse(row.value);
      // 返回配置时隐藏密码
      return res.json({ ...config, pass: config.pass ? '******' : '', configured: true });
    } catch {
      return res.json({ configured: false });
    }
  }
  res.json({ configured: false });
});

app.put('/api/v1/system/settings/smtp', authMiddleware, (req, res) => {
  const { host, port, secure, user, pass } = req.body;
  if (!host || !user) {
    return res.status(400).json({ detail: 'SMTP 服务器地址和用户名不能为空' });
  }
  
  // 如果密码是 ******，说明没改，保留原密码
  let finalPass = pass;
  if (pass === '******') {
    const existing = db.prepare("SELECT value FROM system_settings WHERE key = 'smtp_config'").get();
    if (existing) {
      try {
        const old = JSON.parse(existing.value);
        finalPass = old.pass || '';
      } catch {}
    }
  }
  
  const config = { host, port: port || 587, secure: secure || false, user, pass: finalPass };
  
  // 测试连接
  try {
    const testTransporter = nodemailer.createTransport({
      host, port: port || 587, secure: secure || false,
      auth: { user, pass: finalPass },
    });
    testTransporter.verify(async (err) => {
      if (err) {
        return res.status(400).json({ detail: `SMTP 连接失败: ${err.message}` });
      }
      
      // 保存到数据库
      db.prepare(`INSERT OR REPLACE INTO system_settings (key, value, updated_at) VALUES ('smtp_config', ?, datetime('now'))`).run(JSON.stringify(config));
      
      // 更新运行时 transporter
      recreateTransporter(config);
      
      res.json({ message: 'SMTP 配置已保存并验证通过', configured: true });
    });
  } catch (e) {
    res.status(400).json({ detail: `SMTP 配置错误: ${e.message}` });
  }
});

app.delete('/api/v1/system/settings/smtp', authMiddleware, (req, res) => {
  db.prepare("DELETE FROM system_settings WHERE key = 'smtp_config'").run();
  recreateTransporter(null);
  res.json({ message: 'SMTP 配置已清除' });
});

// =========== 用户 API ===========
app.get('/api/v1/users/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, email, full_name, is_active, is_superuser, preferences, llm_provider, llm_model, created_at, updated_at FROM users WHERE id = ?').get(req.userId);
  if (!user) return res.status(404).json({ detail: '用户不存在' });
  res.json({ ...user, preferences: parseJSON(user.preferences, {}) });
});

app.put('/api/v1/users/me', authMiddleware, (req, res) => {
  const { full_name, llm_provider, llm_api_key, llm_base_url, llm_model } = req.body;
  const updates = [];
  const params = [];
  if (full_name !== undefined) { updates.push('full_name = ?'); params.push(full_name); }
  if (llm_provider !== undefined) { updates.push('llm_provider = ?'); params.push(llm_provider); }
  if (llm_api_key !== undefined) { updates.push('llm_api_key = ?'); params.push(llm_api_key); }
  if (llm_base_url !== undefined) { updates.push('llm_base_url = ?'); params.push(llm_base_url); }
  if (llm_model !== undefined) { updates.push('llm_model = ?'); params.push(llm_model); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.userId);
    db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const user = db.prepare('SELECT id, email, full_name, is_active, is_superuser, preferences, llm_provider, llm_model, created_at, updated_at FROM users WHERE id = ?').get(req.userId);
  res.json({ ...user, preferences: parseJSON(user.preferences, {}) });
});

// LLM 配置
app.get('/api/v1/users/me/llm-configs', authMiddleware, (req, res) => {
  const configs = db.prepare('SELECT * FROM llm_configs WHERE user_id = ? AND is_active = 1 ORDER BY is_default DESC, created_at DESC').all(req.userId);
  res.json(configs);
});

app.post('/api/v1/users/me/llm-configs', authMiddleware, (req, res) => {
  const { name, provider, api_key, base_url, model, is_default } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  if (is_default) {
    db.prepare('UPDATE llm_configs SET is_default = 0 WHERE user_id = ?').run(req.userId);
  }
  db.prepare('INSERT INTO llm_configs (id, name, provider, api_key, base_url, model, is_default, user_id, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?)').run(id, name || 'Default', provider || 'openai', api_key || null, base_url || null, model || 'gpt-4', is_default ? 1 : 0, req.userId, now, now);
  const config = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(id);
  res.json(config);
});

app.put('/api/v1/users/me/llm-configs/:id', authMiddleware, (req, res) => {
  const { is_default, provider, api_key, base_url, model, name } = req.body;
  if (is_default) {
    db.prepare('UPDATE llm_configs SET is_default = 0 WHERE user_id = ? AND id != ?').run(req.userId, req.params.id);
  }
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (provider !== undefined) { updates.push('provider = ?'); params.push(provider); }
  if (api_key !== undefined) { updates.push('api_key = ?'); params.push(api_key); }
  if (base_url !== undefined) { updates.push('base_url = ?'); params.push(base_url); }
  if (model !== undefined) { updates.push('model = ?'); params.push(model); }
  if (is_default !== undefined) { updates.push('is_default = ?'); params.push(is_default ? 1 : 0); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE llm_configs SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const config = db.prepare('SELECT * FROM llm_configs WHERE id = ?').get(req.params.id);
  res.json(config);
});

app.delete('/api/v1/users/me/llm-configs/:id', authMiddleware, (req, res) => {
  const config = db.prepare('SELECT * FROM llm_configs WHERE id = ? AND user_id = ?').get(req.params.id, req.userId);
  if (!config) return res.status(404).json({ detail: '配置不存在' });
  if (config.is_default) {
    const other = db.prepare('SELECT id FROM llm_configs WHERE user_id = ? AND id != ? AND is_active = 1 LIMIT 1').get(req.userId, req.params.id);
    if (other) db.prepare('UPDATE llm_configs SET is_default = 1 WHERE id = ?').run(other.id);
  }
  db.prepare('DELETE FROM llm_configs WHERE id = ?').run(req.params.id);
  res.json({ message: '配置已删除' });
});

// =========== 项目 API ===========
app.get('/api/v1/projects', authMiddleware, (req, res) => {
  const projects = db.prepare('SELECT * FROM projects WHERE owner_id = ? ORDER BY created_at DESC').all(req.userId);
  res.json(projects.map(p => ({ ...p, team_members: parseJSON(p.team_members, []), settings: parseJSON(p.settings, {}) })));
});

app.post('/api/v1/projects', authMiddleware, (req, res) => {
  const { name, description, status, progress, start_date, end_date, deadline, budget, team_members } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO projects (id, name, description, status, progress, start_date, end_date, deadline, budget, owner_id, team_members, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, name, description || null, status || 'planning', progress || 0, start_date || null, end_date || null, deadline || null, budget || null, req.userId, JSON.stringify(team_members || []), now, now
  );
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
  res.json({ ...project, team_members: parseJSON(project.team_members, []), settings: parseJSON(project.settings, {}) });
});

app.get('/api/v1/projects/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ detail: '项目不存在' });
  const owner = db.prepare('SELECT full_name FROM users WHERE id = ?').get(project.owner_id);
  const taskCount = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(req.params.id);
  res.json({
    ...project,
    team_members: parseJSON(project.team_members, []),
    settings: parseJSON(project.settings, {}),
    owner_name: owner?.full_name || null,
    team_member_names: [],
    stats: { total_tasks: taskCount.count, completed_tasks: 0, pending_tasks: taskCount.count, total_resources: 0, active_risks: 0, open_positions: 0, total_interviews: 0, budget_utilization: 0 }
  });
});

app.put('/api/v1/projects/:id', authMiddleware, (req, res) => {
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  if (!project) return res.status(404).json({ detail: '项目不存在' });
  const { name, description, status, progress, start_date, end_date, deadline, budget, actual_cost, team_members } = req.body;
  const updates = [];
  const params = [];
  if (name !== undefined) { updates.push('name = ?'); params.push(name); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (progress !== undefined) { updates.push('progress = ?'); params.push(progress); }
  if (start_date !== undefined) { updates.push('start_date = ?'); params.push(start_date); }
  if (end_date !== undefined) { updates.push('end_date = ?'); params.push(end_date); }
  if (deadline !== undefined) { updates.push('deadline = ?'); params.push(deadline); }
  if (budget !== undefined) { updates.push('budget = ?'); params.push(budget); }
  if (actual_cost !== undefined) { updates.push('actual_cost = ?'); params.push(actual_cost); }
  if (team_members !== undefined) { updates.push('team_members = ?'); params.push(JSON.stringify(team_members)); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE projects SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare('SELECT * FROM projects WHERE id = ?').get(req.params.id);
  res.json({ ...updated, team_members: parseJSON(updated.team_members, []), settings: parseJSON(updated.settings, {}) });
});

app.delete('/api/v1/projects/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM projects WHERE id = ?').run(req.params.id);
  res.json({ message: '项目已删除' });
});

app.get('/api/v1/projects/:id/stats', authMiddleware, (req, res) => {
  const tasks = db.prepare('SELECT COUNT(*) as count FROM tasks WHERE project_id = ?').get(req.params.id);
  res.json({ total_tasks: tasks.count, completed_tasks: 0, pending_tasks: tasks.count, total_resources: 0, active_risks: 0, open_positions: 0, total_interviews: 0, budget_utilization: 0 });
});

app.get('/api/v1/projects/:id/task-stats', authMiddleware, (req, res) => {
  const tasks = db.prepare('SELECT status, priority, COUNT(*) as count FROM tasks WHERE project_id = ? GROUP BY status, priority').all(req.params.id);
  const result = { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, cancelled: 0, overdue: 0, high_priority: 0, total_estimated_hours: 0, total_actual_hours: 0 };
  tasks.forEach(t => {
    result.total += t.count;
    if (result[t.status] !== undefined) result[t.status] += t.count;
    if (t.priority === 'high' || t.priority === 'critical') result.high_priority += t.count;
  });
  res.json(result);
});

app.get('/api/v1/projects/:id/hiring-stats', authMiddleware, (req, res) => {
  res.json({ position_stats: { total_positions: 0, open_positions: 0, closed_positions: 0, urgent_positions: 0, total_target_hires: 0, total_hired: 0, hiring_rate: 0, avg_time_to_fill: null }, applicant_stats: { total_applicants: 0, new_applicants: 0, screening: 0, interview: 0, offer: 0, hired: 0, rejected: 0, conversion_rate: 0 } });
});

app.get('/api/v1/projects/search/', authMiddleware, (req, res) => {
  const { keyword } = req.query;
  const projects = db.prepare('SELECT * FROM projects WHERE (name LIKE ? OR description LIKE ?) AND owner_id = ?').all(`%${keyword}%`, `%${keyword}%`, req.userId);
  res.json(projects.map(p => ({ ...p, team_members: parseJSON(p.team_members, []), settings: parseJSON(p.settings, {}) })));
});

// =========== 任务 API ===========
app.get('/api/v1/tasks', authMiddleware, (req, res) => {
  const { project_id, limit } = req.query;
  let query = 'SELECT * FROM tasks';
  const params = [];
  if (project_id) { query += ' WHERE project_id = ?'; params.push(project_id); }
  query += ' ORDER BY created_at DESC';
  if (limit) { query += ' LIMIT ?'; params.push(parseInt(limit)); }
  const tasks = db.prepare(query).all(...params);
  res.json(tasks.map(t => ({ ...t, tags: parseJSON(t.tags, []), dependencies: parseJSON(t.dependencies, []) })));
});

app.post('/api/v1/tasks', authMiddleware, (req, res) => {
  const { title, description, status, priority, due_date, project_id, assignee_id, parent_task_id, tags, estimated_hours } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO tasks (id, title, description, status, priority, due_date, project_id, assignee_id, parent_task_id, tags, estimated_hours, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, title, description || null, status || 'todo', priority || 'medium', due_date || null, project_id, assignee_id || null, parent_task_id || null, JSON.stringify(tags || []), estimated_hours || null, now, now
  );
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  res.json({ ...task, tags: parseJSON(task.tags, []), dependencies: parseJSON(task.dependencies, []) });
});

app.get('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ detail: '任务不存在' });
  res.json({ ...task, tags: parseJSON(task.tags, []), dependencies: parseJSON(task.dependencies, []) });
});

app.put('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  if (!task) return res.status(404).json({ detail: '任务不存在' });
  const { title, description, status, priority, due_date, progress, assignee_id, tags } = req.body;
  const updates = [];
  const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (due_date !== undefined) { updates.push('due_date = ?'); params.push(due_date); }
  if (progress !== undefined) { updates.push('progress = ?'); params.push(progress); }
  if (assignee_id !== undefined) { updates.push('assignee_id = ?'); params.push(assignee_id); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: parseJSON(updated.tags, []), dependencies: parseJSON(updated.dependencies, []) });
});

app.delete('/api/v1/tasks/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
  res.json({ message: '任务已删除' });
});

// 任务评论
app.get('/api/v1/tasks/:id/comments', authMiddleware, (req, res) => {
  const comments = db.prepare('SELECT tc.*, u.full_name as user_name, u.email as user_email FROM task_comments tc JOIN users u ON tc.user_id = u.id WHERE tc.task_id = ? ORDER BY tc.created_at DESC').all(req.params.id);
  res.json(comments);
});

app.post('/api/v1/tasks/:id/comments', authMiddleware, (req, res) => {
  const { content } = req.body;
  const id = uuidv4();
  db.prepare('INSERT INTO task_comments (id, content, task_id, user_id) VALUES (?,?,?,?)').run(id, content, req.params.id, req.userId);
  const comment = db.prepare('SELECT * FROM task_comments WHERE id = ?').get(id);
  const user = db.prepare('SELECT full_name, email FROM users WHERE id = ?').get(req.userId);
  res.json({ ...comment, user_name: user?.full_name, user_email: user?.email });
});

// =========== 招聘岗位 API ===========
app.get('/api/v1/job-positions', authMiddleware, (req, res) => {
  const { project_id, limit } = req.query;
  let q = 'SELECT * FROM job_positions';
  const params = [];
  if (project_id) { q += ' WHERE project_id = ?'; params.push(project_id); }
  q += ' ORDER BY created_at DESC';
  if (limit) { q += ' LIMIT ?'; params.push(parseInt(limit)); }
  const positions = db.prepare(q).all(...params);
  res.json(positions.map(p => ({ ...p, tags: parseJSON(p.tags, []) })));
});

app.post('/api/v1/job-positions', authMiddleware, (req, res) => {
  const { title, description, requirements, department, location, employment_type, status, priority, target_hire_count, project_id, hiring_manager_id } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO job_positions (id, title, description, requirements, department, location, employment_type, status, priority, target_hire_count, project_id, hiring_manager_id, creator_id, posting_date, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, title, description || null, requirements || null, department || null, location || null, employment_type || 'full_time', status || 'open', priority || 'medium', target_hire_count || 1, project_id, hiring_manager_id || null, req.userId, now, now, now
  );
  const pos = db.prepare('SELECT * FROM job_positions WHERE id = ?').get(id);
  res.json({ ...pos, tags: parseJSON(pos.tags, []) });
});

app.get('/api/v1/job-positions/:id', authMiddleware, (req, res) => {
  const pos = db.prepare('SELECT * FROM job_positions WHERE id = ?').get(req.params.id);
  if (!pos) return res.status(404).json({ detail: '岗位不存在' });
  const project = db.prepare('SELECT name FROM projects WHERE id = ?').get(pos.project_id);
  const resumes = db.prepare('SELECT COUNT(*) as count FROM resumes WHERE job_position_id = ?').get(req.params.id);
  res.json({ ...pos, tags: parseJSON(pos.tags, []), project_name: project?.name || null, total_resumes: resumes.count, new_resumes: 0, interview_count: 0, offer_count: 0, hired_percentage: 0, hiring_manager_name: null, creator_name: null });
});

app.put('/api/v1/job-positions/:id', authMiddleware, (req, res) => {
  const pos = db.prepare('SELECT * FROM job_positions WHERE id = ?').get(req.params.id);
  if (!pos) return res.status(404).json({ detail: '岗位不存在' });
  const { title, description, requirements, department, location, status, priority, target_hire_count } = req.body;
  const updates = [];
  const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (requirements !== undefined) { updates.push('requirements = ?'); params.push(requirements); }
  if (department !== undefined) { updates.push('department = ?'); params.push(department); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (priority !== undefined) { updates.push('priority = ?'); params.push(priority); }
  if (target_hire_count !== undefined) { updates.push('target_hire_count = ?'); params.push(target_hire_count); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE job_positions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare('SELECT * FROM job_positions WHERE id = ?').get(req.params.id);
  res.json({ ...updated, tags: parseJSON(updated.tags, []) });
});

app.delete('/api/v1/job-positions/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM job_positions WHERE id = ?').run(req.params.id);
  res.json({ message: '岗位已删除' });
});

app.get('/api/v1/job-positions/:id/resumes', authMiddleware, (req, res) => {
  const resumes = db.prepare('SELECT * FROM resumes WHERE job_position_id = ? ORDER BY created_at DESC').all(req.params.id);
  res.json(resumes.map(r => ({ ...r, skills: parseJSON(r.skills, []), experience: parseJSON(r.experience, []), education: parseJSON(r.education, []), parsed_data: parseJSON(r.parsed_data, {}), tags: parseJSON(r.tags, []) })));
});

// =========== 简历 API ===========
app.get('/api/v1/resumes', authMiddleware, (req, res) => {
  const { job_position_id, status, limit } = req.query;
  let q = 'SELECT * FROM resumes WHERE 1=1';
  const params = [];
  if (job_position_id) { q += ' AND job_position_id = ?'; params.push(job_position_id); }
  if (status) { q += ' AND status = ?'; params.push(status); }
  q += ' ORDER BY created_at DESC';
  if (limit) { q += ' LIMIT ?'; params.push(parseInt(limit)); }
  const resumes = db.prepare(q).all(...params);
  res.json(resumes.map(r => ({ ...r, skills: parseJSON(r.skills, []), experience: parseJSON(r.experience, []), education: parseJSON(r.education, []), parsed_data: parseJSON(r.parsed_data, {}), tags: parseJSON(r.tags, []) })));
});

app.post('/api/v1/resumes/upload', authMiddleware, upload.single('file'), (req, res) => {
  const { candidate_name, candidate_email, candidate_phone, job_position_id, source } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO resumes (id, candidate_name, candidate_email, candidate_phone, job_position_id, source, recruiter_id, file_path, file_name, file_size, file_type, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, candidate_name, candidate_email, candidate_phone || null, job_position_id, source || 'direct', req.userId, req.file?.path || '', req.file?.originalname || '', req.file?.size || 0, req.file?.mimetype || null, now, now
  );
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(id);
  res.json({ ...resume, skills: parseJSON(resume.skills, []), experience: parseJSON(resume.experience, []), education: parseJSON(resume.education, []), parsed_data: parseJSON(resume.parsed_data, {}), tags: parseJSON(resume.tags, []) });
});

app.get('/api/v1/resumes/:id', authMiddleware, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);
  if (!resume) return res.status(404).json({ detail: '简历不存在' });
  const pos = db.prepare('SELECT title FROM job_positions WHERE id = ?').get(resume.job_position_id);
  res.json({ ...resume, skills: parseJSON(resume.skills, []), experience: parseJSON(resume.experience, []), education: parseJSON(resume.education, []), parsed_data: parseJSON(resume.parsed_data, {}), tags: parseJSON(resume.tags, []), job_position_title: pos?.title || null, recruiter_name: null, interview_count: 0, latest_interview_date: null, latest_interview_result: null });
});

app.put('/api/v1/resumes/:id', authMiddleware, (req, res) => {
  const resume = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);
  if (!resume) return res.status(404).json({ detail: '简历不存在' });
  const { candidate_name, candidate_email, candidate_phone, status, rating, notes, tags } = req.body;
  const updates = [];
  const params = [];
  if (candidate_name !== undefined) { updates.push('candidate_name = ?'); params.push(candidate_name); }
  if (candidate_email !== undefined) { updates.push('candidate_email = ?'); params.push(candidate_email); }
  if (candidate_phone !== undefined) { updates.push('candidate_phone = ?'); params.push(candidate_phone); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  if (tags !== undefined) { updates.push('tags = ?'); params.push(JSON.stringify(tags)); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE resumes SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare('SELECT * FROM resumes WHERE id = ?').get(req.params.id);
  res.json({ ...updated, skills: parseJSON(updated.skills, []), experience: parseJSON(updated.experience, []), education: parseJSON(updated.education, []), parsed_data: parseJSON(updated.parsed_data, {}), tags: parseJSON(updated.tags, []) });
});

// =========== 面试 API ===========
app.get('/api/v1/interviews', authMiddleware, (req, res) => {
  const { resume_id, status, interviewer_id, limit } = req.query;
  let q = 'SELECT * FROM interviews WHERE 1=1';
  const params = [];
  if (resume_id) { q += ' AND resume_id = ?'; params.push(resume_id); }
  if (status) { q += ' AND status = ?'; params.push(status); }
  if (interviewer_id) { q += ' AND interviewer_id = ?'; params.push(interviewer_id); }
  q += ' ORDER BY scheduled_start DESC';
  if (limit) { q += ' LIMIT ?'; params.push(parseInt(limit)); }
  const interviews = db.prepare(q).all(...params);
  res.json(interviews.map(i => ({ ...i, additional_interviewers: parseJSON(i.additional_interviewers, []), tags: parseJSON(i.tags, []) })));
});

app.post('/api/v1/interviews', authMiddleware, (req, res) => {
  const { title, resume_id, interviewer_id, scheduled_start, scheduled_end, interview_type, format, location, meeting_link, round_number } = req.body;
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare('INSERT INTO interviews (id, title, resume_id, interviewer_id, scheduled_start, scheduled_end, interview_type, format, location, meeting_link, round_number, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)').run(
    id, title, resume_id, interviewer_id, scheduled_start, scheduled_end, interview_type || 'technical', format || 'onsite', location || null, meeting_link || null, round_number || 1, now, now
  );
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(id);
  res.json({ ...interview, additional_interviewers: parseJSON(interview.additional_interviewers, []), tags: parseJSON(interview.tags, []) });
});

app.put('/api/v1/interviews/:id', authMiddleware, (req, res) => {
  const interview = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  if (!interview) return res.status(404).json({ detail: '面试不存在' });
  const { status, result, rating, feedback, location, meeting_link } = req.body;
  const updates = [];
  const params = [];
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (result !== undefined) { updates.push('result = ?'); params.push(result); }
  if (rating !== undefined) { updates.push('rating = ?'); params.push(rating); }
  if (feedback !== undefined) { updates.push('feedback = ?'); params.push(feedback); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (meeting_link !== undefined) { updates.push('meeting_link = ?'); params.push(meeting_link); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE interviews SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare('SELECT * FROM interviews WHERE id = ?').get(req.params.id);
  res.json({ ...updated, additional_interviewers: parseJSON(updated.additional_interviewers, []), tags: parseJSON(updated.tags, []) });
});

// =========== AI 智能体 API ===========
app.post('/api/v1/ai-agent/chat', authMiddleware, async (req, res) => {
  const { message, context } = req.body;
  
  // 获取用户的 LLM 配置
  const config = db.prepare('SELECT * FROM llm_configs WHERE user_id = ? AND is_default = 1 AND is_active = 1').get(req.userId)
    || db.prepare('SELECT * FROM llm_configs WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.userId);
  
  if (!config || !config.api_key) {
    return res.json({ response: '请先在【设置 > LLM配置】中添加你的 API 密钥。支持 OpenAI、Anthropic 等提供商。' });
  }

  try {
    const apiUrl = config.base_url || 'https://api.openai.com/v1';
    const fetchUrl = `${apiUrl}/chat/completions`;
    
    const response = await fetch(fetchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.api_key}`
      },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [
          { role: 'system', content: '你是一个专业的项目管理智能助手。你可以帮助用户分析项目状态、提供任务管理建议、识别风险、优化资源分配、提供招聘建议和生成项目报告。请用专业、友好的语气回答，使用中文。' },
          { role: 'user', content: context ? `上下文:\n${JSON.stringify(context)}\n\n问题: ${message}` : message }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    const data = await response.json();
    if (data.error) {
      return res.json({ response: `AI 调用失败: ${data.error.message}` });
    }
    res.json({ response: data.choices[0].message.content });
  } catch (e) {
    res.json({ response: `AI 服务暂时不可用: ${e.message}。请检查 API 密钥和网络连接。` });
  }
});

app.post('/api/v1/ai-agent/generate-report', authMiddleware, async (req, res) => {
  const { project_id, report_type } = req.body;
  const project = db.prepare('SELECT * FROM projects WHERE id = ?').get(project_id);
  if (!project) return res.status(404).json({ detail: '项目不存在' });

  const config = db.prepare('SELECT * FROM llm_configs WHERE user_id = ? AND is_default = 1 AND is_active = 1').get(req.userId)
    || db.prepare('SELECT * FROM llm_configs WHERE user_id = ? AND is_active = 1 LIMIT 1').get(req.userId);
  
  if (!config || !config.api_key) {
    return res.json({ report_type, content: '请先在【设置 > LLM配置】中添加你的 API 密钥。' });
  }

  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE project_id = ?').all(project_id);
    const apiUrl = config.base_url || 'https://api.openai.com/v1';
    const response = await fetch(`${apiUrl}/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${config.api_key}` },
      body: JSON.stringify({
        model: config.model || 'gpt-4',
        messages: [
          { role: 'system', content: '你是专业的项目管理助手，请根据项目数据生成一份结构化的项目报告（Markdown格式）。' },
          { role: 'user', content: `请生成一份${report_type}项目报告。\n项目: ${project.name}, 状态: ${project.status}, 进度: ${project.progress}%\n任务数: ${tasks.length}, 预算: ${project.budget}\n请包含: 1.概览 2.进度 3.风险 4.建议` }
        ],
        temperature: 0.7, max_tokens: 2000
      })
    });
    const data = await response.json();
    res.json({ report_type, content: data.choices[0].message.content });
  } catch (e) {
    res.json({ report_type, content: `报告生成失败: ${e.message}` });
  }
});

// =========== 岗位需求广场 API ===========
// 获取广场列表（所有用户可见，不限制项目）
app.get('/api/v1/marketplace', authMiddleware, (req, res) => {
  const { status, urgency, department, employment_type, search } = req.query;
  let q = `SELECT jm.*, u.full_name as creator_name 
           FROM job_marketplace jm 
           JOIN users u ON jm.creator_id = u.id 
           WHERE 1=1`;
  const params = [];
  if (status) { q += ' AND jm.status = ?'; params.push(status); }
  if (urgency) { q += ' AND jm.urgency = ?'; params.push(urgency); }
  if (department) { q += ' AND jm.department = ?'; params.push(department); }
  if (employment_type) { q += ' AND jm.employment_type = ?'; params.push(employment_type); }
  if (search) { q += ' AND (jm.title LIKE ? OR jm.description LIKE ? OR jm.requirements LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
  q += ' ORDER BY jm.urgency = "high" DESC, jm.created_at DESC';
  const items = db.prepare(q).all(...params);
  res.json(items);
});

// 获取广场统计
app.get('/api/v1/marketplace/stats', authMiddleware, (req, res) => {
  const total = db.prepare('SELECT COUNT(*) as count FROM job_marketplace').get();
  const open = db.prepare('SELECT COUNT(*) as count FROM job_marketplace WHERE status = "open"').get();
  const urgent = db.prepare('SELECT COUNT(*) as count FROM job_marketplace WHERE urgency = "high" AND status = "open"').get();
  const totalPositions = db.prepare('SELECT SUM(target_hire_count) as sum FROM job_marketplace WHERE status = "open"').get();
  const totalFilled = db.prepare('SELECT SUM(current_filled) as sum FROM job_marketplace WHERE status = "open"').get();
  const departments = db.prepare('SELECT DISTINCT department FROM job_marketplace WHERE department IS NOT NULL AND department != ""').all().map(r => r.department);
  res.json({
    total: total.count,
    open: open.count,
    urgent: urgent.count,
    total_positions: totalPositions.sum || 0,
    total_filled: totalFilled.sum || 0,
    departments,
  });
});

// 发布岗位需求
app.post('/api/v1/marketplace', authMiddleware, (req, res) => {
  const { title, description, requirements, department, location, employment_type, urgency, target_hire_count, project_id, project_name, contact_info } = req.body;
  if (!title || !project_name) {
    return res.status(400).json({ detail: '岗位名称和项目名称不能为空' });
  }
  const user = db.prepare('SELECT full_name FROM users WHERE id = ?').get(req.userId);
  const id = uuidv4();
  const now = new Date().toISOString();
  db.prepare(`INSERT INTO job_marketplace (id, title, description, requirements, department, location, employment_type, urgency, target_hire_count, current_filled, project_id, project_name, creator_id, creator_name, contact_info, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(
    id, title, description || null, requirements || null, department || null, location || null,
    employment_type || 'full_time', urgency || 'medium', target_hire_count || 1, 0,
    project_id || null, project_name, req.userId, user.full_name, contact_info || null, 'open', now, now
  );
  const item = db.prepare(`SELECT jm.*, u.full_name as creator_name FROM job_marketplace jm JOIN users u ON jm.creator_id = u.id WHERE jm.id = ?`).get(id);
  res.json(item);
});

// 获取单个岗位需求
app.get('/api/v1/marketplace/:id', authMiddleware, (req, res) => {
  const item = db.prepare(`SELECT jm.*, u.full_name as creator_name FROM job_marketplace jm JOIN users u ON jm.creator_id = u.id WHERE jm.id = ?`).get(req.params.id);
  if (!item) return res.status(404).json({ detail: '岗位需求不存在' });
  res.json(item);
});

// 更新岗位需求
app.put('/api/v1/marketplace/:id', authMiddleware, (req, res) => {
  const item = db.prepare('SELECT * FROM job_marketplace WHERE id = ?').get(req.params.id);
  if (!item) return res.status(404).json({ detail: '岗位需求不存在' });
  const { title, description, requirements, department, location, employment_type, urgency, target_hire_count, current_filled, contact_info, status } = req.body;
  const updates = [];
  const params = [];
  if (title !== undefined) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (requirements !== undefined) { updates.push('requirements = ?'); params.push(requirements); }
  if (department !== undefined) { updates.push('department = ?'); params.push(department); }
  if (location !== undefined) { updates.push('location = ?'); params.push(location); }
  if (employment_type !== undefined) { updates.push('employment_type = ?'); params.push(employment_type); }
  if (urgency !== undefined) { updates.push('urgency = ?'); params.push(urgency); }
  if (target_hire_count !== undefined) { updates.push('target_hire_count = ?'); params.push(target_hire_count); }
  if (current_filled !== undefined) { updates.push('current_filled = ?'); params.push(current_filled); }
  if (contact_info !== undefined) { updates.push('contact_info = ?'); params.push(contact_info); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (updates.length > 0) {
    updates.push(`updated_at = datetime('now')`);
    params.push(req.params.id);
    db.prepare(`UPDATE job_marketplace SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  const updated = db.prepare(`SELECT jm.*, u.full_name as creator_name FROM job_marketplace jm JOIN users u ON jm.creator_id = u.id WHERE jm.id = ?`).get(req.params.id);
  res.json(updated);
});

// 删除岗位需求
app.delete('/api/v1/marketplace/:id', authMiddleware, (req, res) => {
  db.prepare('DELETE FROM job_marketplace WHERE id = ?').run(req.params.id);
  res.json({ message: '已删除' });
});

// 健康检查
app.get('/health', (req, res) => {
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
  res.json({ status: 'healthy', version: '1.0.0', users: userCount.count });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Backend running at http://0.0.0.0:${PORT}`);
  console.log(`API docs: http://0.0.0.0:${PORT}/api/v1/`);
});