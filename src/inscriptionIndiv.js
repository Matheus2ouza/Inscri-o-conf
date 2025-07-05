import { verifyToken } from "../router/authRoutes.js";
import { getEventList } from "../router/dataRoutes.js";
import { postIndividualRegister, confirmRegisterUnique } from "../router/registrationRoutes.js"
import { NotificationSystem } from './notification.js';

// Inicialize o sistema de notificações:
const notificationSystem = new NotificationSystem();

// State object to store application data
const state = {
    events: [],
    selectedEvent: null,
    responsibleName: '',
    participant: {
        name: '',
        dateBirth: '',
        gender: '',
        typeInscription: ''
    },
    registrationTypes: [],
    outstandingBalance: '',
    participantValidated: {},
    uniqueId: '',
};

// DOM Elements
const DOM = {
    // Containers
    eventSelectionView: document.getElementById('event-selection-view'),
    enrollmentProcess: document.getElementById('enrollment-process'),
    progressBar: document.querySelector('.progress-bar'),
    cardsContainer: document.querySelector('.cards-container'),

    // Cards
    responsibleCard: document.getElementById('card-responsible'),
    participantCard: document.getElementById('card-participant'),
    confirmationCard: document.getElementById('card-confirmation'),
    validationErrorsCard: document.getElementById('card-validation-errors'),

    // Form fields
    responsibleName: document.getElementById('responsible-name'),
    firstName: document.getElementById('first-name'),
    lastName: document.getElementById('last-name'),
    birthDate: document.getElementById('birth-date'),
    gender: document.getElementById('gender'),
    registrationType: document.getElementById('registration-type'),

    // Confirmation fields
    confirmResponsible: document.getElementById('confirm-responsible'),
    confirmParticipant: document.getElementById('confirm-participant'),
    confirmBirthDate: document.getElementById('confirm-birth-date'),
    confirmGender: document.getElementById('confirm-gender'),
    confirmRegistrationType: document.getElementById('confirm-registration-type'),
    confirmTotalValue: document.getElementById('confirm-total-value'),

    // Buttons
    changeEventBtn: document.getElementById('change-event-btn'),
    nextToParticipantBtn: document.getElementById('next-to-participant-btn'),
    backToResponsibleBtn: document.getElementById('back-to-responsible-btn'),
    nextToConfirmationBtn: document.getElementById('next-to-confirmation-btn'),
    backToParticipantBtn: document.getElementById('back-to-participant-btn'),
    confirmRegistrationBtn: document.getElementById('confirm-registration-btn'),
    backToFormBtn: document.getElementById('back-to-form-btn'),

    // Error list
    errorList: document.getElementById('error-list'),

    // Progress
    progressSteps: document.querySelectorAll('.progress-step'),
    mobileSteps: document.querySelectorAll('.mobile-step'),
    stepTitle: document.getElementById('step-title'),

    // Loader
    loader: document.getElementById('loader')
};

// Current step
let currentStep = 0;

function init() {
    // Load any saved state
    const savedEvent = localStorage.getItem("selectedEvent");
    if (savedEvent) {
        state.selectedEvent = JSON.parse(savedEvent);
        state.registrationTypes = state.selectedEvent.tipo_inscricao;
        updateSelectedEventBanner(state.selectedEvent);
        populateRegistrationTypes();
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
    setupNavigation();
    setupLogoutButton()
}

function setupEventListeners() {
    // Navigation buttons
    DOM.nextToParticipantBtn.addEventListener('click', validateResponsible);
    DOM.backToResponsibleBtn.addEventListener('click', () => goToStep(0));
    DOM.nextToConfirmationBtn.addEventListener('click', validateParticipant);
    DOM.backToParticipantBtn.addEventListener('click', () => goToStep(1));
    DOM.confirmRegistrationBtn.addEventListener('click', confirmRegistration);
    DOM.changeEventBtn.addEventListener('click', changeEvent);
    DOM.backToFormBtn.addEventListener('click', () => {
        DOM.validationErrorsCard.classList.remove('show');
        goToStep(1);
    });

    // Event selection
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('select-event-btn')) {
            selectEvent(e);
        }
    });

    // Date mask
    DOM.birthDate.addEventListener('input', formatBirthDate);
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
    } catch (error) {
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

function formatBirthDate() {
    let value = DOM.birthDate.value.replace(/\D/g, '');
    
    if (value.length > 2) {
        value = value.substring(0, 2) + '/' + value.substring(2);
    }
    
    if (value.length > 5) {
        value = value.substring(0, 5) + '/' + value.substring(5, 9);
    }
    
    DOM.birthDate.value = value;
}

function validateResponsible() {
    const errors = [];
    
    if (!DOM.responsibleName.value.trim()) {
        errors.push('O nome do responsável é obrigatório');
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    state.responsibleName = DOM.responsibleName.value.trim();
    goToStep(1);
}

async function verifyParticipant(data) {
    showLoader();
    const eventSelectedId = state.selectedEvent.id;
    const responsible = state.responsibleName;
    const token = localStorage.getItem('accessToken');
    data = state.participant;

    try {
        const result = await postIndividualRegister(data, eventSelectedId, token, responsible)

        if(result.status === 401) {
            showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
            logoutUser();
        }

        if (result.success === false) {
            hideLoader();
            showErrorMessage("Erro no envio", result.message || "Ocorreu um erro ao enviar o arquivo");
            showValidationErrors(result.errors);
            return
        }

        state.uniqueId = result.uniqueId
        state.outstandingBalance = result.outstandingBalance
        state.participantValidated = result.participant
        state.responsibleName = result.responsible
        updateConfirmationData()

    }catch (error) {
        console.error('Error de envio', error);
        showErrorMessage('Erro no envio', error.message || 'Ocorreu um erro ao enviar o arquivo')
    }finally {
        hideLoader()
    }
}

function validateParticipant() {
    const errors = [];
    
    if (!DOM.firstName.value.trim()) {
        errors.push('O nome do participante é obrigatório');
    }
    
    if (!DOM.lastName.value.trim()) {
        errors.push('O sobrenome do participante é obrigatório');
    }
    
    if (!DOM.birthDate.value.trim()) {
        errors.push('A data de nascimento é obrigatória');
    }
    
    if (!DOM.gender.value) {
        errors.push('O sexo é obrigatório');
    }
    
    if (!DOM.registrationType.value) {
        errors.push('O tipo de inscrição é obrigatório');
    }
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    // Atualiza os dados do participante no state
    state.participant = {
        ...state.participant,
        name: `${DOM.firstName.value.trim()} ${DOM.lastName.value.trim()}`,
        dateBirth: DOM.birthDate.value.trim(),
        gender: DOM.gender.value.trim(),
        typeInscription: DOM.registrationType.value
    };

    verifyParticipant(state.participant);
    goToStep(2);
}

function updateConfirmationData() {
    DOM.confirmResponsible.textContent = state.responsibleName;
    DOM.confirmParticipant.textContent = state.participantValidated.nome_completo;
    DOM.confirmBirthDate.textContent = state.participantValidated.idade;
    DOM.confirmGender.textContent = state.participantValidated.sexo;

    DOM.confirmRegistrationType.textContent = state.participantValidated.tipo_inscricao;

    DOM.confirmTotalValue.textContent = `R$ ${Number(state.outstandingBalance).toFixed(2).replace('.', ',')}`;

}

function selectEvent(event) {
    const eventId = Number(event.currentTarget.dataset.id);
    const selectedEvent = state.events.find(e => e.id === eventId);
    
    if (selectedEvent) {
        state.selectedEvent = selectedEvent;
        // Armazenar tipos de inscrição no state
        state.registrationTypes = selectedEvent.tipo_inscricao;
        localStorage.setItem("selectedEvent", JSON.stringify(selectedEvent));
        updateSelectedEventBanner(selectedEvent);
        populateRegistrationTypes(); // Preencher o dropdown
        document.getElementById('selected-event-banner').style.display = 'flex';
        DOM.eventSelectionView.style.display = 'none';
        DOM.enrollmentProcess.classList.add('show');
        goToStep(0);
    }
}

function populateRegistrationTypes() {
    // Limpar opções existentes
    DOM.registrationType.innerHTML = '<option value="" disabled selected>Selecione o tipo de inscrição</option>';
    
    // Verificar se existem tipos de inscrição
    if (!state.registrationTypes || state.registrationTypes.length === 0) {
        return;
    }
    
    // Filtrar apenas tipos válidos (valor >= 0)
    const validTypes = state.registrationTypes.filter(type => parseFloat(type.valor) >= 0);
    
    // Adicionar cada tipo como opção
    validTypes.forEach(type => {
        const option = document.createElement('option');
        option.value = type.descricao.toLowerCase();
        option.textContent = `${type.descricao} - R$ ${parseFloat(type.valor).toFixed(2).replace('.', ',')}`;
        DOM.registrationType.appendChild(option);
    });
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

        // 🔧 Filtrar tipos de inscrição com valor >= 0
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
            cardToShow = DOM.responsibleCard;
            DOM.stepTitle.textContent = "Etapa 1: Responsável pela Inscrição";
            break;
        case 1:
            cardToShow = DOM.participantCard;
            DOM.stepTitle.textContent = "Etapa 2: Dados do Participante";
            break;
        case 2:
            cardToShow = DOM.confirmationCard;
            DOM.stepTitle.textContent = "Confirmação de Inscrição";
            break;
    }

    if (cardToShow) {
        cardToShow.classList.add('show');
        currentStep = step;
        updateProgressBar();
    }

    scrollToTop();
}

function updateProgressBar() {
    const progressPercentage = (currentStep / 2) * 100;
    DOM.progressBar.style.width = `${progressPercentage}%`;

    // Atualiza os passos do desktop
    DOM.progressSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep) {
            step.classList.add('active');
        }
    });

    // Atualiza os passos do mobile
    DOM.mobileSteps.forEach((step, index) => {
        step.classList.remove('active', 'completed');
        if (index < currentStep) {
            step.classList.add('completed');
        } else if (index === currentStep) {
            step.classList.add('active');
        }
    });
}

function showValidationErrors(errors) {
    document.querySelectorAll('.card').forEach(card => {
        card.classList.remove('show');
    });
    
    DOM.errorList.innerHTML = '';
    
    errors.forEach(error => {
        const li = document.createElement('li');
        li.textContent = error;
        DOM.errorList.appendChild(li);
    });
    
    DOM.validationErrorsCard.classList.add('show');
    DOM.stepTitle.textContent = "Erros no Formulário";
}

async function confirmRegistration() {
    showLoader();
    const uniqueId = state.uniqueId;
    const selectedEvent = state.selectedEvent.id
    const token = localStorage.getItem('accessToken');

    if (!token) {
        showErrorMessage("Erro de Autenticação", "Você precisa estar logado para confirmar a inscrição.");
        logoutUser();
        return;
    }

    try {
        const result = await confirmRegisterUnique(selectedEvent, uniqueId, token)

        if (result.status === 401) {
            showErrorMessage("Sessão expirada", "Sua sessão expirou. Por favor, faça login novamente.");
            logoutUser();
            return;
        }

        if (result.success === false) {
            if (result.status === 404) {
                showErrorMessage("Dados não encontrados", "Dados não encontrados no cache ou expirados.")
            }

            if (response.status === 500) {
                showErrorMessage("Erro interno do servidor", result.message || "Ocorreu um erro interno no servidor. Tente novamente mais tarde.");
                return;
            }
            showErrorMessage("Erro ao confirmar inscrição", result.message || "Ocorreu um erro ao confirmar a inscrição.");
        }

        showSuccessMessage("Inscrição confirmada!", "Sua inscrição foi confirmada com sucesso.");
        resetForm()

    } catch (error) {
        console.error("Erro ao confirmar inscrição:", error);
        showErrorMessage("Erro ao confirmar inscrição", "Ocorreu um erro ao confirmar a inscrição.");
    } finally {
        hideLoader();
    }
}

function resetForm() {
    // Limpa os campos do formulário
    DOM.responsibleName.value = '';
    DOM.firstName.value = '';
    DOM.lastName.value = '';
    DOM.birthDate.value = '';
    DOM.gender.value = '';
    DOM.registrationType.value = '';
    
    // Volta para a primeira etapa
    goToStep(0);
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