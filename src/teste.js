import { verifyToken, refreshAccessToken } from "./router.js";

/**
 * Verifica a validade do token de acesso.
 */
async function tokenVerification() {
    let accessToken = localStorage.getItem("accessToken");

    if (!accessToken) {
        redirectToLogin("Token não encontrado. Faça login novamente.");
        return;
    }

    try {
        let result = await verifyToken(accessToken);

        if (result.error) {
            if (result.status === 401) {
                console.log("Token expirado. Tentando obter um novo...");

                const newTokens = await refreshAccessToken();

                if (newTokens?.accessToken) {
                    localStorage.setItem("accessToken", newTokens.accessToken);
                    console.log("Novo accessToken obtido com sucesso!");
                    return; // Continua sem precisar validar de novo
                }
            }
        
            handleTokenError(result.status);
        }
    } catch (error) {
        console.error("Erro ao verificar o token:", error);
        redirectToLogin("Erro ao verificar sua sessão. Faça login novamente.");
    }
}

function handleTokenError(status) {
    if (status === 401) {
        alert("Sua sessão expirou. Faça login novamente.");
    } else if (status === 403) {
        alert("Acesso negado. Token inválido.");
    } else {
        alert("Erro na autenticação. Faça login novamente.");
    }

    logoutUser();
}

function redirectToLogin(message) {
    alert(message);
    logoutUser();
}

function logoutUser() {
    localStorage.removeItem("accessToken");
    location.href = "https://inscri-o-conf.vercel.app/";
}

/**
 * Inicializa a página.
 */
async function init() {
    await tokenVerification();
}

document.addEventListener('DOMContentLoaded', init);
