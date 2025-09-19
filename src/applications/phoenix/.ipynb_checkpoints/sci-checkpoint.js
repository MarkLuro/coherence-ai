/**
 * @file src/applications/phoenix/sci.js
 * @description El Substrate Command Interface (SCI). El órgano sensorial de Phoenix.
 *              Interactúa con el sustrato cognitivo (LLM) para percibir el mundo.
 *              v1.2: Calibrado al endpoint y modelo correctos verificados vía cURL.
 */

import axios from 'axios';

class SubstrateCommandInterface {
    constructor(apiKey) {
        if (!apiKey) {
            throw new Error('[SCI] Se requiere una API Key para la construcción del SCI.');
        }

        /**
         * CORRECCIÓN v1.2:
         * 1. Volvemos a la API 'v1beta' que es la que soporta los modelos más recientes.
         * 2. El nombre del modelo se pasa en la URL, no como un parámetro base.
         */
        this.apiKey = apiKey;
        this.modelName = 'gemini-1.5-flash-latest'; // Podemos hacer esto configurable más adelante.
        this.baseURL = 'https://generativelanguage.googleapis.com/v1beta/models';
        
        this.apiClient = axios.create({
            headers: {
                'Content-Type': 'application/json',
                'X-goog-api-key': this.apiKey // Manera más estándar de pasar la API key
            },
        });
    }

    async reason(prompt) {
        try {
            // Construir la URL completa para la petición, como en el cURL
            const url = `${this.baseURL}/${this.modelName}:generateContent`;

            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }],
            };
            
            // Realizar la petición POST a la URL completa.
            const response = await this.apiClient.post(url, requestBody);

            const content = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
            
            if (!content) {
                console.warn('[SCI] El sustrato devolvió una respuesta válida pero sin contenido.');
                return '';
            }
            return content.trim();
        } catch (error) {
            const errorMessage = error.response?.data?.error?.message || error.message;
            console.error('[SCI] Error crítico durante la percepción (llamada a la API):', errorMessage);
            throw new Error('La comunicación con el sustrato falló.');
        }
    }
}

export default SubstrateCommandInterface;