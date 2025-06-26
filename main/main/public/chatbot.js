document.getElementById('snapnews').addEventListener('click', function () {
    window.location.href = '/home';
});
function toggleDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}
window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username') || "User";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4361ee&color=fff`;

    document.querySelectorAll('#user-name').forEach(el => el.textContent = username);
    document.querySelectorAll('#user-avatar').forEach(el => el.src = avatarUrl);
});
document.addEventListener('click', function (e) {
    const menu = document.querySelector('.user-menu');
    const dropdown = document.getElementById("userDropdown");
    if (!menu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    
    sendButton.addEventListener('click', sendMessage);
    
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        addMessage(message, 'user');
        userInput.value = '';
        
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'bot-message';
        loadingDiv.innerHTML = `
            <div class="message-content">
                <p><i class="fas fa-spinner fa-spin"></i> Thinking...</p>
            </div>
        `;
        chatMessages.appendChild(loadingDiv);

        try {
            const response = await getBotResponse(message);
            // Remove loading indicator
            chatMessages.removeChild(loadingDiv);
            // Add bot response
            addMessage(response, 'bot');
        } catch (error) {
            // Remove loading indicator
            chatMessages.removeChild(loadingDiv);
            // Add error message
            addMessage("Sorry, I encountered an error. Please try again.", 'bot');
            console.error('Error:', error);
        }
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    function addMessage(text, sender) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `${sender}-message`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'message-content';
        contentDiv.innerHTML = `<p>${text}</p>`;
        
        messageDiv.appendChild(contentDiv);
        chatMessages.appendChild(messageDiv);
        
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
    
    async function getBotResponse(userMessage) {
        try {
            const response = await fetch('http://localhost:8000/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    question: userMessage,
                    top_k: 6
                })
            });

            if (!response.ok) {
                throw new Error('Network response was not ok');
            }

            const data = await response.json();
            return data.answer;
        } catch (error) {
            console.error('Error:', error);
            throw error;
        }
    }
});