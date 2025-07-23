# 🦙 Ollama Integration - Extension VS Code

Extension VS Code pour intégrer Ollama avec interface chat dans la barre latérale et fonctionnalités avancées d'analyse de code contextuelle.

## ✨ Fonctionnalités Actuelles

### 💬 Interface Chat Intégrée
- **Chat dans la sidebar** : Interface de chat directement dans la barre latérale VS Code
- **Messages avec boutons réduire** : Comme demandé - "fais en sorte que le bouton réduire soit en bas du message et que la réponse elle même est un bouton réduire"
- **Support Markdown** : Rendu complet avec coloration syntaxique
- **Sélection de modèles** : Changement dynamique des modèles Ollama
- **Historique persistant** : Conservation des conversations

### 🎯 Envoi de Code Intelligent
- **Mode Basique** : Envoi simple du code sélectionné
- **Mode Contexte Complet** : Analyse avancée avec imports et dépendances
- **Menu contextuel** : Clic droit pour "Envoyer vers Ollama"
- **Prévisualisation** : Option pour voir le message avant envoi

### 🔍 Analyse Contextuelle Avancée
- **Analyse des imports** : Détection automatique des dépendances locales et externes
- **Suivi des dépendances** : Graphe complet des relations entre fichiers
- **Analyse de structure** : Compréhension de l'architecture du projet
- **Code pertinent** : Inclusion intelligente du code lié au contexte

## 🚀 Fonctionnalités Discutées (Roadmap)

### 💾 Système de Contexte Persistant
Comme mentionné : **"ajoute au readme que le contexte obtenu doit être stocké et structuré pour premièrement servir de 'sauvegarde' mais aussi pour être utilisé par d'autres LLM"**

- **Sauvegarde du contexte** : Stockage automatique dans `.ollama-context/`
- **Structure pour multi-LLM** : Format compatible OpenAI, Anthropic, etc.
- **Backup intelligent** : Préservation de l'analyse entre sessions
- **Export/Import** : Réutilisation du contexte avec d'autres outils

### 🔧 Architecture Modulaire
Demandée car **"le fichier devient trop long"** :

```
src/
├── extension.ts           # Point d'entrée principal (version actuelle)
├── chatProvider.ts        # Interface chat
├── ollamaService.ts       # Service API Ollama
└── Modules planifiés:
    ├── core/analysis/     # Moteur d'analyse du code
    ├── core/context/      # Gestion contexte et sauvegarde
    ├── utils/             # Utilitaires et détection projet
```

### 🤖 Génération ModelFile Spécialisé
- **ModelFile automatique** : Génération basée sur l'analyse du projet
- **Prompts spécialisés** : Adaptés au framework détecté
- **Templates contextuels** : Personnalisés selon l'architecture

### 📊 Réponses Adaptatives
- **Limite adaptative** : Taille des réponses selon la complexité du projet
- **Format structuré** : Organisation claire des réponses longues
- **Compression intelligente** : Optimisation pour les gros projets

## 🎮 Commandes Disponibles

### Dans la Palette (Ctrl+Shift+P)
```
🔹 Ollama: Envoyer vers Ollama          → Envoi avec analyse contextuelle
🔹 Ollama: Prévisualiser le message     → Voir avant d'envoyer
🔹 Ollama: Activer/Désactiver contexte  → Toggle analyse complète
🔹 Ollama: Effacer le chat              → Vider l'historique
```

### Menu Contextuel (Clic droit)
```
📝 Envoyer vers Ollama                  → Sur code sélectionné
🔍 Prévisualiser le message pour Ollama → Avec prévisualisation
```

## ⚙️ Configuration

### Paramètres Actuels
```json
{
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.model": "codellama:7b", 
  "ollama.useFullContext": true,
  "ollama.showPreviewBeforeSending": false
}
```

### Configuration Avancée (Planifiée)
```json
{
  "ollama.contextStorage.enabled": true,
  "ollama.contextStorage.path": ".ollama-context",
  "ollama.projectDetection.enabled": true,
  "ollama.modelFile.autoGenerate": true,
  "ollama.response.maxTokens": "adaptive",
  "ollama.response.format": "structured"
}
```

## 🛠️ Installation et Utilisation

### Prérequis
- VS Code 1.74.0+
- Ollama installé et fonctionnel (`ollama serve`)
- Node.js pour le développement

### Installation
1. Cloner le repository
2. `npm install`
3. `npm run compile`
4. F5 pour tester dans Extension Development Host

### Utilisation Basique
1. **Ouvrir le chat** : L'icône Ollama apparaît dans la barre d'activité
2. **Envoyer du code** : Sélectionner du code → clic droit → "Envoyer vers Ollama"
3. **Messages réductibles** : Cliquer sur le message ou en bas pour réduire/agrandir
4. **Changer de modèle** : Utiliser le sélecteur en haut du chat

## 🔧 Fonctionnalités Techniques Actuelles

### Analyse Contextuelle Intelligente
L'extension analyse automatiquement :
- **Imports locaux** : Détection des fichiers liés au code sélectionné
- **Dépendances externes** : Identification des bibliothèques utilisées
- **Structure projet** : Compréhension de l'organisation du code
- **Code pertinent** : Inclusion du contexte nécessaire à la compréhension

### Interface Chat Avancée
- **Rendu Markdown** : Support complet avec `marked.js`
- **Coloration syntaxique** : Highlight.js pour les blocs de code
- **Messages compressibles** : Réduction/expansion des réponses longues
- **Historique persistant** : Sauvegarde entre les sessions

### Système de Configuration
- **URL serveur** : Configuration flexible du serveur Ollama
- **Sélection modèle** : Liste dynamique des modèles disponibles
- **Mode contexte** : Activation/désactivation de l'analyse complète
- **Prévisualisation** : Option pour valider avant envoi

## 📝 Architecture du Code Actuel

### Structure Simple (Version Actuelle)
```
src/
├── extension.ts        # 1515 lignes - Point d'entrée avec toute la logique
├── chatProvider.ts     # Interface WebView pour le chat
├── ollamaService.ts    # Service API pour communiquer avec Ollama
└── test/              # Tests unitaires
```

### Défis Identifiés
- **Fichier monolithique** : `extension.ts` devient trop long (1515 lignes)
- **Logique mélangée** : Analyse, interface, et service dans un même fichier
- **Maintenance difficile** : Complexité croissante du code
- **Extensibilité limitée** : Ajout de nouvelles fonctionnalités complexe

## 🎯 Roadmap de Développement

### Étape 1 : Modularisation (Priorité)
**Problème** : "le fichier devient trop long"
- [ ] Extraction du moteur d'analyse vers `core/analysis/`
- [ ] Séparation de la gestion du contexte vers `core/context/`
- [ ] Utilitaires partagés vers `utils/`
- [ ] Interfaces et types vers `interfaces/`

### Étape 2 : Contexte Persistant
**Objectif** : "le contexte obtenu doit être stocké et structuré pour premièrement servir de 'sauvegarde' mais aussi pour être utilisé par d'autres LLM"
- [ ] Système de sauvegarde `.ollama-context/`
- [ ] Format JSON structuré et réutilisable
- [ ] Export pour OpenAI, Anthropic, autres LLMs
- [ ] Restauration automatique du contexte

### Étape 3 : Intelligence Avancée
- [ ] Détection automatique de frameworks (React, Vue, Angular, etc.)
- [ ] Génération de ModelFiles spécialisés selon le projet
- [ ] Recommandation automatique de LLM selon les capacités machine
- [ ] Optimisation des paramètres (context_length, num_ctx) selon la RAM
- [ ] Fallback intelligent vers des modèles plus légers

### Étape 4 : Optimisation
- [ ] Interface utilisateur améliorée
- [ ] Performance et scalabilité
- [ ] Support multi-workspace
- [ ] Intégration avec autres outils de développement

### Étape 5 : Support Multi-Langues
- [ ] Interface utilisateur multilingue (français, anglais,...)
- [ ] Détection automatique de la langue du système
- [ ] Configuration de langue personnalisée
- [ ] Support pour les commentaires de code en plusieurs langues
- [ ] Adaptation des prompts selon la langue sélectionnée
- [ ] Documentation multilingue
- [ ] Messages du chat adaptés à la langue préférée


## 💡 Vision Future : Contexte Multi-LLM

### Concept Central
**"Le contexte obtenu doit être stocké et structuré pour premièrement servir de 'sauvegarde' mais aussi pour être utilisé par d'autres LLM"**

### Structure de Contexte Envisagée
```json
{
  "metadata": {
    "project_type": "web|mobile|desktop|library",
    "framework": "react|vue|angular|express|...",
    "language": "typescript|javascript|python|...",
    "analysis_date": "2024-01-15T10:30:00Z"
  },
  "dependencies": {
    "local": [
      {
        "path": "./src/components/Button.tsx",
        "imports": ["React", "./types"],
        "exports": ["Button", "ButtonProps"]
      }
    ],
    "external": [
      {
        "name": "react",
        "version": "18.2.0",
        "usage": "critical"
      }
    ]
  },
  "structure": {
    "components": ["Button", "Header", "Layout"],
    "services": ["api", "auth", "storage"],
    "utils": ["helpers", "constants"]
  },
  "exports": {
    "ollama": "FROM codellama:7b\\nSYSTEM Tu es un expert React...",
    "openai": {
      "system_prompt": "Tu es un assistant spécialisé en React...",
      "context": {...}
    },
    "anthropic": {
      "system": "Vous êtes un expert en développement React...",
      "context": {...}
    }
  }
}
```

### Utilisation Multi-LLM
```bash
# Export pour OpenAI
curl -X POST https://api.openai.com/v1/chat/completions \\
  -d @.ollama-context/openai-export.json

# Export pour Claude
curl -X POST https://api.anthropic.com/v1/messages \\
  -d @.ollama-context/anthropic-export.json

# ModelFile pour Ollama
ollama create my-project-expert -f .ollama-context/modelfile
```

## 🤝 Contribution

### État Actuel
- ✅ Interface chat fonctionnelle avec boutons réduire
- ✅ Analyse contextuelle de base
- ✅ Intégration Ollama complète
- ✅ Configuration flexible

### Prochaines Contributions Souhaitées
- 🔄 Modularisation du code (fichier trop long)
- 💾 Implémentation du système de contexte persistant
- 🤖 Génération automatique de ModelFiles dépendament du context du projet 
- 📊 Réponses adaptatives selon la complexité

---

## 📞 Support et Feedback

Cette extension évolue selon les besoins réels d'utilisation. N'hésitez pas à :
- Reporter des bugs ou problèmes rencontrés
- Suggérer des améliorations basées sur votre workflow
- Partager des exemples d'usage avec différents types de projets
- Contribuer au développement des fonctionnalités planifiées

**L'objectif est de créer l'extension d'assistant IA local la plus avancée possible, offrant toutes les fonctionnalités des assistants de code existants tout en restant entièrement contextuelle et réutilisable ! 🚀**

### 🎯 Vision : Assistant IA Local Complet

Cette extension vise à reproduire et améliorer les capacités des assistants IA populaires :

#### 🔥 Fonctionnalités d'Assistant de Code Visées
- **Autocomplétion intelligente** : Suggestions de code en temps réel
- **Génération de code** : Création de fonctions, classes et modules complets  
- **Refactoring assisté** : Amélioration et restructuration automatique
- **Documentation automatique** : Génération de commentaires et docs
- **Tests unitaires** : Création automatique de tests basés sur le code
- **Correction d'erreurs** : Détection et suggestions de correction
- **Explication de code** : Analyse et explications détaillées
- **Conversion de langages** : Translation entre différents langages de programmation

#### 🏠 Avantages du Local
- **Confidentialité totale** : Aucune donnée envoyée vers des serveurs externes
- **Personnalisation** : Modèles adaptés spécifiquement à votre projet
- **Performance** : Latence minimale avec Ollama local
- **Coût zéro** : Pas d'abonnement ou de tokens payants
- **Disponibilité** : Fonctionne même hors ligne

#### 🔄 Contextualité et Réutilisabilité
- **Apprentissage continu** : Le contexte s'enrichit à chaque utilisation
- **Mémoire de projet** : L'assistant "connaît" votre codebase
- **Patterns personnalisés** : Détection de vos conventions de codage
- **Export universel** : Contexte réutilisable avec d'autres LLMs
- **Évolution adaptative** : L'assistant s'améliore avec le projet
