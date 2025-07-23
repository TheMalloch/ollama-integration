### package.json
```json
{
  "name": "ollama-chat",
  "displayName": "Ollama Chat",
  "description": "Chat with LLMs like Ollama directly from VSCode.",
  "version": "0.1.0",
  "publisher": "your-publisher-name",
  "engines": {
    "vscode": "^1.70.0"
  },
  "activationEvents": [
    "onCommand:ollamaChat.open"
  ],
  "main": "./out/extension.js",
  "contributes": {
    "commands": [
      {
        "command": "ollamaChat.open",
        "title": "Open Ollama Chat"
      }
    ]
  },
  "scripts": {
    "vscode:prepublish": "npm run compile",
    "compile": "tsc -p ./",
    "watch": "tsc -watch -p ./",
    "postinstall": "node ./node_modules/vscode/bin/install"
  },
  "devDependencies": {
    "@types/vscode": "^1.70.0",
    "@types/node": "^18.0.0",
    "typescript": "^4.6.2",
    "vscode-test": "^1.5.0"
  }
}
```

### src/extension.ts
```typescript
import * as vscode from 'vscode';
import { OllamaChatProvider } from './ollamaChatProvider';

export function activate(context: vscode.ExtensionContext) {
  const provider = new OllamaChatProvider(context);
  context.subscriptions.push(
    vscode.commands.registerCommand('ollamaChat.open', () => provider.show())
  );
}

export function deactivate() {}
```

### src/ollamaChatProvider.ts
```typescript
import * as vscode from 'vscode';
import { WebviewPanel, WebviewOptions, Uri } from 'vscode';

export class OllamaChatProvider {
  private panel: WebviewPanel | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  public show() {
    if (this.panel) {
      this.panel.reveal();
      return;
    }

    const column = vscode.window.activeTextEditor ? vscode.ViewColumn.Beside : vscode.ViewColumn.One;
    this.panel = vscode.window.createWebviewPanel(
      'ollamaChat',
      'Ollama Chat',
      column,
      {
        enableScripts: true,
        localResourceRoots: [Uri.joinPath(this.context.extensionUri, 'out')]
      }
    );

    this.panel.onDidDispose(() => {
      this.panel = undefined;
    });

    this.panel.webview.html = this.getWebviewContent();
  }

  private getWebviewContent() {
    const scriptUri = this.panel!.webview.asWebviewUri(Uri.joinPath(this.context.extensionUri, 'out', 'ollamaChat.js'));
    return `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Ollama Chat</title>
        </head>
        <body>
          <div id="app"></div>
          <script src="${scriptUri}"></script>
        </body>
      </html>
    `;
  }
}
```

### out/ollamaChat.js
```javascript
document.addEventListener('DOMContentLoaded', () => {
  const app = document.getElementById('app');
  const chatInput = document.createElement('input');
  const sendButton = document.createElement('button');
  sendButton.textContent = 'Send';
  app.appendChild(chatInput);
  app.appendChild(sendButton);

  let messages = [];

  sendButton.addEventListener('click', async () => {
    const message = chatInput.value.trim();
    if (message) {
      appendMessage('user', message);
      chatInput.value = '';

      try {
        const response = await fetch('/api/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: message })
        });

        if (!response.ok) {
          throw new Error('API request failed');
        }

        const data = await response.json();
        appendMessage('assistant', data.text);
      } catch (error) {
        console.error(error);
        appendMessage('error', 'Failed to get response from Ollama');
      }
    }
  });

  function appendMessage(sender, text) {
    const messageElement = document.createElement('div');
    messageElement.className = `message ${sender}`;
    messageElement.textContent = text;
    app.appendChild(messageElement);
  }
});
```

### out/ollamaChat.css
```css
body {
  font-family: Arial, sans-serif;
}

.message {
  margin: 10px 0;
}

.user {
  color: #3498db;
}

.assistant {
  color: #2ecc71;
}

.error {
  color: #e74c3c;
}
```

# Ollama Integration Extension

Extension VS Code avancée pour l'intégration intelligente avec Ollama et autres LLMs. Cette extension offre une analyse contextuelle approfondie du code et une interaction intelligente avec les modèles de langage.

## ✨ Fonctionnalités Principales

### 🧠 Analyse Contextuelle Intelligente
- **Analyse des dépendances** : Détection et analyse automatique des imports locaux
- **Compréhension du projet** : Reconnaissance des frameworks et types de projets
- **Structure du codebase** : Analyse de l'architecture et des patterns utilisés
- **Messages compressibles** : Réduction/expansion des réponses longues

### 💾 Système de Sauvegarde Contextuelle
- **Stockage persistant** : Le contexte analysé est automatiquement sauvegardé
- **Structure réutilisable** : Données formatées pour être utilisées par d'autres LLMs
- **Historique intelligent** : Conservation des analyses précédentes pour améliorer les futures interactions
- **Export/Import** : Possibilité d'exporter le contexte pour d'autres outils

### 🎯 Réponses Structurées et Adaptées
- **Format intelligent** : Les réponses sont formatées selon le type de contenu (code, documentation, analyse)
- **Limite adaptative** : La taille des réponses s'adapte à la complexité du codebase
- **Présentation code** : Mise en forme optimisée pour les extraits de code
- **Validation contextuelle** : Vérification que les réponses correspondent au contexte du projet

### 🔍 Compréhension Avancée des Projets
- **Détection de framework** : Reconnaissance automatique des frameworks utilisés (React, Vue, Angular, etc.)
- **Type de projet** : Identification du type d'application (web, desktop, mobile, library, etc.)
- **Patterns architecturaux** : Détection des patterns (MVC, MVP, hexagonal, etc.)
- **Recommandations ciblées** : Conseils adaptés au type de projet détecté

### 🤖 Génération de ModelFiles Spécialisés
- **LLM spécialisé** : Utilisation d'un modèle léger pour générer des ModelFiles Ollama personnalisés
- **Context-aware** : ModelFiles générés en fonction du contexte du projet
- **Prompts stricts** : Création de prompts spécialisés pour des réponses plus précises
- **Templates adaptatifs** : Génération de templates selon le framework détecté

## 🚀 Installation

1. Ouvrez VS Code
2. Allez dans les Extensions (`Ctrl+Shift+X`)
3. Recherchez "Ollama Integration"
4. Cliquez sur "Installer"

## 📖 Utilisation

### Analyse Rapide
1. Ouvrez un fichier de code
2. Sélectionnez du code (optionnel)
3. Utilisez `Ctrl+Shift+P` → "Ollama: Send to Chat"
4. Choisissez votre type d'analyse

### Configuration Avancée
- **Mode Smart** : Analyse complète avec dépendances (`ollama.useFullContext: true`)
- **Mode Basic** : Analyse simple du code sélectionné (`ollama.useFullContext: false`)
- **Prévisualisation** : Voir le message avant envoi (`ollama.showPreviewBeforeSending: true`)

## 🏗️ Architecture Modulaire

Pour maintenir une base de code propre, l'extension est organisée en modules :

```
src/
├── extension.ts           # Point d'entrée principal
├── core/
│   ├── analysis/         # Moteur d'analyse du code
│   ├── context/          # Gestion du contexte et sauvegarde
│   ├── llm/             # Intégration LLM et ModelFile
│   └── project/         # Détection de projet et framework
├── providers/
│   ├── chatProvider.ts   # Interface de chat
│   └── webview/         # Composants webview
└── utils/
    ├── fileUtils.ts     # Utilitaires fichiers
    └── projectDetector.ts # Détection de projets
```

## 🔧 Fonctionnalités Techniques

### Stockage Contextuel
```typescript
interface ProjectContext {
  metadata: ProjectMetadata;
  dependencies: DependencyGraph;
  structure: CodeStructure;
  frameworks: FrameworkInfo[];
  modelFiles: GeneratedModelFiles;
  history: AnalysisHistory[];
}
```

### Détection de Projet
- **Framework detection** : Analyse des `package.json`, `composer.json`, `requirements.txt`, etc.
- **Project patterns** : Reconnaissance des structures de dossiers typiques
- **Technology stack** : Identification des technologies utilisées
- **Code patterns** : Analyse des patterns de code utilisés

### Génération ModelFile
```ollama
# Exemple de ModelFile généré pour un projet React
FROM llama3.2:1b

PARAMETER temperature 0.3
PARAMETER top_p 0.9

SYSTEM """
Tu es un expert React/TypeScript spécialisé dans ce projet.
Context: Application React avec TypeScript, utilisant Hooks et Context API.
Framework: React 18.x avec Vite
Patterns détectés: Component composition, Custom hooks, State management local

Réponds uniquement avec du code React/TypeScript valide et des explications concises.
Utilise les patterns détectés dans le projet.
"""
```

## ⚙️ Configuration

### Paramètres Principaux
```json
{
  "ollama.useFullContext": true,
  "ollama.showPreviewBeforeSending": false,
  "ollama.contextStorage.enabled": true,
  "ollama.contextStorage.path": "./ollama-context",
  "ollama.projectDetection.enabled": true,
  "ollama.modelFile.autoGenerate": true,
  "ollama.response.maxTokens": "adaptive",
  "ollama.response.format": "structured"
}
```

### Sauvegarde Contextuelle
- **Emplacement** : `.ollama-context/` dans le workspace
- **Format** : JSON structuré avec métadonnées
- **Compression** : Compression automatique des gros contextes
- **Versioning** : Suivi des versions du contexte

## 🎯 Roadmap

### Phase 1 - Architecture (En cours)
- [x] Analyse contextuelle de base
- [x] Interface chat avec compression
- [ ] Modularisation du code
- [ ] Système de sauvegarde contextuelle

### Phase 2 - Intelligence (Prochaine)
- [ ] Détection avancée de frameworks
- [ ] Génération de ModelFiles spécialisés
- [ ] Réponses structurées et adaptatives
- [ ] Cache intelligent du contexte

### Phase 3 - Optimisation
- [ ] Performance et scalabilité
- [ ] Support multi-LLM
- [ ] Intégration CI/CD
- [ ] Plugins tiers

## 🤝 Contribution

1. Fork le projet
2. Créez une branche pour votre fonctionnalité
3. Committez vos changements
4. Poussez vers la branche
5. Ouvrez une Pull Request

## 📝 Notes Techniques

### Gestion de la Complexité
- **Limite adaptive** : La taille des réponses s'adapte automatiquement à la taille du codebase
- **Context chunking** : Division intelligente du contexte pour les gros projets
- **Selective analysis** : Analyse ciblée selon le type de requête

### Performance
- **Lazy loading** : Chargement à la demande des dépendances
- **Cache stratégique** : Mise en cache des analyses fréquentes
- **Background processing** : Traitement en arrière-plan pour les analyses lourdes
