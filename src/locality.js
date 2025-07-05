import { getLocality, verifyToken, postActive, postDeactivated } from '../router/authRoutes.js';

// Cache de elementos DOM
const DOM = {
  tableBody: document.getElementById('locality-table-body'),
  editModal: document.getElementById('editModal'),
  confirmModal: document.getElementById('confirmModal'),
  localityId: document.getElementById('localityId'),
  localityName: document.getElementById('localityName'),
  password: document.getElementById('password'),
  confirmPassword: document.getElementById('confirmPassword'),
  localityStatus: document.getElementById('localityStatus'),
  saveButton: document.querySelector('.btn-save'),
  cancelButton: document.querySelector('.btn-cancel'),
  closeButton: document.querySelector('.modal-close'),
  togglePasswordBtn: document.getElementById('togglePasswordBtn'),
  toggleConfirmPasswordBtn: document.getElementById('toggleConfirmPasswordBtn'),
  themeToggle: document.getElementById('chk'),
  notificationContainer: document.getElementById('notification-container'),
  confirmMessage: document.getElementById('confirmMessage'),
  confirmCancel: document.getElementById('confirmCancel'),
  confirmAction: document.getElementById('confirmAction')
};

// Variáveis globais para armazenar temporariamente os dados da desativação
let currentLocalityId = null;
let currentLocalityName = null;

// Sistema de notificações
function showNotification(message, type = 'info') {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  
  // Ícone baseado no tipo
  let icon = '';
  switch (type) {
    case 'success':
      icon = '<i class="fas fa-check-circle"></i>';
      break;
    case 'error':
      icon = '<i class="fas fa-exclamation-circle"></i>';
      break;
    case 'warning':
      icon = '<i class="fas fa-exclamation-triangle"></i>';
      break;
    default:
      icon = '<i class="fas fa-info-circle"></i>';
  }
  
  notification.innerHTML = `
    ${icon}
    <div class="notification-content">${message}</div>
    <button class="notification-close">&times;</button>
  `;
  
  DOM.notificationContainer.appendChild(notification);
  
  // Fechar notificação ao clicar no botão
  notification.querySelector('.notification-close').addEventListener('click', () => {
    notification.remove();
  });
  
  // Remover automaticamente após 5 segundos
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 5000);
}

// Função para abrir o modal de confirmação
function openConfirmModal(localityId, localityName) {
  currentLocalityId = localityId;
  currentLocalityName = localityName;
  DOM.confirmMessage.textContent = `Tem certeza que deseja desativar a localidade ${localityName}?`;
  DOM.confirmModal.style.display = 'flex';
}

// Função para fechar o modal de confirmação
function closeConfirmModal() {
  DOM.confirmModal.style.display = 'none';
  currentLocalityId = null;
  currentLocalityName = null;
}

// Função para desativar uma localidade (após confirmação)
async function deactivateLocality() {
  if (!currentLocalityId || !currentLocalityName) return;

  try {
    const token = localStorage.getItem("accessToken");
    const result = await postDeactivated({ localityId: Number(currentLocalityId) }, token);

    if (result.success) {
      updateLocalityStatus(currentLocalityId, false);
      showNotification('Localidade desativada com sucesso!', 'success');
    } else {
      showNotification(result.message || 'Erro ao desativar localidade', 'error');
    }
  } catch (error) {
    console.error('Erro ao desativar:', error);
    showNotification('Erro ao processar solicitação', 'error');
  } finally {
    closeConfirmModal();
  }
}

// Atualizar o status de uma localidade na tabela
function updateLocalityStatus(localityId, isActive) {
  const row = document.querySelector(`tr[data-id="${localityId}"]`);
  if (!row) return;

  const statusElement = row.querySelector('.status');
  if (statusElement) {
    statusElement.textContent = isActive ? 'Ativa' : 'Inativa';
    statusElement.className = `status ${isActive ? 'status-active' : 'status-inactive'}`;
  }
}

// Alternar o status da localidade
async function toggleLocalityStatus(row) {
  const localityId = row.dataset.id;
  const localityName = row.querySelector('td:first-child').textContent;
  const isActive = row.querySelector('.status').classList.contains('status-active');

  if (isActive) {
    // Abre o modal de confirmação para desativação
    openConfirmModal(localityId, localityName);
  } else {
    openEditModal(localityId, localityName, false);
  }
}

// Adicionar listeners aos botões de toggle
function attachToggleListeners() {
  document.querySelectorAll('.toggle-btn').forEach(button => {
    button.addEventListener('click', function() {
      const row = this.closest('tr');
      toggleLocalityStatus(row);
    });
  });
}

// Funções para o modal de edição
function openEditModal(id, nome, statusAtual) {
  DOM.editModal.style.display = 'flex';
  DOM.localityName.value = nome;
  DOM.localityId.value = id;
  DOM.localityStatus.value = statusAtual.toString();
}

function closeEditModal() {
  DOM.editModal.style.display = 'none';
  DOM.password.value = '';
  DOM.confirmPassword.value = '';
  DOM.password.type = 'password';
  DOM.confirmPassword.type = 'password';
}

function togglePasswordVisibility(field) {
  field.type = field.type === 'password' ? 'text' : 'password';
}

// Validar formulário
function validateForm() {
  if (!DOM.password.value) {
    showNotification('Por favor, digite a senha', 'warning');
    return false;
  }

  if (DOM.password.value.length < 6) {
    showNotification('A senha deve ter pelo menos 6 caracteres', 'warning');
    return false;
  }

  if (DOM.password.value !== DOM.confirmPassword.value) {
    showNotification('As senhas não coincidem!', 'warning');
    return false;
  }

  return true;
}

// Salvar mudanças
async function saveChanges() {
  if (!validateForm()) return;

  try {
    const token = localStorage.getItem("accessToken");
    const result = await postActive({
      localityId: DOM.localityId.value,
      password: DOM.password.value,
      status: DOM.localityStatus.value === 'true'
    }, token);

    if (result.success) {
      showNotification('Localidade ativada com sucesso!', 'success');
      closeEditModal();
      updateLocalityStatus(DOM.localityId.value, true);
    } else {
      showNotification(result.message || 'Erro ao ativar localidade', 'error');
    }
  } catch (error) {
    console.error('Erro:', error);
    showNotification('Erro ao processar solicitação', 'error');
  }
}

// Verificação de token
async function tokenVerificationAdmin() {
  const accessToken = localStorage.getItem("accessToken");
  
  if (!accessToken) {
    redirectToLogin("Token não encontrado. Faça login novamente.");
    return;
  }

  try {
    const result = await verifyToken(accessToken);

    if (result.error) {
      handleTokenError(result.status);
      return;
    }

    if (result.role !== "admin") {
      redirectToLogin("Acesso negado. Esta página é apenas para administradores.");
    }
  } catch (error) {
    console.error("Erro ao verificar o token:", error);
    redirectToLogin("Erro ao verificar sua sessão. Faça login novamente.");
  }
}

function handleTokenError(status) {
  const messages = {
    401: "Sua sessão expirou. Faça login novamente.",
    403: "Acesso negado. Token inválido.",
    default: "Erro na autenticação. Faça login novamente."
  };

  showNotification(messages[status] || messages.default, 'error');
  logoutUser();
}

function redirectToLogin(message) {
  showNotification(message, 'error');
  logoutUser();
}

function logoutUser() {
  localStorage.removeItem("accessToken");
  location.href = "https://inscri-o-conf.vercel.app/";
}

// Carregar localidades
async function loadLocalities() {
  try {
    const token = localStorage.getItem("accessToken");
    const response = await getLocality(token);
    
    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.message || "Erro ao carregar localidades");
    }

    const { data: localities } = await response.json();
    renderLocalities(localities);
  } catch (error) {
    console.error("Erro ao carregar localidades:", error);
    showNotification("Não foi possível carregar as localidades.", 'error');
  }
}

// Renderizar localidades
function renderLocalities(localities) {
  DOM.tableBody.innerHTML = '';

  localities.forEach(localidade => {
    const tr = document.createElement("tr");
    tr.dataset.id = localidade.id;

    const statusClass = localidade.status ? "status-active" : "status-inactive";
    const statusText = localidade.status ? "Ativa" : "Inativa";

    const saldoFloat = parseFloat(localidade.saldo_devedor);
    const saldoFormatado = saldoFloat.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });

    const saldoClass = saldoFloat > 0 ? "balance-positive" : "balance-zero";

    tr.innerHTML = `
      <td>${localidade.nome}</td>
      <td><span class="status ${statusClass}">${statusText}</span></td>
      <td class="${saldoClass}">${saldoFormatado}</td>
      <td class="actions">
          <button class="action-btn edit-btn" aria-label="Editar localidade">
              <i class="fas fa-edit"></i>
          </button>
          <button class="action-btn toggle-btn" aria-label="Alterar status">
              <i class="fas fa-power-off"></i>
          </button>
      </td>
    `;

    tr.querySelector('.edit-btn').addEventListener('click', () => {
      openEditModal(
        localidade.id,
        localidade.nome,
        localidade.status
      );
    });

    DOM.tableBody.appendChild(tr);
  });

  attachToggleListeners();
}

// Inicialização
function init() {
  DOM.themeToggle.addEventListener('change', () => {
    document.body.classList.toggle('dark-mode');
  });

  window.addEventListener('click', (event) => {
    if (event.target === DOM.editModal) {
      closeEditModal();
    }
    if (event.target === DOM.confirmModal) {
      closeConfirmModal();
    }
  });

  DOM.closeButton.addEventListener('click', closeEditModal);
  DOM.cancelButton.addEventListener('click', closeEditModal);
  
  DOM.togglePasswordBtn.addEventListener('click', () => {
    togglePasswordVisibility(DOM.password);
  });
  
  DOM.toggleConfirmPasswordBtn.addEventListener('click', () => {
    togglePasswordVisibility(DOM.confirmPassword);
  });

  DOM.saveButton.addEventListener('click', saveChanges);

  // Event listeners para o modal de confirmação
  document.querySelector('#confirmModal .modal-close').addEventListener('click', closeConfirmModal);
  DOM.confirmCancel.addEventListener('click', closeConfirmModal);
  DOM.confirmAction.addEventListener('click', deactivateLocality);

  tokenVerificationAdmin();
  loadLocalities();
}

document.addEventListener('DOMContentLoaded', init);