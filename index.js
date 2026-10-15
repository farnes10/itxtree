require('@dotenvx/dotenvx').config()
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const nodemailer = require('nodemailer');
const { MailtrapTransport } = require("mailtrap");

const TOKEN = process.env.api_token;
const app = express();
const PORT = process.env.PORT || 3000;

const sender = {
  address: process.env.EMAIL_SENDER || "hello@demomailtrap.co",
  name: "ITXTREE",
};
const recipients = [
  process.env.EMAIL_RECIEVER || "contact.itxtree@gmail.com",
];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API Routes

// --- Contacts ---
app.post('/api/contact', async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !message) {
    return res.status(400).json({ error: 'Name, email, and message are required.' });
  }

  // Configuration Nodemailer
  try {
    const transporter = nodemailer.createTransport(MailtrapTransport({
      token: TOKEN,
    })
    );

    const mailOptions = {
      from: sender, // L'expéditeur doit être authentifié pour éviter le spam
      to: recipients, // Adresse de réception
      subject: subject ? `Nouveau contact depuis le site : ${subject}` : `Nouveau contact de ${name}`,
      text: `Nom: ${name}\nEmail: ${email}\nSujet: ${subject}\n\nMessage:\n${message}`,
      html: `<p>Nouveau message via le formulaire de contact.</p>
             <p><strong>Nom :</strong> ${name}</p>
             <p><strong>Email :</strong> ${email}</p>
             <p><strong>Sujet :</strong> ${subject}</p>
             <p><strong>Message :</strong><br/>${message.replace(/\n/g, '<br/>')}</p>`
    };

    if (process.env.EMAIL_SENDER) {
      await transporter.sendMail(mailOptions);
      console.log('Email envoyé avec succès.');
    } else {
      console.warn('⚠️ SMTP_USER et SMTP_PASS ne sont pas définis dans le fichier .env. L\'email n\'a pas été envoyé.');
    }
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email :', error);
  }

  const sql = `INSERT INTO contacts (name, email, subject, message) VALUES (?, ?, ?, ?)`;
  db.run(sql, [name, email, subject, message], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to save contact message.' });
    }
    res.status(201).json({ success: true, id: this.lastID, message: 'Message sent successfully.' });
  });
});

// --- Projects ---
app.get('/api/projects', (req, res) => {
  const sql = `SELECT * FROM projects ORDER BY created_at DESC`;
  db.all(sql, [], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to retrieve projects.' });
    }
    res.json(rows);
  });
});

app.post('/api/projects', (req, res) => {
  const { category, title, description, stack, thumb_type, thumb_content } = req.body;
  
  if (!category || !title || !description || !stack) {
    return res.status(400).json({ error: 'Category, title, description, and stack are required.' });
  }

  const sql = `INSERT INTO projects (category, title, description, stack, thumb_type, thumb_content) 
               VALUES (?, ?, ?, ?, ?, ?)`;
  
  // Default values if not provided
  const tType = thumb_type || 'svg';
  const tContent = thumb_content || '<svg viewBox="0 0 24 24" fill="none" stroke="var(--blue)"><path d="M3 5h18v14H3z" stroke-width="1.4"/><path d="M3 9h18" stroke-width="1.4"/></svg>';

  db.run(sql, [category, title, description, stack, tType, tContent], function(err) {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: 'Failed to add project.' });
    }
    res.status(201).json({ success: true, id: this.lastID, message: 'Project added successfully.' });
  });
});

// Fallback for SPA or unknown routes
app.get(/(.*)/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
