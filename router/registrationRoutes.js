const apiUrl = "https://api-inscri-o.vercel.app";

export async function postFileRegister(eventId, responsible, file, token) {
    try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("eventSelectedId", eventId);
        formData.append("responsible", responsible);

        const response = await fetch(`${apiUrl}/register/register-group`, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${token}`
            },
            body: formData
        });

        const responseData = await response.json();

        if (!response.ok) {
            // Retorna erro com status e mensagem vinda do backend
            return {
                error: true,
                status: response.status,
                message: responseData.message || "Erro desconhecido",
                errors: responseData.errors || null
            };
        }

        return responseData;
    } catch (error) {
        console.error("Erro ao enviar o arquivo:", error);
        return {
            error: true,
            message: "Erro de rede ou servidor fora do ar.",
            details: error.message
        };
    }
}

export async function confirmRegister(eventSelectedId, uniqueId, token) {
    try {
        const response = await fetch(`${apiUrl}/register/confirm-group`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventSelectedId: eventSelectedId,
                uniqueId: uniqueId
            })
        });

        const responseData = await response.json();
        return {
            status: response.status,
            ...responseData
        };
    } catch (error) {
        console.error("Erro ao confirmar inscrição:", error);
        return {
            success: false,
            message: "Erro de rede ou servidor fora do ar.",
            details: error.message
        };
    }
}

export async function postIndividualRegister(data, eventSelectedId, token, responsible) {
    try {
        const response = await fetch(`${apiUrl}/register/register-unique`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                ...data,
                responsible: responsible,
                eventSelectedId: eventSelectedId
            })
        });

        const result = await response.json()
        return {
            status: response.status,
            ...result
        }
        
    }catch (error) {
        console.error("Erro ao registrar inscrição individual:", error);
        return {
            success: false,
            message: "Erro de rede ou servidor fora do ar.",
            details: error.message
        };
    }
}

export async function confirmRegisterUnique(eventSelectedId, uniqueId, token) {
    try {
        const response = await fetch(`${apiUrl}/register/confirm-unique`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                eventSelectedId: eventSelectedId,
                uniqueId: uniqueId
            })
        })

        const result = await response.json()

        return {
            status: response.status,
            ...result
        }
    } catch (error) {
        console.error("Erro ao registrar inscrição individual:", error);
        return {
            success: false,
            message: "Erro de rede ou servidor fora do ar.",
            details: error.message
        };
    }
}

export async function registerPayment(paymenteFile, valuePaid, registrationDetailsId, token) {
    const formData = new FormData();
    formData.append("paymenteFile", paymenteFile);
    formData.append("valuePaid", valuePaid);
    formData.append("registrationDetailsId", registrationDetailsId);

    try{
        const response = await fetch(`${apiUrl}/payment/upload-payment`,{
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        })

        const result = await response.json()

        return {
            status: response.status,
            ...result
        }
    }catch (error) {
        console.error("Erro ao registrar o comprovante:", error);
        return {
            success: false,
            message: "Erro de rede ou servidor fora do ar.",
            details: error.message
        };
    }
}

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