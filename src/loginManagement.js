import { getLocations, postLogin } from "./router.js";

const checkbox = document.querySelector('#chk');
const iconPassword = document.querySelector('#icon-password');
const passwordField = document.querySelector('.password');
const localidadeInput = document.querySelector('.localidade');
const suggestionsContainer = document.getElementById('suggestions');

let isCitySelected = false;
let cityNames = [];
let redirectionTimeout;

/**
 * Função debounce para limitar a frequência de execução de outra função.
 */
function debounce(func, delay) {
    let timeoutId;
    return (...args) => {
        if (timeoutId) clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func(...args), delay);
    };
}

/**
 * Alterna a visualização da senha enquanto o usuário segura o ícone.
 */
function showPasswordToggle() {
    iconPassword.addEventListener('mousedown', event => {
        event.preventDefault();
        passwordField.type = 'text';
        iconPassword.classList.remove('bi-eye-fill');
        iconPassword.classList.add('bi-eye-slash-fill');
    });

    iconPassword.addEventListener('mouseup', () => {
        passwordField.type = 'password';
        iconPassword.classList.remove('bi-eye-slash-fill');
        iconPassword.classList.add('bi-eye-fill');
    });

    iconPassword.addEventListener('mouseleave', () => {
        passwordField.type = 'password';
        iconPassword.classList.remove('bi-eye-slash-fill');
        iconPassword.classList.add('bi-eye-fill');
    });
}

/**
 * Exibe um pop-up com título e descrição informados.
 */
function popUp(title, description) {
    const popUpContainer = document.querySelector('.pop-up');
    const titlePopUp = document.querySelector('.title-alert');
    const descriptionAlert = document.querySelector('.description-alert');

    titlePopUp.textContent = title;
    descriptionAlert.innerHTML = description;
    popUpContainer.style.display = 'flex';
    popUpContainer.classList.add("shake-popUp");

    setTimeout(() =>{
        popUpContainer.classList.remove("shake-popUp");
    }, 600);
};

function popRedirection(locality) {
    const fieldLocality = document.querySelector('#localidade-nome');
    const popUpRedirection = document.querySelector('.pop-up-redirection');
    const redirectLink = document.querySelector('.redirect-link');

    fieldLocality.innerHTML = locality
    redirectLink.href = `https://inscri-o-conf.vercel.app/register?locality=${encodeURIComponent(locality)}`
    popUpRedirection.style.display = 'flex';
};

/**
 * Evento para procurar o button e fechar.
 */
document.querySelectorAll('.close').forEach(closeButton => {
    closeButton.addEventListener('click', ()=>{
        closeButton.parentElement.style.display = 'none';

        clearTimeout(redirectionTimeout);
    });
});

/**
 * Ativa ou desativa o modo escuro.
 */
function darkModeToggle() {
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

/**
 * Mostra ou esconde o loader.
 */
function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.toggle('hidden', !show);
}

/**
 * Busca as localidades e retorna um array com os nomes das cidades.
 */
async function fetchCityNames() {
    try {
    toggleLoader(true);
    const fetchedCities = await getLocations();
    
    if(Object.keys(fetchedCities).length === 0) {
        setTimeout(() =>{
            popUp('⚠️Erro interno⚠️', `Erro interno do servidor, mas não se preocupe a pagina será atualizada automaticamente mas caso
                essa mensagem continue aparecendo entre em contato com o suporte`);
        }, 5000)
    }

    const cities = Object.values(fetchedCities);
    return cities.map(city => city.nome);
    } catch (error) {
    console.error("Erro ao buscar localidades:", error);
    return [];
    } finally {
    toggleLoader(false);
    }
};

/**
 * Filtra as cidades com base no valor digitado e exibe as sugestões.
 */
function filterCities(inputValue) {
    const filtered = cityNames.filter(city => city.toLowerCase().includes(inputValue));

    // Limpa as sugestões anteriores
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = (filtered.length > 0 && inputValue) ? 'block' : 'none';

    filtered.forEach(city => {
    const item = document.createElement('div');
    item.classList.add('suggestion-item');
    item.textContent = city;

    item.addEventListener('click', async () => {
        localidadeInput.value = city;
        suggestionsContainer.innerHTML = '';
        suggestionsContainer.style.display = 'none';
        isCitySelected = true; // Marca que a cidade foi selecionada

        // Se as funções checkLocation e toggleRegisterButton estiverem definidas, chame-as:
        if (typeof checkLocation === "function" && typeof toggleRegisterButton === "function") {
        const isValid = await checkLocation();
        toggleRegisterButton(isValid);
        }

        // Reseta a variável após um pequeno atraso para permitir futuras interações
        setTimeout(() => {
        isCitySelected = false;
        }, 500);
    });

    suggestionsContainer.appendChild(item);
    });
}

// Cria uma versão debounced da função de filtro para melhorar a performance
const debouncedFilter = debounce(() => {
    const inputValue = localidadeInput.value.toLowerCase();
    filterCities(inputValue);
}, 300);


//Inicializa as sugestões de cidades.
async function initCitySuggestions() {
    cityNames = await fetchCityNames();

    localidadeInput.addEventListener('input', () => {
    if (!isCitySelected) {
        debouncedFilter();
    }
    });

    localidadeInput.addEventListener('blur', () => {
    // Esconde as sugestões com um pequeno delay para permitir seleção
    setTimeout(() => {
        suggestionsContainer.style.display = 'none';
    }, 200);
    });

    suggestionsContainer.addEventListener('mousedown', (event) => {
    // Impede que o blur dispare ao clicar nas sugestões
    event.preventDefault();
    });
};

//Realiza o login verificando se os campos foram preenchidos.
async function login() {
    const locality = localidadeInput.value;
    const password = passwordField.value;

    let message = '';

    if (!locality || !password) {
    message = !locality && !password 
        ? 'Você esqueceu de preencher o usuário e a senha. Verifique os dados.'
        : !locality 
        ? 'Você esqueceu de preencher o usuário. Verifique os dados.'
        : 'Você esqueceu de preencher a senha. Verifique os dados.';

    popUp('Falta de dados', message);
    return;
    }

    const data = {
    locality: locality.toUpperCase(),
    password: password
    }
    
    toggleLoader(true);
    try {
        const response = await postLogin(data);
    
        if (response.status != 200) {
            if(response.status === 400) {
                popUp('Dados invalidos', response.message);
            } else if (response.status === 401) {
                popRedirection(locality);
            } else if (response.status === 402) {
                popUp('Dados invalidos', response.message);
            } else if (response.status === 403) {
                popUp('Dados invalidos', response.message);
            }
            return
        }

        localStorage.setItem("accessToken", response.accessToken);
        location.href = "http://127.0.0.1:5500/page/home.html"

    } catch (error) {
        console.error('Erro ao tentar fazer login:', error);
        popUp('Erro', 'Ocorreu um erro ao tentar fazer login. Tente novamente. Se o erro persistir entre em contato com o suporte');
    } finally {
        toggleLoader(false);
    }
};

//Função de inicialização do script.
async function init() {
  await initCitySuggestions();
  showPasswordToggle();
  darkModeToggle();

  const btnLogin = document.querySelector('.submit');
  btnLogin.addEventListener('click', event => {
    event.preventDefault();
    login();
  });
};

document.addEventListener('DOMContentLoaded', init);
