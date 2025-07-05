// payment.js
import { verifyToken } from "../router/authRoutes.js";
import { getListRegister } from "../router/dataRoutes.js";
import { registerPayment } from "../router/registrationRoutes.js"
import { NotificationSystem } from './notification.js';

const notificationSystem = new NotificationSystem();

const state = {
    subscriptions: [],
    filteredSubscriptions: [],
    currentSubscription: null
};

const DOM = {
    tableBody: document.querySelector('#subscriptions-table tbody'),
    mobileCards: document.getElementById('mobile-cards'),
    detailsPanel: document.getElementById('details-panel'),
    paymentForm: document.getElementById('payment-form'),
    paymentAmount: document.getElementById('payment-amount'),
    paymentReceipt: document.getElementById('payment-receipt'),
    statusFilter: document.getElementById('status-filter'),
    dateFilter: document.getElementById('date-filter'),
    searchInput: document.getElementById('search-input'),
    searchBtn: document.getElementById('search-btn'),
    closePanelBtn: document.getElementById('close-panel'),
    detailDate: document.getElementById('detail-date'),
    detailResponsible: document.getElementById('detail-responsible'),
    detailBalance: document.getElementById('detail-balance'),
    detailStatus: document.getElementById('detail-status'),
    paymentsList: document.getElementById('payments-list'),
    loader: document.getElementById('loader'),
    menuToggle: document.getElementById('menu-toggle'),
    overlay: document.getElementById('overlay'),
    sidebar: document.getElementById('sidebar'),
    logoutBtn: document.getElementById('logout-btn')
};

function init() {
    tokenVerification();
    setupEventListeners();
    setupThemeToggle();
    setupNavigation();
    setupLogoutButton();
}

function setupEventListeners() {
    DOM.closePanelBtn.addEventListener('click', closeDetailsPanel);
    DOM.paymentForm.addEventListener('submit', handlePaymentSubmit);
    DOM.statusFilter.addEventListener('change', filterSubscriptions);
    DOM.dateFilter.addEventListener('change', filterSubscriptions);
    DOM.searchBtn.addEventListener('click', filterSubscriptions);
    DOM.searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') filterSubscriptions();
    });
}

async function tokenVerification() {
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
            return;
        }
        loadRegisteredSubscription();
    } catch (error) {
        console.error("Erro ao verificar token:", error);
        showErrorMessage("Erro de Autenticação", "Ocorreu um erro ao verificar seu token. Por favor, faça login novamente.");
        logoutUser();
    }
}

function logoutUser() {
  // Confirmação antes de sair
  const confirmed = confirm("Tem certeza que deseja sair do sistema?");
  
  if (confirmed) {
    localStorage.removeItem("accessToken");
    
    // Redireciona após um breve delay
    setTimeout(() => {
      location.href = "https://inscri-o-conf.vercel.app/";
    }, 1500);
  }
}

function setupThemeToggle() {
    const checkbox = document.querySelector("#chk");
    const isDarkMode = localStorage.getItem('darkMode') === 'true';

    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        checkbox.checked = true;
    }

    checkbox.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
        localStorage.setItem('darkMode', checkbox.checked);
    });
}

function setupNavigation() {
  document.querySelectorAll(".sidebar-navigation li").forEach(li => {
    li.addEventListener('click', () => {
      const span = li.querySelector(".tooltip");
      if (span && span.id && span.id !== 'logout') {
        window.location.href = `https://inscri-o-conf.vercel.app/${span.id}`;
      }
    });
  });
}

function setupLogoutButton() {
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', logoutUser);
  }
}

function showLoader() {
    DOM.loader.style.display = 'flex';
}

function hideLoader() {
    DOM.loader.style.display = 'none';
}

async function loadRegisteredSubscription() {
    showLoader();
    const accessToken = localStorage.getItem('accessToken');

    try {
        const response = await getListRegister(accessToken);
        console.log(response)

        if (response.status === 401) {
            showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
            logoutUser();
            return;
        }

        if (response.success === false) {
            if (response.status === 404) {
                showErrorMessage("Dados não encontrados", "Você não possui inscrições registradas.");
                return;
            }

            if (response.status === 500) {
                showErrorMessage("Erro Interno", "Ocorreu um erro ao buscar suas inscrições. Tente novamente mais tarde.");
                return;
            }
        }

        state.subscriptions = response.registrations.map(registration => ({
            id: registration.id,
            date: formatDateString(registration.data_inscricao),
            quantity: registration.quantidade_inscritos,
            responsibles: registration.responsavel,
            balance: parseFloat(registration.saldo_devedor),
            status: registration.status.toLowerCase(),
            payments: registration.comprovantes.map(comp => ({ // Adiciona os comprovantes
                id: comp.id,
                date: formatDateString(comp.data_pagamento),
                amount: parseFloat(comp.valor_pago),
                receipt: comp.comprovante_imagem, // Já está em base64
                type: comp.tipo_arquivo
            }))
        }));

        state.filteredSubscriptions = [...state.subscriptions];
        renderSubscriptionTable();
        renderMobileCards();

    } catch (error) {
        console.error("Erro ao carregar inscrições:", error);
        showErrorMessage("Erro de Rede", "Ocorreu um erro ao carregar suas inscrições. Verifique sua conexão e tente novamente.");
    } finally {
        hideLoader();
    }
}

function renderSubscriptionTable() {
    DOM.tableBody.innerHTML = '';

    if (state.filteredSubscriptions.length === 0) {
        DOM.tableBody.innerHTML = `
            <tr>
                <td colspan="6" class="no-results">
                    Nenhuma inscrição encontrada
                </td>
            </tr>
        `;
        return;
    }

    state.filteredSubscriptions.forEach(sub => {
        const row = document.createElement('tr');
        row.dataset.id = sub.id;
        row.innerHTML = `
            <td>${sub.date}</td>
            <td>${sub.quantity}</td>
            <td>${sub.responsibles}</td>
            <td>R$ ${sub.balance.toFixed(2).replace('.', ',')}</td>
            <td><span class="status-badge status-${sub.status}">${sub.status}</span></td>
            <td>
                <button class="action-btn view-details" title="Ver detalhes">
                    <i class="fas fa-eye"></i>
                </button>
            </td>
        `;
        DOM.tableBody.appendChild(row);
    });

    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const row = e.target.closest('tr');
            const subId = parseInt(row.dataset.id);
            showSubscriptionDetails(subId);
        });
    });
}

function renderMobileCards() {
    DOM.mobileCards.innerHTML = '';

    if (state.filteredSubscriptions.length === 0) {
        DOM.mobileCards.innerHTML = `
            <div class="no-results">
                Nenhuma inscrição encontrada
            </div>
        `;
        return;
    }

    state.filteredSubscriptions.forEach(sub => {
        const card = document.createElement('div');
        card.className = 'subscription-card';
        card.dataset.id = sub.id;
        card.innerHTML = `
            <div class="card-row">
                <span class="card-label">Data:</span>
                <span class="card-value">${sub.date}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Responsável:</span>
                <span class="card-value">${sub.responsibles}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Inscritos:</span>
                <span class="card-value">${sub.quantity}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Saldo:</span>
                <span class="card-value">R$ ${sub.balance.toFixed(2).replace('.', ',')}</span>
            </div>
            <div class="card-row">
                <span class="card-label">Status:</span>
                <span class="card-value">
                    <span class="card-status status-${sub.status}">${sub.status}</span>
                </span>
            </div>
            <div class="card-actions">
                <button class="action-btn view-details">
                    <i class="fas fa-eye"></i> Detalhes
                </button>
            </div>
        `;
        DOM.mobileCards.appendChild(card);
    });

    document.querySelectorAll('.view-details').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const card = e.target.closest('.subscription-card');
            const subId = parseInt(card.dataset.id);
            showSubscriptionDetails(subId);
        });
    });
}

function renderPaymentsList() {
    DOM.paymentsList.innerHTML = '';

    if (!state.currentSubscription.payments.length) {
        DOM.paymentsList.innerHTML = `
            <div class="no-payments">
                <i class="fas fa-file-invoice"></i>
                <p>Nenhum pagamento registrado</p>
            </div>
        `;
        return;
    }

    const paymentsContainer = document.createElement('div');
    paymentsContainer.className = 'payments-container';

    state.currentSubscription.payments.forEach(payment => {
        const isPDF = payment.type && payment.type.toLowerCase().includes('pdf');
        const isImage = payment.type && payment.type.toLowerCase().includes('image');
        const fileType = isPDF ? 'PDF' : isImage ? 'Imagem' : 'Arquivo';
        const fileIcon = isPDF ? 'fa-file-pdf' : isImage ? 'fa-file-image' : 'fa-file';
        
        const paymentEl = document.createElement('div');
        paymentEl.className = 'payment-card';
        paymentEl.innerHTML = `
            <div class="payment-header">
                <i class="fas ${fileIcon}"></i>
                <div>
                    <div class="payment-date">${formatDateString(payment.date)}</div>
                    <div class="payment-amount">R$ ${payment.amount.toFixed(2).replace('.', ',')}</div>
                    <div class="payment-type">${fileType}</div>
                </div>
            </div>
            
            <div class="payment-actions">
                ${isImage ? `
                <button class="btn-icon view-btn view-receipt" 
                        data-receipt="${payment.receipt}">
                    <i class="fas fa-eye"></i>
                    Visualizar
                </button>
                ` : ''}
                
                <button class="btn-icon download-btn download-receipt" 
                        data-receipt="${payment.receipt}" 
                        data-filename="comprovante_${payment.id}.${isPDF ? 'pdf' : 'png'}">
                    <i class="fas fa-download"></i>
                    Baixar
                </button>
            </div>
        `;
        
        paymentsContainer.appendChild(paymentEl);
    });
    
    DOM.paymentsList.appendChild(paymentsContainer);

    // Event delegation para melhor performance
    paymentsContainer.addEventListener('click', (e) => {
        // Para visualização
        if (e.target.closest('.view-receipt')) {
            const btn = e.target.closest('.view-receipt');
            const receiptData = btn.dataset.receipt;
            viewReceipt(receiptData);
        }
        
        // Para download
        if (e.target.closest('.download-receipt')) {
            const btn = e.target.closest('.download-receipt');
            const receiptData = btn.dataset.receipt;
            const fileName = btn.dataset.filename;
            downloadReceipt(receiptData, fileName);
        }
    });
}

function downloadReceipt(receiptData, fileName) {
    const link = document.createElement('a');
    link.href = receiptData;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function filterSubscriptions() {
    const status = DOM.statusFilter.value;
    const date = DOM.dateFilter.value;
    const searchTerm = DOM.searchInput.value.toLowerCase();

    state.filteredSubscriptions = state.subscriptions.filter(sub => {
        if (status !== 'all' && sub.status !== status) return false;

        if (date) {
            const filterDate = new Date(date).toISOString().split('T')[0];
            const subDate = new Date(sub.date.split('/').reverse().join('-')).toISOString().split('T')[0];
            if (subDate !== filterDate) return false;
        }

        if (searchTerm) {
            const searchIn = `${sub.date} ${sub.responsibles} ${sub.status}`.toLowerCase();
            if (!searchIn.includes(searchTerm)) return false;
        }

        return true;
    });

    renderSubscriptionTable();
    renderMobileCards();
}

function showSubscriptionDetails(subId) {
    showLoader();

    setTimeout(() => {
        state.currentSubscription = state.subscriptions.find(sub => sub.id === subId);

        if (state.currentSubscription) {
            DOM.detailDate.textContent = state.currentSubscription.date;
            DOM.detailResponsible.textContent = state.currentSubscription.responsibles;
            DOM.detailBalance.textContent = `R$ ${state.currentSubscription.balance.toFixed(2).replace('.', ',')}`;
            DOM.detailStatus.textContent = state.currentSubscription.status;
            DOM.detailStatus.className = `status-badge status-${state.currentSubscription.status}`;

            renderPaymentsList();
            DOM.detailsPanel.classList.add('open');
        }

        hideLoader();
    }, 500);
}

function viewReceipt(receiptData) {
    // Cria um modal para exibir a imagem
    const modal = document.createElement('div');
    modal.className = 'receipt-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <span class="close-modal">&times;</span>
            <img src="${receiptData}" alt="Comprovante de pagamento">
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fecha o modal ao clicar no X
    modal.querySelector('.close-modal').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
}

function closeDetailsPanel() {
    DOM.detailsPanel.classList.remove('open');
    state.currentSubscription = null;
}

async function handlePaymentSubmit(e) {
    e.preventDefault();
    showLoader();

    if (!state.currentSubscription) return;

    const amount = parseFloat(DOM.paymentAmount.value.replace(',', '.'));
    const receiptFile = DOM.paymentReceipt.files[0];

    if (isNaN(amount) || amount <= 0) {
        notificationSystem.showNotification('error', 'Erro de Validação', 'Valor inválido!');
        return;
    }

    if (amount > state.currentSubscription.balance) {
        notificationSystem.showNotification(
            'error',
            'Erro de Validação',
            `O valor excede o saldo devedor! Saldo atual: R$ ${state.currentSubscription.balance.toFixed(2).replace('.', ',')}`
        );
        return;
    }

    if (!receiptFile) {
        notificationSystem.showNotification('error', 'Erro de Validação', 'Selecione um comprovante!');
        return;
    }


    try {
        const accessToken = localStorage.getItem('accessToken');

        if (!accessToken) {
            showErrorMessage("Acesso Negado", "Você precisa estar logado para acessar esta página.");
            logoutUser();
            return;
        }

        const registerId = state.currentSubscription.id

        const result = await registerPayment(receiptFile, amount, registerId, accessToken)

        if (result.status === 401) {
            showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
            logoutUser();
            return
        }

        if (result.success === false) {
            if (result.status === 400) {
                showErrorMessage('Erro de Registro', result.message);
                return
            }

            if (result.status === 500) {
                showErrorMessage('Erro no Registro', result.message || result.error || 'Ocorreu um erro ao enviar o arquivo')
                return
            }
        return
        }

        state.currentSubscription.payments.push(result.data);
        state.currentSubscription.balance -= amount;

        if (state.currentSubscription.balance <= 0) {
            state.currentSubscription.status = 'pago';
            state.currentSubscription.balance = 0;
        }
        console.log(result.data)
        updateSubscriptionUI();
        renderPaymentsList();
        renderSubscriptionTable();
        renderMobileCards();

        DOM.paymentForm.reset();

        notificationSystem.showNotification(
            'success',
            'Pagamento Registrado',
            `Pagamento de R$ ${amount.toFixed(2).replace('.', ',')} registrado com sucesso!`
        );
    } catch (error) {
        console.error('Error de envio', error);
        showErrorMessage('Erro no envio', error.message || 'Ocorreu um erro ao enviar o arquivo')
    } finally {
        hideLoader();
    }
}

function updateSubscriptionUI() {
    DOM.detailBalance.textContent = `R$ ${state.currentSubscription.balance.toFixed(2).replace('.', ',')}`;
    DOM.detailStatus.textContent = state.currentSubscription.status;
    DOM.detailStatus.className = `status-badge status-${state.currentSubscription.status}`;
}

function showSuccessMessage(title, message) {
    notificationSystem.showNotification('success', title, message);
}

function showErrorMessage(title, message) {
    notificationSystem.showNotification('error', title, message);
}

function formatDateString(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

document.addEventListener('DOMContentLoaded', init);