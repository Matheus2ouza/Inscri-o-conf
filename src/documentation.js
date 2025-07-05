document.addEventListener('DOMContentLoaded', function () {
  const topicLinks = document.querySelectorAll('.topic-link');
  const sections = document.querySelectorAll('section');
  const toggleGuideBtn = document.querySelector('.guide-toggle-btn');
  const closeGuideBtn = document.querySelector('.close-guide-btn');
  const topicGuide = document.querySelector('.topic-guide');
  const overlay = document.querySelector('.overlay');
  const body = document.body;

  // Função para abrir o guia
  function openGuide() {
    topicGuide.classList.add('open');
    overlay.style.display = 'block';
    setTimeout(() => {
      overlay.style.opacity = '1';
    }, 10);
    body.classList.add('guide-open');
  }

  // Função para fechar o guia
  function closeGuide() {
    topicGuide.classList.remove('open');
    overlay.style.opacity = '0';
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
    body.classList.remove('guide-open');
  }

  // Botão para abrir/fechar o guia
  if (toggleGuideBtn) {
    toggleGuideBtn.addEventListener('click', function () {
      if (topicGuide.classList.contains('open')) {
        closeGuide();
      } else {
        openGuide();
      }
    });
  }

  // Botão para fechar o guia
  if (closeGuideBtn) {
    closeGuideBtn.addEventListener('click', closeGuide);
  }

  // Fechar o guia ao clicar no overlay
  if (overlay) {
    overlay.addEventListener('click', closeGuide);
  }

  // Função para verificar qual seção está visível
  function activateCurrentSection() {
    let currentSection = '';

    sections.forEach(section => {
      const sectionTop = section.offsetTop;
      const sectionHeight = section.clientHeight;

      if (window.scrollY >= (sectionTop - sectionHeight / 3)) {
        currentSection = section.getAttribute('id');
      }
    });

    // Ativar o link correspondente
    topicLinks.forEach(link => {
      link.classList.remove('active');
      if (link.getAttribute('href').substring(1) === currentSection) {
        link.classList.add('active');
      }
    });
  }

  // Ativar a seção atual ao carregar e ao rolar
  window.addEventListener('scroll', activateCurrentSection);
  activateCurrentSection();

  // Scroll suave ao clicar nos tópicos do guia
  topicLinks.forEach(link => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      const targetId = this.getAttribute('href');
      const targetSection = document.querySelector(targetId);

      if (targetSection) {
        // Fechar o guia primeiro
        closeGuide();

        // Dar um pequeno delay para o fechamento do guia acontecer antes do scroll
        setTimeout(() => {
          window.scrollTo({
            top: targetSection.offsetTop - 80,
            behavior: 'smooth'
          });
        }, 310); // 310ms para garantir que o overlay esteja oculto antes do scroll
      }
    });
  });

  // --- NOVO: rolar para a seção passada pelo parâmetro ?topic=login ---

  function scrollToSectionById(id) {
    const section = document.getElementById(id);
    if (section) {
      setTimeout(() => {
        window.scrollTo({
          top: section.offsetTop - 80,
          behavior: 'smooth'
        });
      }, 700); // Delay para garantir que tudo carregou e layout estabilizou
    }
  }

  // Detecta o parâmetro topic na URL
  const urlParams = new URLSearchParams(window.location.search);
  const topicParam = urlParams.get('topic');

  if (topicParam) {
    scrollToSectionById(topicParam);
  }

});
