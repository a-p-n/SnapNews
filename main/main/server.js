const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the 'public' directory
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/auth', createProxyMiddleware({
    target: 'http://localhost:8000',
    changeOrigin: true,
    pathRewrite: { '^/api/auth': '/auth' },
}));

// Proxy API requests to FastAPI server
// app.use('/api', createProxyMiddleware({
//     target: 'http://localhost:8000',
//     changeOrigin: true,
//     pathRewrite: { '^/api': '' }
// }));

app.get('/', (req, res) => {
    res.redirect('/signup');
});

app.get('/signup', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'signup.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/home', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'home.html'));
});

app.get('/chatbot', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'chatbot.html'));
});

app.listen(PORT, () => {
    console.log(`Node.js server running on http://localhost:${PORT}`);
});

const app1 = express();
const PORT1 = 8000;

app1.use(cors());
app1.use(express.json());

// Connect to MongoDB (adjust URI if needed)
mongoose.connect('mongodb://localhost:27017/snapnews_auth', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

// Define User Schema
const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    passwordHash: String,
});

const User = mongoose.model('User', userSchema);

// Sign-up Route
app1.post('/auth/signup', async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
        return res.json({ success: false, error: 'All fields are required' });
    }

    try {
        // Check for existing user
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.json({ success: false, error: 'Email or username already in use' });
        }

        // Hash password
        const passwordHash = await bcrypt.hash(password, 10);

        // Create and save new user
        const newUser = new User({ fullName, email, username, passwordHash });
        await newUser.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Signup error:', err);
        res.json({ success: false, error: 'Error creating user' });
    }
});

// Login Route
app1.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, error: 'Missing fields' });
        }

        // Find user by username
        const user = await User.findOne({ username });

        if (!user) {
            return res.json({ success: false, error: 'Invalid username or password' });
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.json({ success: false, error: 'Invalid username or password' });
        }

        // Success - send username back
        res.json({ success: true, username: user.username });

    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, error: 'Server error' });
    }
});

// Start server
app1.listen(PORT1, () => {
    console.log(`Auth server running at http://localhost:${PORT1}`);
});
