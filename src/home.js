import { verifyToken, refreshAccessToken } from "../router/authRoutes.js";

const checkbox = document.querySelector("#chk");

function movimentPage() {
    document.querySelectorAll(".sidebar-navigation li").forEach(li => {
        li.style.cursor = "pointer";

        li.addEventListener('click', () => {
            const span = li.querySelector(".tooltip"); // Encontra o span dentro do li
            
            if (span && span.id) {
                const pageId = span.id;
                const pageURL = `${pageId}.html`;

                // Verifica se a página existe antes de redirecionar
                fetch(pageURL, { method: 'HEAD' })
                    .then(res => {
                        if (res.ok) {
                            window.location.href = pageURL;
                        } else {
                            console.error(`Página não encontrada: ${pageURL}`);
                            alert('Página não encontrada!');
                        }
                    })
                    .catch(() => {
                        console.error(`Erro ao tentar acessar: ${pageURL}`);
                        alert('Erro ao tentar acessar a página!');
                    });
            } else {
                console.error("ID do span não encontrado.");
                alert('Página inválida!');
            }
        });
    });
};

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
    location.href = "loginManagement.html";
}

/**
 * Inicializa a página.
 */
async function init() {
    darkModeToggle();
    await tokenVerification();
    movimentPage();
}

document.addEventListener("DOMContentLoaded", init);
