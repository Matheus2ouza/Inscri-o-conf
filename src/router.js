const apiUrl = 'http://localhost:8080'

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

export async function registrarInscricao() {

    try {
        const response = await fetch(`${apiUrl}/registro`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(), // Converte o objeto em JSON
        });

        const responseData = await response.json(); // Converte a resposta uma única vez

        if (!response.ok) {
            console.error('Erro na inscrição:', responseData); // Lida com erro na inscrição
        } else {
            console.log('Inscrição realizada com sucesso:', responseData); // Lida com sucesso na inscrição
        }
    } catch (error) {
        console.error('Erro ao fazer a requisição:', error); // Lida com erro na requisição
    }
}

