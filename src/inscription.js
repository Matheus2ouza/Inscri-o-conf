import { getLocations, registrarInscricao, registrarHospedagem } from './router.js';

let cities = [];
let isCitySelected = false;

// Funções de Loader
function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.toggle('hiddenLoader', !show);
}

// Funções para manipulação de cidades
async function fetchCityNames() {
    try {
        toggleLoader(true);
        const fetchedCities = await getLocations();
        cities = Object.values(fetchedCities);
        return cities.map(city => city.nome);
    } catch (error) {
        return [];
    } finally {
        toggleLoader(false);
    }
}

function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase();
    suggestions.innerHTML = '';

    const filteredCities = cityNames.filter(city => city.toLowerCase().includes(inputValue));
    suggestions.style.display = filteredCities.length > 0 && inputValue ? 'block' : 'none';

    filteredCities.forEach(city => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = city;

        item.addEventListener('click', async () => {
            input.value = city;
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            isCitySelected = true;  // Marca que a cidade foi selecionada

            // Verificar cidade ao clicar em uma sugestão
            const isValid = await checkLocation();
            toggleRegisterButton(isValid);

            // Impede a verificação no evento de input após o clique
            setTimeout(() => {
                isCitySelected = false;  // Reseta a variável para permitir futuras interações
            }, 500);  // Reseta após um pequeno atraso para garantir que o clique seja processado
        });

        suggestions.appendChild(item);
    });
}

document.getElementById('adicionar-nome-btn').addEventListener('click', function() {
    const nomeHospedagem = document.getElementById('nome_hospedagem').value.trim();
    if (nomeHospedagem) {
        const listaNomes = document.getElementById('lista-nomes-hospedagem');
        const li = document.createElement('li');
        li.textContent = nomeHospedagem;

        const removeBtn = document.createElement('span');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('remove-nome');

        li.appendChild(removeBtn);
        listaNomes.appendChild(li);
        document.getElementById('nome_hospedagem').value = '';

        removeBtn.addEventListener('click', function() {
            listaNomes.removeChild(li);
        });
    } else {
        alert('Por favor, insira um nome válido.');
    }
});

// Função para verificar se a cidade é válida
async function checkLocation() {
    const locality = document.querySelector('#input1');
    const verification = document.querySelector('.verification');
    const suggestions = document.querySelector('#suggestions');

    const cityName = locality.value.trim().toUpperCase();
    const cityList = cities;

    return new Promise((resolve) => {
        setTimeout(() => {
            const cityExists = cityList.some(city => city.nome.toUpperCase() === cityName);
            if (cityExists) {
                verification.innerHTML = '<i class="bi bi-check2-circle"></i>';
                locality.style.border = 'solid 3px #67c453';
                suggestions.style.display = 'none';
                resolve(true);
            } else {
                verification.innerHTML = '<i class="bi bi-exclamation-triangle"></i>';
                locality.style.border = 'solid 3px #fa1d0b';
                resolve(false);
            }
        }, 1000);  // Atraso de 1000ms
    });
}

// Função para inicializar sugestões de cidades
async function initCitySuggestions() {
    const cityNames = await fetchCityNames();
    const input = document.getElementById('input1');
    const suggestions = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        if (!isCitySelected) {
            filterCities(cityNames, input, suggestions);
        }
    });

    // Verificação no evento blur para quando o usuário sair do campo de input
    input.addEventListener('blur', async () => {
        // Realiza a verificação apenas se a cidade não foi selecionada
        if (!isCitySelected) {
            const isValid = await checkLocation();
            toggleRegisterButton(isValid);
        }
        isCitySelected = false;  // Reseta a variável após o blur
    });
}

// Função para alternar o estado do botão de registro
function toggleRegisterButton(isValid) {
    document.querySelector('.btn-register').disabled = !isValid;
}

// Funções de Toggle para Formulários
function setupFormToggle(btnSelector, formSelector, formHTML) {
    const btnYes = document.querySelector(`${btnSelector}-yes`);
    const btnNo = document.querySelector(`${btnSelector}-no`);
    const formContainer = document.querySelector(formSelector);

    btnYes.addEventListener('click', (e) => {
        e.preventDefault();
        if (!formContainer.querySelector('form')) {
            formContainer.innerHTML = formHTML;
        }
    });

    btnNo.addEventListener('click', (e) => {
        e.preventDefault();
        formContainer.innerHTML = '';
    });
}

function setupServiceForm() {
    setupFormToggle('.btnServiço', '.form-service', `
        <form>
            <div class="form-container">
                <div class="form-group">
                    <label for="input8">Numero de Irmãos que irão servir -<span class="valor">R$ 100.00</span></label>
                    <input type="text" class="service-masc" placeholder="Se não houver coloque 0">
                </div>
                <div class="form-group">
                    <label for="input8">Numero de irmãs que irão servir -<span class="valor">R$ 100.00</span></label>
                    <input type="text" class="service-fem" placeholder="Se não houver coloque 0">
                </div>
            </div>
        </form>
    `);
}

function setupParticipationForm() {
    setupFormToggle('.btnParti', '.form-participacao', `
        <form>
            <div class="form-container">
                <div class="form-group">
                    <label for="input8">Irmãos que vão participar somente da reunião -<span class="valor">R$ 100.00</span></label>
                    <input type="text" class="participacao-masc" placeholder="Se não houver coloque 0">
                </div>
                <div class="form-group">
                    <label for="input8">Irmãs que vão participar somente da reunião -<span class="valor">R$ 100.00</span></label>
                    <input type="text" class="participacao-fem" placeholder="Se não houver coloque 0">
                </div>
            </div>
        </form>
    `);
}

function showPopup(message) {
    const popup = document.getElementById('popup');
    const popupContent = popup.querySelector('.popup-content p');
    popupContent.textContent = message;
    popup.style.display = 'flex';
}

function showPopupError(message) {
    const popup = document.getElementById('popupError');
    const popupContent = popup.querySelector('.popup-contentError p');
    popupContent.textContent = message;
    popup.style.display = 'flex';
}

document.querySelector('.close-btn').addEventListener('click', function() {
    window.location.reload();
});

document.querySelector('.close-btnError').addEventListener('click', function() {
    document.getElementById('popupError').style.display = 'none';
});

// Função para coletar dados do formulário e registrar a inscrição
async function register() {
    toggleLoader(true); 

    const locality = document.getElementById('input1').value.toUpperCase();
    const nameResponsavel = document.querySelector('.responsible').value;
    const age06masculine = document.querySelector('.age-06-masc').value || "0";
    const age06feminine = document.querySelector('.age-06-fem').value || "0";
    const age710masculine = document.querySelector('.age-710-masc').value || "0";
    const age710feminine = document.querySelector('.age-710-fem').value || "0";
    const age10masculine = document.querySelector('.age-10-masc').value || "0";
    const age10feminine = document.querySelector('.age-10-fem').value || "0";
    const serviceMasculine = document.querySelector('.service-masc') ? document.querySelector('.service-masc').value || "0" : "0";
    const serviceFeminine = document.querySelector('.service-fem') ? document.querySelector('.service-fem').value || "0" : "0";
    const participacaoMasculine = document.querySelector('.participacao-masc') ? document.querySelector('.participacao-masc').value || "0" : "0";
    const participacaoFeminine = document.querySelector('.participacao-fem') ? document.querySelector('.participacao-fem').value || "0" : "0";
    
    const calculateTotal = () => {
        return parseInt(age06masculine) + parseInt(age06feminine) +
               parseInt(age710masculine) + parseInt(age710feminine) +
               parseInt(age10masculine) + parseInt(age10feminine) +
               parseInt(serviceMasculine) + parseInt(serviceFeminine) +
               parseInt(participacaoMasculine) + parseInt(participacaoFeminine);
    };
    
    const listaNomesHospedagem = Array.from(document.querySelectorAll('#lista-nomes-hospedagem li'))
        .map(li => li.textContent.replace('x', '').trim());


    const registrationData = {
        locality,
        nameResponsavel,
        totalInscritos: calculateTotal(),
        inscritos: {
            '0-6': { masculino: age06masculine, feminino: age06feminine },
            '7-10': { masculino: age710masculine, feminino: age710feminine },
            '10+': { masculino: age10masculine, feminino: age10feminine },
        },
        servico: { masculino: serviceMasculine, feminino: serviceFeminine },
        participacao: { masculino: participacaoMasculine, feminino: participacaoFeminine }
    };

    try {
        const data = await registrarInscricao(registrationData);
        const idInscricao = data?.enrollmentId;

        if (idInscricao) {
            if (listaNomesHospedagem.length > 0) {
                const statusHospedagem = await registrarHospedagem(idInscricao, listaNomesHospedagem);
    
                if (statusHospedagem >= 200 && statusHospedagem < 300) {
                    showPopup("Sua inscrição e hospedagem foram registradas com sucesso!");
                } else {
                    showPopupError("A inscrição foi realizada, mas ocorreu um erro ao registrar a hospedagem.");
                }
            } else {
                showPopup("Sua inscrição foi realizada com sucesso!");
            }
        } else {
            showPopupError("Erro ao realizar sua inscrição, tente novamente ou entre em contato com o suporte.");
        }
    } catch (error) {
        showPopupError("Ocorreu um erro ao realizar a inscrição, tente novamente.");
    } finally {
        toggleLoader(false);
    }
}

// Função para iniciar e configurar tudo
async function init() {
    await initCitySuggestions();
    setupServiceForm();
    setupParticipationForm();


    const btnRegister = document.querySelector('.btn-register');
    btnRegister.addEventListener('click', (event) => {
        event.preventDefault();
        register();
    });
}

init();
