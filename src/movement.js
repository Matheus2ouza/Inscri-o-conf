import { getfinancialMovement, createPdfMovement } from './router.js';
//controle do dark mode
function darkMode () {
    const toggle = document.getElementById("chk");

    // Verifica o estado salvo no localStorage
    if (localStorage.getItem("dark-mode") === "enabled") {
        document.body.classList.add("dark-mode");
        toggle.checked = true;
    }

    //controla o passe para dark ou normal e guarda o estado em memorial local
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

// Função para preencher a tabela com os dados das movimentações e calcular o valor total
async function populateTable() {
    const movements = await getfinancialMovement();
    const tableBody = document.querySelector("#movementsTable tbody");
    let total = 0; // Variável para calcular o total

    Object.values(movements).forEach(moviment => {
        const row = document.createElement("tr");
        const formattedDate = formatDate(moviment.data); //formatação de data para dd/mm/aaaa

        // Determina a classe a ser aplicada com base no tipo
        const tipoClass = moviment.tipo === 'Entrada' ? 'tipo-entrada' : 'tipo-saida';

        // Atualiza o total
        total += (moviment.tipo === 'Entrada' ? 1 : -1) * parseFloat(moviment.valor);

        row.innerHTML = `
            <td>${moviment.id}</td>
            <td class="${tipoClass}">${moviment.tipo}</td>
            <td>${moviment.descricao}</td>
            <td>${moviment.valor}</td>
            <td>${formattedDate}</td>
        `;

        tableBody.appendChild(row);
    });

    // Atualiza o valor total na interface
    document.getElementById("totalValue").textContent = `R$ ${total.toFixed(2)}`;
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');  // Adiciona zero à esquerda, se necessário
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Mês é 0-indexado, então adicionamos +1
    const year = date.getFullYear();

    return `${day}/${month}/${year}`;
}

// Função para agrupar os dados por dia e tipo
function groupDataByDateAndType(movements) {
    const groupedData = {};

    movements.forEach(movement => {
        const formattedDate = formatDate(movement.data);
        const tipo = movement.tipo === 'Entrada' ? 'entrada' : 'saida';

        if (!groupedData[formattedDate]) {
            groupedData[formattedDate] = { entrada: [], saida: [] };
        }

        groupedData[formattedDate][tipo].push(movement);
    });

    return groupedData;
}

async function downloadPDF() {
    try {
        // Obtém os dados das movimentações
        const movements = await getfinancialMovement(); 
        
        // Verifica se os dados foram obtidos corretamente
        if (!movements || movements.length === 0) {
            console.error("Nenhuma movimentação financeira encontrada.");
            return;
        }

        // Agrupa os dados por data e tipo (entrada/saída)
        const groupedMovements = groupDataByDateAndType(Object.values(movements)); 

        // Chama a função para gerar e fazer o download do PDF com os dados agrupados
        console.log(groupedMovements)
        await createPdfMovement(groupedMovements);

        console.log('PDF gerado com sucesso!');
    } catch (error) {
        console.error('Erro ao gerar o PDF:', error);
    }
}



// Adicionando evento de clique no botão de download
document.getElementById('downloadBtn').addEventListener('click', downloadPDF);

function init () {
    darkMode();
    populateTable();
}

init();