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

export async function getDataLocations() {
    try {
        const response = await fetch (`${apiUrl}/localidades`)

        if(!response.ok) {
            throw new console.log(`Erro ao buscar os dados: ${response.status}: ${response.statusText}`)
        }

        const data = await response.json();
        return data
    } catch(error) {
        console.log(`Error: ${error.message}`)
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

export async function getpaymentReceipts() {
    try {
        const response = await fetch(`${apiUrl}/comprovantes`);
        
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

// Função para buscar os comprovantes
export async function getComprovantes() {
    try {
        // Fazendo requisição para a rota GET /comprovantes
        const response = await fetch(`${apiUrl}/buscarComporvante`);
        
        if (!response.ok) {
            throw new Error(`Erro ao buscar comprovantes: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        return data.comprovantes; // Retorna a lista de comprovantes

    } catch (error) {
        console.error('Erro ao carregar comprovantes:', error);
    }
}

//FUNCOES PARA A TELA DE REGISTROS DE PAGAMENTOS
export async function registrarInscricaoAvulsa(tipoInscricaoId, vlTotal, data, detalhes) {
    try {
        console.log(tipoInscricaoId, vlTotal, data, detalhes);
       
        const response = await fetch(`${apiUrl}/inscricao-avulsa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_inscricao_id: tipoInscricaoId, 
                qtd_masculino_06: detalhes.qtd_masculino_06 || 0,
                qtd_feminino_06: detalhes.qtd_feminino_06 || 0,
                qtd_masculino_7_10: detalhes.qtd_masculino_7_10 || 0,
                qtd_feminino_7_10: detalhes.qtd_feminino_7_10 || 0,
                qtd_masculino_normal: detalhes.qtd_masculino_normal || 0,
                qtd_feminino_normal: detalhes.qtd_feminino_normal || 0,
                qtd_masculino_visitante: detalhes.qtd_masculino_visitante || 0,
                qtd_feminino_visitante: detalhes.qtd_feminino_visitante || 0,
                vl_total: vlTotal,
                data: data 
            })
        });

        if (response.status === 201) {
            const inscricaoData = await response.json();
            
            const responseDetalhe = await fetch(`${apiUrl}/inscricao-avulsa/detalhes/${inscricaoData.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    valor: vlTotal,
                    formapagamento: detalhes.formapagamento
                })
            });

            return responseDetalhe.status;
        }

        return response.status;
    } catch (error) {
        console.error('Erro ao registrar inscrição avulsa:', error);
        return 500;
    }
}


export async function registrarVendaAlimentacao(tipoRefeicao, quantidade, precoUnitario, dataVenda, formPagamento) {
    try {
        console.log(tipoRefeicao, quantidade, precoUnitario, dataVenda, formPagamento);

        const responseVenda = await fetch(`${apiUrl}/venda-alimentacao`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_refeicao: tipoRefeicao, 
                quantidade: quantidade,
                valortotal: precoUnitario * quantidade 
            })
        });

        if (responseVenda.status === 201) {
            const vendaData = await responseVenda.json();

            const responseDetalhe = await fetch(`${apiUrl}/venda-alimentacao/detalhes/${vendaData.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    valor: precoUnitario * quantidade, 
                    formapagamento: formPagamento 
                })
            });

            return responseDetalhe.status;
        }

        return responseVenda.status;
    } catch (error) {
        console.error('Erro ao registrar venda de alimentação:', error);
        return 500;
    }
}


export async function registrarEntradaCaixa(tipoTransacao, valor, dataTransacao, descricao, responsavel) {
    try {
        console.log(tipoTransacao, valor, dataTransacao, descricao, responsavel);
        const response = await fetch(`${apiUrl}/caixa`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                descricao: descricao, 
                responsavel: responsavel, 
                valor: valor, 
                tipomovimento: tipoTransacao, 
                data: dataTransacao 
            })
        });

        return response.status; 
    } catch (error) {
        console.error('Erro ao registrar entrada no caixa:', error);
        return 500;
    }
}

