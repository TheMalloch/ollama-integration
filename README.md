# 🦙 Ollama Integration - VS Code Extension

Extension VS Code pour intégration Ollama avec analyse contextuelle intelligente.

## ✅ Fonctionnalités Implémentées

### Interface Chat
- [x] Chat sidebar avec WebView
- [x] Messages avec boutons réduire/agrandir
- [x] Support Markdown + highlight.js
- [x] Sélection dynamique modèles Ollama
- [x] Historique persistant conversations

### Analyse de Code
- [x] Envoi code sélectionné (mode basique)
- [x] Analyse contextuelle complète (imports + dépendances)
- [x] Menu contextuel clic droit
- [x] Prévisualisation message avant envoi
- [x] Détection imports locaux/externes
- [x] Graphe dépendances fichiers
- [x] Inclusion code pertinent automatique

### Configuration
- [x] URL serveur configurable (`ollama.serverUrl`)
- [x] Sélection modèle (`ollama.model`)
- [x] Toggle contexte complet (`ollama.useFullContext`)
- [x] Mode prévisualisation (`ollama.showPreviewBeforeSending`)

## 🔄 Roadmap Développement

### Phase 1: Modularisation (Priorité)
- [ ] Refactoring `extension.ts` (1515 lignes → modules)
- [ ] Extraction `core/analysis/` - moteur analyse
- [ ] Extraction `core/context/` - gestion contexte  
- [ ] Extraction `utils/` - utilitaires partagés
- [ ] Définition interfaces TypeScript strictes

### Phase 2: Contexte Persistant
- [ ] Système sauvegarde `.ollama-context/`
- [ ] Structure JSON réutilisable multi-LLM
- [ ] Export OpenAI/Anthropic/Generic
- [ ] Restauration automatique contexte
- [ ] Versioning contexte projet

### Phase 3: Intelligence Projet
- [ ] Détection frameworks (React/Vue/Angular/Express/etc.)
- [ ] Génération ModelFiles spécialisés selon projet
- [ ] Templates contextuels adaptés architecture
- [ ] Recommandation LLM selon capacités machine
- [ ] Optimisation paramètres selon RAM/CPU

### Phase 4: Assistant IA Avancé
- [ ] Autocomplétion intelligente temps réel
- [ ] Génération code (fonctions/classes/modules)
- [ ] Refactoring assisté automatique
- [ ] Documentation automatique
- [ ] Tests unitaires générés
- [ ] Correction erreurs + suggestions
- [ ] Conversion langages programmation

### Phase 5: Performance & Extensibilité
- [ ] Cache intelligent analyses
- [ ] Support multi-workspace
- [ ] Interface multilingue (FR/EN/ES/DE)
- [ ] Plugin ecosystem / API extensibilité
- [ ] Métriques usage et optimisation

## 🏗️ Architecture Actuelle

```
src/
├── extension.ts      # 1515L - Logique principale (à refactorer)
├── chatProvider.ts   # Interface WebView chat
└── ollamaService.ts  # API Ollama communication
```

## 🎯 Architecture Cible

```
src/
├── extension.ts           # Point d'entrée léger
├── core/
│   ├── analysis/         # Moteur analyse code
│   ├── context/          # Gestion contexte persistant
│   └── llm/             # Intégration LLM + ModelFiles
├── providers/
│   └── chatProvider.ts   # Interface chat
├── utils/
│   ├── projectDetector.ts # Détection frameworks
│   └── fileUtils.ts      # Utilitaires système
└── interfaces/
    └── types.ts          # Définitions TypeScript
```

## ⚙️ Config Dev

```bash
# Setup
npm install
npm run compile
npm run watch  # Dev mode

# Test
F5  # Extension Development Host
```

## 📋 Commandes Disponibles

```
ollama.sendToChat           # Envoi avec contexte
ollama.previewMessage       # Prévisualisation  
ollama.toggleFullContext   # Toggle analyse
ollama.clearChat           # Clear historique
```

## 🎯 Objectif Final

**Assistant IA local complet** reproduisant capacités GitHub Copilot/Cursor mais:
- 🏠 **100% local** (confidentialité totale)
- 🧠 **Contextuel** (mémoire projet persistante) 
- 🔄 **Multi-LLM** (réutilisable OpenAI/Anthropic)
- 💰 **Gratuit** (coût zéro)


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
