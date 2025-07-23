# 🦙 Ollama Integration - Extension VS Code Avancée

Une extension VS Code de nouvelle génération pour intégrer Ollama avec analyse intelligente de projet, gestion de contexte persistant et génération de ModelFiles spécialisés.

## ✨ Fonctionnalités Principales

### 💬 Chat Intégré Amélioré
- **Interface Moderne** : Chat intuitive dans la barre latérale VS Code
- **Markdown Avancé** : Support complet avec coloration syntaxique Highlight.js
- **Sélection Modèles** : Changement dynamique de modèles Ollama
- **Messages Pliables** : Boutons réduire/agrandir pour navigation optimisée
- **Historique Persistant** : Conservation des conversations entre sessions

### 🎯 Envoi de Code Multi-Mode
- **Mode Basique** : Envoi simple du code sélectionné
- **Mode Contexte Complet** : Inclut imports et fichiers liés automatiquement
- **Mode Project-Aware** : Avec analyse complète du projet et dépendances
- **Menu Contextuel** : Accès rapide par clic droit

## 🆕 Architecture Modulaire Avancée

### 🔍 Analyse Intelligente de Projet
- **Détection Automatique** : Reconnaissance de frameworks (React, Vue, Angular, Express, NestJS, etc.)
- **Architecture Patterns** : Identification MVC, MVVM, Clean Architecture
- **Build Tools** : Détection Webpack, Vite, Rollup, Parcel
- **Dependencies Graph** : Analyse complète des dépendances locales et externes

### 💾 Gestion de Contexte Persistant
- **Sauvegarde Automatique** : Stockage JSON structuré dans `.ollama-context/`
- **Structure Organisée** : Métadonnées, dépendances, analyse de code
- **Export Multi-LLM** : Formats pour OpenAI, Anthropic, Generic
- **Backup & Restore** : Sauvegarde et restauration du contexte projet

### 🤖 Génération ModelFile Spécialisé
- **Mode Development** : Optimisé pour le développement actif
- **Mode Debug** : Spécialisé pour le débogage et résolution de problèmes
- **Mode Review** : Configuré pour la revue de code et quality assurance
- **Mode Optimization** : Axé sur l'optimisation et les performances

### 📊 Réponses Adaptatives
- **Token Adaptatif** : Limite dynamique selon la complexité du projet
- **Format Structuré** : Réponses organisées par sections
- **Contexte Intelligent** : Inclus framework, dépendances, et structure

## 🎮 Commandes Disponibles

### Palette de Commandes (Ctrl+Shift+P)
```
🔍 Ollama: Analyze Project Structure     → Analyse complète du projet
📤 Ollama: Export Project Context        → Export contexte multi-format  
🤖 Ollama: Generate Specialized Model    → Création ModelFile optimisé
🧹 Ollama: Clear Project Context         → Nettoyage du contexte
📋 Ollama: Show Context Summary          → Résumé du contexte actuel
```

### Menu Contextuel (Clic droit)
```
📝 Send to Ollama (Basic)               → Mode basique original
🎯 Send to Ollama (Full Context)        → Avec contexte complet
🧠 Send to Ollama (Project Aware)       → Avec analyse projet
```

### Anciennes Commandes (Rétrocompatibilité)
```
💬 Ollama: Open Chat                     → Ouvrir l'interface chat
🔄 Ollama: Clear Chat                    → Vider l'historique
⚙️ Ollama: Change Model                  → Changer le modèle actif
```

## ⚙️ Configuration Avancée

### Paramètres Intelligents
```json
{
  // Configuration de base
  "ollama.serverUrl": "http://localhost:11434",
  "ollama.model": "codellama:7b",
  
  // Nouvelles fonctionnalités
  "ollama.useFullContext": true,
  "ollama.showPreviewBeforeSending": false,
  
  // Gestion du contexte
  "ollama.contextStorage.enabled": true,
  "ollama.contextStorage.path": ".ollama-context",
  
  // Détection de projet
  "ollama.projectDetection.enabled": true,
  
  // ModelFile automatique
  "ollama.modelFile.autoGenerate": true,
  
  // Réponses adaptatives
  "ollama.response.maxTokens": "adaptive",
  "ollama.response.format": "structured"
}
```

### Options de Configuration Détaillées

#### `ollama.response.maxTokens`
- `"adaptive"` : S'ajuste automatiquement selon la taille du projet
- `"1024"`, `"2048"`, `"4096"`, `"8192"` : Limites fixes

#### `ollama.response.format`
- `"structured"` : Réponses organisées avec sections et hiérarchie
- `"markdown"` : Format markdown standard
- `"plain"` : Texte brut simple

#### `ollama.contextStorage.path`
- Chemin relatif au workspace pour stocker le contexte
- Par défaut : `.ollama-context`
- Peut être personnalisé selon l'organisation projet

## 📁 Structure de Contexte Persistant

### Le Contexte Multi-LLM

Le contexte obtenu est **stocké et structuré** pour premièrement servir de **'sauvegarde'** mais aussi pour être **utilisé par d'autres LLM**. Cette approche révolutionnaire permet :

1. **Portabilité** : Même analyse pour OpenAI, Anthropic, Ollama
2. **Efficacité** : Pas de re-analyse à chaque utilisation
3. **Consistance** : Contexte identique entre différents outils
4. **Backup** : Sauvegarde complète de l'état du projet

### Fichier `.ollama-context/project-context.json`
```json
{
  "metadata": {
    "type": "web|mobile|desktop|library|api|cli",
    "language": "typescript|javascript|python|...",
    "frameworks": [
      {
        "name": "React",
        "version": "18.2.0", 
        "type": "frontend",
        "confidence": 95,
        "indicators": ["package.json", "jsx files"],
        "patterns": ["src/components/", "public/index.html"]
      }
    ],
    "buildTools": ["vite", "typescript", "eslint"],
    "testFrameworks": ["jest", "testing-library"],
    "architecture": ["component-based", "hooks-pattern"],
    "packageManager": "npm|yarn|pnpm"
  },
  "timestamp": "2024-01-15T10:30:00Z",
  "version": "1.0.0",
  "workspace": "/path/to/project",
  
  "dependencies": {
    "local": [
      {
        "path": "./src/components/Button.tsx",
        "imports": ["React", "./types"],
        "exports": ["Button", "ButtonProps"],
        "usages": ["./src/pages/Home.tsx"]
      }
    ],
    "external": [
      {
        "name": "react",
        "version": "18.2.0",
        "type": "dependency",
        "usedIn": ["components", "hooks"],
        "importance": "critical"
      }
    ],
    "tree": [
      {
        "name": "src/App.tsx",
        "children": ["src/components/", "src/hooks/"],
        "depth": 0
      }
    ]
  },
  
  "structure": {
    "components": [
      {
        "path": "src/components/Button.tsx",
        "type": "functional-component",
        "props": ["onClick", "children", "variant"],
        "hooks": ["useState", "useCallback"]
      }
    ],
    "services": [
      {
        "path": "src/services/api.ts", 
        "exports": ["fetchUser", "createPost"],
        "dependencies": ["axios"]
      }
    ],
    "configuration": [
      {
        "file": "vite.config.ts",
        "type": "build-config",
        "settings": ["plugins", "resolve", "build"]
      }
    ],
    "tests": [
      {
        "path": "src/__tests__/Button.test.tsx",
        "targets": ["src/components/Button.tsx"],
        "framework": "jest"
      }
    ]
  },
  
  "analysis": [
    {
      "timestamp": "2024-01-15T10:30:00Z",
      "type": "dependency-analysis",
      "duration": "1.2s",
      "results": {
        "totalFiles": 45,
        "codeFiles": 38,
        "testFiles": 7,
        "complexity": "medium"
      },
      "summary": "Projet React TypeScript avec Vite - Architecture moderne"
    }
  ],
  
  "exports": {
    "ollama": "FROM codellama:7b\\nSYSTEM You are a React TypeScript expert...",
    "openai": {
      "system_prompt": "Tu es un expert React TypeScript spécialisé...",
      "context": {
        "project_type": "React TypeScript avec Vite",
        "frameworks": ["React", "TypeScript", "Vite"],
        "key_files": ["src/App.tsx", "src/components/"],
        "dependencies": ["react", "typescript", "vite"]
      },
      "instructions": [
        "Toujours fournir du code TypeScript typé",
        "Utiliser les patterns React modernes (hooks)",
        "Respecter l'architecture existante"
      ]
    },
    "anthropic": {
      "system": "Vous êtes un assistant expert en développement React TypeScript...",
      "context": {
        "project_analysis": {
          "type": "frontend-web-app",
          "stack": ["React", "TypeScript", "Vite"],
          "patterns": ["functional-components", "custom-hooks"],
          "structure": "src/ based with components separation"
        }
      },
      "guidelines": [
        "Prioriser la lisibilité et la maintenabilité",
        "Utiliser TypeScript de manière idiomatique",
        "Suivre les conventions React établies"
      ]
    },
    "generic": {
      "description": "Modern React TypeScript project with Vite build tool",
      "technologies": ["React 18.2.0", "TypeScript 4.9+", "Vite 4.0+"],
      "architecture": "Component-based with functional patterns",
      "context_data": {
        "file_count": 45,
        "main_directories": ["src/components", "src/hooks", "src/services"],
        "test_coverage": "Jest + React Testing Library",
        "styling": "CSS Modules + Tailwind CSS"
      },
      "recommendations": [
        "Use functional components with hooks",
        "Maintain strong TypeScript typing",
        "Follow established project structure",
        "Prioritize performance and accessibility"
      ]
    }
  }
}
```

### Bénéfices de cette Structure

✅ **Sauvegarde Complète** : Toute l'analyse du projet est préservée  
✅ **Réutilisabilité** : Même contexte pour différents LLM  
✅ **Évolutivité** : Structure extensible pour nouvelles analyses  
✅ **Performance** : Cache intelligent évite re-analyse inutile  
✅ **Portabilité** : Format JSON standard facilement exportable  
✅ **Versionning** : Suivi des changements d'analyse dans le temps  

## 🔄 Utilisation avec Autres LLM

### Export Automatique

L'extension génère automatiquement les formats pour différents providers :

```bash
.ollama-context/
├── project-context.json       # Contexte complet
├── exports/
│   ├── ollama-modelfile       # ModelFile Ollama
│   ├── openai-context.json    # Format OpenAI
│   ├── anthropic-context.json # Format Claude
│   └── generic-context.json   # Format générique
```

### Utilisation Pratique

#### Avec OpenAI
```bash
curl -X POST https://api.openai.com/v1/chat/completions \\
  -H "Authorization: Bearer $OPENAI_API_KEY" \\
  -d @.ollama-context/exports/openai-context.json
```

#### Avec Claude (Anthropic)
```bash
curl -X POST https://api.anthropic.com/v1/messages \\
  -H "x-api-key: $ANTHROPIC_API_KEY" \\
  -d @.ollama-context/exports/anthropic-context.json
```

#### Avec Ollama (ModelFile)
```bash
ollama create my-project-expert -f .ollama-context/exports/ollama-modelfile
ollama run my-project-expert
```

## 🎯 Exemples d'Usage Avancés

### Développement avec Contexte Intelligent

Quand vous envoyez du code avec "Project Aware", l'extension inclut automatiquement :

- ✅ Type de projet détecté (React/Vue/Angular/etc.)
- ✅ Dépendances installées et utilisées
- ✅ Patterns architecturaux identifiés
- ✅ Structure des fichiers et organisation
- ✅ Configuration des outils de build
- ✅ Frameworks de test utilisés

**Résultat** : Réponses précises et parfaitement adaptées à votre projet !

### Analyse Multi-Projet

Chaque workspace a son contexte indépendant :

```bash
workspace/
├── frontend-react/
│   └── .ollama-context/          # Contexte React
├── backend-node/
│   └── .ollama-context/          # Contexte Node.js
└── mobile-react-native/
    └── .ollama-context/          # Contexte React Native
```

### Génération ModelFile Spécialisé

Exemple de ModelFile généré automatiquement :

```dockerfile
FROM codellama:7b

SYSTEM You are a React TypeScript expert specialized in modern web development.

Project Context:
- Framework: React 18.2.0 with TypeScript 4.9+
- Build Tool: Vite 4.0+ with Hot Module Replacement
- State Management: Redux Toolkit + RTK Query  
- Styling: Tailwind CSS 3.0+ with CSS Modules
- Testing: Jest + React Testing Library + MSW
- Architecture: Component-based with custom hooks pattern

Current Project Structure:
- src/components/ - Reusable UI components
- src/hooks/ - Custom React hooks
- src/services/ - API services and data fetching
- src/utils/ - Utility functions and helpers
- src/types/ - TypeScript type definitions

Focus Areas:
- Modern React patterns (functional components, hooks)
- TypeScript best practices and strict type safety
- Performance optimization (memo, useMemo, useCallback)
- Responsive design with Tailwind utilities
- Clean, maintainable, and testable code structure
- Accessibility (a11y) best practices

Code Style Guidelines:
- Use functional components with TypeScript
- Implement proper error boundaries
- Follow the established project patterns
- Prioritize readability and maintainability
- Include proper TypeScript types and interfaces

Always provide code examples that fit this project structure and follow the established architectural patterns.

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
```

## 🚀 Installation et Configuration

### 1. Prérequis

- VS Code 1.70.0+
- Node.js 16+ (pour le développement)
- Ollama installé et en cours d'exécution

### 2. Installation Extension

#### Depuis VS Code Marketplace
1. Ouvrir VS Code
2. Aller dans Extensions (Ctrl+Shift+X)
3. Rechercher "Ollama Integration"
4. Cliquer "Install"

#### Installation Manuelle
```bash
# Cloner le repository
git clone <repository-url>
cd ollama-integration

# Installer les dépendances
npm install

# Compiler
npm run compile

# Packager (optionnel)
vsce package
```

### 3. Configuration Initiale

1. **Démarrer Ollama** :
```bash
ollama serve
```

2. **Configurer VS Code** :
   - Ouvrir Settings (Ctrl+,)
   - Rechercher "ollama"
   - Configurer `ollama.serverUrl` si différent de localhost
   - Activer `ollama.useFullContext` pour l'analyse complète

3. **Premier Test** :
   - Ouvrir Command Palette (Ctrl+Shift+P)
   - Lancer "Ollama: Analyze Project Structure"
   - Vérifier la création de `.ollama-context/`

## 🔧 Architecture Technique

### Structure Modulaire

```
src/
├── extension.ts                 # Point d'entrée principal
├── interfaces/
│   └── IChatProvider.ts        # Contrats TypeScript
├── core/
│   ├── context/
│   │   └── contextManager.ts   # Gestion contexte persistant
│   ├── llm/
│   │   └── modelFileGenerator.ts # Génération ModelFiles
│   └── analysis/
│       └── codeAnalyzer.ts     # Analyse code et dépendances
├── utils/
│   ├── projectDetector.ts      # Détection frameworks/projets
│   └── fileUtils.ts           # Utilitaires système fichiers
├── chatProvider.ts             # Interface chat WebView
└── ollamaService.ts           # Service API Ollama
```

### Design Patterns Utilisés

- **Modular Architecture** : Séparation claire des responsabilités
- **Dependency Injection** : Services découplés et testables  
- **Observer Pattern** : Mise à jour réactive du contexte
- **Strategy Pattern** : Multiples modes d'analyse et export
- **Factory Pattern** : Génération dynamique de ModelFiles

### Technologies Intégrées

- **TypeScript** : Typage strict et interfaces robustes
- **VS Code API** : WebView, Commands, Configuration
- **Node.js FS** : Analyse système de fichiers
- **JSON Schema** : Validation structure contexte
- **Markdown Rendering** : Affichage riche dans le chat

## 🐛 Dépannage

### Problèmes Courants

#### ❌ Contexte Non Généré
**Symptômes** : Pas de dossier `.ollama-context/` créé

**Solutions** :
- Vérifier permissions d'écriture dans le workspace
- S'assurer que `ollama.contextStorage.enabled: true`
- Redémarrer VS Code après changement de config
- Vérifier que le workspace contient des fichiers de code

#### ❌ Détection Projet Échoue  
**Symptômes** : Type de projet détecté comme "unknown"

**Solutions** :
- Vérifier présence de `package.json`, `requirements.txt`, ou autres fichiers de config
- Consulter les logs dans Output Panel → "Ollama Integration"
- Activer `ollama.debug: true` pour traces détaillées
- S'assurer que les fichiers ne sont pas dans `.gitignore`

#### ❌ ModelFile Non Créé
**Symptômes** : Pas de ModelFile généré dans les exports

**Solutions** :
- Vérifier connexion au serveur Ollama (`ollama serve`)
- S'assurer que le modèle de base est disponible (`ollama list`)
- Vérifier `ollama.modelFile.autoGenerate: true`
- Contrôler les permissions d'écriture

#### ❌ Erreur "Module Not Found"
**Symptômes** : Erreurs TypeScript ou imports manquants

**Solutions** :
```bash
# Réinstaller les dépendances
rm -rf node_modules
npm install

# Recompiler
npm run compile

# Redémarrer VS Code
```

### Logs et Debug

#### Activation Debug Mode
```json
{
  "ollama.debug": true,
  "ollama.verbose": true
}
```

#### Consultation des Logs
1. Ouvrir Output Panel (Ctrl+Shift+U)
2. Sélectionner "Ollama Integration" dans le dropdown
3. Analyser les messages d'erreur et warnings

#### Logs Utiles
```bash
# Logs détaillés de l'analyse
[Ollama] Analyzing project structure...
[Ollama] Detected frameworks: React, TypeScript
[Ollama] Generated context: 45 files, 2.3MB

# Logs d'erreur
[Ollama] Error: Cannot write to .ollama-context/
[Ollama] Solution: Check write permissions
```

### Reset Complet

Si tous les problèmes persistent :

```bash
# 1. Supprimer le contexte existant
rm -rf .ollama-context/

# 2. Reset configuration VS Code
# Settings → Extensions → Ollama → "Reset to Defaults"

# 3. Redémarrer complètement
# Fermer VS Code, redémarrer Ollama, rouvrir VS Code
```

## 🔮 Roadmap et Prochaines Fonctionnalités

### Version 2.0 (Q2 2024)
- [ ] **Interface Graphique ModelFile** : Éditeur visuel pour personnaliser les ModelFiles
- [ ] **Templates Personnalisables** : Bibliothèque de templates pour différents use cases
- [ ] **Export Cloud** : Sauvegarde contexte vers services cloud (GitHub, GitLab)
- [ ] **Collaboration** : Partage de contexte entre équipes

### Version 2.1 (Q3 2024)  
- [ ] **Analyse Sémantique** : Compréhension du code plus profonde
- [ ] **Git Integration** : Contexte basé sur l'historique Git
- [ ] **Multi-Workspace** : Gestion de projets multiples simultanés
- [ ] **Performance Dashboard** : Métriques d'utilisation et optimisation

### Version 3.0 (Q4 2024)
- [ ] **AI-Powered Suggestions** : Suggestions intelligentes de ModelFiles
- [ ] **Real-time Collaboration** : Collaboration en temps réel sur le contexte
- [ ] **Plugin Ecosystem** : API pour extensions tierces
- [ ] **Enterprise Features** : SSO, audit logs, compliance

## 🤝 Contribution

### Développement Local

```bash
# Cloner et setup
git clone <repository-url>
cd ollama-integration
npm install

# Développement avec watch
npm run watch

# Test dans VS Code
# Presser F5 pour lancer Extension Development Host
```

### Structure de Contribution

Le code est maintenant **modulaire et extensible**. Chaque composant peut être développé indépendamment :

- **`utils/`** : Détection et analyse (ajouter nouveaux frameworks)
- **`core/`** : Logique métier principale (nouveaux modes d'analyse)
- **`interfaces/`** : Contrats TypeScript (nouvelles intégrations)

### Guidelines

1. **Suivre TypeScript Strict** : Typage complet requis
2. **Tests Unitaires** : Couvrir les nouvelles fonctionnalités
3. **Documentation** : Commenter le code complexe
4. **Performance** : Optimiser pour gros projets

## 📞 Support et Communauté

### Support Technique
- 📚 **Documentation** : Consulter ce README et [MIGRATION.md](./MIGRATION.md)
- 🔍 **Debug** : Utiliser les logs dans Output Panel
- 🧪 **Test** : Utiliser `test-features.js` pour diagnostics
- 📝 **Comparison** : Comparer avec `extension.old.ts` si migration

### Communauté
- 🐛 **Issues** : Reporter bugs sur GitHub
- 💡 **Feature Requests** : Proposer nouvelles fonctionnalités  
- 📖 **Wiki** : Contribuer à la documentation
- 💬 **Discussions** : Échanger avec la communauté

### Contact
- 📧 **Email** : support@ollama-integration
- 🐦 **Twitter** : @ollama_vscode
- 💬 **Discord** : [Lien du serveur](discord-link)

---

## 🎉 Conclusion

L'**Ollama Integration** avec sa nouvelle architecture modulaire représente une évolution majeure dans l'intégration d'IA dans VS Code. 

### Points Forts

✅ **Contexte Intelligent** : Analyse automatique et complète du projet  
✅ **Multi-LLM Support** : Compatible OpenAI, Anthropic, Ollama  
✅ **Sauvegarde Persistante** : Pas de perte de contexte entre sessions  
✅ **ModelFiles Spécialisés** : IA optimisée pour votre projet spécifique  
✅ **Architecture Modulaire** : Facilement extensible et maintenable  
✅ **Performance Optimisée** : Cache intelligent et traitement adaptatif  

### Innovation

🚀 **Première extension VS Code** à offrir un contexte véritablement **multi-LLM** avec sauvegarde persistante et génération automatique de ModelFiles spécialisés.

**L'ère de l'IA contextuelle intelligente commence maintenant ! 🌟**

---

*Développé avec ❤️ pour la communauté des développeurs. Contribuez et faisons évoluer l'IA dans le développement !*
