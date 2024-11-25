import { getlistHosting, generatePdf } from "./router.js";

let currentLocationIndex = 0; // Índice da localidade atualmente exibida
let locationsData = []; // Armazena as localidades e suas pessoas
let cachedPeople = []; // Cache global para evitar buscas repetitivas

// Função para buscar e organizar os dados de localidades e pessoas
async function fetchLocationsData() {
    if (cachedPeople.length > 0) {
        // Usa os dados em cache, se já disponíveis
        console.log("Usando dados em cache");
        return groupByLocation(cachedPeople);
    }

    try {
        toggleLoader(true); // Mostra o indicador de carregamento
        const pessoas = await getlistHosting(); // Obtém os dados do servidor
        cachedPeople = pessoas; // Armazena em cache os dados obtidos

        return groupByLocation(pessoas); // Organiza os dados por localidade
    } catch (error) {
        console.error("Erro ao buscar dados de localidades:", error);
        return []; // Retorna vazio caso ocorra um erro
    } finally {
        toggleLoader(false); // Esconde o indicador de carregamento
    }
}

function darkmode() {
    const checkbox = document.querySelector('#chk');
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

// Agrupa as pessoas por localidade
function groupByLocation(pessoas) {
    const grouped = pessoas.reduce((acc, pessoa) => {
        if (!acc[pessoa.localidade]) acc[pessoa.localidade] = [];
        acc[pessoa.localidade].push(pessoa);
        return acc;
    }, {});

    // Retorna as localidades em formato de array de objetos
    return Object.entries(grouped).map(([localidade, pessoas]) => ({
        localidade,
        pessoas,
    }));
}

// Exibe as pessoas de uma localidade específica na página
function carregarPessoasNaPagina(localidadeIndex) {
    const { localidade, pessoas } = locationsData[localidadeIndex];
    carregarPessoas(pessoas); // Preenche a tabela de pessoas
    updateLocalidadeDisplay(localidade); // Atualiza o nome da localidade exibida
    updateNavigation(localidadeIndex); // Configura a navegação com base na localidade
}

// Atualiza o título exibido com o nome da localidade
function updateLocalidadeDisplay(localidade) {
    const display = document.getElementById("current-location");
    if (display) {
        display.textContent = `Localidade: ${localidade.toUpperCase()}`;
    }
}

// Atualiza o estado das setas de navegação e a numeração da página
function updateNavigation(currentIndex) {
    const leftArrow = document.querySelector('.bi-caret-left');
    const rightArrow = document.querySelector('.bi-caret-right');
    const pageInfo = document.querySelector('.title-list p');
    const totalPages = locationsData.length;

    // Habilita/desabilita a seta esquerda
    leftArrow.style.pointerEvents = currentIndex === 0 ? 'none' : 'auto';
    leftArrow.style.color = currentIndex === 0 ? '#d5d5d5' : '';

    // Habilita/desabilita a seta direita
    rightArrow.style.pointerEvents = currentIndex === totalPages - 1 ? 'none' : 'auto';
    rightArrow.style.color = currentIndex === totalPages - 1 ? '#d5d5d5' : '';

    // Atualiza o número da página exibida
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentIndex + 1} de ${totalPages}`;
    }
}

// Configura eventos de clique nas setas de navegação
function setupPagination() {
    const leftArrow = document.querySelector('.bi-caret-left');
    const rightArrow = document.querySelector('.bi-caret-right');

    leftArrow.addEventListener('click', () => {
        if (currentLocationIndex > 0) {
            currentLocationIndex--;
            carregarPessoasNaPagina(currentLocationIndex);
        }
    });

    rightArrow.addEventListener('click', () => {
        if (currentLocationIndex < locationsData.length - 1) {
            currentLocationIndex++;
            carregarPessoasNaPagina(currentLocationIndex);
        }
    });
}

// Inicializa o sistema de sugestões de localidades
async function initCitySuggestions() {
    const cities = await fetchLocationsData(); // Obtém os dados de localidades
    const cityNames = cities.map(location => location.localidade); // Extrai os nomes das localidades
    const input = document.getElementById("input1");
    const suggestions = document.getElementById("suggestions");

    // Adiciona evento para filtrar localidades enquanto o usuário digita
    input.addEventListener("input", () => filterCities(cityNames, input, suggestions));
}

// Filtra localidades e atualiza a lista de sugestões
function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase();
    suggestions.innerHTML = ""; // Limpa a lista de sugestões

    const filteredCities = cityNames.filter(city =>
        city.toLowerCase().includes(inputValue)
    );

    if (filteredCities.length > 0 && inputValue) {
        suggestions.style.display = "block";
        filteredCities.forEach(city => {
            const item = document.createElement("div");
            item.classList.add("suggestion-item");
            item.textContent = city;

            // Define o comportamento ao selecionar uma sugestão
            item.addEventListener("click", () => {
                input.value = city;
                suggestions.innerHTML = "";
                suggestions.style.display = "none";
                filterByLocation(city); // Filtra com base na cidade selecionada
            });

            suggestions.appendChild(item);
        });
    } else {
        suggestions.style.display = "none";
    }
}

// Exibe as pessoas na tabela
function carregarPessoas(pessoas) {
    const tbody = document.getElementById("name-table-body");
    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar novos dados

    if (pessoas.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 2;
        td.textContent = "Nenhuma pessoa encontrada";
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        pessoas.forEach((pessoa, index) => {
            const tr = document.createElement("tr");
            tr.innerHTML = `
                <td><label>${index + 1}</label></td>
                <td><label>${pessoa.nome}</label></td>
            `;
            tbody.appendChild(tr);
        });
    }
}

// Filtra pessoas com base em uma localidade informada
function filterByLocation(inputValue) {
    try {
        if (!inputValue) {
            carregarPessoas([]); // Limpa a tabela se nenhum valor for informado
            updateLocalidadeDisplay("Nenhuma localidade selecionada");
            limparTabela();
        } else {
            const groupedData = groupByLocation(cachedPeople);
            const locationGroup = groupedData.find(group =>
                group.localidade.toLowerCase() === inputValue.toLowerCase()
            );

            if (locationGroup) {
                limparTabela();
                carregarPessoas(locationGroup.pessoas);
                updateLocalidadeDisplay(inputValue);

                locationsData = [locationGroup]; // Atualiza os dados para a localidade selecionada
                currentLocationIndex = 0;
                updateNavigation(currentLocationIndex);
            } else {
                limparTabela();
                updateLocalidadeDisplay("Nenhuma pessoa encontrada para esta localidade");
            }
        }
    } catch (error) {
        console.error('Erro ao filtrar por localidade:', error);
    }
}

// Remove todos os dados da tabela
function limparTabela() {
    const tbody = document.getElementById("name-table-body");
    if (tbody) tbody.innerHTML = "";
}

// Mostra ou oculta o indicador de carregamento
function toggleLoader(show) {
    const loaderBackground = document.querySelector(".loader-background");
    loaderBackground.style.display = show ? "flex" : "none";
}

// Inicializa o comportamento principal da aplicação
async function init() {
    await initCitySuggestions(); // Configura as sugestões de localidades
    

    // Configura o botão de busca
    const searchButton = document.querySelector('.search');
    searchButton.addEventListener('click', () => {
        const inputValue = document.getElementById('input1').value.trim();
        if (inputValue) {
            filterByLocation(inputValue);
        } else {
            carregarPessoas(cachedPeople);
            updateLocalidadeDisplay("Todas");
        }
    });

    // Configura o botão de resetar filtros
    const filterButton = document.querySelector(".filter");
    filterButton.addEventListener("click", () => {
        document.getElementById("input1").value = "";
        carregarPessoas(cachedPeople);
        updateLocalidadeDisplay("Todas as localidades");
        locationsData = groupByLocation(cachedPeople);
        currentLocationIndex = 0;
        updateNavigation(currentLocationIndex);
        carregarPessoasNaPagina(currentLocationIndex);
        setupPagination();
    });

    // Configura o botão de download do PDF
    const iconDownload = document.querySelector('.bi-download');
    iconDownload.addEventListener('click', () => {
        const localityInput = document.querySelector('#input1').value.trim();
        const locality = localityInput || null;
        generatePdf(locality);
    });

    // Carrega os dados iniciais
    locationsData = await fetchLocationsData();
    carregarPessoasNaPagina(0); // Exibe a primeira localidade
    setupPagination(); // Configura a navegação
    darkmode(); //Modo dark-mode
}

init(); // Executa a inicialização
