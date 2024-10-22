import { getLocations, registrarInscricao, registrarHospedagem } from './router.js';

// Função principal para buscar os nomes das cidades
async function fetchCityNames() {
    try {
        const cities = await getLocations(); // Chama a função para obter os locais
        return extractCityNames(cities); // Retorna apenas os nomes das cidades
    } catch (error) {
        console.error(`Erro ao buscar nomes das cidades: ${error.message}`); // Exibe erro no console
        return []; // Retorna um array vazio em caso de erro
    }
}

document.getElementById('adicionar-nome-btn').addEventListener('click', function() {
    const nomeHospedagem = document.getElementById('nome_hospedagem').value.trim(); // Remove espaços extras no início e no fim
    if (nomeHospedagem) { // Verifica se o valor não está vazio
        const listaNomes = document.getElementById('lista-nomes-hospedagem');

        // Cria um novo item de lista
        const li = document.createElement('li');
        li.textContent = nomeHospedagem;

        // Cria o botão de remover ("x")
        const removeBtn = document.createElement('span');
        removeBtn.textContent = 'x';
        removeBtn.classList.add('remove-nome');

        // Adiciona o botão de remover ao item
        li.appendChild(removeBtn);

        // Adiciona o item à lista
        listaNomes.appendChild(li);

        // Limpa o campo de entrada
        document.getElementById('nome_hospedagem').value = '';

        // Evento de clique para remover o nome
        removeBtn.addEventListener('click', function() {
            listaNomes.removeChild(li);
        });
    } else {
        alert('Por favor, insira um nome válido.');
    }
});


// Função para extrair os nomes das cidades de um objeto
function extractCityNames(cities) {
    return Object.values(cities).map(city => city.nome); // Mapeia para um array de nomes
}

// Função para inicializar sugestões de cidades
async function initCitySuggestions() {
    const cityNames = await fetchCityNames(); // Busca os nomes das cidades
    const input = document.getElementById('input1'); // Obtém o input de localidade
    const suggestions = document.getElementById('suggestions'); // Obtém a div para sugestões

    input.addEventListener('input', () => filterCities(cityNames, input, suggestions)); // Adiciona evento de input
}

// Função para filtrar as cidades e exibir sugestões
function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase(); // Converte o valor do input para minúsculas
    suggestions.innerHTML = ''; // Limpa as sugestões anteriores

    const filteredCities = cityNames.filter(city => city.toLowerCase().includes(inputValue)); // Filtra as cidades

    if (filteredCities.length > 0 && inputValue) {
        suggestions.style.display = 'block'; // Mostra o dropdown
        filteredCities.forEach(city => {
            const item = document.createElement('div'); // Cria um novo elemento div para a sugestão
            item.classList.add('suggestion-item'); // Adiciona a classe para estilização
            item.textContent = city; // Define o texto da sugestão

            item.addEventListener('click', () => { // Preenche o input com a cidade escolhida
                input.value = city; // Preenche o input
                suggestions.innerHTML = ''; // Limpa as sugestões
                suggestions.style.display = 'none'; // Esconde o dropdown
            });

            suggestions.appendChild(item); // Adiciona o item de sugestão ao contêiner
        });
    } else {
        suggestions.style.display = 'none'; // Esconde o dropdown se não houver sugestões
    }
}

// Função para configurar a exibição da form-service
function setupFormServiceToggle() {
    const btnYes = document.querySelector('.btnServiço-yes');
    const btnNo = document.querySelector('.btnServiço-no');
    const formService = document.querySelector('.form-service');

    btnYes.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Verifica se o formulário já foi adicionado
        if (!formService.querySelector('form')) {
            // Adiciona o HTML do formulário dinamicamente
            formService.insertAdjacentHTML('beforeend', `
                <form>
                    <div class="form-container">
                        <div class="form-group">
                            <label for="input8">Irmãos que vão servir</label>
                            <input type="text" class="service-masc" placeholder="Se não houver coloque 0">
                        </div>
                        <div class="form-group">
                            <label for="input8">Irmãs que vão servir</label>
                            <input type="text" class="service-fem" placeholder="Se não houver coloque 0">
                        </div>
                    </div>
                </form>
            `);
        }
    });

    btnNo.addEventListener('click', (event) => {
        event.preventDefault();
        // Limpa o conteúdo da form-service
        formService.innerHTML = ''; // Remove o conteúdo do formulário
    });
}
function setupFormParticipacaoToggle() {
    const btnYes = document.querySelector('.btnParti-yes');
    const btnNo = document.querySelector('.btnParti-no');
    const formParticipacao = document.querySelector('.form-participacao');

    btnYes.addEventListener('click', (event) => {
        event.preventDefault();
        
        // Verifica se o formulário já foi adicionado
        if (!formParticipacao.querySelector('form')) {
            // Adiciona o HTML do formulário dinamicamente
            formParticipacao.insertAdjacentHTML('beforeend', `
                <form>
                    <div class="form-container">
                        <div class="form-group">
                            <label for="input8">Irmãos que vão participar somente da reunião</label>
                            <input type="text" class="participacao-masc" placeholder="Se não houver coloque 0">
                        </div>
                        <div class="form-group">
                            <label for="input8">Irmães que vão participar somente da reunião</label>
                            <input type="text" class="participacao-fem" placeholder="Se não houver coloque 0">
                        </div>
                    </div>
                </form>
            `);
        }
    });

    btnNo.addEventListener('click', (event) => {
        event.preventDefault();
        // Limpa o conteúdo da form-service
        formParticipacao.innerHTML = ''; // Remove o conteúdo do formulário
    });
}

// Função para recarregar a página ao clicar no botão
function setupFormClear() {
    const btnNovoFormulario = document.querySelector('#btn-novoformulario'); // Seleciona o botão
    btnNovoFormulario.addEventListener('click', (event) => {
        event.preventDefault(); // Previne o comportamento padrão do botão

        window.location.reload(); // Recarrega a página
    });
}

function showPopup(message) {
    const popup = document.getElementById('popup');
    const popupContent = popup.querySelector('.popup-content p');
    popupContent.textContent = message; // Atualiza a mensagem do pop-up
    popup.style.display = 'flex'; // Exibe o pop-up
}

// Lógica para fechar o pop-up
document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('popup').style.display = 'none';
});

// Fechar o pop-up ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const popup = document.getElementById('popup');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

function showPopupError(message) {
    const popup = document.getElementById('popupError');
    const popupContent = popup.querySelector('.popup-contentError p');
    popupContent.textContent = message; // Atualiza a mensagem do pop-up
    popup.style.display = 'flex'; // Exibe o pop-up
}

// Lógica para fechar o pop-up
document.querySelector('.close-btnError').addEventListener('click', function() {
    document.getElementById('popupError').style.display = 'none';
});

// Fechar o pop-up ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const popup = document.getElementById('popupError');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});


// Função para coletar os dados do formulário e criar um objeto
async function register() {
    const localidade = document.getElementById('input1').value; // Localidade
    const nomeResponsavel = document.querySelector('.responsible').value; // Nome do responsável

    // Função auxiliar para tratar valores vazios
    const getValueOrDefault = (selector) => {
        const element = document.querySelector(selector);
        return element && element.value.trim() !== "" ? element.value : "0"; // Retorna "0" se o valor for vazio ou o elemento não existir
    };

    // Obtém os valores, usando a função auxiliar
    const age06masculine = getValueOrDefault('.age-06-masc'); // 0-6 Masculino
    const age06feminine = getValueOrDefault('.age-06-fem'); // 0-6 Feminino
    const age710masculine = getValueOrDefault('.age-710-masc'); // 7-12 Masculino
    const age710feminine = getValueOrDefault('.age-710-fem'); // 7-12 Feminino
    const age10masculine = getValueOrDefault('.age-10-masc'); // 13+ Masculino
    const age10feminine = getValueOrDefault('.age-10-fem'); // 13+ Feminino
    const serviceMasculine = getValueOrDefault('.service-masc'); // serviço Masculino
    const serviceFeminine = getValueOrDefault('.service-fem'); // serviço Feminino
    const participacaoMasculine = getValueOrDefault('.participacao-masc'); // serviço Masculino
    const participacaoFeminine = getValueOrDefault('.participacao-fem'); // serviço Feminino

    // Função para somar todos os inscritos
    const calculateTotalInscritos = () => {
        return parseInt(age06masculine) + parseInt(age06feminine) +
               parseInt(age710masculine) + parseInt(age710feminine) +
               parseInt(age10masculine) + parseInt(age10feminine) +
               parseInt(serviceMasculine) + parseInt(serviceFeminine)+
               parseInt(participacaoMasculine) + parseInt(participacaoFeminine);
    };

    // Coleta os nomes de hospedagem da lista
    const listaNomesHospedagem = Array.from(document.querySelectorAll('#lista-nomes-hospedagem li'))
        .map(li => li.textContent.replace('Remover', '').trim()); // Remove o botão de remover e pega o nome

    // Cria um objeto com os dados
    const registrationData = {
        localidade,
        nomeResponsavel,
        totalInscritos: calculateTotalInscritos(), // Adiciona o total ao objeto
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

    const dadosInscricao = await registrarInscricao(registrationData);
    console.log(dadosInscricao);

    // Se a inscrição foi um sucesso, registrar hospedagem
    if (dadosInscricao.status >= 200 && dadosInscricao.status < 300) {
        // Supondo que o ID da inscrição seja retornado dentro de `data` ou direto no objeto
        const idInscricao = dadosInscricao.data?.enrollmentId; // Ajuste conforme o retorno da API

        if (idInscricao) {
        // Registrar hospedagem
            const statusHospedagem = await registrarHospedagem(idInscricao, listaNomesHospedagem);

            if (statusHospedagem >= 200 && statusHospedagem < 300) {
                showPopup("Sua inscrição e hospedagem foram registradas com sucesso!");
            } else {
                showPopupError("A inscrição foi realizada, mas ocorreu um erro ao registrar a hospedagem.");
            }
        } else {
            showPopupError("A inscrição foi realizada, mas o ID de inscrição não foi retornado.");
        }
    } else {
        showPopupError("Erro ao realizar sua inscrição, tente novamente ou entre em contato com o suporte.");
    }

    const buttonpayment = document.querySelector('#btn-payment');

    buttonpayment.addEventListener('click', (event) => {
        event.preventDefault(); // Evita o comportamento padrão do botão, se necessário
    
        const localidade = registrationData.localidade; // Obtém a localidade do objeto registrationData
        const url = `https://inscri-o-conf.vercel.app/pagamento?localidade=${encodeURIComponent(localidade)}`; // Cria a URL com a localidade
        window.location.href = url; // Redireciona para o link desejado com a localidade
    });

}


// Função de inicialização
async function init() {
    await initCitySuggestions(); // Inicializa as sugestões de cidade
    setupFormServiceToggle();
    setupFormParticipacaoToggle();
    setupFormClear();

    // Adiciona evento ao botão de registro
    const btnRegister = document.querySelector('.btn-register');
    btnRegister.addEventListener('click', (event) => {
        event.preventDefault(); // Previne comportamento padrão do botão
        register(); // Chama a função de registro
    });
}

// Inicia a aplicação
init();
