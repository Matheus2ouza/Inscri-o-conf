const apiUrl = 'https://api-inscri-o.vercel.app';

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