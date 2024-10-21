function showPopup(title, message) {
    const popup = document.getElementById('popup');
    const popupContent = popup.querySelector('.popup-content p');
    const popupTitle = popup.querySelector('.popup-content h2');
    popupContent.textContent = message; // Atualiza a mensagem do pop-up
    popupTitle.textContent = title
    popup.style.display = 'flex'; // Exibe o pop-up
}

// Lógica para fechar o pop-up
document.querySelector('.close-btn').addEventListener('click', function() {
    document.getElementById('popup').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', function () {
    const saldoDevedorInput = document.getElementById('saldoDevedor');
    const valorPago = document.getElementById('valor_pago')
    const paymentForm = document.getElementById('paymentForm');
    const cidadeInput = document.getElementById('cidade');
    let cidade = ''

    const popup = document.getElementById('popup');
    popup.style.display = 'none';
    
    // Função para buscar o saldo devedor com base na cidade
    cidadeInput.addEventListener('change', async function () {
        cidade = cidadeInput.value.trim().toUpperCase(); // Convertendo para uppercase para correspondência exata

        if (!cidade) {
            saldoDevedorInput.value = ''; // Limpa o campo se não houver cidade
            return;
        }

        try {
            const response = await fetch(`http://localhost:8080/localidades?nome=${cidade}`);
            if (!response.ok) {
                throw new Error('Cidade não encontrada ou erro na consulta.');
            }

            const data = await response.json();
            console.log(data);
            
            // Procurando a cidade correspondente no array (caso haja mais de uma)
            const cidadeEncontrada = data.find(item => item.nome.toUpperCase() === cidade);
            
            if (cidadeEncontrada) {
                saldoDevedorInput.value = cidadeEncontrada.saldo_devedor; // Preenche com o saldo devedor da cidade encontrada
            } else {
                saldoDevedorInput.value = ''; // Limpa se não encontrar saldo
            }
        } catch (error) {
            console.error('Erro ao buscar saldo devedor:', error);
            alert('Erro ao buscar saldo devedor. Verifique o console para mais detalhes.');
        }
    });

    // Função para registrar o pagamento
    paymentForm.addEventListener('submit', async function (event) {
        event.preventDefault(); // Impede o envio padrão do formulário
    
        const formData = new FormData(); // Corrigido: Parênteses faltando.
    
        // Obtém a cidade e valor pago
        const cidade = cidadeInput.value.trim().toUpperCase().split(',')[0];
        const valor_pago = valorPago.value;
    
        // Corrige o ID do campo de upload para pegar o arquivo correto
        const fileInput = document.getElementById('comprovante_pagamento');
        if (fileInput.files.length > 0) {
            formData.append('comprovante_pagamento', fileInput.files[0]); // Adiciona o comprovante
        } else {
            console.error('Nenhum arquivo foi selecionado.');
            return;
        }
    
        // Adiciona os outros campos ao FormData
        formData.append('valor_pago', valor_pago);
        formData.append('cidade', cidade);
    
        console.log(...formData); // Exibe o conteúdo do FormData para debug

        try {
            const response = await fetch('http://localhost:8080/pagamento', {
                method: 'POST',
                body: formData
            });

            if (response.status === 400) {
                // falta do comprovante
                const errorResponse = await response.json();
                console.error(`Erro ao registrar pagamento: ${errorResponse.message}`);
                showPopup("Erro ao realizar a inscrição. Tente novamente."); // Ocorreu um erro
                return;
            } else if (response.status === 404) {
                //Erro de consulta
                console.error(`Erro ao registrar pagamento: ${errorResponse.message}`);
                showPopup("Erro ao realizar a inscrição. Tente novamente."); // Ocorreu um erro
                return;
            } else if (!response.ok) {
                // Outros erros
                showPopup("Erro ao realizar a inscrição. Tente novamente."); // Ocorreu um erro
                console.error('Erro inesperado ao registrar pagamento:', response);
                return;
            }

            const result = await response.json();
            showPopup("Inscrição realizada com sucesso!");

        }catch (error) {
            console.error('Erro ao registrar pagamento:', error);
            alert('Erro ao registrar pagamento. Verifique o console para mais detalhes.');
        }
    });
    
    
});
