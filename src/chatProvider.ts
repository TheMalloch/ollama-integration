import * as vscode from 'vscode';
import { OllamaService } from './ollamaService';

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export class OllamaChatViewProvider implements vscode.WebviewViewProvider {
    private webview?: vscode.Webview;
    private messages: ChatMessage[] = [];

    constructor(
        private readonly context: vscode.ExtensionContext,
        private readonly ollamaService: OllamaService
    ) {}

    public resolveWebviewView(
        webviewView: vscode.WebviewView,
        context: vscode.WebviewViewResolveContext,
        token: vscode.CancellationToken
    ): void {
        this.webview = webviewView.webview;

        webviewView.webview.options = {
            enableScripts: true,
            localResourceRoots: [this.context.extensionUri]
        };

        webviewView.webview.html = this.getWebviewContent();
        this.setupMessageHandling();
        
        // Restaurer les messages existants et charger les modèles
        this.refreshMessages();
        this.loadAvailableModels();
    }

    private setupMessageHandling(): void {
        this.webview!.onDidReceiveMessage(async (message) => {
            switch (message.type) {
                case 'sendMessage':
                    await this.processUserMessage(message.text);
                    break;
                case 'clearChat':
                    this.clearChat();
                    break;
                case 'changeModel':
                    await this.handleModelChange(message.model);
                    break;
                case 'getModels':
                    await this.loadAvailableModels();
                    break;
                case 'getContextSetting':
                    await this.handleGetContextSetting();
                    break;
                case 'setContextSetting':
                    await this.handleSetContextSetting(message.enabled);
                    break;
            }
        });
    }
    
    public updateContextSetting(enabled: boolean): void {
        if (this.webview) {
            this.webview.postMessage({
                type: 'updateContextSetting',
                enabled: enabled
            });
        }
    }
    private async handleGetContextSetting(): Promise<void> {
        const config = vscode.workspace.getConfiguration('ollama');
        const useFullContext = config.get('useFullContext', true);
        
        this.webview!.postMessage({
            type: 'updateContextSetting',
            enabled: useFullContext
        });
    }

    private async handleSetContextSetting(enabled: boolean): Promise<void> {
        const config = vscode.workspace.getConfiguration('ollama');
        await config.update('useFullContext', enabled, vscode.ConfigurationTarget.Global);
    }


    public addUserMessage(message: string): void {
        if (this.webview) {
            const userMsg: ChatMessage = {
                role: 'user',
                content: message,
                timestamp: new Date().toISOString()
            };
            
            this.messages.push(userMsg);
            this.sendMessageToWebview(userMsg);
            
            // Traiter le message normalement
            this.processUserMessage(message);
        }
    }

    private async processUserMessage(userMessage: string): Promise<void> {
        try {
            // Afficher l'état de chargement
            this.webview!.postMessage({ type: 'setLoading', loading: true });

            // Obtenir la réponse d'Ollama
            const response = await this.ollamaService.chat(userMessage, this.messages);
            
            // Ajouter la réponse
            const assistantMsg: ChatMessage = {
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString()
            };
            this.messages.push(assistantMsg);
            this.sendMessageToWebview(assistantMsg);

        } catch (error) {
            const errorMsg: ChatMessage = {
                role: 'assistant',
                content: `Erreur: ${error}`,
                timestamp: new Date().toISOString()
            };
            this.messages.push(errorMsg);
            this.sendMessageToWebview(errorMsg);
            
            vscode.window.showErrorMessage(`Erreur Ollama: ${error}`);
        } finally {
            this.webview!.postMessage({ type: 'setLoading', loading: false });
        }
    }

    private sendMessageToWebview(message: ChatMessage): void {
        this.webview!.postMessage({
            type: 'addMessage',
            message: message
        });
    }

    private refreshMessages(): void {
        this.webview!.postMessage({
            type: 'refreshMessages',
            messages: this.messages
        });
    }

    public clearChat(): void {
        this.messages = [];
        this.webview!.postMessage({ type: 'clearMessages' });
    }

    private async handleModelChange(model: string): Promise<void> {
        // Sauvegarder le modèle sélectionné dans la configuration
        const config = vscode.workspace.getConfiguration('ollama');
        await config.update('model', model, vscode.ConfigurationTarget.Global);
        
        // Notifier l'utilisateur
        vscode.window.showInformationMessage(`Modèle changé vers: ${model}`);
    }

    private async loadAvailableModels(): Promise<void> {
        try {
            const models = await this.ollamaService.getModels();
            const currentModel = vscode.workspace.getConfiguration('ollama').get('model');
            
            // Si aucun modèle configuré, prendre le premier disponible
            let selectedModel = currentModel;
            if (!selectedModel && models.length > 0) {
                selectedModel = models[0].name;
                await vscode.workspace.getConfiguration('ollama').update('model', selectedModel, vscode.ConfigurationTarget.Global);
            }
            
            this.webview!.postMessage({
                type: 'updateModels',
                models: models.map(m => m.name),
                currentModel: selectedModel
            });
        } catch (error) {
            console.error('Erreur lors du chargement des modèles:', error);
        }
    }

    private getWebviewContent(): string {
        return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Ollama Chat</title>
            <!-- Marked.js pour le rendu Markdown -->
            <script src="https://cdn.jsdelivr.net/npm/marked@9.1.2/marked.min.js"></script>
            <!-- Highlight.js pour la coloration syntaxique -->
            <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/vs2015.min.css">
            <script src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js"></script>
            <style>
                :root {
                    --vscode-font-family: var(--vscode-font-family);
                    --vscode-font-size: var(--vscode-font-size);
                }
                
                * {
                    margin: 0;
                    padding: 0;
                    box-sizing: border-box;
                }
                
                body {
                    font-family: var(--vscode-font-family);
                    font-size: var(--vscode-font-size);
                    background-color: var(--vscode-sideBar-background);
                    color: var(--vscode-sideBar-foreground);
                    height: 100vh;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                }
                
                .chat-container {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    padding: 8px;
                    gap: 8px;
                    height: 100%;
                    overflow: hidden;
                }

                .chat-header {
                    border-bottom: 1px solid var(--vscode-panel-border);
                    padding-bottom: 8px;
                    margin-bottom: 8px;
                    flex-shrink: 0;
                }

                .model-selector {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-bottom: 4px;
                }

                .model-selector label {
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .model-select {
                    flex: 1;
                    padding: 4px 8px;
                    background-color: var(--vscode-dropdown-background);
                    color: var(--vscode-dropdown-foreground);
                    border: 1px solid var(--vscode-dropdown-border);
                    border-radius: 3px;
                    font-size: 12px;
                }
                
                .messages-wrapper {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    overflow: hidden;
                    position: relative;
                    min-height: 0;
                }
                
                .messages {
                    flex: 1;
                    overflow-y: auto;
                    padding: 4px 8px 4px 4px;
                    display: flex;
                    flex-direction: column;
                    gap: 12px;
                    scroll-behavior: smooth;
                    position: relative;
                }

                /* Scrollbar progressive - s'épaissit avec le contenu */
                .messages::-webkit-scrollbar {
                    width: 4px;
                    transition: width 0.3s ease;
                }

                .messages:hover::-webkit-scrollbar {
                    width: 12px;
                }
                
                .messages::-webkit-scrollbar-track {
                    background: transparent;
                    border-radius: 6px;
                    margin: 4px 0;
                }

                .messages:hover::-webkit-scrollbar-track {
                    background: var(--vscode-scrollbarSlider-background);
                }
                
                .messages::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-background);
                    border-radius: 6px;
                    border: 1px solid var(--vscode-sideBar-background);
                    min-height: 20px;
                }

                .messages:hover::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-activeBackground);
                    border: 2px solid var(--vscode-sideBar-background);
                }
                
                .messages::-webkit-scrollbar-thumb:hover {
                    background: var(--vscode-scrollbarSlider-hoverBackground);
                }

                /* Indicateur de position dans le scroll */
                .scroll-indicator {
                    position: absolute;
                    top: 8px;
                    right: 16px;
                    background: var(--vscode-badge-background);
                    color: var(--vscode-badge-foreground);
                    padding: 2px 6px;
                    border-radius: 10px;
                    font-size: 10px;
                    opacity: 0;
                    transition: opacity 0.3s ease;
                    pointer-events: none;
                    z-index: 10;
                    cursor: pointer;
                }

                .scroll-indicator.show {
                    opacity: 0.8;
                    pointer-events: auto;
                }

                .scroll-indicator:hover {
                    opacity: 1;
                }
                
                .message {
                    padding: 8px 12px;
                    border-radius: 8px;
                    max-width: 100%;
                    word-wrap: break-word;
                    font-size: 13px;
                    line-height: 1.4;
                }
                
                .message.user {
                    background-color: var(--vscode-inputOption-activeBorder);
                    color: var(--vscode-input-foreground);
                    align-self: flex-end;
                    max-width: 85%;
                }
                
                .message.assistant {
                    background-color: var(--vscode-textCodeBlock-background);
                    color: var(--vscode-editor-foreground);
                    align-self: flex-start;
                    max-width: 95%;
                    border: 1px solid var(--vscode-panel-border);
                }
                
                .message-content {
                    white-space: pre-wrap;
                }

                /* Styles pour le contenu Markdown */
                .message-content h1, .message-content h2, .message-content h3 {
                    margin: 8px 0 4px 0;
                    color: var(--vscode-editor-foreground);
                }

                .message-content h1 { font-size: 1.3em; }
                .message-content h2 { font-size: 1.2em; }
                .message-content h3 { font-size: 1.1em; }

                .message-content p {
                    margin: 4px 0;
                }

                .message-content ul, .message-content ol {
                    margin: 4px 0 4px 20px;
                }

                .message-content li {
                    margin: 2px 0;
                }

                .message-content code {
                    background-color: var(--vscode-textCodeBlock-background);
                    padding: 2px 4px;
                    border-radius: 3px;
                    font-family: var(--vscode-editor-font-family);
                    font-size: 0.9em;
                }

                .message-content pre {
                    background-color: var(--vscode-textCodeBlock-background);
                    border: 1px solid var(--vscode-panel-border);
                    border-radius: 4px;
                    padding: 8px;
                    margin: 8px 0;
                    overflow-x: auto;
                    font-family: var(--vscode-editor-font-family);
                }

                .message-content pre code {
                    background: none;
                    padding: 0;
                }

                .message-content blockquote {
                    border-left: 3px solid var(--vscode-textBlockQuote-border);
                    background-color: var(--vscode-textBlockQuote-background);
                    padding: 8px 12px;
                    margin: 8px 0;
                    font-style: italic;
                }

                .message-content table {
                    border-collapse: collapse;
                    margin: 8px 0;
                    width: 100%;
                }

                .message-content th, .message-content td {
                    border: 1px solid var(--vscode-panel-border);
                    padding: 4px 8px;
                    text-align: left;
                }

                .message-content th {
                    background-color: var(--vscode-textCodeBlock-background);
                    font-weight: bold;
                }
                
                .message-time {
                    font-size: 10px;
                    opacity: 0.7;
                    margin-top: 4px;
                }

                /* Bouton toggle pour réduire/étendre les messages */
                .message-toggle {
                    background: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: 1px solid var(--vscode-button-border, transparent);
                    padding: 4px 8px;
                    font-size: 11px;
                    border-radius: 3px;
                    cursor: pointer;
                    margin-top: 8px;
                    margin-bottom: 4px;
                    display: block;
                    width: fit-content;
                    transition: all 0.2s ease;
                }
                
                .message-toggle:hover {
                    background: var(--vscode-button-hoverBackground);
                    transform: translateY(-1px);
                }
                
                /* Message réduit */
                .message.collapsed .message-content {
                    max-height: 80px;
                    overflow: hidden;
                    position: relative;
                    margin-bottom: 8px;
                }
                
                .message.collapsed .message-content::after {
                    content: '';
                    position: absolute;
                    bottom: 0;
                    left: 0;
                    right: 0;
                    height: 30px;
                    background: linear-gradient(transparent, var(--vscode-editor-background));
                    pointer-events: none;
                }

                /* Style spécial pour les messages longs */
                .message.long-message {
                    border-left: 3px solid var(--vscode-charts-blue);
                }

                .message.long-message .message-toggle {
                    background: var(--vscode-charts-blue);
                }

                .loading {
                    text-align: center;
                    padding: 8px;
                    font-style: italic;
                    color: var(--vscode-descriptionForeground);
                    display: none;
                    flex-shrink: 0;
                }
                
                .loading.show {
                    display: block;
                }
                
                .input-container {
                    border-top: 1px solid var(--vscode-panel-border);
                    padding: 8px 0 0 0;
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                    flex-shrink: 0;
                    position: sticky;
                    bottom: 0;
                    background-color: var(--vscode-sideBar-background);
                    backdrop-filter: blur(8px);
                    z-index: 5;
                }

                /* Ombre pour séparer visuellement l'input du chat */
                .input-container::before {
                    content: '';
                    position: absolute;
                    top: -8px;
                    left: 0;
                    right: 0;
                    height: 8px;
                    background: linear-gradient(
                        to bottom, 
                        transparent, 
                        var(--vscode-sideBar-background)
                    );
                    pointer-events: none;
                }
                
                .input-row {
                    display: flex;
                    gap: 4px;
                    align-items: flex-end;
                }
                
                .message-input {
                    flex: 1;
                    padding: 8px;
                    border: 1px solid var(--vscode-input-border);
                    background-color: var(--vscode-input-background);
                    color: var(--vscode-input-foreground);
                    border-radius: 4px;
                    resize: none;
                    min-height: 34px;
                    max-height: 120px;
                    font-family: inherit;
                    font-size: inherit;
                    overflow-y: auto;
                    line-height: 1.4;
                }

                /* Scrollbar pour le textarea quand il devient trop grand */
                .message-input::-webkit-scrollbar {
                    width: 6px;
                }
                
                .message-input::-webkit-scrollbar-track {
                    background: var(--vscode-input-background);
                }
                
                .message-input::-webkit-scrollbar-thumb {
                    background: var(--vscode-scrollbarSlider-background);
                    border-radius: 3px;
                }
                
                .send-button {
                    padding: 8px 12px;
                    background-color: var(--vscode-button-background);
                    color: var(--vscode-button-foreground);
                    border: none;
                    border-radius: 4px;
                    cursor: pointer;
                    font-size: 13px;
                    white-space: nowrap;
                    align-self: flex-end;
                    min-height: 34px;
                }
                
                .send-button:hover {
                    background-color: var(--vscode-button-hoverBackground);
                }
                
                .send-button:disabled {
                    opacity: 0.5;
                    cursor: not-allowed;
                }
                
                .clear-button {
                    padding: 4px 8px;
                    background-color: var(--vscode-button-secondaryBackground);
                    color: var(--vscode-button-secondaryForeground);
                    border: 1px solid var(--vscode-button-border);
                    border-radius: 3px;
                    cursor: pointer;
                    font-size: 11px;
                    align-self: flex-start;
                }
                
                .clear-button:hover {
                    background-color: var(--vscode-button-secondaryHoverBackground);
                }

                .input-hint {
                    font-size: 10px;
                    color: var(--vscode-descriptionForeground);
                    opacity: 0.8;
                    text-align: center;
                }
                .context-toggle {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    margin-top: 8px;
                }

                .toggle-container {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    cursor: pointer;
                    font-size: 12px;
                    color: var(--vscode-descriptionForeground);
                }

                .toggle-container input[type="checkbox"] {
                    display: none;
                }

                .toggle-slider {
                    position: relative;
                    width: 32px;
                    height: 18px;
                    background-color: var(--vscode-input-background);
                    border: 1px solid var(--vscode-input-border);
                    border-radius: 9px;
                    transition: all 0.3s ease;
                }

                .toggle-slider::before {
                    content: '';
                    position: absolute;
                    width: 14px;
                    height: 14px;
                    border-radius: 50%;
                    background-color: var(--vscode-input-foreground);
                    top: 1px;
                    left: 1px;
                    transition: transform 0.3s ease;
                }

                .toggle-container input[type="checkbox"]:checked + .toggle-slider {
                    background-color: var(--vscode-button-background);
                    border-color: var(--vscode-button-background);
                }

                .toggle-container input[type="checkbox"]:checked + .toggle-slider::before {
                    transform: translateX(14px);
                    background-color: var(--vscode-button-foreground);
                }

                .toggle-label {
                    user-select: none;
                }

                /* Animation pour les nouveaux messages */
                .message.new {
                    animation: slideInFade 0.3s ease-out;
                }

                @keyframes slideInFade {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                /* Styles pour highlight.js */
                .hljs {
                    background: var(--vscode-textCodeBlock-background) !important;
                    color: var(--vscode-editor-foreground) !important;
                }
            </style>
        </head>
        <body>
            <div class="chat-container">
                <div class="chat-header">
                    <div class="model-selector">
                        <label for="modelSelect">Modèle:</label>
                        <select class="model-select" id="modelSelect">
                            <!-- Modèles chargés dynamiquement -->
                        </select>
                    </div>                    
                    <div class="context-toggle">
                        <label class="toggle-container">
                            <input type="checkbox" id="contextToggle" checked>
                            <span class="toggle-slider"></span>
                            <span class="toggle-label">Contexte complet</span>
                        </label>
                    </div>
                </div>


                <div class="messages-wrapper">
                    <div class="scroll-indicator" id="scrollIndicator">
                        ↓ Nouveaux messages
                    </div>
                    <div class="messages" id="messages"></div>
                </div>
                
                <div class="loading" id="loading">Ollama réfléchit...</div>
                
                <div class="input-container">
                    <button class="clear-button" id="clearButton">Effacer le chat</button>
                    <div class="input-row">
                        <textarea class="message-input" id="messageInput" placeholder="Demandez quelque chose à Ollama..." rows="1"></textarea>
                        <button class="send-button" id="sendButton">Envoyer</button>
                    </div>
                    <div class="input-hint">Appuyez sur Entrée pour envoyer, Shift+Entrée pour nouvelle ligne</div>
                </div>
            </div>

            <script>
                const vscode = acquireVsCodeApi();
                const messagesContainer = document.getElementById('messages');
                const messageInput = document.getElementById('messageInput');
                const sendButton = document.getElementById('sendButton');
                const clearButton = document.getElementById('clearButton');
                const loading = document.getElementById('loading');
                const modelSelect = document.getElementById('modelSelect');
                const scrollIndicator = document.getElementById('scrollIndicator');

                let isUserScrolling = false;
                let scrollTimeout;

                // Configuration Markdown
                marked.setOptions({
                    highlight: function(code, lang) {
                        if (lang && hljs.getLanguage(lang)) {
                            try { return hljs.highlight(code, { language: lang }).value; } 
                            catch (err) {}
                        }
                        return hljs.highlightAuto(code).value;
                    },
                    breaks: true, 
                    gfm: true
                });

                // Gestion du scroll intelligent
                messagesContainer.addEventListener('scroll', function() {
                    const { scrollTop, scrollHeight, clientHeight } = this;
                    const isAtBottom = scrollHeight - scrollTop <= clientHeight + 50;
                    
                    // Marquer que l'utilisateur scrolle manuellement
                    if (!isAtBottom) {
                        isUserScrolling = true;
                        showScrollIndicator();
                    } else {
                        isUserScrolling = false;
                        hideScrollIndicator();
                    }

                    // Auto-hide de l'indicateur après 3 secondes
                    clearTimeout(scrollTimeout);
                    scrollTimeout = setTimeout(() => {
                        if (!isUserScrolling) hideScrollIndicator();
                    }, 3000);
                });

                function showScrollIndicator() {
                    scrollIndicator.classList.add('show');
                }

                function hideScrollIndicator() {
                    scrollIndicator.classList.remove('show');
                }

                function scrollToBottom(smooth = true) {
                    if (smooth && !isUserScrolling) {
                        messagesContainer.scrollTo({
                            top: messagesContainer.scrollHeight,
                            behavior: 'smooth'
                        });
                    } else if (!smooth) {
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }
                }

                // Clic sur l'indicateur pour aller en bas
                scrollIndicator.addEventListener('click', () => {
                    isUserScrolling = false;
                    scrollToBottom(true);
                    hideScrollIndicator();
                });

                vscode.postMessage({ type: 'getModels' });

                // Auto-resize textarea avec limitation intelligente
                messageInput.addEventListener('input', function() {
                    // Reset height to auto to get the correct scrollHeight
                    this.style.height = 'auto';
                    
                    // Calculate new height
                    const newHeight = Math.min(this.scrollHeight, 120); // Max 120px
                    this.style.height = newHeight + 'px';
                    
                    // Ensure input stays visible by scrolling if needed
                    this.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
                });

                modelSelect.addEventListener('change', function() {
                    vscode.postMessage({ type: 'changeModel', model: this.value });
                });
                const contextToggle = document.getElementById('contextToggle');
                // Synchroniser avec la configuration
                vscode.postMessage({ type: 'getContextSetting' });

                contextToggle.addEventListener('change', function() {
                    vscode.postMessage({ 
                        type: 'setContextSetting', 
                        enabled: this.checked 
                    });
                });

                function sendMessage() {
                    const message = messageInput.value.trim();
                    if (message) {
                        vscode.postMessage({ type: 'sendMessage', text: message });
                        messageInput.value = '';
                        messageInput.style.height = 'auto';
                        
                        // S'assurer qu'on scrolle en bas après l'envoi
                        isUserScrolling = false;
                        setTimeout(() => scrollToBottom(true), 100);
                    }
                }

                sendButton.addEventListener('click', sendMessage);
                
                messageInput.addEventListener('keydown', (e) => {
                    if (e.key === 'Enter') {
                        if (e.shiftKey) return;
                        else { 
                            e.preventDefault(); 
                            sendMessage(); 
                        }
                    }
                });

                clearButton.addEventListener('click', () => {
                    vscode.postMessage({ type: 'clearChat' });
                    isUserScrolling = false;
                    hideScrollIndicator();
                });

                window.addEventListener('message', event => {
                    const message = event.data;
                    switch (message.type) {
                        case 'addMessage': addMessage(message.message); break;
                        case 'refreshMessages': refreshMessages(message.messages); break;
                        case 'clearMessages': 
                            messagesContainer.innerHTML = ''; 
                            isUserScrolling = false;
                            hideScrollIndicator();
                            break;
                        case 'setLoading': setLoading(message.loading); break;
                        case 'updateModels': updateModelSelect(message.models, message.currentModel); break;
                        case 'updateContextSetting':
                            contextToggle.checked = message.enabled;
                            break;
                    }
                });

                function addMessage(msg) {
                    const messageDiv = document.createElement('div');
                    let messageClass = 'message ' + msg.role + ' new';
                    
                    // Détecter si c'est un message long (plus de 300 caractères)
                    const isLongMessage = msg.content.length > 300;
                    if (isLongMessage) {
                        messageClass += ' long-message';
                    }
                    
                    messageDiv.className = messageClass;
                    
                    const contentDiv = document.createElement('div');
                    contentDiv.className = 'message-content';
                    
                    if (msg.role === 'assistant') {
                        contentDiv.innerHTML = marked.parse(msg.content);
                        contentDiv.querySelectorAll('pre code').forEach(block => {
                            hljs.highlightElement(block);
                        });
                    } else {
                        contentDiv.textContent = msg.content;
                    }
                    
                    const timeDiv = document.createElement('div');
                    timeDiv.className = 'message-time';
                    timeDiv.textContent = new Date(msg.timestamp).toLocaleTimeString();
                    
                    messageDiv.appendChild(contentDiv);
                    messageDiv.appendChild(timeDiv);
                    
                    // Ajouter le bouton de réduction/expansion pour les messages longs (en bas)
                    if (isLongMessage) {
                        const toggleButton = document.createElement('button');
                        toggleButton.className = 'message-toggle';
                        toggleButton.textContent = 'Réduire';
                        toggleButton.onclick = function() {
                            if (messageDiv.classList.contains('collapsed')) {
                                messageDiv.classList.remove('collapsed');
                                toggleButton.textContent = 'Réduire';
                            } else {
                                messageDiv.classList.add('collapsed');
                                toggleButton.textContent = 'Étendre';
                            }
                        };
                        messageDiv.appendChild(toggleButton);
                    }
                    
                    messagesContainer.appendChild(messageDiv);
                    
                    // Scroll automatique seulement si l'utilisateur n'est pas en train de scroller
                    setTimeout(() => {
                        if (!isUserScrolling) {
                            scrollToBottom(true);
                        } else {
                            showScrollIndicator();
                        }
                        
                        // Retirer la classe animation après l'animation
                        messageDiv.classList.remove('new');
                    }, 100);
                }

                function refreshMessages(messages) {
                    messagesContainer.innerHTML = '';
                    messages.forEach(msg => addMessage(msg));
                    // Aller en bas après le refresh
                    setTimeout(() => scrollToBottom(false), 100);
                }

                function setLoading(isLoading) {
                    if (isLoading) {
                        loading.classList.add('show');
                        sendButton.disabled = true;
                    } else {
                        loading.classList.remove('show');
                        sendButton.disabled = false;
                    }
                }

                function updateModelSelect(models, currentModel) {
                    modelSelect.innerHTML = '';
                    models.forEach(model => {
                        const option = document.createElement('option');
                        option.value = model;
                        option.textContent = model;
                        if (model === currentModel) option.selected = true;
                        modelSelect.appendChild(option);
                    });
                }
            </script>
        </body>
        </html>`;
    }
}