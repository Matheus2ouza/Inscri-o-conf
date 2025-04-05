const apiUrl = 'https://api-inscri-o.vercel.app';

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
