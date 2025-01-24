import { getLocations, getDatalocations, getProofPayment } from './router.js';

let isCitySelected = false;
let dataLocations = {}; // Variável global para armazenar os dados das localidades
let locationsName = {};

// Exibe ou oculta o loader
function toggleLoader(show) {
    const loader = document.querySelector('.loader-background');
    if (show) {
        loader.style.display = 'flex';  // Torna o loader visível com display flex
    } else {
        loader.style.display = 'none';  // Oculta o loader
    }
}

// Filtra e exibe sugestões de cidades
function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase();
    const filteredCities = cityNames.filter(city => city.toLowerCase().includes(inputValue));
    
    suggestions.innerHTML = '';
    suggestions.style.display = filteredCities.length && inputValue ? 'block' : 'none';

    filteredCities.forEach(city => {
        const item = document.createElement('div');
        item.classList.add('suggestion-item');
        item.textContent = city;

        item.addEventListener('click', () => {
            input.value = city;
            suggestions.innerHTML = '';
            suggestions.style.display = 'none';
            isCitySelected = true;
        });

        suggestions.appendChild(item);
    });
}

// Inicializa as sugestões de cidades com base em dataLocations
async function initCitySuggestions() {
    if (Object.keys(dataLocations).length === 0) {
        console.warn("dataLocations ainda não está carregado.");
        return;
    }

    const cityNames = Object.keys(dataLocations);
    const input = document.getElementById('input1');
    const suggestions = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        isCitySelected = false;
        filterCities(cityNames, input, suggestions);
    });

    input.addEventListener('focus', () => {
        if (!isCitySelected && input.value) {
            filterCities(cityNames, input, suggestions);
        }
    });
}

// Preenche a tabela de localidades
async function fetchAndRenderLocalities() {
    const tableBody = document.querySelector('.locality-table tbody');

    try {
        toggleLoader(true);
        locationsName = await getLocations();
        tableBody.innerHTML = Object.values(locationsName)
            .map(({ nome, saldoDevedor }, index) => `                
                <tr>
                    <td class="col-number">${index + 1}</td>
                    <td class="col-locality">${nome}</td>
                    <td class="col-payment">R$ ${Number(saldoDevedor).toFixed(2)}</td>
                    <td class="col-status ${saldoDevedor > 0 ? 'open' : 'closed'}">
                        <span>${saldoDevedor > 0 ? 'Aberto' : 'Fechado'}</span>
                    </td>
                </tr>
            `)
            .join('');
    } catch (error) {
        console.error('Erro ao buscar localidades:', error);
        tableBody.innerHTML = ` 
            <tr>
                <td colspan="4" style="text-align: center; color: red;">Erro ao carregar dados</td>
            </tr>
        `;
    } finally {
        toggleLoader(false);
    }
}

// Carrega os dados de localidades e associa os comprovantes
async function associateComprovantesToLocalities() {
    try {
        toggleLoader(true);

        let locations = await getDatalocations();
        const response = await getProofPayment();

        const comprovantes = Array.isArray(response.comprovantes) ? response.comprovantes : [];

        const comprovantesPorLocalidade = {};

        comprovantes.forEach(comprovante => {
            const { localidade_nome, imagem_base64, tipo_arquivo, valor_pago } = comprovante;

            if (!comprovantesPorLocalidade[localidade_nome]) {
                comprovantesPorLocalidade[localidade_nome] = [];
            }

            comprovantesPorLocalidade[localidade_nome].push({
                imagem_base64,
                tipo_arquivo,
                valor_pago
            });
        });

        Object.keys(locations).forEach(localidadeNome => {
            if (comprovantesPorLocalidade[localidadeNome]) {
                locations[localidadeNome].comprovantes = comprovantesPorLocalidade[localidadeNome];
            } else {
                locations[localidadeNome].comprovantes = [];
            }
        });

        dataLocations = locations;
    } catch (error) {
        console.error("Erro ao exibir os dados de localidades:", error);
    } finally {
        toggleLoader(false);
    }
}

// Pesquisa dados de uma localidade específica
function filterName(name) {
    const regex = /^[^\d\\/]+/;  // Expressão regular para capturar somente caracteres não numéricos, barras (/) e barras invertidas (\)
    const match = name.match(regex);
    return match ? match[0] : name;
}

async function searchData() {
    const localitySelect = document.querySelector('#input1').value;

    // Procurar a localidade pelo nome na estrutura de dataLocations
    const locality = Object.values(locationsName).find(item => item.nome === localitySelect);

    // Limpar os dados anteriores (tabela de comprovantes e galeria de imagens)
    clearPreviousData();

    if (dataLocations[localitySelect]) {
        const localityData = dataLocations[localitySelect];

        // Preencher os dados da localidade
        const localityNameElement = document.querySelector('.data-locality-name');
        if (localityNameElement) localityNameElement.textContent = localitySelect;

        const filteredResponsible = filterName(localityData.nome_responsavel || 'N/A');
        const localityResponsibleElement = document.querySelector('.data-locality-responsible');
        if (localityResponsibleElement) localityResponsibleElement.textContent = filteredResponsible;

        const localityQtdElement = document.querySelector('.data-locality-qtd');
        if (localityQtdElement) localityQtdElement.textContent = localityData.qtd_0_6 + localityData.qtd_7_10 + localityData.qtd_10_acima || '0';

        const qtd06Element = document.querySelector('.data-06-qtd');
        if (qtd06Element) qtd06Element.textContent = localityData.qtd_0_6 || '0';

        const qtd710Element = document.querySelector('.data-710-qtd');
        if (qtd710Element) qtd710Element.textContent = localityData.qtd_7_10 || '0';

        const qtd10moreElement = document.querySelector('.data-10more-qtd');
        if (qtd10moreElement) qtd10moreElement.textContent = localityData.qtd_10_acima || '0';

        const serviceQtdElement = document.querySelector('.data-service-qtd');
        if (serviceQtdElement) serviceQtdElement.textContent = localityData.qtd_servico || '0';

        const participationQtdElement = document.querySelector('.data-participation-qtd');
        if (participationQtdElement) participationQtdElement.textContent = localityData.qtd_tx_participacao || '0';

        const statusElement = document.querySelector('.status');
        const saldoDevedor = locality.saldoDevedor

        if (statusElement) {
            if (saldoDevedor > 0) {
                statusElement.textContent = 'EM ABERTO';
                statusElement.style.backgroundColor = 'red'; // Fundo vermelho
                statusElement.style.color = 'white'; // Cor do texto branca
            } else {
                statusElement.textContent = 'PAGO';
                statusElement.style.backgroundColor = '#28a745'; // Fundo verde
                statusElement.style.color = 'white'; // Cor do texto branca
            }
        }

        const comprovantes = localityData.comprovantes || [];

        if (comprovantes.length > 0) {
            const headerElement = document.querySelector('h1.hidden');
            if (headerElement) headerElement.classList.remove('hidden');

            const tablePaymentsElement = document.querySelector('.table-payments');
            if (tablePaymentsElement) tablePaymentsElement.classList.remove('hidden');

            const noDataMessageElement = document.querySelector('.no-data-message');
            if (noDataMessageElement) noDataMessageElement.classList.add('hidden');

            const tbody = document.querySelector('.table-payments tbody');
            if (tbody) tbody.innerHTML = ''; // Limpar a tabela antes de adicionar novos dados

            comprovantes.forEach((comprovante, index) => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td class="payment-number">${index + 1}</td>
                    <td class="payment-value">R$ ${Number(comprovante.valor_pago).toFixed(2)}</td>
                `;
                tbody.appendChild(row);
            });

            // Adicionar as imagens do comprovante
            addProofImages(comprovantes);
        } else {
            const tablePaymentsElement = document.querySelector('.table-payments');
            if (tablePaymentsElement) tablePaymentsElement.classList.add('hidden');

            const noDataMessageElement = document.querySelector('.no-data-message');
            if (noDataMessageElement) noDataMessageElement.classList.remove('hidden');
        }
    } else {
        console.warn(`Localidade "${localitySelect}" não encontrada nos dados.`);
        
        const headerElement = document.querySelector('h1.hidden');
        if (headerElement) headerElement.classList.remove('hidden');

        const tablePaymentsElement = document.querySelector('.table-payments');
        if (tablePaymentsElement) tablePaymentsElement.classList.add('hidden');

        const noDataMessageElement = document.querySelector('.no-data-message');
        if (noDataMessageElement) noDataMessageElement.classList.remove('hidden');
    }
}

// Função para limpar os dados anteriores
function clearPreviousData() {
    // Limpar a tabela de pagamentos
    const tbody = document.querySelector('.table-payments tbody');
    tbody.innerHTML = ''; // Limpar todas as linhas da tabela

    // Limpar a galeria de imagens
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Limpar a galeria de imagens

    // Limpar os textos
    document.querySelector('.data-locality-name').textContent = '';
    document.querySelector('.data-locality-responsible').textContent = '';
    document.querySelector('.data-locality-qtd').textContent = '';
    document.querySelector('.data-06-qtd').textContent = '';
    document.querySelector('.data-710-qtd').textContent = '';
    document.querySelector('.data-10more-qtd').textContent = '';
    document.querySelector('.data-service-qtd').textContent = '';
    document.querySelector('.data-participation-qtd').textContent = '';
    document.querySelector('.status').textContent = '';
}

let currentZoom = 1; // Variável para controlar o nível de zoom

// Função para carregar e exibir os comprovantes com as miniaturas
function addProofImages(comprovantes) {
    const gallery = document.getElementById('gallery');
    gallery.innerHTML = ''; // Limpar a galeria antes de adicionar os novos comprovantes

    comprovantes.forEach((comprovante, index) => {
        const div = document.createElement('div');
        div.classList.add('comprovante');

        // Adicionar a imagem do comprovante
        const content = `
            <img src="${comprovante.imagem_base64}" alt="Comprovante ${index + 1}" class="thumbnail" data-index="${index + 1}" data-base64="${comprovante.imagem_base64}">
            <button class="download-button" data-index="${index + 1}" data-base64="${comprovante.imagem_base64}">
                Baixar Comprovante ${index + 1}
            </button>
        `;
        
        div.innerHTML = content;
        gallery.appendChild(div);
    });

    // Adicionar evento de clique para abrir a imagem no modal
    const thumbnails = document.querySelectorAll('.thumbnail');
    thumbnails.forEach(img => {
        img.addEventListener('click', openImageModal);
    });

    // Adicionar evento de clique para o botão de fechar no modal
    const closeButton = document.querySelector('.close');
    closeButton.addEventListener('click', closeModal);

    // Adicionar eventos de zoom
    const zoomInButton = document.getElementById('zoomIn');
    const zoomOutButton = document.getElementById('zoomOut');
    const resetZoomButton = document.getElementById('resetZoom');

    zoomInButton.addEventListener('click', zoomIn);
    zoomOutButton.addEventListener('click', zoomOut);
    resetZoomButton.addEventListener('click', resetZoom);
}

function openImageModal(event) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const caption = document.getElementById('caption');

    // Exibir o modal
    modal.style.display = 'block';
    modalImage.src = event.target.src; // Definir a imagem no modal
    caption.textContent = event.target.alt; // Definir a legenda da imagem

    // Resetar o zoom quando a imagem for aberta
    currentZoom = 1;
    modalImage.style.transform = `scale(${currentZoom})`;
}

// Função para aumentar o zoom
function zoomIn() {
    currentZoom += 0.1;
    updateZoom();
}

// Função para diminuir o zoom
function zoomOut() {
    currentZoom -= 0.1;
    updateZoom();
}

// Função para resetar o zoom
function resetZoom() {
    currentZoom = 1;
    updateZoom();
}

// Função para aplicar o zoom
function updateZoom() {
    const modalImage = document.getElementById('modalImage');
    modalImage.style.transform = `scale(${currentZoom})`;
    modalImage.style.transition = 'transform 0.3s ease-in-out';
}

// Função para fechar o modal
function closeModal() {
    const modal = document.getElementById('imageModal');
    modal.style.display = 'none'; // Fechar o modal
}

// Função para capturar o clique no botão de download e chamar a função de download
function downloadComprovante(event) {
    const button = event.target;
    const index = button.getAttribute('data-index');
    const imagemBase64 = button.getAttribute('data-base64');
    const localityName = document.querySelector('#input1').value

    const link = document.createElement('a');
    link.href = `${imagemBase64}`;
    link.download = `comprovante_${localityName}_${index}.jpg`;
    link.click();
}

// Adicionar o evento de clique para todos os botões de download
document.querySelector('#gallery').addEventListener('click', function(event) {
    if (event.target.classList.contains('download-button')) {
        downloadComprovante(event);
    }
});

document.querySelector('.search-locality').addEventListener('click', searchData);

function createReport() {
    console.log(dataLocations);
};

document.querySelector('.download-report').addEventListener('click', createReport);

// Inicializa a aplicação
async function init() {
    await associateComprovantesToLocalities(); // Carrega os dados de localidades
    await initCitySuggestions(); // Inicializa as sugestões com os dados carregados
    await fetchAndRenderLocalities(); // Renderiza a tabela de localidades
}


init();
