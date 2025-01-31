import { getLocations, registrarInscricaoAvulsa } from './router.js';

const checkbox = document.querySelector('#chk'),
    inscricaoLink = document.querySelector('.inscricao-link'),
    ticketLink = document.querySelector('.ticket-link'),
    expensesLink = document.querySelector('.expenses-link'),
    expensesContent = document.querySelector('.expenses-content'),
    registrationContent = document.querySelector('.registration-content'),
    ticketContent = document.querySelector('.ticket-content');


const paymentFieldTemplate = `
        <div class="input-group-payment">
            <div class="icon-add">
                <i class="bi bi-plus-circle-fill"></i>
                <i class="bi bi-x-circle-fill"></i>
            </div>
            
            <div id="payment-container"></div>
            <div class="input-group-payment-left">
                <label for="payment-type">Forma de pagamento:</label>
                <select class="select-payment" id="payment-type">
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Debito">Débito</option>
                    <option value="Credito">Crédito</option>
                </select>
            </div>
        
            <div class="input-group-payment-right">
                <label for="amount">Valor:</label>
                <input type="number" class="input-amount" id="amount" placeholder="R$ 00,00">
            </div>
        </div>
`;

function darkmode() {
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

function setActive(activelink) {
    const links = document.querySelectorAll('.navbar-links a');
    links.forEach(link => link.classList.remove('active'));
    activelink.classList.add('active');
}

inscricaoLink.addEventListener('click', (event) => {
    event.preventDefault();
    registrationContent.classList.remove('hidden');
    ticketContent.classList.add('hidden');
    expensesContent.classList.add('hidden');
    setActive(inscricaoLink);
});

ticketLink.addEventListener('click', (event) => {
    event.preventDefault();
    ticketContent.classList.remove('hidden');
    registrationContent.classList.add('hidden');
    expensesContent.classList.add('hidden');
    setActive(ticketLink);
});

expensesLink.addEventListener('click', (event) => {
    event.preventDefault();
    expensesContent.classList.remove('hidden');
    ticketContent.classList.add('hidden');
    registrationContent.classList.add('hidden');
    setActive(expensesLink);
});


function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background')
    loaderBackground.classList.toggle('hiddenLoader', !show)
}

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

async function fetchCityNames() {
    try {
        toggleLoader(true)
        const cities = await getLocations();
        return extractCityNames(cities);
    } catch (error) {
        console.error(`Erro ao buscar nomes das cidades: ${error.message}`);
        return [];
    } finally {
        toggleLoader(false)
    }
}

function initRegistrationTable() {
    // Seleciona todas as linhas da tabela de registro
    const rows = document.querySelectorAll(".registration-table tbody tr");

    // Função para atualizar os totais
    const updateTotals = () => {
        let totalGeral = 0; // Armazena o total em valor monetário
        let quantidadeGeral = 0; // Armazena o total de quantidades

        rows.forEach(row => {
            const masculinoInput = row.querySelector(".masculino");
            const femininoInput = row.querySelector(".feminino");
            const valorInput = row.querySelector(".valor");

            // Obtém os valores inseridos
            const masculino = parseInt(masculinoInput.value) || 0;
            const feminino = parseInt(femininoInput.value) || 0;
            const valor = parseFloat(valorInput.value) || 0;

            // Calcula o total por faixa etária
            const totalQuantidade = masculino + feminino;
            const totalValor = totalQuantidade * valor;

            // Identifica a faixa etária com base no conteúdo da primeira célula
            let faixa = row.children[0].textContent.trim();
            faixa = faixa.replace("+", "plus").replace("-", "-").toLowerCase(); // Formata "10+" para "10-plus"

            // Atualiza os totais na seção Totais com base no data-faixa
            const totalItem = document.querySelector(`.totais .total-item[data-faixa="${faixa}"]`);
            if (totalItem) {
                totalItem.querySelector(".total-quantity").textContent = totalQuantidade;
                totalItem.querySelector(".total-value").textContent = `R$ ${totalValor.toFixed(2)}`;
            }

            // Soma os valores ao total geral
            totalGeral += totalValor;
            quantidadeGeral += totalQuantidade;
        });

        // Atualiza o total geral em valor
        const totalGeralElement = document.querySelector(".totais .total-value.geral");
        if (totalGeralElement) {
            totalGeralElement.textContent = `R$ ${totalGeral.toFixed(2)}`;
        }

        // Atualiza o total geral em quantidade
        const quantidadeGeralElement = document.querySelector(".totais .total-qtd.geral");
        if (quantidadeGeralElement) {
            quantidadeGeralElement.textContent = quantidadeGeral;
        }
    };

    // Adiciona o evento de entrada para todos os campos relevantes
    document.querySelectorAll(".registration-table input").forEach(input => {
        input.addEventListener("input", updateTotals);
    });

    // Atualiza os totais ao carregar a página
    updateTotals();
}

function updatePaymentInfo() {
    // Definindo as faixas etárias e valores padrão
    const faixas = [
        { faixa: '0-6', valor: 0 },
        { faixa: '7-10', valor: 120 },
        { faixa: '10-plus', valor: 200 },
        { faixa: 'visitante', valor: 100 }
    ];

    let totalGeral = 0;

    // Iterando sobre as faixas para calcular os totais
    faixas.forEach((faixa) => {
        // Acessando os inputs da tabela pela faixa
        const masculinoInput = document.querySelector(`tr[data-faixa="${faixa.faixa}"] .masculino`);
        const femininoInput = document.querySelector(`tr[data-faixa="${faixa.faixa}"] .feminino`);
        const valorInput = document.querySelector(`tr[data-faixa="${faixa.faixa}"] .valor`);

        // Verificando se os inputs existem antes de acessar os valores
        if (masculinoInput && femininoInput && valorInput) {
            const masculinoQty = parseInt(masculinoInput.value) || 0;
            const femininoQty = parseInt(femininoInput.value) || 0;
            const totalValue = (masculinoQty + femininoQty) * faixa.valor;

            // Atualizando os valores no painel de totais
            const totalItem = document.querySelector(`.totais .total-item[data-faixa="${faixa.faixa}"]`);
            if (totalItem) {
                totalItem.querySelector(".total-quantity").textContent = masculinoQty + femininoQty;
                totalItem.querySelector(".total-value").textContent = `R$ ${totalValue.toFixed(2)}`;
            }

            // Atualizando o total geral
            totalGeral += totalValue;
        }
    });

    // Atualizando o total geral no painel de pagamento
    document.querySelector(".totais .total-value.geral").textContent = `R$ ${totalGeral.toFixed(2)}`;
}

function openPaymentModal() {
    // Obtendo o valor total geral do painel de totais
    const totalValueElement = document.querySelector(".totais .total-value.geral");
    const totalQuantityElement = document.querySelector(".totais .total-qtd.geral");
    const locality = document.querySelector('#input1').value.trim(); // Captura o valor da localidade e remove espaços extras

    if (!totalValueElement || !totalQuantityElement) {
        console.error("Elementos total-value ou total-qtd geral não encontrados!");
        return; // Caso os elementos não existam, não faça nada
    }

    // Verificar se a localidade foi preenchida
    if (!locality) {
        alert("Por favor, preencha o campo da localidade antes de continuar.");
        return; // Interrompe a execução se o campo estiver vazio
    }

    // Extrai o valor do total geral, removendo o prefixo 'R$'
    const totalGeral = parseFloat(totalValueElement.textContent.replace('R$', '').trim());
    const totalQuantidadeGeral = parseInt(totalQuantityElement.textContent.trim()) || 0;

    // Exibir o modal
    document.getElementById('payment-modal').style.display = 'flex';

    // Atualizar as informações no modal de pagamento
    const totalValueModal = document.querySelector('#total-value-modal');
    const totalQuantityModal = document.querySelector('#total-quantity-modal');
    const localityModal = document.querySelector('#locality-modal');

    if (totalValueModal) {
        totalValueModal.textContent = `R$ ${totalGeral.toFixed(2)}`;
    }

    if (totalQuantityModal) {
        totalQuantityModal.textContent = totalQuantidadeGeral;
    }

    if (localityModal) {
        localityModal.textContent = locality;
    }
}

function newPaymentMethod() {
    // Encontra o container principal onde os campos de pagamento serão inseridos
    const container = document.querySelector('.grup-payment-grup');

    // Verifica se o container existe antes de adicionar os eventos
    if (!container) {
        console.error("Container 'grup-payment-grup' não encontrado!");
        return;
    }

    // Template HTML do novo campo de pagamento
    const paymentFieldTemplate = `
        <div class="input-group-payment">
            <div class="icon-add">
                <i class="bi bi-plus-circle-fill"></i> <!-- Botão de adicionar -->
                <i class="bi bi-x-circle-fill"></i> <!-- Botão de remover -->
            </div>
            <div class="input-group-payment-left">
                <label for="payment-type">Forma de pagamento:</label>
                <select class="select-payment" name="payment-type">
                    <option value="Dinheiro">Dinheiro</option>
                    <option value="PIX">PIX</option>
                    <option value="Debito">Débito</option>
                    <option value="Credito">Crédito</option>
                </select>
            </div>
            <div class="input-group-payment-right">
                <label for="amount">Valor:</label>
                <input type="number" class="input-amount" name="amount" placeholder="R$ 00,00">
            </div>
        </div>
    `;

    // Delegação de evento para o botão de adicionar (bi-plus-circle-fill) e o botão de excluir (bi-x-circle-fill)
    container.addEventListener('click', function(event) {
        // Adiciona um novo campo de pagamento quando clica no ícone de +
        if (event.target.classList.contains('bi-plus-circle-fill')) {
            container.insertAdjacentHTML('beforeend', paymentFieldTemplate);
        }
        
        // Remove o campo de pagamento quando clica no ícone de x
        if (event.target.classList.contains('bi-x-circle-fill')) {
            const paymentField = event.target.closest('.input-group-payment');
            if (paymentField) {
                paymentField.remove();
            }
        }
    });
}

// Delegação de evento para o ícone de remoção
document.addEventListener("click", function(event) {
    if (event.target && event.target.classList.contains("remove-payment-field")) {
        removePaymentField(event.target);
    }
});

async function finalizePayment() {
    const totalValueElement = document.querySelector('#total-value-modal');
    const totalGeral = parseFloat(totalValueElement.textContent.replace('R$', '').trim()) || 0;
    const locality = document.querySelector('#locality-modal').innerText;
    const nomeResponsavel = document.querySelector('#nameRespons').value

    const paymentGroups = document.querySelectorAll('.input-group-payment');

    let totalPago = 0;
    const formasDePagamento = [];

    // Inicializa as faixas etárias e as quantidades com base nos valores da seção "Totais"
    const faixas = [
        { faixa: '0-6', quantidade: 0 },
        { faixa: '7-10', quantidade: 0 },
        { faixa: '10plus', quantidade: 0 },
        { faixa: 'visitante', quantidade: 0 }
    ];

    // Obtém as quantidades das faixas diretamente da seção de totais
    faixas.forEach((faixa) => {
        const totalQuantityElement = document.querySelector(`.totais .total-item[data-faixa="${faixa.faixa}"] .total-quantity`);
        
        if (totalQuantityElement) {
            faixa.quantidade = parseInt(totalQuantityElement.textContent) || 0;
        }
    });

    // Calcula os pagamentos
    paymentGroups.forEach(group => {
        const paymentTypeSelect = group.querySelector('.select-payment');
        const paymentType = paymentTypeSelect?.value || 'N/A';

        const paymentAmountInput = group.querySelector('.input-amount');
        const paymentAmount = parseFloat(paymentAmountInput?.value) || 0;

        totalPago += paymentAmount;
        if (paymentAmount !== 0) {
            formasDePagamento.push({
                tipo: paymentType,
                valor: paymentAmount
            });
        }
    });

    // Verifica se os valores são válidos
    if (!isNaN(totalPago) && !isNaN(totalGeral)) {
        if (totalPago === totalGeral) {
            const paymenteData = {
                localidade: locality,
                qtdDetalhes: faixas.map(faixa => ({
                    faixa: faixa.faixa,
                    quantidade: faixa.quantidade,
                })),
                quantidadeTotal: faixas.reduce((total, faixa) => total + faixa.quantidade, 0),
                valorTotal: totalPago,
                formasDePagamento: formasDePagamento,
                nomeResponsavel: nomeResponsavel
            };
            console.log(paymenteData)

            try {
                const statusInscricaoAvulsa = await registrarInscricaoAvulsa(paymenteData);

                if (statusInscricaoAvulsa === 201) {
                    console.log(paymenteData);
                    alert(`Pagamento de R$ ${totalPago.toFixed(2)} realizado com sucesso!`);
                    closePaymentModal();
                    window.location.reload();
                } else if (statusInscricaoAvulsa === 401) {
                    alert("Localidade inválida! Verifique as informações e tente novamente.");
                } else if (statusInscricaoAvulsa === 500) {
                    alert("Erro interno no servidor! Não foi possível registrar a inscrição.");
                } else {
                    alert("Erro desconhecido ao tentar registrar a inscrição. Verifique os dados e tente novamente.");
                }
            } catch (error) {
                console.error("Erro ao processar a inscrição avulsa:", error);
                alert("Erro inesperado! Verifique a conexão e tente novamente.");
            }
        } else if (totalPago > totalGeral) {
            const diferenca = (totalPago - totalGeral).toFixed(2);
            alert(`Valor excedente! O valor pago é R$ ${diferenca} a mais do que o necessário. Verifique se os valores estão corretos`);
        } else {
            const diferenca = (totalGeral - totalPago).toFixed(2);
            alert(`Valor insuficiente! Ainda faltam R$ ${diferenca} para concluir o pagamento.`);
        }
    } else {
        alert("Erro: Os valores de pagamento ou total geral não são numéricos.");
    }
}

// Atribuir os eventos aos botões e inputs
document.querySelector('.btn-submit-payment').addEventListener('click', finalizePayment);
document.querySelector('#close-payment-modal').addEventListener('click', closePaymentModal);
document.querySelector('button').addEventListener('click', openPaymentModal);

// Função para fechar o modal de pagamento
function closePaymentModal() {
    // Fecha o modal de pagamento, alterando o estilo de display para 'none'
    document.getElementById('payment-modal').style.display = 'none';
}

// Atualizar os totais assim que os valores de quantidade ou faixa forem modificados
const allInputs = document.querySelectorAll('.masculino, .feminino');
allInputs.forEach(input => {
    input.addEventListener('input', updatePaymentInfo);
});

//Scripts do Ticket

// Variáveis globais para armazenar as configurações e as vendas
let ticketConfigs = {};
let ticketSales = [];

// Popup de configuração
const configTicketPopup = document.querySelector('.ticket-popup-container');
const btnConfigTicket = document.querySelector('.btn-config-ticket');
const closePopupTicket = document.getElementById('close-popup-ticket');

// Popup de venda
const saleTicketPopup = document.querySelector('.ticket-sale-popup-container');
const btnTicketSale = document.querySelector('.btn-ticket-sale');
const closePopupSale = document.getElementById('close-popup-sale');
const mealSaleSelect = document.querySelector('.meal-sale-select');
const ticketQuantity = document.querySelector('#ticket-quantity');
const btnSaveSale = document.querySelector('.btn-save-sale');

// Abrir o popup de configuração
btnConfigTicket.addEventListener('click', () => {
    configTicketPopup.classList.add('active');
});

// Fechar o popup de configuração
closePopupTicket.addEventListener('click', () => {
    configTicketPopup.classList.remove('active');
});

// Salvar a configuração do ticket
function saveTicketConfig() {
    const day = document.querySelector('#day-select').value;
    const meal = document.querySelector('#meal-select').value;
    const valueMeal = document.querySelector('#ticket-value');
    const value = valueMeal.value;

    // Criar um identificador único baseado no dia e refeição
    const ticketKey = `${day}-${meal}`;

    // Salvar ou atualizar a configuração no objeto ticketConfigs
    ticketConfigs[ticketKey] = { day, meal, value };

    // Limpar o valor do input
    valueMeal.value = '';

    // Atualizar a tabela e o select com a configuração mais recente
    updateMealSaleSelect();
    updateTableInfo();

    // Salvar ticketConfigs no localStorage para persistência
    saveTicketConfigsToLocalStorage();
}

document.querySelector('.btn-save-ticket').addEventListener('click', saveTicketConfig)

// Atualizar as opções de refeição no popup de venda
function updateMealSaleSelect() {
    mealSaleSelect.innerHTML = ''; // Limpar as opções atuais para evitar duplicação

    // Verificar se existem refeições configuradas
    if (Object.keys(ticketConfigs).length === 0) {
        const noMealOption = document.createElement('option');
        noMealOption.value = '';
        noMealOption.textContent = 'Nenhuma Refeição criada';
        mealSaleSelect.appendChild(noMealOption);
    } else {
        // Adiciona a opção "Selecione uma refeição" no começo
        const selectMealOption = document.createElement('option');
        selectMealOption.value = '';
        selectMealOption.textContent = 'Selecione uma refeição';
        mealSaleSelect.appendChild(selectMealOption);

        // Iterar sobre os itens armazenados no objeto e adicionar como opções
        Object.values(ticketConfigs).forEach(config => {
            const option = document.createElement('option');
            option.value = `${config.day} - ${config.meal}`;
            option.textContent = `${config.day} - ${config.meal}`;
            mealSaleSelect.appendChild(option);
        });
    }
}


// Atualizar a tabela de informações
function updateTableInfo() {
    const mealTableBody = document.querySelector('#meal-table tbody');
    mealTableBody.innerHTML = ''; // Limpar as linhas da tabela antes de adicionar as novas

    // Iterar sobre os itens armazenados no objeto
    Object.entries(ticketConfigs).forEach(([ticketKey, config]) => {
        const row = document.createElement('tr');

        // Coluna Refeição
        const mealCell = document.createElement('td');
        mealCell.textContent = `${config.meal} - ${config.day}`;
        row.appendChild(mealCell);

        // Coluna Valor com X de exclusão
        const valueCell = document.createElement('td');
        valueCell.textContent = `R$: ${config.value}`;
        
        // Criar o X de exclusão com &times;
        const deleteIcon = document.createElement('span');
        deleteIcon.classList.add('close-ticket');
        deleteIcon.innerHTML = '&times;'; // O X como texto HTML

        // Adicionar o X ao lado do valor
        valueCell.appendChild(deleteIcon);
        
        // Adicionar a célula de valor à linha
        row.appendChild(valueCell);

        // Adicionar a linha à tabela
        mealTableBody.appendChild(row);

        // Lógica para excluir a refeição quando o X for clicado
        deleteIcon.addEventListener('click', () => {
            // Remover a refeição do objeto ticketConfigs
            delete ticketConfigs[ticketKey];

            // Atualizar a tabela e o select
            updateMealSaleSelect();
            updateTableInfo();

            // Salvar novamente no localStorage
            saveTicketConfigsToLocalStorage();
        });
    });
}


// Salvar a configuração no localStorage
function saveTicketConfigsToLocalStorage() {
    localStorage.setItem('ticketConfigs', JSON.stringify(ticketConfigs));
}

// Carregar a configuração do localStorage
function loadTicketConfigsFromLocalStorage() {
    const savedConfigs = localStorage.getItem('ticketConfigs');
    if (savedConfigs) {
        ticketConfigs = JSON.parse(savedConfigs);
        updateMealSaleSelect();
        updateTableInfo();
    }
}

// Lógica do botão Limpar Configurações
document.querySelector('.btn-clear-ticket').addEventListener('click', () => {
    // Limpar o objeto ticketConfigs
    ticketConfigs = {};

    // Atualizar o select e a tabela para refletir a ausência de configurações
    updateMealSaleSelect();
    updateTableInfo();

    // Remover as configurações salvas no localStorage
    localStorage.removeItem('ticketConfigs');
});

const toggleSalePopup = ()=>{
    saleTicketPopup.classList.contains('active')
    ? saleTicketPopup.classList.remove('active')
    : saleTicketPopup.classList.add('active');
};

btnTicketSale.addEventListener('click', toggleSalePopup);
closePopupSale.addEventListener('click', toggleSalePopup);

// Seleciona os elementos do DOM
const mealHistoryContainer = document.querySelector('.meal-history-container');
const noHistoryElement = document.querySelector('.no-history');
const historyElement = document.querySelector('.history');
const mealHistoryTableBody = document.querySelector('#meal-history-table tbody');
const refreshButton = document.querySelector('.refresh-history');

// Função para buscar dados da API
async function fetchMealHistory() {
    try {
        // const response = await fetch('https://suaapi.com/historico'); // Substitua pela URL da sua API
        const data = await response.json();

        if (data.length === 0) {
            // Caso não haja histórico, exibe a tela "sem histórico"
            noHistoryElement.style.display = 'flex';
            historyElement.style.display = 'none';
        } else {
            // Caso haja histórico, preenche a tabela
            noHistoryElement.style.display = 'none';
            historyElement.style.display = 'block';
            mealHistoryTableBody.innerHTML = ''; // Limpa a tabela antes de adicionar as novas linhas

            data.forEach(entry => {
                const row = document.createElement('tr');
                const dateCell = document.createElement('td');
                dateCell.textContent = entry.date; // A data da venda
                row.appendChild(dateCell);

                const mealCell = document.createElement('td');
                mealCell.textContent = entry.meal; // O tipo de refeição
                row.appendChild(mealCell);

                const quantityCell = document.createElement('td');
                quantityCell.textContent = entry.quantity; // Quantidade vendida
                row.appendChild(quantityCell);

                const totalValueCell = document.createElement('td');
                totalValueCell.textContent = `R$ ${entry.totalValue.toFixed(2)}`; // Valor total da venda
                row.appendChild(totalValueCell);

                mealHistoryTableBody.appendChild(row);
            });
        }
    } catch (error) {
        console.error('Erro ao buscar o histórico:', error);
    }
}

// Função para lidar com o clique no botão de atualização
refreshButton.addEventListener('click', () => {
    fetchMealHistory(); // Atualiza o histórico quando o botão é clicado
});

// Função para criar o campo de pagamento
function createPaymentField() {
    // Encontra o container onde os campos de pagamento serão inseridos
    const paymentGroup = document.querySelector('.payment-group-ticket');

    // Verifica se o container existe antes de adicionar o campo
    if (!paymentGroup) {
        console.error("Container 'payment-group-ticket' não encontrado!");
        return;
    }

    // Template HTML do novo campo de pagamento
    const ticketPaymentTemplate = `
        <div class="ticket-payment">
            <div class="payment-header">
                <i class="bi bi-plus-circle-fill add-payment" style="font-size: 20px; color: #28a745; cursor: pointer;"></i>
                <i class="bi bi-x-circle-fill remove-payment" style="color: #dc3545; cursor: pointer;"></i>
            </div>
            <div class="payment-field">
                <div class="payment-info-left">
                    <label for="payment-method">Método de pagamento:</label>
                    <select class="payment-method-select" name="payment-method">
                        <option value="Dinheiro">Dinheiro</option>
                        <option value="PIX">PIX</option>
                        <option value="Débito">Débito</option>
                        <option value="Crédito">Crédito</option>
                    </select>
                </div>
                <div class="payment-info-right">
                    <label for="payment-amount">Valor:</label>
                    <input type="number" class="payment-amount-input" name="payment-amount" placeholder="R$ 00,00">
                </div>
            </div>
        </div>
    `;

    // Adiciona o novo campo de pagamento ao container
    paymentGroup.insertAdjacentHTML('beforeend', ticketPaymentTemplate);

    // Adiciona evento ao ícone de adicionar para criar novos campos
    const newAddPaymentButton = paymentGroup.querySelector('.ticket-payment:last-child .add-payment');
    newAddPaymentButton.addEventListener('click', createPaymentField);

    // Adiciona evento ao ícone de remover para remover o campo de pagamento
    const newRemovePaymentButton = paymentGroup.querySelector('.ticket-payment:last-child .remove-payment');
    newRemovePaymentButton.addEventListener('click', function () {
        const paymentBlock = newRemovePaymentButton.closest('.ticket-payment');
        paymentBlock.remove();
    });
}

// Adiciona o evento ao select de refeição
document.querySelector('.meal-sale-select').addEventListener('change', (event) => {
    const valueSelect = event.target.value;
    // Chama a função loaderSelect passando o valor selecionado
    loaderSelect(valueSelect);
});

// Adiciona o evento ao input de quantidade de tickets
document.querySelector('#ticket-quantity').addEventListener('input', function() {
    const quantityTicket = parseInt(this.value) || 0;  // Obtém o valor da quantidade de tickets
    const valueSelect = document.querySelector('.meal-sale-select').value; // Obtém o valor selecionado no select
    // Chama a função loaderSelect passando o valor do select e a quantidade
    loaderSelect(valueSelect, quantityTicket);
});

// Função para carregar os dados da refeição e calcular o valor total
function loaderSelect(valueSelect, quantityTicket = 0) {
    // Seleciona os elementos do DOM
    const mealDay = document.querySelector('#meal-day');
    const mealType = document.querySelector('#meal-type');
    const mealValue = document.querySelector('#meal-value');
    const mealValueTotal = document.querySelector('#meal-value-total');

    // Formata o valor selecionado (remover espaços ao redor de "-")
    let mealFormat = valueSelect.trim().replace(/\s*-\s*/g, "-");

    // Itera sobre as chaves do objeto ticketConfigs
    for (let meal in ticketConfigs) {
        if (meal === mealFormat) {  // Verifica se a chave corresponde ao valor selecionado
            console.log(meal);  // Exibe a chave encontrada
            console.log(ticketConfigs[meal]);  // Exibe o objeto associado à chave

            // Atribui os valores aos elementos do DOM
            mealDay.textContent = ticketConfigs[meal].day;  // Preenche o dia
            mealType.textContent = ticketConfigs[meal].meal;  // Preenche o tipo de refeição
            mealValue.textContent = ticketConfigs[meal].value;  // Preenche o valor da refeição
            mealValueTotal.textContent = (ticketConfigs[meal].value * quantityTicket).toFixed(2);  // Atualiza o valor total com a quantidade

            break; // Sai do loop após encontrar a chave correspondente
        }
    }
}

document.querySelector('.btn-save-sale').addEventListener('click', saveTicketSale);

async function saveTicketSale() {
    const mealDay = document.querySelector('#meal-day').textContent;
    const mealType = document.querySelector('#meal-type').textContent;
    const mealQuantity = document.querySelector('#ticket-quantity').value;
    const mealValue = document.querySelector('#meal-value').textContent;
    const mealValueTotal = document.querySelector('#meal-value-total').textContent;

    console.log(mealDay);
    console.log(mealType);
    console.log(mealQuantity);
    console.log(mealValue);
    console.log(mealValueTotal);

    // Agora, vamos pegar os tipos de pagamento e valores
    const paymentFields = document.querySelectorAll('.ticket-payment');  // Seleciona todos os campos de pagamento
    const paymentDataValue = [];

    paymentFields.forEach(field => {
        const paymentMethod = field.querySelector('.payment-method-select').value;  // Método de pagamento
        const paymentAmount = field.querySelector('.payment-amount-input').value;  // Valor do pagamento

        // Armazena os dados de pagamento em um objeto
        paymentDataValue.push({
            tipo: paymentMethod,
            valor: paymentAmount
        });
    });
    
    const paymenteData = {
        dia : mealDay,
        tipo: mealType,
        quantidade: mealQuantity,
        valorUnitario: mealValue,
        valorTotal: mealValueTotal,
        pagamentos: paymentDataValue
    };

    
}


// Função de inicialização
async function init() {
    // Inicializa a lógica para criação de novos campos de pagamento
    const addPaymentButton = document.querySelector('.add-payment');
    if (addPaymentButton) {
        addPaymentButton.addEventListener('click', createPaymentField);
    }

    // Outras funções do seu fluxo de inicialização (como darkmode, etc.)
    darkmode();
    expensesContent.classList.add('hidden');
    registrationContent.classList.add('hidden');
    setActive(ticketLink);  
    initRegistrationTable();
    
    // Verifica se o ticketLink tem a classe 'active' antes de chamar initCitySuggestions
    if (ticketLink.classList.contains('active')) {
        await initCitySuggestions();
    }
    
    updatePaymentInfo();
    newPaymentMethod();
    loadTicketConfigsFromLocalStorage();
    fetchMealHistory();

    // Cria o primeiro campo de pagamento ao carregar a página
    const paymentGroup = document.querySelector('.payment-group-ticket');
    if (paymentGroup && !paymentGroup.querySelector('.ticket-payment')) {
        createPaymentField();
    }

    // Evento de atualização para inputs da tabela de refeições
    document.querySelectorAll('.meal-table input[type="text"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
}


// Chama a função init quando o DOM estiver completamente carregado
document.addEventListener('DOMContentLoaded', init);
