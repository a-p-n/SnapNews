
document.getElementById('snapnews').addEventListener('click', function() {
    window.location.href = '/home';
});

function toggleDropdown() {
    const dropdown = document.getElementById("userDropdown");
    dropdown.style.display = dropdown.style.display === "flex" ? "none" : "flex";
}

document.addEventListener('click', function (e) {
    const menu = document.querySelector('.user-menu');
    const dropdown = document.getElementById("userDropdown");
    if (!menu.contains(e.target)) {
        dropdown.style.display = 'none';
    }
});

document.addEventListener('DOMContentLoaded', function () {
    const dateFilter = document.querySelector('.date-filter select');
    if (dateFilter) {
        dateFilter.addEventListener('change', function () {
            alert(`Loading news for ${this.value}`);
        });
    }

    const loadMoreBtn = document.querySelector('.load-more button');
    if (loadMoreBtn) {
        loadMoreBtn.addEventListener('click', function () {
            alert('Loading more news articles...');
        });
    }
});

window.addEventListener('DOMContentLoaded', () => {
    const username = localStorage.getItem('username') || "User";
    const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=4361ee&color=fff`;

    document.querySelectorAll('#user-name').forEach(el => el.textContent = username);
    document.querySelectorAll('#user-avatar').forEach(el => el.src = avatarUrl);
});

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.news-cards');
    const updateBtn = document.getElementById('updateNewsBtn');

    function renderCard(article) {
        const card = document.createElement('div');
        card.className = 'news-card';
        card.innerHTML = `
        <div class="card-header">
          <span class="category">${article.Source}</span>
          <span class="time">${new Date(article.Timestamp).toLocaleTimeString()}</span>
        </div>
        <h3>${article.Title}</h3>
        <p class="summary">${article.Summary}</p>
        <div class="card-footer">
          <a href="${article.Link}" target="_blank"><i class="fas fa-external-link-alt"></i> Read More</a>
        </div>`;
        container.appendChild(card);
    }

    async function loadNews() {
        container.innerHTML = '';
        try {
            const username = localStorage.getItem("username");
            const res = await fetch(`http://localhost:8000/news?username=${encodeURIComponent(username)}`);//hard
            const articles = await res.json();
            articles.forEach(renderCard);
        } catch (e) {
            console.error('Error loading news:', e);
            container.innerHTML = '<p>Failed to load news.</p>';
        }
    }
    loadNews();
    updateBtn.addEventListener('click', async () => {
        updateBtn.disabled = true;
        updateBtn.textContent = 'Updating…';
        try {
            const res = await fetch('http://localhost:8000/update_news'); //hard
            await res.json();
            await loadNews();
        } catch (e) {
            console.error('Update failed:', e);
            alert('Update failed. See console.');
        } finally {
            updateBtn.disabled = false;
            updateBtn.textContent = 'Update News';
        }
      });
});

// Interest Modal Logic
document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('interest-modal');
    const addInterestBtn = document.getElementById('add-interest-btn');
    const closeBtn = document.querySelector('.modal .close');
    const topicList = document.getElementById('topic-list');
    const interestList = document.getElementById('interest-list');

    const availableTopics = [
        'Politics', 'Technology', 'Health', 'Sports', 'Business', 'Education', 
        'Entertainment', 'Environment', 'Conflict', 'International', 'Crime'
    ];

    async function loadInterests() {
    const username = localStorage.getItem("username");
    try {
        const res = await fetch(`http://localhost:8000/auth/interests/${username}`);
        const data = await res.json();
        const interests = data.topics || [];

        if (interestList) {
    interestList.innerHTML = '';

    interests.forEach(topic => {
        const li = document.createElement("li");
        li.innerHTML = `
            ${topic}
            <button class="delete-btn" title="Remove ${topic}">&times;</button>
        `;
        li.querySelector(".delete-btn").onclick = () => removeInterest(topic);
        interestList.appendChild(li);
    });
}

        return interests;
    } catch (e) {
        console.error('Error loading interests:', e);
        interestList.innerHTML = '<li>Failed to load interests.</li>';
        return [];
    }
}
async function removeInterest(topic) {
    const username = localStorage.getItem("username");
    const res = await fetch("http://localhost:8000/auth/interests", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, topic })
    });
    const data = await res.json();
    console.log(data);
    loadInterests(); // Refresh list
}

    
    async function saveInterest(topic) {
    const username = localStorage.getItem("username");  // assume it's stored on login
    if (!username) {
        alert("User not logged in");
        return;
    }

    try {
        const res = await fetch('http://localhost:8000/auth/interests', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, topic })
        });
        if (!res.ok) throw new Error('Failed to save interest');
    } catch (e) {
        console.error('Error saving interest:', e);
        alert('Failed to save interest. See console.');
    }
}

    async function renderTopicList() {
        const selectedInterests = await loadInterests();
        const remainingTopics = availableTopics.filter(topic => !selectedInterests.includes(topic));
        topicList.innerHTML = '';
        if (remainingTopics.length === 0) {
            const li = document.createElement('li');
            li.textContent = 'No more topics available';
            li.style.cursor = 'default';
            topicList.appendChild(li);
        } else {
            remainingTopics.forEach(topic => {
                const li = document.createElement('li');
                li.textContent = topic;
                li.addEventListener('click', async () => {
                    await saveInterest(topic);
                    await loadInterests();
                    modal.style.display = 'none';
                });
                topicList.appendChild(li);
            });
        }
    }

    addInterestBtn.addEventListener('click', () => {
        modal.style.display = 'flex';
        renderTopicList();
    });

    closeBtn.addEventListener('click', () => {
        modal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
        }
    });

    // Initial load of interests
    loadInterests();
});
