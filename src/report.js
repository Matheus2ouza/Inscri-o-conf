import { getLocations } from "../router/dataRoutes.js";
import { getRelatorio } from "../router/reportRoutes.js"

document.addEventListener('DOMContentLoaded', async () => {
    const localidades = await fetchLocalidades();
    populateSelect(localidades);
    
    const consultarButton = document.getElementById('consultarRelatorio');
    consultarButton.addEventListener('click', async () => {
        const localidadeId = document.getElementById('localidadeSelect').value;
        
        
        await fetchRelatorio(localidadeId || ''); 
    });
});

// Função para buscar as localidades e preencher o select
async function fetchLocalidades() {
    try {
        const cidades = await getLocations(); 
        return cidades;
    } catch (error) {
        console.error('Erro ao buscar localidades:', error);
        return [];
    }
}

// Função para popular o select com localidades
function populateSelect(cidades) {
    const selectElement = document.getElementById('localidadeSelect');
    Object.values(cidades).forEach(localidade => {
        const option = document.createElement('option');
        option.value = localidade.id;
        option.textContent = localidade.nome;
        selectElement.appendChild(option);
    });
}

// Função para buscar o relatório da localidade selecionada
async function fetchRelatorio(localidadeId) {
    showLoader();
    try {
        console.log(`Fetching relatório for localidade ID: ${localidadeId}`);
        const data = await getRelatorio(localidadeId); 
        console.log('Dados recebidos:', data);

        if (data && data.length > 0) { 
            renderRelatorio(data); 
        } else {
            console.error('Erro ao buscar o relatório: Dados não encontrados');
            alert('Erro: Dados não encontrados para esta localidade.');
        }
    } catch (error) {
        console.error('Erro ao buscar o relatório:', error);
        alert(`Erro ao buscar o relatório: ${error.message || 'Erro desconhecido'}`);
    } finally {
        hideLoader(); 
    }
}

// Função para renderizar o relatório no DOM
function renderRelatorio(data) {
    const relatorioContainer = document.getElementById('relatorioContainer');
    relatorioContainer.innerHTML = ''; 

    if (data.length === 0) {
        relatorioContainer.innerHTML = '<p>Nenhum dado encontrado para esta localidade.</p>';
        return;
    }

    const tableHeaders = Object.keys(data[0]).map(header => `<th>${header}</th>`).join('');
    
    // Gera as linhas da tabela para cada localidade
    const tableRows = data.map(reportData => `
        <tr>${Object.values(reportData).map(value => `<td>${value}</td>`).join('')}</tr>
    `).join('');

    const relatorioHTML = `
        <table>
            <thead><tr>${tableHeaders}</tr></thead>
            <tbody>${tableRows}</tbody>
        </table>
    `;

    relatorioContainer.innerHTML = relatorioHTML;
}

// Função para mostrar o loader
function showLoader() {
    const loader = document.createElement('div');
    loader.id = 'loader';
    loader.textContent = 'Carregando...';
    loader.style.position = 'fixed';
    loader.style.top = '50%';
    loader.style.left = '50%';
    loader.style.transform = 'translate(-50%, -50%)';
    loader.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
    loader.style.color = 'white';
    loader.style.padding = '20px';
    loader.style.borderRadius = '5px';
    document.body.appendChild(loader);
}

// Função para esconder o loader
function hideLoader() {
    const loader = document.getElementById('loader');
    if (loader) {
        loader.remove();
    }
}
