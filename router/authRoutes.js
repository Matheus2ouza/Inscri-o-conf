const apiUrl = 'https://api-inscri-o.vercel.app'

export async function postLogin(dataUser) {
    try {
        const response = await fetch(`${apiUrl}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include',
            body: JSON.stringify(dataUser)
        });

        const result = await response.json();

        if (!response.ok) {
            return result
        }

        return {
            status: response.status,
            message: result.message,
            accessToken: result.accessToken,
            role: result.role
        };

    } catch (error) {
        console.error('Erro na requisição:', error); // Registra o erro no console
        throw error; // Relança o erro para que possa ser tratado externamente
    }
};

export async function postActive(datalocality, token) {
    try {
        const response = await fetch(`${apiUrl}/locality/activeLocality`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(datalocality)
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: result.message || `Erro ${response.status}: ${response.statusText}`
            };
        }

        return result;

    } catch (error) {
        console.error('Erro na requisição:', error);
        return {
            success: false,
            message: 'Erro de conexão com o servidor'
        };
    }
}

export async function postDeactivated(locality, token) {
    try {
        const response = await fetch(`${apiUrl}/locality/deactivated`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(locality)
        });

        const result = await response.json();

        if (!response.ok) {
            return {
                success: false,
                message: result.message || `Erro ${response.status}: ${response.statusText}`
            };
        }

        return result;

    } catch (error) {
        console.error('Erro na requisição:', error);
        return {
            success: false,
            message: 'Erro de conexão com o servidor'
        };
    }
}

export async function getLocality(token) {
    try {
        const response = await fetch(`${apiUrl}/locality/ListLocality`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        return response
    } catch (error) {
        console.log(`Erro ao buscar a lista de localidades: ${error}`);
    }

}

export async function postEmailToken(token) {
    try {
        const response = await fetch(`${apiUrl}/user/verify-email`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token }) // Envia o token de verificação no corpo da requisição
        });

        const result = await response.json();

        return {
            status: response.status,
            message: result.message // Retorna a mensagem da API, indicando sucesso ou erro
        };
    } catch (error) {
        console.error('Erro na requisição:', error); // Registra o erro no console para depuração

        return {
            status: 500, // Retorna um status genérico de erro interno caso a requisição falhe
            message: 'Erro interno ao processar a requisição.'
        };
    }
}

export async function verifyToken(token) {
    try {
        const response = await fetch(`${apiUrl}/user/verify-token`, {
            method: "GET",
            headers: {
                "Authorization": `Bearer ${token}`,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json().catch(() => ({})); // Evita falha no JSON caso response seja vazio ou malformado

        if (!response.ok) {
            return {
                error: result?.message || "Erro ao verificar o token",
                status: response.status
            };
        }

        return result; // { message, id, nome, role, ... }
    } catch (error) {
        console.error("Erro ao verificar o token:", error);

        return {
            error: "Erro ao verificar o token",
            status: 500
        };
    }
}
