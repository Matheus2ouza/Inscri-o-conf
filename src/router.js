const apiUrl = 'https://api-inscri-o.vercel.app'

export async function getLocations() {

    let cities = {};
    try{
        const response = await fetch(`${apiUrl}/localidades`);

        if(!response.ok) {
            throw new Error(`Erro ao buscar localidades: ${response.status} ${response.statusText}`)
        }
        
        const data = await response.json();
        data.forEach(city => {
            cities[city.id] = {id: city.id, nome: city.nome};
        });
        
    }catch(error){
        console.error(`Error: ${error.message}`);
    }

    return cities;
}

export async function registrarInscricao(registrationData) {
    try {
        const response = await fetch(`${apiUrl}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData),
        });

        const responseData = await response.json(); // Converte a resposta JSON

        // Retorna o responseData e o response
        console.log('Resposta da inscrição:', responseData, 'Status:', response.status);
        return { data: responseData, status: response.status }; // Retorna ambos

    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Log do erro de requisição
        return { data: null, status: 500 }; // Retorna status de erro
    }
}


export async function registrarHospedagem(idInscricao, listaNomesHospedagem) {
    try {
        console.log(idInscricao)
        console.log(listaNomesHospedagem)
        const response = await fetch(`${apiUrl}/hospedagem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                id_inscricao: idInscricao,
                nomes_hospedagem: listaNomesHospedagem
            })
        });

        return response.status; // Retorna o status da requisição
    } catch (error) {
        console.error('Erro ao registrar hospedagem:', error);
        return 500; // Retorna erro genérico se falhar
    }
}

export async function getDashboardData() {
    try {
        const response = await fetch(`${apiUrl}/dashboard`);
        if (!response.ok) {
            throw new Error(`Erro ao buscar dados do dashboard: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        return data; // Retorna os dados do dashboard
    } catch (error) {
        console.error(`Erro: ${error.message}`);
        return null; // Retorna null em caso de erro
    }
}

export async function loginAdmin(userData) {
    try {
        const response = await fetch(`${apiUrl}/loginAdmin`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(userData),
        });

        const responseData = await response.json();

        if (response.ok) {
            console.log('Login bem-sucedido:', responseData.message);
            return { success: true, data: responseData }; // Retorna dados de sucesso
        } else {
            // Verifica o status e retorna mensagens específicas de erro
            if (response.status === 400) {
                console.warn('Erro de validação:', responseData.errors);
                return { success: false, message: 'Dados de entrada inválidos. Verifique seus dados.' };
            } else if (response.status === 401) {
                const message = responseData.message.includes('username')
                    ? 'Nome de usuário inválido.'
                    : 'Senha inválida.';
                console.warn('Erro de autenticação:', message);
                return { success: false, message: message };
            } else {
                console.error('Erro desconhecido:', response.status);
                return { success: false, message: 'Erro ao tentar fazer login. Tente novamente mais tarde.' };
            }
        }
    } catch (error) {
        console.error('Erro no login:', error.message);
        return { success: false, message: 'Erro no login. Tente novamente mais tarde.' };
    }
}

export async function getRelatorio(localidadeId) {
    try {
        const response = await fetch(`${apiUrl}/report/${localidadeId}`);

        if (!response.ok) {
            throw new Error(`Erro ao buscar relatório: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        return data; // Retorna os dados do relatório
    } catch (error) {
        console.error(`Erro ao buscar o relatório: ${error.message}`);
        return null; // Retorna null em caso de erro
    }
}