import { getfinancialMovement, createPdfMovement } from './router.js';

// Controle do dark mode
function darkMode() {
    const toggle = document.getElementById("chk");

    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        toggle.checked = true;
    }

    toggle.addEventListener("change", () => {
        if (toggle.checked) {
            document.body.classList.add("dark-mode");
            localStorage.setItem("dark-mode", "enabled");
        } else {
            document.body.classList.remove("dark-mode");
            localStorage.setItem("dark-mode", "disabled");
        }
    });
}

async function populateTable() {
    const movements = await getfinancialMovement();
    const tableBody = document.querySelector("#movementsTable tbody");
    let total = 0;

    movements.forEach(moviment => {
        const formattedDate = formatDate(moviment.data);
        const tipoClass = moviment.tipo === 'Entrada' ? 'tipo-entrada' : 'tipo-saida';
        total += (moviment.tipo === 'Entrada' ? 1 : -1) * parseFloat(moviment.valor);

        // Cria a linha principal
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${moviment.id}</td>
            <td class="${tipoClass}">${moviment.tipo}</td>
            <td>${moviment.descricao}</td>
            <td>R$ ${parseFloat(moviment.valor).toFixed(2)}</td>
            <td>${formattedDate}</td>
            <td>
                <button class="details-button" data-id="${moviment.id}">Ver detalhes</button>
            </td>
        `;
        tableBody.appendChild(row);

        // Cria a linha dos pagamentos associados
        const paymentRow = document.createElement("tr");
        paymentRow.classList.add("payment-row");
        paymentRow.style.display = "none";
        paymentRow.setAttribute('data-id', moviment.id);

        if (moviment.pagamentos && moviment.pagamentos.length > 0) {
            paymentRow.innerHTML = `
                <td colspan="6">
                    <strong>Pagamentos:</strong>
                    <ul>
                        ${moviment.pagamentos.map(p => {
                            // Aqui, estamos acessando os campos corretamente
                            return `
                                <li>
                                    <strong>Forma:</strong> ${p.tipo_pagamento || 'N/A'} | 
                                    <strong>Valor:</strong> R$ ${parseFloat(p.valor).toFixed(2) || '0.00'} | 
                                    <strong>Data:</strong> ${formattedDate || 'N/A'}
                                </li>
                            `;
                        }).join('')}
                    </ul>
                </td>
            `;
        } else {
            paymentRow.innerHTML = `
                <td colspan="6">
                    <strong>Sem pagamentos associados.</strong>
                </td>
            `;
        }
        tableBody.appendChild(paymentRow);
    });

    // Atualiza o valor total na interface
    document.getElementById("totalValue").textContent = `R$ ${total.toFixed(2)}`;

    // Adiciona eventos de clique aos botões de detalhes
    document.querySelectorAll('.details-button').forEach(button => {
        button.addEventListener('click', () => {
            const id = button.getAttribute('data-id');
            const detailsRow = document.querySelector(`.payment-row[data-id="${id}"]`);
            if (detailsRow) {
                detailsRow.style.display = detailsRow.style.display === "none" ? "table-row" : "none";
            }
        });
    });
}


// Formatação de data para dd/mm/aaaa
function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// Função para agrupar os dados por dia, tipo e pagamentos
function groupDataByDateAndType(movements) {
    const groupedData = {};

    movements.forEach(movement => {
        const formattedDate = formatDate(movement.data);
        const tipo = movement.tipo === 'Entrada' ? 'entrada' : 'saida';

        if (!groupedData[formattedDate]) {
            groupedData[formattedDate] = { entrada: [], saida: [] };
        }

        // Cria uma cópia do movimento, removendo os pagamentos do agrupamento principal
        const movementData = { ...movement };
        delete movementData.pagamentos; // Remove os pagamentos do agrupamento principal

        // Agrupa os pagamentos com as movimentações
        groupedData[formattedDate][tipo].push({
            ...movementData,
            pagamentos: movement.pagamentos // Inclui os pagamentos como subtipo
        });
    });

    return groupedData;
}

// Função para baixar o PDF com os dados agrupados
async function downloadPDF() {
    
    try {
        const movements = await getfinancialMovement();
        if (!movements || movements.length === 0) {
            console.error("Nenhuma movimentação financeira encontrada.");
            return;
        }

        // Agrupa os dados por data e tipo
        const groupedMovements = groupDataByDateAndType(movements);
        
        // Prepare os dados para o PDF com os pagamentos detalhados
        const pdfData = Object.keys(groupedMovements).map(date => {
            const dateData = groupedMovements[date];

            return {
                date,
                entrada: dateData.entrada.map(movement => ({
                    ...movement,
                    pagamentos: movement.pagamentos.map(p => ({
                        tipo_pagamento: p.tipo_pagamento,
                        valor_pago: p.valor,
                    }))
                })),
                saida: dateData.saida.map(movement => ({
                    ...movement,
                    pagamentos: movement.pagamentos.map(p => ({
                        tipo_pagamento: p.tipo_pagamento,
                        valor_pago: p.valor,
                    }))
                }))
            };
        });

        console.log(pdfData);

        // Passa os dados agrupados para a criação do PDF
        await createPdfMovement(pdfData);
        console.log('PDF gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
    }
}


// Evento do botão de download do PDF
document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

// Inicialização da página
function init() {
    darkMode();
    populateTable();
}

init();
