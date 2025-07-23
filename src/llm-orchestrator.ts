import * as vscode from 'vscode';
import { OllamaService } from './ollamaService';
import { ImportInfo } from './extension';

interface LLMTask {
    id: string;
    type: 'import-analysis' | 'content-analysis' | 'structure-analysis' | 'dependency-tree' | 'synthesis';
    input: any;
    result?: any;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    llmInstance?: string;
    priority: number;
    startTime?: number;
    endTime?: number;
}

interface LLMWorker {
    id: string;
    type: string;
    specialization: string;
    modelFile: string;
    isAvailable: boolean;
    currentTask?: string;
    service: OllamaService;
    completedTasks: number;
    averageTime: number;
}

interface ParallelAnalysisResult {
    mainContent: any;
    globalStructure: any;
    importAnalyses: any[];
    dependencyTree: any;
    synthesis: string;
    performance: {
        totalTime: number;
        parallelTasks: number;
        efficiency: number;
    };
}

export class LLMOrchestrator {
    private workers: Map<string, LLMWorker> = new Map();
    private taskQueue: LLMTask[] = [];
    private results: Map<string, any> = new Map();
    private isInitialized: boolean = false;
    
    constructor() {}
    
    async initialize(): Promise<void> {
        if (this.isInitialized) return;
        
        console.log('🚀 Initialisation de l\'orchestrateur multi-LLM...');
        
        try {
            await this.createSpecializedWorkers();
            await this.validateWorkers();
            this.isInitialized = true;
            console.log('✅ Orchestrateur multi-LLM initialisé avec succès');
        } catch (error) {
            console.error('❌ Erreur lors de l\'initialisation:', error);
            throw error;
        }
    }
    
    private async createSpecializedWorkers(): Promise<void> {
        const workerConfigs = [
            {
                id: 'import-analyzer-1',
                type: 'import-analysis',
                specialization: 'Analyse des imports et dépendances',
                modelFile: `FROM codellama:7b
SYSTEM Tu es un expert en analyse d'imports et dépendances JavaScript/TypeScript.
Analyse les imports fournis et réponds UNIQUEMENT en JSON avec cette structure:
{
  "importType": "named|default|namespace",
  "dependencies": ["dep1", "dep2"],
  "complexity": 1-10,
  "purpose": "description courte",
  "risks": ["risk1", "risk2"],
  "suggestions": ["suggestion1"]
}
Sois concis et précis.
PARAMETER temperature 0.1
PARAMETER top_p 0.7`
            },
            {
                id: 'import-analyzer-2', 
                type: 'import-analysis',
                specialization: 'Backup import analyzer',
                modelFile: `FROM codellama:7b
SYSTEM Tu es un analyste de dépendances. Analyse les imports et fournis un JSON structuré sur leur usage et impact.
PARAMETER temperature 0.1`
            },
            {
                id: 'content-analyzer-1',
                type: 'content-analysis',
                specialization: 'Analyse du contenu et logique métier',
                modelFile: `FROM codellama:7b
SYSTEM Tu es un expert en analyse de code et logique métier.
Analyse le code fourni et réponds en JSON avec:
{
  "mainPurpose": "objectif principal",
  "keyFunctions": ["func1", "func2"],
  "patterns": ["pattern1", "pattern2"],
  "complexity": 1-10,
  "businessLogic": "description de la logique métier",
  "codeQuality": 1-10,
  "improvements": ["amélioration1"]
}
PARAMETER temperature 0.3
PARAMETER top_p 0.9`
            },
            {
                id: 'structure-analyzer-1',
                type: 'structure-analysis', 
                specialization: 'Architecture et structure globale',
                modelFile: `FROM codellama:7b
SYSTEM Tu es un architecte logiciel expert.
Analyse la structure et l'architecture du code fourni. Réponds en JSON:
{
  "architecture": "type d'architecture détecté",
  "patterns": ["pattern1", "pattern2"],
  "organization": "comment le code est organisé",
  "coupling": 1-10,
  "cohesion": 1-10,
  "maintainability": 1-10,
  "recommendations": ["rec1", "rec2"]
}
PARAMETER temperature 0.2
PARAMETER top_p 0.8`
            },
            {
                id: 'synthesizer-1',
                type: 'synthesis',
                specialization: 'Synthèse et fusion des analyses',
                modelFile: `FROM codellama:7b
SYSTEM Tu es un expert en synthèse d'analyses techniques.
Tu reçois plusieurs analyses JSON et tu dois créer une synthèse cohérente et actionnable.
Fournis un résumé clair avec conclusions et recommandations prioritaires.
PARAMETER temperature 0.4`
            }
        ];
        
        for (const config of workerConfigs) {
            await this.createWorker(config.id, config);
        }
    }
    
    private async createWorker(id: string, config: any): Promise<void> {
        try {
            const service = new OllamaService();
            
            const worker: LLMWorker = {
                id,
                type: config.type,
                specialization: config.specialization,
                modelFile: config.modelFile,
                isAvailable: true,
                service,
                completedTasks: 0,
                averageTime: 0
            };
            
            this.workers.set(id, worker);
            console.log(`✅ Worker créé: ${id} (${config.specialization})`);
            
        } catch (error) {
            console.error(`❌ Erreur création worker ${id}:`, error);
            throw error;
        }
    }
    
    private async validateWorkers(): Promise<void> {
        console.log('🔍 Validation des workers...');
        
        for (const [id, worker] of this.workers) {
            try {
                // Test simple de connexion
                const testResult = await worker.service.testConnection();
                if (!testResult) {
                    throw new Error(`Worker ${id} non fonctionnel`);
                }
                console.log(`✅ Worker ${id} validé`);
            } catch (error) {
                console.error(`❌ Worker ${id} invalide:`, error);
                this.workers.delete(id);
            }
        }
        
        if (this.workers.size === 0) {
            throw new Error('Aucun worker fonctionnel');
        }
        
        console.log(`✅ ${this.workers.size} workers validés`);
    }
    
    async analyzeInParallel(
        fileContent: string, 
        imports: ImportInfo[],
        fileName: string
    ): Promise<ParallelAnalysisResult> {
        if (!this.isInitialized) {
            await this.initialize();
        }
        
        const startTime = Date.now();
        console.log(`🔄 Démarrage analyse parallèle pour ${fileName}...`);
        
        // Créer les tâches parallèles
        const tasks = this.createParallelTasks(fileContent, imports, fileName);
        
        // Exécuter toutes les tâches en parallèle
        const results = await this.executeTasks(tasks);
        
        // Synthétiser les résultats
        const synthesis = await this.synthesizeResults(results);
        
        const totalTime = Date.now() - startTime;
        
        console.log(`✅ Analyse parallèle terminée en ${totalTime}ms`);
        
        return {
            mainContent: results.get('main-content'),
            globalStructure: results.get('global-structure'), 
            importAnalyses: this.getImportResults(results),
            dependencyTree: results.get('dependency-tree'),
            synthesis,
            performance: {
                totalTime,
                parallelTasks: tasks.length,
                efficiency: this.calculateEfficiency(tasks, totalTime)
            }
        };
    }
    
    private createParallelTasks(
        fileContent: string, 
        imports: ImportInfo[], 
        fileName: string
    ): LLMTask[] {
        const tasks: LLMTask[] = [];
        
        // Tâche 1: Analyse du contenu principal (priorité haute)
        tasks.push({
            id: 'main-content',
            type: 'content-analysis',
            input: {
                content: fileContent,
                fileName,
                context: 'main-file-analysis'
            },
            status: 'pending',
            priority: 10
        });
        
        // Tâche 2: Analyse de la structure globale (priorité haute)
        tasks.push({
            id: 'global-structure',
            type: 'structure-analysis', 
            input: {
                content: fileContent,
                imports: imports.map(imp => imp.source),
                fileName,
                linesOfCode: fileContent.split('\n').length
            },
            status: 'pending',
            priority: 9
        });
        
        // Tâches 3-N: Une tâche par import (priorité moyenne)
        imports.forEach((imp, index) => {
            tasks.push({
                id: `import-${index}`,
                type: 'import-analysis',
                input: {
                    importSource: imp.source,
                    importType: imp.type,
                    importNames: imp.imports,
                    relevantCode: imp.relevantCode || '',
                    dependencies: imp.dependencies || []
                },
                status: 'pending',
                priority: 5
            });
        });
        
        // Tâche finale: Arbre de dépendances (priorité basse)
        if (imports.length > 0) {
            tasks.push({
                id: 'dependency-tree',
                type: 'structure-analysis',
                input: {
                    imports,
                    mainFile: fileName,
                    task: 'dependency-tree-analysis'
                },
                status: 'pending', 
                priority: 3
            });
        }
        
        return tasks.sort((a, b) => b.priority - a.priority);
    }
    
    private async executeTasks(tasks: LLMTask[]): Promise<Map<string, any>> {
        const results = new Map<string, any>();
        const runningTasks: Promise<void>[] = [];
        
        console.log(`🚀 Exécution de ${tasks.length} tâches en parallèle...`);
        
        // Grouper les tâches par type pour optimiser l'allocation
        const tasksByType = new Map<string, LLMTask[]>();
        tasks.forEach(task => {
            if (!tasksByType.has(task.type)) {
                tasksByType.set(task.type, []);
            }
            tasksByType.get(task.type)!.push(task);
        });
        
        // Exécuter les tâches par type en parallèle
        for (const [type, typeTasks] of tasksByType) {
            const availableWorkers = Array.from(this.workers.values())
                .filter(w => w.type === type && w.isAvailable);
            
            if (availableWorkers.length === 0) {
                console.warn(`⚠️ Aucun worker disponible pour ${type}`);
                continue;
            }
            
            // Distribuer les tâches aux workers disponibles
            for (let i = 0; i < typeTasks.length; i++) {
                const task = typeTasks[i];
                const worker = availableWorkers[i % availableWorkers.length];
                
                const taskPromise = this.executeTask(task, worker)
                    .then(result => {
                        results.set(task.id, result);
                        console.log(`✅ Tâche ${task.id} terminée`);
                    })
                    .catch(error => {
                        console.error(`❌ Erreur tâche ${task.id}:`, error);
                        results.set(task.id, { error: error.message });
                    });
                
                runningTasks.push(taskPromise);
            }
        }
        
        // Attendre que toutes les tâches se terminent
        await Promise.all(runningTasks);
        
        console.log(`✅ ${results.size} tâches terminées`);
        return results;
    }
    
    private async executeTask(task: LLMTask, worker: LLMWorker): Promise<any> {
        worker.isAvailable = false;
        worker.currentTask = task.id;
        task.status = 'processing';
        task.llmInstance = worker.id;
        task.startTime = Date.now();
        
        try {
            let prompt = this.generatePromptForTask(task);
            
            console.log(`🔄 ${worker.id} traite ${task.id}...`);
            
            const result = await worker.service.chat(prompt, []);
            
            task.status = 'completed';
            task.endTime = Date.now();
            task.result = result;
            
            // Mettre à jour les statistiques du worker
            worker.completedTasks++;
            const taskTime = task.endTime - task.startTime!;
            worker.averageTime = (worker.averageTime * (worker.completedTasks - 1) + taskTime) / worker.completedTasks;
            
            return this.parseTaskResult(result, task.type);
            
        } catch (error) {
            task.status = 'failed';
            task.endTime = Date.now();
            throw error;
        } finally {
            worker.isAvailable = true;
            worker.currentTask = undefined;
        }
    }
    
    private generatePromptForTask(task: LLMTask): string {
        switch (task.type) {
            case 'import-analysis':
                return `Analyse cet import en détail:
Source: ${task.input.importSource}
Type: ${task.input.importType}  
Noms importés: ${task.input.importNames.join(', ')}

Code associé:
\`\`\`
${task.input.relevantCode}
\`\`\`

Réponds en JSON selon le format défini.`;

            case 'content-analysis':
                return `Analyse ce code source en détail:

Fichier: ${task.input.fileName}
Contenu:
\`\`\`
${task.input.content}
\`\`\`

Réponds en JSON selon le format défini.`;

            case 'structure-analysis':
                if (task.input.task === 'dependency-tree-analysis') {
                    return `Analyse l'arbre de dépendances de ce projet:
Fichier principal: ${task.input.mainFile}
Imports: ${task.input.imports.map((imp: any) => imp.source).join(', ')}

Créé un arbre de dépendances et analyse l'architecture globale.`;
                }
                
                return `Analyse la structure et l'architecture de ce code:
Fichier: ${task.input.fileName}
Nombre d'imports: ${task.input.imports.length}
Lignes de code: ${task.input.linesOfCode}

Code:
\`\`\`
${task.input.content}
\`\`\`

Réponds en JSON selon le format défini.`;

            default:
                return `Analyse: ${JSON.stringify(task.input)}`;
        }
    }
    
    private parseTaskResult(result: string, taskType: string): any {
        try {
            // Essayer de parser en JSON
            const jsonMatch = result.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                return JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            console.warn(`⚠️ Impossible de parser en JSON pour ${taskType}`);
        }
        
        // Retourner le résultat brut si le parsing JSON échoue
        return { rawResult: result, taskType };
    }
    
    private async synthesizeResults(results: Map<string, any>): Promise<string> {
        const synthesisWorker = Array.from(this.workers.values())
            .find(w => w.type === 'synthesis' && w.isAvailable);
        
        if (!synthesisWorker) {
            return this.createBasicSynthesis(results);
        }
        
        const synthesisPrompt = `Synthétise ces analyses en une conclusion cohérente et actionnable:

Analyse du contenu principal:
${JSON.stringify(results.get('main-content'), null, 2)}

Analyse de la structure:
${JSON.stringify(results.get('global-structure'), null, 2)}

Analyses des imports (${this.getImportResults(results).length} imports analysés):
${JSON.stringify(this.getImportResults(results), null, 2)}

Fournis une synthèse claire avec:
1. Vue d'ensemble du code
2. Points forts et problèmes identifiés
3. Recommandations prioritaires
4. Conclusion sur la qualité globale`;

        try {
            const synthesis = await synthesisWorker.service.chat(synthesisPrompt, []);
            return synthesis;
        } catch (error) {
            console.error('❌ Erreur synthèse:', error);
            return this.createBasicSynthesis(results);
        }
    }
    
    private createBasicSynthesis(results: Map<string, any>): string {
        let synthesis = "## Synthèse de l'analyse parallèle\n\n";
        
        const mainContent = results.get('main-content');
        if (mainContent) {
            synthesis += `**Contenu principal:** ${JSON.stringify(mainContent, null, 2)}\n\n`;
        }
        
        const structure = results.get('global-structure');
        if (structure) {
            synthesis += `**Structure:** ${JSON.stringify(structure, null, 2)}\n\n`;
        }
        
        const importResults = this.getImportResults(results);
        if (importResults.length > 0) {
            synthesis += `**Imports analysés:** ${importResults.length} imports traités en parallèle\n\n`;
        }
        
        return synthesis;
    }
    
    private getImportResults(results: Map<string, any>): any[] {
        const importResults: any[] = [];
        for (const [key, value] of results) {
            if (key.startsWith('import-')) {
                importResults.push(value);
            }
        }
        return importResults;
    }
    
    private calculateEfficiency(tasks: LLMTask[], totalTime: number): number {
        const sequentialTime = tasks.reduce((sum, task) => {
            return sum + (task.endTime && task.startTime ? task.endTime - task.startTime : 0);
        }, 0);
        
        return sequentialTime > 0 ? (sequentialTime / totalTime) : 1;
    }
    
    getWorkerStats(): any {
        const stats = Array.from(this.workers.values()).map(worker => ({
            id: worker.id,
            specialization: worker.specialization,
            isAvailable: worker.isAvailable,
            completedTasks: worker.completedTasks,
            averageTime: Math.round(worker.averageTime),
            currentTask: worker.currentTask
        }));
        
        return {
            totalWorkers: this.workers.size,
            availableWorkers: stats.filter(s => s.isAvailable).length,
            workers: stats
        };
    }
}
