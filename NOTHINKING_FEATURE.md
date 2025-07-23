# Fonctionnalité No-Thinking Automatique

## Description
Cette fonctionnalité désactive automatiquement la fonction "thinking" (réflexion interne) des modèles Ollama qui la supportent, équivalent à utiliser `/set nothink` manuellement.

## Modifications apportées

### 1. Configuration VS Code (package.json)
Ajout d'une nouvelle option de configuration :
```json
"ollama.disableThinking": {
  "type": "boolean",
  "default": true,
  "description": "Désactiver automatiquement la fonction 'thinking' des modèles qui la supportent (équivalent à /set nothink)"
}
```

### 2. Service Ollama (ollamaService.ts)
- **Nouvelle méthode helper** : `buildRequestOptions()` qui ajoute automatiquement `no_thinking: true` aux options de requête selon la configuration
- **Mise à jour de toutes les méthodes de chat** :
  - `chat()` : Chat simple sans streaming
  - `chatStream()` : Chat avec streaming token par token
  - `chatStreamForWorker()` : Chat streaming pour l'orchestrateur

### 3. Fonctionnement
- **Par défaut** : L'option `no_thinking` est automatiquement ajoutée à toutes les requêtes API Ollama
- **Configurable** : L'utilisateur peut désactiver cette fonctionnalité via les paramètres VS Code
- **Universel** : S'applique à tous les types de chat (simple, streaming, workers)

## Utilisation

### Pour l'utilisateur final :
1. **Activé par défaut** : Aucune action requise, la fonction thinking est automatiquement désactivée
2. **Pour réactiver le thinking** : Aller dans les paramètres VS Code → Extensions → Ollama → Décocher "Disable Thinking"

### Pour les développeurs :
Toutes les requêtes passent maintenant par `buildRequestOptions()` qui gère automatiquement l'ajout de `no_thinking` selon la configuration.

## Avantages
- ✅ **Réponses plus directes** : Élimine la verbalisation du processus de réflexion interne
- ✅ **Performances améliorées** : Réponses potentiellement plus rapides
- ✅ **Configurable** : L'utilisateur garde le contrôle
- ✅ **Transparent** : Fonctionne automatiquement sans intervention

## Modèles supportés
Cette fonctionnalité affecte uniquement les modèles qui ont une fonction "thinking" intégrée, comme :
- Certains modèles Qwen
- Modèles DeepSeek avec capacités de réflexion
- Autres modèles supportant le mode "thinking"

Pour les modèles sans cette fonctionnalité, l'option `no_thinking` est simplement ignorée par Ollama.
