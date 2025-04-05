const apiUrl = 'https://api-inscri-o.vercel.app'

export async function postLogin(dataUser) {
    try {
        const response = await fetch(`${apiUrl}/user/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: 'include', // Garante que cookies de autenticação sejam enviados junto à requisição
            body: JSON.stringify(dataUser) // Converte o objeto `dataUser` em JSON antes de enviar
        });

        const result = await response.json();

        if (!response.ok) {
            throw new Error(result.message || `Erro ${response.status}`); // Lança um erro caso a resposta não seja bem-sucedida
        }
        
        return {
            status: response.status,  
            message: result.message,
            accessToken: result.accessToken // Retorna o token de acesso, caso exista
        };

    } catch (error) { 
        console.error('Erro na requisição:', error); // Registra o erro no console
        throw error; // Relança o erro para que possa ser tratado externamente
    }
};

export async function postRegister(dataRegister) {
    try {
        const response = await fetch(`${apiUrl}/user/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataRegister) // Converte o objeto `dataRegister` em JSON antes de enviar
        });

        const result = await response.json();

        return {
            status: response.status,
            message: result.message // Retorna a mensagem da API, que pode indicar sucesso ou erro
        };
    } catch (error) {
        console.error('Erro na requisição:', error); // Registra o erro no console para depuração
        
        return {
            status: 500, // Retorna um status genérico de erro interno caso a requisição falhe
            message: 'Erro interno ao processar a requisição.'
        };
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
                "Authorization": `Bearer ${token}` // Envia o token de autenticação no cabeçalho
            }
        });

        const result = await response.json();

        if (!response.ok) {
            return { error: result.message, status: response.status }; // Retorna erro e status caso a resposta não seja bem-sucedida
        }

        return result; // Retorna os dados da API em caso de sucesso
    } catch (error) {
        console.error("Erro ao verificar o token:", error); // Registra o erro no console
        
        return { error: "Erro ao verificar o token", status: 500 }; // Retorna erro genérico em caso de falha na requisição
    }
}

export async function refreshAccessToken() {
    try {
        const response = await fetch(`${apiUrl}/user/refresh-token`, {
            method: "POST",
            credentials: "include", // Garante que o cookie de refreshToken seja enviado automaticamente
            headers: {
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            throw new Error("Falha ao renovar o token"); // Lança um erro caso a requisição falhe
        }

        return await response.json(); // Retorna o novo accessToken em caso de sucesso
    } catch (error) {
        console.error("Erro ao renovar o token:", error); // Registra o erro no console
        
        return null; // Retorna `null` caso a renovação falhe
    }
}
