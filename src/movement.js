import { getfinancialMovement, createPdf, getLocations } from './router.js';

let dataInscricao = {};
let dataInscricaoAvulsa = {};
let dataTicket = {};
let dataMovimentacao = {};

function toggleLoader(show) {
    const loader = document.querySelector('.loader-background');
    if (show) {
        loader.style.display = 'flex';  // Torna o loader visível com display flex
    } else {
        loader.style.display = 'none';  // Oculta o loader
    }
}

async function format() {
    toggleLoader(true)
    try {
        const data = await getfinancialMovement();
        const localidades = await getLocations();
    
        let index = 1;
        let avulsaIndex = 1;
        let ticketIndex = 1;
        let movimentacaoIndex = 1;
    
        data.forEach(item => {
    
            let localidadeId = extrairIdDescricao(item.descricao);
    
            if (localidadeId !== null) {
                const localidade = localidades[localidadeId];
    
                if (localidade) {
                    const novaDescricao = item.descricao.replace(/id[:\s]*\d+/i, localidade.nome);
    
                    if (item.descricao.startsWith("Inscrição avulsa")) {
                        dataInscricaoAvulsa[avulsaIndex] = { ...item, id: avulsaIndex, descricao: novaDescricao };
                        avulsaIndex++;
                    } else {
                        dataInscricao[index] = { ...item, id: index, descricao: novaDescricao };
                        index++;
                    }
                }
            } else {
                // Classificação das descrições sem ID de localidade
                if (item.descricao.startsWith("Venda de Alimentação")) {
                    dataTicket[ticketIndex] = { ...item, id: ticketIndex };
                    ticketIndex++;
                } else if (item.descricao.startsWith("Movimentação do tipo")) {
                    dataMovimentacao[movimentacaoIndex] = { ...item, id: movimentacaoIndex };
                    movimentacaoIndex++;
                }
            }
        });
    
        addDataToTableInscricao();
        addDataToTableConferencia();
        calcularTotais();

        console.log(dataInscricao);
        console.log(dataInscricaoAvulsa);
        console.log(dataMovimentacao);
        console.log(dataTicket);
    }catch(error) {
        console.log(error)
        alert(`Erro ao carregar os dados. Recarregando a página em 3 2 1...`);
        setTimeout(() => {
            location.reload();
        }, 3000);
    } finally {
        toggleLoader(false)
    }
}

// Função para extrair ID da localidade para inscrições normais e avulsas
function extrairIdDescricao(descricao) {
    let matchInscricaoNormal = descricao.match(/^Pagamento referente à localidade com ID:\s*(\d+)/);
    if (matchInscricaoNormal) {
        return parseInt(matchInscricaoNormal[1]);
    }

    let matchInscricaoAvulsa = descricao.match(/^Inscrição avulsa, id:\s*(\d+),/);
    if (matchInscricaoAvulsa) {
        return parseInt(matchInscricaoAvulsa[1]);
    }

    return null;
}

function formatDate(dateString) {
    return new Intl.DateTimeFormat('pt-BR').format(new Date(dateString));
};

function createDetailsRow(pagamentos) {
    const detailsRow = document.createElement("tr");
    detailsRow.classList.add("details-row");
    detailsRow.style.display = "none"; // Começa oculta

    const detailsCell = document.createElement("td");
    detailsCell.colSpan = 6; // Mescla todas as colunas

    // Verifica se o array de pagamentos tem elementos
    if (!pagamentos || pagamentos.length === 0) {
        detailsCell.innerHTML = `
            <div class="details-container">
                <p><strong>Sem pagamentos registrados.</strong></p>
            </div>
        `;
    } else {
        // Se houver pagamentos, cria um contêiner para os pagamentos lado a lado
        const paymentsContainer = document.createElement('div');
        paymentsContainer.classList.add('payments-container');
        
        // Exibe os detalhes de cada pagamento dentro do contêiner
        pagamentos.forEach(pagamento => {
            const pagamentoDiv = document.createElement('div');
            pagamentoDiv.classList.add('details-container'); // Estiliza cada item
            
            pagamentoDiv.innerHTML = `
                <p><strong>TIPO DE PAGAMENTO:</strong> ${pagamento.tipo_pagamento}</p>
                <p><strong>VALOR:</strong> R$ ${pagamento.valor}</p>
            `;
            
            paymentsContainer.appendChild(pagamentoDiv);
        });

        detailsCell.appendChild(paymentsContainer);
    }

    detailsRow.appendChild(detailsCell);
    return detailsRow;
}

function addDataToTableInscricao() {
    const tbody = document.getElementById("inscricao-tbody");

    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

    for (const key in dataInscricao) {
        const item = dataInscricao[key];
        const row = document.createElement("tr");

        // Criando células
        const cellId = document.createElement("td");
        cellId.textContent = item.id;
        row.appendChild(cellId);

        const cellTipo = document.createElement("td");
        cellTipo.textContent = item.tipo;

        if (item.tipo.toLowerCase() === "entrada") {
            cellTipo.style.backgroundColor = "green";
            cellTipo.style.color = "white";
            cellTipo.style.textAlign = "center";
        }

        row.appendChild(cellTipo);

        const cellDescricao = document.createElement("td");
        cellDescricao.textContent = item.descricao;
        row.appendChild(cellDescricao);

        const cellValor = document.createElement("td");
        cellValor.textContent = `R$: ${item.valor}`;
        row.appendChild(cellValor);

        const cellData = document.createElement("td");
        cellData.textContent = formatDate(item.data);
        row.appendChild(cellData);

        // Criando botão de detalhes
        const cellDetalhes = document.createElement("td");
        const btnDetalhes = document.createElement("button");
        btnDetalhes.textContent = "Ver Detalhes";
        btnDetalhes.classList.add("btn-detalhes");
        btnDetalhes.addEventListener("click", () => toggleDetails(row, item));

        cellDetalhes.appendChild(btnDetalhes);
        row.appendChild(cellDetalhes);

        tbody.appendChild(row);
        tbody.appendChild(createDetailsRow(item.pagamentos)); // Adiciona a linha de detalhes
    }
}

function addDataToTableConferencia() {
    const tbody = document.querySelector(".table-conferencia tbody");

    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

    let dataCollections = [dataInscricaoAvulsa, dataTicket, dataMovimentacao];

    dataCollections.forEach((dataSet) => {
        for (const key in dataSet) {
            const item = dataSet[key];
            const row = document.createElement("tr");
            row.classList.add("main-row");

            // Criando células
            const cellId = document.createElement("td");
            cellId.textContent = item.id;
            row.appendChild(cellId);

            const cellTipo = document.createElement("td");
            cellTipo.textContent = item.tipo;
            cellTipo.classList.add(item.tipo.toLowerCase() === "entrada" ? "tipo-entrada" : "tipo-saida");
            row.appendChild(cellTipo);

            const cellDescricao = document.createElement("td");
            cellDescricao.textContent = item.descricao;
            row.appendChild(cellDescricao);

            const cellValor = document.createElement("td");
            cellValor.textContent = `R$: ${item.valor}`;
            row.appendChild(cellValor);

            const cellData = document.createElement("td");
            cellData.textContent = formatDate(item.data);
            row.appendChild(cellData);

            // Criando botão de detalhes
            const cellDetalhes = document.createElement("td");
            const btnDetalhes = document.createElement("button");
            btnDetalhes.textContent = "Ver Detalhes";
            btnDetalhes.classList.add("btn-detalhes");
            btnDetalhes.addEventListener("click", () => toggleDetails(row, item));

            cellDetalhes.appendChild(btnDetalhes);
            row.appendChild(cellDetalhes);

            tbody.appendChild(row);
            tbody.appendChild(createDetailsRow(item.pagamentos)); // Adiciona a linha de detalhes
        }
    });
}


// Alterna a exibição dos detalhes
function toggleDetails(row) {
    const nextRow = row.nextElementSibling; // A linha seguinte é a dos detalhes

    if (nextRow && nextRow.classList.contains("details-row")) {
        nextRow.style.display = nextRow.style.display === "none" ? "table-row" : "none";
    }
}


function calcularTotais() {
    // Seleciona os elementos das boxes
    const totalGeral = document.querySelector("#total-geral p");
    const totalInscricao = document.querySelector("#total-inscricao p");
    const totalConferencia = document.querySelector("#total-conferencia p");
    const totalInscricaoAvulsa = document.querySelector("#total-inscricao-avulsa p");
    const totalTicket = document.querySelector("#total-ticket p");
    const totalSaida = document.querySelector("#total-saida p");

    // Inicializa os totais
    let totalValueGeral = 0;
    let totalValueInscricao = 0;
    let totalValueConferencia = 0;
    let totalValueInscricaoAvulsa = 0;
    let totalValueTicket = 0;
    let totalValueSaida = 0;

    // Função para somar valores de um conjunto de dados
    function somarValores(dataSet) {
        let total = 0;
        for (const key in dataSet) {
            total += parseFloat(dataSet[key].valor) || 0;
        }
        return total;
    }

    // Calcula cada total
    totalValueInscricao = somarValores(dataInscricao);
    totalValueInscricaoAvulsa = somarValores(dataInscricaoAvulsa);
    totalValueTicket = somarValores(dataTicket);

    // Soma os valores para conferência (Inscrição Avulsa + Ticket + Movimentação)
    for (const key in dataMovimentacao) {
        const item = dataMovimentacao[key];
        const valor = parseFloat(item.valor) || 0;

        if (item.tipo.toLowerCase() === "entrada") {
            totalValueConferencia += valor; // Soma entradas normalmente
        } else if (item.tipo.toLowerCase() === "saida") {
            totalValueSaida += valor; // Soma apenas saídas para o total de saída
        }
    }

    // O total de conferência é a soma de Inscrição Avulsa, Ticket e Entradas da Movimentação
    totalValueConferencia += totalValueInscricaoAvulsa + totalValueTicket;

    // O total geral soma tudo
    totalValueGeral = totalValueInscricao + totalValueConferencia - totalValueSaida;

    // Atualiza os elementos na interface
    totalGeral.textContent = totalValueGeral.toFixed(2);
    totalInscricao.textContent = totalValueInscricao.toFixed(2);
    totalConferencia.textContent = totalValueConferencia.toFixed(2);
    totalInscricaoAvulsa.textContent = totalValueInscricaoAvulsa.toFixed(2);
    totalTicket.textContent = totalValueTicket.toFixed(2);
    totalSaida.textContent = totalValueSaida.toFixed(2);
}

async function create() {
    const selectValue = document.querySelector('.select-download').value;
    const value = selectValue.replace("download ", "").trim(); // Remove "download " e espaços extras

    console.log('Valor selecionado:', value);

    if (!value) {
        alert('Selecione uma opção válida!');
        return;
    }

    // Capturar valores das caixas de totais
    const totals = {
        totalGeral: document.querySelector("#total-geral p").innerText,
        totalInscricao: document.querySelector("#total-inscricao p").innerText,
        totalConferencia: document.querySelector("#total-conferencia p").innerText,
        totalInscricaoAvulsa: document.querySelector("#total-inscricao-avulsa p").innerText,
        totalTicket: document.querySelector("#total-ticket p").innerText,
        totalSaida: document.querySelector("#total-saida p").innerText
    };

    // Objetos de dados
    const dataOptions = {
        geral: {
            tipo: "geral",
            dataInscricao: dataInscricao,
            dataInscricaoAvulsa: dataInscricaoAvulsa,
            dataTicket: dataTicket,
            dataMovimentacao: dataMovimentacao,
            ...totals
        },
        inscricao: {
            tipo: "inscricao",
            dataInscricao: dataInscricao,
            totalInscricao: totals.totalInscricao
        },
        conferencia: {
            tipo: "conferencia",
            dataInscricaoAvulsa: dataInscricaoAvulsa,
            dataTicket: dataTicket,
            dataMovimentacao: dataMovimentacao,
            totalConferencia: totals.totalConferencia
        },
        inscricao_avulsa: {
            tipo: "inscricao_avulsa",
            dataInscricaoAvulsa: dataInscricaoAvulsa,
            totalInscricaoAvulsa: totals.totalInscricaoAvulsa
        },
        ticket: {
            tipo: "ticket",
            dataTicket: dataTicket,
            totalTicket: totals.totalTicket
        },
        movimentacao: {
            tipo: "movimentacao",
            dataMovimentacao: dataMovimentacao,
            totalSaida: totals.totalSaida
        }
    };

    // Monta o objeto `data` de acordo com a opção selecionada
    const data = dataOptions[value];

    if (!data) {
        alert("Opção inválida.");
        return;
    }

    console.log(data)
    try {
        const response = await createPdf(data); // Chama a função que gera e baixa o PDF

        if (response.status === 405) {
            alert(`Nenhuma opção selecionada, selecione uma opção de download e tente novamente`);
        } else if (response.status === 404) {
            alert(`Nenhum dado encontrado...`);
        }

    } catch (error) {
        console.error('Erro no processo de criação do PDF:', error);
        alert("Erro do Servidor. Tente novamente.");
    }
}


document.querySelector('.downloadPDF').addEventListener('click', create);

// Inicialização da página
function init() {
    format();

}

document.addEventListener('DOMContentLoaded', init);
