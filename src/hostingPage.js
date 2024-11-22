import { getlistHosting, generatePdf } from "./router.js";

let currentLocationIndex = 0; // Índice da localidade atual
let locationsData = []; // Cache das localidades e pessoas
let cachedPeople = []; // Variável global para armazenar os dados de pessoas

// Função para buscar e organizar os dados de localidades e pessoas
async function fetchLocationsData() {
    // Verifica se os dados já foram carregados
    if (cachedPeople.length > 0) {
        console.log("Usando dados em cache");
        return groupByLocation(cachedPeople); // Se já houver dados em cache, usa-os
    }

    try {
        toggleLoader(true); // Exibe o loader enquanto os dados estão sendo carregados
        const pessoas = await getlistHosting(); // Obtém a lista de pessoas
        console.log(pessoas)
        // Armazena os dados na variável global
        cachedPeople = pessoas;

        // Organiza as pessoas por localidade
        const groupedByLocation = groupByLocation(pessoas); // Agrupa por localidade

        console.log(groupedByLocation); // Exibe as localidades organizadas
        return groupedByLocation; // Retorna as localidades organizadas
    } catch (error) {
        console.error("Erro ao buscar dados de localidades:", error);
        return []; // Retorna um array vazio em caso de erro
    } finally {
        toggleLoader(false); // Esconde o loader após o carregamento
    }
}

// Função para organizar as pessoas por localidade
function groupByLocation(pessoas) {
    const groupedByLocation = pessoas.reduce((acc, pessoa) => {
        if (!acc[pessoa.localidade]) acc[pessoa.localidade] = [];
        acc[pessoa.localidade].push(pessoa);
        return acc;
    }, {});

    // Retorna um array de objetos com localidade e pessoas associadas
    return Object.entries(groupedByLocation).map(([localidade, pessoas]) => ({
        localidade,
        pessoas,
    }));
}

// Função para carregar as pessoas de uma localidade
function carregarPessoasNaPagina(localidadeIndex) {
    const { localidade, pessoas } = locationsData[localidadeIndex];
    carregarPessoas(pessoas);
    updateLocalidadeDisplay(localidade);
    updateNavigation(localidadeIndex);
}

// Função para atualizar o nome da localidade exibida
function updateLocalidadeDisplay(localidade) {
    const localidadeDisplay = document.getElementById("current-location");
    if (localidadeDisplay) {
        localidadeDisplay.textContent = `Localidade: ${localidade.toUpperCase()}`;
    }
}

// Função para atualizar as setas de navegação, o número de páginas e a cor dos ícones
function updateNavigation(currentIndex) {
    const leftArrow = document.querySelector('.bi-caret-left');
    const rightArrow = document.querySelector('.bi-caret-right');
    const pageInfo = document.querySelector('.title-list p'); // Seleciona o elemento do número de páginas

    const totalPages = locationsData.length; // Total de localidades

    // Habilita ou desabilita as setas e altera a cor
    if (currentIndex === 0) {
        leftArrow.style.pointerEvents = 'none';
        leftArrow.style.color = '#d5d5d5'; // Cor para estado desabilitado
    } else {
        leftArrow.style.pointerEvents = 'auto';
        leftArrow.style.color = ''; // Remove a cor desabilitada
    }

    if (currentIndex === totalPages - 1) {
        rightArrow.style.pointerEvents = 'none';
        rightArrow.style.color = '#d5d5d5'; // Cor para estado desabilitado
    } else {
        rightArrow.style.pointerEvents = 'auto';
        rightArrow.style.color = ''; // Remove a cor desabilitada
    }

    // Atualiza o texto do número de páginas
    if (pageInfo) {
        pageInfo.textContent = `Página ${currentIndex + 1} de ${totalPages}`;
    }
}

// Função para configurar a navegação entre as localidades
function setupPagination() {
    const leftArrow = document.querySelector('.bi-caret-left');
    const rightArrow = document.querySelector('.bi-caret-right');

    // Evento para a seta para a esquerda
    leftArrow.addEventListener('click', () => {
        if (currentLocationIndex > 0) {
            currentLocationIndex--; // Decrementa o índice da localidade
            carregarPessoasNaPagina(currentLocationIndex);
        }
    });

    // Evento para a seta para a direita
    rightArrow.addEventListener('click', () => {
        if (currentLocationIndex < locationsData.length - 1) {
            currentLocationIndex++; // Incrementa o índice da localidade
            carregarPessoasNaPagina(currentLocationIndex);
        }
    });
}

// Função para inicializar sugestões de cidades
async function initCitySuggestions() {
    const cities = await fetchLocationsData(); // Obtém as localidades e pessoas
    const cityNames = cities.map(location => location.localidade); // Extrai os nomes das localidades
    const input = document.getElementById("input1");
    const suggestions = document.getElementById("suggestions");

    input.addEventListener("input", () => filterCities(cityNames, input, suggestions));
}

// Função para filtrar as cidades na lista de sugestões
function filterCities(cityNames, input, suggestions) {
    const inputValue = input.value.toLowerCase();
    suggestions.innerHTML = "";

    const filteredCities = cityNames.filter(city =>
        city.toLowerCase().includes(inputValue)
    );

    if (filteredCities.length > 0 && inputValue) {
        suggestions.style.display = "block";
        filteredCities.forEach(city => {
            const item = document.createElement("div");
            item.classList.add("suggestion-item");
            item.textContent = city;

            item.addEventListener("click", () => {
                input.value = city;
                suggestions.innerHTML = "";
                suggestions.style.display = "none";
                filterByLocation(city);
            });

            suggestions.appendChild(item);
        });
    } else {
        suggestions.style.display = "none";
    }
}

// Função para carregar as pessoas na tabela
function carregarPessoas(pessoas) {
    const tbody = document.getElementById("name-table-body");
    tbody.innerHTML = ""; // Limpa a tabela antes de adicionar os dados

    if (pessoas.length === 0) {
        const tr = document.createElement("tr");
        const td = document.createElement("td");
        td.colSpan = 2; // Expande a célula para a largura total
        td.textContent = "Nenhuma pessoa encontrada";
        tr.appendChild(td);
        tbody.appendChild(tr);
    } else {
        pessoas.forEach((pessoa, index) => {
            const tr = document.createElement("tr");

            const tdNumero = document.createElement("td");
            tdNumero.innerHTML = `<label>${index + 1}</label>`;

            const tdNome = document.createElement("td");
            tdNome.innerHTML = `<label>${pessoa.nome}</label>`;

            tr.appendChild(tdNumero);
            tr.appendChild(tdNome);
            tbody.appendChild(tr);
        });
    }
}


// Função para filtrar as pessoas pela localidade selecionada no input
function filterByLocation(inputValue) {
    try {
        if (inputValue === "") {
            carregarPessoas([]); // Caso o input esteja vazio, não exibe ninguém
            updateLocalidadeDisplay("Nenhuma localidade selecionada");
            limparTabela(); // Limpa a tabela
        } else {
            // Usando o groupByLocation para agrupar as pessoas
            const groupedData = groupByLocation(cachedPeople);

            // Filtra o grupo que corresponde à localidade informada no inputValue
            const locationGroup = groupedData.find(group => group.localidade.toLowerCase() === inputValue.toLowerCase());

            if (locationGroup) {
                // Limpa a tabela existente antes de adicionar as novas pessoas
                limparTabela();

                // Carrega as pessoas da localidade filtrada
                carregarPessoas(locationGroup.pessoas);
                updateLocalidadeDisplay(inputValue); // Atualiza o nome da localidade exibida

                // Atualiza as páginas para a localidade filtrada
                locationsData = [locationGroup]; // Atualiza com apenas uma localidade filtrada
                currentLocationIndex = 0; // Reseta o índice para a primeira página da localidade filtrada
                updateNavigation(currentLocationIndex); // Atualiza a navegação
            } else {
                // Se não encontrar nenhuma pessoa com a localidade, mostra uma mensagem de "nenhum resultado"
                limparTabela(); // Limpa a tabela
                updateLocalidadeDisplay("Nenhuma pessoa encontrada para esta localidade");
            }
        }

        // Reseta o índice da página para a primeira
        currentLocationIndex = 0;
        updateNavigation(currentLocationIndex); // Atualiza a navegação

    } catch (error) {
        console.error('Erro ao filtrar por localidade:', error);
    }
}

// Função para limpar a tabela de pessoas
function limparTabela() {
    const tbody = document.getElementById("name-table-body");
    if (tbody) {
        tbody.innerHTML = ""; // Limpa o conteúdo da tabela
    }
}

// Função para mostrar/ocultar o carregamento
function toggleLoader(show) {
    const loaderBackground = document.querySelector(".loader-background");
    loaderBackground.style.display = show ? "flex" : "none";
}

// Função principal para inicializar o comportamento
async function init() {
    await initCitySuggestions(); // Inicializa sugestões de cidades

    const searchButton = document.querySelector('.search');
    searchButton.addEventListener('click', () => {
        const inputValue = document.getElementById('input1').value.trim(); // Pega o valor do input de cidade
        console.log(inputValue)
        if (inputValue) {
            filterByLocation(inputValue); // Filtra a tabela pela localidade
        } else {
            carregarPessoas(cachedPeople); // Exibe todas as pessoas usando o cache
            updateLocalidadeDisplay("Todas"); // Reseta o nome da localidade exibida
        }
    });

    const filterButton = document.querySelector(".filter");
    filterButton.addEventListener("click", () => {
        // Limpa o valor do input de filtro de cidade
        document.getElementById("input1").value = "";
    
        // Reseta a exibição para todas as localidades
        carregarPessoas(cachedPeople);
    
        // Atualiza a exibição para "Todas as localidades"
        updateLocalidadeDisplay("Todas as localidades");
    
        // Reseta a navegação para a primeira página
        locationsData = groupByLocation(cachedPeople); // Recarrega todas as localidades agrupadas
        currentLocationIndex = 0; // Reseta o índice para a primeira localidade
        updateNavigation(currentLocationIndex); // Atualiza a navegação
    
        // Carrega as pessoas da primeira localidade
        carregarPessoasNaPagina(currentLocationIndex); 
    
        // Reconfigura a navegação para todas as localidades
        setupPagination(); // Reaplica a lógica de navegação
    });
    
    const iconDownload = document.querySelector('.bi-download');
    iconDownload.addEventListener('click', () => {
        const localityInput = document.querySelector('#input1').value.trim(); // Obtém e remove espaços
        const locality = localityInput !== '' ? localityInput : null; // Verifica se é vazio e ajusta para null
        generatePdf(locality); // Chama a função passando o valor correto
    });
    
    locationsData = await fetchLocationsData(); // Carrega os dados das localidades e pessoas
    carregarPessoasNaPagina(0); // Carrega a primeira localidade
    setupPagination(); // Configura os eventos de navegação
}

init();
