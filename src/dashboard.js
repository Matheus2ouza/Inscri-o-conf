import { getDashboardData, getEventData } from './router.js';

let dashboardData;

function toggleLoader(show) {
    const loader = document.querySelector('.loader-background');
    if (show) {
        loader.style.display = 'flex';  // Torna o loader visível com display flex
    } else {
        loader.style.display = 'none';  // Oculta o loader
    }
}

function formattedDate(date) {
    return new Date(date).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month:'2-digit',
        year:'numeric'
    });
}

function formatCharacters(text, limite) {
    if(text.length > limite) {
        return text.substring(0, limite) + '...';
    }
    return text
};

async function eventLoader() {
    const eventsSelect = document.querySelector('.events');
    
    toggleLoader(true);
    try {
        const events = await getEventData();
        
        eventsSelect.innerHTML = '<option value="">Selecione um Evento</option>'; // Coloca uma opção padrão
    
        events.forEach(event => {
            const option = document.createElement('option');
            option.value = event.id;
            option.textContent = formatCharacters(event.descricao, 40);
            eventsSelect.appendChild(option);
        });
    }catch {
        alert('Erro ao nos eventos. A pagina será recarregada automaticamente');
        location.reload();
    }finally {
        toggleLoader(false);
    }
}

async function multidata() {
    const eventId = document.querySelector('.events').value;  // Corrigido para pegar a classe correta
    
    if (eventId) {  // Verifica se um evento foi selecionado
        console.log('Evento selecionado:', eventId);
        
        toggleLoader(true);
        try {
            const data = await getDashboardData(eventId);  // Passando o eventId para a função (supondo que você precise)
            dashboardData = data;
            console.log(dashboardData);
            createCardEvent();
        } catch {
            console.log("Erro ao buscar os dados gerais");
        } finally {
            toggleLoader(false);
        }
    }
}

function createCardEvent() {
    const descriptionEvent = document.querySelector('.card-description');
    const dateEvent = document.querySelector('.card-date');
    const eventsSelect = document.querySelector('.events');
    const eventText = eventsSelect.options[eventsSelect.selectedIndex].text;
    
    descriptionEvent.innerHTML = `<strong>Evento atual: </strong> ${eventText}`;
    dashboardData.eventos.data.forEach(event =>{
        if(event.descricao === eventText){

            dateEvent.innerHTML = `<strong>Data limite</strong>: ${formattedDate(event.data_limite)}`;
        };
    });

    createCardInscriptions();
};

function createCardInscriptions() {
    const cards = document.querySelectorAll('.card'); // Seleciona todos os cards

    cards.forEach(card =>{
        const tipoInscricao = card.id.replace('card-', '');
        const dados = dashboardData[tipoInscricao];

        if (dados && dados.success && Array.isArray(dados.data)) {

            if(card.id === "card-eventos") {
                return;
            };

            if (card.id === "card-inscricaoGeral") {
                const locality = new Set(dados.data.map(item => item.localidade));
                const totalLocality = locality.size;
                const totalInscricao = dados.data.reduce((soma, item) => soma + item.qtd_geral, 0);

                const paragrafos = card.querySelectorAll('p');
                paragrafos[0].innerHTML = `<strong> Total de localidades:</strong> ${totalLocality}`
                paragrafos[1].innerHTML = `<strong> Total inscritos:</strong> ${totalInscricao}`;
            }
            
            const sumMaleQuantity = dados.data.reduce((sum, item) => sum + parseInt(item.qtd_masculino), 0);
            const sumFemaleQuantity = dados.data.reduce((sum, item) => sum + parseInt(item.qtd_feminino), 0);
            const sumTotalQuantity = sumMaleQuantity + sumFemaleQuantity;

            console.log(sumMaleQuantity)
            console.log(sumFemaleQuantity)
            console.log(sumTotalQuantity)
            
        } else {
            card.querySelector('h2').textContent = tipoInscricao.replace(/_/g, ' ').toUpperCase();
            card.querySelector('p:nth-of-type(1)').textContent = `Localidades: 0`;
            card.querySelector('p:nth-of-type(2)').textContent = `Quantidade Total: 0`;
        }
    });

};

// Seleciona os ícones de expandir, o ícone de fechar, os cards e o container de detalhes
const expandIcons = document.querySelectorAll('.add-icon');
const closeIcon = document.querySelector('.close-icon');
const cards = document.querySelectorAll('.card');
const containerDetails = document.querySelector('.container-details');

// Adiciona evento de clique a cada ícone de expandir
expandIcons.forEach((expandIcon) => {
    expandIcon.addEventListener('click', (event) => {
        // Identifica qual card foi clicado
        const clickedCard = event.currentTarget.closest('.card');
        
        if (clickedCard) {
            console.log("Card clicado:", clickedCard.id || clickedCard.querySelector('.card-title')?.textContent || "Sem ID");
        }
        
        // Oculta todos os cards
        cards.forEach(c => c.style.display = 'none');
        
        // Torna o container de detalhes visível
        containerDetails.classList.add('expanded');
        containerDetails.classList.remove('closed');
    });
});

// Evento de clique no ícone de fechar
closeIcon.addEventListener('click', () => {
    // Mostra todos os cards novamente
    cards.forEach(c => c.style.display = 'block');
    
    // Adiciona a classe 'closed' para iniciar a animação de fechamento
    containerDetails.classList.add('closed');
    
    // Após a animação, remove a classe 'expanded' para ocultá-lo
    setTimeout(() => {
        containerDetails.classList.remove('expanded');
        containerDetails.classList.remove('closed');
    }, 500);
});


function init() {
    toggleLoader(false);
    eventLoader();

    const eventsSelect = document.querySelector('.events');
    
    // Adiciona o event listener para chamar multidata quando a seleção mudar
    eventsSelect.addEventListener('change', multidata);
}

document.addEventListener('DOMContentLoaded', init);
