const express = require('express');
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