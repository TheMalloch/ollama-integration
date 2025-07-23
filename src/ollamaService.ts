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
            model: config.get('model', 'codellama:7b') // Valeur par défaut
        };
    }

    async chat(message: string, history: ChatMessage[]): Promise<string> {
        const config = this.getConfig();
        
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
                model: config.model,
                prompt: fullPrompt,
                stream: false,
                options: {
                    temperature: 0.7,
                    num_predict: 1000
                }
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
                    throw new Error(`Modèle '${config.model}' introuvable`);
                } else {
                    throw new Error(`Erreur API Ollama: ${error.message}`);
                }
            } else {
                throw new Error(`Erreur inattendue: ${error}`);
            }
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
