import axios from 'axios';
import * as vscode from 'vscode';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}
interface OllamaModel {
    name: string;
    modified_at: string;
    size: number;
}


export class OllamaService {
    private getConfig() {
        const config = vscode.workspace.getConfiguration('ollama');
        return {
            serverUrl: config.get('serverUrl', 'http://localhost:11434'),
            model: config.get('model', ''), // Pas de modèle par défaut, sera auto-détecté
            disableThinking: config.get('disableThinking', true) // Par défaut, désactiver le "thinking"
        };
    }

    // Helper pour construire les options avec le contrôle du "thinking"
    private buildRequestOptions(baseOptions: any): any {
        const config = this.getConfig();
        const options = { ...baseOptions };
        
        if (config.disableThinking) {
            options.no_thinking = true;
        }
        
        return options;
    }
    
    // Helper pour savoir si le no_thinking est activé
    private isThinkingDisabled(): boolean {
        return this.getConfig().disableThinking;
    }

    // Helper pour debug optionnel du streaming
    private debugChunk(chunk: string, context: string): void {
        const config = vscode.workspace.getConfiguration('ollama');
        const debugMode = config.get('debugStreaming', false);
        
        if (debugMode) {
            console.log(`[${context}] Chunk reçu (${chunk.length} chars):`, chunk.substring(0, 100));
            
            // Vérifier si c'est du JSON valide
            try {
                JSON.parse(chunk);
                console.log(`[${context}] ✅ JSON valide`);
            } catch {
                console.log(`[${context}] ❌ JSON invalide`);
            }
        }
    }

    // NOUVELLE MÉTHODE: Obtenir automatiquement un modèle disponible
    async getAutoSelectedModel(): Promise<string> {
        try {
            const models = await this.getModels();
            
            if (models.length === 0) {
                throw new Error('Aucun modèle Ollama installé. Suggestions:\n' +
                    '- ollama pull qwen2.5-coder:7b (spécialisé code)\n' +
                    '- ollama pull llama3.2:3b (léger et rapide)\n' +
                    '- ollama pull phi3:mini (très léger)');
            }
            
            // Ordre de préférence pour les modèles (même logique que l'orchestrateur)
            const preferenceOrder = [
                'qwen2.5-coder:32b', 'qwen2.5-coder:14b', 'qwen2.5-coder:7b', 'qwen2.5-coder:3b',
                'codellama:34b', 'codellama:13b', 'codellama:7b', 'codellama:7b-code',
                'deepseek-coder:33b', 'deepseek-coder:6.7b', 'deepseek-coder:1.3b',
                'llama3.1:70b', 'llama3.1:8b', 'llama3.2:3b', 'llama3.2:1b',
                'gemma2:27b', 'gemma2:9b', 'gemma2:2b', 'mistral:7b', 'phi3:14b', 'phi3:mini'
            ];
            
            // Chercher le premier modèle disponible selon l'ordre de préférence
            for (const preferredModel of preferenceOrder) {
                const found = models.find(m => 
                    m.name === preferredModel || 
                    m.name.startsWith(preferredModel.split(':')[0])
                );
                
                if (found) {
                    console.log(`Modèle auto-sélectionné: ${found.name}`);
                    return found.name;
                }
            }
            
            // Si aucun modèle préféré n'est trouvé, prendre le premier disponible
            const fallbackModel = models[0].name;
            console.log(`Aucun modèle préféré trouvé, utilisation de: ${fallbackModel}`);
            return fallbackModel;
        } catch (error) {
            throw new Error(`Détection modèle échouée: ${error}`);
        }
    }

    async chat(message: string, history: ChatMessage[]): Promise<string> {
        const config = this.getConfig();
        
        // Si pas de modèle configuré, détecter automatiquement
        let modelToUse = config.model;
        if (!modelToUse) {
            console.log('Aucun modèle spécifié, auto-sélection...');
            try {
                modelToUse = await this.getAutoSelectedModel();
            } catch (error) {
                throw error;
            }
        } else {
            // Vérifier que le modèle configuré existe
            try {
                const models = await this.getModels();
                const modelExists = models.some(m => m.name === modelToUse);
                
                if (!modelExists) {
                    console.warn(`Modèle ${modelToUse} introuvable, recherche d'une alternative...`);
                    modelToUse = await this.getAutoSelectedModel();
                }
            } catch (error) {
                console.warn('Impossible de vérifier les modèles, tentative avec le modèle configuré...');
            }
        }

        console.log(`Utilisation du modèle: ${modelToUse}`);
        
        try {
            // Construire le contexte de conversation
            let conversation = '';
            if (history.length > 1) {
                // Prendre les derniers messages (limiter pour éviter les tokens excessifs)
                const recentHistory = history.slice(-10);
                conversation = recentHistory
                    .slice(0, -1) // Exclure le dernier message (current)
                    .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
                    .join('\n\n');
                conversation += '\n\n';
            }

            const fullPrompt = conversation + `Utilisateur: ${message}\nAssistant:`;

            const response = await axios.post(`${config.serverUrl}/api/generate`, {
                model: modelToUse,
                prompt: fullPrompt,
                stream: false,
                options: this.buildRequestOptions({
                    temperature: 0.7,
                    num_predict: 1000
                }),
                no_thinking: this.isThinkingDisabled() // Ajout direct du paramètre no_thinking
            }, {
                timeout: 180000 // Augmenté pour les modèles lourds
            });

            if (response.data?.response) {
                return response.data.response.trim();
            } else {
                throw new Error('Réponse invalide d\'Ollama');
            }

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error(`Impossible de se connecter à Ollama sur ${config.serverUrl}`);
                } else if (error.response?.status === 404) {
                    throw new Error(`Modèle '${modelToUse}' introuvable`);
                } else {
                    throw new Error(`Erreur API Ollama: ${error.message}`);
                }
            } else {
                throw new Error(`Erreur inattendue: ${error}`);
            }
        }
    }

    // 🚀 NOUVELLE MÉTHODE: Chat avec streaming token par token
    async chatStream(
        message: string, 
        history: ChatMessage[],
        onToken: (token: string) => void,
        onComplete: (fullResponse: string) => void,
        onError: (error: string) => void
    ): Promise<void> {
        const config = this.getConfig();
        
        // Auto-sélection du modèle (même logique que chat())
        let modelToUse = config.model;
        if (!modelToUse) {
            console.log('Aucun modèle spécifié pour streaming, auto-sélection...');
            try {
                modelToUse = await this.getAutoSelectedModel();
            } catch (error) {
                onError(`Détection modèle échouée: ${error}`);
                return;
            }
        } else {
            try {
                const models = await this.getModels();
                const modelExists = models.some(m => m.name === modelToUse);
                
                if (!modelExists) {
                    console.warn(`Modèle ${modelToUse} introuvable pour streaming, recherche d'une alternative...`);
                    modelToUse = await this.getAutoSelectedModel();
                }
            } catch (error) {
                console.warn('Impossible de vérifier les modèles pour streaming, tentative avec le modèle configuré...');
            }
        }

        console.log(`Utilisation du modèle pour streaming: ${modelToUse}`);
        
        try {
            // Construire le contexte de conversation
            let conversation = '';
            if (history.length > 1) {
                const recentHistory = history.slice(-10);
                conversation = recentHistory
                    .slice(0, -1)
                    .map(msg => `${msg.role === 'user' ? 'Utilisateur' : 'Assistant'}: ${msg.content}`)
                    .join('\n\n');
                conversation += '\n\n';
            }

            const fullPrompt = conversation + `Utilisateur: ${message}\nAssistant:`;

            const response = await axios.post(`${config.serverUrl}/api/generate`, {
                model: modelToUse,
                prompt: fullPrompt,
                stream: true, // Activer le streaming
                options: this.buildRequestOptions({
                    temperature: 0.7,
                    num_predict: 1000
                }),
                no_thinking: this.isThinkingDisabled() // Ajout direct du paramètre no_thinking
            }, {
                timeout: 180000,
                responseType: 'stream'
            });

            let fullResponse = '';
            let buffer = ''; // Buffer pour accumuler les chunks partiels
            
            response.data.on('data', (chunk: Buffer) => {
                try {
                    // Convertir le chunk en string et l'ajouter au buffer
                    buffer += chunk.toString();
                    
                    // Séparer les lignes complètes
                    const lines = buffer.split('\n');
                    
                    // Garder la dernière ligne (potentiellement incomplète) dans le buffer
                    buffer = lines.pop() || '';
                    
                    // Traiter chaque ligne complète
                    lines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                            try {
                                const data = JSON.parse(trimmedLine);
                                
                                if (data.response) {
                                    fullResponse += data.response;
                                    onToken(data.response); // 🚀 Callback token par token
                                }
                                
                                if (data.done) {
                                    onComplete(fullResponse.trim()); // 🎯 Callback complétion
                                }
                            } catch (parseError) {
                                // Ignorer silencieusement les lignes non-JSON ou mal formées
                                // console.debug(`Ligne ignorée (non-JSON): ${trimmedLine.substring(0, 50)}...`);
                            }
                        }
                    });
                } catch (error) {
                    console.warn('Erreur traitement chunk streaming:', error);
                    // Ne pas interrompre le streaming pour une erreur de chunk
                }
            });

            response.data.on('end', () => {
                // Traiter le buffer restant s'il y en a un
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer.trim());
                        if (data.response) {
                            fullResponse += data.response;
                            onToken(data.response);
                        }
                        if (data.done) {
                            onComplete(fullResponse.trim());
                        }
                    } catch (error) {
                        // Buffer final ignoré s'il n'est pas du JSON valide
                    }
                }
                
                // S'assurer que onComplete est appelé même si pas de 'done' reçu
                if (fullResponse && !fullResponse.includes('undefined')) {
                    onComplete(fullResponse.trim());
                }
            });

            response.data.on('error', (error: any) => {
                onError(`Erreur stream: ${error.message}`);
            });

        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    onError(`Impossible de se connecter à Ollama sur ${config.serverUrl}`);
                } else if (error.response?.status === 404) {
                    onError(`Modèle '${modelToUse}' introuvable`);
                } else {
                    onError(`Erreur API Ollama: ${error.message}`);
                }
            } else {
                onError(`Erreur inattendue: ${error}`);
            }
        }
    }

    // NOUVELLE MÉTHODE: Chat streaming pour l'orchestrateur
    async chatStreamForWorker(
        prompt: string,
        onToken: (token: string) => void,
        onComplete: (fullResponse: string) => void
    ): Promise<void> {
        const config = this.getConfig();
        
        // Utiliser exactement la même logique que chat() pour éviter les erreurs 404
        let modelToUse = config.model;
        if (!modelToUse) {
            console.log('Aucun modèle spécifié pour worker, auto-sélection...');
            try {
                modelToUse = await this.getAutoSelectedModel();
            } catch (error) {
                throw new Error(`Détection modèle échouée pour worker: ${error}`);
            }
        } else {
            // Vérifier que le modèle configuré existe (même logique que chat())
            try {
                const models = await this.getModels();
                const modelExists = models.some(m => m.name === modelToUse);
                
                if (!modelExists) {
                    console.warn(`Modèle ${modelToUse} introuvable pour worker, recherche d'une alternative...`);
                    modelToUse = await this.getAutoSelectedModel();
                }
            } catch (error) {
                console.warn('Impossible de vérifier les modèles pour worker, tentative avec le modèle configuré...');
            }
        }

        console.log(`Worker utilise le modèle: ${modelToUse}`);
        
        try {
            const response = await axios.post(`${config.serverUrl}/api/generate`, {
                model: modelToUse,
                prompt: prompt,
                stream: true,
                options: this.buildRequestOptions({
                    temperature: 0.2, // Plus bas pour consistance
                    num_predict: 500,
                    num_ctx: 2048
                }),
                no_thinking: this.isThinkingDisabled() // Ajout direct du paramètre no_thinking
            }, {
                timeout: 90000,
                responseType: 'stream'
            });

            let fullResponse = '';
            let buffer = ''; // Buffer pour accumuler les chunks partiels
            
            response.data.on('data', (chunk: Buffer) => {
                try {
                    // Convertir le chunk en string et l'ajouter au buffer
                    buffer += chunk.toString();
                    
                    // Séparer les lignes complètes
                    const lines = buffer.split('\n');
                    
                    // Garder la dernière ligne (potentiellement incomplète) dans le buffer
                    buffer = lines.pop() || '';
                    
                    // Traiter chaque ligne complète
                    lines.forEach(line => {
                        const trimmedLine = line.trim();
                        if (trimmedLine) {
                            try {
                                const data = JSON.parse(trimmedLine);
                                
                                if (data.response) {
                                    fullResponse += data.response;
                                    onToken(data.response);
                                }
                                
                                if (data.done) {
                                    onComplete(fullResponse.trim());
                                }
                            } catch (parseError) {
                                // Ignorer silencieusement les erreurs de parsing JSON
                                // console.debug(`Worker chunk ignoré: ${trimmedLine.substring(0, 30)}...`);
                            }
                        }
                    });
                } catch (error) {
                    console.warn('Erreur worker streaming chunk:', error);
                    // Ne pas interrompre le streaming pour une erreur de chunk
                }
            });

            response.data.on('end', () => {
                // Traiter le buffer restant s'il y en a un
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer.trim());
                        if (data.response) {
                            fullResponse += data.response;
                            onToken(data.response);
                        }
                        if (data.done) {
                            onComplete(fullResponse.trim());
                        }
                    } catch (error) {
                        // Buffer final ignoré s'il n'est pas du JSON valide
                    }
                }
                
                // S'assurer que onComplete est appelé
                if (fullResponse) {
                    onComplete(fullResponse.trim());
                }
            });

            response.data.on('error', (error: any) => {
                console.error('Erreur worker stream:', error);
                onComplete(fullResponse || 'Erreur streaming worker');
            });

        } catch (error) {
            throw new Error(`Erreur streaming: ${error}`);
        }
    }

    async testConnection(): Promise<boolean> {
        const config = this.getConfig();
        try {
            await axios.get(`${config.serverUrl}/api/tags`, { timeout: 5000 });
            return true;
        } catch {
            return false;
        }
    }
    async getModels(): Promise<OllamaModel[]> {
        const config = this.getConfig();
        try {
            const response = await axios.get(`${config.serverUrl}/api/tags`, {
                timeout: 10000
            });
            
            return response.data?.models || [];
        } catch (error) {
            if (axios.isAxiosError(error)) {
                if (error.code === 'ECONNREFUSED') {
                    throw new Error(`Impossible de se connecter à Ollama sur ${config.serverUrl}`);
                } else {
                    throw new Error(`Erreur lors de la récupération des modèles: ${error.message}`);
                }
            } else {
                throw new Error(`Erreur inattendue: ${error}`);
            }
        }
    }
}
