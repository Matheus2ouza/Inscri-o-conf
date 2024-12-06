import { getLocations } from './router.js';

const checkbox = document.querySelector('#chk'),
    inscricaoLink = document.querySelector('.inscricao-link'),
    ticketLink = document.querySelector('.ticket-link'),
    expensesLink = document.querySelector('.expenses-link'),
    expensesContent = document.querySelector('.expenses-content'),
    registrationContent = document.querySelector('.registration-content'),
    ticketContent = document.querySelector('.ticket-content'),
    expensesTableWrapper = document.querySelector('.expenses-table-wrapper'),
    button = document.querySelector('.button-add'),
    buttonTwo = document.querySelector('.button-add-two'),
    expensesTable = document.querySelector('.table-expenses tbody'),
    popup = document.querySelector('.popup'),
    popupTicket = document.querySelector('.popup-ticket'),
    buttonConfigTicket = document.querySelector('.btn-config'),
    closePopupExpenses = document.querySelector('.close-btn-expenses'),
    closePopupTicket = document.querySelector('#close-btn-ticket'),
    valueCafeSabado = document.querySelector('.value-cafe-sabado'),
    valueAlmoçoSabado = document.querySelector('.value-almoço--sabado'),
    valuejantaSabado = document.querySelector('.value-janta-sabado'),
    valueCafeDomingo = document.querySelector('.value-cafe-domingo'),
    valueAlmoçoDomingo = document.querySelector('.value-almoço-domingo'),
    registerConfig = document.querySelector('.register-ticket'),
    closePopUpCreate = document.querySelector('.close-btn-ticket'),
    popupTicketCreate = document.querySelector('.popup-create-ticket'),
    popUpAlert = document.querySelector('.popUp-container-alert'),
    closePopUpAlert = document.querySelector('.close-btn-alert');


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

function alertPopUp (mensage) {
    const mensageField = document.querySelector('.mensage-alert p')
    popUpAlert.style.display = 'flex';

    mensageField.textContent = mensage
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

function newpaymentMothod() {
    // Encontra o container principal onde os campos de pagamento serão inseridos
    const container = document.querySelector('.payment-container');
    
    // Delegação de evento para o botão de adicionar (bi-plus-circle-fill) e o botão de excluir (bi-x-circle-fill)
    container.addEventListener('click', function(event) {
        // Adiciona um novo campo de pagamento quando clica no ícone de +
        if (event.target.classList.contains('bi-plus-circle-fill')) {
            container.insertAdjacentHTML('beforeend', paymentFieldTemplate);
        }
        
        // Remove o campo de pagamento quando clica no ícone de x
        if (event.target.classList.contains('bi-x-circle-fill')) {
            // Remove o div pai do ícone (campo de pagamento) do contêiner
            const paymentField = event.target.closest('.input-group-payment');
            if (paymentField) {
                paymentField.remove();
            }
        }
    });
}

function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background')
    loaderBackground.classList.toggle('hiddenLoader', !show)
}

function showPopup() {
    [button, buttonTwo].forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            popup.style.display = 'flex';
        });
    });
}

function showCreateTicket() {
    const buttonAdd = document.querySelector('.btn-add')
    
    buttonAdd.addEventListener('click', (event) =>{
        event.preventDefault();
        popupTicketCreate.style.display = 'flex'
    })
}

function clearPopupFields() {
    // Limpar os campos de entrada de número (inputs) nas refeições
    document.querySelectorAll('.popup-input-container input[type="number"]').forEach(input => {
        input.value = ''; // Limpa os campos de quantidade e valor
    });

    // Seleciona todos os campos de pagamento dinâmicos
    const paymentFields = document.querySelectorAll('.input-group-payment');

    // Se houver mais de um campo de pagamento, remove os adicionais, exceto o primeiro
    paymentFields.forEach((field, index) => {
        if (index === 0) {
            // Limpa o valor do input do primeiro campo de pagamento
            field.querySelector('.input-amount').value = '';
        } else {
            // Remove os campos adicionais
            field.remove();
        }
    });
}

function initRegistrationTable() {
    // Seleciona todos os campos necessários
    const rows = document.querySelectorAll(".registration-table tbody tr");
    const totalItems = document.querySelectorAll(".totais .total-item");

    // Atualiza os totais sempre que algo muda nos campos de entrada
    const updateTotals = () => {
        let totalGeral = 0;

        rows.forEach((row, index) => {
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

            // Atualiza os totais na seção Totais com base no data-faixa
            const faixa = row.dataset.faixa;
            const totalItem = document.querySelector(`.totais .total-item[data-faixa="${faixa}"]`);
            if (totalItem) {
                totalItem.querySelector(".total-quantity").textContent = totalQuantidade;
                totalItem.querySelector(".total-value").textContent = `R$ ${totalValor.toFixed(2)}`;
            }

            // Adiciona ao total geral
            totalGeral += totalValor;
        });

        // Atualiza o total geral
        document.querySelector(".totais .total-value.geral").textContent = `R$ ${totalGeral.toFixed(2)}`;
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
        { faixa: '10+', valor: 200 },
        { faixa: 'Visitante', valor: 100 }
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


// Função para abrir o modal de pagamento
function openPaymentModal() {
    const totalValueElement = document.querySelector('#total-value'); // Assumindo que você tenha esse elemento no seu código
    const totalQuantityElement = document.querySelector('#total-quantity');

    if (!totalValueElement || !totalQuantityElement) {
        console.error("Elementos de total geral não encontrados!");
        return; // Caso os elementos não existam, não faça nada
    }

    const totalGeral = totalValueElement.textContent.replace('R$', '').trim();
    const totalQuantity = totalQuantityElement.textContent;
    
    // Exibir o modal
    document.getElementById('payment-modal').style.display = 'flex';

    // Atualizar as informações no modal de pagamento
    document.querySelector('#total-quantity-modal').textContent = totalQuantity; // Atualizando o Total Geral
    document.querySelector('#total-value-modal').textContent = `R$ ${totalGeral}`; // Atualizando o Valor Final
}


// Função para finalizar o pagamento
function finalizePayment() {
    const paymentType = document.querySelector('#payment-type').value;
    const paymentAmount = parseFloat(document.querySelector('#amount').value) || 0;
    const totalGeral = parseFloat(document.querySelector('#total-value-geral').textContent.replace('R$', '').trim());

    if (paymentAmount >= totalGeral) {
        alert(`Pagamento de R$ ${paymentAmount.toFixed(2)} realizado com sucesso! Forma de pagamento: ${paymentType}`);
    } else {
        alert('Valor insuficiente para pagamento!');
    }

    // Fechar o modal após o pagamento
    closePaymentModal();
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

// Atualizando os totais na primeira execução
updatePaymentInfo();

// Função para exibir o popup de ticket
buttonConfigTicket.addEventListener('click', (event) => {
    event.preventDefault();
    popupTicket.style.display = 'flex';
});

// Função para fechar o popup de despesas
closePopupExpenses.addEventListener('click', (event) => {
    event.preventDefault();
    popup.style.display = 'none';
});

// Função para fechar o popup de ticket
closePopupTicket.addEventListener('click', (event) => {
    event.preventDefault();
    popupTicket.style.display = 'none';
});

// Função para fechar o popup de criação
closePopUpCreate.addEventListener('click', (event) => {
    event.preventDefault();
    popupTicketCreate.style.display = 'none';
    clearPopupFields();
});

// Função para fechar o popup de alerta
closePopUpAlert.addEventListener('click', (event) => {
    event.preventDefault();
    popUpAlert.style.display = 'none';
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

let mealPrices = {};

// Função para carregar valores salvos do Local Storage
function loadMealPrices() {
    const savedMealPrices = JSON.parse(localStorage.getItem('mealPrices'));
    if (savedMealPrices) {
        mealPrices = savedMealPrices;
        valueCafeSabado.value = savedMealPrices.caféSábado || '';
        valueAlmoçoSabado.value = savedMealPrices.almocoSábado || '';
        valuejantaSabado.value = savedMealPrices.jantarSábado || '';
        valueCafeDomingo.value = savedMealPrices.caféDomingo || '';
        valueAlmoçoDomingo.value = savedMealPrices.almocoDomingo || '';
    } else {
        // Inicializa com valores padrão caso ainda não tenha nada salvo
        mealPrices = {
            caféSábado: 0,
            almocoSábado: 0,
            jantarSábado: 0,
            caféDomingo: 0,
            almocoDomingo: 0
        };
    }
}

function configFood() {
    // Função para salvar as configurações no Local Storage
    function saveMealPrices() {
        mealPrices = {
            caféSábado: parseFloat(valueCafeSabado.value) || 0,
            almocoSábado: parseFloat(valueAlmoçoSabado.value) || 0,
            jantarSábado: parseFloat(valuejantaSabado.value) || 0,
            caféDomingo: parseFloat(valueCafeDomingo.value) || 0,
            almocoDomingo: parseFloat(valueAlmoçoDomingo.value) || 0
        };

        console.log(mealPrices)
        localStorage.setItem('mealPrices', JSON.stringify(mealPrices));
    }

    // Carrega os valores das refeições ao abrir a página
    loadMealPrices();

    // Evento para salvar os valores das refeições ao clicar em "Registrar Configuração"
    registerConfig.addEventListener('click', (event) => {
        event.preventDefault();
        saveMealPrices();
        popupTicket.style.display = 'none';
    });
}

// Função para calcular o valor total da refeição com base na quantidade e no valor unitário
function calculateTotalValue() {
    const day = document.querySelector('.select-day').value; 
    const meal = document.querySelector('.select-meal').value; 
    const quantity = parseFloat(document.querySelector('.input-Qtd').value) || 0; 
    const mealKey = meal + day;
    const unitPrice = mealPrices[mealKey] || 0;  // Obtém o valor da refeição com base no dia e no tipo de refeição
    const totalValue = quantity * unitPrice;  // Calcula o valor total

    // Atualiza o campo 'input-value' com o valor total
    document.querySelector('.input-value').value = totalValue.toFixed(2);  
}

let mealEntryData = {};

// Função para salvar os dados da refeição e pagamentos
function saveMealEntry() {
    // Coleta os dados dos campos de refeição
    const day = document.querySelector('.select-day').value;
    const meal = document.querySelector('.select-meal').value;
    const quantity = document.querySelector('.input-Qtd').value;
    const value = parseFloat(document.querySelector('.input-value').value) || 0;  // Valor total já calculado

    // Coleta os dados dos métodos de pagamento
    const paymentFields = document.querySelectorAll('.input-group-payment');
    const payments = Array.from(paymentFields).map(field => {
        const paymentType = field.querySelector('.select-payment').value;
        const amount = parseFloat(field.querySelector('.input-amount').value) || 0;
        return { paymentType, amount };
    });

    // Calcula o valor total dos pagamentos
    const totalPayment = payments.reduce((acc, payment) => acc + payment.amount, 0);
    
    // Verifica se o valor total dos pagamentos corresponde ao valor da refeição
    if (totalPayment !== value) {
        const missingAmount = (value - totalPayment).toFixed(2);
        alertPopUp(`O total dos pagamentos não corresponde ao valor da refeição. Faltam R$ ${missingAmount}. Por favor, verifique os valores.`);
        return false;  // Indica falha na verificação
    } else {

        // Salva os dados no objeto global
        mealEntryData = {
            day,
            meal,
            quantity,
            value,
            payments
        };

        updateMealTable();
        updatePaymentHistory(mealEntryData);
        return true;  // Indica sucesso na verificação
    }
}

// Eventos para calcular o valor total da refeição em tempo real
document.querySelector('.input-Qtd').addEventListener('input', calculateTotalValue);
document.querySelector('.select-day').addEventListener('change', calculateTotalValue);
document.querySelector('.select-meal').addEventListener('change', calculateTotalValue);

// Função para atualizar a tabela com base nos dados do mealEntryData
function updateMealTable() {
    const rows = document.querySelectorAll('.meal-table tbody tr');

    rows.forEach(row => {
        const dayCell = row.querySelector('.day-meal').textContent.trim();
        const mealCell = row.querySelector('.meal-item').textContent.trim().toLowerCase();

        console.log(`Comparando ${dayCell} com ${mealEntryData.day} e ${mealCell} com ${mealEntryData.meal}`);
        
        if (dayCell === mealEntryData.day && mealCell === mealEntryData.meal.toLowerCase()) {
            // Atualiza a quantidade e o valor total na linha correspondente
            row.querySelector('.qty label').textContent = mealEntryData.quantity;
            row.querySelector('.total label').textContent = `R$ ${mealEntryData.value.toFixed(2)}`;

            console.log("Linha da tabela atualizada:", dayCell, mealCell);
        }
    });
}

// Função para atualizar o histórico de pagamentos
function updatePaymentHistory(data) {
    const historyList = document.querySelector('#payment-history-list');
    const historyNone = document.querySelector('.history-none');
    const ticketHistory = document.querySelector('.ticket-history');

    // Cria uma nova linha para o corpo da tabela de histórico
    const newHistoryRow = document.createElement('tr');
    newHistoryRow.innerHTML = `
        <td class="day-meal">${data.day}</td>
        <td class="meal-item">${data.meal}</td>
        <td class="history-col-qty">${data.quantity}</td>
        <td class="history-col-total">R$ ${data.value.toFixed(2)}</td>
        <td class="history-col-payments">
            ${data.payments.map(payment => `
                <div class="history-payment-item">
                    <strong>${payment.paymentType}:</strong> R$ ${payment.amount.toFixed(2)}
                </div>
            `).join('')}
        </td>
    `;

    // Adiciona a nova linha ao corpo da tabela dentro do primeiro item da lista
    const tableBody = historyList.querySelector('tbody');
    tableBody.appendChild(newHistoryRow);

    // Verifica se há itens no histórico e alterna a exibição
    if (tableBody.children.length > 0) {
        historyNone.style.display = 'none';  // Esconde a mensagem "Nenhum Histórico registrado"
        historyList.style.display = 'block';  // Mostra a lista de histórico
        ticketHistory.style.backgroundColor = '#fff';  // Altera o fundo para branco
    }
}

// Função para configurar o botão de salvar
function configureSaveMealEntryButton() {
    document.querySelector('.btn-save').addEventListener('click', (event) => {
        event.preventDefault();
        const isSaved = saveMealEntry();  // Executa a função e verifica o sucesso
        if (isSaved) {
            popupTicketCreate.style.display = 'none';
            clearPopupFields();
        }
    });
}

function registerExpense() {
    const registerExpense = document.querySelector('.register-expenses');

    registerExpense.addEventListener('click', (event) => {
        event.preventDefault();

        const responsible = document.querySelector('.input-responsible').value,
            description = document.querySelector('.input-description').value,
            value = document.querySelector('.input-value').value;

        if (responsible && description && value) {
            const expenseData = {
                responsible,
                description,
                value
            };

            const newRow = document.createElement('tr');
            newRow.innerHTML = `
                <td>${expenseData.responsible}</td>
                <td>${expenseData.description}</td>
                <td class="expense-value-cell">${expenseData.value} <span class="expense-close-btn">&times;</span></td>
            `;
            expensesTable.appendChild(newRow);

            // Clear input fields
            document.querySelector('.input-responsible').value = '';
            document.querySelector('.input-description').value = '';
            document.querySelector('.input-value').value = '';

            console.log(expenseData);

            // Show table and hide "no expenses" message
            document.querySelector('.table-none').style.display = 'none';
            document.querySelector('.table-expenses').style.display = 'table';

            // Set background color of expensesTableWrapper
            expensesTableWrapper.style.backgroundColor = '#f2f2f2';

            // Hide the popup
            popup.style.display = 'none';

            // Add delete event to new row
            const deleteIcon = newRow.querySelector('.expense-close-btn');
            deleteIcon.addEventListener('click', () => {
                newRow.remove();
                checkTableContent(); // Check if table is empty
            });
        }
    });
}

function checkTableContent() {
    if (expensesTable.children.length === 0) {
        document.querySelector('.table-none').style.display = 'block';
        document.querySelector('.table-expenses').style.display = 'none';
        expensesTableWrapper.style.backgroundColor = '#919191'
    }
}

// Função init para inicializar a página
async function init() {
    darkmode();
    expensesContent.classList.add('hidden');
    registrationContent.classList.add('hidden');
    setActive(ticketLink);
    registerExpense();
    initRegistrationTable();
    showPopup();
    await initCitySuggestions();
    configFood();
    newpaymentMothod();
    showCreateTicket();
    configureSaveMealEntryButton();
    updatePaymentInfo();

    // Evento de atualização para inputs da tabela de refeições
    document.querySelectorAll('.meal-table input[type="text"]').forEach(input => {
        input.addEventListener('input', updateTotals);
    });
}

init();
