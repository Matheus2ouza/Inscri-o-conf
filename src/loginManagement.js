import { loginAdmin } from "./router.js";

const iconPassword = document.querySelector('#icon-password');
const checkbox = document.querySelector('#chk');
const username = document.querySelector('.username');
const password = document.querySelector('.password');

function showpassword() {
    iconPassword.addEventListener('click', (event) => {
        event.preventDefault();
        const isPasswordType = password.type === 'password';

        password.type = isPasswordType ? 'text' : 'password';
        iconPassword.classList.toggle('bi-eye-fill', !isPasswordType);
        iconPassword.classList.toggle('bi-eye-slash-fill', isPasswordType);
    });
}

function darkmode() {
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

function showError(inputError){
    inputError.classList.add('error');
}
function resetField(input){
    input.addEventListener('focus', () => {
        input.classList.remove('error');
    });
}

function showLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.remove('hidden');
}

function hideLoader() {
    const loaderBackground = document.querySelector('.loader-background');
    loaderBackground.classList.add('hidden');
}

async function login() {
    const loginData = {
        username: username.value,
        password: password.value
    };

    showLoader(); // Exibe o loader antes de iniciar a solicitação

    try {
        // Chamando a função de login e aguardando o resultado
        const resultLogin = await loginAdmin(loginData);

        // Verificando o resultado e aplicando tratamentos de erro
        if (resultLogin.success) {
            console.log("Login bem-sucedido:", resultLogin.data);
            // Redirecionar ou realizar alguma ação no caso de sucesso
        } else {
            console.warn("Erro no login:", resultLogin.message);

            // Tratamento específico para erros de username e password
            if (resultLogin.message.includes("Nome de usuário")) {
                showError(username); // Exibe o erro no campo username
                resetField(username); // Remove o erro ao focar no campo
            } else if (resultLogin.message.includes("Senha")) {
                showError(password); // Exibe o erro no campo password
                resetField(password); // Remove o erro ao focar no campo
            } else {
                alert(resultLogin.message); // Exibe mensagem geral para erros desconhecidos
            }
        }
    } catch (error) {
        console.error("Erro durante o login:", error);
        alert("Erro ao tentar fazer login. Tente novamente mais tarde.");
    } finally {
        hideLoader(); // Oculta o loader após a resposta da solicitação
    }
}

function init() {
    showpassword();
    darkmode();
    hideLoader();

    const btnLogin = document.querySelector('.submit');

    btnLogin.addEventListener('click', (event) => {
        event.preventDefault();
        login();
    });
}

init();
