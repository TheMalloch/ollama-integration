import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { OllamaChatViewProvider } from './chatProvider';
import { OllamaService } from './ollamaService';
import { LLMOrchestrator } from './llm-orchestrator';

let chatProvider: OllamaChatViewProvider;
let orchestrator: LLMOrchestrator;

// Interfaces pour l'analyse avancée
export interface ImportInfo {
    source: string;
    imports: string[];
    type: 'named' | 'default' | 'namespace';
    localPath?: string;
    relevantCode?: string;
    dependencies?: string[];
}

interface FunctionCall {
    name: string;
    line: number;
    context: string;
    parameters: string[];
    origin: 'local' | 'imported' | 'builtin';
    definition?: string;
}

interface VariableInfo {
    name: string;
    type: string;
    line: number;
    usages: number;
}

interface CodeAnalysis {
    imports: ImportInfo[];
    functionCalls: FunctionCall[];
    variables: VariableInfo[];
    codeStructure: string[];
}

// Système de file d'attente pour l'analyse des dépendances
interface DependencyAnalysisQueue {
    pending: ImportInfo[];
    processing: Set<string>;
    analyzed: Map<string, ImportInfo>;
    maxDepth: number;
    currentDepth: number;
}

export function activate(context: vscode.ExtensionContext) {
    // Initialize services
    const ollamaService = new OllamaService();
    orchestrator = new LLMOrchestrator();
    chatProvider = new OllamaChatViewProvider(context, ollamaService);

    // Register the webview provider
    context.subscriptions.push(
        vscode.window.registerWebviewViewProvider(
            'ollamaChat', 
            chatProvider,
            {
                webviewOptions: {
                    retainContextWhenHidden: true
                }
            }
        )
    );

    // Register commands
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.clearChat', () => {
            chatProvider.clearChat();
        })
    );

    // Commande pour envoyer du code avec analyse avancée
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.sendToChat', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Aucun fichier ouvert');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            const languageId = editor.document.languageId;
            
            // Vérifier la configuration pour le contexte complet
            const config = vscode.workspace.getConfiguration('ollama');
            const useFullContext = config.get('useFullContext', true);

            // SUGGESTIONS DE MESSAGES SELON LE CONTEXTE
            const suggestions = getSuggestedMessages(selectedText.trim().length > 0, languageId);
            
            const selectedOption = await vscode.window.showQuickPick([
                ...suggestions,
                {
                    label: '$(edit) Message personnalisé...',
                    description: 'Écrire votre propre question',
                    detail: 'Ouvre une boîte de saisie pour un message personnalisé',
                    custom: true
                }
            ], {
                placeHolder: 'Choisissez votre question ou écrivez la vôtre',
                ignoreFocusOut: true
            });

            if (!selectedOption) {
                return; // Utilisateur a annulé
            }

            let customMessage = '';
            
            if (selectedOption.custom) {
                // Demander un message personnalisé
                const inputMessage = await vscode.window.showInputBox({
                    prompt: 'Votre question personnalisée pour Ollama',
                    placeHolder: 'Ex: Explique-moi ce code étape par étape...',
                    ignoreFocusOut: true
                });
                
                if (inputMessage === undefined) {
                    return; // Utilisateur a annulé
                }
                
                customMessage = inputMessage;
            } else {
                customMessage = (selectedOption as any).message || '';
            }

            if (useFullContext) {
                await sendWithAdvancedAnalysis(editor, selectedText, languageId, customMessage, chatProvider);
            } else {
                if (!selectedText.trim()) {
                    vscode.window.showWarningMessage('Veuillez sélectionner du code à analyser en mode simple');
                    return;
                }
                await sendSimpleCode(selectedText, languageId, customMessage, chatProvider);
            }
        })
    );

    // Commande pour prévisualiser le message qui sera envoyé à l'LLM
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.previewMessage', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Aucun fichier ouvert');
                return;
            }

            const selectedText = editor.document.getText(editor.selection);
            const languageId = editor.document.languageId;
            
            // Vérifier la configuration pour le contexte complet
            const config = vscode.workspace.getConfiguration('ollama');
            const useFullContext = config.get('useFullContext', true);

            // Générer le message de prévisualisation
            let previewMessage: string;
            let analysisDetails = '';
            const customMessage = "Exemple de question pour la prévisualisation";

            if (useFullContext) {
                const fileName = path.basename(editor.document.fileName);
                const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
                const fullFileContent = editor.document.getText();
                
                try {
                    // Analyser pour obtenir les détails
                    const imports = await analyzeImportsWithCode(fullFileContent, workspaceFolder, languageId, 3);
                    const functionCalls = analyzeFunctionCalls(fullFileContent, imports);
                    const variables = analyzeVariables(fullFileContent);
                    const lines = fullFileContent.split('\n');
                    const codeStructure = analyzeCodeStructure(lines);
                    
                    const analysis: CodeAnalysis = {
                        imports,
                        functionCalls,
                        variables,
                        codeStructure
                    };
                    
                    // Générer le résumé détaillé
                    analysisDetails = showDetailedAnalysisSummary(analysis, fileName);
                    
                    previewMessage = await generatePreviewMessage(editor, selectedText, languageId, customMessage);
                } catch (error) {
                    previewMessage = `Erreur lors de la génération: ${error}`;
                }
            } else {
                previewMessage = `${customMessage}\n\nVoici du code ${languageId}:\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;
                analysisDetails = "Mode basique: seul le code sélectionné sera envoyé sans analyse des dépendances.";
            }

            // Créer le contenu de prévisualisation avec le résumé en haut
            const fullPreviewContent = `${analysisDetails}\n\n---\n\n# Message qui sera envoyé à Ollama\n\n${previewMessage}`;

            // Afficher dans un document temporaire
            const previewDoc = await vscode.workspace.openTextDocument({
                content: fullPreviewContent,
                language: 'markdown'
            });

            await vscode.window.showTextDocument(previewDoc, vscode.ViewColumn.Beside);
            
            // Afficher les statistiques
            const stats = getMessageStats(previewMessage);
            vscode.window.showInformationMessage(
                `Prévisualisation: ${stats.totalChars} caractères, ${stats.dependencies} dépendances, ${stats.functions} fonctions`,
                'Fermer'
            );
        })
    );

    function getSuggestedMessages(hasSelection: boolean, languageId: string): Array<{
        label: string,
        description: string,
        detail: string,
        message: string,
        custom?: boolean
    }> {
        const baseQuestions = [
            {
                label: '$(question) Explication générale',
                description: 'Que fait ce code ?',
                detail: 'Demande une explication claire du fonctionnement',
                message: 'Analyse ce code en comprenant les dépendances et le flux logique. Explique le fonctionnement sans te fier aux commentaires.'
            },
            {
                label: '$(bug) Recherche de bugs',
                description: 'Y a-t-il des problèmes ?',
                detail: 'Analyse pour trouver des erreurs potentielles',
                message: 'Analyse ce code pour identifier les bugs potentiels en comprenant le contexte complet des dépendances et des appels de fonctions.'
            },
            {
                label: '$(rocket) Optimisation',
                description: 'Comment améliorer ce code ?',
                detail: 'Suggestions pour optimiser les performances et la lisibilité',
                message: 'Analyse ce code et ses dépendances pour suggérer des améliorations de performance, lisibilité et bonnes pratiques.'
            },
            {
                label: '$(search) Analyse profonde',
                description: 'Compréhension complète du code',
                detail: 'Analyse détaillée des relations et du flux logique',
                message: 'Fais une analyse approfondie de ce code en traçant les appels de fonctions, les dépendances et le flux de données. Déduis la logique métier à partir du code réel.'
            }
        ];

        if (hasSelection) {
            return [
                ...baseQuestions,
                {
                    label: '$(symbol-method) Fonction spécifique',
                    description: 'Que fait cette partie exactement ?',
                    detail: 'Focus sur le code sélectionné avec son contexte',
                    message: 'Analyse spécifiquement ce code sélectionné en comprenant comment il s\'intègre dans le contexte global du fichier et des dépendances.'
                },
                {
                    label: '$(git-compare) Alternative',
                    description: 'Comment faire autrement ?',
                    detail: 'Propose des alternatives au code sélectionné',
                    message: 'En comprenant le contexte de ce code sélectionné et ses dépendances, propose des alternatives ou des améliorations.'
                }
            ];
        } else {
            return [
                ...baseQuestions,
                {
                    label: '$(file-code) Architecture',
                    description: 'Structure et organisation',
                    detail: 'Analyse de l\'architecture du fichier',
                    message: 'Analyse l\'architecture de ce fichier en comprenant ses dépendances, ses exports, et comment il s\'intègre dans le projet global.'
                },
                {
                    label: '$(checklist) Code review',
                    description: 'Revue de code complète',
                    detail: 'Évaluation complète avec analyse des dépendances',
                    message: 'Fais une revue de code complète en analysant la qualité, les bonnes pratiques, et les relations avec les dépendances du projet.'
                }
            ];
        }
    }
    
    // Commande pour toggler le contexte complet
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.toggleFullContext', async () => {
            const config = vscode.workspace.getConfiguration('ollama');
            const currentSetting = config.get('useFullContext', true);
            const newSetting = !currentSetting;
            
            await config.update('useFullContext', newSetting, vscode.ConfigurationTarget.Global);
            
            const status = newSetting ? 'activé (analyse avancée)' : 'désactivé (simple)';
            const icon = newSetting ? 'Contexte' : 'Simple';
            
            vscode.window.showInformationMessage(
                `${icon} - Contexte complet ${status}`,
                'Paramètres'
            ).then(selection => {
                if (selection === 'Paramètres') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'ollama.useFullContext');
                }
            });
            
            // Notifier le chatProvider du changement
            chatProvider.updateContextSetting(newSetting);
        })
    );

    // Commande pour toggler le mode prévisualisation
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.togglePreview', async () => {
            const config = vscode.workspace.getConfiguration('ollama');
            const currentSetting = config.get('showPreviewBeforeSending', false);
            const newSetting = !currentSetting;
            
            await config.update('showPreviewBeforeSending', newSetting, vscode.ConfigurationTarget.Global);
            
            const status = newSetting ? 'activé' : 'désactivé';
            const icon = newSetting ? '👁️' : '🚀';
            
            vscode.window.showInformationMessage(
                `${icon} Mode prévisualisation ${status}`,
                'Paramètres'
            ).then(selection => {
                if (selection === 'Paramètres') {
                    vscode.commands.executeCommand('workbench.action.openSettings', 'ollama.showPreviewBeforeSending');
                }
            });
        })
    );

    // Commande pour l'analyse parallèle multi-LLM
    context.subscriptions.push(
        vscode.commands.registerCommand('ollama.parallelAnalysis', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showWarningMessage('Aucun fichier ouvert');
                return;
            }

            const filePath = editor.document.fileName;
            const fileContent = editor.document.getText();
            const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
            
            try {
                vscode.window.showInformationMessage('🚀 Analyse parallèle multi-LLM en cours...');
                
                // D'abord analyser les imports pour l'orchestrateur
                const imports = await analyzeImportsWithCode(fileContent, workspaceFolder, editor.document.languageId);
                const results = await orchestrator.analyzeInParallel(fileContent, imports, filePath);
                
                // Créer un message formaté pour le chat
                const resultMessage = {
                    sender: 'system',
                    content: `🎯 **Analyse Parallèle Multi-LLM Terminée**\n\n` +
                        `**Métriques de Performance:**\n` +
                        `- Temps total: ${results.performance.totalTime}ms\n` +
                        `- Tâches parallèles: ${results.performance.parallelTasks}\n` +
                        `- Efficacité: ${results.performance.efficiency}%\n\n` +
                        `**Analyse Complète:**\n${results.synthesis}`,
                    timestamp: new Date().toISOString()
                };
                
                // Utiliser la méthode privée via réflexion ou créer une méthode publique
                (chatProvider as any).sendMessageToWebview(resultMessage);
                
                vscode.window.showInformationMessage('✅ Analyse parallèle terminée - Résultats dans le chat');
                
            } catch (error) {
                vscode.window.showErrorMessage(`Erreur lors de l'analyse parallèle: ${error}`);
            }
        })
    );

    // Status bar pour indiquer l'état du contexte
    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
    statusBarItem.command = 'ollama.toggleFullContext';
    statusBarItem.tooltip = 'Cliquer pour activer/désactiver l\'analyse avancée du code';
    
    function updateStatusBar() {
        const config = vscode.workspace.getConfiguration('ollama');
        const useFullContext = config.get('useFullContext', true);
        const showPreview = config.get('showPreviewBeforeSending', false);
        
        if (useFullContext) {
            const previewIcon = showPreview ? '$(eye)' : '';
            statusBarItem.text = `${previewIcon}$(search) Ollama Smart`;
            statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.prominentBackground');
        } else {
            const previewIcon = showPreview ? '$(eye)' : '';
            statusBarItem.text = `${previewIcon}$(file-text) Ollama Basic`;
            statusBarItem.backgroundColor = undefined;
        }
        
        // Mettre à jour le tooltip pour inclure les infos de prévisualisation
        const previewStatus = showPreview ? 'Prévisualisation: ON' : 'Prévisualisation: OFF';
        const contextStatus = useFullContext ? 'Mode: Smart Analysis' : 'Mode: Basic';
        statusBarItem.tooltip = `Ollama Integration\n${contextStatus}\n${previewStatus}\n\nClic gauche: Toggle contexte\nClic droit: Toggle prévisualisation`;
    }
    
    updateStatusBar();
    statusBarItem.show();
    
    context.subscriptions.push(statusBarItem);
    
    // Écouter les changements de configuration
    context.subscriptions.push(
        vscode.workspace.onDidChangeConfiguration(e => {
            if (e.affectsConfiguration('ollama.useFullContext') || 
                e.affectsConfiguration('ollama.showPreviewBeforeSending')) {
                updateStatusBar();
                const config = vscode.workspace.getConfiguration('ollama');
                const useFullContext = config.get('useFullContext', true);
                chatProvider.updateContextSetting(useFullContext);
            }
        })
    );
}

// Fonction pour générer un message de prévisualisation
async function generatePreviewMessage(
    editor: vscode.TextEditor, 
    selectedText: string, 
    languageId: string, 
    customMessage: string
): Promise<string> {
    const fileName = path.basename(editor.document.fileName);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    
    try {
        const fullFileContent = editor.document.getText();
        
        // Analyser les imports avec détection automatique
        const imports = await analyzeImportsWithCode(fullFileContent, workspaceFolder, languageId, 3);
        
        // Analyse des appels de fonctions
        const functionCalls = analyzeFunctionCalls(fullFileContent, imports);
        
        // Analyse des variables
        const variables = analyzeVariables(fullFileContent);
        
        // Structure du code
        const lines = fullFileContent.split('\n');
        const codeStructure = analyzeCodeStructure(lines);
        
        const analysis: CodeAnalysis = {
            imports,
            functionCalls,
            variables,
            codeStructure
        };
        
        return buildIntelligentMessage({
            selectedText: selectedText.trim(),
            fullFileContent,
            fileName,
            languageId,
            analysis,
            hasSelection: selectedText.trim().length > 0,
            customMessage
        });
        
    } catch (error) {
        console.error('Erreur lors de la génération du message de prévisualisation:', error);
        return `Erreur lors de la génération de la prévisualisation: ${error}`;
    }
}

// Fonction pour obtenir les statistiques d'un message
function getMessageStats(message: string): {
    totalChars: number;
    totalLines: number;
    codeBlocks: number;
    dependencies: number;
    functions: number;
} {
    const lines = message.split('\n');
    const codeBlockMatches = message.match(/```[\s\S]*?```/g) || [];
    const dependencyMatches = message.match(/\*\*\d+\. Module:/g) || [];
    const functionMatches = message.match(/- `\w+\([^)]*\)`/g) || [];
    
    return {
        totalChars: message.length,
        totalLines: lines.length,
        codeBlocks: codeBlockMatches.length,
        dependencies: dependencyMatches.length,
        functions: functionMatches.length
    };
}

// Fonction pour analyser et afficher un résumé détaillé du contenu qui sera envoyé
function showDetailedAnalysisSummary(analysis: CodeAnalysis, fileName: string): string {
    let summary = `**Résumé de l'analyse pour ${fileName}**\n\n`;
    
    // Statistiques globales
    summary += `**Éléments analysés:**\n`;
    summary += `• ${analysis.imports.length} dépendances locales\n`;
    summary += `• ${analysis.functionCalls.length} appels de fonctions\n`;
    summary += `• ${analysis.variables.length} variables importantes\n`;
    summary += `• ${analysis.codeStructure.length} structures de code\n\n`;
    
    // Détail des dépendances
    if (analysis.imports.length > 0) {
        summary += `**Dépendances incluses:**\n`;
        analysis.imports.forEach((imp, index) => {
            const codeSize = imp.relevantCode ? `${imp.relevantCode.length} chars` : 'code non trouvé';
            summary += `${index + 1}. \`${imp.source}\` (${imp.type}) - ${codeSize}\n`;
            if (imp.dependencies && imp.dependencies.length > 0) {
                summary += `   └─ Sous-dépendances: ${imp.dependencies.join(', ')}\n`;
            }
        });
        summary += '\n';
    }
    
    // Top fonctions appelées
    if (analysis.functionCalls.length > 0) {
        summary += `**Principales fonctions appelées:**\n`;
        analysis.functionCalls.slice(0, 5).forEach(call => {
            const originLabel = call.origin === 'imported' ? '[Importé]' : call.origin === 'local' ? '[Local]' : '[Built-in]';
            summary += `• ${originLabel} \`${call.name}()\` ligne ${call.line}\n`;
        });
        summary += '\n';
    }
    
    // Variables les plus utilisées
    if (analysis.variables.length > 0) {
        const topVars = analysis.variables
            .filter(v => v.usages > 1)
            .sort((a, b) => b.usages - a.usages)
            .slice(0, 3);
            
        if (topVars.length > 0) {
            summary += `**Variables les plus utilisées:**\n`;
            topVars.forEach(variable => {
                summary += `• \`${variable.name}\` (${variable.type}) - ${variable.usages} usages\n`;
            });
            summary += '\n';
        }
    }
    
    return summary;
}

// Fonction avec analyse avancée
async function sendWithAdvancedAnalysis(
    editor: vscode.TextEditor, 
    selectedText: string, 
    languageId: string, 
    customMessage: string,
    chatProvider: OllamaChatViewProvider
) {
    const fileName = path.basename(editor.document.fileName);
    const workspaceFolder = vscode.workspace.getWorkspaceFolder(editor.document.uri);
    
    try {
        await vscode.window.withProgress({
            location: vscode.ProgressLocation.Notification,
            title: "Analyse intelligente avec dépendances...",
            cancellable: false
        }, async (progress) => {
            progress.report({ increment: 10, message: "Lecture du fichier principal..." });
            const fullFileContent = editor.document.getText();
            
            // Debug de l'analyse des imports
            await debugAnalyzeImports(fullFileContent, workspaceFolder, languageId);
            
            progress.report({ increment: 15, message: "Détection des dépendances locales..." });
            // Analyser les imports avec détection automatique
            const imports = await analyzeImportsWithCode(fullFileContent, workspaceFolder, languageId, 3);
            
            console.log(`Imports analysés: ${imports.length}`);
            imports.forEach(imp => {
                console.log(`- ${imp.source}: ${imp.relevantCode ? 'CODE OK' : 'PAS DE CODE'}`);
            });
            
            progress.report({ increment: 30, message: `Analyse de ${imports.length} dépendances trouvées...` });
            
            progress.report({ increment: 20, message: "Analyse des appels de fonctions..." });
            const functionCalls = analyzeFunctionCalls(fullFileContent, imports);
            
            progress.report({ increment: 15, message: "Analyse des variables..." });
            const variables = analyzeVariables(fullFileContent);
            
            progress.report({ increment: 10, message: "Construction du message intelligent..." });
            const lines = fullFileContent.split('\n');
            const codeStructure = analyzeCodeStructure(lines);
            
            const analysis: CodeAnalysis = {
                imports,
                functionCalls,
                variables,
                codeStructure
            };
            
            const intelligentMessage = buildIntelligentMessage({
                selectedText: selectedText.trim(),
                fullFileContent,
                fileName,
                languageId,
                analysis,
                hasSelection: selectedText.trim().length > 0,
                customMessage
            });
            
            // Vérifier si l'utilisateur veut une prévisualisation
            const config = vscode.workspace.getConfiguration('ollama');
            const showPreview = config.get('showPreviewBeforeSending', false);
            
            if (showPreview) {
                const stats = getMessageStats(intelligentMessage);
                const analysisSummary = showDetailedAnalysisSummary(analysis, fileName);
                
                const choice = await vscode.window.showInformationMessage(
                    `Prêt à envoyer: ${stats.totalChars} caractères, ${stats.dependencies} dépendances, ${stats.functions} fonctions`,
                    { modal: true },
                    'Envoyer',
                    'Prévisualiser',
                    'Résumé',
                    'Annuler'
                );
                
                if (choice === 'Prévisualiser') {
                    // Afficher la prévisualisation complète dans un document temporaire
                    const fullPreviewContent = `${analysisSummary}\n\n---\n\n# Message qui sera envoyé à Ollama\n\n${intelligentMessage}`;
                    const previewDoc = await vscode.workspace.openTextDocument({
                        content: fullPreviewContent,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(previewDoc, vscode.ViewColumn.Beside);
                    
                    // Demander confirmation après prévisualisation
                    const confirmChoice = await vscode.window.showInformationMessage(
                        'Envoyer ce message à Ollama ?',
                        { modal: true },
                        'Envoyer',
                        'Annuler'
                    );
                    
                    if (confirmChoice !== 'Envoyer') {
                        return;
                    }
                } else if (choice === 'Résumé') {
                    // Afficher seulement le résumé de l'analyse
                    const summaryDoc = await vscode.workspace.openTextDocument({
                        content: analysisSummary,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(summaryDoc, vscode.ViewColumn.Beside);
                    
                    // Demander confirmation après avoir vu le résumé
                    const confirmChoice = await vscode.window.showInformationMessage(
                        'Envoyer le message complet à Ollama ?',
                        { modal: true },
                        'Envoyer',
                        'Prévisualiser d\'abord',
                        'Annuler'
                    );
                    
                    if (confirmChoice === 'Prévisualiser d\'abord') {
                        // Montrer la prévisualisation complète
                        const fullPreviewContent = `${analysisSummary}\n\n---\n\n# Message qui sera envoyé à Ollama\n\n${intelligentMessage}`;
                        const previewDoc = await vscode.workspace.openTextDocument({
                            content: fullPreviewContent,
                            language: 'markdown'
                        });
                        await vscode.window.showTextDocument(previewDoc, vscode.ViewColumn.Beside);
                        
                        const finalChoice = await vscode.window.showInformationMessage(
                            'Envoyer ce message à Ollama ?',
                            { modal: true },
                            'Envoyer',
                            'Annuler'
                        );
                        
                        if (finalChoice !== 'Envoyer') {
                            return;
                        }
                    } else if (confirmChoice !== 'Envoyer') {
                        return;
                    }
                } else if (choice !== 'Envoyer') {
                    return;
                }
            }
            
            chatProvider.addUserMessage(intelligentMessage);
        });
        
    } catch (error) {
        console.error('Erreur lors de l\'analyse avancée:', error);
        vscode.window.showWarningMessage('Erreur lors de l\'analyse, passage en mode simple');
        await sendSimpleCode(selectedText, languageId, customMessage, chatProvider);
    }
}

// Détection intelligente des dépendances locales vs externes
function isLocalDependency(importPath: string, workspaceFolder: vscode.WorkspaceFolder | undefined): boolean {
    // Chemins relatifs = toujours locaux
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        return true;
    }
    
    // Si c'est un nom simple sans slash et qu'on a un workspace, vérifier s'il existe
    if (workspaceFolder && !importPath.includes('/') && !importPath.includes('node_modules')) {
        const srcPath = path.join(workspaceFolder.uri.fsPath, 'src');
        const possiblePaths = [
            path.join(srcPath, importPath + '.ts'),
            path.join(srcPath, importPath + '.js'),
            path.join(srcPath, importPath, 'index.ts'),
            path.join(srcPath, importPath, 'index.js'),
            path.join(workspaceFolder.uri.fsPath, importPath + '.ts'),
            path.join(workspaceFolder.uri.fsPath, importPath + '.js')
        ];
        
        for (const possiblePath of possiblePaths) {
            if (fs.existsSync(possiblePath)) {
                return true;
            }
        }
    }
    
    // Chemins absolus commençant par le nom du workspace
    if (workspaceFolder) {
        const workspaceName = path.basename(workspaceFolder.uri.fsPath);
        if (importPath.startsWith(workspaceName) || importPath.startsWith(`@${workspaceName}`)) {
            return true;
        }
    }
    
    // Si ça ne match aucun pattern local, c'est externe
    return false;
}

// Analyse avec file d'attente et détection automatique
async function analyzeImportsWithCode(
    text: string, 
    workspaceFolder: vscode.WorkspaceFolder | undefined, 
    languageId: string,
    maxDepth: number = 3
): Promise<ImportInfo[]> {
    const queue: DependencyAnalysisQueue = {
        pending: [],
        processing: new Set(),
        analyzed: new Map(),
        maxDepth,
        currentDepth: 0
    };

    // Analyser le fichier initial
    const initialImports = extractImportsFromText(text, languageId);
    
    // Filtrer pour ne garder que les dépendances locales
    const localImports = initialImports.filter(imp => 
        isLocalDependency(imp.source, workspaceFolder)
    );

    // Ajouter à la file d'attente
    queue.pending.push(...localImports);
    
    // Traiter la file d'attente
    const results: ImportInfo[] = [];
    
    while (queue.pending.length > 0 && queue.currentDepth < queue.maxDepth) {
        const batch = queue.pending.splice(0, 5); // Traiter par lots de 5
        
        await Promise.all(batch.map(async (importInfo) => {
            if (queue.processing.has(importInfo.source) || 
                queue.analyzed.has(importInfo.source)) {
                return;
            }
            
            queue.processing.add(importInfo.source);
            
            try {
                const enrichedImport = await processImportWithDependencies(
                    importInfo, 
                    workspaceFolder, 
                    languageId, 
                    queue
                );
                
                if (enrichedImport) {
                    queue.analyzed.set(importInfo.source, enrichedImport);
                    results.push(enrichedImport);
                }
            } catch (error) {
                console.warn(`Erreur lors de l'analyse de ${importInfo.source}:`, error);
            } finally {
                queue.processing.delete(importInfo.source);
            }
        }));
        
        queue.currentDepth++;
    }
    
    return results;
}

// Extraction des imports depuis le texte
function extractImportsFromText(text: string, languageId: string): ImportInfo[] {
    const imports: ImportInfo[] = [];
    let match: RegExpExecArray | null;
    
    switch (languageId) {
        case 'javascript':
        case 'typescript':
        case 'javascriptreact':
        case 'typescriptreact':
            // Import nommés: import { a, b } from 'module'
            const namedImportRegex = /import\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
            while ((match = namedImportRegex.exec(text)) !== null) {
                const importNames = match[1].split(',').map(name => name.trim().replace(/\s+as\s+\w+/g, ''));
                imports.push({
                    source: match[2],
                    imports: importNames,
                    type: 'named'
                });
            }
            
            // Import par défaut: import Module from 'module'
            const defaultImportRegex = /import\s+(\w+)\s+from\s*['"]([^'"]+)['"]/g;
            while ((match = defaultImportRegex.exec(text)) !== null) {
                imports.push({
                    source: match[2],
                    imports: [match[1]],
                    type: 'default'
                });
            }
            
            // Import namespace: import * as Module from 'module'
            const namespaceImportRegex = /import\s*\*\s*as\s+(\w+)\s*from\s*['"]([^'"]+)['"]/g;
            while ((match = namespaceImportRegex.exec(text)) !== null) {
                imports.push({
                    source: match[2],
                    imports: [match[1]],
                    type: 'namespace'
                });
            }
            
            // Import mixte: import Module, { a, b } from 'module'
            const mixedImportRegex = /import\s+(\w+)\s*,\s*\{\s*([^}]+)\s*\}\s*from\s*['"]([^'"]+)['"]/g;
            while ((match = mixedImportRegex.exec(text)) !== null) {
                const namedImports = match[2].split(',').map(name => name.trim());
                imports.push({
                    source: match[3],
                    imports: [match[1], ...namedImports],
                    type: 'named'
                });
            }
            
            // Require (CommonJS)
            const requireRegex = /(?:const|let|var)\s+(?:\{([^}]+)\}|(\w+))\s*=\s*require\(['"]([^'"]+)['"]\)/g;
            while ((match = requireRegex.exec(text)) !== null) {
                if (match[1]) {
                    const importNames = match[1].split(',').map(name => name.trim());
                    imports.push({
                        source: match[3],
                        imports: importNames,
                        type: 'named'
                    });
                } else if (match[2]) {
                    imports.push({
                        source: match[3],
                        imports: [match[2]],
                        type: 'default'
                    });
                }
            }
            break;
            
        case 'python':
            // from module import func1, func2
            const pythonFromImportRegex = /from\s+(\S+)\s+import\s+([^#\n]+)/g;
            while ((match = pythonFromImportRegex.exec(text)) !== null) {
                const importNames = match[2].split(',').map(name => name.trim());
                imports.push({
                    source: match[1],
                    imports: importNames,
                    type: 'named'
                });
            }
            
            // import module
            const pythonImportRegex = /^import\s+(\S+)/gm;
            while ((match = pythonImportRegex.exec(text)) !== null) {
                imports.push({
                    source: match[1],
                    imports: [match[1]],
                    type: 'default'
                });
            }
            break;
    }
    
    // Debug: afficher les imports trouvés
    console.log(`Imports trouvés dans le fichier:`, imports);
    
    return imports;
}

// Ajouter une fonction de debug pour l'analyse
async function debugAnalyzeImports(
    text: string, 
    workspaceFolder: vscode.WorkspaceFolder | undefined, 
    languageId: string
): Promise<void> {
    console.log('=== DEBUG ANALYSE IMPORTS ===');
    console.log('Workspace:', workspaceFolder?.uri.fsPath);
    
    const allImports = extractImportsFromText(text, languageId);
    console.log('Tous les imports trouvés:', allImports);
    
    // Tester spécifiquement les imports relatifs
    const relativeImports = allImports.filter(imp => imp.source.startsWith('./') || imp.source.startsWith('../'));
    console.log('Imports relatifs:', relativeImports);
    
    const localImports = allImports.filter(imp => {
        const isLocal = isLocalDependency(imp.source, workspaceFolder);
        console.log(`Import "${imp.source}" -> local: ${isLocal}`);
        return isLocal;
    });
    
    console.log('Imports locaux filtrés:', localImports);
    
    // Tester la résolution pour chaque import local
    for (const imp of localImports) {
        console.log(`\n--- Résolution de "${imp.source}" ---`);
        const resolvedPath = await resolveLocalFile(imp.source, workspaceFolder, languageId);
        console.log(`Résolution "${imp.source}" -> "${resolvedPath}"`);
        
        if (resolvedPath && fs.existsSync(resolvedPath)) {
            console.log(`✓ Fichier existe: ${resolvedPath}`);
            const content = fs.readFileSync(resolvedPath, 'utf8');
            console.log(`Taille du fichier: ${content.length} caractères`);
            
            // Tester l'extraction du code
            const relevantCode = await extractRelevantCode(resolvedPath, imp.imports, languageId);
            console.log(`Code extrait pour "${imp.source}" (${relevantCode.length} chars)`);
            if (relevantCode.length > 0) {
                console.log(`Aperçu du code extrait:`, relevantCode.slice(0, 300) + '...');
            } else {
                console.log(`Aucun code extrait pour "${imp.source}"`);
            }
        } else {
            console.log(`✗ Fichier non trouvé: ${resolvedPath}`);
        }
    }
    
    console.log('=== FIN DEBUG ===');
}

// Traitement d'un import avec ses dépendances
async function processImportWithDependencies(
    importInfo: ImportInfo,
    workspaceFolder: vscode.WorkspaceFolder | undefined,
    languageId: string,
    queue: DependencyAnalysisQueue
): Promise<ImportInfo | null> {
    const filePath = await resolveLocalFile(importInfo.source, workspaceFolder, languageId);
    
    if (!filePath) {
        return null;
    }
    
    try {
        const fileContent = fs.readFileSync(filePath, 'utf8');
        
        // Extraire le code pertinent
        const relevantCode = await extractRelevantCode(filePath, importInfo.imports, languageId);
        console.log(`Extraction code pour "${importInfo.source}": ${relevantCode.length} caractères`);
        
        if (relevantCode.length === 0) {
            console.log(`Aucun code pertinent extrait pour "${importInfo.source}" avec imports:`, importInfo.imports);
        } else {
            console.log(`Code extrait avec succès pour "${importInfo.source}"`);
        }
        
        // Découvrir les dépendances de ce fichier
        const subImports = extractImportsFromText(fileContent, languageId);
        const localSubImports = subImports.filter(imp => 
            isLocalDependency(imp.source, workspaceFolder) &&
            !queue.analyzed.has(imp.source) &&
            !queue.processing.has(imp.source)
        );
        
        // Ajouter les nouvelles dépendances à la file d'attente si on n'a pas atteint la profondeur max
        if (queue.currentDepth < queue.maxDepth) {
            queue.pending.push(...localSubImports);
        }
        
        return {
            ...importInfo,
            localPath: filePath,
            relevantCode: relevantCode,
            dependencies: localSubImports.map(imp => imp.source) // Référence aux dépendances trouvées
        };
        
    } catch (error) {
        console.error(`Erreur lors de la lecture de ${filePath}:`, error);
        return null;
    }
}

// Analyse des appels de fonctions avec contexte
function analyzeFunctionCalls(text: string, imports: ImportInfo[]): FunctionCall[] {
    const calls: FunctionCall[] = [];
    const lines = text.split('\n');
    
    // Créer une map des fonctions importées
    const importedFunctions = new Set<string>();
    imports.forEach(imp => {
        imp.imports.forEach(name => importedFunctions.add(name));
    });
    
    // Pattern pour détecter les appels de fonction
    const functionCallRegex = /(\w+(?:\.\w+)*)\s*\(\s*([^)]*)\s*\)/g;
    
    lines.forEach((line, index) => {
        let match;
        while ((match = functionCallRegex.exec(line)) !== null) {
            const functionName = match[1];
            const parameters = match[2] ? match[2].split(',').map(p => p.trim()) : [];
            
            let origin: 'local' | 'imported' | 'builtin' = 'local';
            
            if (importedFunctions.has(functionName.split('.')[0])) {
                origin = 'imported';
            } else if (isBuiltinFunction(functionName, 'javascript')) {
                origin = 'builtin';
            }
            
            calls.push({
                name: functionName,
                line: index + 1,
                context: line.trim(),
                parameters,
                origin,
                definition: findFunctionDefinition(functionName, text)
            });
        }
    });
    
    return calls;
}

// Analyse des variables importantes
function analyzeVariables(text: string): VariableInfo[] {
    const variables: VariableInfo[] = [];
    const lines = text.split('\n');
    
    // Pattern pour les déclarations de variables
    const varRegex = /(?:let|const|var)\s+(\w+)(?:\s*:\s*([^=]+))?/g;
    
    lines.forEach((line, index) => {
        let match;
        while ((match = varRegex.exec(line)) !== null) {
            const varName = match[1];
            const varType = match[2] || 'any';
            
            // Compter les usages
            const usageRegex = new RegExp(`\\b${varName}\\b`, 'g');
            const usages = (text.match(usageRegex) || []).length - 1; // -1 pour la déclaration
            
            variables.push({
                name: varName,
                type: varType.trim(),
                line: index + 1,
                usages
            });
        }
    });
    
    return variables.filter(v => v.usages > 0); // Garder seulement les variables utilisées
}

// Analyse de la structure du code
function analyzeCodeStructure(lines: string[]): string[] {
    const structure: string[] = [];
    
    lines.forEach((line, index) => {
        const trimmed = line.trim();
        
        // Fonctions
        if (trimmed.includes('function') || trimmed.match(/^\w+\s*\(/)) {
            structure.push(`Fonction ligne ${index + 1}: ${trimmed}`);
        }
        
        // Classes
        if (trimmed.startsWith('class ')) {
            structure.push(`Classe ligne ${index + 1}: ${trimmed}`);
        }
        
        // Structures de contrôle importantes
        if (trimmed.startsWith('if') || trimmed.startsWith('for') || trimmed.startsWith('while')) {
            structure.push(`Structure ligne ${index + 1}: ${trimmed}`);
        }
    });
    
    return structure;
}

// Fonctions pour récupérer les informations de hover et contextuelles
async function getHoverInfoAtPosition(
    document: vscode.TextDocument, 
    position: vscode.Position
): Promise<string> {
    try {
        // Récupérer les infos de hover
        const hovers = await vscode.commands.executeCommand(
            'vscode.executeHoverProvider',
            document.uri,
            position
        ) as vscode.Hover[];

        if (hovers && hovers.length > 0) {
            const hoverContents = hovers.map(hover => {
                return hover.contents.map(content => {
                    if (typeof content === 'string') {
                        return content;
                    } else if (content instanceof vscode.MarkdownString) {
                        return content.value;
                    }
                    return '';
                }).join('\n');
            }).join('\n---\n');

            return hoverContents;
        }

        return '';
    } catch (error) {
        console.error('Erreur lors de la récupération du hover:', error);
        return '';
    }
}

// Fonction pour obtenir toutes les infos contextuelles d'une position
async function getContextualInfoAtPosition(
    document: vscode.TextDocument,
    position: vscode.Position
): Promise<{
    hover: string;
    definition: vscode.Location[];
    typeDefinition: vscode.Location[];
    references: vscode.Location[];
}> {
    const [hover, definition, typeDefinition, references] = await Promise.all([
        getHoverInfoAtPosition(document, position),
        vscode.commands.executeCommand(
            'vscode.executeDefinitionProvider',
            document.uri,
            position
        ) as Promise<vscode.Location[]>,
        vscode.commands.executeCommand(
            'vscode.executeTypeDefinitionProvider',
            document.uri,
            position
        ) as Promise<vscode.Location[]>,
        vscode.commands.executeCommand(
            'vscode.executeReferenceProvider',
            document.uri,
            position
        ) as Promise<vscode.Location[]>
    ]);

    return {
        hover: hover || '',
        definition: definition || [],
        typeDefinition: typeDefinition || [],
        references: references || []
    };
}

// Utilitaires
async function resolveLocalFile(
    importPath: string, 
    workspaceFolder: vscode.WorkspaceFolder | undefined, 
    languageId: string
): Promise<string | undefined> {
    if (!workspaceFolder) {
        console.log('✗ Pas de workspace folder défini');
        return undefined;
    }
    
    console.log(`Résolution de "${importPath}" dans workspace: ${workspaceFolder.uri.fsPath}`);
    
    const extensions = ['.ts', '.js', '.tsx', '.jsx'];
    const indexFiles = ['/index.ts', '/index.js', '/index.tsx', '/index.jsx'];
    
    // Détecter le bon workspace folder - chercher où se trouve extension.ts
    let actualWorkspaceRoot = workspaceFolder.uri.fsPath;
    
    // Fonction pour scanner récursivement les sous-dossiers
    function findProjectRoot(basePath: string, maxDepth: number = 2): string | null {
        if (maxDepth <= 0) return null;
        
        try {
            const srcPath = path.join(basePath, 'src');
            const packageJsonPath = path.join(basePath, 'package.json');
            const extensionTsPath = path.join(srcPath, 'extension.ts');
            
            if (fs.existsSync(srcPath) && fs.existsSync(packageJsonPath) && fs.existsSync(extensionTsPath)) {
                return basePath;
            }
            
            // Chercher dans les sous-dossiers
            const entries = fs.readdirSync(basePath, { withFileTypes: true });
            for (const entry of entries) {
                if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
                    const subPath = path.join(basePath, entry.name);
                    const found = findProjectRoot(subPath, maxDepth - 1);
                    if (found) return found;
                }
            }
        } catch (error) {
            console.log(`Erreur lors de la recherche dans ${basePath}:`, error);
        }
        
        return null;
    }
    
    // Chercher la racine du projet
    const foundRoot = findProjectRoot(actualWorkspaceRoot);
    if (foundRoot) {
        actualWorkspaceRoot = foundRoot;
        console.log(`✓ Workspace racine détecté dynamiquement: ${actualWorkspaceRoot}`);
    } else {
        console.log(`✗ Impossible de trouver la racine du projet depuis: ${actualWorkspaceRoot}`);
    }
    
    // Pour les imports relatifs depuis extension.ts (qui est dans src/)
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        // Le fichier extension.ts est dans src/, donc les imports relatifs partent de src/
        const srcPath = path.join(actualWorkspaceRoot, 'src');
        
        console.log(`Import relatif depuis src/: ${srcPath}`);
        
        // Essayer avec les extensions
        for (const ext of extensions) {
            const fullPath = path.resolve(srcPath, importPath + ext);
            console.log(`Test: ${fullPath}`);
            if (fs.existsSync(fullPath)) {
                console.log(`✓ Fichier trouvé: ${fullPath}`);
                return fullPath;
            }
        }
        
        // Essayer avec index files
        for (const indexFile of indexFiles) {
            const fullPath = path.resolve(srcPath, importPath + indexFile);
            console.log(`Test index: ${fullPath}`);
            if (fs.existsSync(fullPath)) {
                console.log(`✓ Index file trouvé: ${fullPath}`);
                return fullPath;
            }
        }
    } else {
        // Pour les imports non-relatifs, chercher dans plusieurs endroits
        const searchPaths = [
            path.join(actualWorkspaceRoot, 'src'),
            actualWorkspaceRoot,
            path.join(actualWorkspaceRoot, 'lib'),
            path.join(actualWorkspaceRoot, 'dist')
        ];
        
        for (const searchPath of searchPaths) {
            console.log(`Recherche dans: ${searchPath}`);
            
            // Essayer directement
            for (const ext of extensions) {
                const fullPath = path.join(searchPath, importPath + ext);
                console.log(`Test: ${fullPath}`);
                if (fs.existsSync(fullPath)) {
                    console.log(`✓ Fichier trouvé: ${fullPath}`);
                    return fullPath;
                }
            }
            
            // Essayer avec index files
            for (const indexFile of indexFiles) {
                const fullPath = path.join(searchPath, importPath + indexFile);
                console.log(`Test index: ${fullPath}`);
                if (fs.existsSync(fullPath)) {
                    console.log(`✓ Index file trouvé: ${fullPath}`);
                    return fullPath;
                }
            }
        }
    }
    
    console.log(`✗ Aucun fichier trouvé pour: ${importPath}`);
    return undefined;
}

async function extractRelevantCode(filePath: string, importNames: string[], languageId: string): Promise<string> {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Lecture fichier "${filePath}": ${content.length} caractères`);
        console.log(`Recherche des imports:`, importNames);
        
        // Si on importe tout (* as) ou c'est un import par défaut, prendre tout le fichier (avec limite plus généreuse)
        if (importNames.length === 1 && (importNames[0].includes('*') || importNames[0] === 'default')) {
            console.log(`Import global détecté, retour du fichier complet (tronqué à 15000 chars)`);
            return content.slice(0, 15000);
        }
        
        const lines = content.split('\n');
        const relevantLines = new Set<number>();
        
        // Pour chaque import, chercher la classe/fonction complète
        importNames.forEach(name => {
            console.log(`Recherche de "${name}" dans le fichier...`);
            let foundForThisImport = false;
            
            lines.forEach((line, index) => {
                // Chercher spécifiquement les exports de classes
                if (line.includes('export') && line.includes(`class ${name}`)) {
                    console.log(`Export de classe trouvé pour "${name}" ligne ${index + 1}: ${line.trim()}`);
                    foundForThisImport = true;
                    
                    // Pour une classe, extraire tout jusqu'à la fin de la classe
                    const classEnd = findClassEnd(lines, index);
                    console.log(`Classe "${name}" s'étend de la ligne ${index + 1} à ${classEnd + 1}`);
                    
                    // Ajouter toutes les lignes de la classe + un peu de contexte
                    const start = Math.max(0, index - 3);
                    const end = Math.min(lines.length - 1, classEnd + 2);
                    for (let i = start; i <= end; i++) {
                        relevantLines.add(i);
                    }
                }
                // Chercher les autres types d'exports
                else if (line.includes('export') && (
                    line.includes(`export function ${name}`) ||
                    line.includes(`export const ${name}`) ||
                    line.includes(`export let ${name}`) ||
                    line.includes(`export var ${name}`) ||
                    line.includes(`export { ${name}`) ||
                    line.includes(`export {${name}`) ||
                    line.includes(`${name}:`) ||
                    line.includes(`${name},`) ||
                    line.includes(`${name} }`)
                )) {
                    console.log(`Export trouvé pour "${name}" ligne ${index + 1}: ${line.trim()}`);
                    foundForThisImport = true;
                    
                    // Pour les fonctions, prendre plus de contexte
                    const start = Math.max(0, index - 2);
                    const end = Math.min(lines.length - 1, index + 50); // Plus de contexte pour les fonctions
                    for (let i = start; i <= end; i++) {
                        relevantLines.add(i);
                    }
                }
                // Chercher les définitions de classe/fonction (sans export)
                else if (line.includes(`class ${name}`) || 
                    line.includes(`function ${name}`) ||
                    line.includes(`const ${name}`) ||
                    line.includes(`let ${name}`) ||
                    line.includes(`var ${name}`)) {
                    console.log(`Définition trouvée pour "${name}" ligne ${index + 1}: ${line.trim()}`);
                    foundForThisImport = true;
                    
                    if (line.includes(`class ${name}`)) {
                        // Pour une classe, extraire tout
                        const classEnd = findClassEnd(lines, index);
                        const start = Math.max(0, index - 1);
                        const end = Math.min(lines.length - 1, classEnd + 1);
                        for (let i = start; i <= end; i++) {
                            relevantLines.add(i);
                        }
                    } else {
                        // Pour les autres, plus de contexte
                        const start = Math.max(0, index - 1);
                        const end = Math.min(lines.length - 1, index + 30);
                        for (let i = start; i <= end; i++) {
                            relevantLines.add(i);
                        }
                    }
                }
            });
            
            if (!foundForThisImport) {
                console.log(`Aucune définition trouvée pour "${name}"`);
            }
        });
        
        console.log(`Lignes pertinentes trouvées: ${relevantLines.size}`);
        
        // Si on n'a rien trouvé de spécifique, prendre tout le fichier (avec limite plus généreuse)
        if (relevantLines.size === 0) {
            console.log(`Aucune ligne spécifique trouvée, retour du fichier complet (10000 chars)`);
            return content.slice(0, 10000);
        }
        
        // Convertir en tableau trié et extraire les lignes
        const sortedLines = Array.from(relevantLines).sort((a, b) => a - b);
        const extractedLines = sortedLines.map(i => lines[i]);
        const result = extractedLines.join('\n');
        
        // Limite plus généreuse pour le code extrait (20000 caractères au lieu de 4000)
        const finalResult = result.slice(0, 20000);
        
        console.log(`Code extrait: ${finalResult.length} caractères depuis ${sortedLines.length} lignes`);
        
        // Si on a atteint la limite, l'indiquer
        if (result.length > 20000) {
            console.log(`Code tronqué: ${result.length} caractères disponibles, ${finalResult.length} retenus`);
        }
        
        return finalResult;
    } catch (error) {
        console.error(`Erreur lors de l'extraction du code de ${filePath}:`, error);
        return '';
    }
}

// Nouvelle fonction pour trouver la fin d'une classe
function findClassEnd(lines: string[], classStartIndex: number): number {
    let braceCount = 0;
    let foundOpeningBrace = false;
    
    for (let i = classStartIndex; i < lines.length; i++) {
        const line = lines[i];
        
        // Compter les accolades
        for (const char of line) {
            if (char === '{') {
                braceCount++;
                foundOpeningBrace = true;
            } else if (char === '}') {
                braceCount--;
                
                // Si on revient à 0 après avoir trouvé l'accolade ouvrante, c'est la fin de la classe
                if (foundOpeningBrace && braceCount === 0) {
                    return i;
                }
            }
        }
    }
    
    // Si on n'a pas trouvé la fin, retourner la fin du fichier
    return lines.length - 1;
}

function findFunctionDefinition(functionName: string, text: string): string | undefined {
    const funcRegex = new RegExp(`function\\s+${functionName}\\s*\\([^)]*\\)|${functionName}\\s*[:=]\\s*\\([^)]*\\)\\s*=>`, 'g');
    const match = funcRegex.exec(text);
    return match ? match[0] : undefined;
}

function isBuiltinFunction(functionName: string, languageId: string): boolean {
    const builtins = {
        javascript: ['console.log', 'parseInt', 'parseFloat', 'setTimeout', 'setInterval', 'JSON.parse', 'JSON.stringify'],
        python: ['print', 'len', 'range', 'enumerate', 'zip', 'map', 'filter', 'str', 'int', 'float'],
        java: ['System.out.println', 'Math.max', 'Math.min', 'String.valueOf', 'Integer.parseInt']
    };
    
    const langBuiltins = builtins[languageId as keyof typeof builtins] || [];
    return langBuiltins.some(builtin => functionName.startsWith(builtin));
}

// Construction du message intelligent
function buildIntelligentMessage(context: {
    selectedText: string,
    fullFileContent: string,
    fileName: string,
    languageId: string,
    analysis: CodeAnalysis,
    hasSelection: boolean,
    customMessage: string
}): string {
    let message = `**Analyse intelligente du code ${context.languageId}**\n\n`;
    
    // Code sélectionné si présent
    if (context.hasSelection) {
        message += `**Code sélectionné dans ${context.fileName} :**\n`;
        message += `\`\`\`${context.languageId}\n${context.selectedText}\n\`\`\`\n\n`;
    }
    
    // Fichier complet
    message += `**Fichier complet (${context.fileName}) :**\n`;
    message += `\`\`\`${context.languageId}\n${context.fullFileContent}\n\`\`\`\n\n`;
    
    // Dépendances avec leur code réel (triées par pertinence)
    if (context.analysis.imports.length > 0) {
        message += `**Dépendances locales analysées (${context.analysis.imports.length} trouvées) :**\n`;
        
        context.analysis.imports.forEach((imp, index) => {
            message += `\n**${index + 1}. Module: \`${imp.source}\`** (${imp.type})\n`;
            message += `   Imports: ${imp.imports.join(', ')}\n`;
            
            if (imp.dependencies && imp.dependencies.length > 0) {
                message += `   Dépendances: ${imp.dependencies.join(', ')}\n`;
            }
            
            if (imp.relevantCode) {
                message += `   **Code implémentation :**\n`;
                message += `\`\`\`${context.languageId}\n${imp.relevantCode}\n\`\`\`\n`;
            }
        });
        message += '\n';
    }
    
    // Appels de fonctions avec contexte
    if (context.analysis.functionCalls.length > 0) {
        message += `**Appels de fonctions détectés :**\n`;
        context.analysis.functionCalls.slice(0, 10).forEach(call => {
            const originLabel = call.origin === 'local' ? 'local' : call.origin === 'imported' ? 'importé' : 'builtin';
            message += `- \`${call.name}(${call.parameters.join(', ')})\` ligne ${call.line} (${originLabel})\n`;
            if (call.definition) {
                message += `  Définition: \`${call.definition}\`\n`;
            }
        });
        message += '\n';
    }
    
    // Variables importantes
    if (context.analysis.variables.length > 0) {
        message += `**Variables clés :**\n`;
        context.analysis.variables
            .filter(v => v.usages > 1)
            .slice(0, 8)
            .forEach(variable => {
                message += `- \`${variable.name}\` (${variable.type}) - utilisée ${variable.usages} fois\n`;
            });
        message += '\n';
    }
    
    // Structure du code
    if (context.analysis.codeStructure.length > 0) {
        message += `**Structure du code :**\n`;
        context.analysis.codeStructure.slice(0, 5).forEach(struct => {
            message += `- ${struct}\n`;
        });
        message += '\n';
    }
    
    // Question avec instruction d'analyse intelligente
    message += `**Analyse demandée :**\n${context.customMessage}\n\n`;
    message += `**Instructions :** Tu as maintenant accès au code complet avec toutes ses dépendances locales réelles. Analyse ce code en te basant sur les implémentations concrètes, les appels de fonctions et le flux logique. Déduis le fonctionnement à partir du code lui-même, trace les relations entre les modules et explique la logique métier.`;
    
    return message;
}

// Fonction simple inchangée
async function sendSimpleCode(
    selectedText: string, 
    languageId: string, 
    customMessage: string,
    chatProvider: OllamaChatViewProvider
) {
    const message = `${customMessage}\n\nVoici du code ${languageId}:\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;
    chatProvider.addUserMessage(message);
}

export function deactivate() {}