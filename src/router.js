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

        // Retorna o status da resposta diretamente
        console.log('Resposta da inscrição:', responseData, 'Status:', response.status);
        return response.status; // Retorna o código de status HTTP

    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Log do erro de requisição
        return 500; // Retorna 500 ou outro status representando erro
    }
}





