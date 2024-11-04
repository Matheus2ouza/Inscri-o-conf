import { getLocations, registrarInscricao, registrarHospedagem } from './router.js';

async function fetchCityNames() {
    try {
        showLoader();
        const cities = await getLocations();
        return extractCityNames(cities);
    } catch (error) {
        console.error(`Erro ao buscar nomes das cidades: ${error.message}`);
        return [];
    } finally {
        hideLoader();
    }
}

function showLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.remove('hiddenLoader');
}

function hideLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.add('hiddenLoader');
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

function extractCityNames(cities) {
    return Object.values(cities).map(city => city.nome);
}

async function initCitySuggestions() {
    const cityNames = await fetchCityNames();
    const input = document.getElementById('input1');
    const suggestions = document.getElementById('suggestions');

    input.addEventListener('input', () => filterCities(cityNames, input, suggestions));
}

function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase();
    suggestions.innerHTML = '';

    const filteredCities = cityNames.filter(city => city.toLowerCase().includes(inputValue));

    if (filteredCities.length > 0 && inputValue) {
        suggestions.style.display = 'block';
        filteredCities.forEach(city => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = city;

            item.addEventListener('click', () => {
                input.value = city;
                suggestions.innerHTML = '';
                suggestions.style.display = 'none';
            });

            suggestions.appendChild(item);
        });
    } else {
        suggestions.style.display = 'none';
    }
}

function setupFormServiceToggle() {
    const btnYes = document.querySelector('.btnServiço-yes');
    const btnNo = document.querySelector('.btnServiço-no');
    const formService = document.querySelector('.form-service');

    btnYes.addEventListener('click', (event) => {
        event.preventDefault();
        if (!formService.querySelector('form')) {
            formService.insertAdjacentHTML('beforeend', `
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
    });

    btnNo.addEventListener('click', (event) => {
        event.preventDefault();
        formService.innerHTML = '';
    });
}

function setupFormParticipacaoToggle() {
    const btnYes = document.querySelector('.btnParti-yes');
    const btnNo = document.querySelector('.btnParti-no');
    const formParticipacao = document.querySelector('.form-participacao');

    btnYes.addEventListener('click', (event) => {
        event.preventDefault();
        if (!formParticipacao.querySelector('form')) {
            formParticipacao.insertAdjacentHTML('beforeend', `
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
    });

    btnNo.addEventListener('click', (event) => {
        event.preventDefault();
        formParticipacao.innerHTML = '';
    });
}

function setupFormClear() {
    const btnNovoFormulario = document.querySelector('#btn-novoformulario');
    btnNovoFormulario.addEventListener('click', (event) => {
        event.preventDefault();
        window.location.reload();
    });
}

function showPopup(message) {
    const popup = document.getElementById('popup');
    const popupContent = popup.querySelector('.popup-content p');
    popupContent.textContent = message;
    popup.style.display = 'flex';
}

document.querySelector('.close-btn').addEventListener('click', function() {
    window.location.reload();
});

window.addEventListener('click', function(event) {
    const popup = document.getElementById('popup');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

function showPopupError(message) {
    const popup = document.getElementById('popupError');
    const popupContent = popup.querySelector('.popup-contentError p');
    popupContent.textContent = message;
    popup.style.display = 'flex';
}

document.querySelector('.close-btnError').addEventListener('click', function() {
    document.getElementById('popupError').style.display = 'none';
});

window.addEventListener('click', function(event) {
    const popup = document.getElementById('popupError');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

// Função para coletar os dados do formulário e criar um objeto
async function register() {
    showLoader(); 

    const localidade = document.getElementById('input1').value.toUpperCase(); // Localidade
    const nomeResponsavel = document.querySelector('.responsible').value; // Nome do responsável

    const getValueOrDefault = (selector) => {
        const element = document.querySelector(selector);
        return element && element.value.trim() !== "" ? element.value : "0"; 
    };

    const age06masculine = getValueOrDefault('.age-06-masc');
    const age06feminine = getValueOrDefault('.age-06-fem');
    const age710masculine = getValueOrDefault('.age-710-masc');
    const age710feminine = getValueOrDefault('.age-710-fem');
    const age10masculine = getValueOrDefault('.age-10-masc');
    const age10feminine = getValueOrDefault('.age-10-fem');
    const serviceMasculine = getValueOrDefault('.service-masc');
    const serviceFeminine = getValueOrDefault('.service-fem');
    const participacaoMasculine = getValueOrDefault('.participacao-masc');
    const participacaoFeminine = getValueOrDefault('.participacao-fem');

    const calculateTotalInscritos = () => {
        return parseInt(age06masculine) + parseInt(age06feminine) +
               parseInt(age710masculine) + parseInt(age710feminine) +
               parseInt(age10masculine) + parseInt(age10feminine) +
               parseInt(serviceMasculine) + parseInt(serviceFeminine) +
               parseInt(participacaoMasculine) + parseInt(participacaoFeminine);
    };

    const listaNomesHospedagem = Array.from(document.querySelectorAll('#lista-nomes-hospedagem li'))
        .map(li => li.textContent.replace('x', '').trim());

    const registrationData = {
        localidade,
        nomeResponsavel,
        totalInscritos: calculateTotalInscritos(),
        inscritos: {
            '0-6': {
                masculino: age06masculine,
                feminino: age06feminine
            },
            '7-10': {
                masculino: age710masculine,
                feminino: age710feminine
            },
            '10+': {
                masculino: age10masculine,
                feminino: age10feminine
            },
        },
        servico: {
            masculino: serviceMasculine,
            feminino: serviceFeminine
        },
        participacao: {
            masculino: participacaoMasculine,
            feminino: participacaoFeminine
        }
    };

    try {
        const dadosInscricao = await registrarInscricao(registrationData);
        console.log(dadosInscricao);

        if (dadosInscricao.status >= 200 && dadosInscricao.status < 300) {
            const idInscricao = dadosInscricao.data?.enrollmentId; 

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
                showPopupError("A inscrição foi realizada, mas o ID de inscrição não foi retornado.");
            }
        } else {
            showPopupError("Erro ao realizar sua inscrição, tente novamente ou entre em contato com o suporte.");
        }
    } catch (error) {
        console.error(`Erro ao registrar: ${error.message}`);
        showPopupError("Ocorreu um erro ao realizar a inscrição, tente novamente.");
    } finally {
        hideLoader();
    }

    const buttonpayment = document.querySelector('#btn-payment');
    buttonpayment.addEventListener('click', (event) => {
        event.preventDefault();
        const url = `https://inscri-o-conf.vercel.app/pagamento?localidade=${localidade}`;
        window.location.href = url;
    });
}

async function init() {
    await initCitySuggestions();
    setupFormServiceToggle();
    setupFormParticipacaoToggle();
    setupFormClear();

    const btnRegister = document.querySelector('.btn-register');
    btnRegister.addEventListener('click', (event) => {
        event.preventDefault();
        register();
    });
}

init();