import { postEmailToken } from "./router.js";

const checkbox = document.querySelector('#chk');

/**
 * Ativa ou desativa o modo escuro.
 */
function darkModeToggle() {
    checkbox.addEventListener('change', () => {
        document.body.classList.toggle('dark-mode');
    });
}

function updateVerificationStatus(isSuccess, message = "Ocorreu um erro na verificação.") {
    const fieldMessage = document.querySelector('.message');
    const icon = document.querySelector('.icon');
    const loading = document.querySelector('.loading');

    // Define os ícones
    const iconSuccess = '<i class="bi bi-check-circle-fill"></i>';
    const iconError = '<i class="bi bi-x-octagon-fill"></i>';

    // Limpa o conteúdo atual do ícone
    icon.innerHTML = "";

    if (isSuccess) {
        fieldMessage.innerHTML = "Email verificado com sucesso!";
        fieldMessage.classList.add("success");
        icon.innerHTML = iconSuccess;
        loading.style.display = 'flex';
    } else {
        loading.style.display = 'none';
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

    const data = {
        token: token
    }

    try {
        const result = await postEmailToken(token);

        if (result.status === 200) {
            updateVerificationStatus(true, "E-mail verificado com sucesso!");
        } else if (result.status === 402) {
            updateVerificationStatus(false, "O token já foi verificado")
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
    darkModeToggle();
    verifyToken();
};

document.addEventListener('DOMContentLoaded', init);

