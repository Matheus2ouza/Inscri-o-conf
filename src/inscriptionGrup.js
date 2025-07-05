import { verifyToken } from "../router/authRoutes.js";
import { getEventList } from "../router/dataRoutes.js";
import { postFileRegister, confirmRegister } from "../router/registrationRoutes.js"
import { NotificationSystem } from './notification.js';

// Inicialize o sistema de notificações:
const notificationSystem = new NotificationSystem();

// State object to store application data
const state = {
    events: [],
    selectedEvent: null,
    uploadResponse: [],
    participants: []
};

// DOM Elements
const DOM = {
    // Containers
    eventSelectionView: document.getElementById('event-selection-view'),
    enrollmentProcess: document.getElementById('enrollment-process'),
    progressBar: document.querySelector('.progress-bar'),
    cardsContainer: document.querySelector('.cards-container'),

    // Cards
    enrollmentTypeCard: document.getElementById('card-enrollment-type'),
    groupCard: document.getElementById('card-group'),
    groupListCard: document.getElementById('card-group-list'),
    confirmationCard: document.getElementById('card-confirmation'),

    // Buttons
    changeEventBtn: document.getElementById('change-event-btn'),
    nextStepBtn: document.getElementById('next-step-btn'),
    prevToTypeBtn: document.getElementById('prev-to-type-btn'),
    uploadFileBtn: document.getElementById('upload-file-btn'),
    prevToGroupBtn: document.getElementById('prev-to-group-btn'),
    nextToConfirmationBtn: document.getElementById('next-to-confirmation-btn'),
    prevToListBtn: document.getElementById('prev-to-list-btn'),
    confirmRegistrationBtn: document.getElementById('confirm-registration-btn'),

    // Form elements
    fileUploadInput: document.getElementById('file-upload'),
    fileNameDisplay: document.querySelector('.file-name'),
    stepTitle: document.getElementById('step-title'),

    // card error
    validationErrorsCard: document.getElementById('card-validation-errors'),
    errorList: document.getElementById('error-list'),
    backToUploadBtn: document.getElementById('back-to-upload-btn'),
    downloadErrorBtn: document.getElementById('download-error-btn'),

    // Loader
    loader: document.getElementById('loader'),

    // Progress
    progressSteps: document.querySelectorAll('.progress-step')
};

// Current step
let currentStep = 0;

function init() {
    // Load any saved state
    const savedEvent = localStorage.getItem("selectedEvent");
    if (savedEvent) {
        state.selectedEvent = JSON.parse(savedEvent);
        updateSelectedEventBanner(state.selectedEvent);
        document.getElementById('selected-event-banner').style.display = 'flex';
        DOM.eventSelectionView.style.display = 'none';
        DOM.enrollmentProcess.classList.add('show');
    } else {
        document.getElementById('selected-event-banner').style.display = 'none';
        DOM.eventSelectionView.style.display = 'block';
    }
    tokenVerification();
    loadEvents();
    setupEventListeners();
    setupFileUpload();
    setupNavigation();
}

function setupEventListeners() {
    // Navigation buttons
    DOM.nextStepBtn.addEventListener('click', goToNextStep);
    DOM.prevToTypeBtn.addEventListener('click', () => goToStep(0));
    DOM.uploadFileBtn.addEventListener('click', uploadFile);
    DOM.prevToGroupBtn.addEventListener('click', () => goToStep(1));
    DOM.nextToConfirmationBtn.addEventListener('click', () => goToStep(3));
    DOM.prevToListBtn.addEventListener('click', () => goToStep(2));
    DOM.confirmRegistrationBtn.addEventListener('click', confirmRegistration);
    DOM.changeEventBtn.addEventListener('click', changeEvent);
    DOM.backToUploadBtn.addEventListener('click', () => {
        DOM.validationErrorsCard.classList.remove('show');
        goToStep(1);
    });
    DOM.downloadErrorBtn.addEventListener('click', downloadErrorReport);

    // Event selection
    document.querySelectorAll('.select-event-btn').forEach(btn => {
        btn.addEventListener('click', selectEvent);
    });
}

async function tokenVerification() {
    const accessToken = localStorage.getItem('accessToken');

    if (!accessToken) {
        showErrorMessage("Acesso Negado", "Você precisa estar logado para acessar esta página.");
        logoutUser();
        return;
    }

    try{
        const result = await verifyToken(accessToken);

        if(result.error) {
            showErrorMessage("Token Inválido", result.error);
            logoutUser();
            return
        }
    }catch (error) {
        console.error("Erro ao verificar token:", error);
        showErrorMessage("Erro de Autenticação", "Ocorreu um erro ao verificar seu token. Por favor, faça login novamente.");
        logoutUser();
        return;
    }
}

function setupNavigation() {
  document.querySelectorAll(".sidebar-navigation li").forEach(li => {
    li.addEventListener('click', () => {
      const span = li.querySelector(".tooltip");
      if (span && span.id && span.id !== 'logout') {
        window.location.href = `${span.id}.html`;
      }
    });
  });
}



function setupLogoutButton() {
  if (DOM.logoutBtn) {
    DOM.logoutBtn.addEventListener('click', logoutUser);
  }
}

function setupFileUpload() {
    DOM.fileUploadInput.addEventListener('change', handleFileSelect);

    // Drag and drop
    const dropArea = document.getElementById('drop-area');
    dropArea.addEventListener('dragover', handleDragOver);
    dropArea.addEventListener('dragleave', handleDragLeave);
    dropArea.addEventListener('drop', handleDrop);
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (file) {
        DOM.fileNameDisplay.textContent = file.name;
        DOM.fileNameDisplay.classList.add('has-file');
        DOM.uploadFileBtn.disabled = false;
        document.getElementById('drop-area').classList.add('file-selected');
    }
}

function handleDragOver(event) {
    event.preventDefault();
    event.currentTarget.classList.add('drag-over');
}

function handleDragLeave(event) {
    event.currentTarget.classList.remove('drag-over');
}

function handleDrop(event) {
    event.preventDefault();
    const dropArea = event.currentTarget;
    dropArea.classList.remove('drag-over');
    
    const file = event.dataTransfer.files[0];
    if (file && file.name.endsWith('.xlsx')) {
        DOM.fileUploadInput.files = event.dataTransfer.files;
        const changeEvent = new Event('change');
        DOM.fileUploadInput.dispatchEvent(changeEvent);
    }
}

function selectEvent(event) {
    const eventId = Number(event.currentTarget.dataset.id);
    const selectedEvent = state.events.find(e => e.id === eventId);
    
    if (selectedEvent) {
        state.selectedEvent = selectedEvent;
        localStorage.setItem("selectedEvent", JSON.stringify(selectedEvent));
        updateSelectedEventBanner(selectedEvent);
        document.getElementById('selected-event-banner').style.display = 'flex';
        DOM.eventSelectionView.style.display = 'none';
        DOM.enrollmentProcess.classList.add('show');
        goToStep(0);
    }
}

function updateSelectedEventBanner(event) {
    const banner = document.getElementById('selected-event-banner');
    const eventLogo = document.getElementById('event-logo');
    const eventTitle = document.getElementById('event-title');
    const eventDates = document.getElementById('event-dates');
    
    if (!event || !banner) return;
    
    const date = new Date(event.data_limite);
    const formattedDate = date.toLocaleDateString('pt-BR');
    
    eventLogo.src = `../img/${event.descricao}.png`;
    eventLogo.alt = event.descricao;
    eventTitle.textContent = event.descricao;
    eventDates.textContent = `Data limite: ${formattedDate}`;
}

function changeEvent() {
    document.getElementById('selected-event-banner').style.display = 'none';
    DOM.eventSelectionView.style.display = 'block';
    DOM.enrollmentProcess.classList.remove('show');
}

function goToNextStep() {
    goToStep(currentStep + 1);
}

async function loadEvents() {
    showLoader();
    try {
        const events = await getEventList();
        if (events) {
            state.events = events;
            renderEvents(events);
        } else {
            showErrorPopup("Erro ao carregar eventos", "Não foi possível carregar a lista de eventos.");
        }
    } catch (error) {
        showErrorPopup("Erro ao carregar eventos", error.message || "Ocorreu um erro ao carregar os eventos.");
    } finally {
        hideLoader();
    }
}

function renderEvents(events) {
    DOM.eventSelectionView.innerHTML = '<h2 class="section-title">Selecione um evento</h2>';
    
    const eventCardsContainer = document.createElement('div');
    eventCardsContainer.className = 'event-cards-container';

    events.forEach(event => {
        const eventElement = document.createElement('div');
        eventElement.className = 'event-card';

        const date = new Date(event.data_limite);
        const formattedDate = date.toLocaleDateString('pt-BR');

        // 🔧 Filtrar tipos de inscrição com valor > 0
        const tiposPagos = event.tipo_inscricao.filter(type => parseFloat(type.valor) >= 0);

        eventElement.innerHTML = `
            <div class="event-header">
                <img src="../img/${event.descricao}.png" alt="${event.descricao}">
                <div class="event-info">
                    <h3>${event.descricao}</h3>
                    <p>Data limite: ${formattedDate}</p>
                </div>
            </div>
            <div class="event-prices">
                ${tiposPagos.map(type => `
                    <p><span>${type.descricao}:</span> <span>R$ ${type.valor}</span></p>
                `).join('')}
            </div>
            <button class="select-event-btn" data-id="${event.id}">
                Selecionar
            </button>
        `;

        eventCardsContainer.appendChild(eventElement);
    });

    DOM.eventSelectionView.appendChild(eventCardsContainer);

    document.querySelectorAll('.select-event-btn').forEach(btn => {
        btn.addEventListener('click', selectEvent);
    });
}


function scrollToTop() {
    if (window.innerWidth < 768) {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    }
}

function goToStep(step) {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('show');
    });

    let cardToShow;
    switch (step) {
        case 0:
            cardToShow = DOM.enrollmentTypeCard;
            DOM.stepTitle.textContent = "Etapa 1: Tipo de Inscrição";
            break;
        case 1:
            cardToShow = DOM.groupCard;
            DOM.stepTitle.textContent = "Etapa 2: Upload de Arquivo";
            break;
        case 2:
            cardToShow = DOM.groupListCard;
            DOM.stepTitle.textContent = "Etapa 3: Lista de Participantes";
            renderParticipantsTable(); // Renderiza a tabela quando chega nesta etapa
            break;
        case 3:
            cardToShow = DOM.confirmationCard;
            DOM.stepTitle.textContent = "Confirmação de Inscrição";
            renderConfirmationDetails(); // Preenche os detalhes de confirmação
            break;
    }

    if (cardToShow) {
        cardToShow.classList.add('show');
        currentStep = step;
        updateProgressBar();
    }

    if (step === 1) {
        DOM.fileNameDisplay.textContent = "Nenhum arquivo selecionado";
        DOM.fileNameDisplay.classList.remove('has-file');
        DOM.uploadFileBtn.disabled = true;
        document.getElementById('drop-area').classList.remove('file-selected');
    }

    scrollToTop();
}

function updateProgressBar() {
    const progressPercentage = (currentStep / 3) * 100;
    DOM.progressBar.style.width = `${progressPercentage}%`;

    DOM.progressSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep) {
            step.classList.add('active');
        }
    });
}

async function uploadFile() {
    const file = DOM.fileUploadInput.files[0];
    if (!file) {
        notificationSystem.showNotification('error', 'Erro', 'Nenhum arquivo selecionado');
        return;
    }

    const validExtensions = ['.xlsx', '.xls', '.ods', '.csv'];
    const fileExtension = file.name.slice(file.name.lastIndexOf('.')).toLowerCase();
    
    if (!validExtensions.includes(fileExtension)) {
        notificationSystem.showNotification(
            'error', 
            'Formato inválido', 
            'Por favor, envie um arquivo Excel (.xlsx, .xls) ou do Google Sheets (.ods, .csv)'
        );
        return;
    }

    const responsibleName = document.getElementById('responsible-name').value.trim();
    if (!responsibleName) {
        notificationSystem.showNotification(
            'error', 
            'Campo obrigatório', 
            'O nome do responsável é obrigatório'
        );
        return;
    }

    if (!state.selectedEvent) {
        notificationSystem.showNotification(
            'error', 
            'Evento não selecionado', 
            'Selecione um evento antes de enviar o arquivo'
        );
        return;
    }

    showLoader();
    
    try {
        const token = localStorage.getItem('accessToken');
        
        if (!token) {
            throw new Error('Usuário não autenticado');
        }

        const response = await postFileRegister(
            state.selectedEvent.id,
            responsibleName,
            file,
            token
        );

        console.log(response)

        if (response.error) {
            if (response.status === 401) {
                showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
                logoutUser();
                return;
            }

            if (response.status === 500) {
                throw new Error("Erro interno do servidor. Tente novamente mais tarde.");
            }

            hideLoader();
            showErrorMessage("Erro no envio", response.message || "Ocorreu um erro ao enviar o arquivo");
            showValidationErrors(response.errors);
        } else {
            hideLoader();
            
            // Armazena os participantes e renderiza a tabela
            state.participants = response.participants || [];
            state.uploadResponse = response;
            renderParticipantsTable();
            
            goToStep(2);
            notificationSystem.showNotification(
                'success', 
                'Arquivo enviado!', 
                'Os participantes foram importados com sucesso'
            );

            // Limpa o input de arquivo
            DOM.fileUploadInput.value = '';
            DOM.fileNameDisplay.textContent = "Nenhum arquivo selecionado";
        }
    } catch (error) {
        hideLoader();
        console.error("Erro no upload:", error);
        notificationSystem.showNotification(
            'error', 
            'Erro no envio', 
            error.message || 'Ocorreu um erro ao enviar o arquivo'
        );
    }
}

// Função para renderizar a tabela de participantes
function renderParticipantsTable() {
    const tableBody = document.getElementById('participants-table-body');
    tableBody.innerHTML = ''; // Limpa a tabela

    if (!state.participants || state.participants.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `<td colspan="5" class="text-center">Nenhum participante encontrado</td>`;
        tableBody.appendChild(row);
        return;
    }

    // Preenche a tabela com os participantes
    state.participants.forEach((participant, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${participant.nome_completo}</td>
            <td>${participant.idade}</td>
            <td>${participant.tipo_inscricao}</td>
            <td>${participant.sexo}</td>
        `;
        tableBody.appendChild(row);
    });
}

// Função para renderizar os detalhes de confirmação
function renderConfirmationDetails() {
    const confirmationDetails = document.querySelector('.confirmation-details');
    // Remove itens anteriores (exceto header e total)
    const itemsToRemove = confirmationDetails.querySelectorAll('.detail-item:not(.detail-header):not(.total)');
    itemsToRemove.forEach(item => item.remove());

    if (!state.participants || state.participants.length === 0) {
        return;
    }

    const types = state.uploadResponse?.typeInscription || [];
    let totalQuantity = 0;
    let totalValue = 0;

    // Normaliza os tipos de inscrição para comparação case-insensitive
    const normalizedTypes = types.map(type => ({
        ...type,
        normalized: type.descricao.toLowerCase()
    }));

    // Cria um mapa para contagem de tipos
    const typeCount = {};
    state.participants.forEach(participant => {
        const tipoNormalizado = participant.tipo_inscricao.toLowerCase();
        typeCount[tipoNormalizado] = (typeCount[tipoNormalizado] || 0) + 1;
    });

    // Para cada tipo de inscrição retornado no upload
    normalizedTypes.forEach(type => {
        const count = typeCount[type.normalized] || 0;

        // Converte o valor para número
        const valor = parseFloat(type.valor);
        const subtotal = count * valor;
        totalQuantity += count;
        totalValue += subtotal;

        const item = document.createElement('div');
        item.className = 'detail-item';
        item.setAttribute('data-type', type.normalized);
        item.innerHTML = `
                <span class="label">${type.descricao}:</span>
                <span class="value">${count}</span>
                <span class="value">R$ ${subtotal.toFixed(2)}</span>
            `;

        // Insere antes do separator
        const separator = confirmationDetails.querySelector('.separator');
        confirmationDetails.insertBefore(item, separator);
    });

    // Atualiza o total
    const totalElement = confirmationDetails.querySelector('.detail-item.total');
    totalElement.querySelector('.value:nth-child(2)').textContent = totalQuantity;
    totalElement.querySelector('.value:nth-child(3)').textContent = `R$ ${totalValue.toFixed(2)}`;
}

function showValidationErrors(errors) {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('show');
    });
    
    DOM.errorList.innerHTML = '';
    
    errors.forEach(error => {
        const li = document.createElement('li');
        li.innerHTML = `<span class="line-number">Linha ${error.line}:</span> ${error.message}`;
        DOM.errorList.appendChild(li);
    });
    
    DOM.validationErrorsCard.classList.add('show');
    DOM.stepTitle.textContent = "Erros no Arquivo";
}

function downloadErrorReport() {
    showLoader();
    
    setTimeout(() => {
        hideLoader();
        showSuccessMessage("Relatório de erros baixado com sucesso!\n\nVocê pode corrigir os erros diretamente no arquivo.");
    }, 1000);
}

async function confirmRegistration() {
    showLoader();
    try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
            showErrorMessage("Erro de Autenticação", "Você precisa estar logado para confirmar a inscrição.");
            logoutUser();
            return;
        }
        const eventSelectedId = state.selectedEvent.id;
        const uniqueId = state.uploadResponse.uniqueId;

        const response =  await confirmRegister(eventSelectedId, uniqueId, token);
        console.log(response);

        if (response.status === 401) {
            showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
            logoutUser();
            return;
        }

        if (response.success === false) {

            if (response.status === 404) {
                showErrorMessage("Dados não encontrados", "Dados não encontrados no cache ou expirados.")
            }

            if( response.status === 500) {
                showErrorMessage("Erro interno do servidor", response.message || "Ocorreu um erro interno no servidor. Tente novamente mais tarde." );
                return;
            }
            showErrorMessage("Erro ao confirmar inscrição", response.message || "Ocorreu um erro ao confirmar a inscrição.");
        }
        else {
            showSuccessMessage("Inscrição confirmada!", "Sua inscrição foi confirmada com sucesso.");
            goToStep(0);
            location.reload(); // Recarrega a página para atualizar o estado
        }
    } catch (error) {
        console.error("Erro ao confirmar inscrição:", error);
        showErrorMessage("Erro ao confirmar inscrição", error.message || "Ocorreu um erro ao confirmar a inscrição.");
    } finally {
        hideLoader();
    }
}

function logoutUser() {
  // Confirmação antes de sair
  const confirmed = confirm("Tem certeza que deseja sair do sistema?");
  
  if (confirmed) {
    localStorage.removeItem("accessToken");
    showSuccessMessage("Logout realizado", "Você saiu do sistema com sucesso!");
    
    // Redireciona após um breve delay
    setTimeout(() => {
      location.href = "loginManagement.html";
    }, 1500);
  }
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

// Initialize the application
document.addEventListener('DOMContentLoaded', init);