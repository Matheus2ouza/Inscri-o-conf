import { postEmailToken } from "../router/authRoutes.js";

/**
 * Ajusta a pagina para de acordo com o retorno da verificação do token
*/
function updateVerificationStatus(isSuccess, message = "Ocorreu um erro na verificação.") {
    const fieldMessage = document.querySelector('.message');
    const icon = document.querySelector('.icon');
    const loading = document.querySelector('.loading');
    const verifyBox = document.querySelector('.verify-box');

    // Ícones
    const iconSuccess = '<i class="bi bi-check-circle-fill"></i>';
    const iconError = '<i class="bi bi-x-octagon-fill"></i>';

    // Oculta o loader antes de atualizar o status
    loading.style.display = 'none';

    // Remove classes anteriores para evitar acúmulo
    fieldMessage.classList.remove("success", "error");

    // Atualiza a mensagem e o ícone conforme o status
    if (isSuccess) {
        fieldMessage.innerHTML = message;
        fieldMessage.classList.add("success");
        icon.innerHTML = iconSuccess;

        // Criando o botão dinamicamente
        const button = document.createElement("button");
        button.innerHTML = "<span>ENTRAR</span>";
        button.classList.add("enter-button");

        // Adiciona evento de clique para a pagina de login
        button.addEventListener("click", () => {
            window.location.href = "https://inscri-o-conf.vercel.app/"; 
        });

        // Adiciona o botão ao .verify-box
        verifyBox.appendChild(button);
    } else {
        fieldMessage.innerHTML = message;
        fieldMessage.classList.add("error");
        icon.innerHTML = iconError;
    }
}

async function verifyToken() {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    
    if (!token) {
        updateVerificationStatus(false, "Token inválido.");
        return;
    }

    try {
        const result = await postEmailToken(token);

        if (result.status === 200) {
            updateVerificationStatus(true, "E-mail verificado com sucesso!");
        } else if (result.status === 402) {
            updateVerificationStatus(false, "O token já foi verificado");
        } else if (result.status === 401) {
            updateVerificationStatus(false, "O token expirou. Faça o cadastro novamente.");
        } else if (result.status === 400) {
            updateVerificationStatus(false, "O token é inválido.");
        } else {
            updateVerificationStatus(false, "Erro ao verificar o e-mail. Tente novamente mais tarde.");
        }

    } catch (error) {
        console.error("Erro ao verificar token:", error);
        updateVerificationStatus(false, "Erro interno ao processar a verificação.");
    }
}

async function init() {
    verifyToken();
};

document.addEventListener('DOMContentLoaded', init);

