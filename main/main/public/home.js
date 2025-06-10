document.addEventListener('DOMContentLoaded', function() {
    // Bookmark functionality
    const saveButtons = document.querySelectorAll('.save-btn');
    
    saveButtons.forEach(button => {
        button.addEventListener('click', function() {
            this.classList.toggle('fas');
            this.classList.toggle('far');
            
            if (this.classList.contains('fas')) {
                this.style.color = '#4361ee';
                
                alert('Article saved to your bookmarks');
            } else {
                this.style.color = '';
                
            }
        });
    });
    
  
    const dateFilter = document.querySelector('.date-filter select');
    dateFilter.addEventListener('change', function() {
       
        alert(`Loading news for ${this.value}`);
    });
    
    // Load more button
    const loadMoreBtn = document.querySelector('.load-more button');
    loadMoreBtn.addEventListener('click', function() {
     
        alert('Loading more news articles...');
    });
});