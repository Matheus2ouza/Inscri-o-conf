// Toggle do guia de tópicos
const guideToggleBtn = document.querySelector('.guide-toggle-btn');
const closeGuideBtn = document.querySelector('.close-guide-btn');
const topicGuide = document.querySelector('.topic-guide');
const overlay = document.querySelector('.overlay');

function openGuide() {
    topicGuide.classList.add('open');
    overlay.style.display = 'block';
    setTimeout(() => {
        overlay.style.opacity = '1';
    }, 10);
}

function closeGuide() {
    topicGuide.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => {
        overlay.style.display = 'none';
    }, 300);
}

guideToggleBtn.addEventListener('click', openGuide);
closeGuideBtn.addEventListener('click', closeGuide);
overlay.addEventListener('click', closeGuide);

// Destacar link ativo
const sections = document.querySelectorAll('.guide-section');
const topicLinks = document.querySelectorAll('.topic-link');

function highlightActiveSection() {
    let currentSection = '';
    
    sections.forEach(section => {
        const sectionTop = section.offsetTop - 100;
        if (scrollY >= sectionTop) {
            currentSection = section.getAttribute('id');
        }
    });
    
    topicLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href').substring(1) === currentSection) {
            link.classList.add('active');
        }
    });
}

window.addEventListener('scroll', highlightActiveSection);

// Scroll suave para links internos
document.querySelectorAll('.topic-link').forEach(link => {
    link.addEventListener('click', function(e) {
        e.preventDefault();
        closeGuide();
        
        const targetId = this.getAttribute('href');
        const targetSection = document.querySelector(targetId);
        
        window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: 'smooth'
        });
    });
});

const videos = document.querySelectorAll('video');

const observerOptions = {
    threshold: 0.5 // 50% visível
};

const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        const video = entry.target;
        if (entry.isIntersecting) {
            video.muted = true;     // garante autoplay sem bloqueio
            video.play();
        } else {
            video.pause();
        }
    });
}, observerOptions);

videos.forEach(video => {
    videoObserver.observe(video);
});
