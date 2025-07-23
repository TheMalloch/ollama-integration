# Guide de Migration - Architecture Modulaire Ollama

## 📋 Vue d'ensemble

Cette migration transforme l'extension Ollama en une architecture modulaire complète avec des fonctionnalités avancées d'analyse de projet, de gestion de contexte et de génération de ModelFiles spécialisés.

## 🔄 Changements Structurels

### Ancien Fichier vs Nouvelle Architecture

```
AVANT:
src/
├── extension.ts          (monolithe)
├── chatProvider.ts      
└── ollamaService.ts

APRÈS:
src/
├── extension-new.ts              (nouvelle implémentation)
├── interfaces/
│   └── IChatProvider.ts         (interfaces TypeScript)
├── core/
│   ├── context/
│   │   └── contextManager.ts    (gestion contexte)
│   ├── llm/
│   │   └── modelFileGenerator.ts (génération ModelFiles)
│   └── analysis/
│       └── codeAnalyzer.ts      (analyse de code)
├── utils/
│   ├── projectDetector.ts       (détection projets)
│   └── fileUtils.ts            (utilitaires fichiers)
├── chatProvider.ts              (mis à jour)
└── ollamaService.ts
```

## 🎯 Nouvelles Fonctionnalités

### 1. Détection Automatique de Projet
- **Framework Detection**: React, Vue, Angular, Express, NestJS, etc.
- **Architecture Patterns**: MVC, MVVM, Clean Architecture
- **Build Tools**: Webpack, Vite, Rollup, Parcel
- **Package Managers**: npm, yarn, pnpm

### 2. Gestion de Contexte Persistant
- **Sauvegarde JSON**: Stockage dans `.ollama-context/`
- **Analyse Dependencies**: Graphe de dépendances automatique
- **Export Multi-LLM**: OpenAI, Anthropic, Generic formats
- **Backup & Restore**: Sauvegarde automatique du contexte

### 3. Génération ModelFile Spécialisé
- **Mode Debug**: Optimisé pour le débogage
- **Mode Development**: Pour le développement actif
- **Mode Review**: Pour la revue de code
- **Mode Optimization**: Pour l'optimisation

## 🚀 Nouvelles Commandes

### Commands Palette (Ctrl+Shift+P)
```
Ollama: Analyze Project Structure    → Analyse complète du projet
Ollama: Export Project Context       → Export contexte multi-format
Ollama: Generate Specialized Model   → Création ModelFile spécialisé
Ollama: Clear Project Context        → Nettoyage du contexte
Ollama: Show Context Summary         → Résumé du contexte actuel
```

### Context Menu (Clic droit)
```
Send to Ollama (Basic)              → Mode basique original
Send to Ollama (Full Context)       → Avec contexte complet
Send to Ollama (Project Aware)      → Avec analyse projet
```

## ⚙️ Configuration Avancée

### Nouvelles Configurations dans settings.json
```json
{
  "ollama.useFullContext": true,
  "ollama.contextStorage.enabled": true,
  "ollama.contextStorage.path": ".ollama-context",
  "ollama.projectDetection.enabled": true,
  "ollama.modelFile.autoGenerate": true,
  "ollama.response.maxTokens": "adaptive",
  "ollama.response.format": "structured"
}
```

### Configuration Adaptative
- **maxTokens: "adaptive"**: S'ajuste automatiquement selon la taille du projet
- **response.format**: 
  - `structured`: Avec sections organisées
  - `markdown`: Format markdown standard
  - `plain`: Texte brut

## 📁 Structure de Contexte

### Fichier `.ollama-context/project-context.json`
```json
{
  "metadata": {
    "type": "web",
    "language": "typescript",
    "frameworks": [
      {
        "name": "React",
        "version": "18.2.0",
        "type": "frontend",
        "confidence": 95
      }
    ],
    "buildTools": ["vite", "typescript"],
    "packageManager": "npm"
  },
  "dependencies": {
    "local": [...],
    "external": [...],
    "tree": [...]
  },
  "structure": {
    "components": [...],
    "services": [...],
    "utilities": [...]
  },
  "exports": {
    "ollama": "ModelFile optimisé pour ce projet",
    "openai": "Contexte format OpenAI",
    "anthropic": "Contexte format Claude"
  }
}
```

## 🔧 API et Interfaces

### IChatProvider Interface
```typescript
interface IChatProvider {
    addUserMessage(message: string): void;
    clearChat(): void;
    updateContextSetting(enabled: boolean): void;
    updateProjectContext(context: ProjectContext): void;
}
```

### Utilisation Programmatique
```typescript
import { ProjectDetector } from './utils/projectDetector';
import { ContextManager } from './core/context/contextManager';
import { ModelFileGenerator } from './core/llm/modelFileGenerator';

// Détecter le projet
const detector = new ProjectDetector(workspaceFolder);
const metadata = await detector.detectProject();

// Gérer le contexte
const contextManager = new ContextManager(workspaceFolder);
await contextManager.loadOrCreateContext();

// Générer ModelFile
const generator = new ModelFileGenerator();
const modelFile = await generator.generateModelFile(context, 'development');
```

## 🎨 Interface Utilisateur

### Status Bar Améliorée
- **Basic Mode**: `$(file-text) Ollama Basic`
- **Context Mode**: `$(file-text) Contexte: React App`
- **Analysis Mode**: `$(sync~spin) Analyse en cours...`

### Messages de Contexte
L'interface chat affiche maintenant:
- Type de projet détecté
- Frameworks utilisés
- Outils de build
- Complexité estimée

## 📊 Métriques et Performance

### Optimisations
- **Lazy Loading**: Modules chargés à la demande
- **Cache Intelligent**: Réutilisation des analyses
- **Token Adaptatif**: Limite dynamique selon le projet
- **Compression**: Contexte optimisé pour les LLM

### Monitoring
- Taille du contexte générée
- Temps d'analyse du projet
- Utilisation mémoire optimisée
- Logs détaillés en mode debug

## 🛠️ Migration Étapes

### 1. Backup (Recommandé)
```bash
# Sauvegarder l'ancien code
cp src/extension.ts src/extension.backup.ts
```

### 2. Activation Nouvelle Architecture
```bash
# Renommer pour activer
mv src/extension.ts src/extension.old.ts
mv src/extension-new.ts src/extension.ts
```

### 3. Configuration Initiale
1. Ouvrir VS Code Settings (Ctrl+,)
2. Rechercher "ollama"
3. Activer les nouvelles fonctionnalités
4. Configurer le chemin de stockage contexte

### 4. Test Initial
1. Ouvrir Command Palette (Ctrl+Shift+P)
2. Lancer "Ollama: Analyze Project Structure"
3. Vérifier la génération de `.ollama-context/`
4. Tester les nouvelles commandes

## 🐛 Dépannage

### Problèmes Courants

#### Contexte Non Généré
- Vérifier permissions dossier workspace
- S'assurer que `contextStorage.enabled: true`
- Redémarrer VS Code

#### Détection Projet Échoue
- Vérifier présence package.json/requirements.txt
- Logs dans Output Panel → "Ollama Integration"
- Mode debug pour traces détaillées

#### ModelFile Non Créé
- Vérifier connexion serveur Ollama
- S'assurer modèle base disponible
- Vérifier configuration `modelFile.autoGenerate`

### Logs et Debug
```typescript
// Activer logs détaillés
"ollama.debug": true

// Voir logs dans Output Panel
// View → Output → Select "Ollama Integration"
```

## 🔮 Prochaines Étapes

### Fonctionnalités Planifiées
- [ ] Interface graphique pour ModelFile editing
- [ ] Export vers d'autres LLM providers
- [ ] Analyse sémantique avancée du code
- [ ] Templates de ModelFile personnalisables
- [ ] Intégration Git pour contexte historique

### Contributions
Le code est maintenant modulaire et extensible. Chaque composant peut être développé indépendamment :

- `utils/` : Détection et analyse
- `core/` : Logique métier principale  
- `interfaces/` : Contrats TypeScript

---

## 📞 Support

Pour toute question sur la migration :
1. Vérifier ce guide
2. Consulter les logs dans Output Panel
3. Tester avec `test-features.js`
4. Comparer avec `extension.old.ts` si nécessaire

**L'architecture modulaire est maintenant prête ! 🎉**
