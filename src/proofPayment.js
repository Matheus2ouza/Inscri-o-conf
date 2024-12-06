import { getLocations, getDataLocations, getpaymentReceipts, getComprovantes } from './router.js';

const paymentTable = document.querySelector('.table-payments');
const noDataMessage = document.querySelector('.no-data-message');
const titleHistoryPayment = document.querySelector('.second-table h1')

let localityValue;
let dataLocations;
let payment;
let qtdGeral;
let groupedData;
let proofPaymentData;

// Função genérica para buscar dados da API ou de cache IndexedDB
async function fetchDataWithCache(apiCall, storageKey) {
    try {
        // Verifica se está online
        if (navigator.onLine) {
            // Se online, tenta buscar os dados da API
            const data = await apiCall();

            // Armazena os dados no IndexedDB para uso futuro
            await storeData(storageKey, data);

            // Log para verificar se os dados foram armazenados
            console.log(`Dados armazenados no IndexedDB com a chave: ${storageKey}`);

            return data;
        } else {
            // Se offline, tenta carregar os dados armazenados localmente no IndexedDB
            const storedData = await getData(storageKey);

            if (storedData) {
                // Se houver dados armazenados, retorna-os
                return storedData;
            } else {
                // Caso não haja dados armazenados, retorna um array vazio
                console.error('Sem conexão e sem dados armazenados.');
                return [];
            }
        }
    } catch (error) {
        console.error(`Erro ao buscar dados: ${error.message}`);
        return [];
    }
}

// Função para armazenar dados no IndexedDB
async function storeData(key, data) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readwrite');
    const store = tx.objectStore('cache');
    store.put({ key, data });

    await tx.complete;

    // Log para confirmar que os dados foram salvos no IndexedDB
    console.log(`Dados com a chave '${key}' foram inseridos no IndexedDB.`);

    return true;
}

// Função para obter dados do IndexedDB
async function getData(key) {
    const db = await openDB();
    const tx = db.transaction('cache', 'readonly');
    const store = tx.objectStore('cache');
    const result = await store.get(key);
    await tx.complete;
    return result ? result.data : null;
}

// Função para abrir ou criar a base de dados IndexedDB
async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('cacheDB', 1);

        request.onerror = () => reject('Erro ao abrir IndexedDB');
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains('cache')) {
                db.createObjectStore('cache', { keyPath: 'key' });
            }
        };
    });
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

function extractCityNames(cities) {
    return Object.values(cities).map(city => city.nome);
}

// Função principal para buscar os nomes das cidades
async function fetchCityNames() {
    try {
        toggleLoader(true);

        // Usa a função fetchDataWithCache para buscar as cidades com verificação de conexão e cache
        const cities = await fetchDataWithCache(getLocations, 'cities');
        
        // Extrai e retorna os nomes das cidades
        return extractCityNames(cities);
    } catch (error) {
        console.error(`Erro ao buscar nomes das cidades: ${error.message}`);
        return [];
    } finally {
        toggleLoader(false);
    }
}
async function requestPaymentReceipts() {
    try {
        toggleLoader(true);

        // Usa a função fetchDataWithCache para buscar os dados de comprovantes de pagamento com verificação de conexão e cache
        const dataPaymentReceipts = await fetchDataWithCache(getpaymentReceipts, 'paymentReceipts');
        
        // Atribuindo os arrays às variáveis específicas
        payment = dataPaymentReceipts.pagamentos;   // Array de pagamentos
        qtdGeral = dataPaymentReceipts.qtdGerais;   // Array de quantidade geral

        console.log(payment);
        console.log(qtdGeral);

        // Chama a função e obtém os dados agrupados
        groupedData = groupAndSumQtdGeral(qtdGeral);
        
        // Agora você pode logar os dados agrupados
        console.log(groupedData);
    } catch (error) {
        console.error(`Erro ao buscar comprovantes de pagamento: ${error.message}`);
    } finally {
        toggleLoader(false);
    }
}

function groupAndSumQtdGeral(qtdGeral) {
    const groupedData = {};

    qtdGeral.forEach(item => {
        const localidadeId = item.localidade_id;

        // Se o localidade_id ainda não existe no objeto groupedData, inicializamos
        if (!groupedData[localidadeId]) {
            groupedData[localidadeId] = {
                localidade_id: localidadeId,
                nome_responsavel: item.nome_responsavel, // Mantém o primeiro nome_responsavel
                qtd_0_6: 0,
                qtd_7_10: 0,
                qtd_10_acima: 0,
                qtd_servico: 0,
                qtd_tx_participacao: 0,
                qtd_geral: 0 // Inicializando qtd_geral
            };
        }

        // Somando as quantidades para cada categoria (masculino + feminino)
        groupedData[localidadeId].qtd_0_6 += (item.qtd_0_6_masculino || 0) + (item.qtd_0_6_feminino || 0);
        groupedData[localidadeId].qtd_7_10 += (item.qtd_7_10_masculino || 0) + (item.qtd_7_10_feminino || 0);
        groupedData[localidadeId].qtd_10_acima += (item.qtd_10_acima_masculino || 0) + (item.qtd_10_acima_feminino || 0);
        groupedData[localidadeId].qtd_servico += (item.qtd_servico_masculino || 0) + (item.qtd_servico_feminino || 0);
        groupedData[localidadeId].qtd_tx_participacao += (item.qtd_tx_participacao_masculino || 0) + (item.qtd_tx_participacao_feminino || 0);

        // Atualizando a qtd_geral para cada localidade_id (somando todas as categorias)
        groupedData[localidadeId].qtd_geral = 
            groupedData[localidadeId].qtd_0_6 +
            groupedData[localidadeId].qtd_7_10 +
            groupedData[localidadeId].qtd_10_acima +
            groupedData[localidadeId].qtd_servico +
            groupedData[localidadeId].qtd_tx_participacao;
    });

    // Convertendo o objeto para um array para facilitar o uso
    return Object.values(groupedData);
}

async function getdatalocality() {
    try {
        toggleLoader(true);

        // Usa a função fetchDataWithCache para buscar os dados da localidade com verificação de conexão e cache
        dataLocations = await fetchDataWithCache(getDataLocations, 'dataLocations');
        
        // Faz o que for necessário com os dados, neste caso, apenas exibindo no console
        console.log(dataLocations);
    } catch (error) {
        console.error(`Erro ao buscar dados das localidades: ${error.message}`);
    } finally {
        toggleLoader(false);
    }
}

async function getProofPayment() {
    try {
        toggleLoader(true);
        
        // Usa a função fetchDataWithCache para buscar os dados de comprovantes com verificação de conexão e cache
        const dataproofpayment = await fetchDataWithCache(getComprovantes, 'proofPayment');
        
        // Armazena os dados de comprovantes
        proofPaymentData = dataproofpayment;
        
        console.log(proofPaymentData);
    } catch (error) {
        console.error('Erro ao obter comprovantes:', error.message);
    } finally {
        toggleLoader(false);
    }
}



// Função para exibir os comprovantes filtrados pelo locality_id
function showProofPayment(locality_id) {

    // Busca o nome da localidade pelo ID no array dataLocations
    const locality = dataLocations.find(location => location.id === locality_id);
    const localityName = locality ? locality.nome : 'Localidade não encontrada';

    console.log(`Exibindo comprovantes para a localidade: ${localityName} (ID: ${locality_id})`);

    // Filtra os comprovantes pelo locality_id
    const filteredProofs = proofPaymentData.filter(proof => proof.localidade_id === locality_id);
    const gallery = document.getElementById('gallery'); // Seleciona o container onde os cards serão exibidos
    gallery.innerHTML = ''; // Limpa o conteúdo anterior do container

    if (filteredProofs.length === 0) {
        console.log(`Nenhum comprovante encontrado para a localidade ${locality_id}.`);
    } else {
        // Itera sobre os comprovantes filtrados
        filteredProofs.forEach(proof => {
            console.log(`Comprovante ID: ${proof.id}`);
            console.log(`Tipo de Arquivo: ${proof.tipo_arquivo}`);
            console.log(`Valor Pago: ${proof.valor_pago}`);
            console.log('---');

            // Cria o card
            const card = document.createElement('div');
            card.classList.add('card');

            // Adiciona a imagem ou mensagem de erro para tipos diferentes
            const imageContainer = document.createElement('div');
            imageContainer.classList.add('image');
            
            if (proof.tipo_arquivo.startsWith('image')) {
                const imgElement = document.createElement('img');
                imgElement.src = proof.base64Image; // Base64 da imagem
                imgElement.alt = `Comprovante ${proof.id}`; // Texto alternativo
                imgElement.classList.add('comprovante-image'); // Classe CSS para personalizar
                imageContainer.appendChild(imgElement); // Adiciona a imagem ao container

                // Clique na imagem para abrir o modal
                imageContainer.addEventListener('click', () => openModal(proof.base64Image, `Comprovante ${proof.id}`, 'image'));

            } else if (proof.tipo_arquivo === 'application/pdf') {
                // Se for PDF, exibe o texto de clique
                const pdfLink = document.createElement('div');
                pdfLink.classList.add('pdf-link');
                pdfLink.textContent = 'Arquivo em PDF, para verificar clique aqui';

                // Adiciona o texto de clique no container
                imageContainer.appendChild(pdfLink);

                // Clique no texto para abrir o PDF no modal
                imageContainer.addEventListener('click', () => openModal(proof.base64Image, `Comprovante ${proof.id}`, 'pdf'));
            } else {
                imageContainer.textContent = 'Tipo de arquivo não suportado'; // Mensagem para tipos diferentes
            }


            // Adiciona o valor pago
            const loveElement = document.createElement('div');
            loveElement.classList.add('love');
            loveElement.innerHTML = `
                <svg viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg" class="svg">
                    <path d="M256 32C132.29 32 32 132.29 32 256s100.29 224 224 224 224-100.29 224-224S379.71 32 256 32zm32 352h-16v-32.29c-40.12-2.42-72.63-18.29-72.63-47.15 0-22.45 18.6-35.71 53.33-43.59l19.3-4.47c36.16-8.32 47.22-14.62 47.22-27.88 0-15.91-15.65-26.25-44.37-26.25-27.44 0-46.88 10.06-61.08 16.91l-10.46-40.3c14.53-6.23 37.31-12.61 64.22-13.55V128h16v32.12c36.26 2.54 68.63 19.6 68.63 48.1 0 21.82-17.48 36.16-54.65 44.42l-21.23 4.73c-38.23 8.52-45.42 17.62-45.42 29.85 0 16.37 17.53 24.15 50.37 24.15 27.62 0 51.43-9.1 66.18-16.83l10.2 40.3c-14.9 8-39.47 15.92-66.63 17.12V384z"></path>
                </svg>
                <span>${proof.valor_pago}</span>`;

            // Adiciona o botão de ação
            const actionButton = document.createElement('button');
            actionButton.classList.add('action');

            // Função para calcular o tamanho do arquivo a partir do base64
            function base64FileSize(base64String) {
                const padding = base64String.endsWith('==') ? 2 : base64String.endsWith('=') ? 1 : 0;
                return Math.round((base64String.length * (3 / 4)) - padding);
            }

            // Calcula o tamanho do arquivo (em bytes) para exibição no tooltip
            let fileSize = 0;
            let fileSizeFormatted = '';

            // Verifica o tipo de arquivo
            if (proof.tipo_arquivo.startsWith('image')) {
                // Para imagens, calcula o tamanho
                fileSize = base64FileSize(proof.base64Image);
                fileSizeFormatted = `${(fileSize / 1024).toFixed(2)}KB`; // Converte para KB
            } else if (proof.tipo_arquivo === 'application/pdf') {
                // Para PDFs, calcula o tamanho
                fileSize = base64FileSize(proof.base64Image);
                fileSizeFormatted = `${(fileSize / 1024).toFixed(2)}KB`; // Converte para KB
            } else {
                alert('Tipo de arquivo não suportado para download.');
            }

            // Cria o conteúdo do botão com o tooltip
            actionButton.innerHTML = `
                <div class="container-download">
                    <div class="button" data-tooltip="Size: ${fileSizeFormatted}">
                        <div class="button-wrapper">
                            <div class="text">Download</div>
                            <span class="icon">
                                <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" role="img" width="2em" height="2em" preserveAspectRatio="xMidYMid meet" viewBox="0 0 24 24">
                                    <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15V3m0 12l-4-4m4 4l4-4M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17"></path>
                                </svg>
                            </span>
                        </div>
                    </div>
                </div>`;

            // Define o evento de download para imagem ou PDF
            actionButton.addEventListener('click', () => {
                // Cria um link de download
                const downloadLink = document.createElement('a');
                
                // Verifica o tipo de arquivo
                if (proof.tipo_arquivo.startsWith('image')) {
                    // Para imagens, cria o link com a base64
                    downloadLink.href = proof.base64Image;
                    downloadLink.download = `comprovante_${proof.id}.jpg`; // Altere a extensão conforme o tipo de imagem (exemplo: .jpg, .png)
                } else if (proof.tipo_arquivo === 'application/pdf') {
                    // Para PDFs, cria o link com a base64
                    downloadLink.href = proof.base64Image;
                    downloadLink.download = `comprovante_${proof.id}.pdf`; // Extensão .pdf
                } else {
                    alert('Tipo de arquivo não suportado para download.');
                    return;
                }

                // Simula o clique no link de download
                downloadLink.click();
            });

            // Monta o card
            card.appendChild(imageContainer);
            card.appendChild(loveElement);
            card.appendChild(actionButton);

            // Adiciona o card ao container
            gallery.appendChild(card);
        });
    }
}

let zoomLevel = 1; // Nível inicial de zoom

function openModal(fileSrc, altText, fileType) {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalPDF = document.getElementById('modalPDF');
    const caption = document.getElementById('caption');

    // Esconde a visualização da imagem e PDF inicialmente
    modalImage.style.display = 'none';
    modalPDF.style.display = 'none';

    // Exibe o modal e define a legenda
    modal.classList.remove('hidden');
    caption.textContent = altText;

    // Configura a exibição de imagem ou PDF
    if (fileType === 'image') {
        modalImage.style.display = 'block';
        modalImage.src = fileSrc; // Define a imagem no modal
        modalImage.style.transform = `scale(${zoomLevel})`; // Aplica o zoom
        modalImage.style.maxWidth = '100%'; // Limita a largura máxima
        modalImage.style.maxHeight = '80vh'; // Limita a altura máxima
    } else if (fileType === 'pdf') {
        modalPDF.style.display = 'block';
        modalPDF.data = fileSrc; // Define o PDF no modal
        modalPDF.style.width = '90%'; // Largura do PDF
        modalPDF.style.height = '90vh'; // Altura do PDF
        modalPDF.style.margin = '0 auto'; // Centraliza o PDF
    }

    zoomLevel = 1; // Reseta o zoom ao abrir o modal
}

// Fechar o modal ao clicar no botão de fechar ou fora da imagem/PDF
document.querySelector('.close').addEventListener('click', closeModal);
document.getElementById('imageModal').addEventListener('click', (event) => {
    if (event.target === event.currentTarget) closeModal();
});

// Controle de Zoom
document.getElementById('zoomIn').addEventListener('click', () => {
    zoomLevel += 0.1;
    applyZoom();
});

document.getElementById('zoomOut').addEventListener('click', () => {
    if (zoomLevel > 0.1) {
        zoomLevel -= 0.1;
        applyZoom();
    }
});

document.getElementById('resetZoom').addEventListener('click', () => {
    zoomLevel = 1;
    applyZoom();
});

function closeModal() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');
    const modalPDF = document.getElementById('modalPDF');
    
    // Esconde o modal
    modal.classList.add('hidden');
    
    // Resetando o zoom
    zoomLevel = 1;
    modalImage.style.transform = `scale(${zoomLevel})`;
    modalPDF.style.transform = `scale(${zoomLevel})`;

    // Esconde tanto a imagem quanto o PDF
    modalImage.style.display = 'none';
    modalPDF.style.display = 'none';
}

function applyZoom() {
    const modalImage = document.getElementById('modalImage');
    const modalPDF = document.getElementById('modalPDF');

    // Aplica o zoom na imagem, se visível
    if (modalImage.style.display === 'block') {
        modalImage.style.transform = `scale(${zoomLevel})`;
    }

    // Aplica o zoom no PDF, se visível
    if (modalPDF.style.display === 'block') {
        modalPDF.style.transform = `scale(${zoomLevel})`;
    }
}

// Função para renderizar a tabela de localidades
async function tableLocality() {
    const tableLocalityBody = document.querySelector('.locality-table tbody');
    // Limpa o conteúdo atual da tabela
    tableLocalityBody.innerHTML = '';

    // Garante que os dados de localidades foram buscados
    await getdatalocality();

    // Ordena os dados pelo ID em ordem crescente
    dataLocations.sort((a, b) => a.id - b.id);

    // Itera sobre os dados e adiciona as linhas à tabela
    dataLocations.forEach(city => {
        const saldoDevedor = parseFloat(city.saldo_devedor); // Converte para número
        const statusClass = saldoDevedor <= 0 ? 'closed' : 'open'; // Define a classe com base no status

        const row = `
        <tr>
            <td class="col-number">${city.id}</td>
            <td class="col-locality">${city.nome}</td>
            <td class="col-payment">R$${saldoDevedor.toFixed(2)}</td>
            <td class="col-status ${statusClass}">${saldoDevedor > 0 ? "EM ABERTO" : "PAGO"}</td>
        </tr>
        `;
        tableLocalityBody.innerHTML += row;
    });
    
}

function initDataLocality() {
    const searchLocality = document.querySelector('.search-locality')
    const suggestions = document.getElementById('suggestions');
    searchLocality.addEventListener('click', () => {
        localityValue = document.querySelector('#input1').value
        
        dataLocality(localityValue)
        
        suggestions.style.display = 'none'
    })
}

function dataLocality(locality) {
    // Seleciona os elementos onde você vai exibir os dados
    const localityName = document.querySelector('.data-locality-name');
    const localityResponsible = document.querySelector('.data-locality-responsible');
    const localityQtd = document.querySelector('.data-locality-qtd');
    const status = document.querySelector('.status');    
    const data06Qtd = document.querySelector('.data-06-qtd');
    const data710Qtd = document.querySelector('.data-710-qtd');
    const data10MoreQtd = document.querySelector('.data-10more-qtd');
    const dataServiceQtd = document.querySelector('.data-service-qtd');
    const dataParticipationQtd = document.querySelector('.data-participation-qtd');

    // Limpa os dados antigos
    function clearFields() {
        localityName.textContent = '';
        localityResponsible.textContent = '';
        localityQtd.textContent = '';
        status.textContent = '';
        data06Qtd.textContent = '0';
        data710Qtd.textContent = '0';
        data10MoreQtd.textContent = '0';
        dataServiceQtd.textContent = '0';
        dataParticipationQtd.textContent = '0';
        status.classList.remove('closed', 'open'); // Remove as classes adicionadas anteriormente
    }
    
    // Chama a função para limpar os campos
    clearFields();

    localityName.textContent = locality;

    const localityData = dataLocations.find(item => item.nome.includes(locality));
    const qtdGeralData = groupedData.find(item => String(item.localidade_id) === String(localityData.id));
    const proofPayments = payment.filter(item => item.localidade_nome.includes(locality));



    console.log(qtdGeralData)
    console.log(proofPayments)

    // Atualize o trecho em `dataLocality` assim:
    if (qtdGeralData) {
        const nameResponsible = qtdGeralData.nome_responsavel.split(/\/|\\/)[0].trim();
        
        // Adiciona o responsável pela inscrição
        localityResponsible.textContent = nameResponsible;

        // Calcula o total de qtd_geral de todos os itens de qtdGeralData com parseFloat
        const totalQtdGeral = qtdGeralData.qtd_geral;

        // Adiciona a quantidade total de inscritos da localidade
        localityQtd.textContent = totalQtdGeral;

        // Verifica o status, se essa localidade tem saldo devedor ou foi tudo pago
        const statusClass = parseFloat(localityData.saldo_devedor) <= 0 ? "closed" : "open";
        const statusLocality = parseFloat(localityData.saldo_devedor) <= 0 ? "PAGO" : "EM ABERTO";
        status.textContent = statusLocality;
        status.classList.add(`${statusClass}`);

        data06Qtd.textContent = qtdGeralData.qtd_0_6;
        data710Qtd.textContent = qtdGeralData.qtd_7_10;
        data10MoreQtd.textContent = qtdGeralData.qtd_10_acima;
        dataParticipationQtd.textContent = qtdGeralData.qtd_tx_participacao;
        dataServiceQtd.textContent = qtdGeralData.qtd_servico;

        tableReceipts(proofPayments);
        displayHidden(true, paymentTable, titleHistoryPayment); // Garante que os elementos serão exibidos
        displayHidden(false, noDataMessage); // Garante que a mensagem de "sem dados" será ocultada
        showProofPayment(qtdGeralData.localidade_id);
    } else {
        // Caso não haja dados para a localidade, oculta a tabela e exibe a mensagem "sem dados"
        displayHidden(false, paymentTable, titleHistoryPayment);
        displayHidden(true, noDataMessage);
    }
}

async function tableReceipts(proofPayment) {
    const paymentHistory = document.querySelector('.table-payments tbody'); // Seleciona o corpo da tabela

    let n = 1; // Inicializa o contador para numeração das linhas
    let bodyTable = ''; // Inicializa o HTML para as linhas da tabela

    // Itera sobre o array `values` (no caso, `proofPayments`)
    proofPayment.forEach(proofPayment => {
        bodyTable += `
            <tr>
                <td class="payment-number">${n}</td> <!-- Coluna de numeração -->
                <td class="payment-value">${proofPayment.valor_pago}</td> <!-- Valor pago -->
            </tr>
        `;
        n++; // Incrementa o contador
    });

    // Insere as linhas da tabela no DOM
    paymentHistory.innerHTML = bodyTable;
}

function displayHidden(show, ...elements) {
    elements.forEach(element => {
        if (show) {
            element.classList.remove('hidden'); // Garante que os elementos serão exibidos
        } else {
            element.classList.add('hidden'); // Garante que os elementos serão ocultados
        }
    });
}


//Controla o modo dark mode
function darkmode() {
    const checkbox = document.querySelector('#chk');
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

// Mostra ou oculta o indicador de carregamento
function toggleLoader(show) {
    const loaderBackground = document.querySelector(".loader-background");
    loaderBackground.style.display = show ? "flex" : "none";
}

// Função para atualizar o status de conexão
function updateConnectionStatus() {
    const statusElement = document.getElementById('connection-status');

    if (navigator.onLine) {
        statusElement.textContent = 'Online';
        statusElement.classList.remove('offline');
        statusElement.classList.add('online');
    } else {
        statusElement.textContent = 'Offline';
        statusElement.classList.remove('online');
        statusElement.classList.add('offline');
    }
}

async function init() {
    toggleLoader(true); // Mostra o loader no início
    try {
        darkmode();
        await initCitySuggestions();
        await getProofPayment();
        await tableLocality();
        initDataLocality();
        await requestPaymentReceipts();
    } catch (error) {
        console.error('Erro ao inicializar:', error.message);
    } finally {
        toggleLoader(false); // Oculta o loader após concluir
    }
}

// Verifica o status de conexão quando a página for carregada
window.addEventListener('load', updateConnectionStatus);

// Escuta mudanças no status de conexão (online/offline)
window.addEventListener('online', updateConnectionStatus);
window.addEventListener('offline', updateConnectionStatus);

init();