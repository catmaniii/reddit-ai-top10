// Reddit AI Top 10 - Main Application
// Fetches top posts from r/artificial and r/MachineLearning

const SUBREDDITS = ['artificial', 'MachineLearning'];
const POSTS_PER_SUBREDDIT = 5;
const TOTAL_POSTS = 10;

// State
let posts = [];
let isTranslating = false;
let translatedCache = new Map();

// DOM Elements
const postsContainer = document.getElementById('postsContainer');
const loadingEl = document.getElementById('loading');
const errorEl = document.getElementById('errorMessage');
const refreshBtn = document.getElementById('refreshBtn');
const translateBtn = document.getElementById('translateBtn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    
    refreshBtn.addEventListener('click', () => {
        refreshBtn.disabled = true;
        refreshBtn.innerHTML = '<span class="icon">↻</span> 刷新中...';
        loadPosts();
    });
    
    translateBtn.addEventListener('click', translateAllPosts);
});

// Fetch posts from Reddit API
async function loadPosts() {
    showLoading();
    posts = [];
    translatedCache.clear();
    
    try {
        const promises = SUBREDDITS.map(subreddit => 
            fetchPostsFromSubreddit(subreddit)
        );
        
        const results = await Promise.all(promises);
        
        // Flatten and sort by score
        posts = results.flat().sort((a, b) => b.score - a.score).slice(0, TOTAL_POSTS);
        
        if (posts.length === 0) {
            showError();
            return;
        }
        
        renderPosts();
    } catch (error) {
        console.error('Error loading posts:', error);
        showError();
    }
}

async function fetchPostsFromSubreddit(subreddit) {
    // 使用 CORS 代理绕过限制
    const proxyUrl = 'https://api.allorigins.win/raw?url=';
    const redditUrl = `https://www.reddit.com/r/${subreddit}/top.json?t=day&limit=${POSTS_PER_SUBREDDIT}`;
    const url = proxyUrl + encodeURIComponent(redditUrl);
    
    const response = await fetch(url, {
        headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
    });
    
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    return data.data.children.map(child => ({
        id: child.data.id,
        title: child.data.title,
        selftext: child.data.selftext,
        score: child.data.score,
        num_comments: child.data.num_comments,
        author: child.data.author,
        subreddit: child.data.subreddit,
        url: child.data.url,
        permalink: child.data.permalink,
        domain: child.data.domain,
        thumbnail: child.data.thumbnail,
        is_self: child.data.is_self,
        created_utc: child.data.created_utc
    }));
}

// Render posts to DOM
function renderPosts() {
    hideLoading();
    postsContainer.innerHTML = '';
    
    posts.forEach((post, index) => {
        const postEl = createPostElement(post, index);
        postsContainer.appendChild(postEl);
    });
}

function createPostElement(post, index) {
    const el = document.createElement('div');
    el.className = 'post-card';
    el.dataset.index = index;
    
    // Format score
    const formattedScore = formatNumber(post.score);
    const formattedComments = formatNumber(post.num_comments);
    
    // Create preview HTML
    let previewHTML = '';
    if (post.is_self && post.selftext) {
        previewHTML = `
            <div class="post-self-text" data-full-text="${escapeHtml(post.selftext)}">
                ${getExcerpt(post.selftext)}
                <span class="expand-btn" onclick="expandText(this)">... 查看更多</span>
            </div>
        `;
    } else if (post.thumbnail && post.thumbnail.startsWith('http')) {
        previewHTML = `
            <div class="post-preview">
                <img src="${post.thumbnail}" alt="${escapeHtml(post.title)}" loading="lazy">
            </div>
        `;
    } else if (post.domain && !post.domain.includes('reddit')) {
        previewHTML = `
            <div class="post-preview">
                <a href="${post.url}" target="_blank" rel="noopener noreferrer" class="external-link">
                    <span>🔗</span>
                    <span class="domain">${post.domain}</span>
                </a>
            </div>
        `;
    }
    
    // Time ago
    const timeAgo = getTimeAgo(post.created_utc);
    
    el.innerHTML = `
        <div class="vote-section">
            <button class="vote-btn" onclick="vote(this, 'up')">▲</button>
            <span class="vote-count">${formattedScore}</span>
            <button class="vote-btn" onclick="vote(this, 'down')">▼</button>
        </div>
        <div class="post-content">
            <div class="post-meta">
                <a href="https://reddit.com/r/${post.subreddit}" target="_blank">r/${post.subreddit}</a>
                • Posted by u/${post.author} • ${timeAgo}
            </div>
            <h2 class="post-title">
                <a href="${post.url}" target="_blank" rel="noopener noreferrer">${escapeHtml(post.title)}</a>
                <button class="translate-single-btn" onclick="translateSinglePost(${index}, this)">
                    📝 翻译
                </button>
            </h2>
            ${previewHTML}
            <div class="translated-content" id="translated-${index}">
                <div class="label">中文翻译</div>
                <div class="text"></div>
            </div>
            <div class="post-footer">
                <a href="https://reddit.com${post.permalink}" target="_blank" class="footer-btn">
                    <span class="icon">💬</span> ${formattedComments} 评论
                </a>
                <div class="footer-btn" onclick="sharePost('${post.permalink}')">
                    <span class="icon">↗</span> 分享
                </div>
                <div class="footer-btn" onclick="savePost('${post.id}')">
                    <span class="icon">★</span> 保存
                </div>
            </div>
        </div>
    `;
    
    return el;
}

// Translation Functions
async function translateAllPosts() {
    if (isTranslating) return;
    
    const untranslatedPosts = posts.filter((_, index) => {
        const contentEl = document.getElementById(`translated-${index}`);
        return !contentEl.classList.contains('show');
    });
    
    if (untranslatedPosts.length === 0) {
        alert('所有内容已翻译完成！');
        return;
    }
    
    isTranslating = true;
    translateBtn.disabled = true;
    translateBtn.innerHTML = '<span class="icon">↻</span> 翻译中...';
    
    for (let i = 0; i < posts.length; i++) {
        const contentEl = document.getElementById(`translated-${i}`);
        if (!contentEl.classList.contains('show')) {
            await translatePost(i);
        }
    }
    
    isTranslating = false;
    translateBtn.disabled = false;
    translateBtn.innerHTML = '<span class="icon">文</span> 翻译全部';
}

async function translateSinglePost(index, btn) {
    const contentEl = document.getElementById(`translated-${index}`);
    
    if (contentEl.classList.contains('show')) {
        contentEl.classList.remove('show');
        btn.textContent = '📝 翻译';
        btn.classList.remove('translated');
        return;
    }
    
    btn.textContent = '⏳';
    btn.disabled = true;
    
    await translatePost(index);
    
    btn.textContent = '✅ 已翻译';
    btn.classList.add('translated');
    btn.disabled = false;
}

async function translatePost(index) {
    const post = posts[index];
    const contentEl = document.getElementById(`translated-${index}`);
    const textEl = contentEl.querySelector('.text');
    
    // Check cache
    if (translatedCache.has(post.id)) {
        textEl.textContent = translatedCache.get(post.id);
        contentEl.classList.add('show');
        return;
    }
    
    // Prepare text to translate
    let textToTranslate = post.title;
    if (post.is_self && post.selftext) {
        textToTranslate += '\n\n' + post.selftext;
    }
    
    try {
        // Using Google Translate API (no CORS issues)
        const response = await fetch(`https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=zh-CN&dt=t&q=${encodeURIComponent(textToTranslate)}`);
        const data = await response.json();
        
        if (data && data[0]) {
            const translatedText = data[0].map(item => item[0]).join('\n');
            // Cache the result
            translatedCache.set(post.id, translatedText);
            textEl.textContent = translatedText;
            contentEl.classList.add('show');
        } else {
            throw new Error('Translation failed');
        }
    } catch (error) {
        console.error('Translation error:', error);
        textEl.textContent = '翻译失败，请稍后重试';
        contentEl.classList.add('show');
    }
}

// Utility Functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatNumber(num) {
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

function getTimeAgo(timestamp) {
    const seconds = Math.floor(Date.now() / 1000 - timestamp);
    
    const intervals = {
        year: 31536000,
        month: 2592000,
        week: 604800,
        day: 86400,
        hour: 3600,
        minute: 60
    };
    
    for (const [unit, secondsInUnit] of Object.entries(intervals)) {
        const interval = Math.floor(seconds / secondsInUnit);
        if (interval >= 1) {
            return `${interval} ${unit}${interval > 1 ? 's' : ''} ago`;
        }
    }
    
    return 'just now';
}

function getExcerpt(text) {
    // Remove markdown and limit length
    const plainText = text.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
                           .replace(/(\*\*|__)(.*?)\1/g, '$2')
                           .replace(/(\*|_)(.*?)\1/g, '$2')
                           .replace(/`([^`]+)`/g, '$1');
    
    if (plainText.length > 300) {
        return plainText.substring(0, 300) + '...';
    }
    return plainText;
}

function expandText(btn) {
    const parent = btn.parentElement;
    const fullText = parent.dataset.fullText;
    parent.innerHTML = escapeHtml(fullText);
}

function vote(btn, direction) {
    const countEl = btn.parentElement.querySelector('.vote-count');
    let count = parseInt(countEl.textContent.replace(/[K,M]/g, ''));
    const suffix = countEl.textContent.match(/[K,M]/)?.[0] || '';
    
    if (direction === 'up') {
        count++;
    } else {
        count--;
    }
    
    countEl.textContent = count + suffix;
    btn.style.color = direction === 'up' ? '#CC3700' : '#7193FF';
}

function sharePost(permalink) {
    const url = `https://reddit.com${permalink}`;
    if (navigator.share) {
        navigator.share({
            title: 'Reddit AI Top 10',
            url: url
        });
    } else {
        navigator.clipboard.writeText(url);
        alert('链接已复制到剪贴板！');
    }
}

function savePost(id) {
    const saved = JSON.parse(localStorage.getItem('savedPosts') || '[]');
    if (!saved.includes(id)) {
        saved.push(id);
        localStorage.setItem('savedPosts', JSON.stringify(saved));
        alert('已保存到收藏！');
    } else {
        alert('这篇文章已经在收藏中！');
    }
}

function showLoading() {
    loadingEl.style.display = 'block';
    postsContainer.style.display = 'none';
    errorEl.style.display = 'none';
}

function hideLoading() {
    loadingEl.style.display = 'none';
    postsContainer.style.display = 'flex';
    errorEl.style.display = 'none';
}

function showError() {
    loadingEl.style.display = 'none';
    postsContainer.style.display = 'none';
    errorEl.style.display = 'block';
}

// Refresh button state recovery
window.loadPosts = loadPosts;
window.expandText = expandText;
window.vote = vote;
window.sharePost = sharePost;
window.savePost = savePost;
window.translateSinglePost = translateSinglePost;
