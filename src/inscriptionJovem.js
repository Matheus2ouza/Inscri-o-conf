import { registrarInscricaoJovem, registrarHospedagem } from '../router/registrationRoutes.js';
import { getLocations } from "../router/dataRoutes.js";

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

        // Cria o ícone para o botão de remoção
        const removeBtn = document.createElement('span');
        removeBtn.innerHTML = '<i class="bi bi-x-square"></i>';  // Ícone do Bootstrap
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

document.querySelector('#btn-novoformulario').addEventListener('click', () =>{
    window.location.reload();
})

document.querySelector('#btn-payment').addEventListener('click', () => {
    const locality = document.querySelector('#input1').value;
    
    // Cria a URL com o parâmetro `locality`
    const url = new URL('https://inscri-o-conf.vercel.app/pagamento');
    url.searchParams.append('locality', locality);
    
    // Redireciona para a URL gerada
    window.location.href = url;
  });

document.querySelector('.close-btn').addEventListener('click', function() {
    window.location.reload();
});

document.querySelector('.close-btnError').addEventListener('click', function() {
    document.getElementById('popupError').style.display = 'none';
});

// Função para coletar dados do formulário e registrar a inscrição
async function register() {
    toggleLoader(true); 

    const localidade = document.getElementById('input1').value.toUpperCase().trim();
    const nomeResponsavel = document.querySelector('.responsible').value;
    const age10masculine = document.querySelector('.age-10-masc').value || "0";
    const age10feminine = document.querySelector('.age-10-fem').value || "0";
   
    const calculateTotal = () => {
        return parseInt(age10masculine) + parseInt(age10feminine);
    };
    
    // Atualizar a parte que coleta os nomes da lista de hospedagem
    const listaNomesHospedagem = Array.from(document.querySelectorAll('#lista-nomes-hospedagem li'))
    .map(li => li.textContent.replace(/\s*×\s*/g, '').trim());  // Remove o ícone de "x" ou qualquer espaço em torno


    const registrationData = {
        localidade,
        nomeResponsavel,
        totalInscritos: calculateTotal(),
        inscritos: { masculino: age10masculine, feminino: age10feminine }
    };

    console.log(registrationData)
    console.log(listaNomesHospedagem)

    if (registrationData.totalInscritos != listaNomesHospedagem.length ) {
        const errorList = document.querySelector('.popupError-list');
        const mensageError = document.querySelector('.popup-contentError-list p');
        const closeButton = document.querySelector('.close-btnError-list')
        errorList.style.display = 'flex';
        mensageError.textContent = 'A quantidade de pessoas inscritas é diferente da quantidade de pessoas na listagem. Por favor verifique';
        closeButton.addEventListener('click', ()=>{
            errorList.style.display = 'none';
            toggleLoader(false);
        });
        
    } else {
        try {
            const { data, status } = await registrarInscricaoJovem(registrationData);
            const idInscricao = data?.enrollmentId;
        
            if (idInscricao) {
                if (listaNomesHospedagem.length > 0) {
                    const statusHospedagem = await registrarHospedagem(idInscricao, listaNomesHospedagem);
        
                    // Verifica o status de resposta para a hospedagem
                    if (statusHospedagem >= 200 && statusHospedagem < 300) {
                        showPopup("Sua inscrição e hospedagem foram registradas com sucesso!");
                    } else {
                        // Erro ao registrar hospedagem com base no status
                        if (statusHospedagem === 400) {
                            showPopupError("Erro ao registrar a hospedagem: Dados de inscrição ou lista de nomes estão faltando. Entre em contato com o suporte.");
                        } else if (statusHospedagem === 404) {
                            showPopupError("Erro ao registrar a hospedagem: Inscrição não encontrada. Entre em contato com o suporte.");
                        } else {
                            showPopupError("A inscrição foi realizada, mas ocorreu um erro ao registrar a hospedagem. Entre em contato com o suporte.");
                        }
                    }
                } else {
                    showPopup("Sua inscrição foi realizada com sucesso!");
                }
            } else {
                // Erro ao registrar a inscrição com base no status
                if (status === 400) {
                    showPopupError("Erro ao realizar a inscrição. Dados faltando ou inválidos.");
                } else if (status === 401) {
                    showPopupError("Erro ao realizar a inscrição. Localidade inválida.");
                } else {
                    showPopupError("A inscrição foi realizada, mas ocorreu um erro ao registrar a hospedagem. Entre em contato com o suporte.");
                }
            }
        } catch (error) {
            showPopupError("Ocorreu um erro inesperado ao tentar realizar a inscrição ou registrar a hospedagem. Tente novamente.");
        } finally {
            toggleLoader(false);
        }
    }        
}

// Função para iniciar e configurar tudo
async function init() {
    await initCitySuggestions();
    

    const btnRegister = document.querySelector('.btn-register');
    btnRegister.addEventListener('click', (event) => {
        event.preventDefault();
        register();
    });
}

init();
