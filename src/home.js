import { verifyToken, refreshAccessToken } from "./router.js";

const checkbox = document.querySelector("#chk");

/**
 * Ativa ou desativa o modo escuro.
 */
function darkModeToggle() {
    checkbox.addEventListener("change", () => {
        document.body.classList.toggle("dark-mode");
    });
}

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
                    return;
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
    location.href = "http://127.0.0.1:5500/page/loginManagement.html";
}

/**
 * Inicializa a página.
 */
async function init() {
    darkModeToggle();
    await tokenVerification();
}

document.addEventListener("DOMContentLoaded", init);
