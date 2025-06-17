document.addEventListener('DOMContentLoaded', function() {
    const chatMessages = document.getElementById('chatMessages');
    const userInput = document.getElementById('userInput');
    const sendButton = document.getElementById('sendButton');
    
    // Send message when button is clicked
    sendButton.addEventListener('click', sendMessage);
    
    // Send message when Enter key is pressed
    userInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            sendMessage();
        }
    });
    
    async function sendMessage() {
        const message = userInput.value.trim();
        if (message === '') return;
        
        // Add user message to chat
        addMessage(message, 'user');
        userInput.value = '';
        
        // Show loading indicator
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