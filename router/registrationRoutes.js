const apiUrl = "https://api-inscri-o.vercel.app";

export async function postFileRegister(responsible, file, token) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("responsible", responsible)

        const response = await fetch(`${apiUrl}/register/upload-file`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const responseData = await response.json();

        // Se a resposta for bem-sucedida, retorna o corpo e o status
        if (response.ok) {
            return { data: responseData, status: response.status };
        } else {
            // Se a resposta não for bem-sucedida, retorna a mensagem de erro e o status
            return { message: responseData.message, status: response.status };
        }
    } catch (error) {
        console.log("Erro ao enviar o arquivo:", error);
        return { error: error.message, status: 500 };
    }
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
        return { data: responseData, status: response.status };

    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Log do erro de requisição
        return { data: null, status: 500 }; // Retorna status de erro
    }
};

export async function registrarInscricaoServ(registrationData) {
    try {
        const response = await fetch(`${apiUrl}/registroServ`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData),
        });

        const responseData = await response.json(); // Converte a resposta JSON

        console.log('Resposta da inscrição:', responseData, 'Status:', response.status);
        return { data: responseData, status: response.status }; // Retorna tanto os dados quanto o status da resposta

    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Log do erro de requisição
        return { data: null, status: 500 }; // Retorna status de erro genérico
    }
};

export async function registrarInscricaoJovem(registrationData) {
    try {
        const response = await fetch(`${apiUrl}/registroJovem`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(registrationData),
        });

        const responseData = await response.json(); // Converte a resposta JSON

        console.log('Resposta da inscrição:', responseData, 'Status:', response.status);
        return { data: responseData, status: response.status }; // Retorna tanto os dados quanto o status da resposta

    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Log do erro de requisição
        return { data: null, status: 500 }; // Retorna status de erro genérico
    }
}



export async function registrarHospedagem(idInscricao, listaNomesHospedagem) {
    try {
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

        console.log('Status da Hospedagem:', response.status);
        return response.status; // Retorna apenas o status da requisição
    } catch (error) {
        console.error('Erro ao registrar hospedagem:', error);
        return 500; // Retorna erro genérico se falhar
    }
}

//FUNCOES PARA A TELA DE REGISTROS DE PAGAMENTOS
export async function registrarInscricaoAvulsa(paymenteData) {
    try {
        // Faz a requisição para registrar a inscrição avulsa
        const response = await fetch(`${apiUrl}/RegistroPagamento/inscricao-avulsa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(paymenteData), // Envia todos os dados de uma vez
        });

        // Verifica o status da resposta
        if (response.status === 201) {
            const inscricaoData = await response.json();
            console.log("Inscrição registrada com sucesso:", inscricaoData);
            return response.status; // Retorna 201 em caso de sucesso
        } else {
            console.error("Erro ao registrar inscrição avulsa:", response.status);
            return response.status; // Retorna o status do erro
        }
    } catch (error) {
        console.error("Erro ao registrar inscrição avulsa:", error);
        return 500; // Retorna erro genérico para problemas no processo
    }
}

export async function registrarVendaAlimentacao(paymentData) {
    try {
        console.log(paymentData); // Confirma o objeto sendo enviado

        // Faz a requisição para cadastrar a venda
        const responseVenda = await fetch(`${apiUrl}/RegistroPagamento/venda-alimentacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(paymentData) // Envia diretamente o objeto
        });

        // Verifica se a venda foi registrada com sucesso
        if (!responseVenda.ok) {
            console.error("Erro ao registrar venda:", await responseVenda.text());
            return responseVenda.status;
        }

        const vendaData = await responseVenda.json();
        console.log("Venda registrada com sucesso:", vendaData);

        return responseVenda.status;
    } catch (error) {
        console.error('Erro ao registrar venda de alimentação:', error);
        return 500;
    }
}

export async function getdatacaixa() {
    try{
        const response = await fetch(`${apiUrl}/RegistroPagamento/dadosMovimentacao`);

        if(!response.ok) {
            console.log(`Erro ao buscar dados de caixa: ${response.status} ${response.statusText}`);
            return null
        }

        const data = response.json();
        return data;
    } catch (error) {
        console.error(`Erro inesperado: ${error.message}`);
        return null;
    }
}

export async function getDataAlimentacao() {
    try {
        const response = await fetch(`${apiUrl}/RegistroPagamento/DadosRefeicao`);

        // Verificando se a resposta foi bem-sucedida (status 200-299)
        if (!response.ok) {
            console.error(`Erro ao buscar a lista: ${response.status} ${response.statusText}`);
            return null; // Retorna null ou um valor adequado em caso de erro
        }

        const data = await response.json();
        return data;
    
    } catch (error) {
        console.error(`Erro inesperado: ${error.message}`);
        return null; // Retorna null ou outro valor em caso de erro
    }
}

export async function registrarCaixa(registerData) {
    try {
        const response = await fetch(`${apiUrl}/RegistroPagamento/caixa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(registerData)
        });

        // Verifica o status da resposta
        if (response.ok) {
            const inscricaoData = await response.json();  // Pode lidar com erro JSON se precisar
            console.log("Inscrição registrada com sucesso:", inscricaoData);
            return response.status; // Retorna o código de sucesso
        } else {
            // Lida com resposta diferente de sucesso (4xx, 5xx)
            const errorData = await response.json(); // Pega os dados de erro
            console.error("Erro ao registrar inscrição avulsa:", errorData);
            return response.status; // Retorna o status do erro
        }
    } catch (error) {
        console.error('Erro ao registrar entrada no caixa:', error);
        return 500; // Código genérico de erro de servidor
    }
}