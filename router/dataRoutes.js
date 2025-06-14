const apiUrl = 'https://api-inscri-o.vercel.app'

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

export async function getEventList() {
    try {
        const response = await fetch(`${apiUrl}/dados/eventos`);

        if (!response.ok) {
            throw new Error(`Erro ao buscar eventos: ${response.status} ${response.statusText}`);
        }
        const data = await response.json();
        const events = {};
        
        data.forEach(event => {
            const eventId = event.id;
            events[eventId] = {
                id: event.id,
                descricao: event.descricao,
                data_limite: event.data_limite,
                tipo_inscricao: event.tipo_inscricao,
            };
        });
        return events;
    }catch (error) {
        console.error(`Erro ao buscar eventos: ${error.message}`);
        return null; // Retorna `null` em caso de erro
    }
};