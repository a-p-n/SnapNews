const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const cors = require('cors');

const app = express();
const PORT = 8000;

app.use(cors());
app.use(express.json());

mongoose.connect('mongodb://localhost:27017/snapnews_auth', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const userSchema = new mongoose.Schema({
    fullName: String,
    email: { type: String, unique: true },
    username: { type: String, unique: true },
    passwordHash: String,
});

const User = mongoose.model('User', userSchema);

app.post('/auth/signup', async (req, res) => {
    const { fullName, email, username, password } = req.body;

    if (!fullName || !email || !username || !password) {
        return res.json({ success: false, error: 'All fields are required' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            return res.json({ success: false, error: 'Email or username already in use' });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const newUser = new User({ fullName, email, username, passwordHash });
        await newUser.save();

        res.json({ success: true });
    } catch (err) {
        console.error('Signup error:', err);
        res.json({ success: false, error: 'Error creating user' });
    }
});

app.post('/auth/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.json({ success: false, error: 'Missing fields' });
        }

        const user = await User.findOne({ username });

        if (!user) {
            return res.json({ success: false, error: 'Invalid username or password' });
        }

        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.json({ success: false, error: 'Invalid username or password' });
        }

        res.json({ success: true, username: user.username });

    } catch (err) {
        console.error('Login error:', err);
        res.json({ success: false, error: 'Server error' });
    }
});

app.listen(PORT, () => {
    console.log(`Auth server running at http://localhost:${PORT}`);
});
