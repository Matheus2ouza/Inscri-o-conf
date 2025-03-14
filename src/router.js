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

export async function getLocations() {
    try {
        const response = await fetch(`${apiUrl}/dados/localidades`);

        if (!response.ok) {
            throw new Error(`Erro ao buscar localidades: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        // Transforma o array de localidades em um objeto
        return data.reduce((cities, city) => {
            cities[city.id] = { 
                id: city.id, 
                nome: city.nome, 
                saldoDevedor: city.saldo_devedor 
            };
            return cities;
        }, {});

    } catch (error) {
        console.error(`Erro ao buscar localidades: ${error.message}`);
        return null; // Retorna `null` em caso de erro
    }
}


export async function getDatalocations() {
    let registrations = {};

    try {
        const response = await fetch(`${apiUrl}/dados/inscricaoData`);

        if (!response.ok) {
            throw new Error(`Erro ao buscar as inscrições: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();

        data.forEach(inscription => {
            const localidade = inscription.localidade_nome;

            // Se a localidade já existe no objeto, soma os valores
            if (registrations[localidade]) {
                registrations[localidade].qtd_0_6 += inscription.qtd_0_6;
                registrations[localidade].qtd_7_10 += inscription.qtd_7_10;
                registrations[localidade].qtd_10_acima += inscription.qtd_10_acima;
                registrations[localidade].qtd_tx_participacao += inscription.qtd_tx_participacao;
                registrations[localidade].qtd_servico += inscription.qtd_servico;

                // Mantém o nome_responsavel existente ou atualiza com o último encontrado
                registrations[localidade].nome_responsavel = inscription.nome_responsavel;
            } else {
                // Cria uma nova entrada para a localidade
                registrations[localidade] = {
                    nome_responsavel: inscription.nome_responsavel,
                    qtd_0_6: inscription.qtd_0_6,
                    qtd_7_10: inscription.qtd_7_10,
                    qtd_10_acima: inscription.qtd_10_acima,
                    qtd_tx_participacao: inscription.qtd_tx_participacao,
                    qtd_servico: inscription.qtd_servico
                };
            }
        });
    } catch (error) {
        console.error(`Error: ${error.message}`);
    }

    return registrations;
}

export async function getfinancialMovement() {
    let moviments = [];
    try {
        const response = await fetch(`${apiUrl}/RegistroPagamento/movimentacao`);

        if (!response.ok) {
            throw new Error(`Erro ao buscar as movimentações: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        data.forEach(moviment => {
            // Converte cada movimentação financeira em um objeto com pagamentos
            moviments.push({
                id: moviment.id,
                tipo: moviment.tipo,
                descricao: moviment.descricao,
                valor: moviment.valor,
                data: moviment.data,
                pagamentos: moviment.pagamentos || [] // Inclui os pagamentos, caso existam
            });
        });
    } catch (error) {
        console.error(`Erro: ${error.message}`);
    }

    return moviments;
}

export async function getProofPayment() {
    try {
        const response = await fetch(`${apiUrl}/buscarComporvante`);
    
        if (!response.ok) {
            throw new Error(`Erro ao buscar as movimentações: ${response.status} ${response.statusText}`);
        };

        const data = await response.json();
        return data;
    } catch {
        console.error(`Erro: ${error.message}`);
    };
};

export async function getDataLocations() {
    try {
        const response = await fetch (`${apiUrl}/dados/localidades`)

        if(!response.ok) {
            throw new console.log(`Erro ao buscar os dados: ${response.status}: ${response.statusText}`)
        }

        const data = await response.json();
        return data
    } catch(error) {
        console.log(`Error: ${error.message}`)
    }
};

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

export async function getDashboardData(eventoId) {
    try {
        const response = await fetch(`${apiUrl}/dashboard/datageneralData`, {
            method: 'POST',  // Método POST para enviar dados
            headers: {
                'Content-Type': 'application/json'  // Define o tipo de conteúdo JSON
            },
            body: JSON.stringify({ eventoId })  // Envia o eventoId no corpo da requisição
        });

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

export async function getEventData() {
    try {
        const response = await fetch(`${apiUrl}/dashboard/event`);
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

export async function getlistHosting() {
    try {
        const response = await fetch(`${apiUrl}/listHosting`);
        
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

export async function generatePdf(localidade = null) {
    try {
        // Monta a URL com ou sem o parâmetro de filtro
        const queryParam = localidade ? `?localidade=${encodeURIComponent(localidade)}` : '';
        const response = await fetch(`${apiUrl}/generatePdf/generate-pdf${queryParam}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`Erro ao gerar PDF: ${response.status} ${response.statusText}`);
        }

        // Converte a resposta em blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Define o nome do arquivo com base na localidade
        let pdfFilename = 'lista de hospedagem geral.pdf'; // Padrão sem filtro de localidade
        if (localidade) {
            pdfFilename = `lista de hospedagem - ${localidade}.pdf`; // Se houver filtro de localidade
        }

        // Cria um link para download
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFilename;  // Define o nome do arquivo dinamicamente
        document.body.appendChild(link);
        link.click();

        // Remove o link após o download
        link.remove();
        window.URL.revokeObjectURL(url);
        console.log('PDF gerado e baixado com sucesso.');
    } catch (error) {
        console.error(`Erro ao baixar o PDF: ${error.message}`);
    }
}

export async function createPdfMovement(groupedMovements) {
    try {
        // Log para verificar os dados que estão sendo enviados
        console.log("Dados para gerar o PDF:", groupedMovements);

        // Envia os dados agrupados para o backend para gerar o PDF
        const response = await fetch(`${apiUrl}/movementPdf/gerar-pdf`, {  
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ movements: groupedMovements })  // Envia os dados no corpo da requisição
        });

        // Verifica se a requisição foi bem-sucedida
        if (!response.ok) {
            throw new Error(`Erro ao gerar o PDF: ${response.status} ${response.statusText}`);
        }

        // Converte a resposta em blob para download
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);

        // Define o nome do arquivo para o download
        const pdfFilename = 'movimentacoes_financeiras.pdf';

        // Cria um link para download
        const link = document.createElement('a');
        link.href = url;
        link.download = pdfFilename;  // Nome do arquivo para o download
        document.body.appendChild(link);
        link.click();

        // Remove o link após o download
        link.remove();
        window.URL.revokeObjectURL(url);

        console.log('PDF gerado e baixado com sucesso.');
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error);
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

export async function createPdf(type) {
    console.log('Enviando tipo para o backend:', type); // Adiciona um log para debugar o tipo enviado
    try {
        const response = await fetch(`${apiUrl}/pdf/createPdf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(type) // Certifique-se de que está enviando { tipo: type }
        });

        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Relatorio ${type.tipo}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        return response
        
    } catch (error) {
        console.error('Erro ao criar o PDF:', error);
    }
}
