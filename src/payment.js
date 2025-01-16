import { getLocations } from './router.js'; // Importa a função para obter os locais

// Função de debounce para limitar a frequência das chamadas
function debounce(func, delay) {
    let timeoutId;
    return function (...args) {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}

// Função principal para buscar os nomes das cidades
async function fetchCityNames() {
    showLoader(); // Mostra o loader antes de fazer a requisição
    try {
        const cities = await getLocations(); // Chama a função para obter os locais
        console.log(cities)
        return extractCityNames(cities); // Retorna apenas os nomes das cidades
    } catch (error) {
        console.error(`Erro ao buscar nomes das cidades: ${error.message}`);
        return []; // Retorna um array vazio em caso de erro
    } finally {
        hideLoader(); // Esconde o loader após a requisição
    }
}

// Função para extrair os nomes das cidades de um objeto
function extractCityNames(cities) {
    return Object.values(cities).map(city => city.nome);
}

// Função para inicializar sugestões de cidades
async function initCitySuggestions(cidadeInput, saldoDevedorInput) {
    const cityNames = await fetchCityNames(); // Busca os nomes das cidades
    const suggestions = document.getElementById('suggestions');

    if (cidadeInput) { // Verifica se o input existe
        cidadeInput.addEventListener('input', debounce(() => {
            filterCities(cityNames, cidadeInput, suggestions, saldoDevedorInput);
        }, 100)); // Debounce aplicado apenas na filtragem

        // Chama a busca de saldo devedor com debounce
        cidadeInput.addEventListener('input', debounce(() => {
            buscarSaldoDevedor(cidadeInput.value.trim().toUpperCase(), saldoDevedorInput); // Chama a busca de saldo devedor
        }, 2500)); // 1000ms de debounce para saldo devedor
    }
}


// Função para filtrar as cidades e exibir sugestões
function filterCities(cityNames, input, suggestions, saldoDevedorInput) {
    const inputValue = input.value.toLowerCase();
    suggestions.innerHTML = '';

    const filteredCities = cityNames.filter(city => city.toLowerCase().includes(inputValue));

    if (filteredCities.length > 0 && inputValue) {
        suggestions.style.display = 'block'; // Mostra o dropdown
        filteredCities.forEach(city => {
            const item = document.createElement('div');
            item.classList.add('suggestion-item');
            item.textContent = city;

            // Atualizar o evento de clique para definir o valor completo da cidade
            item.addEventListener('click', async () => {
                input.value = city; // Troca o valor do input para a cidade selecionada
                suggestions.innerHTML = ''; // Limpa as sugestões
                suggestions.style.display = 'none'; // Esconde o dropdown

                // Chama a lógica de buscar saldo devedor após selecionar a cidade
                await buscarSaldoDevedor(city.trim().toUpperCase(), saldoDevedorInput);
                suggestions.style.display = 'none'; // Esconde as sugestões após buscar o saldo devedor
            });

            suggestions.appendChild(item); // Adiciona o item de sugestão ao contêiner
        });
    } else {
        suggestions.style.display = 'none'; // Esconde o dropdown se não houver sugestões
    }
}


// Função para buscar saldo devedor
async function buscarSaldoDevedor(cidade, saldoDevedorInput) {
    if (!cidade) {
        saldoDevedorInput.value = ''; // Limpa o campo se não houver cidade
        return;
    }

    const suggestions = document.getElementById('suggestions'); // Obtém a referência para o elemento de sugestões
    suggestions.style.display = 'none'; // Esconde as sugestões antes de buscar o saldo devedor

    showLoader(); // Mostra o loader antes de fazer a requisição
    try {
        const response = await fetch(`https://api-inscri-o.vercel.app/dados/localidades?nome=${cidade}`);
        if (!response.ok) {
            throw new Error('Cidade não encontrada ou erro na consulta.');
        }

        const data = await response.json();
        console.log(data);

        // Procurando a cidade correspondente no array (caso haja mais de uma)
        const cidadeEncontrada = data.find(item => item.nome.toUpperCase() === cidade);
        
        if (cidadeEncontrada) {
            saldoDevedorInput.value = cidadeEncontrada.saldo_devedor; // Preenche com o saldo devedor da cidade encontrada
        } else {
            saldoDevedorInput.value = ''; // Limpa se não encontrar saldo
        }
    } catch (error) {
        console.error('Erro ao buscar saldo devedor:', error);
        alert('Erro ao buscar saldo devedor. Verifique o console para mais detalhes.');
    } finally {
        hideLoader(); // Esconde o loader após a requisição
    }
}

// Função para gerenciar o botão "home"
const buttonhome = document.querySelector('#btn-home');
buttonhome.addEventListener('click', () => {
    window.location.href = 'https://inscri-o-conf.vercel.app'; // Redireciona para o link desejado
});

// Função para configurar o botão "Novo Pagamento"
function setupFormClear() {
    const btnNovoPagamento = document.querySelector('#btn-novoPagamento'); // Seleciona o botão
    btnNovoPagamento.addEventListener('click', (event) => {
        event.preventDefault(); // Previne o comportamento padrão do botão
        window.location.reload(); // Recarrega a página
    });
}

// Funções para exibir e esconder pop-ups
function showPopup(message) {
    const popup = document.getElementById('popup');
    const popupContent = popup.querySelector('.popup-content p');
    popupContent.textContent = message; // Atualiza a mensagem do pop-up
    popup.style.display = 'flex'; // Exibe o pop-up
}

document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('popup').style.display = 'none';
    window.location.reload(); // Recarrega a página
});

// Fechar o pop-up ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const popup = document.getElementById('popup');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

// Função para exibir erros em um pop-up
function showPopupError(message) {
    const popup = document.getElementById('popupError');
    const popupContent = popup.querySelector('.popup-contentError p');
    popupContent.textContent = message; // Atualiza a mensagem do pop-up
    popup.style.display = 'flex'; // Exibe o pop-up
}

document.querySelector('.close-btnError').addEventListener('click', function() {
    document.getElementById('popupError').style.display = 'none';
});

// Fechar o pop-up de erro ao clicar fora do conteúdo
window.addEventListener('click', function(event) {
    const popup = document.getElementById('popupError');
    if (event.target === popup) {
        popup.style.display = 'none';
    }
});

// Função para mostrar o loader
function showLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.remove('hidden');
}

// Função para esconder o loader
function hideLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.add('hidden');
}

// Função para atualizar o nome do arquivo selecionado
function initFileUpload() {
    const fileInput = document.getElementById("comprovante_pagamento");
    if (fileInput) {
        fileInput.addEventListener("change", function() {
            const fileName = this.files[0]?.name || "Nenhum arquivo selecionado";
            document.getElementById("file-name").textContent = fileName;
        });
    }
}

// Função para coletar a localidade da URL e preencher o input
async function populateLocalidadeFromURL(saldoDevedorInput) {
    const urlParams = new URLSearchParams(window.location.search); // Obtém os parâmetros da URL
    const localidade = urlParams.get('locality'); // Tenta obter o valor do parâmetro `locality`

    if (localidade) {
        const cidadeInput = document.getElementById('input1');
        cidadeInput.value = decodeURIComponent(localidade); // Decodifica e preenche o input1 com a localidade

        // Chama a função para buscar saldo devedor ao carregar a página
        await buscarSaldoDevedor(localidade.trim().toUpperCase(), saldoDevedorInput);
    }
}

// Inicializa a aplicação
async function init() {
    const saldoDevedorInput = document.getElementById('saldoDevedor'); // Referência ao campo de saldo devedor
    await populateLocalidadeFromURL(saldoDevedorInput); // Popula cidade e busca saldo devedor, se aplicável
    setupFormClear();
    
    const cidadeInput = document.getElementById('input1'); // Input do nome da cidade
    await initCitySuggestions(cidadeInput, saldoDevedorInput); // Inicializa sugestões de cidade e busca saldo

    const valorPago = document.getElementById('valor_pago');
    const paymentForm = document.getElementById('paymentForm');

    // Inicializa o campo de upload de arquivo
    initFileUpload();

    // Função para registrar o pagamento
    if (paymentForm) {
        paymentForm.addEventListener('submit', async function (event) {
            event.preventDefault(); // Impede o envio padrão do formulário

            const formData = new FormData();

            // Obtém a cidade e valor pago
            const valor_pago = valorPago.value;

            // Corrige o ID do campo de upload para pegar o arquivo correto
            const fileInput = document.getElementById('comprovante_pagamento');
            if (fileInput.files.length > 0) {
                formData.append('comprovante_pagamento', fileInput.files[0]); // Adiciona o comprovante
            } else {
                console.error('Nenhum arquivo foi selecionado.');
                return;
            }

            // Adiciona os outros campos ao FormData
            formData.append('valor_pago', valor_pago);
            formData.append('cidade', cidadeInput.value.trim().toUpperCase()); // Usa a referência única

            console.log(...formData); // Exibe o conteúdo do FormData para debug

            showLoader(); // Mostra o loader antes de fazer a requisição
            try {
                const response = await fetch('https://api-inscri-o.vercel.app/pagamento', {
                    method: 'POST',
                    body: formData
                });

                if (response.status === 400) {
                    const errorResponse = await response.json();
                    console.error(`Erro ao registrar pagamento: ${errorResponse.message}`);
                    showPopupError("Comprovante de pagamento não fornecido.");
                    return;
                } else if (response.status === 404) {
                    const errorResponse = await response.json();
                    console.error(`Erro ao registrar pagamento: ${errorResponse.message}`);
                    showPopupError("Localidade não encontrada.");
                    return;
                } else if (!response.ok) {
                    showPopupError("Erro inesperado ao registrar pagamento");
                    console.error('Erro inesperado ao registrar pagamento:', response);
                    return;
                }

                const result = await response.json();
                showPopup("Seu pagamento já foi registrado.");

            } catch (error) {
                console.error('Erro ao registrar pagamento:', error);
                showPopupError("Erro inesperado ao registrar pagamento");
            } finally {
                hideLoader(); // Esconde o loader após a requisição
            }
        });
    }
}

// Inicia a aplicação
init();
