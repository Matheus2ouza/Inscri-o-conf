import { getDashboardData } from './router.js';

document.addEventListener('DOMContentLoaded', () => {
    showLoader();

    fetchDashboardData();
});

function showLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.remove('hidden');
}

function hideLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.add('hidden');
}

document.addEventListener('DOMContentLoaded', () => {
    const toggleButton = document.getElementById('toggleNightMode');

    toggleButton.addEventListener('click', () => {
        // Alterna o modo noturno para o body
        document.body.classList.toggle('night-mode');

        // Alterna o modo noturno para a nav
        const nav = document.querySelector('nav');
        if (nav) nav.classList.toggle('night-mode');

        // Alterna o modo noturno para os cards
        document.querySelectorAll('.card').forEach(card => {
            card.classList.toggle('night-mode');
        });

        // Alterna o modo noturno para o modal
        const modal = document.querySelector('.modal');
        if (modal) {
            modal.classList.toggle('night-mode');
        }

        // Alterna o modo noturno para o conteúdo do modal
        document.querySelectorAll('.modal-content').forEach(modalContent => {
            modalContent.classList.toggle('night-mode');
        });

        // Alterna o modo noturno para as tabelas
        document.querySelectorAll('table').forEach(table => {
            table.classList.toggle('night-mode');
        });

        // Alterna o modo noturno para os botões de detalhes
        document.querySelectorAll('.details-btn').forEach(btn => {
            btn.classList.toggle('night-mode');
        });

        // Alterna o modo noturno para as divs específicas
        document.querySelectorAll('.ranking-cidades').forEach(div => {
            div.classList.toggle('night-mode');
        });

        document.querySelectorAll('.list-card').forEach(div => {
            div.classList.toggle('night-mode');
        });

        document.querySelectorAll('.lista-eventos').forEach(div => {
            div.classList.toggle('night-mode');
        });
        // Altera o texto do botão conforme o modo
        if (document.body.classList.contains('night-mode')) {
            toggleButton.innerHTML = '🌙'; 
        } else {
            toggleButton.innerHTML = '☀️'; 
        }
    });
});




// Função principal para buscar os dados do dashboard
async function fetchDashboardData() {
    showLoader();
    try {
        const data = await getDashboardData();
        console.log(data);
        if (data) {
            renderDashboard(data);
        } else {
            console.error('Nenhum dado retornado do dashboard.');
        }
    } catch (error) {
        console.error(`Erro ao buscar dados do dashboard: ${error.message}`);
    } finally {
        hideLoader();
    }
}

function renderDashboard(data) {
    
    document.getElementById('hospedagem').innerHTML = createCard('Hospedagem', data.hospedagem.data.length, data.hospedagem.data);
    document.getElementById('inscricoes0_6').innerHTML = createCard('Inscrições 0 a 6 Anos', calculateTotalInscricoesFaixaEtaria(data.inscricoes0_6.data), data.inscricoes0_6.data);
    document.getElementById('inscricoes7_10').innerHTML = createCard('Inscrições 7 a 10 Anos', calculateTotalInscricoesFaixaEtaria(data.inscricoes7_10.data), data.inscricoes7_10.data);
    document.getElementById('inscricoes10_acima').innerHTML = createCard('Inscrições 10 Anos ou Mais', calculateTotalInscricoesFaixaEtaria(data.inscricoes10_acima.data), data.inscricoes10_acima.data);
    document.getElementById('inscricaoGeral').innerHTML = createCard('Inscrição Geral', calculateTotalInscricoes(data.inscricaoGeral.data), data.inscricaoGeral.data);
    document.getElementById('movimentacaoFinanceira').innerHTML = createCard('Movimentação Financeira', calculateTotalMovimentacao(data.movimentacaoFinanceira.data), data.movimentacaoFinanceira.data);
    document.getElementById('pagamento').innerHTML = createCard('Pagamentos', calculateTotalPagamento(data.pagamento.data), data.pagamento.data);
    document.getElementById('saldoDevedor').innerHTML = createCard('Saldo Devedor Localidades', calculateTotalPagamento(data.localidades.data), data.localidades.data);
   
    document.getElementById('lista-eventos').innerHTML = createEventDataListCard(data.eventos?.data || []);
    document.getElementById('lista-tipo-inscricao').innerHTML = createDataListCard('Taxas de Inscrição', data.tipoInscricao?.data || []);
    document.getElementById('ranking-cidades').innerHTML = renderCityRanking(data.inscricaoGeral?.data || []);
    //document.getElementById('localidades-saldo').innerHTML = createDataListCard('Saldo Devedor por Localidade', data.localidades?.data || []);
    addDetailButtonsListeners();
}

// criar um card de lista
function createDataListCard(title, dataList) {
    const headers = Object.keys(dataList[0] || {}).map(header => `<th>${header}</th>`).join('');
    const rows = dataList.map(item => {
        return `<tr>${Object.values(item).map(value => `<td>${value}</td>`).join('')}</tr>`;
    }).join('');

    return `
        <div class="list-card">
            <h2>${title}</h2>
            <table>
                <thead><tr>${headers}</tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function createEventDataListCard(dataList) {
    if (dataList.length === 0) {
        return `<div class="list-card"><h2>Eventos</h2><p>Nenhum registro encontrado.</p></div>`;
    }

    
    const rows = dataList.map(item => {
        return `<tr><td>${item.descricao || 'Descrição não disponível'}</td></tr>`;
    }).join('');

    return `
        <div class="list-card">
            <h2>Eventos</h2>
            <table>
                <thead><tr><th>Descrição</th></tr></thead>
                <tbody>${rows}</tbody>
            </table>
        </div>
    `;
}

function generateCityRanking(data) {
    const cityCounts = {};

    // total de inscritos por localidade
    data.forEach(item => {
        const city = item.localidade;
        const total = item.qtd_geral; 

        if (cityCounts[city]) {
            cityCounts[city] += total;
        } else {
            cityCounts[city] = total;
        }
    });

    const sortedCities = Object.entries(cityCounts)
        .sort((a, b) => b[1] - a[1]) 
        .map(([city, total]) => ({ city, total }));

    return sortedCities;
}

// Função para renderizar o ranking no card
function renderCityRanking(data) {
    const ranking = generateCityRanking(data);
    
    // Criar o conteúdo do ranking
    const rankingHtml = ranking.map((item, index) => `
        <li class="list-item">${index + 1}. ${item.city}: ${item.total} inscritos</li>
    `).join('');

    // Retornar o card completo
    return `
        <div class="card">
            <h3 class="card-title">Inscritos por Localidade</h3>
            <ul class="list">${rankingHtml}</ul>
        </div>
    `;
}

// cálculo para cada tipo de dado
function calculateTotalEventos(items) {
    return items.reduce((sum, item) => sum + (item.qtd_geral || 0), 0);
}

function calculateTotalInscricoes(items) {
    return items.reduce((sum, item) => sum + (item.qtd_geral || 0), 0);
}

function calculateTotalInscricoesFaixaEtaria(items) {
    const totalMasculino = items.reduce((sum, item) => sum + Number(item.qtd_masculino || 0), 0);
    const totalFeminino = items.reduce((sum, item) => sum + Number(item.qtd_feminino || 0), 0);
    return totalMasculino + totalFeminino;
}

function calculateTotalMovimentacao(items) {
    return items.reduce((sum, item) => sum + (parseFloat(item.valor) || 0), 0);
}

function calculateTotalPagamento(items) {
    return items.reduce((sum, item) => sum + (parseFloat(item.valor_pago) || 0), 0);
}

function calculateTotalTipoInscricao(items) {
    return items.reduce((sum, item) => sum + (item.qtd_geral || 0), 0);
}

function createCard(title, total, data) {
    return `
        <h2>${title}</h2>
        <p>Total: ${total}</p>
        <button class="details-btn circle-btn" data-title="${title}" data-details='${JSON.stringify(data)}'>+</button>
    `;
}

// Adiciona event listeners para os botões de detalhes
function addDetailButtonsListeners() {
    const detailButtons = document.querySelectorAll('.details-btn');
    detailButtons.forEach(button => {
        button.addEventListener('click', () => {
            const title = button.getAttribute('data-title');
            const details = JSON.parse(button.getAttribute('data-details'));
            showDetails(title, details);
        });
    });
}

// Função para mostrar os detalhes em um modal
function showDetails(title, details) {
    const modal = document.createElement('div');
    modal.classList.add('modal');

    // Obter as chaves dos primeiros itens do JSON para construir os cabeçalhos
    const headers = Object.keys(details[0] || {});

    // Criação da tabela com os detalhes
    const tableHeader = headers.map(header => `<th>${header}</th>`).join('');
    
    const tableRows = details.map(item => {
        return `
            <tr>
                ${headers.map(header => `<td>${item[header] !== undefined ? item[header] : 'N/A'}</td>`).join('')}
            </tr>
        `;
    }).join('');

    const modalContent = `
        <div class="modal-content">
            <span class="close" onclick="this.parentElement.parentElement.remove();">&times;</span>
            <h2>${title}</h2>
            <table>
                <thead>
                    <tr>
                        ${tableHeader}
                    </tr>
                </thead>
                <tbody>
                    ${tableRows}
                </tbody>
            </table>
        </div>
    `;

    modal.innerHTML = modalContent;
    document.body.appendChild(modal);
}

// Inicializa o dashboard
document.addEventListener('DOMContentLoaded', fetchDashboardData);
