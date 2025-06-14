import { verifyToken, refreshAccessToken } from "../router/authRoutes.js";
import { postFileRegister } from "../router/registrationRoutes.js"
import { getEventList } from "../router/dataRoutes.js";

const checkbox = document.querySelector("#chk");

let accessToken = localStorage.getItem("accessToken");
let eventList

/**
 * Funções de Loader
 */
function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.toggle('hiddenLoader', !show);
}

/**
 * Ativa ou desativa o modo escuro.
 */
function darkModeToggle() {
    checkbox.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
    });
}
/**
 * PopUp de erro
 */
function PopUpError(title, message) { //Recebe dos parametros o titulo e a messagem para serem mostrados para o usuario. 
    const popUp = document.querySelector(".error-popup"),
        titleError = document.querySelector("#error-title"),
        messageError = document.querySelector("#error-message");

    titleError.textContent = title;
    messageError.textContent = message;
    popUp.classList.remove("hiddenError");
}

//Button de close do popUpError
document.querySelector(".close-btn").addEventListener("click", () => {
    const popUp = document.querySelector(".error-popup")

    popUp.classList.add("hiddenError");
})

/**
 * Controle para mudar de pagina de acordo com o button 
 */
function movimentPage() {
    document.querySelectorAll(".sidebar-navigation li").forEach(li => {
        li.style.cursor = "pointer";

        li.addEventListener('click', () => {
            const span = li.querySelector(".tooltip"); // Encontra o span dentro do li

            if (span && span.id) {
                const pageId = span.id;
                const pageURL = `${pageId}.html`;

                // Verifica se a página existe antes de redirecionar
                fetch(pageURL, { method: 'HEAD' })
                    .then(res => {
                        if (res.ok) {
                            window.location.href = pageURL;
                        } else {
                            console.error(`Página não encontrada: ${pageURL}`);
                            alert('Página não encontrada!');
                        }
                    })
                    .catch(() => {
                        console.error(`Erro ao tentar acessar: ${pageURL}`);
                        alert('Erro ao tentar acessar a página!');
                    });
            } else {
                console.error("ID do span não encontrado.");
                alert('Página inválida!');
            }
        });
    });
};

/**
 * Verifica a validade do token de acesso.
 */
async function tokenVerification() {
    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        redirectToLogin("Token não encontrado. Faça login novamente.");
        return;
    }

    try {
        let result = await verifyToken(accessToken);

        if (result.error) {
            if (result.status === 401) {
                console.log("Token expirado. Tentando obter um novo...");

                const newTokens = await refreshAccessToken();

                if (newTokens?.accessToken) {
                    localStorage.setItem("accessToken", newTokens.accessToken);
                    console.log("Novo accessToken obtido com sucesso!");
                    return;
                }
            }

            handleTokenError(result.status);
        }
    } catch (error) {
        console.error("Erro ao verificar o token:", error);
        redirectToLogin("Erro ao verificar sua sessão. Faça login novamente.");
    }
}

function handleTokenError(status) {
    if (status === 401) {
        alert("Sua sessão expirou. Faça login novamente.");
    } else if (status === 401) {
        alert("Acesso negado. Token inválido.");
    } else {
        alert("Erro na autenticação. Faça login novamente.");
    }

    logoutUser();
}

function redirectToLogin(message) {
    alert(message);
    logoutUser();
}

function logoutUser() {
    localStorage.removeItem("accessToken");
    location.href = "loginManagement.html";
}

function checkPreviousEventSelection() {
    const storedEvent = localStorage.getItem("selectedEvent");

    if (!storedEvent) {
        document.querySelector(".popup").classList.add("hiddenEvent");
        return;
    }

    const eventSelected = JSON.parse(storedEvent);
    const eventPopUp = document.querySelector(".popup");

    eventPopUp.classList.remove("hiddenEvent");

    const eventName = document.querySelector("#event-name");
    const eventImage = document.querySelector("#event-image");

    eventName.textContent = eventSelected.descricao;
    eventImage.src = `../img/${eventSelected.descricao}.png`;
}

// Eventos do popup de evento selecionado anteriormente
document.querySelector("#continue-button").addEventListener("click", () => {
    document.querySelector(".popup").classList.add("hiddenEvent");
    controlEvent(); // Mostra o card de inscrição se o evento estiver selecionado
});

document.querySelector("#change-button").addEventListener("click", () => {
    localStorage.removeItem("eventSelected");
    document.querySelector(".popup").classList.add("hiddenEvent");
    controlEvent(); // Retorna à tela de seleção de eventos
});

async function createcardEvent() {
    toggleLoader(true); // Ativa o loader

    eventList = await getEventList();

    const eventContainer = document.querySelector(".event-container");
    eventContainer.innerHTML = ""; // Limpa o conteúdo anterior

    Object.values(eventList).forEach(event => {
        const eventgroup = document.createElement("div");
        eventgroup.classList.add("event-group");

        const eventHeader = document.createElement("div");
        eventHeader.classList.add("event-header");

        const img = document.createElement("img");
        const imageName = event.descricao;
        img.src = `../img/${imageName}.png`;
        img.alt = `Evento ${event.id}`;

        const eventInfo = document.createElement("div");
        eventInfo.classList.add("event-info");

        const h3 = document.createElement("h3");
        h3.textContent = event.descricao;

        const pDate = document.createElement("p");
        const data = new Date(event.data_limite);
        const dataformatted = data.toLocaleDateString('pt-BR')
        pDate.textContent = `Data: ${dataformatted}`;

        eventInfo.appendChild(h3);
        eventInfo.appendChild(pDate);

        eventHeader.appendChild(img);
        eventHeader.appendChild(eventInfo);

        const eventDetails = document.createElement("div");
        eventDetails.classList.add("event-details");

        event.tipo_inscricao.forEach(tipo => {
            const p = document.createElement("p");
            p.textContent = `${tipo.descricao}: R$ ${tipo.valor}`;
            eventDetails.appendChild(p);
        });

        const button = document.createElement('button');
        button.classList.add('select-event-btn');
        button.textContent = 'Selecionar';
        button.dataset.eventId = event.id;

        button.addEventListener('click', () => {
            const selectedEventId = event.id
            const selectedEvent = {
                id: event.id,
                descricao: event.descricao
            };

            localStorage.setItem("selectedEvent", JSON.stringify(selectedEvent));
            localStorage.setItem("selectedEventId", selectedEventId);
            controlEvent();
        });

        // Monta todo o card
        eventgroup.appendChild(eventHeader);
        eventgroup.appendChild(eventDetails);
        eventgroup.appendChild(button);

        // Adiciona ao container
        eventContainer.appendChild(eventgroup);
    });
    toggleLoader(false); // Desativa o loader
}

function controlEvent() {
    const eventcontainer = document.querySelector(".event-container");
    const enrollmentContainer = document.querySelector(".enrollment-container");

    if (localStorage.getItem("selectedEvent")) {

        eventcontainer.classList.remove("flex");
        enrollmentContainer.classList.add("flex");
    } else {
        eventcontainer.classList.add("flex");
        enrollmentContainer.classList.remove("flex");
    }
}

document.querySelector("#close-enrollment-btn").addEventListener("click", () => {
    localStorage.removeItem("selectedEventId");
    localStorage.removeItem("selectedEvent");

    // Limpa o campo de nome do responsável
    const responsibleName = document.querySelector("#responsible-name");
    responsibleName.value = "";

    // Desmarca os radio buttons
    const radioButtons = document.querySelectorAll('input[name="inscription"]');
    radioButtons.forEach(radio => radio.checked = false);

    controlEvent();
});

// Definindo os passos de inscrição
const stepGroup = ['Dados', 'Lista', 'Confirmação'];
const stepIndividual = ['Dados', 'Confirmação'];

let currentStepIndex = -1; // Antes da primeira etapa
let currentSteps = [];
let selectedOption = null; // Armazena a escolha do usuário

const titleStep = document.querySelector("#step-title");
const radioButtons = document.querySelectorAll('input[name="inscription"]');

// Selecionando os cards
const cards = {
    default: document.querySelector(".card-default"),
    individual: document.querySelector(".card-inscription-unique"),
    group: document.querySelector(".card-inscription-group"),
    listGroup: document.querySelector(".card-list-group"),
    confirmation: document.querySelector(".card-confirmation"),
};

// Selecionando o container de progresso
const progressContainer = document.querySelector('.progress-container');

// Função para esconder todos os cards
function hideAllCards() {
    Object.values(cards).forEach(card => card.classList.remove("show"));
}

// Função para atualizar os cards com base na etapa atual
function updateCards() {
    hideAllCards();

    if (currentStepIndex === -1) {
        cards.default.classList.add("show"); // Exibe o card inicial
    } else {
        if (JSON.stringify(currentSteps) === JSON.stringify(stepIndividual)) {
            if (currentStepIndex === 0) {
                cards.individual.classList.add("show");
            } else if (currentStepIndex === 1) {
                cards.confirmation.classList.add("show"); // Exibe confirmação para inscrição individual
            }
        } else if (JSON.stringify(currentSteps) === JSON.stringify(stepGroup)) {
            if (currentStepIndex === 0) {
                cards.group.classList.add("show");
            } else if (currentStepIndex === 1) {
                cards.listGroup.classList.add("show"); // Exibe lista de grupo
            } else if (currentStepIndex === 2) {
                cards.confirmation.classList.add("show"); // Exibe confirmação para inscrição em grupo
            }
        }
    }

    attachButtonEvents(); // Atualiza eventos dos botões no novo card
}

// Função para atualizar a escolha de inscrição sem mudar de card
function updateStepsBasedOnSelection() {
    selectedOption = document.querySelector('input[name="inscription"]:checked');
}

// Função que avança para o próximo passo
async function nextStep() {
    if (currentStepIndex === -1) {
        const responsibleName = document.querySelector("#responsible-name").value;
        if (!selectedOption || responsibleName === "") return; // Impede avanço sem selecionar uma opção

        // Define os passos com base no tipo de inscrição escolhido
        currentSteps = selectedOption.value === 'group' ? stepGroup : stepIndividual;
        currentStepIndex = 0;

        updateStepTitle();
        updateProgressSteps();
        updateCards();
        return;
    }

    // Verificando se a inscrição é do tipo grupo
    if (JSON.stringify(currentSteps) === JSON.stringify(stepGroup)) {
        if (currentStepIndex === 0) {
            // Exibe o card de "Grupo" (primeira etapa)
            currentStepIndex++;
            updateStepTitle();
            updateProgressSteps();
            updateCards();
            return;
        }

        if (currentStepIndex === 1) {
            // Exibe o card de "Lista de Grupo" (segunda etapa)
            currentStepIndex++;
            updateStepTitle();
            updateProgressSteps();
            updateCards();
            return;
        }
    }

    // Para inscrição individual
    if (JSON.stringify(currentSteps) === JSON.stringify(stepIndividual)) {
        if (currentStepIndex < currentSteps.length - 1) {
            currentStepIndex++; // Avança para o próximo passo
            updateStepTitle();
            updateProgressSteps();
            updateCards();
        }
    }
}

// Função que volta para a etapa anterior
function prevStep() {
    if (currentStepIndex > 0) {
        currentStepIndex--; // Retorna ao passo anterior
        updateStepTitle();
        updateProgressSteps();
        updateCards();
    } else {
        currentStepIndex = -1; // Retorna ao card inicial
        titleStep.textContent = "Etapa 1: Tipo de Inscrição";

        // Limpa a seleção do rádio button e o selectedOption
        const radioButtons = document.querySelectorAll('input[name="inscription"]');
        radioButtons.forEach(radio => radio.checked = false); // Desmarca todos os radio buttons

        selectedOption = null; // Reseta a seleção

        updateProgressSteps();
        updateCards();
    }
}

// Atualiza o título da etapa
function updateStepTitle() {
    if (currentStepIndex >= 0 && currentStepIndex < currentSteps.length) {
        titleStep.textContent = `Etapa ${currentStepIndex + 2}: ${currentSteps[currentStepIndex]}`;
    }
}

function updateProgressSteps() {
    progressContainer.innerHTML = ''; // Limpa os passos anteriores

    // Cria a primeira etapa (Tipo de Inscrição)
    const firstStep = document.createElement('div');
    firstStep.classList.add('progress-step');
    firstStep.setAttribute('data-step', '1');
    firstStep.innerHTML = '<p>Tipo de Inscrição</p>';

    // Marca como active se estiver no card inicial
    if (currentStepIndex === -1) {
        firstStep.classList.add('active');
        progressContainer.appendChild(firstStep);
        return; // Não adiciona mais passos enquanto estiver no card-default
    }

    // Se já passou da escolha, mostra a primeira como completada
    firstStep.classList.add('completed');
    progressContainer.appendChild(firstStep);

    // Adiciona as demais etapas com base nos passos atuais
    currentSteps.forEach((step, index) => {
        const stepDiv = document.createElement('div');
        stepDiv.classList.add('progress-step');
        stepDiv.setAttribute('data-step', `${index + 2}`);
        stepDiv.innerHTML = `<p>${step}</p>`;

        if (index < currentStepIndex) {
            stepDiv.classList.add('completed');
        } else if (index === currentStepIndex) {
            stepDiv.classList.add('active');
        } else {
            stepDiv.classList.add('pending');
        }

        progressContainer.appendChild(stepDiv);
    });
}

// Atualiza os eventos dos botões, removendo duplicação
function attachButtonEvents() {
    document.querySelectorAll(".next-btn").forEach(btn => {
        // Verifica se o botão não é o de upload antes de adicionar o evento de nextStep
        if (!btn.classList.contains("upload-btn")) {
            btn.removeEventListener("click", nextStep);
            btn.addEventListener("click", nextStep);
        }
    });

    document.querySelectorAll(".prev-btn").forEach(btn => {
        btn.removeEventListener("click", prevStep);
        btn.addEventListener("click", prevStep);
    });
}

// Selecionando o input de upload e o elemento de exibição do nome do arquivo
const fileInput = document.getElementById("file-upload");
const fileNameDisplay = document.querySelector(".file-name");
const uploadButton = document.querySelector(".upload-btn");


function handlesFileUpload(file) {
    if (file) {
        // Atualiza a exibição do nome do arquivo
        fileNameDisplay.textContent = `📄 ${file.name}`;
        fileNameDisplay.classList.add("users");
        uploadButton.disabled = false;

        // Cria um novo objeto FileList e atualiza o input de upload
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        fileInput.files = dataTransfer.files;
    }
}

function setupDragAndDrop() {
    const dropArea = document.querySelector(".drop-area");

    dropArea.addEventListener("dragover", (event) => {
        event.preventDefault();
        dropArea.classList.add("drag-over");
    });

    dropArea.addEventListener("dragleave", () => {
        dropArea.classList.remove("drag-over");
    });

    dropArea.addEventListener("drop", (event) => {
        event.preventDefault();
        dropArea.classList.remove("drag-over");

        const file = event.dataTransfer.files[0];

        if (file) {
            handlesFileUpload(file);
        }
    });
}

fileInput.addEventListener("change", (event) => {
    const file = event.target.files[0];

    if (file) {
        handlesFileUpload(file);
    }
});

function showErrorCard(response = {}) {
    const errorCard = document.querySelector(".card-list-error");

    const errorConfigs = [
        {
            key: 'missingData',
            sectionId: '#error-missing-data',
            listClass: '.missing-data-list',
            getMenssages: item => item.field.map(field => `Falta de dados na linha ${item.row}: ${field}`)
        },
        {
            key: 'invalidNames',
            sectionId: '#error-duplicated-names',
            listClass: '.duplicated-names-list',
            getMenssages: item => [`Nome inválido ou duplicado na linha ${item.row}: ${item.name}`]
        },
        {
            key: 'invalidBirthDates',
            sectionId: '#error-invalid-ages',
            listClass: '.invalid-ages-list',
            getMenssages: item => [`Data de nascimento inválida na linha ${item.row}: ${item.field}`]
        },
        {
            key: "invalidRegistrationTypes",
            sectionId: "#error-invalid-types",
            listClass: ".invalid-types-list",
            getMenssages: item => [`Tipo de inscrição inválido na linha ${item.row}: ${item.field}`]
        }
    ];

    let hasAnyError = false;

    errorConfigs.forEach(({ key, sectionId, listClass, getMenssages }) => {
        const section = document.querySelector(sectionId);
        const list = document.querySelector(listClass);

        //limpa a lista
        list.innerHTML = "";
        section.classList.remove("show");

        const data = response[key];
        if (Array.isArray(data) && data.length > 0) {
            data.forEach(item => {
                getMenssages(item).forEach(msg => {
                    const li = document.createElement("li");
                    li.textContent = msg;
                    list.appendChild(li);
                });
            });

            section.classList.add("show");
            hasAnyError = true;
        }
    });

    if (hasAnyError) {
        hideAllCards();
        errorCard.classList.add("show");
        titleStep.textContent = "Erro no arquivo de inscrição";

        const activeStep = document.querySelector('.progress-step.active');
        if (activeStep) {
            activeStep.classList.add('error'); // Marca a etapa ativa com erro
        }
    }
};

// Adiciona o listener apenas ao botão dentro do card de erro
document.querySelector(".card-list-error #prev-card-default").addEventListener("click", () => {
    const errorCard = document.querySelector(".card-list-error");
    errorCard.classList.remove("show"); // Oculta o card de erro

    // Remove destaque vermelho da etapa atual, se existir
    const errorStep = document.querySelector(".progress-step.error");
    if (errorStep) {
        errorStep.classList.remove("error");
    }

    // Volta para o estado inicial
    currentStepIndex = -1;
    titleStep.textContent = "Etapa 1: Tipo de Inscrição";

    updateProgressSteps();
    updateCards();
});

function createList(inscriptions) {
    const tbody = document.querySelector("#list-table-body");
    tbody.innerHTML = "";  // Limpa o conteúdo da tabela antes de adicionar novos itens
    // Verifica se o array de inscrições existe e é um array
    if (Array.isArray(inscriptions)) {
        inscriptions.forEach((row, index) => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td><label>${index + 1}</label></td>
                <td><label>${row.name}</label></td>
                <td><label>${row.age}</label></td>
            `;
            tbody.appendChild(tr);
        });
    } else {
        console.error("No valid inscriptions data found");
    }
}

function structuringPaymenData(inscriptionCount, totais) {
    const formatCurrency = (value) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    // Mapeamento de nomes de chave para os labels da tabela e totais
    const map = {
        normal: { label: "Inscritos Normais", totalKey: "totalNormal" },
        meia: { label: "Inscritos Meia", totalKey: "totalMeia" },
        participação: { label: "Inscritos Participantes", totalKey: "totalParticipação" },
        serviço: { label: "Inscritos Serviço", totalKey: "totalServiço" }
    };

    // Atualizar cada linha
    Object.entries(map).forEach(([key, { label, totalKey }]) => {
        const item = Array.from(document.querySelectorAll('.detail-item')).find(
            (el) => el.querySelector('.label')?.textContent.includes(label)
        );

        if (item) {
            const spans = item.querySelectorAll('.value');
            const quantidade = inscriptionCount[key] || 0;
            const valor = totalKey ? (totais[totalKey] || 0) : 0;

            spans[0].textContent = quantidade;
            spans[1].textContent = formatCurrency(valor);
        }
    });

    // Total geral
    const totalItem = document.querySelector('.detail-item.total');
    if (totalItem) {
        const totalInscritos = Object.values(inscriptionCount).reduce((acc, val) => acc + val, 0);
        const totalValor = Object.values(totais).reduce((acc, val) => acc + val, 0);

        const spans = totalItem.querySelectorAll('.value');
        spans[0].textContent = totalInscritos;
        spans[1].textContent = formatCurrency(totalValor);
    }
}

/**
 * Passa o arquivo XLSX do usuario e passa para a API
 */
async function sendFile() {
    const eventSelectedId = localStorage.getItem("selectedEventId");
    const responsibleName = document.querySelector("#responsible-name").value
    const file = fileInput.files[0];

    if (!file) {
        PopUpError("Erro no Upload", "Arquivo de lista para inscrições não encontrado, selecione um arquivo antes para prosseguirmos com a inscrição");
        return false;
    }

    try {
        const response = await postFileRegister(eventSelectedId, responsibleName, file, accessToken);

        fileInput.value = '';
        fileNameDisplay.classList.remove("users");
        fileNameDisplay.textContent = 'Nenhum arquivo selecionado';
        uploadButton.disabled = true;

        if (response.status === 401) {
            console.log("Token expirado. Tentando obter um novo...");

            const newTokens = await refreshAccessToken();

            if (newTokens?.accessToken) {
                localStorage.setItem("accessToken", newTokens.accessToken);
                accessToken = newTokens.accessToken; // Atualiza o token atual
                return sendFile(); // Tenta enviar o arquivo novamente com o novo token
            } else {
                PopUpError("Erro no Upload", "Não foi possível obter um novo token de acesso.");
                return false;
            }
        }

        // Verifica o status da resposta
        if (response.status === 400) {
            PopUpError("Erro no Upload", response.message || "Erro desconhecido");
            return false;
        }

        console.log(response.data)
        // verifica se a api retornou dados errados
        if (response.data.errors && Object.keys(response.data.errors).length > 0) {
            PopUpError("Dados Inválidos", "O arquivo enviado contém dados inválidos. Verifique os seguintes erros");
            showErrorCard(response.data.errors);
            return false;
        }
        

        //Caso o upload tenha sido bem-sucedido, avança para o próximo passo
        nextStep();

        return true;

    } catch (error) {
        // Caso haja erro na requisição
        console.log(error);
        PopUpError("Erro no Upload", "Ocorreu um erro ao enviar o arquivo. Tente novamente mais tarde.");
        return false;
    }
}

// Evento de click no botão de upload
document.querySelector(".upload-btn").addEventListener("click", async (event) => {
    event.preventDefault();
    uploadButton.disabled = true;

    const fileUploaded = await sendFile();

});

// Inicializa a página
async function init() {
    darkModeToggle();
    await tokenVerification();
    checkPreviousEventSelection();
    controlEvent();
    createcardEvent()
    movimentPage();

    radioButtons.forEach(radio => radio.addEventListener("change", updateStepsBasedOnSelection));
    updateCards();
    setupDragAndDrop();
}

document.addEventListener("DOMContentLoaded", init);
