import { verifyToken } from '../router/authRoutes.js';
import { NotificationSystem } from './notification.js';

// Inicialize o sistema de notificações:
const notificationSystem = new NotificationSystem();

// State object to store application data
const state = {
  events: [],
  selectedEvent: null,
  uploadResponse: [],
  participants: [],
  registrationType: null,
  errors: []
};

// DOM Elements
const DOM = {

    // Loader
    loader: document.getElementById('loader'),
};

function init() {
  tokenVerification();
  setupNavigation();
  setupMaintenanceAnimations();
}

function setupNavigation() {
  document.querySelectorAll(".sidebar-navigation li").forEach(li => {
    li.addEventListener('click', () => {
      const span = li.querySelector(".tooltip");
      if (span && span.id) {
        window.location.href = `${span.id}.html`;
      }
    });
  });
}

async function tokenVerification() {
  showLoader();
  const accessToken = localStorage.getItem('accessToken');

  if (!accessToken) {
    showErrorMessage("Acesso Negado", "Você precisa estar logado para acessar esta página.");
    logoutUser();
    return;
  }

  try {
    const result = await verifyToken(accessToken);

    if (result.error) {
      showErrorMessage("Token Inválido", result.error);
      logoutUser();
      return
    }
  } catch (error) {
    console.error("Erro ao verificar token:", error);
    showErrorMessage("Erro de Autenticação", "Ocorreu um erro ao verificar seu token. Por favor, faça login novamente.");
    logoutUser();
    return;
  } finally {
    hideLoader();
  }
}

function logoutUser() {
  localStorage.removeItem("accessToken");
  location.href = "loginManagement.html";
}

function showLoader() {
  DOM.loader.classList.add('show');
}

function hideLoader() {
  DOM.loader.classList.remove('show');
}

function showSuccessMessage(title, message) {
  notificationSystem.showNotification('success', title, message);
}

function showErrorMessage(title, message) {
  notificationSystem.showNotification('error', title, message);
}

function setupMaintenanceAnimations() {
    // Animação adicional para o ícone de manutenção
    const maintenanceIcon = document.querySelector('.maintenance-icon');
    
    if (maintenanceIcon) {
        setInterval(() => {
            maintenanceIcon.style.transform = 'rotate(5deg)';
            setTimeout(() => {
                maintenanceIcon.style.transform = 'rotate(-5deg)';
            }, 500);
        }, 2000);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', init);