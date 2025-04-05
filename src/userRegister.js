import { getLocations } from "../router/dataRoutes.js";
import { postRegister } from "../router/authRoutes.js";

const checkbox = document.querySelector('#chk');
const localidadeInput = document.querySelector('#localidade');
const suggestionsContainer = document.getElementById('suggestions');
const iconPassword = document.querySelector('#icon-password');
const passwordField = document.querySelector('#password');
const iconConfirmPassword = document.querySelector('#icon-confirm-password');
const confirmPasswordField = document.querySelector('#confirm-password');

let isCitySelected = false;
let cityNames = [];

document.querySelector('.close').addEventListener('click', ()=>{
    const popUp = document.querySelector('.pop-up');

    popUp.style.display = 'none'
});

document.querySelector('.register-btn').addEventListener('click', (event) =>{
    event.preventDefault();
    createAccount();
});

document.querySelectorAll('.input-group input').forEach(input => {
    input.addEventListener('input', () => {
        input.style.border = ''; // Remove a borda vermelha quando começa a digitar
    });
});

document.querySelector('#localidade').addEventListener('input', function() {
    this.value = this.value.toUpperCase();
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
 * Alterna a visualização da senha enquanto o usuário segura o ícone.
 */
function showPasswordToggle(icon, passwordField) {
    icon.addEventListener('mousedown', event => {
        event.preventDefault();
        passwordField.type = 'text';
        icon.classList.remove('bi-eye-fill');
        icon.classList.add('bi-eye-slash-fill');
    });

    icon.addEventListener('mouseup', () => {
        passwordField.type = 'password';
        icon.classList.remove('bi-eye-slash-fill');
        icon.classList.add('bi-eye-fill');
    });

    icon.addEventListener('mouseleave', () => {
        passwordField.type = 'password';
        icon.classList.remove('bi-eye-slash-fill');
        icon.classList.add('bi-eye-fill');
    });
}

/**
 * 
 */
function toggleLoader(show) {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.toggle('hidden', !show);
}

/**
 * Exibe um pop-up com título e descrição informados.
 */
function popUp(title, description) {
    const popUpContainer = document.querySelector('.pop-up');
    const titlePopUp = document.querySelector('.title-alert');
    const descriptionAlert = document.querySelector('.description-alert');

    titlePopUp.textContent = title;
    descriptionAlert.innerHTML = description.replace(/\n/g, '<br>'); // Substitui "\n" por "<br>"

    popUpContainer.style.display = 'flex';
    popUpContainer.classList.add("shake-popUp");

    setTimeout(() =>{
        popUpContainer.classList.remove("shake-popUp");
    }, 600);
}

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
 * Busca as localidades e retorna um array com os nomes das cidades.
 */
async function fetchCityNames() {
    try {
    toggleLoader(true);
    const fetchedCities = await getLocations();
    
    if(fetchedCities.length === 0) {
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

function populateLocalidadeFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    const locality = urlParams.get('locality');

    if(locality) {
        const inputlocality = document.querySelector('#localidade');
        inputlocality.value = decodeURIComponent(locality.toUpperCase());
    }
}

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
}

async function createAccount() {
    const fields = {
        locality: document.querySelector('#localidade'),
        email: document.querySelector('#email'),
        password: document.querySelector('#password'),
        confirmPassword: document.querySelector('#confirm-password')
    };

    let errors = [];

    function setError(field, message) {
        field.style.border = '2px solid red';
        errors.push(message);
    }

    function resetFieldStyles() {
        Object.values(fields).forEach(field => {
            field.style.border = '';
            field.onfocus = () => field.style.border = ''; // Reseta ao focar
        });
    }

    resetFieldStyles();

    // Valida campos vazios
    Object.entries(fields).forEach(([key, field]) => {
        if (!field.value.trim()) {
            setError(field, `O campo ${field.placeholder || key} é obrigatório.`);
        }
    });

    if(!cityNames.includes(fields.locality.value.toUpperCase())) {
        setError(fields.locality, 'Localidade invalida.');
    }

    // Validação do email
    let emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (fields.email.value && !emailPattern.test(fields.email.value)) {
        setError(fields.email, 'O email inserido não é válido.');
    }

    // Validação da senha
    if (fields.password.value.length < 10) {
        setError(fields.password, 'A senha deve ter no mínimo 10 caracteres.');
    }

    if (fields.password.value !== fields.confirmPassword.value) {
        setError(fields.password, 'As senhas não coincidem.');
        setError(fields.confirmPassword, 'As senhas não coincidem.');
    }

    if (errors.length > 0) {
        popUp('Erro no preenchimento!', errors.join('\n'));
        return;
    }

    //Cria um objeto com os dados do usuario
    const data = {
        locality: fields.locality.value.toUpperCase(),
        email: fields.email.value,
        password: fields.password.value
    };

    toggleLoader(true)
    try {
        const response = await postRegister(data);
    
        if (response.status === 400) {
            let errorMessages = [];
        
            if (response.message.includes("Localidade")) {
                setError(fields.locality, response.message);
                errorMessages.push(response.message);
            } else if (response.message.includes(`${data.email}`)) {
                setError(fields.email, response.message);
                errorMessages.push(response.message);
            }
        
            if (errorMessages.length > 0) {
                popUp('Erro no cadastro!', errorMessages.join('\n'));
            }
        
            return;
        }

        popUp('✅ Cadastro Concluído', 
            'Seu cadastro foi realizado com sucesso! Verifique seu e-mail e siga as instruções para ativar sua conta. Caso não encontre o email, verifique a caixa de spam'
        );
    
    } catch (error) {
        popUp(
            '⚠️ Erro interno ⚠️', 
            'Erro interno do servidor, mas não se preocupe. A página será atualizada automaticamente, mas caso essa mensagem continue aparecendo, entre em contato com o suporte'
        );
        setTimeout(() => {
            location.reload();
        }, 7000);
    } finally {
        toggleLoader(false);
    }
}

async function init() {
    darkModeToggle();
    await initCitySuggestions();
    populateLocalidadeFromURL();

    showPasswordToggle(iconPassword, passwordField);
    showPasswordToggle(iconConfirmPassword, confirmPasswordField);
};

document.addEventListener('DOMContentLoaded', init);